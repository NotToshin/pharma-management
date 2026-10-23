# AK Pharma Management System

An enterprise-grade Pharmaceutical ERP and Field Force Automation platform designed for pharmaceutical manufacturers, distributors, and field operations.

---

## 🚀 Key Modules & Capabilities

- **📦 Inventory & Warehouse**: Batch-level inventory management with First-Expired, First-Out (FEFO) tracking, automated expiry warnings, and stock adjustments.
- **🩺 Doctor Registry & Field Force (MIO)**: Territory mapping, Medical Information Officer (MIO) visit logging, doctor profiling, and target analytics.
- **💼 Sales & Procurement**: Complete lifecycle management for purchase orders, client invoicing, sales orders, and logistics delivery.
- **💳 Finance & Treasury**: Double-entry accounting ledger, bank and cash account monitoring, treasury deposits, and expense vouchers.
- **👥 HR & Payroll**: Staff onboarding, employee records, attendance, and automated salary processing.
- **🛡️ RBAC & Audit Trails**: Granular role-based access control across 28+ system modules with audit logging and JWT authentication.

---

## 🛠️ Tech Stack

| Domain | Technologies |
|---|---|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Radix UI, Recharts, Sonner |
| **Backend** | Node.js 20+, Express.js, TypeScript, Prisma ORM, MongoDB |
| **Authentication** | JWT (JSON Web Tokens), bcryptjs |
| **Validation** | Zod (schema-driven validation) |

---

## 📁 Architecture Overview

The backend is built on a clean **layered architecture**:

```
Request → Route → Validation (Zod) → Controller (catchAsync) → Service → Prisma → MongoDB
                                              ↓
                               Response (sendResponse utility)
```

```
pharma-management/
├── backend/       # Express REST API, Prisma schema, services & controllers
└── frontend/      # Next.js 16 App Router interface & UI components
```

---

## ⚡ Quick Start

### 1. Prerequisites
- **Node.js**: v20 or higher
- **MongoDB**: MongoDB Atlas cluster or local instance

### 2. Backend Setup
```bash
cd backend
npm install

# Configure backend/.env with DATABASE_URL & JWT_SECRET
# Example:
# DATABASE_URL="mongodb+srv://<user>:<password>@cluster0.mongodb.net/pharma_management?retryWrites=true&w=majority"
# JWT_SECRET="your-secret-key"

# Generate Prisma client, sync schema & seed initial admin
npx prisma generate
npx prisma db push
npm run seed

# Start API server (http://localhost:5000)
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install

# Configure frontend/.env.local:
# NEXT_PUBLIC_API_URL="http://localhost:5000/api"

# Start Next.js client (http://localhost:3000)
npm run dev
```

---

## 🔐 Default Credentials

After seeding the database (`npm run seed` in `backend`):

| Role | Email | Password |
|---|---|---|
| **Super Administrator** | `superadmin@pharma.com` | `admin123456` |

---

## 📄 License

Proprietary — AK Pharma Management System. All rights reserved.