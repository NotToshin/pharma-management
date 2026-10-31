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

List queries accept `page`, `limit`, `sortBy`, `sortOrder`, and `searchTerm`. Audit logs also accept `search`. Filter and sort in the service. `meta` includes `total` and `totalPage` (audit logs also send `totalPages`).

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
| Every other module | No `requireAuth` |

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

## Other constraints

There is no server file upload. Bulk import accepts a JSON array. Logs are `console` plus `AuditLog`. Passwords and refresh tokens are hashed. Express auth cookies are HttpOnly. Most business routes are still unauthenticated. There is no CORS allow-list.

New module: schema and `db push`, `validations/{module}Validation.ts`, `services/{module}Service.ts`, `controllers/{module}Controller.ts` with `catchAsync` and `sendResponse`, `routes/{module}Routes.ts` mounted in `app.ts`, then `ALL_SYSTEM_MODULES` and `ROUTE_FEATURES` if it is a permission screen. Sensitive mutations call `requireAuth()`.
