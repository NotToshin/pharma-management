"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  LineChart,
  UserCheck,
  Clock,
  Map,
  UserSquare2,
  FileSpreadsheet,
  BarChart3,
  Building2,
  SlidersHorizontal,
  Package,
  Truck,
  Store,
  Wallet,
  Receipt,
  Users2,
  Settings,
  ChevronsUpDown,
  ChevronRight,
  LogOut,
  Sparkles,
  ShieldCheck,
  Shield,
  User,
  X,
} from "lucide-react"
import { logout, getStoredUser, isUserSuperAdmin } from "@/lib/auth"
import { getEndpoint } from "@/lib/api"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface NavSubItem {
  title: string
  href: string
  superAdminOnly?: boolean
}

interface NavItem {
  title: string
  icon: any
  href?: string
  defaultOpen?: boolean
  subItems?: NavSubItem[]
  badge?: string
}

interface NavSection {
  group: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    group: "OVERVIEW & ANALYTICS",
    items: [
      {
        title: "Dashboard",
        icon: LayoutDashboard,
        href: "/dashboard",
      },
      {
        title: "Target & Territory Management",
        icon: LineChart,
        defaultOpen: true,
        subItems: [
          { title: "Target Vs Achievement", href: "/analytics/targets" },
          {
            title: "Territory Sales Breakdown",
            href: "/analytics/territories",
          },
          { title: "MIO Zone Allocation", href: "/field-force/zones" },
        ],
      },
    ],
  },
  {
    group: "DOCTOR MANAGEMENT",
    items: [
      {
        title: "Doctors List",
        icon: UserSquare2,
        href: "/doctors/database",
      },
      {
        title: "Doctor Visit Logs",
        icon: Clock,
        href: "/field-force/visit-logs",
      },
    ],
  },
  {
    group: "INVENTORY & WAREHOUSE",
    items: [
      {
        title: "Stock Inventory",
        icon: BarChart3,
        href: "/inventory/ledger",
      },
      {
        title: "Stock Adjustments",
        icon: SlidersHorizontal,
        href: "/inventory/adjustments",
      },
    ],
  },
  {
    group: "SALES & DELIVERIES",
    items: [
      {
        title: "Delivery Logistics",
        icon: Truck,
        defaultOpen: true,
        subItems: [
          { title: "Sales Orders", href: "/logistics/orders" },
          { title: "Receive Stock Delivery Log", href: "/logistics/batch-log" },
        ],
      },
      {
        title: "Pharmacy Clients",
        icon: Store,
        href: "/sales/clients",
        badge: "12",
      },
    ],
  },
  {
    group: "FINANCE & TREASURY",
    items: [
      {
        title: "Accounts & Cash",
        icon: Wallet,
        defaultOpen: true,
        subItems: [
          { title: "Treasury Overview", href: "/finance/overview" },
          { title: "Bank Accounts Ledger", href: "/finance/bank-ledger" },
        ],
      },
      {
        title: "Transactions",
        icon: Receipt,
        defaultOpen: true,
        subItems: [
          { title: "Delivery Cash Collections", href: "/finance/collections" },
          { title: "Supplier Payments", href: "/finance/supplier-payments" },
          { title: "Buyer Payments", href: "/finance/buyer-payments" },
          { title: "Wholesale Purchase Orders", href: "/procurement/orders" },
          { title: "Payments", href: "/finance/payments" },
        ],
      },
    ],
  },
  {
    group: "HR & SYSTEM CONTROL",
    items: [
      {
        title: "Team & Payroll",
        icon: Users2,
        defaultOpen: true,
        subItems: [
          { title: "Staff Directory & Roles", href: "/hr/staff-directory" },
          { title: "Salary", href: "/hr/salary" },
        ],
      },
      {
        title: "System Settings",
        icon: Settings,
        defaultOpen: true,
        subItems: [
          {
            title: "Role Permissions (RBAC)",
            href: "/settings/rbac",
          },
          {
            title: "Audit Logs (21 CFR Compliant)",
            href: "/settings/audit-logs",
          },
        ],
      },
    ],
  },
]

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  onOpenAccount?: () => void
  onOpenPrivileges?: () => void
}

export function AppSidebar({ onOpenAccount, onOpenPrivileges, ...props }: AppSidebarProps) {
  const pathname = usePathname()
  const { state, isMobile, setOpenMobile } = useSidebar()
  const isCollapsed = state === "collapsed" && !isMobile
  const [currentUser, setCurrentUser] = React.useState<{
    name: string
    email: string
    role?: string
    avatar?: string
    permissions?: any[]
  } | null>(null)
  const [totalClientsCount, setTotalClientsCount] = React.useState<number | string>(12)

  // Explicit helper to close mobile sheet immediately
  const closeMobileNav = React.useCallback(() => {
    setOpenMobile(false)
  }, [setOpenMobile])

  // Auto-close mobile drawer on route transition
  React.useEffect(() => {
    closeMobileNav()
  }, [pathname, closeMobileNav])

  const isSuperAdmin = React.useMemo(() => {
    if (!currentUser) return false
    return isUserSuperAdmin({
      id: "",
      name: currentUser.name,
      email: currentUser.email,
      role: currentUser.role || "",
      roleName: currentUser.role || "",
    })
  }, [currentUser])

  const hasRbacPermission = React.useMemo(() => {
    if (isSuperAdmin) return true
    if (!currentUser?.permissions || !Array.isArray(currentUser.permissions)) return false
    const rbacPerm = currentUser.permissions.find((p: any) => {
      if (!p) return false
      const mod = (p.module || "").toLowerCase()
      return mod.includes("role permission") || mod.includes("rbac")
    })
    return Boolean(rbacPerm && (rbacPerm.read || rbacPerm.create || rbacPerm.edit))
  }, [isSuperAdmin, currentUser])

  const canAccessRoute = React.useCallback(
    (href?: string, title?: string) => {
      if (isSuperAdmin) return true
      if (!href) return true

      // RBAC route permission check: only super admin OR users with explicit RBAC permission
      if (href === "/settings/rbac" || href.startsWith("/settings/rbac")) {
        return hasRbacPermission
      }

      const permissions = currentUser?.permissions || []
      if (permissions.length === 0) return true // default allow if permissions not yet loaded

      const perm = permissions.find((p: any) => {
        if (!p) return false
        const modTitle = (p.module || "").toLowerCase()
        const checkTitle = (title || "").toLowerCase()
        if (checkTitle && modTitle.includes(checkTitle)) return true
        if (checkTitle && checkTitle.includes(modTitle)) return true

        if (href === "/dashboard" && modTitle.includes("dashboard")) return true
        if (href.startsWith("/analytics/targets") && (modTitle.includes("target") || modTitle.includes("territory"))) return true
        if (href.startsWith("/analytics/territories") && (modTitle.includes("territory") || modTitle.includes("target"))) return true
        if (href.startsWith("/field-force/zones") && (modTitle.includes("zone") || modTitle.includes("territory") || modTitle.includes("target") || modTitle.includes("mio"))) return true
        if (href.startsWith("/doctors/database") && (modTitle.includes("doctor") || modTitle.includes("database") || modTitle.includes("list"))) return true
        if (href.startsWith("/doctors/new") && modTitle.includes("add new doctor")) return true
        if (href.startsWith("/doctors/ranking") && modTitle.includes("ranking")) return true
        if (href.startsWith("/doctors/timeline") && modTitle.includes("timeline")) return true
        if (href.startsWith("/field-force/visit-logs") && (modTitle.includes("visit") || modTitle.includes("dcr") || modTitle.includes("call"))) return true
        if (href.startsWith("/field-force/tour-plans") && modTitle.includes("tour")) return true
        if (href.startsWith("/field-force/approvals") && modTitle.includes("approval")) return true
        if (href.startsWith("/field-force/samples") && modTitle.includes("sample")) return true
        if (href.startsWith("/field-force/routes") && modTitle.includes("route")) return true
        if (href.startsWith("/inventory/ledger") && (modTitle.includes("inventory") || modTitle.includes("stock") || modTitle.includes("fefo") || modTitle.includes("ledger"))) return true
        if (href.startsWith("/inventory/adjustments") && (modTitle.includes("adjustment") || modTitle.includes("stock"))) return true
        if (href.startsWith("/procurement/orders") && (modTitle.includes("purchase") || modTitle.includes("procurement") || modTitle.includes("order") || modTitle.includes("wholesale") || modTitle.includes("transaction"))) return true
        if (href.startsWith("/inventory/expiry") && modTitle.includes("expiry")) return true
        if (href.startsWith("/procurement/batch-logs") && modTitle.includes("batch log")) return true
        if (href.startsWith("/logistics/orders") && modTitle.includes("delivery logistics")) return true
        if (href.startsWith("/logistics/batch-log") && modTitle.includes("stock delivery log")) return true
        if (href.startsWith("/sales/clients") && modTitle.includes("pharmacy clients")) return true
        if (href.startsWith("/finance/overview") && modTitle.includes("treasury")) return true
        if (href.startsWith("/finance/bank-ledger") && modTitle.includes("bank accounts")) return true
        if (href.startsWith("/finance/collections") && modTitle.includes("cash collections")) return true
        if (href.startsWith("/finance/payments") && modTitle.includes("payments") && !modTitle.includes("supplier") && !modTitle.includes("buyer")) return true
        if (href.startsWith("/finance/supplier-payments") && modTitle.includes("supplier payment")) return true
        if (href.startsWith("/finance/buyer-payments") && modTitle.includes("buyer payment")) return true
        if (href.startsWith("/hr/staff-directory") && modTitle.includes("staff directory")) return true
        if (href.startsWith("/hr/salary") && modTitle.includes("salary")) return true
        if (href.startsWith("/settings/audit-logs") && modTitle.includes("audit logs")) return true
        return false
      })

      if (perm) {
        return Boolean(perm.read)
      }

      return true
    },
    [isSuperAdmin, currentUser, hasRbacPermission]
  )

  const fetchClientCount = React.useCallback(async () => {
    try {
      const res = await fetch(getEndpoint("/clients?limit=1")).catch(() => null)
      if (res && res.ok) {
        const json = await res.json()
        if (json.meta && typeof json.meta.total === "number") {
          setTotalClientsCount(json.meta.total)
        } else if (Array.isArray(json.data)) {
          setTotalClientsCount(json.data.length)
        }
      }
    } catch {
      // keep fallback
    }
  }, [])

  React.useEffect(() => {
    const user = getStoredUser()
    if (user) {
      setCurrentUser({
        name: user.name || "Administrator",
        email: user.email || "admin@akpharma.com",
        role: user.role || user.roleName || (user as any).roleCode || "",
        avatar: user.avatar || "",
        permissions: user.permissions || [],
      })
    }

    fetchClientCount()

    const handleUpdate = () => fetchClientCount()
    if (typeof window !== "undefined") {
      window.addEventListener("clients-updated", handleUpdate)
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("clients-updated", handleUpdate)
      }
    }
  }, [fetchClientCount])

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-slate-200 bg-white"
      {...props}
    >
      {/* 1. Brand Header */}
      <SidebarHeader className="shrink-0 border-b border-slate-100 p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center justify-between w-full">
              <SidebarMenuButton
                size="lg"
                className="transition-colors hover:bg-slate-50 flex-1"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#23496D] shadow-xs">
                  <svg
                    viewBox="0 0 105 72"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-auto"
                  >
                    <path d="M38 4L4 68H26L42 36H56L38 4Z" fill="#FFFFFF" />
                    <path d="M56 4L39 39L57 68H74L60 34L71 4H56Z" fill="#FFFFFF" />
                    <path d="M60 34L98 4H78L52 44L80 68H102L67 37L60 34Z" fill="#7DD3FC" />
                  </svg>
                </div>
                <div className="ml-2 grid flex-1 text-left text-xs leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-extrabold tracking-tight text-[#23496D]">
                    AK PHARMA
                  </span>
                  <span className="truncate text-[10px] font-medium text-slate-500">
                    Smart Solutions for Healthier Living
                  </span>
                </div>
              </SidebarMenuButton>
              {isMobile && (
                <button
                  type="button"
                  onClick={() => setOpenMobile(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer mr-1"
                  aria-label="Close menu"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* 2. Scrollable Navigation Content with Draggable Scrollbar */}
      <SidebarContent
        onClick={(e) => {
          const target = e.target as HTMLElement
          if (target.closest("a")) {
            closeMobileNav()
          }
        }}
        className="draggable-scrollbar min-h-0 flex-1 gap-2 overscroll-contain px-2 py-2 focus:outline-none"
      >
        {navSections.map((section) => {
          const visibleItems = section.items.filter((item) => {
            const subItems = item.subItems || []
            if (subItems.length > 0) {
              const visibleSubs = subItems.filter(
                (sub) => canAccessRoute(sub.href, sub.title)
              )
              return visibleSubs.length > 0
            }
            return canAccessRoute(item.href, item.title)
          })

          if (visibleItems.length === 0) return null

          return (
            <SidebarGroup key={section.group} className="py-1">
              <SidebarGroupLabel className="mb-1 px-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase group-data-[collapsible=icon]:hidden">
                {section.group}
              </SidebarGroupLabel>
              <SidebarMenu className="gap-1">
                {visibleItems.map((item) => {
                  const subItems = (item.subItems || []).filter(
                    (sub) => canAccessRoute(sub.href, sub.title)
                  )
                  const hasSub = subItems.length > 0
                  const isSubActive =
                    hasSub && subItems.some((sub) => pathname === sub.href)
                  const isDirectActive = item.href
                    ? pathname === item.href
                    : false

                  // When collapsed in icon mode on PC/Tablet: render floating Dropdown flyout
                  if (hasSub && isCollapsed) {
                    return (
                      <SidebarMenuItem key={item.title}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <SidebarMenuButton
                              isActive={isSubActive}
                              tooltip={item.title}
                              className={`h-9 w-9 justify-center p-0 rounded-md transition-colors ${
                                isSubActive
                                  ? "bg-slate-100 font-semibold text-slate-900"
                                  : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                              }`}
                            >
                              <item.icon className="h-4 w-4 shrink-0 text-slate-600" />
                              <span className="sr-only">{item.title}</span>
                            </SidebarMenuButton>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            side="right"
                            align="start"
                            sideOffset={10}
                            className="w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl z-50 animate-in fade-in-50 zoom-in-95"
                          >
                            <DropdownMenuLabel className="px-2.5 py-1.5 text-xs font-bold text-slate-900 border-b border-slate-100 mb-1">
                              {item.title}
                            </DropdownMenuLabel>
                            <DropdownMenuGroup>
                              {subItems.map((subItem, idx) => {
                                const isActive = pathname === subItem.href
                                return (
                                  <DropdownMenuItem
                                    key={`${subItem.title}-${idx}`}
                                    asChild
                                    className="p-0 cursor-pointer"
                                  >
                                    <Link
                                      href={subItem.href}
                                      onClick={closeMobileNav}
                                      className={`flex w-full items-center rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                                        isActive
                                          ? "bg-slate-100 font-semibold text-slate-900"
                                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                      }`}
                                    >
                                      {subItem.title}
                                    </Link>
                                  </DropdownMenuItem>
                                )
                              })}
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </SidebarMenuItem>
                    )
                  }

                  if (hasSub) {
                    return (
                      <Collapsible
                        key={item.title}
                        defaultOpen={item.defaultOpen || isSubActive}
                        className="group/collapsible"
                      >
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                              tooltip={item.title}
                              className="min-h-[42px] sm:min-h-[36px] w-full justify-between px-3 sm:px-2 text-sm sm:text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 cursor-pointer rounded-lg"
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                <item.icon className="h-4 w-4 shrink-0 text-slate-600" />
                                <span className="truncate group-data-[collapsible=icon]:hidden">
                                  {item.title}
                                </span>
                              </div>
                              <ChevronRight className="h-4 w-4 sm:h-3.5 sm:w-3.5 shrink-0 text-slate-400 transition-transform duration-200 group-data-[collapsible=icon]:hidden group-data-[state=open]/collapsible:rotate-90" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="group-data-[collapsible=icon]:hidden">
                            <SidebarMenuSub className="mx-2 space-y-1 border-l border-slate-200 py-1 pl-3.5">
                              {subItems.map((subItem, idx) => {
                                const isActive = pathname === subItem.href
                                return (
                                  <SidebarMenuSubItem
                                    key={`${subItem.title}-${idx}`}
                                  >
                                    <SidebarMenuSubButton
                                      asChild
                                      isActive={isActive}
                                      className={`min-h-[38px] sm:min-h-[30px] text-[13px] sm:text-xs px-3 sm:px-2.5 py-1.5 transition-colors rounded-md ${
                                        isActive
                                          ? "bg-slate-100 font-semibold text-slate-900"
                                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                      }`}
                                    >
                                      <Link
                                        href={subItem.href}
                                        onClick={closeMobileNav}
                                        className="w-full flex items-center"
                                      >
                                        <span className="leading-snug whitespace-nowrap">
                                          {subItem.title}
                                        </span>
                                      </Link>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                )
                              })}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    )
                  }

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isDirectActive}
                        tooltip={item.title}
                        className={`min-h-[42px] sm:min-h-[36px] w-full justify-between rounded-lg px-3 sm:px-2 text-sm sm:text-xs font-medium transition-colors ${
                          isDirectActive
                            ? "bg-slate-100 font-semibold text-slate-900"
                            : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        <Link
                          href={item.href || "#"}
                          onClick={closeMobileNav}
                          className="flex w-full items-center justify-between"
                        >
                          <div className="flex items-center gap-2.5">
                            <item.icon className="h-4 w-4 shrink-0 text-slate-600" />
                            <span className="group-data-[collapsible=icon]:hidden">
                              {item.title}
                            </span>
                          </div>
                          {item.title === "Pharmacy Clients" ? (
                            <span className="pr-1 text-xs font-medium text-blue-500/90 group-data-[collapsible=icon]:hidden">
                              {totalClientsCount}
                            </span>
                          ) : (item as any).badge ? (
                            <span className="pr-1 text-xs font-medium text-slate-400 group-data-[collapsible=icon]:hidden">
                              {(item as any).badge}
                            </span>
                          ) : null}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroup>
          )
        })}
      </SidebarContent>

      {/* 3. User Dropdown Footer */}
      <SidebarFooter className="shrink-0 border-t border-slate-100 p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="transition-colors hover:bg-slate-50 cursor-pointer min-h-[44px]"
                >
                  <Avatar className="h-8 w-8 shrink-0 rounded-lg border border-slate-200">
                    <AvatarImage
                      src={currentUser?.avatar || "/avatar.png"}
                      alt={currentUser?.name || "Operator"}
                    />
                    <AvatarFallback className="rounded-lg bg-indigo-600 text-xs font-semibold text-white">
                      {currentUser?.name
                        ? currentUser.name.slice(0, 2).toUpperCase()
                        : "AP"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-2 grid flex-1 text-left text-xs leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-semibold text-slate-900">
                      {currentUser?.name || "Super Administrator"}
                    </span>
                    <span className="truncate font-mono text-[10px] text-slate-500">
                      {currentUser?.email || "superadmin@pharma.com"}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto h-3.5 w-3.5 text-slate-400 group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-60 rounded-xl border border-slate-200 bg-white p-1.5 text-xs shadow-xl"
                side={isCollapsed ? "right" : "top"}
                align={isCollapsed ? "end" : "start"}
                sideOffset={8}
              >
                <DropdownMenuLabel className="p-2 font-normal">
                  <div className="flex items-center gap-2.5 text-left">
                    <Avatar className="h-9 w-9 rounded-lg border border-slate-200 shrink-0">
                      <AvatarImage
                        src={currentUser?.avatar || "/avatar.png"}
                        alt={currentUser?.name || "Operator"}
                      />
                      <AvatarFallback className="rounded-lg bg-indigo-600 text-xs font-semibold text-white">
                        {currentUser?.name
                          ? currentUser.name.slice(0, 2).toUpperCase()
                          : "AP"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-xs leading-tight min-w-0">
                      <span className="truncate font-bold text-slate-900">
                        {currentUser?.name || "Super Administrator"}
                      </span>
                      <span className="truncate font-mono text-[10px] text-slate-500">
                        {currentUser?.email || "superadmin@pharma.com"}
                      </span>
                      <span className="mt-0.5 truncate text-[10px] font-medium text-indigo-600">
                        {currentUser?.role || "SUPERADMIN"}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-1 bg-slate-100" />

                {/* Account Overview Dialog trigger */}
                <DropdownMenuItem
                  onClick={() => {
                    closeMobileNav()
                    onOpenAccount?.()
                  }}
                  className="cursor-pointer gap-2.5 rounded-lg py-2 px-2.5 text-slate-700 hover:bg-slate-50 focus:bg-slate-50 text-xs"
                >
                  <User className="h-4 w-4 text-slate-500" />
                  <span>Account Overview</span>
                </DropdownMenuItem>

                {/* Role Privileges Dialog trigger */}
                <DropdownMenuItem
                  onClick={() => {
                    closeMobileNav()
                    onOpenPrivileges?.()
                  }}
                  className="cursor-pointer gap-2.5 rounded-lg py-2 px-2.5 text-slate-700 hover:bg-slate-50 focus:bg-slate-50 text-xs"
                >
                  <Shield className="h-4 w-4 text-[#0090FF]" />
                  <span>Role Privileges & Scope</span>
                </DropdownMenuItem>

                {/* RBAC link if permitted */}
                {hasRbacPermission && (
                  <DropdownMenuItem
                    asChild
                    className="cursor-pointer gap-2.5 rounded-lg py-2 px-2.5 text-slate-700 hover:bg-slate-50 focus:bg-slate-50 text-xs"
                  >
                    <Link href="/settings/rbac" onClick={closeMobileNav}>
                      <ShieldCheck className="h-4 w-4 text-indigo-600" />
                      <span>RBAC Security Matrix</span>
                    </Link>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator className="my-1 bg-slate-100" />

                {/* Log out */}
                <DropdownMenuItem
                  onClick={() => logout()}
                  className="cursor-pointer gap-2.5 rounded-lg py-2 px-2.5 font-semibold text-rose-600 hover:bg-rose-50 focus:bg-rose-50 focus:text-rose-600 text-xs"
                >
                  <LogOut className="h-4 w-4 text-rose-600" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
