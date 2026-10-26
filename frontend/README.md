# AK Pharma Management - Frontend

Next.js 16 (App Router) frontend for the AK Pharma Management System.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **State**: React Context, Server Components
- **HTTP Client**: Fetch API / Axios
- **Icons**: Lucide React

## Project Structure

```
frontend/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth layout group
│   ├── (dashboard)/       # Dashboard layout group
│   ├── api/               # API routes (if any)
│   └── globals.css        # Global styles
├── components/
│   ├── ui/                # shadcn/ui base components
│   ├── forms/             # Form components
│   ├── charts/            # Chart components
│   ├── tables/            # Data table components
│   └── layout/            # Layout components (Sidebar, Header)
├── lib/
│   ├── api.ts             # API client & endpoints
│   ├── utils.ts           # Utility functions
│   ├── validations/       # Zod schemas
│   └── auth.ts            # Auth helpers
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript types
├── public/                # Static assets
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.mjs
└── postcss.config.mjs
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (port 3000) |
| `npm run build` | Build for production |
| `npm start` | Run production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | TypeScript type checking |

## Adding shadcn/ui Components

```bash
# Add a component
npx shadcn@latest add button

# Add multiple components
npx shadcn@latest add button input dialog table
```

Components are installed to `components/ui/`.

## Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL="http://localhost:5000/api"
```

## Key Features

- **Authentication**: JWT-based auth with protected routes
- **Dashboard**: Real-time metrics, charts, inventory alerts
- **Doctor Registry**: CRUD with territory management
- **Inventory**: FEFO batch tracking, stock adjustments
- **Orders**: Sales orders with inventory deduction
- **Finance**: Accounts, transactions, expense vouchers
- **Staff & Payroll**: Employee management, salary processing
- **RBAC**: Role-based access control

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Visit `http://localhost:3000`