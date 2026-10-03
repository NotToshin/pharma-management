# AK Pharma Management System

A full-stack pharmaceutical management application with Next.js frontend and Express/TypeScript backend.

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Express.js, TypeScript, Prisma ORM, PostgreSQL
- **Auth**: JWT with bcrypt password hashing
- **Database**: PostgreSQL (via Prisma)

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
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── routes/         # API route definitions
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