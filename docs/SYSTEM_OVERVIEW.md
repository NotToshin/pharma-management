# System Overview

Internal pharmaceutical ERP: warehouse stock, doctors and field force, pharmacy sales, procurement, treasury, payroll, RBAC, and an audit trail. No public storefront and no payment gateway.

Detail lives in [FRONTEND_GUIDELINES.md](./FRONTEND_GUIDELINES.md), [BACKEND_ARCHITECTURE.md](./BACKEND_ARCHITECTURE.md), [AUTHENTICATION.md](./AUTHENTICATION.md), and [UI_UX_GUIDELINES.md](./UI_UX_GUIDELINES.md).

## Stack

| Area | Implemented |
|---|---|
| Frontend | Next.js 16.3 App Router, React 19, TypeScript, Tailwind CSS v4, shadcn (`radix-nova`), Sonner, Recharts |
| Backend | Express 4, TypeScript, `tsx` in development |
| Data | Prisma 5, **MongoDB** (`backend/prisma/schema.prisma`) |
| Auth | JWT access and refresh tokens, bcrypt. See [AUTHENTICATION.md](./AUTHENTICATION.md) |
| Validation | Zod 4 |
| Spreadsheets | `xlsx` in the browser |

The root README says PostgreSQL. The Prisma datasource is MongoDB. `@supabase/supabase-js` and `@supabase/ssr` are unused dependencies.

UI `http://localhost:3000`. API `http://localhost:5000/api`. Pages call Express through `frontend/lib/api.ts`. There are no Next.js Route Handlers for the API.

`getApiUrl()` reads `NEXT_PUBLIC_API_URL`, falls back to `http://localhost:5000/api`, and always ends with `/api`. `apiFetch` sends the bearer token, cookies, and `x-user-*` headers, and refreshes on 401. Login uses plain `fetch` to `POST /api/auth/login`.

Business JSON from `sendResponse`: `{ success, statusCode, message, data, meta }`. `GET /health` and `GET /api/health` return `{ status, service, uptimeSeconds, timestamp }` instead.

## Data

IDs are MongoDB ObjectIds. Embedded types, not collections: `OrderItem`, `PurchaseOrderItem`, `ExpenseVoucherLineItem`, `SettlementAllocation`, `AdvanceDraw`. Money is `Float` BDT. Many business dates are strings (`orderDate`, `visitDate`, `expiryDate`).

| Area | Models |
|---|---|
| Clinical | `Doctor`, `DoctorVisitLog` |
| Field force | `Territory`, `MioZoneAllocation`, `TerritoryTarget` |
| Sales | `Client`, `Order` |
| Procurement | `Wholesaler`, `PurchaseOrder` |
| Warehouse | `Product`, `ProductBatch`, `InventoryBatch`, `StockAdjustment` |
| Treasury | `FinancialAccount`, `JournalTransaction`, `TreasuryDeposit`, `DeliveryCollection`, `ExpenseVoucher`, `PartySettlement` |
| HR | `Staff`, `Role`, `Salary` |
| Security | `SystemUser`, `SystemRole`, `RolePermission`, `AuditLog` |

`SystemRole` is login security. HR `Role` is a job title on `Staff`. They are not the same, and a staff row is not a login.

`Client` and `Order` have no foreign key. Orders store `pharmacyName`. Collections store `orderId` and `invoiceNo` as strings. `Product` has many batches. `FinancialAccount` has debit and credit journal rows. `AuditLog` optionally points at `SystemUser`.

## Modules

Names come from `backend/src/constants/moduleCatalog.ts`. The sidebar is `frontend/components/app-sidebar.tsx`.

| Group | Routes |
|---|---|
| Overview & Analytics | `/dashboard`, `/analytics/targets`, `/analytics/territories`, `/field-force/zones` |
| Doctor Management | `/doctors/database`, `/field-force/visit-logs` |
| Inventory & Warehouse | `/inventory/ledger`, `/inventory/adjustments` |
| Sales & Deliveries | `/logistics/orders`, `/sales/clients` |
| Finance & Treasury | `/finance/overview`, `/finance/bank-ledger`, `/finance/collections`, `/finance/supplier-payments`, `/procurement/orders`, `/finance/payments` |
| HR & System Control | `/hr/staff-directory`, `/hr/salary`, `/settings/rbac`, `/settings/audit-logs` |

`/doctors/timeline` and `/field-force/approvals` exist and are not in the sidebar or `ROUTE_FEATURES`, so any signed-in user can open them.

`RolePermission` stores `read`, `create`, `edit`, `delete`, optional `specialAction` / `specialGranted`, and `overviewGrants` for summary cards. Seed creates `SystemRole` code `SUPERADMIN`. Who passes checks, and which routes call `requireAuth`, is in [AUTHENTICATION.md](./AUTHENTICATION.md). Only RBAC user and role routes require a token. Other business routes do not.

## Workflows

- **Doctors.** Unique `bmdcRegNumber`. Create via `POST /api/doctors`. Excel import is parsed in the browser and posted as JSON to `/api/doctors/bulk-import`. No multipart upload.
- **Visit logs.** `DoctorVisitLog` stores names and territory as strings. No foreign key to `Doctor` or `Staff`.
- **Sales.** `orderService` numbers orders `SO-2026-####` and challans `DC-2026-####` inside a transaction. Default status `FEFO Allocated`. `Delivered & Invoiced` and `Cancelled` adjust stock. `paymentStatus` is `UNPAID`, `PARTIALLY_PAID`, or `PAID` from `paidAmount` versus `orderValue`. Orders match clients by name.
- **Collections.** `DeliveryCollection` records Cash, Cheque, BEFTN / RTGS, or bKash / Nagad. Clearance can post a `FinancialAccount` journal.
- **Procurement.** `PurchaseOrder` statuses: `Draft`, `Submitted`, `Approved`, `Partially Received`, `Received`, `Cancelled`. Receipt creates `Product`, `ProductBatch`, and `InventoryBatch` in one transaction. `productBatchService` mirrors batch quantity.
- **FEFO.** `calculateFefoMeta` in `inventoryService.ts`: ≤0 Expired, 1–60 Near Expiry, 61–180 Priority Out, otherwise Healthy. A bin containing `quarantine`, `[QUARANTINE]`, or starting with `Q-` is quarantined.
- **Stock adjustments.** Write-off, quarantine transfer, count discrepancy, or inward correction. SKU and batch are strings.
- **Treasury.** `FinancialAccount.category` is `BANK` or `CASH`. `JournalTransaction.flowType` is `INFLOW`, `OUTFLOW`, `TRANSFER`, or `LOAN`. Balance changes run inside `prisma.$transaction` in the ledger, collection, payment, and settlement services. `ExpenseVoucher` is the payments screen (TDS/VDS, line items). `PartySettlement` allocates incoming or outgoing payments. `TreasuryDeposit` is a cash or bank drop. No bank API.
- **Payroll.** `Salary` is unique per `staffId` and `payPeriod`. `PaymentStatus` is `PENDING`, `PAID`, or `PROCESSING`. Wages are not sent to a bank.
- **Audit.** `auditLogService.recordAuditEvent` stores actor, payloads, `sha256Hash`, and `previousHash`. Signature fields `signerName` and `signatureMeaning` are stored. There is no separate signing ceremony. Services write the log. A controller-only change does not.

List screens that page should request `page`, `limit`, search, sort, and filters and render `meta`. Audit Logs and the RBAC operator table use `frontend/components/server-list-controls.tsx`. Older screens still filter in the browser.

Excel import and export stay in the browser. Avatars are data URLs in `localStorage` key `ak_user`. Tender labels (Cash, Cheque, BEFTN / RTGS, Pay Order, bKash / Nagad) are recorded types, not a gateway.

## Environment

Names only. Do not copy values.

| Variable | Required | Role |
|---|---|---|
| `DATABASE_URL` | Yes | MongoDB |
| `JWT_SECRET` | Yes | Loaded at startup. Signing uses the two secrets below |
| `JWT_ACCESS_SECRET` | Yes | Access token |
| `JWT_REFRESH_SECRET` | Yes | Refresh token |
| `JWT_ACCESS_EXPIRES_IN` | No | Default `15m` |
| `JWT_REFRESH_EXPIRES_IN` | No | Default `7d` |
| `SALT_ROUNDS` | No | bcrypt cost, default `12` |
| `PORT` | No | Default `5000` |
| `NODE_ENV` | No | `production` sets auth cookies `Secure` and `SameSite=None` |
| `NEXT_PUBLIC_API_URL` | No | Frontend API base. Code appends `/api` if missing |

Missing required backend variables throw before listen. Config is `backend/src/config/index.ts`.

## Run and deploy

Node.js 20+ and MongoDB. From `backend`: `npm install`, `npx prisma generate`, `npx prisma db push`, `npm run seed`, `npm run dev`. From `frontend`: `npm install`, `npm run dev`. Schema sync is `db push`, not SQL migrations. Seed credentials stay in `backend/prisma/seed.ts` and the root README.

`npm run typecheck` is the real TypeScript check. `frontend/next.config.ts` sets `typescript.ignoreBuildErrors: true`. Backend production is `tsc` then `node dist/server.js`. The API on Vercel enters through `backend/api/index.ts` and `backend/vercel.json`. CORS reflects any origin and allows credentials. No frontend hosting project or CI workflow is defined in this repo.

## Change these together

- Order stock updates and client names are not foreign keys.
- Collection, voucher, ledger, and settlement amount changes must stay inside the existing transactions.
- A new permission module must be added to `ALL_SYSTEM_MODULES` and `frontend/lib/permissions.ts` `ROUTE_FEATURES` with the same string.
- Do not merge `SystemRole` and HR `Role`.
