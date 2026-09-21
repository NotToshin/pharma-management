# AK PHARMA ERP — Backend Engineering Specification & Architecture Guide

---

## 1. System Architecture Overview

The backend services powering the AK PHARMA enterprise dashboard must support real-time inventory management, financial ledgers, clinical registries, and statutory compliance.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              Next.js Frontend                                │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │ HTTPS / WSS
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                    API Gateway / Reverse Proxy (Nginx)                       │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │
           ┌───────────────────────────┼───────────────────────────┐
           ▼                           ▼                           ▼
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│  Core ERP Service   │     │  Inventory & FEFO   │     │  Treasury & Payroll │
│  (Node.js/FastAPI)  │     │       Service       │     │       Service       │
└──────────┬──────────┘     └──────────┬──────────┘     └──────────┬──────────┘
           │                           │                           │
           └───────────────────────────┼───────────────────────────┘
                                       │
                                       ▼
        ┌─────────────────────────────────────────────────────────────┐
        │                 PostgreSQL 16 + Prisma ORM                  │
        │    - Relational Schemas     - Row-Level Locking (Pessimistic│
        │    - Append-only Audit      - JSONB State Payloads          │
        └──────────────────────────────┬──────────────────────────────┘
                                       │
                                       ▼
        ┌─────────────────────────────────────────────────────────────┐
        │                     Redis Cache & Queue                     │
        │    - Active Sessions        - Event Sourcing Worker         │
        │    - Idempotency Keys       - Real-time Notifications       │
        └─────────────────────────────────────────────────────────────┘

```

### Core Architecture Principles

1. **Pessimistic Concurrency & Transactional Isolation**: Inventory batch allocation and bank balance transactions require strict database-level transactions (`SELECT ... FOR UPDATE`) to prevent negative inventory allocations or double-drawdowns.
2. **Statutory 21 CFR Part 11 Audit Integrity**: Audit trail tables are append-only. Hard deletions (`DELETE FROM ...`) are prohibited across operational tables; records must use soft deletions (`deleted_at`) with audited event emissions.
3. **Dual-Approval Governance (Maker-Checker Engine)**: Financial payment disbursements, employee appointments, and batch quarantine overrides require two distinct authenticated actors: `initiated_by` (Maker) and `authorized_by` (Checker).

---

## 2. Master Relational Database Schema (Prisma / PostgreSQL)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// -------------------------------------------------------------
// 1. IDENTITY & GOVERNANCE (RBAC & 21 CFR AUDIT)
// -------------------------------------------------------------

enum UserRole {
  SUPER_ADMIN
  RSM_EXEC
  MIO_FIELD
  FIN_CONTROLLER
  WH_LOGISTICS
  QA_INSPECTOR
}

enum AuditSeverity {
  CRITICAL
  SECURITY_WARNING
  STATUTORY_NOTICE
  ROUTINE
}

model User {
  id              String         @id @default(uuid())
  email           String         @unique
  passwordHash    String
  fullName        String
  role            UserRole       @default(MIO_FIELD)
  territoryHub    String
  isActive        Boolean        @default(true)
  twoFactorSecret String?
  lastLoginAt     DateTime?
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  employeeRecord  Employee?
  assignedClients Client[]
  makerVouchers   PaymentVoucher[] @relation("VoucherMaker")
  checkerVouchers PaymentVoucher[] @relation("VoucherChecker")
  ordersPlaced    SalesOrder[]     @relation("MIOOrders")
  auditActions    AuditLog[]

  @@index([role, territoryHub])
}

model AuditLog {
  id              BigInt        @id @default(autoincrement())
  auditRef        String        @unique // e.g. AUD-2026-90412
  timestamp       DateTime      @default(now())
  actorId         String
  actor           User          @relation(fields: [actorId], references: [id])
  actorIp         String
  moduleScope     String        // FEFO Warehouse, Finance & Accounts, etc.
  actionType      String        // Batch Quarantined, Appointment Issued, etc.
  severity        AuditSeverity @default(ROUTINE)
  targetEntity    String        // e.g. BX-2025-119
  changeSummary   String        @db.Text
  priorPayload    Json?         // Exact JSON snapshot prior to mutation
  newPayload      Json?         // Exact JSON snapshot after mutation
  sha256Signature String        // SHA-256 hash of (timestamp + actorId + payload + prior_hash)

  @@index([timestamp(sort: Desc)])
  @@index([targetEntity])
}

// -------------------------------------------------------------
// 2. PHARMACY CLIENTS & COMMERCIAL ORDERS
// -------------------------------------------------------------

enum ClientStatus {
  ACTIVE_HEALTHY
  WATCHLIST
  CREDIT_HOLD
}

model Client {
  id                     String         @id @default(uuid())
  clientCode             String         @unique // e.g. AKP-CL-101
  pharmacyName           String
  proprietor             String
  phone                  String
  drugLicenseNo          String
  tradeLicenseNo         String?
  address                String
  territory              String
  creditLimitBDT         Decimal        @db.Decimal(12, 2)
  outstandingBalanceBDT  Decimal        @default(0) @db.Decimal(12, 2)
  creditTermDays         Int            @default(30)
  status                 ClientStatus   @default(ACTIVE_HEALTHY)
  lastBilledDate         DateTime?
  createdAt              DateTime       @default(now())
  updatedAt              DateTime       @updatedAt

  assignedMioId          String
  assignedMio            User           @relation(fields: [assignedMioId], references: [id])
  orders                 SalesOrder[]
  invoices               SalesInvoice[]

  @@index([territory, status])
}

enum OrderStatus {
  PENDING_CREDIT_CHECK
  FEFO_ALLOCATED
  OUT_FOR_DELIVERY
  DELIVERED_INVOICED
  CANCELLED
}

enum FleetChannel {
  COMPANY_VAN_AMBIENT
  COMPANY_VAN_COLD_CHAIN
  COURIER_DISPATCH
}

model SalesOrder {
  id             String         @id @default(uuid())
  orderNumber    String         @unique // e.g. SO-2026-4401
  orderDate      DateTime       @default(now())
  clientId       String
  client         Client         @relation(fields: [clientId], references: [id])
  territory      String
  mioId          String
  mio            User           @relation("MIOOrders", fields: [mioId], references: [id])
  itemsSummary   String
  totalBoxes     Int
  orderValueBDT  Decimal        @db.Decimal(12, 2)
  deliveryMethod FleetChannel   @default(COMPANY_VAN_AMBIENT)
  status         OrderStatus    @default(FEFO_ALLOCATED)
  challanNumber  String?        @unique // e.g. DC-2026-1082
  
  invoice        SalesInvoice?
  allocations    OrderItemAllocation[]

  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  @@index([status, territory])
}

// -------------------------------------------------------------
// 3. INVENTORY & FEFO BATCH CONTROL
// -------------------------------------------------------------

enum StockLocationType {
  STANDARD_BAY
  COLD_ROOM_A
  QUARANTINE_Q01
}

model Batch {
  id              String             @id @default(uuid())
  batchNumber     String             @unique // e.g. BX-2025-412
  skuCode         String             // e.g. SKU-CF-200
  formulationName String             // e.g. Ciprocin 500mg
  mfgDate         DateTime
  expiryDate      DateTime
  availableUnits  Int
  quarantinedUnits Int               @default(0)
  unitCostBDT     Decimal            @db.Decimal(8, 2)
  location        StockLocationType  @default(STANDARD_BAY)
  isLocked        Boolean            @default(false)
  
  orderAllocations OrderItemAllocation[]

  @@index([expiryDate(sort: Asc)])
  @@index([skuCode, location])
}

model OrderItemAllocation {
  id           String      @id @default(uuid())
  salesOrderId String
  salesOrder   SalesOrder  @relation(fields: [salesOrderId], references: [id])
  batchId      String
  batch        Batch       @relation(fields: [batchId], references: [id])
  allocatedQty Int

  @@unique([salesOrderId, batchId])
}

// -------------------------------------------------------------
// 4. TREASURY, A/P VOUCHERS & A/R INVOICES
// -------------------------------------------------------------

enum VoucherStage {
  SETTLED_DISBURSED
  AWAITING_MD_SIGNOFF
  SCHEDULED_CLEARING
  COMPLIANCE_HOLD
}

model TreasuryAccount {
  id                  String           @id @default(uuid())
  name                String           // e.g. Eastern Bank PLC
  accountNo           String           @unique
  branch              String
  balanceBDT          Decimal          @db.Decimal(14, 2)
  utilizationLimitBDT Decimal          @db.Decimal(14, 2)
  type                String
  vouchers            PaymentVoucher[]
}

model PaymentVoucher {
  id                 String           @id @default(uuid())
  voucherNo          String           @unique // e.g. AKP-PV-2026-0901
  shaChecksum        String
  payeeName          String
  vendorTin          String?
  category           String
  treasuryAccountId  String
  treasuryAccount    TreasuryAccount  @relation(fields: [treasuryAccountId], references: [id])
  invoiceRef         String
  poRef              String?
  grossAmountBDT     Decimal          @db.Decimal(12, 2)
  tdsRate            Decimal          @default(0) @db.Decimal(4, 2)
  vdsRate            Decimal          @default(0) @db.Decimal(4, 2)
  netAmountBDT       Decimal          @db.Decimal(12, 2)
  paymentMethod      String
  instrumentRef      String?
  executionDate      DateTime
  stage              VoucherStage     @default(AWAITING_MD_SIGNOFF)
  narration          String           @db.Text
  
  makerId            String
  maker              User             @relation("VoucherMaker", fields: [makerId], references: [id])
  checkerId          String?
  checker            User?            @relation("VoucherChecker", fields: [checkerId], references: [id])

  createdAt          DateTime         @default(now())
  updatedAt          DateTime         @updatedAt

  @@index([stage, executionDate])
}

model SalesInvoice {
  id             String      @id @default(uuid())
  invoiceNumber  String      @unique // e.g. INV-2026-9011
  salesOrderId   String?     @unique
  salesOrder     SalesOrder? @relation(fields: [salesOrderId], references: [id])
  clientId       String
  client         Client      @relation(fields: [clientId], references: [id])
  invoiceAmount  Decimal     @db.Decimal(12, 2)
  paidAmount     Decimal     @default(0) @db.Decimal(12, 2)
  dueAmount      Decimal     @db.Decimal(12, 2)
  invoiceDate    DateTime    @default(now())
  dueDate        DateTime
  status         String      // Paid, Unpaid, Partially Paid

  collections    CollectionReceipt[]
}

model CollectionReceipt {
  id             String       @id @default(uuid())
  receiptNo      String       @unique
  invoiceId      String
  invoice        SalesInvoice @relation(fields: [invoiceId], references: [id])
  amountCollected Decimal     @db.Decimal(12, 2)
  collectedAt    DateTime     @default(now())
  paymentChannel String       // Cash, Cheque, EFT
}

// -------------------------------------------------------------
// 5. HUMAN RESOURCES & STATUTORY APPOINTMENTS
// -------------------------------------------------------------

enum EmploymentStatus {
  PROBATIONARY
  PERMANENT
  CONTRACT
  SUSPENDED
}

model Employee {
  id                    String           @id @default(uuid())
  empId                 String           @unique // e.g. AKP-25001
  userId                String?          @unique
  user                  User?            @relation(fields: [userId], references: [id])
  fullName              String
  phone                 String
  email                 String
  fathersName           String
  mothersName           String
  address               String
  nidNumber             String           @unique
  designation           String
  department            String
  territory             String
  startDate             DateTime
  employmentStatus      EmploymentStatus @default(PROBATIONARY)
  supervisorName        String
  workSchedule          String
  emergencyName         String
  emergencyRelationship String
  emergencyPhone        String

  salaryStructure       SalaryStructure?

  createdAt             DateTime         @default(now())
  updatedAt             DateTime         @updatedAt
}

model SalaryStructure {
  id               String    @id @default(uuid())
  employeeId       String    @unique
  employee         Employee  @relation(fields: [employeeId], references: [id])
  basicSalary      Decimal   @db.Decimal(10, 2)
  houseRent        Decimal   @db.Decimal(10, 2)
  medicalAllowance Decimal   @db.Decimal(10, 2)
  mobileBill       Decimal   @db.Decimal(10, 2)
  conveyanceTaDa   Decimal   @default(0) @db.Decimal(10, 2)
  salesIncentive   Decimal   @default(0) @db.Decimal(10, 2)
  providentFund    Decimal   @default(0) @db.Decimal(10, 2)
  taxWithheld      Decimal   @default(0) @db.Decimal(10, 2)
  grossSalary      Decimal   @db.Decimal(10, 2)
  netPayable       Decimal   @db.Decimal(10, 2)
  bankName         String
  bankAccountNo    String
}

```

---

## 3. End-to-End Business Logic & Workflows

### 3.1. Client Order Creation & Credit Enforcement Workflow

When `POST /api/v1/logistics/orders` is called:

```
[Incoming Order Request]
          │
          ▼
Is Client Status == "CREDIT_HOLD"?
  ├─► YES: Set Order Status = "PENDING_CREDIT_CHECK"
  └─► NO:
       Compute Project Total = (Current Outstanding A/R + Order Value)
       Does Project Total > Client Credit Limit?
         ├─► YES: Set Order Status = "PENDING_CREDIT_CHECK"
         └─► NO:  Execute FEFO Batch Allocation

```

```typescript
// Backend Algorithm: FEFO Batch Auto-Picker
async function allocateFEFOBatches(tx: PrismaTransaction, skuCode: string, requestedUnits: number) {
  // 1. Fetch active batches sorted by Expiry Date ascending (FEFO)
  // Must lock selected rows to prevent concurrent overselling
  const batches = await tx.$queryRaw<Batch[]>`
    SELECT * FROM "Batch"
    WHERE "skuCode" = ${skuCode}
      AND "location" != 'QUARANTINE_Q01'
      AND "isLocked" = FALSE
      AND "availableUnits" > 0
      AND "expiryDate" > NOW() + INTERVAL '30 days'
    ORDER BY "expiryDate" ASC
    FOR UPDATE;
  `;

  let remainingUnits = requestedUnits;
  const allocations: { batchId: string; qty: number }[] = [];

  for (const batch of batches) {
    if (remainingUnits <= 0) break;

    const allocatable = Math.min(batch.availableUnits, remainingUnits);
    allocations.push({ batchId: batch.id, qty: allocatable });

    // Decrement inventory
    await tx.batch.update({
      where: { id: batch.id },
      data: { availableUnits: batch.availableUnits - allocatable },
    });

    remainingUnits -= allocatable;
  }

  if (remainingUnits > 0) {
    throw new InsufficientStockError(`Insufficient FEFO stock for SKU ${skuCode}. Deficit: ${remainingUnits}`);
  }

  return allocations;
}

```

### 3.2. Order Delivery Confirmation & Auto-Invoicing

When `PATCH /api/v1/logistics/orders/:id/deliver` is executed:

1. Wrap inside a PostgreSQL transaction (`prisma.$transaction`).
2. Update `SalesOrder.status` to `DELIVERED_INVOICED`.
3. Auto-generate sequential `SalesInvoice` record (`INV-2026-XXXX`).
4. Increment `Client.outstandingBalanceBDT` by `orderValueBDT`.
5. Emit `AuditLog` entry detailing completed delivery and new receivable exposure.

### 3.3. Accounts Payable (A/P) Maker-Checker Release

When `POST /api/v1/finance/payments/:id/authorize` is called:

1. Check that `req.user.id !== voucher.makerId` (Separation of duties).
2. Check `TreasuryAccount.balanceBDT >= voucher.netAmountBDT`.
3. Decrement `TreasuryAccount.balanceBDT`.
4. Update `PaymentVoucher.stage` to `SETTLED_DISBURSED`.
5. Compute SHA-256 payload checksum and sign the audit ledger entry.

---

## 4. RESTful API Endpoints Matrix

All endpoints are prefixed with `/api/v1` and require `Authorization: Bearer <JWT>`.

| Method | Endpoint | Allowed Roles | Description |
| --- | --- | --- | --- |
| **POST** | `/auth/login` | Public | Authenticates user; returns JWT + refresh token. |
| **GET** | `/dashboard/executive-summary` | `SUPER_ADMIN`, `RSM_EXEC`, `FIN_CONTROLLER` | Returns metrics, run-rate, and therapeutic breakdown. |
| **GET** | `/sales/clients` | All Roles | Lists clients with credit limits, dues, and statuses. |
| **POST** | `/sales/clients` | `SUPER_ADMIN`, `RSM_EXEC` | Enrolls new pharmacy client with verified DGDA drug license. |
| **PUT** | `/sales/clients/:id` | `SUPER_ADMIN`, `FIN_CONTROLLER` | Updates pharmacy profile or adjusts credit limit. |
| **GET** | `/logistics/orders` | All Roles | Paginated order fulfillment pipeline with DC filters. |
| **POST** | `/logistics/orders` | `SUPER_ADMIN`, `MIO_FIELD`, `RSM_EXEC` | Creates sales order; runs credit limits and FEFO allocation. |
| **PATCH** | `/logistics/orders/:id/status` | `SUPER_ADMIN`, `WH_LOGISTICS` | Updates order state (`DELIVERED_INVOICED` triggers auto-invoice). |
| **GET** | `/finance/payments` | `SUPER_ADMIN`, `FIN_CONTROLLER` | Fetches payment vouchers and treasury account balances. |
| **POST** | `/finance/payments` | `FIN_CONTROLLER` | Creates disbursement voucher (Maker step). |
| **PUT** | `/finance/payments/:id` | `FIN_CONTROLLER` | Updates voucher draft particulars and tax withholdings. |
| **POST** | `/finance/payments/:id/authorize` | `SUPER_ADMIN` | Authorizes fund disbursement (Checker step). |
| **GET** | `/finance/collections` | `SUPER_ADMIN`, `FIN_CONTROLLER` | Lists A/R register and aging brackets. |
| **POST** | `/finance/collections` | `FIN_CONTROLLER`, `MIO_FIELD` | Records payment against invoice; updates client balance. |
| **GET** | `/hr/staff-directory` | All Roles | Lists personnel roster with statutory credentials. |
| **POST** | `/hr/staff-directory` | `SUPER_ADMIN` | Enrolls staff member with statutory records. |
| **GET** | `/hr/salary` | `SUPER_ADMIN`, `FIN_CONTROLLER` | Returns workforce compensation ledger. |
| **PUT** | `/hr/salary/:employeeId` | `SUPER_ADMIN` | Modifies basic pay, housing, medical, and incentives. |
| **GET** | `/settings/rbac` | `SUPER_ADMIN` | Fetches role matrix and user delegations. |
| **PUT** | `/settings/rbac/:roleCode` | `SUPER_ADMIN` | Updates permission flags for a role tier. |
| **GET** | `/settings/audit-logs` | `SUPER_ADMIN` | Queries immutable 21 CFR Part 11 audit journal. |

---

## 5. Implementation Roadmap & Development Sprints

### Sprint 1: Foundation, RBAC & Core Schemas (Days 1–5)

* [ ] Initialize PostgreSQL database and apply Prisma schema.
* [ ] Implement JWT authentication with refresh rotation and password hashing (bcrypt, salt rounds $\ge 12$).
* [ ] Create role-based authorization middleware: `requireRole([...UserRole])`.
* [ ] Implement the cryptographic Audit Log interceptor (`hashChain` generator).

### Sprint 2: Commercial Sales & FEFO Inventory Engine (Days 6–10)

* [ ] Build `/sales/clients` CRUD with credit limit validation checks.
* [ ] Develop `/logistics/orders` with transactional FEFO batch picker (`allocateFEFOBatches`).
* [ ] Implement status transitions: `Pending Review` $\rightarrow$ `Allocated` $\rightarrow$ `Dispatched` $\rightarrow$ `Delivered`.
* [ ] Connect order delivery trigger to auto-create `SalesInvoice` and increment client receivables.

### Sprint 3: Finance, Treasury & A/P Engine (Days 11–15)

* [ ] Build `/finance/payments` voucher management with automated TDS and VDS calculations.
* [ ] Implement Maker-Checker validation rules preventing self-approval.
* [ ] Integrate collection posting endpoints (`/finance/collections`) reducing invoice `dueAmount` and updating client dues.
* [ ] Set up Treasury Account balance mutation checks with strict negative balance constraints.

### Sprint 4: HR, Statutory Appointment & Analytics (Days 16–20)

* [ ] Build `/hr/staff-directory` with statutory data models.
* [ ] Connect `/hr/salary` dynamic compensation updater to recalculate gross and net take-home in real time.
* [ ] Construct aggregated executive summary metrics endpoint (`/dashboard/executive-summary`) using cached database queries (`revalidate: 60s`).
* [ ] Perform penetration testing, concurrent transaction lock testing, and deploy to staging.