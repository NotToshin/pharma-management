# Responsive Audit Plan — AK Pharma Management System

> **Status:** ready to execute · **Prepared:** 11 Nov 2026 · **Owner:** frontend
> **Scope:** 25 routes, authenticated shell, overlays, print previews, 3 device classes
> **Companions:** [UI_UX_GUIDELINES.md](./UI_UX_GUIDELINES.md) · [FRONTEND_GUIDELINES.md](./FRONTEND_GUIDELINES.md)

## 1. Objective and definition of done

The UI is a dense, desktop-first operations console. The only JavaScript breakpoint is 768px in `frontend/hooks/use-mobile.ts`; the shell keeps a 19rem sidebar, main content uses `p-6 md:p-8`, and most screens are wide tables with dialogs. This plan verifies every route at mobile, tablet, and desktop, records each failure, and produces a prioritized fix list. It does not redesign screens during the audit.

**Definition of done:** every route passes the acceptance criteria below at 320px wide (mobile floor), 768px and 1024px (tablet boundaries), and 1440px (desktop reference), with every dialog, sheet, and print preview opened at least once. Desktop density at 1440px must not regress.

| ID | Pass condition |
|---|---|
| R1 | No page-level horizontal scroll at 320px. `document.documentElement.scrollWidth <= clientWidth`. |
| R2 | Wide tables may scroll **inside their card**, but the page must not. The identifying column and row actions are reachable, and the scroll is discoverable. |
| R3 | No clipped, overlapping, or cut-off text. Deliberate truncation keeps the value reachable (title, expand, or detail view). |
| R4 | Every dialog and sheet fits the viewport with a visible gutter, scrolls internally, and keeps Close plus the primary action reachable. |
| R5 | Forms stack to one column below 640px. Inputs are usable on iOS without page auto-zoom. |
| R6 | Primary touch targets are at least 40×40px; icon-only actions are at least 32×32px with an accessible name. |
| R7 | KPI cards and charts reflow without clipped values, legends, axis labels, or tooltips. |
| R8 | Print/PDF previews are readable or scrollable on mobile, and A4 printing is unchanged. |
| R9 | 200% browser zoom and 400% reflow (1280px → 320 CSS px) remain usable. |
| R10 | Desktop 1280–1920 keeps the intended density, alignment, and sticky header behavior. |

**Interpretation:** "responsive" here means an operator can complete the task on a phone or tablet, not that the phone layout matches desktop pixel-for-pixel. Horizontal scroll inside data tables is accepted for v1; stacked card tables are a separate design decision.

## 2. Scope

### In scope

- All 25 routes listed in [section 3](#3-route-map), including the two routes outside the sidebar and the dynamic supplier route.
- Authenticated shell: sidebar (expanded, collapsed, mobile sheet), header, profile menu, account and privileges dialogs, access-denied panel.
- Per-page KPI cards, charts, toolbars, tables, pagination, dialogs, sheets, forms, print previews, loading/empty/error states.
- Mobile, tablet, and desktop viewports, portrait and landscape, plus 200%/400% zoom.
- Super-admin and restricted-role rendering, including hidden modules and actions.

### Out of scope

- Backend jobs, Prisma schema, and API performance.
- Dark mode (the shell forces light in `frontend/app/layout.tsx`).
- A full WCAG 2.2 audit, localization, and new product features.
- Pixel-perfect print fidelity beyond A4 output.

## 3. Route map

All routes are App Router pages. "Nav" is how the route is reached: **Sidebar**, **Hidden** (no sidebar link), **Public**, or **Link** (reached from another screen). Overlay counts are dialogs/sheets declared on the page. Print means an on-screen print/PDF preview exists.

| # | Route | Page file | Nav | Main surface | Table cols | Overlays | Print | Risk |
|---|---|---|---|---|---|---|---|---|
| 1 | `/` | [page.tsx](../frontend/app/page.tsx) | Public | Redirect splash | — | — | — | Low |
| 2 | `/login` | [page.tsx](../frontend/app/login/page.tsx) | Public | Auth card, banners, footer | — | — | — | Medium |
| 3 | `/dashboard` | [page.tsx](../frontend/app/dashboard/page.tsx) | Sidebar | 4 KPIs, 2 charts, 3 feeds | — | Shell dialogs | — | Medium |
| 4 | `/analytics/targets` | [page.tsx](../frontend/app/analytics/targets/page.tsx) | Sidebar | KPIs, filters, ledger | 7 | 2 dialogs | — | High |
| 5 | `/analytics/territories` | [page.tsx](../frontend/app/analytics/territories/page.tsx) | Sidebar | KPIs, charts, table, drill-down | 9 | 1 dialog | — | High |
| 6 | `/field-force/zones` | [page.tsx](../frontend/app/field-force/zones/page.tsx) | Sidebar | KPIs, table, allocation sheet | 7 | 2 dialogs + 1 sheet | — | Medium |
| 7 | `/doctors/database` | [page.tsx](../frontend/app/doctors/database/page.tsx) | Sidebar | KPIs, table, portfolio sheet | 8 | 3 dialogs + 1 sheet | — | High |
| 8 | `/field-force/visit-logs` | [page.tsx](../frontend/app/field-force/visit-logs/page.tsx) | Sidebar | KPIs, filters, call ledger | 8 | 2 dialogs | Yes | High |
| 9 | `/doctors/timeline` | [page.tsx](../frontend/app/doctors/timeline/page.tsx) | Hidden | KPIs, timeline feed | — | — | — | Low |
| 10 | `/field-force/approvals` | [page.tsx](../frontend/app/field-force/approvals/page.tsx) | Hidden | KPIs, approval queue | 7 | 1 dialog | — | Low |
| 11 | `/inventory/ledger` | [page.tsx](../frontend/app/inventory/ledger/page.tsx) | Sidebar | KPIs, 4 filters, batch ledger | 10 | 4 dialogs | Batch passport | High |
| 12 | `/inventory/adjustments` | [page.tsx](../frontend/app/inventory/adjustments/page.tsx) | Sidebar | KPIs, table, printable slip | 8 | 2 dialogs | Yes | High |
| 13 | `/logistics/orders` | [page.tsx](../frontend/app/logistics/orders/page.tsx) | Sidebar | KPIs, order ledger, invoice preview | 9 | 2 dialogs | Yes | Critical |
| 14 | `/sales/clients` | [page.tsx](../frontend/app/sales/clients/page.tsx) | Sidebar | KPIs, 7-column master table, sheets | 7 | 2 dialogs + 1 sheet | — | High |
| 15 | `/finance/overview` | [page.tsx](../frontend/app/finance/overview/page.tsx) | Sidebar | KPIs, charts, ledger, statement | 7 | 2 dialogs | Yes | Critical |
| 16 | `/finance/bank-ledger` | [page.tsx](../frontend/app/finance/bank-ledger/page.tsx) | Sidebar | KPIs, accounts, journal, voucher | 8 | 4 dialogs | Yes | High |
| 17 | `/finance/collections` | [page.tsx](../frontend/app/finance/collections/page.tsx) | Sidebar | KPIs, tabs, 10-column ledger | 10 | 4 dialogs | Yes | High |
| 18 | `/finance/payments` | [page.tsx](../frontend/app/finance/payments/page.tsx) | Sidebar | KPIs, tabs, voucher ledger | 7 | 3 dialogs | Yes | High |
| 19 | `/finance/supplier-payments` | [page.tsx](../frontend/app/finance/supplier-payments/page.tsx) | Sidebar | Settlement KPIs, bills + register | 8 / 7 | 1 dialog | — | Medium |
| 20 | `/procurement/orders` | [page.tsx](../frontend/app/procurement/orders/page.tsx) | Sidebar | KPIs, PO ledger, voucher, directories | 9 | 8 dialogs | Yes | Critical |
| 21 | `/procurement/suppliers/[id]` | [page.tsx](<../frontend/app/procurement/suppliers/[id]/page.tsx>) | Link | Supplier profile, tabs, tables | 5 / 4 | — | — | Medium |
| 22 | `/hr/staff-directory` | [page.tsx](../frontend/app/hr/staff-directory/page.tsx) | Sidebar | KPIs, roster, dossier sheet/print | 9 | 4 dialogs + 1 sheet | Yes | High |
| 23 | `/hr/salary` | [page.tsx](../frontend/app/hr/salary/page.tsx) | Sidebar | KPIs, payroll ledger, payslip | 8 | 4 dialogs | Yes | High |
| 24 | `/settings/rbac` | [page.tsx](../frontend/app/settings/rbac/page.tsx) | Sidebar | KPIs, tabs, permission matrix | 6 / 6 | 2 dialogs | — | High |
| 25 | `/settings/audit-logs` | [page.tsx](../frontend/app/settings/audit-logs/page.tsx) | Sidebar | KPIs, filters, audit ledger, drawer | 8 | 3 dialogs + 1 sheet | Yes | High |

**Routes requiring a second path to reach:** `/doctors/timeline` and `/field-force/approvals` are outside the sidebar and `ROUTE_FEATURES`; test them by direct URL. `/procurement/suppliers/[id]` is reached from the supplier-payments bills/register tables, and must also be tested by direct URL and refresh.

**State routes to include:** `/login?expired=1`, `/login?from=/procurement/orders`, `/dashboard?unauthorized=rbac`, a nonexistent path such as `/foo`, and the in-shell 403 panel (sign in with a role that lacks `view` for a module).

## 4. Test matrix

### 4.1 Device classes

| Class | Viewports (CSS px) | Why these |
|---|---|---|
| Mobile | 320×568, 360×640, 390×844, 430×932 | 320 is the reflow floor; 360 is the Android baseline; 390/430 are common iPhones. |
| Mobile landscape | 667×375, 844×390 | Short height exposes dialogs without `max-h` and the sticky header. |
| Tablet | 768×1024, 834×1112, 1024×768 | 768 is the sidebar sheet/desktop cliff; 1024 is the small-laptop boundary. |
| Desktop | 1280×800, 1440×900, 1920×1080 | 1440 is the reference; 1920 exposes max-width and full-bleed containers. |
| Optional | 2560×1440 | Ultrawide check for `/finance/supplier-payments` and supplier details. |

Use DPR 2 for mobile/tablet screenshots and DPR 1 for desktop. Test one desktop pass at 125% OS scaling. Test one tablet pass with the sidebar expanded and one with it collapsed.

### 4.2 Browsers

| Engine | Use |
|---|---|
| Chrome or Edge | Primary sweep and DevTools device emulation. |
| Firefox | Second engine for table overflow, dialogs, and date inputs. |
| Safari (real iPhone/iPad if available) | Required for input auto-zoom, sheet height, and `100vh` behavior. |
| Android Chrome (real device if available) | Touch targets, virtual keyboard, and table scroll. |

### 4.3 Zoom and reflow

- 125% and 200% at 1280px.
- 400% at 1280px (320 CSS px) on `/dashboard`, `/doctors/database`, `/logistics/orders`, `/finance/overview`, `/procurement/orders`, `/settings/rbac`.
- Android font scaling / iOS Dynamic Type at one step above default on `/login` and one table screen.

### 4.4 Roles and sessions

| Role | Purpose |
|---|---|
| Super Administrator (`superadmin@pharma.com` after seed) | Full shell, all cards, all actions. |
| Operations role with broad read + limited write | Hidden create/edit/delete buttons, permission-filtered KPIs. |
| Narrow role (one or two modules) | Sidebar length, hidden groups, 403 panel, empty dashboard cards. |
| Expired/cleared session | `/login?expired=1` and the `apiFetch` redirect path. |

### 4.5 Data states

Seed or create enough data to exercise each state. Do not use production data for long-string tests.

| State | How to force | Where it matters |
|---|---|---|
| Loading | Throttle to Slow 3G or block the API briefly | Every list, dashboard, RBAC |
| Empty | Filter to a term with no matches; use a fresh role | Every table, dashboard feeds |
| Single row | Filter to one known record | Tables, pagination |
| Many rows | 12+ rows per module | Pagination, page-size changes |
| Long text | 60+ character names, addresses, drug names, role names | Headers, cards, table cells, dialogs |
| Large money | Amounts ≥ ৳10,00,00,000 | KPI cards, table totals, print totals |
| Error | Stop the backend or force a 500 | List error toasts, inline banners |
| 403 | Restricted role opens a module by URL | Layout access-denied panel |
| 404 | `/procurement/suppliers/does-not-exist` and `/foo` | Supplier not-found, Next 404 |
| Print | Open every print preview | Invoices, vouchers, payslips, dossiers |

**Minimum data for this audit:** 12+ doctors, 12+ clients, 12+ visit logs, 12+ stock batches, 6+ sales orders across all statuses, 6+ purchase orders across all statuses, 2+ bank accounts, 12+ bank transactions, 12+ collections, 12+ payments, 8+ staff, 2 months of salary records, 10+ audit events, and 2+ suppliers with open bills.

## 5. Execution log — 11 Nov 2026

This pass fixed the shared responsive layer and the highest-risk page regions found by static inspection. The per-route sweep described above is still the remaining work; use the route table in section 3 as the tracker.

### Completed

| Area | Change | Main files |
|---|---|---|
| Shell header | Title truncates, profile text hides below `md`, avatar stays, tighter mobile padding | [layout.tsx](../frontend/app/layout.tsx) |
| Sidebar | Auto-collapses to the icon rail below 1024px; mobile remains a sheet | [sidebar.tsx](../frontend/components/ui/sidebar.tsx) |
| Page frame | `p-4 sm:p-6 md:p-8` content gutters | [layout.tsx](../frontend/app/layout.tsx) |
| Dialogs | Base max-height `100dvh - 2rem`, internal scroll, mobile gutter, no edge-to-edge overrides | [dialog.tsx](../frontend/components/ui/dialog.tsx) |
| Tables | Visible horizontal scrollbar and contained overscroll | [table.tsx](../frontend/components/ui/table.tsx), [globals.css](../frontend/app/globals.css) |
| Pagination | Wraps instead of overflowing at 320px | [pagination.tsx](../frontend/components/ui/pagination.tsx) |
| Forms | Two/three-column rows stack below `sm`; login inputs are 16px on mobile | Page dialogs, [login/page.tsx](../frontend/app/login/page.tsx) |
| Page headers | Action rows wrap at tablet widths; long title+badge groups wrap | 15 page files |
| Print previews | Invoice, PO voucher, annual statement, bank voucher, payslip, dossier, receipt and payment voucher now stack or scroll instead of clipping | Logistics, procurement, finance, HR, inventory pages |
| Wide containers | Supplier payments and supplier details cap at 1360px | [supplier-payments/page.tsx](../frontend/app/finance/supplier-payments/page.tsx), [suppliers/[id]/page.tsx](<../frontend/app/procurement/suppliers/[id]/page.tsx>) |
| iOS inputs | 16px control font below 640px prevents Safari auto-zoom | [globals.css](../frontend/app/globals.css) |

### Verification

- `tsc --noEmit --incremental false` passes.
- `next build` passes; all 25 routes generate.
- Production smoke test: `/login` returns 200; `/` and `/dashboard` redirect to `/login` for an anonymous session.
- Headless screenshots at 390×844, 768×1024, and 1440×900 confirm: header title/avatar fit, profile text hides on mobile, the mobile sidebar is a sheet, the tablet sidebar is in icon mode, and dashboard KPIs reflow 1/2/4.

### Remaining before sign-off

- Run the full dialog and print-preview sweep with seeded data at 320, 390, 768, 1024, and 1440.
- Verify table scroll affordance and row actions on a real touch device; consider a sticky actions column for the widest ledgers.
- Check chart legends and ticks at 320px (`/dashboard`, `/analytics/territories`, `/finance/overview`).
- Re-check `sm:max-w-2xl` dialog gutters in the 640–703px range.
- Test iOS Safari input focus, virtual keyboard, and landscape dialogs on a real device.
- Confirm A4 print output after the preview changes.
