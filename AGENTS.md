# AGENTS.md - AK Pharma Management System

## Project Overview

Full-stack pharmaceutical management application with:
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend**: Express.js, TypeScript, Prisma ORM, PostgreSQL

## Backend Architecture (IMPORTANT)

The backend follows a strict **layered architecture**:

```
Request → Route → Controller → Service → Prisma → Database
                ↓
            Response (via sendResponse utility)
```

### Layer Responsibilities

| Layer | Purpose | Location |
|-------|---------|----------|
| **Routes** | Define endpoints, mount controllers | `src/routes/*.ts` |
| **Controllers** | Handle HTTP, validation, call services | `src/controllers/*.ts` |
| **Services** | Business logic, data transformations | `src/services/*.ts` |
| **Utils** | Shared helpers | `src/utils/*.ts` |

### Required Patterns

**1. Controllers MUST use `catchAsync` wrapper:**
```typescript
import { catchAsync } from "../utils/catchAsync";
import { sendResponse } from "../utils/response";

export const getAllDoctors = catchAsync(async (req: Request, res: Response) => {
  const doctors = await doctorService.getAllDoctors();
  sendResponse(res, 200, "Doctors retrieved successfully", doctors);
});
```

**2. Services contain ALL business logic** - No Prisma calls in controllers

**3. Standardized response format via `sendResponse`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation successful",
  "data": { ... },
  "meta": { ... }
}
```

**4. Error handling** - Let `catchAsync` catch errors, don't use try/catch in controllers

## Key Files

### Utilities
- `src/utils/catchAsync.ts` - Async error wrapper
- `src/utils/response.ts` - Standardized response helper

### Services (Business Logic)
- `src/services/treasuryService.ts`
- `src/services/staffService.ts`
- `src/services/doctorService.ts`
- (Add new services following same pattern)

## Commands

```bash
# Backend
cd backend
npm run dev          # Dev server with hot reload
npm run build        # Compile TypeScript
npm start            # Production
npx prisma studio    # DB GUI
npx prisma migrate dev  # Run migrations

# Frontend
cd frontend
npm run dev          # Next.js dev server
npm run build        # Production build
npm run lint         # ESLint
npm run typecheck    # TypeScript check
```

## Database Schema

Key models in `backend/prisma/schema.prisma`:
- `SystemUser`, `SystemRole`, `RolePermission` - RBAC
- `Doctor` - Doctor registry
- `Staff`, `Salary` - HR/Payroll
- `Client`, `Order` - Sales
- `InventoryBatch` - FEFO stock
- `FinancialAccount`, `JournalTransaction` - Accounting
- `TreasuryDeposit`, `ExpenseVoucher` - Cash management

## Environment Variables

### Backend (`backend/.env`)
```
DATABASE_URL="postgresql://..."
JWT_SECRET="..."
PORT=5000
NODE_ENV=development
```

### Frontend (`frontend/.env.local`)
```
NEXT_PUBLIC_API_URL="http://localhost:5000/api"
```

## Code Style Rules

1. **No direct Prisma imports in controllers** - Use services
2. **No try/catch in controllers** - Use `catchAsync`
3. **Always use `sendResponse`** - Consistent API format
4. **Services return Prisma results directly** - Controllers handle HTTP
5. **TypeScript strict mode** - No `any` without justification

## Adding New Module

1. Create service: `src/services/{module}Service.ts`
2. Create controller: `src/controllers/{module}Controller.ts`
3. Create routes: `src/routes/{module}Routes.ts`
4. Register in `src/server.ts`
5. Follow existing patterns exactly