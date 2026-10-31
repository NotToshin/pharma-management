# Backend Architecture

The API is an Express application in `backend/`. Business code follows:

```text
Client → Route → Middleware → Zod validation → Controller → Service → Prisma → MongoDB → sendResponse
```

Validation and authentication middleware are real, but they are not on every route. This document says where each layer is actually applied. System context is in [SYSTEM_OVERVIEW.md](./SYSTEM_OVERVIEW.md).

## Technologies

From `backend/package.json`:

| Package | Use |
|---|---|
| `express` | HTTP server |
| `typescript`, `tsx` | Source language and dev runner |
| `@prisma/client`, `prisma` | MongoDB access |
| `zod` | Request schemas |
| `jsonwebtoken` | Access and refresh tokens |
| `bcryptjs` | Password hashes |
| `cookie-parser` | Auth cookies |
| `cors` | Cross-origin browser calls |
| `dotenv` | `.env` loading |

Dev server: `npm run dev` → `tsx watch src/server.ts`. Production: `npm run build` then `node dist/server.js`.

## Folder structure

```text
backend/
├── api/index.ts                 # Vercel serverless entry, delegates to Express
├── prisma/schema.prisma         # MongoDB models
├── prisma/seed.ts               # Super-admin seed
├── src/
│   ├── server.ts                # Process listen and shutdown
│   ├── app.ts                   # Express app and route mounting
│   ├── config/index.ts          # Environment config
│   ├── constants/moduleCatalog.ts
│   ├── routes/                  # One router per module
│   ├── controllers/
│   ├── services/
│   ├── validations/
│   ├── middlewares/
│   ├── errors/
│   ├── utils/
│   └── types/express.d.ts       # req.user typing
└── vercel.json
```

## Entry point and server start

`backend/src/server.ts` imports `app` and `config`, listens on `config.port`, and logs the health URL. It handles `EADDRINUSE`, `SIGTERM`, `SIGINT`, `unhandledRejection`, and `uncaughtException`. Shutdown closes the HTTP server and force-exits after 10 seconds.

`backend/api/index.ts` is the alternate entry used by the Vercel rewrite. It restores the original path from `__url` or forwarding headers and calls the same Express app.

`backend/src/config/index.ts` loads `backend/.env` from `process.cwd()`. Missing `DATABASE_URL`, `JWT_SECRET`, `JWT_ACCESS_SECRET`, or `JWT_REFRESH_SECRET` throws before listen. Variable names are listed in [SYSTEM_OVERVIEW.md](./SYSTEM_OVERVIEW.md). Do not document their values.

## Application middleware order

Registered in `backend/src/app.ts` before routes:

1. **CORS.** Origin callback returns the request origin, or `true` when there is no origin. Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS. Allowed headers include `Authorization`, `Content-Type`, and `x-user-email`, `x-user-name`, `x-user-role`. Credentials are enabled.
2. **`express.json()`.** No custom body size limit is set.
3. **`cookieParser()`.**
4. **`actorContextMiddleware`.** Builds the audit actor. Never rejects the request by itself.
5. **URL normalizer.** Reads `__url`, `x-matched-path`, `x-forwarded-uri`, or strips `/api/index.ts` so Vercel rewrites hit the right Express path.

After routes: `notFoundHandler`, then `globalErrorHandler`.

There is no `morgan`, Helmet, rate limiter, or `multer`.

## Route organization

Routers are mounted in `backend/src/app.ts`. Prefixes are under `/api` except auth, which is mounted twice.

| Mount | Router file |
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

Duplicate mounts exist so older client paths keep working. New clients should use the first path in each row. Do not add a third alias without a caller that needs it.

Route files export an Express `Router`. A typical protected-by-validation pattern is `backend/src/routes/doctorRoutes.ts`:

```typescript
router.get("/", validateQuery(getDoctorsQuerySchema), getAllDoctors);
router.post("/bulk-import", validateBody(bulkImportDoctorSchema), bulkImportDoctors);
router.get("/:id", validateParams(doctorIdParamSchema), getDoctorById);
router.post("/", validateBody(createDoctorSchema), createDoctor);
router.put("/:id", validateParams(doctorIdParamSchema), validateBody(updateDoctorSchema), updateDoctor);
router.delete("/:id", validateParams(doctorIdParamSchema), deleteDoctor);
```

Static paths such as `/bulk-import` are registered before `/:id`.

### Naming

- Paths are plural nouns: `/doctors`, `/orders`, `/staff`.
- Create is `POST /`. Update is usually `PUT /:id`. A few workflows use `PATCH` for a single change (`/:id/status`, `/:id/invoice`, `/:id/approve`, `/:id/receive`).
- Ids are MongoDB ObjectId strings in the path.
- Query lists accept `page`, `limit`, `sortBy`, `sortOrder`, and `searchTerm` (audit logs also accept `search`). Filtering and sorting happen in the service. The response `meta` includes `total` and `totalPage` (audit logs also send `totalPages`). The frontend does not re-filter that page.

## Controllers

Controllers live in `backend/src/controllers/`. They translate HTTP into a service call and a response. They do not import Prisma.

Required shape, from `doctorController.ts`:

```typescript
export const createDoctor = catchAsync(async (req: Request, res: Response) => {
  const newDoctor = await doctorService.createDoctor(req.body);
  sendResponse(res, 201, "Doctor created successfully", newDoctor);
});
```

Rules that the existing controllers follow:

- Wrap every async handler in `catchAsync` (`backend/src/utils/catchAsync.ts`). It forwards rejected promises to `next`.
- Do not add `try/catch` in the controller. Operational failures are `throw new AppError(...)` in the service.
- Pass `req.body` through after Zod has replaced it with the parsed value.
- List handlers pick filter and pagination fields with `pick()` before calling the service.
- Return status `201` for creates and `200` for reads, updates, and deletes.

`catchAsync` does not catch errors thrown synchronously before the returned promise. Existing handlers are `async`, so thrown `AppError`s still reject that promise.

## Services

Services in `backend/src/services/` own business rules, Prisma calls, transactions, generated document numbers, and audit writes. Controllers stay thin so the same rules are not reimplemented per route.

Examples:

- `authService` checks bcrypt, issues tokens, stores the refresh hash, and writes the login audit event.
- `inventoryService.calculateFefoMeta` classifies expiry. Thresholds are documented in the system overview.
- `orderService` allocates stock and generates `SO-2026-####` numbers inside `prisma.$transaction`.
- `collectionService`, `paymentService`, `accountLedgerService`, `purchaseOrderService`, and `settlementService` use `prisma.$transaction` when a balance and a document must change together.

Services return Prisma objects or plain data. They do not receive `req` or `res`. Actor identity for audits is read from `requestContextStorage` (`backend/src/utils/requestContext.ts`), which the actor middleware fills.

`auditLogService` hashes the event and chains `previousHash`. Call it from the service after a successful mutation when the module already audits that action. Do not invent a second logger.

## Request validation

Zod schemas live in `backend/src/validations/`. Helpers in `backend/src/utils/validate.ts`:

| Helper | Parses |
|---|---|
| `validate(schema)` | `{ body, query, params }` when the schema shape has those keys |
| `validateBody(schema)` | `req.body`, unwrapping a `body` key if the schema is `{ body: ... }` |
| `validateParams(schema)` | `req.params` |
| `validateQuery(schema)` | `req.query` |

A failed parse calls `next(error)`. `globalErrorHandler` turns a `ZodError` into HTTP 400 through `handleZodError`.

Body schemas are usually nested:

```typescript
export const createDoctorSchema = z.object({
  body: doctorFormSchema,
});
```

`doctorFormSchema` matches the frontend file `frontend/lib/validations/doctorValidation.ts` field for field. When you add a field, update both files. The frontend copy is what `safeParse` uses. The backend copy is what the API trusts.

Patterns in the existing schemas:

- Required strings use `z.string().min(1, "… is required")`.
- Email uses `z.string().email("Invalid email format")` on login, doctors, and RBAC provisioning. Many other contact fields are plain strings.
- Numbers from JSON or forms use `z.coerce.number()`, often with `.min(0)` and `.int()` for counts.
- Optional blanks are `z.string().optional().or(z.literal(""))`.
- Closed sets use `z.enum([...])`, for example client status.
- Passwords: login requires `min(1)`. Provisioning a user requires `min(6)` in `provisionUserSchema`.
- List queries coerce `page` and `limit` and allow `sortOrder` of `asc` or `desc`. `getDoctorsQuerySchema` uses `.passthrough()`.

There is no Joi, Yup, or express-validator.

## Authentication and authorization

### Token helpers

`backend/src/middlewares/token.ts`:

- `generateAccessToken` / `verifyAccessToken` use `JWT_ACCESS_SECRET`.
- `generateRefreshToken` / `verifyRefreshToken` use `JWT_REFRESH_SECRET`.
- `hashToken` is SHA-256. `compareTokenHash` uses `crypto.timingSafeEqual`.
- Cookie options: `httpOnly: true`, 15 minutes for access, 7 days for refresh, `path: "/"`. In production, `secure: true` and `sameSite: "none"`. Otherwise `sameSite: "lax"` and `secure` is false.

`JWT_SECRET` is required by config and stored on `config.jwt.secret`. Signing does not use it. Both access and refresh secrets are still required.

### Auth routes

`POST /api/auth/login` validates `loginSchema`, then `authController.login` sets HttpOnly cookies and returns the user plus both tokens in JSON.

`POST /api/auth/refresh-token` accepts the refresh token from the cookie or `req.body.refreshToken`. It rotates both tokens.

`POST /api/auth/logout` clears the hash when the refresh cookie is present and clears both cookies.

`POST /api/rbac/login` is a second login handler (`loginOperator`) validated by `loginOperatorSchema`. The Next.js login page calls `/api/auth/login`, not this route.

### Who must be logged in

`requireAuth(...roles)` in `backend/src/middlewares/requireAuth.ts`:

1. Reads the bearer token first, then the `accessToken` cookie.
2. Verifies it. Expired tokens become 401 `"Access token expired. Please refresh your session."`
3. Loads `SystemUser` with role permissions.
4. Rejects `Restricted` accounts with 403.
5. If role arguments were passed, the user must match one of them. A super-admin check also allows a user who has any read, create, or edit grant on a module whose name contains `role permission` or `rbac`.
6. Sets `req.user` and updates the async actor context.

`requirePermission(moduleName, action)` checks `req.user.role.permissions` for an exact module name and a boolean `read`, `create`, `edit`, or `delete`. Role codes `SUPER_ADMIN` and `SUPERADMIN` skip that check. **No route file calls `requirePermission`.**

Applied authentication today:

| Routes | Guard |
|---|---|
| `/api/rbac/roles` and `/api/rbac/users` | `requireAuth("SUPER_ADMIN")` |
| `/api/auth/*`, `/api/rbac/login` | Public, credential check inside the service |
| Every other module | No `requireAuth` |

That is the implemented behavior. A new endpoint that changes money, stock, or users should still call `requireAuth()` and, when the module catalog has a matching name, `requirePermission`. Existing list and mutation routes do not do this yet. Do not describe them as protected.

`req.user` is typed in `backend/src/types/express.d.ts`.

## Database

`backend/src/utils/prisma.ts` creates one `PrismaClient` and reuses it on `global` outside production. Development logs Prisma warnings and errors. Production logs errors only.

The datasource is MongoDB. Schema changes are applied with `npx prisma db push` from `backend/`, then `npx prisma generate` (also the `postinstall` script).

Models, embedded types, and relations are listed in [SYSTEM_OVERVIEW.md](./SYSTEM_OVERVIEW.md). Read `backend/prisma/schema.prisma` before adding a field. MongoDB does not enforce every relation the way a SQL foreign key does. Services check parent rows themselves and throw `AppError` when a record is missing.

### Transactions

Use the existing `prisma.$transaction(async (tx) => { ... })` pattern when one user action writes more than one collection, especially:

- order create, cancel, and stock quantity
- purchase-order receipt into product and inventory batches
- collection clearance into a financial account
- expense disbursement
- ledger transfers
- settlements and allocations

Pass `tx` into nested writes. Do not call the global `prisma` client inside the callback for data that must roll back together.

## Response shape

`sendResponse(res, statusCode, message, data?, meta?)` in `backend/src/utils/response.ts` always sends:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation successful",
  "data": {},
  "meta": {}
}
```

`success` is true only for status codes 200–299. Paginated services return `{ data, meta }` where `meta` comes from `createPaginationMeta` in `backend/src/utils/paginationHelper.ts`:

```json
{
  "page": 1,
  "limit": 10,
  "total": 42,
  "totalPage": 5,
  "hasNextPage": true,
  "hasPrevPage": false
}
```

Default page size is 10. `limit` of 0 is treated as “no skip window” by the helper. Sort defaults to `createdAt` descending.

The health route does not use `sendResponse`.

## Error handling

All rejected work ends in `globalErrorHandler` (`backend/src/errors/globalErrorHandler.ts`), which is mounted after the routes in `backend/src/app.ts`. `catchAsync` forwards a rejected controller promise to that handler. Zod middleware calls `next(error)` with the `ZodError`.

| Piece | File | Behavior |
|---|---|---|
| `AppError` | `errors/AppError.ts` | `statusCode`, `status` (`fail` for 4xx, `error` otherwise), `isOperational` default `true` |
| `handleZodError` | `errors/handleZodError.ts` | 400, message lists `field (message)`, plus `errors[]` |
| `handlePrismaError` | `errors/handlePrismaError.ts` | P2002 → 400 duplicate, P2025 → 404, P2003/P2014/P2000/P2023 → 400, connection errors → 500 |
| `notFoundHandler` | `errors/globalErrorHandler.ts` | 404 `Cannot find <url> on this server` |
| `globalErrorHandler` | same file | JSON body below |

Error JSON:

```json
{
  "success": false,
  "statusCode": 400,
  "status": "fail",
  "message": "Validation failed: body.email (Invalid email format)",
  "errors": [{ "field": "body.email", "message": "Invalid email format" }],
  "stack": "only when NODE_ENV is development"
}
```

`status` is `fail` for 4xx and `error` for 5xx. `errors` is present only for Zod failures. `stack` is present only when `NODE_ENV` is `development`. A non-operational 500 outside development replaces `message` with `Something went wrong on the server`. The handler `console.error`s non-operational errors and any 5xx.

The frontend reads `message` and shows it in a Sonner toast. Field-level `errors` are not painted back onto inputs.

### Error handling rules

Follow these rules on every new controller, service, and validation schema.

1. **Controllers do not catch errors.** Wrap the handler in `catchAsync`. Do not add `try/catch`, and do not call `res.status(...).json(...)` for a failure. `sendResponse` is for completed work, including `201` creates and `200` deletes.
2. **Expected failures throw `AppError`.** Throw it from the service: `throw new AppError("Doctor not found", 404)`. `catchAsync` passes it to the global handler. Leave `isOperational` at its default `true` so the message is safe to show.
3. **Use the status code that matches the case.**

   | Situation | Status |
   |---|---|
   | Zod validation failed | 400, produced by `handleZodError`. Do not re-validate with a manual `if` that returns its own JSON |
   | Duplicate unique field (`P2002`) | 400 from `handlePrismaError`, unless the service already throws a clearer `AppError` |
   | Missing record, failed lookup the user asked for | 404 |
   | Missing, expired, or invalid token, or wrong password | 401. Use the same message for unknown email and wrong password |
   | Signed in but restricted, or the role or module permission does not allow the action | 403 |
   | Unexpected bug or database connection failure | 500. Do not mark it operational if the message would leak internals |

4. **Do not invent a second error shape.** Clients depend on `success`, `statusCode`, `message`, and optional `errors`. Do not add `error`, `msg`, or a bare string body.
5. **Let unknown Prisma errors reach the mapper.** Catch a Prisma error in a service only when you are translating it into a specific `AppError`. Otherwise let it throw. `P2002` and `P2025` already become 400 and 404.
6. **Validation stays in Zod middleware.** `validateBody`, `validateParams`, and `validateQuery` already call `next(error)`. Do not wrap `schema.parse` in a controller.
7. **Do not leak secrets in messages or logs.** No password, hash, JWT, or connection string in an `AppError` message. Login and refresh failures stay generic. The development `stack` field is already limited to `NODE_ENV=development`. Do not log request bodies that contain passwords.
8. **Transactions must fail together.** Throw inside the `prisma.$transaction` callback. Do not catch the error, write a partial success response, and leave the other collection updated.
9. **Unknown URLs stay on `notFoundHandler`.** Do not add a catch-all route that returns `200`.
10. **Process-level failures stay in `server.ts`.** `unhandledRejection` shuts the process down. Do not swallow a rejected promise in a service with an empty `catch`.

`loginOperator` in `rbacController.ts` returns `sendResponse(res, 400, ...)` when email or password is missing. That is an older exception. New handlers throw `AppError` instead, which `loginSchema` already covers for `/api/auth/login`.

Auth-specific 401 and 403 cases are listed in [AUTHENTICATION.md](./AUTHENTICATION.md).

## File upload and storage

Not implemented on the server. Bulk import routes accept JSON arrays (`doctors`, and the equivalent client payload), validated by Zod. The browser parses Excel. Do not add `multer` unless a feature truly needs binary storage. Avatar images never reach the API.

## Logging

Operational logs are `console.log` and `console.error` in `server.ts`, the URL normalizer, and the global error handler. Prisma logs errors. There is no Winston, Pino, or request-id middleware. The statutory record is `AuditLog`, not stdout.

## Security practices that exist

- Passwords are stored as bcrypt hashes. The login response does not include `passwordHash` or `refreshTokenHash`.
- Refresh tokens are stored as SHA-256 hashes and compared in constant time.
- Auth cookies set by Express are HttpOnly.
- Login and refresh audit the operator.
- RBAC user administration requires a verified super-admin token.
- Production cookies are `Secure` and `SameSite=None` so a cross-site frontend can send them.

Practices that are **not** implemented, and should not be documented as if they were:

- Authentication on most business routes.
- Module permission checks in services.
- A CORS allow-list.
- Helmet, rate limits, or CSRF tokens.
- Keeping access tokens only in HttpOnly cookies. The login JSON returns them, and the frontend stores them in `localStorage`.

`actorContextMiddleware` will also trust `x-user-email` when no valid token is present, and may attach a user looked up by that email. Audit attribution can therefore follow a client-supplied header on routes that do not call `requireAuth`.

## Environment and process

See the environment table in [SYSTEM_OVERVIEW.md](./SYSTEM_OVERVIEW.md). `config.database_url` is loaded so a missing URL fails fast. Prisma reads `DATABASE_URL` from the environment itself.

## Adding a module

Match an existing vertical slice such as doctors:

1. Add or extend models in `prisma/schema.prisma`, then `npx prisma db push` and regenerate the client.
2. Add `backend/src/validations/{module}Validation.ts` with a form schema and `{ body }` / `{ params }` wrappers.
3. Add `backend/src/services/{module}Service.ts` with Prisma and any transaction or audit calls.
4. Add `backend/src/controllers/{module}Controller.ts` using `catchAsync` and `sendResponse` only.
5. Add `backend/src/routes/{module}Routes.ts` and mount it in `backend/src/app.ts`.
6. If the screen is a new permission module, add it to `ALL_SYSTEM_MODULES` and to `ROUTE_FEATURES` in `frontend/lib/permissions.ts`.
7. For sensitive mutations, attach `requireAuth()` even though older routes omit it.

Do not call Prisma from a controller. Do not return a one-off JSON shape from a controller when `sendResponse` already defines the contract.
