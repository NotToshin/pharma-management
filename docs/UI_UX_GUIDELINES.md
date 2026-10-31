# UI and UX Guidelines

The interface is an internal operations console: dense tables, compact controls, and a fixed sidebar. Visual decisions below come from `frontend/app/globals.css`, `frontend/components.json`, `frontend/app/layout.tsx`, and the shared components in `frontend/components/ui/`. Tokens that the code does not define are marked as undefined.

How to build the screens is in [FRONTEND_GUIDELINES.md](./FRONTEND_GUIDELINES.md).

## Design philosophy

The product reads as a light, slate-and-white admin tool with one action blue, `#0090FF`. shadcn/ui supplies the primitives (`components.json`: style `radix-nova`, base color `mist`, CSS variables on, icons from Lucide, RTL off).

Pages then override those primitives with Tailwind classes: white surfaces, `slate` text, `text-xs` labels, and `rounded-xl` or `rounded-2xl` panels. The shell background is `#FDFDFD`. Cards and dialogs are white with slate borders.

Brand marks live in `frontend/public/` (`logo.svg`, `horizontal-logo.svg`, `just-logo.svg`) and `frontend/components/ui/ak-logo.tsx`. The header does not show a wordmark. The sidebar carries the product identity.

Copy is operational and specific (“Delivery Cash Collections”, “FEFO Priority Dispatch”). Currency is BDT, often shown as `৳` in service messages. Do not restyle a screen into a marketing page.

## Color system

CSS variables are in `frontend/app/globals.css` under `:root` and `.dark`. They are OKLCH, not a hand-named palette. Tailwind v4 maps them in the `@theme inline` block (`--color-primary`, `--color-sidebar`, and the rest).

### Light tokens (`:root`)

These are the tokens the running shell uses.

| Token | Value | Typical use |
|---|---|---|
| `--background`, `--card`, `--popover` | `oklch(1 0 0)` | White surfaces |
| `--foreground`, `--card-foreground` | `oklch(0.148 0.004 228.8)` | Near-black text |
| `--primary` | `oklch(0.218 0.008 223.9)` | Default button fill (dark slate, not the brand blue) |
| `--primary-foreground` | `oklch(0.987 0.002 197.1)` | Text on primary |
| `--secondary`, `--muted` | `oklch(0.963 0.002 197.1)` | Quiet fills |
| `--muted-foreground` | `oklch(0.56 0.021 213.5)` | Secondary text |
| `--destructive` | `oklch(0.577 0.245 27.325)` | Destructive token |
| `--border`, `--input` | `oklch(0.925 0.005 214.3)` | Borders and inputs |
| `--ring` | `oklch(0.723 0.014 214.4)` | Focus ring |
| `--radius` | `0.625rem` | Base radius |
| `--sidebar` | `oklch(0.987 0.002 197.1)` | Sidebar surface |
| `--sidebar-width` | `19rem` | Expanded sidebar |
| `--sidebar-width-icon` | `3.5rem` | Collapsed sidebar |
| Chart 1–5 | cyan/teal OKLCH ramp | `chart-1` … `chart-5` |

### Colors used in class names but not as tokens

These appear repeatedly in layout and pages. They are conventions, not variables.

| Class or hex | Use |
|---|---|
| `#0090FF` | Brand action blue: save buttons, privilege shield, active scrollbar thumb, login spinner |
| `#0080e5` | Hover for that blue |
| `#FDFDFD` | Main canvas |
| `bg-white`, `border-slate-200`, `text-slate-900`, `text-slate-500` | Shell, header, menus |
| `bg-indigo-600` | Avatar fallback |
| `emerald` | Success and “Read” badges |
| `amber` | Edit or warning badges |
| `rose` | Delete, logout, access denied |
| `blue` | Informational badges and privilege panels |

A formal semantic scale (success, warning, info as CSS variables) is **undefined**. Use the Tailwind families already on the screen you are editing.

Scrollbar colors are hard-coded slate hexes in `globals.css` (`.custom-scrollbar`, `.draggable-scrollbar`). The active drag color is `#0090FF`.

## Typography

Fonts are loaded in `frontend/app/layout.tsx`:

| Font | CSS variable | Use |
|---|---|---|
| Geist (`next/font/google`) | `--font-sans` | `html` and `body` via `font-sans` |
| Geist Mono | `--font-mono` | Emails, ids, loading lines |

`--font-heading` is referenced in `@theme inline` and is **not** assigned a family. Headings use the sans font with weight and size utilities.

Observed scale, not a type ramp file:

| Role | Classes in the shell |
|---|---|
| Page title in the header | `text-sm font-semibold text-slate-900` |
| User name | `text-xs font-bold` |
| Meta, email, badges | `text-[10px]` or `text-[11px]`, often `font-mono` for emails |
| Dialog title | `text-base font-bold` |
| Denied-state title | `text-xl font-black tracking-tight` |
| Buttons and inputs | `text-xs` on app dialogs; primitive default is `text-sm` (`md:text-sm` on inputs) |

Do not add a second font. Prefer `text-xs` and `text-sm` over large display type inside the app shell.

## Spacing and sizing

There is no custom spacing scale. Tailwind’s default spacing is used.

| Element | Size in the shell |
|---|---|
| Header | `h-14`, horizontal `px-6` |
| Main | `p-6 md:p-8` |
| Buttons in dialogs | `h-8`, `text-xs` |
| Inputs in dialogs | `h-8` |
| Avatar in the header | `h-8 w-8` |
| Page gaps | `gap-2`, `gap-3`, `space-y-4` on forms |

`Button` sizes from `components/ui/button.tsx`: default `h-8`, `xs` `h-6`, `sm` `h-7`, `lg` `h-9`, icon squares at the same heights.

Radius tokens: `--radius-sm` through `--radius-4xl` are multiples of `--radius` (0.625rem). App dialogs usually set `rounded-2xl`. The button primitive uses `rounded-lg`.

## Layout

The authenticated shell is a horizontal row:

1. `AppSidebar` inside `SidebarProvider` (default open, width `19rem`).
2. `SidebarInset` with a sticky header and a scrolling `<main>`.

The header holds `SidebarTrigger`, the page title, and the profile menu. Content is not inside a centered max-width container. Tables and KPI grids stretch across the main area. Dialogs set their own max width (`sm:max-w-[420px]`, `sm:max-w-[540px]`).

Login (`frontend/app/login/page.tsx`) is a separate full-viewport layout with no sidebar.

A 12-column grid system is **undefined**. Pages use CSS grid utilities where they need columns (`grid-cols-2` on short forms, card grids on dashboards).

## Responsive behavior

The only breakpoint the application code defines is **768px**:

```typescript
const MOBILE_BREAKPOINT = 768
```

`frontend/hooks/use-mobile.ts` treats widths below 768 as mobile. The sidebar uses that hook: from `md` upward the sidebar is a column; below `md` it is a sheet and closes after navigation.

Tailwind’s `sm`, `md`, `lg`, `xl`, and `2xl` utilities appear in components. This repo does not override their pixel values. They are Tailwind v4 defaults. Do not document a custom breakpoint map.

`md:` is the split used by the shell (`p-6 md:p-8`, sidebar `md:block`). Layouts are desktop-first in practice: tables and multi-column KPI rows are designed for a wide canvas and stack only where a page added a responsive class. A written mobile-first standard is **not implemented**. New work should keep the sidebar sheet usable and avoid horizontal overflow, using the same `md:` split the shell already uses.

## Components

Import primitives from `@/components/ui/...`. Variants are `cva` on `Button` and similar files.

### Buttons

`Button` variants: `default`, `outline`, `secondary`, `ghost`, `destructive`, `link`.

In feature dialogs the primary action is often **not** the `default` variant. It is a class override: `bg-[#0090FF] text-white hover:bg-[#0080e5]` or `bg-slate-900 text-white`. Cancel is `variant="outline"`. Logout and destructive confirms use rose.

Focus style: `focus-visible:ring-3 focus-visible:ring-ring/50`. Disabled: `opacity-50` and `pointer-events-none`. Pressed: `translate-y-px`.

### Inputs

`Input` is `h-8` (overridden from the primitive’s `text-base` to `md:text-sm`), `rounded-lg`, transparent background, border `--input`. Focus uses the ring token. `aria-invalid` switches the border to destructive. File inputs are supported. Empty controlled values are normalized to `""` so React does not switch from uncontrolled to controlled.

`Textarea`, `Label`, `Select`, and `Switch` exist under `components/ui/`. Labels on app forms are `text-xs font-semibold text-slate-700`. Disabled identity fields use `bg-slate-50`.

### Cards

`Card` uses `rounded-xl`, `bg-card`, a faint foreground ring, and `--card-spacing`. Dashboard KPI blocks often use custom `div`s with borders instead of `Card`. Either is acceptable. Match the page you are editing.

### Dialogs, sheets, dropdowns

- `Dialog` for create, edit, account, privileges, and delete confirmation.
- `Sheet` for wider workflows such as the purchase order editor.
- `DropdownMenu` for the header profile and sidebar account actions.
- `Popover` for the date picker.

Dialog content in the shell is `rounded-2xl bg-white p-6`. Dropdowns are `rounded-xl border-slate-200 bg-white text-xs shadow-lg`.

`DeleteConfirmationModal` is required for every delete. It is a rose-accent dialog with confirm and cancel. Do not use `window.confirm`.

### Tables

`components/ui/table.tsx` is the table primitive. Feature pages render dense rows with slate headers, status badges, and icon buttons in the last column. Row hover and sticky header behavior are page-specific. A shared data-grid component is **undefined**.

### Badges

`Badge` marks status and permission chips. Color is applied at the call site:

- emerald for read or healthy
- blue for create
- amber for edit or pending
- rose for delete or hold

### Calendar

`Calendar`, `DatePicker`, and `GlobalCalendar` wrap `react-day-picker`. Use the existing date picker instead of a raw date string input when the surrounding page already does.

## Navigation and sidebar

`AppSidebar` groups:

1. Overview & Analytics
2. Doctor Management
3. Inventory & Warehouse
4. Sales & Deliveries
5. Finance & Treasury
6. HR & System Control

Parent rows with children use `Collapsible`. The group that contains the current path opens automatically. Active links use the sidebar accent styles from the sidebar component.

Items the user cannot view are omitted. The client-count badge on Pharmacy Clients is loaded from the API.

Collapse to icon width `3.5rem` on desktop. On viewports under 768px the sidebar is an overlay and closes on route change.

The header profile menu: Account Overview, Role Privileges, Log out.

## Dashboards

`frontend/app/dashboard/page.tsx` and the analytics pages use KPI cards plus Recharts. Chart colors should use `chart-1` through `chart-5` or the existing series on that page.

Card visibility can be limited by `overviewGrants` on the permission row (`userCan(user, feature, "overview:<key>")`). Keys are listed on each module in `backend/src/constants/moduleCatalog.ts`. Hiding a card the role did not grant is part of the design, not an empty-state bug.

## Forms and feedback

Form layout in dialogs:

- `space-y-4` between fields, `space-y-1` between label and control
- two short fields in `grid grid-cols-2 gap-3`
- primary action in `DialogFooter`, aligned to the end
- required controls use the HTML `required` attribute as well as Zod on the doctors and client flows

Feedback:

| Outcome | Pattern |
|---|---|
| Saving | Sonner `toast.loading` |
| Saved | `toast.success`, same toast id |
| Invalid form | Inline field errors where the page tracks them, plus `toast.error` |
| API error | `toast.error` with `message` |
| Delete | `DeleteConfirmationModal`, then a toast from the confirm handler |

Toaster configuration in the layout: `position="top-right"`, `richColors`, `closeButton`.

## Loading, empty, success, and error states

| State | What exists |
|---|---|
| App boot | Centered “Loading...” in `font-mono text-xs text-slate-400` |
| Auth check | “Authenticating secure session...” |
| Login pending | Spinner icon on the button |
| Login success | Inline green message, then redirect |
| Login failure | Inline alert with the API message |
| Module forbidden | Centered rose panel, badge “Access Denied • 403 Forbidden”, return button |
| List loading | Implemented per page (`Skeleton` is available) |
| Empty list | Implemented per page as muted text inside the table or card |
| Success | Green Sonner toast. No global success banner |
| Field error | Red helper text from `formErrors` on screens that set it |

A single empty-state illustration component is **undefined**.

## Accessibility

Implemented:

- `html lang="en"`
- Visible `Label` elements on shell forms
- `focus-visible` rings on buttons, inputs, and menu items
- `aria-invalid` styling on inputs
- Radix dialogs, dropdowns, and the sidebar expose keyboard behavior from the primitives
- Icon-only sidebar controls sit inside `TooltipProvider` (`delayDuration={0}`)
- Disabled buttons do not receive pointer events

Not implemented, so do not claim them:

- A skip link
- A documented WCAG target
- Automated axe checks
- A contrast pass on `#0090FF` against white (the blue is used as a fill with white text; verify contrast if you change it)
- Live regions besides Sonner

Icon-only buttons need an `aria-label` or a tooltip. Match buttons that already have one.

## Motion

`tw-animate-css` is imported in `globals.css`. The sidebar changes width over `duration-200 ease-linear`. Buttons move `1px` on press. The theme provider sets `disableTransitionOnChange`.

There is no Framer Motion. Do not add page-transition libraries. Keep new motion to Tailwind `transition-colors` or the existing 200ms sidebar timing.

## Dark and light mode

`.dark` overrides every color token in `globals.css`, including a violet `--sidebar-primary`. `next-themes` is installed. `ThemeProvider` contains a keydown handler that calls `setTheme`.

The root layout **forces light mode**:

- the `<html>` element always includes the class `light`
- `ThemeProvider` is rendered with `defaultTheme="light"`, `forcedTheme="light"`, and `enableSystem={false}`

The login route and the pre-mount shell do not mount `ThemeProvider`. They are also light (`bg-white` or the redirect screen’s `bg-slate-950` on `/` only).

Dark mode is therefore defined in CSS and not reachable in the authenticated app. Do not build a feature that depends on `.dark` until the layout stops forcing `light`. A theme toggle in the header is **undefined**.

## Consistency rules

- Stay on the light slate shell. Use `#0090FF` for the main affirmative action in a dialog, and `bg-slate-900` for neutral confirms such as Close.
- Use Lucide icons at `h-4 w-4` next to menu labels and `h-3.5 w-3.5` inside compact buttons.
- Use Sonner for mutation feedback and `DeleteConfirmationModal` for deletes.
- Keep new pages inside the sidebar groups that already exist. Add a group only when the module catalog adds a category.
- Reuse `Button`, `Input`, `Dialog`, `Sheet`, `Table`, `Badge`, and `Select` before writing new controls.
- Do not introduce a second blue, a new font, or a new radius for one screen.
