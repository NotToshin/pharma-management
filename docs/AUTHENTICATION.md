# Authentication

There is no public signup. Accounts are `SystemUser` rows created by seed or by a super admin at `POST /api/rbac/users`. `Staff` and HR `Role` cannot log in. Login role is `SystemRole`.

Passwords are bcrypt hashes. The API never returns `passwordHash` or `refreshTokenHash`. Unknown email and wrong password return the same `401`. Do not reveal which one failed.

## Tokens

Signed in `backend/src/middlewares/token.ts`.

| Token | Env | Expiry | Payload |
|---|---|---|---|
| Access | `JWT_ACCESS_SECRET` | `JWT_ACCESS_EXPIRES_IN`, default `15m` | `userId`, `email`, `role` (role **code**) |
| Refresh | `JWT_REFRESH_SECRET` | `JWT_REFRESH_EXPIRES_IN`, default `7d` | `userId`, `tokenId` |

`JWT_SECRET` is required at startup and is not used to sign tokens.

The refresh token is stored as a SHA-256 hash on `SystemUser.refreshTokenHash`. Login and refresh replace that hash, so only the latest refresh token matches. Logout sets it to `null`. `lastLogin` is formatted in `Asia/Dhaka`. Login writes audit action `Operator Authenticated`. Logout writes `Operator Session Terminated`.

Express sets HttpOnly cookies on the API host: `accessToken` (15 minutes) and `refreshToken` (7 days). Production uses `Secure` and `SameSite=None`. The login JSON also returns both tokens. Do not remove them unless `frontend/middleware.ts` and `apiFetch` change together.

`setAuthSession` in `frontend/lib/auth.ts` copies the session for the Next.js app:

| Store | Name | Life | Contents |
|---|---|---|---|
| Cookie | `ak_session` | 7 days | `"true"`. Not a JWT. Middleware treats this as logged in |
| Cookie | `accessToken`, `token` | 15 minutes | Access JWT, readable by JavaScript |
| Cookie | `refreshToken` | 7 days | Refresh JWT, readable by JavaScript |
| Cookie | `ak_role`, `ak_rbac` | 7 days | Role text, and `"true"` if super admin or the user has an RBAC grant |
| `localStorage` | `user`, `ak_user` | Until logout | User JSON, including `permissions` |
| `localStorage` | `token`, `ak_token`, `refreshToken`, `ak_refreshToken` | Until logout | Token copies |

The account dialog edits name and avatar in `localStorage` only. There is no profile API.

## Login, refresh, logout

The login page calls `POST /api/auth/login` with `fetch`, not `apiFetch`. Auth routes are also mounted at `/auth`.

| Route | Result |
|---|---|
| `POST /api/auth/login` | Both tokens, HttpOnly cookies, user with `permissions` |
| `POST /api/auth/refresh-token` | Body or cookie. Rotates both tokens when the hash matches |
| `POST /api/auth/logout` | Uses the refresh **cookie** only. Invalid cookie still returns `200` and clears cookies |
| `POST /api/rbac/login` | Access token only. No refresh token. The UI does not call this |

`apiFetch` (`frontend/lib/api.ts`) refreshes if the access token is missing or inside 5 seconds of expiry. Concurrent callers share one refresh. It sends `Authorization: Bearer` plus `x-user-email`, `x-user-name`, and `x-user-role`. Those headers are for audit context, not authorization. On refresh failure it clears storage and redirects to `/login?expired=1`.

Refresh tries each candidate token. A hash mismatch continues to the next candidate so a parallel refresh does not kill the session. `status === "Restricted"` cannot log in or refresh (`403`). A null `refreshTokenHash` is `401`.

## Where checks live

| Check | File | What it does |
|---|---|---|
| Page session | `frontend/middleware.ts` | Allows the page if `ak_session=true`, a non-expired `refreshToken` cookie, or a non-expired access cookie (`accessToken`, `token`, `ak_token`). Otherwise `/login` |
| RBAC page | same file | `/settings/rbac` also needs super-admin role text or `ak_rbac=true`, else `/dashboard?unauthorized=rbac`. Session stays active |
| Page UI | `frontend/app/layout.tsx` | Hides a catalogued page when `userCan(..., "view")` is false. Unknown paths are allowed |
| Buttons | `frontend/components/permission-gate.tsx` | `userCan` in `frontend/lib/permissions.ts`. `view` maps to `read`. Cards use `overview:<key>` |
| Audit actor | `backend/src/middlewares/actorContextMiddleware.ts` | Every API request. Does **not** reject a missing or invalid token. May attribute the audit from `x-user-email` |
| API auth | `backend/src/middlewares/requireAuth.ts` | Bearer token first, then the access cookie. Loads the role from the database, not from `x-user-role` |
| Module action | same file | `requirePermission(moduleName, "read" \| "create" \| "edit" \| "delete")`. **No route calls it today** |

Only `/api/rbac/roles` and `/api/rbac/users` call `requireAuth("SUPER_ADMIN")`. Other business routes do not. Do not copy that gap.

Super admin on the client (`isUserSuperAdmin`): email contains `superadmin`, or the email is `toshin@akpharma.com`, or the role text normalizes to `SUPERADMIN` / `SUPERADMINISTRATOR`. Those users pass `userCan`. A non-super-admin with an empty `permissions` array also passes. Once any permission rows exist, a missing module is denied.

`requireAuth("SUPER_ADMIN")` matches `SUPERADMIN` and `SUPER_ADMIN`. It also allows a user who can read, create, or edit a module whose name contains `role permission` or `rbac`.

## Status codes

| Case | Status |
|---|---|
| Unknown email or wrong password | 401, same message |
| Missing or invalid access token | 401 `Invalid access token. Please log in again.` |
| Expired access token | 401 `Access token expired. Please refresh your session.` |
| Refresh missing, rotated, or logged out | 401 |
| `Restricted` account | 403 |
| Role not in `requireAuth(...)` | 403 |
| `requirePermission` action denied | 403 |

Throw these with `AppError` from the service. Do not send a custom error JSON from the controller.

## Secure endpoint pattern

```typescript
router.post(
  "/",
  requireAuth(),
  requirePermission("Doctors List", "create"),
  validateBody(createDoctorSchema),
  createDoctor
);
```

`feature` in `<PermissionGate feature="Doctors List" action="create">` must match `backend/src/constants/moduleCatalog.ts`. Call the API with `apiFetch`.
