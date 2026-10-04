# AK Pharma Management System

A full-stack pharmaceutical management application with Next.js frontend and Express/TypeScript backend.

## Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19, TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context / Server Components
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts / Chart.js

### Backend
- **Runtime**: Node.js 20+ with TypeScript
- **Framework**: Express.js
- **Database ORM**: Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: JWT (jsonwebtoken) with bcryptjs password hashing
- **Validation**: Zod (schema validation)
- **Architecture**: Layered architecture (Controller → Service → Prisma)

### Development & Deployment
- **Package Manager**: npm
- **Type Checking**: TypeScript 5.3+
- **Dev Server**: tsx (TypeScript execution)
- **Process Manager**: PM2 (production)
- **Deployment**: Vercel (Frontend), Vercel/Render/Railway (Backend)

### Key Libraries
| Category | Libraries |
|----------|-----------|
| HTTP & Routing | express, cors |
| Database | @prisma/client, prisma |
| Auth | jsonwebtoken, bcryptjs |
| Validation | zod |
| Environment | dotenv |
| Dev Tools | tsx, typescript, @types/* |

---

## Prerequisites

- Node.js 20+
- PostgreSQL 14+
- npm or yarn

---

## Quick Start

### 1. Clone & Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment Variables

#### Backend (`backend/.env`)
```env
DATABASE_URL="postgresql://username:password@localhost:5432/pharma_management?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
PORT=5000
NODE_ENV=development
```

#### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL="http://localhost:5000/api"
```

### 3. Setup Database

```bash
cd backend

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# (Optional) Seed default roles & admin user
npx prisma db seed
```

### 4. Start Development Servers

```bash
# Terminal 1 - Backend (port 5000)
cd backend
npm run dev

# Terminal 2 - Frontend (port 3000)
cd frontend
npm run dev
```

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/health

---

## Default Login Credentials

After seeding, a default super admin is created:

- **Email**: `toshin@admin.com`
- **Password**: `admin123456`

---

## Project Structure

```
pharma-management/
├── backend/
│   ├── api/                # Serverless deployment entry
│   ├── src/
│   │   ├── controllers/    # Route handlers (HTTP layer)
│   │   ├── routes/         # API route definitions
│   │   ├── services/       # Business logic layer
│   │   ├── utils/          # Shared utilities (catchAsync, sendResponse)
│   │   ├── validations/    # Request validation schemas
│   │   ├── server.ts       # Express app entry
│   │   └── ...
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   └── package.json
├── frontend/
│   ├── app/                # Next.js App Router pages
│   ├── components/         # React components
│   ├── lib/                # Utilities
│   └── package.json
└── README.md
```

## Backend Architecture

The backend follows a **layered architecture** pattern:

```
Request → Route → Controller → Service → Prisma → Database
                ↓
            Response (via sendResponse utility)
```

### Layers

| Layer | Responsibility | Files |
|-------|---------------|-------|
| **Routes** | Define API endpoints, mount controllers | `src/routes/*.ts` |
| **Controllers** | Handle HTTP requests/responses, validation | `src/controllers/*.ts` |
| **Services** | Business logic, data transformations | `src/services/*.ts` |
| **Utils** | Shared helpers (error handling, responses) | `src/utils/*.ts` |

### Key Utilities

- **`catchAsync`** - Wrapper to catch async errors and pass to Express error handler
- **`sendResponse`** - Standardized API response format

```typescript
// Example usage in controller
export const getAllDoctors = catchAsync(async (req: Request, res: Response) => {
  const doctors = await doctorService.getAllDoctors();
  sendResponse(res, 200, "Doctors retrieved successfully", doctors);
});
```

### Response Format

All API responses follow a consistent structure:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation successful",
  "data": { ... },
  "meta": { ... }
}
```

---

## Available Scripts

### Backend
| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript |
| `npm start` | Run production build |
| `npx prisma studio` | Open Prisma DB GUI |
| `npx prisma migrate dev` | Run migrations in dev |

### Frontend
| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Build for production |
| `npm start` | Run production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | TypeScript type checking |

---

## API Endpoints

| Module | Base Path |
|--------|-----------|
| Authentication | `/api/auth`, `/api/rbac` |
| Doctors | `/api/doctors` |
| Staff & Payroll | `/api/staff`, `/api/salary` |
| Clients | `/api/clients` |
| Orders & Logistics | `/api/orders` |
| Inventory | `/api/inventory` |
| Finance | `/api/account-ledger`, `/api/payments`, `/api/expense-vouchers` |
| Treasury | `/api/treasury` |
| Dashboard | `/api/dashboard`, `/api/finance-overview` |

---

## Deployment

### Backend (Vercel/Render/Railway)
1. Set `NODE_ENV=production`
2. Set `DATABASE_URL` to production PostgreSQL
3. Set strong `JWT_SECRET`
4. Run `npm run build` then `npm start`

### Frontend (Vercel)
1. Set `NEXT_PUBLIC_API_URL` to production backend URL
2. Deploy via Vercel CLI or Git integration

---

## Database Schema Overview

Key models:
- **SystemUser/Role/Permission** - RBAC authentication
- **Doctor** - Doctor registry with territory management
- **Staff/Salary** - HR and payroll
- **Client/Order** - Sales and client management
- **InventoryBatch** - FEFO stock control
- **FinancialAccount/JournalTransaction** - Double-entry accounting
- **TreasuryDeposit/ExpenseVoucher** - Cash management

---

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check `DATABASE_URL` format: `postgresql://user:pass@host:port/db?schema=public`
- Ensure database exists: `createdb pharma_management`

### Port Conflicts
- Backend default: 5000 → change `PORT` in `.env`
- Frontend default: 3000 → Next.js auto-increments if busy

### CORS Errors
- Backend allows all origins in development (`origin: true`)
- For production, configure specific origins in `server.ts`

---

## License

Private project - AK Pharma Management System