# UI and UX Guidelines

Internal operations console: dense tables, compact controls, fixed sidebar. Tokens come from `frontend/app/globals.css`, `frontend/components.json`, and `frontend/app/layout.tsx`. How screens fetch and validate is in [FRONTEND_GUIDELINES.md](./FRONTEND_GUIDELINES.md).

shadcn style is `radix-nova`, base color `mist`, CSS variables on, Lucide icons, RTL off. Pages override primitives with white surfaces, `slate` text, `text-xs` labels, and `rounded-xl` or `rounded-2xl` panels. Canvas is `#FDFDFD`. Currency in copy is BDT (`৳` in some service messages). Do not restyle a screen into a marketing page. Logos are in `frontend/public/` and `components/ui/ak-logo.tsx`. The header has no wordmark.

## Color, type, and size

Light tokens in `:root` are OKLCH and mapped in `@theme inline`. Use the variables (`bg-background`, `text-foreground`, `border-border`, `bg-primary`) rather than copying new hex values. `--primary` is dark slate, not the brand blue. `--radius` is `0.625rem`. Sidebar width is `19rem`, collapsed `3.5rem`. Charts use `chart-1` through `chart-5`.

Colors used as classes, not tokens:

| Use | Class or hex |
|---|---|
| Affirmative action | `#0090FF`, hover `#0080e5` |
| Canvas | `#FDFDFD` |
| Shell text and borders | `slate-900`, `slate-500`, `border-slate-200`, `bg-white` |
| Avatar fallback | `bg-indigo-600` |
| Read or healthy | `emerald` |
| Edit or warning | `amber` |
| Delete, logout, denied | `rose` |
| Create or info | `blue` |

There is no success or warning CSS variable. Scrollbar colors are hard-coded slate in `.custom-scrollbar` and `.draggable-scrollbar`. Active drag is `#0090FF`.

Fonts: Geist on `--font-sans`, Geist Mono on `--font-mono`, loaded in `app/layout.tsx`. `--font-heading` is not assigned a family. Header title is `text-sm font-semibold`. Labels, buttons, and dialog inputs are `text-xs`. Emails and ids use `font-mono` at `text-[10px]` or `text-[11px]`. Dialog titles are `text-base font-bold`. Do not add a font.

No custom spacing scale. Header `h-14 px-6`. Main `p-6 md:p-8`. Dialog buttons and inputs `h-8`. `Button` sizes: default `h-8`, `xs` `h-6`, `sm` `h-7`, `lg` `h-9`. Dialogs use `rounded-2xl`. The button primitive uses `rounded-lg`.

## Layout and breakpoints

Authenticated shell: `AppSidebar` in `SidebarProvider` (default open, `19rem`) plus `SidebarInset` with a sticky header (`SidebarTrigger`, page title, profile menu) and `<main>`. Content is full width. Dialogs set `sm:max-w-[420px]` or `sm:max-w-[540px]`. Login has no sidebar. A 12-column grid is not defined. Short forms use `grid-cols-2`.

The only coded breakpoint is 768px in `frontend/hooks/use-mobile.ts`. Below that the sidebar is a sheet and closes on navigation. Tailwind `sm`/`md`/`lg` values are not overridden. The shell is desktop-first. Keep the `md:` split and avoid horizontal overflow.

Sidebar groups, in order: Overview & Analytics, Doctor Management, Inventory & Warehouse, Sales & Deliveries, Finance & Treasury, HR & System Control. Collapsible parents open for the current path. Items the user cannot view are omitted. The Pharmacy Clients badge comes from the API. Header menu: Account Overview, Role Privileges, Log out.

Dashboard and analytics pages use KPI cards and Recharts. Card visibility follows `overviewGrants` via `userCan(user, feature, "overview:<key>")`. A hidden card is a permission, not an empty state. Keys are in `backend/src/constants/moduleCatalog.ts`.

## Components

Import from `@/components/ui/...`.

- **Button.** Variants: `default`, `outline`, `secondary`, `ghost`, `destructive`, `link`. Dialog primary actions are usually `bg-[#0090FF]` or `bg-slate-900`, not `variant="default"`. Cancel is `outline`. Logout and destructive confirms are rose. Disabled: `opacity-50`.
- **Input.** `h-8`, `rounded-lg`, `aria-invalid` uses the destructive border. Labels are `text-xs font-semibold text-slate-700`. Disabled fields use `bg-slate-50`. `Textarea`, `Label`, `Select`, and `Switch` are in `components/ui/`.
- **Card, dialog, sheet.** `Card` is `rounded-xl`. KPI blocks sometimes use bordered `div`s. Match the page. `Dialog` for create, edit, account, privileges, and delete. `Sheet` for wide editors such as purchase orders. `DropdownMenu` for profile actions. `Popover` with `Calendar` / `DatePicker` / `GlobalCalendar` for dates.
- **Delete.** Every delete uses `DeleteConfirmationModal`. Do not use `window.confirm`.
- **Table and badge.** `components/ui/table.tsx`. Dense rows, slate header, status badge, icon actions in the last column. No shared data grid. Badge colors follow the table above.
- **Feedback.** Toaster is `top-right`, `richColors`, `closeButton`. Mutations use `toast.loading` then `toast.success` or `toast.error` with the same id. Invalid forms show inline `formErrors` plus a toast. Empty and loading copy is written on each page. `Skeleton` exists. There is no shared empty-state illustration.
- **Boot.** “Loading...” then “Authenticating secure session...”. Forbidden module: rose panel, badge “Access Denied • 403 Forbidden”, link to `/dashboard`.

Form dialogs: `space-y-4` between fields, `space-y-1` under the label, two short fields in `grid grid-cols-2 gap-3`, actions in `DialogFooter`.

## Accessibility, motion, theme

Implemented: `lang="en"`, visible labels, `focus-visible` rings, `aria-invalid`, Radix keyboard behavior, tooltips on icon sidebar controls (`delayDuration={0}`). Not implemented: skip link, WCAG target, automated checks. Icon-only buttons need an `aria-label` or a tooltip.

Motion is `tw-animate-css`, sidebar `duration-200 ease-linear`, and a 1px button press. No Framer Motion. `disableTransitionOnChange` is set.

`.dark` tokens exist, including a violet sidebar primary. The layout forces light: `className` includes `light`, and `ThemeProvider` uses `forcedTheme="light"` and `enableSystem={false}`. A theme toggle is not in the header. Do not build a feature that depends on `.dark` until that force is removed. `/` uses `bg-slate-950` only while redirecting.

Stay on the light slate shell. One affirmative blue (`#0090FF`). Lucide at `h-4 w-4` in menus and `h-3.5 w-3.5` in compact buttons. Reuse `Button`, `Input`, `Dialog`, `Sheet`, `Table`, `Badge`, and `Select`. Add a sidebar group only when the module catalog adds a category.
