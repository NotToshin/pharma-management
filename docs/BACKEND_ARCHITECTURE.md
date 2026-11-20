# Backend Architecture

Express API in `backend/`. System behavior is in [SYSTEM_OVERVIEW.md](./SYSTEM_OVERVIEW.md). Login, tokens, and role checks are in [AUTHENTICATION.md](./AUTHENTICATION.md).

```text
Client → Route → Middleware → Zod → Controller (catchAsync) → Service → Prisma → MongoDB → sendResponse
```

Zod and `requireAuth` are not on every route. This file says where each layer is applied.

## Layout

`npm run dev` is `tsx watch src/server.ts`. Production is `tsc` then `node dist/server.js`. Dependencies: Express, Prisma, Zod, `jsonwebtoken`, `bcryptjs`, `cookie-parser`, `cors`, `dotenv`. No Helmet, rate limiter, `multer`, or request logger.

```text
backend/src/server.ts          # listen, shutdown, unhandledRejection
backend/src/app.ts             # middleware and route mounts
backend/api/index.ts           # Vercel entry, restores __url
backend/src/config/index.ts    # required env, see SYSTEM_OVERVIEW
backend/src/routes|controllers|services|validations/
backend/src/middlewares/       # token.ts, requireAuth.ts, actorContextMiddleware.ts
backend/src/errors/
backend/src/utils/             # catchAsync, response, validate, prisma, pagination
backend/prisma/schema.prisma
```

`server.ts` handles `EADDRINUSE`, `SIGTERM`, `SIGINT`, and exits if shutdown exceeds 10 seconds. Missing `DATABASE_URL`, `JWT_SECRET`, `JWT_ACCESS_SECRET`, or `JWT_REFRESH_SECRET` throws before listen.

Middleware order in `app.ts`: CORS (reflects the request origin, credentials on, allows `Authorization` and `x-user-*`), `express.json()` with no size limit, `cookieParser`, `actorContextMiddleware`, then the Vercel URL normalizer (`__url`, `x-matched-path`, `x-forwarded-uri`). After routes: `notFoundHandler`, `globalErrorHandler`.

`actorContextMiddleware` fills the audit actor and never rejects the request. It may trust `x-user-email` when the token is missing. That is attribution, not authorization.

## Routes

Mounted in `app.ts`. Use the first path. Duplicate mounts keep old clients working. Do not add another alias without a caller.

| Mount | Router |
|---|---|
| `/api/auth` and `/auth` | `authRoutes.ts` |
| `/api/rbac` | `rbacRoutes.ts` |
| `/api/audit-logs` | `auditLogRoutes.ts` |
| `/api/territories` | `territoryRoutes.ts` |
| `/api/zone-allocations` | `zoneAllocationRoutes.ts` |
| `/api/targets` and `/api/territory-targets` | `territoryTargetRoutes.ts` |
| `/api/territory-analytics` and `/api/analytics/territories` | `territoryAnalyticsRoutes.ts` |
| `/api/stock-adjustments` | `stockAdjustmentRoutes.ts` |
| `/api/procurement/orders` and `/api/purchase-orders` | `purchaseOrderRoutes.ts` |
| `/api/wholesalers` | `wholesalerRoutes.ts` |
| `/api/clients` | `clientRoutes.ts` |
| `/api/orders` | `orderRoutes.ts` |
| `/api/treasury` | `treasuryRoutes.ts` |
| `/api/account-ledger` | `accountLedgerRoutes.ts` |
| `/api/inventory` | `inventoryRoutes.ts` |
| `/api/dashboard` | `dashboardRoutes.ts` |
| `/api/finance-overview` | `financeOverviewRoutes.ts` |
| `/api/doctors` | `doctorRoutes.ts` |
| `/api/visit-logs` and `/api/doctor-visit-logs` | `doctorVisitLogRoutes.ts` |
| `/api/staff` | `staffRoutes.ts` |
| `/api/roles` | `roleRoutes.ts` (HR `Role`, not `SystemRole`) |
| `/api/salary` | `salaryRoutes.ts` |
| `/api/payments` and `/api/expense-vouchers` | `paymentRoutes.ts` |
| `/api/settlements` | `settlementRoutes.ts` |
| `/api/collections`, `/api/delivery-collections`, `/api/finance/collections` | `collectionRoutes.ts` |

Paths are plural. Create is `POST /`. Update is usually `PUT /:id`. Status-style changes use `PATCH` (`/:id/status`, `/:id/invoice`, `/:id/approve`, `/:id/receive`). Register static paths such as `/bulk-import` before `/:id`. Ids are ObjectId strings.

List queries accept `page`, `limit`, `sortBy`, `sortOrder`, and `searchTerm`. Audit logs, purchase orders, account-ledger transactions, payment vouchers, and the finance overview also accept `search`. Targets (`/api/targets`) additionally accept `search`, `territory`, `status`, and `fiscalYear` filters; its computed `status`/`rate` fields are filtered and sorted after enrichment. Missing `limit` (or `all`/`-1`) returns every row for backward compatibility across these endpoints. Filter and sort in the service with an allowlisted `sortBy`. `meta` includes `total` and `totalPage` (audit logs and targets also send `totalPages`).

Doctor route shape:

```typescript
router.post("/bulk-import", validateBody(bulkImportDoctorSchema), bulkImportDoctors);
router.post("/", validateBody(createDoctorSchema), createDoctor);
router.put("/:id", validateParams(doctorIdParamSchema), validateBody(updateDoctorSchema), updateDoctor);
```

## Controllers and services

Controllers in `src/controllers/` do not import Prisma and do not use `try/catch`.

```typescript
export const createDoctor = catchAsync(async (req: Request, res: Response) => {
  const newDoctor = await doctorService.createDoctor(req.body);
  sendResponse(res, 201, "Doctor created successfully", newDoctor);
});
```

`catchAsync` (`src/utils/catchAsync.ts`) forwards rejections to `next`. Pass Zod-parsed `req.body`. List handlers `pick()` filter and pagination fields. `201` for creates. `200` for reads, updates, and deletes.

Services in `src/services/` own Prisma, document numbers, transactions, and audit writes. They do not take `req` or `res`. The audit actor comes from `requestContextStorage` (`src/utils/requestContext.ts`). Call `auditLogService` from the service after a mutation the module already audits. Do not add a second logger.

Territory assignments use `src/services/territoryAssignment.ts` to resolve IDs or legacy master names and persist the relation plus canonical label. The contracts and backfill workflow are documented below under Territory assignments.

`prisma.$transaction` is required when one action writes more than one collection: order create, cancel, and stock; purchase-order receipt; collection clearance; expense disbursement; ledger transfers; settlements. Pass `tx` into nested writes. Throw inside the callback so the whole action rolls back.

`src/utils/prisma.ts` reuses one `PrismaClient` outside production. Schema changes: `npx prisma db push` from `backend`, then `npx prisma generate`. MongoDB does not enforce every relation. Services throw `AppError` when a parent row is missing. Models are listed in [SYSTEM_OVERVIEW.md](./SYSTEM_OVERVIEW.md).

## Validation

Schemas are in `src/validations/`. Helpers in `src/utils/validate.ts`: `validate`, `validateBody`, `validateParams`, `validateQuery`. A failure calls `next(error)`. Do not `schema.parse` inside a controller. No Joi or Yup.

Body schemas are nested: `z.object({ body: doctorFormSchema })`. Keep that object aligned with `frontend/lib/validations/doctorValidation.ts`.

- Required strings: `z.string().min(1, "… is required")`.
- Email: `z.string().email("Invalid email format")` on login, doctors, and RBAC provisioning. Other contact fields are plain strings.
- Numbers: `z.coerce.number()`, often `.min(0)` and `.int()`.
- Optional blanks: `z.string().optional().or(z.literal(""))`.
- Closed sets: `z.enum([...])`.
- Passwords: login `min(1)`, provisioning `min(6)`.
- List queries coerce `page` and `limit`. `sortOrder` is `asc` or `desc`.

## Auth on routes

Token helpers and `requireAuth` / `requirePermission` behavior are in [AUTHENTICATION.md](./AUTHENTICATION.md). Applied today:

| Routes | Guard |
|---|---|
| `/api/rbac/roles` and `/api/rbac/users` | `requireAuth("SUPER_ADMIN")` |
| `/api/auth/*`, `/api/rbac/login` | Public. The service checks the password |
| `POST /api/territories` | `requireAuth()` plus create permission on `Territory Sales Breakdown` or `Target Vs Achievement` |
| `PUT /api/territories/:id`, `DELETE /api/territories/:id` | `requireAuth()` plus `Territory Sales Breakdown` edit or delete permission |
| `GET /api/collections/order-context/:orderId` | `requireAuth()` plus `requirePermission("Delivery Cash Collections", "read")` |
| `GET /api/account-ledger/accounts/:id` | `requireAuth()` plus `requirePermission("Bank Accounts Ledger", "read")` |
| `PATCH /api/orders/:id` | `requireAuth()` plus `requirePermission("Sales Orders", "edit")` |
| Other business routes | No `requireAuth` |

That gap is real. New routes that change users, money, or stock still call `requireAuth()`, and `requirePermission(moduleName, action)` when the module catalog has that name. `req.user` is typed in `src/types/express.d.ts`.

## Response

`sendResponse(res, statusCode, message, data?, meta?)` in `src/utils/response.ts`:

```json
{ "success": true, "statusCode": 200, "message": "Operation successful", "data": {}, "meta": {} }
```

`success` is true only for 200–299. Paginated `meta` from `src/utils/paginationHelper.ts`: `page`, `limit`, `total`, `totalPage`, `hasNextPage`, `hasPrevPage`. Default page size is 10. Default sort is `createdAt` descending. `limit` of 0 means no skip window. `GET /health` does not use `sendResponse`.

## Error handling rules

`globalErrorHandler` (`src/errors/globalErrorHandler.ts`) is mounted last. `catchAsync` and the Zod helpers forward errors to it.

| Piece | Result |
|---|---|
| `AppError` | `status` is `fail` for 4xx and `error` for 5xx. `isOperational` defaults to `true` |
| `handleZodError` | 400, `errors: [{ field, message }]`, message lists `field (message)` |
| `handlePrismaError` | P2002 → 400 duplicate, P2025 → 404, P2003/P2014/P2000/P2023 → 400, connection errors → 500 |
| `notFoundHandler` | 404 `Cannot find <url> on this server` |

```json
{ "success": false, "statusCode": 400, "status": "fail", "message": "Validation failed: body.email (Invalid email format)", "errors": [{ "field": "body.email", "message": "Invalid email format" }] }
```

`stack` is included only when `NODE_ENV` is `development`. A non-operational 500 outside development says `Something went wrong on the server`. The handler logs non-operational errors and any 5xx. The UI toasts `message` only.

1. Controllers do not catch errors and do not send failure JSON. `sendResponse` is for completed work.
2. Expected failures throw `new AppError("…", status)` from the service.
3. Status: Zod or duplicate unique field `400`, missing record `404`, bad or expired credentials `401` with the same message for unknown email and wrong password, restricted account or denied role `403`, unexpected failure `500`.
4. Do not invent a second error shape (`error`, `msg`, or a bare string).
5. Let Prisma errors reach `handlePrismaError` unless the service replaces one with a clearer `AppError`.
6. Do not put passwords, hashes, JWTs, or connection strings in messages or logs.
7. Do not add a catch-all route that returns `200`. Do not swallow a rejection with an empty `catch`. `unhandledRejection` in `server.ts` shuts the process down.

`loginOperator` still uses `sendResponse(res, 400, ...)` for a missing email or password. New handlers throw `AppError`. Auth 401 and 403 text is in [AUTHENTICATION.md](./AUTHENTICATION.md).

## Territory assignments

`Territory` is the master for territory names, divisions, and active status. `SystemUser`, `Doctor`, `DoctorVisitLog`, `Staff`, `Client`, `Order`, `DeliveryCollection`, `Wholesaler`, `MioZoneAllocation`, and `TerritoryTarget` have an indexed `territoryId` ObjectId and `territoryRef` relation. Deleting a referenced master is restricted. IDs remain nullable for legacy MongoDB documents and optional doctor/staff assignments; `territory` strings remain canonical labels for existing lists, invoices, filters, and exports.

- Resolve assignment writes through `src/services/territoryAssignment.ts`; store the master ID and canonical name together. An ID takes precedence over a supplied label. Imports and legacy callers may submit an exact, case-insensitive master name. Unknown IDs, unknown or ambiguous names, and newly assigned inactive territories throw `AppError` 400. Existing inactive assignments may be retained.
- `POST /api/rbac/users` requires `territoryId`. Updates may omit assignment fields to preserve the existing territory. User list, provisioning, editing, login, and refresh responses include the ID; user/session responses also expose `territoryRef`. Territory assignments do not grant permissions or automatically scope business data.
- Doctors and staff may clear an optional assignment; clear both ID and label. Clients, orders, collections, wholesalers, zones, and targets require a master for new assignments. An order may inherit its client's assignment. Client and collection forms send `territoryId` with the canonical name; their Division and Territory Station pattern is in [FRONTEND_GUIDELINES.md](./FRONTEND_GUIDELINES.md#division-and-territory-selection).
- Zone allocation derives division from the master and synchronizes the staff territory in the same transaction. Territory analytics uses master records, matching operations by ID with exact-name fallback for legacy rows. Do not invent territories or infer divisions from name fragments.
- New collection invoice defaults come from `collectionService.getOrderContext`, exposed at `GET /api/collections/order-context/:orderId` with validated ObjectId params, authentication, and collection read permission. Legacy orders still identify clients by exact, case-insensitive pharmacy name; the service requires a unique match and returns its current master territory, MIO, and stable `clientCode`. Duplicate matches return 409; missing orders return 404 and cancelled orders return 400. Only unregistered pharmacies fall back to the order assignment. New receipt balance updates prefer the supplied unique client code. Changing a client territory does not rewrite historical order or receipt assignments.
- `GET /api/territories` only reads. It accepts validated `page`, `limit` (1–100), `search` / `searchTerm`, `status`, `sortBy` (`name`, `division`, `status`, `createdAt`), and `sortOrder`, and returns `data` plus pagination `meta`. Omitting `limit`, or using `all` / `-1`, retains the full list for assignment dropdowns. Search, sorting, and paging run in Prisma; an emptied last page is clamped to the last available page.
- `POST /api/territories` validates its body, requires authentication, and accepts create permission on either `Territory Sales Breakdown` or `Target Vs Achievement`. Target forms still explicitly create custom masters before saving quotas. `PUT /api/territories/:id` and `DELETE /api/territories/:id` require the corresponding edit/delete permission on `Territory Sales Breakdown` and validate ObjectId params. Create and update accept only a trimmed name (1–200 characters), optional division (up to 200; blank defaults to `General Division`), and `Active` / `Inactive` status. Duplicate names are checked case-insensitively.
- Renaming a master updates canonical territory labels and IDs across all ten assignment collections in one transaction, including exact-name legacy records with null or absent IDs. Doctor combined labels retain their MIO suffix; zone allocations also synchronize the division. Inactivation preserves existing assignments. Deletion checks both linked and legacy references and returns 409 with guidance to mark the territory inactive when it is in use. Successful create, update, and delete operations write audit events. These operations do not change which territory a historical order or receipt belongs to.
- Seed finds or creates the administrator's territory using `SUPERADMIN_TERRITORY` (default `Head Office`) and stores the relation.

### Schema sync and existing records

From `backend`:

```sh
npx prisma generate
npx prisma db push --skip-generate
npm run territories:backfill
npm run territories:backfill -- --apply
```

`scripts/backfill-territories.ts` previews counts without writes by default. `--apply` creates missing masters from stored names and links existing assignments. It does not merge similar names or guess divisions; it copies a division from zone allocations only when those records agree. Unassigned placeholders are preserved without fake masters. Duplicate master names and dangling references stop the script. Writes check the original assignment to avoid overwriting concurrent changes; rerunning after completion makes no assignment changes.

The script loads assignment fields and logs counts without credentials or connection details. Review master divisions after importing legacy labels. Restart running API processes after regenerating Prisma; on Windows, a running process may lock its engine DLL. `npm run test:territories` compiles the API and runs isolated regression tests using database stubs. Frontend validation is checked with `npm run typecheck` in `frontend`.

Maintain this existing guide and the frontend guide when contracts or workflows change. Do not create separate documentation files for individual features or logic changes unless requested.

## Sales order corrections

Both `POST /api/orders` and `PATCH /api/orders/:id` require a trimmed, non-empty `contactNo` string, without a phone-number pattern. It is stored on `Order.contactNo`, independently of the pharmacy client's phone. The Prisma field is nullable for existing MongoDB orders; no backfill is required. Regenerate Prisma Client after updating the schema. Invoice rendering falls back to the client phone only when an older order has no contact number.

`PATCH /api/orders/:id` updates an existing order through `updateOrderSchema`, `orderController.updateOrder`, and `orderService.updateOrder`. The existing `PUT /api/orders/:id` remains the status endpoint; `PATCH /api/orders/:id/invoice` remains the invoice-metadata endpoint. The edit body accepts pharmacy, master territory, representative, delivery method, product rows, exactly one discount method (a percentage from 0–100 or a fixed amount that cannot exceed the subtotal), and comments. It rejects identity, status, payment, and total overrides. The service recalculates line totals, box counts, summary, whole-taka discount, and order value, preserving document numbers, date, and payment terms.

Order, stock, mirrored product-batch quantities, and customer receivable changes run in one transaction. Product quantity differences are aggregated by normalized description so price edits and splitting rows do not allocate stock again. Additional units use exact brand/SKU matches and FEFO order, excluding expired, invalid-expiry, or quarantined batches; insufficient stock rejects the entire edit. Historical orders have no per-batch allocation ledger: reductions can restore stock only when a single matching batch exists. Ambiguous returns and legacy orders without saved line items require reconciliation before order editing; invoice metadata remains editable separately.

Cancelled orders are rejected. Non-rejected collections matched by order ID or invoice/order number, together with the saved paid amount, prevent reducing the new total below payments or transferring a paid order to another pharmacy. Unpaid pharmacy changes transfer receivables; duplicate pharmacy matches reject the transaction. A previously Settled order with a new outstanding balance becomes Delivered & Invoiced. Receipt records retain their historical values. Successful edits record a Sales Order Updated audit event after the transaction. `npm run test:orders` compiles and runs isolated service, validation, rollback, and route-guard regression tests without a database connection.

## Bank accounts and statements

`GET /api/account-ledger/accounts` returns each `FinancialAccount` plus `transactionCount`, `blockingTransactionCount`, `linkedCollections`, `linkedExpenses`, `linkedSettlements`, `canDelete`, and `lastTransactionAt`. `transactionCount` includes opening-balance entries; `blockingTransactionCount` excludes them and drives `canDelete`. The counts come from `groupBy` queries over the journal source/destination IDs and the three `financialAccountId` references.

`GET /api/account-ledger/accounts/:id` requires authentication and read permission on `Bank Accounts Ledger`. It returns `{ account, summary, linked, canDelete, deleteBlockedReason }`. `summary` contains `balance`, `totalCredits`, `totalDebits`, `netMovement`, `transactionCount`, and `lastTransactionAt`. `linked` includes `journal`, `openingJournal`, `blockingJournal`, and the three source-document counts. Credits are journal rows whose `destinationAccountId` is the account (inflows, loans, incoming transfers, positive openings/adjustments); debits are rows whose `sourceAccountId` is the account (outflows, outgoing transfers, negative openings/adjustments). The paginated statement itself uses the existing `GET /api/account-ledger/transactions?accountId=...` query.

`DELETE /api/account-ledger/accounts/:id` returns 409 when a business `JournalTransaction`, `DeliveryCollection`, `ExpenseVoucher`, or `PartySettlement` references the account. The message lists the linked counts by record type. Opening-balance entries do not block deletion; they are removed with the account. `financialAccountId` on the last three models is a plain string without a database foreign key, so the service guard is the only protection against dangling references. Indexes cover the journal account IDs and those three fields; regenerate Prisma and run `npx prisma db push --skip-generate` after schema changes.

Account creation uses `initialBalance` to post an `INFLOW` or `OUTFLOW` journal entry with method `Opening Balance` and increments or decrements the new account's balance in the same transaction. Updating `balance` posts a `Balance Adjustment` entry for the difference instead of overwriting the balance. The entries have sequential `JRN-OPEN-001` and `JRN-ADJ-001` references and appear on the account statement. `node scripts/backfill-account-openings.cjs` previews missing opening entries; `--apply` posts them for accounts created before this behavior existed.

Journal references use a readable prefix plus a zero-padded sequence (`JRN-SPAY-001`, `JRN-BPAY-001`, `JRN-REV-001`, `JRN-OPEN-001`, `JRN-ADJ-001`). `src/utils/journalRef.ts` reads existing numeric suffixes and returns the next number; legacy random suffixes are ignored. `node scripts/renumber-journal-refs.cjs` previews converting legacy random references, and `--apply` renumbers them oldest-first. Numeric references are kept. Historical audit entries retain the reference text they recorded at the time.

## Other constraints

There is no server file upload. Bulk import accepts a JSON array. Logs are `console` plus `AuditLog`. Passwords and refresh tokens are hashed. Express auth cookies are HttpOnly. Most business routes are still unauthenticated. There is no CORS allow-list.

New module: schema and `db push`, `validations/{module}Validation.ts`, `services/{module}Service.ts`, `controllers/{module}Controller.ts` with `catchAsync` and `sendResponse`, `routes/{module}Routes.ts` mounted in `app.ts`, then `ALL_SYSTEM_MODULES` and `ROUTE_FEATURES` if it is a permission screen. Sensitive mutations call `requireAuth()`.
