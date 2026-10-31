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
  ShoppingCart,
} from "lucide-react"
import { logout, getStoredUser } from "@/lib/auth"
import { featureForPath, userCan } from "@/lib/permissions"
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
  subItems?: NavSubItem[]
  badge?: string
}

interface NavSection {
  group: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    group: "Overview & Analytics",
    items: [
      {
        title: "Dashboard",
        icon: LayoutDashboard,
        href: "/dashboard",
      },
      {
        title: "Target & Territory Management",
        icon: LineChart,
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
    group: "Doctor Management",
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
    group: "Inventory & Warehouse",
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
    group: "Sales & Deliveries",
    items: [
      {
        title: "Sales Orders",
        icon: ShoppingCart,
        href: "/logistics/orders",
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
    group: "Finance & Treasury",
    items: [
      {
        title: "Accounts & Cash",
        icon: Wallet,
        subItems: [
          { title: "Treasury Overview", href: "/finance/overview" },
          { title: "Bank Accounts Ledger", href: "/finance/bank-ledger" },
        ],
      },
      {
        title: "Transactions",
        icon: Receipt,
        subItems: [
          { title: "Delivery Cash Collections", href: "/finance/collections" },
          { title: "Supplier Payments", href: "/finance/supplier-payments" },
          { title: "Wholesale Purchase Orders", href: "/procurement/orders" },
          { title: "Payments", href: "/finance/payments" },
        ],
      },
    ],
  },
  {
    group: "HR & System Control",
    items: [
      {
        title: "Team & Payroll",
        icon: Users2,
        subItems: [
          { title: "Staff Directory & Roles", href: "/hr/staff-directory" },
          { title: "Salary", href: "/hr/salary" },
        ],
      },
      {
        title: "System Settings",
        icon: Settings,
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

function menuKey(group: string, title: string) {
  return `${group}::${title}`
}

function activeMenuKey(pathname: string) {
  for (const section of navSections) {
    for (const item of section.items) {
      if (item.subItems?.some((sub) => pathname === sub.href)) {
        return menuKey(section.group, item.title)
      }
    }
  }
  return null
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  onOpenAccount?: () => void
  onOpenPrivileges?: () => void
}

export function AppSidebar({ onOpenAccount, onOpenPrivileges, ...props }: AppSidebarProps) {
  const pathname = usePathname()
  const { state, isMobile, setOpenMobile } = useSidebar()
  const isCollapsed = state === "collapsed" && !isMobile
  const [openMenuKey, setOpenMenuKey] = React.useState<string | null>(() =>
    activeMenuKey(pathname)
  )

  React.useEffect(() => {
    setOpenMenuKey(activeMenuKey(pathname))
  }, [pathname])
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

  const hasRbacPermission = React.useMemo(() => {
    if (!currentUser) return false
    return userCan(
      {
        id: "",
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role || "",
        roleName: currentUser.role || "",
        permissions: currentUser.permissions || [],
      },
      "Role Permissions (RBAC)",
      "view"
    )
  }, [currentUser])

  const canAccessRoute = React.useCallback(
    (href?: string, _title?: string) => {
      if (!href) return true
      if (!currentUser) return false
      const feature = featureForPath(href)
      if (!feature) return true
      return userCan(
        {
          id: "",
          name: currentUser.name,
          email: currentUser.email,
          role: currentUser.role || "",
          roleName: currentUser.role || "",
          permissions: currentUser.permissions || [],
        },
        feature,
        "view"
      )
    },
    [currentUser]
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
                asChild
                className="transition-colors hover:bg-slate-50 flex-1 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center h-12"
              >
                <Link href="/" className="flex items-center w-full">
                  {/* Expanded Sidebar: horizontal-logo-motto.svg */}
                  <div className="flex items-center group-data-[collapsible=icon]:hidden py-1 px-1">
                    <img
                      src="/horizontal-logo-motto.svg"
                      alt="AK Pharma - Smart Solutions for Healthier Living"
                      className="h-9 w-auto max-w-[205px] object-contain"
                    />
                  </div>

                  {/* Collapsed Sidebar: just-logo.svg */}
                  <div className="hidden group-data-[collapsible=icon]:flex items-center justify-center w-full py-1">
                    <img
                      src="/just-logo.svg"
                      alt="AK Pharma"
                      className="h-5 w-auto max-w-[30px] object-contain"
                    />
                  </div>
                </Link>
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
              <SidebarGroupLabel className="mb-0.5 h-auto px-2 py-1 text-[13px] font-semibold leading-snug normal-case tracking-normal text-slate-950 group-data-[collapsible=icon]:hidden">
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
                    const key = menuKey(section.group, item.title)
                    const isOpen = openMenuKey === key
                    return (
                      <Collapsible
                        key={item.title}
                        open={isOpen}
                        onOpenChange={(open) => {
                          setOpenMenuKey(open ? key : null)
                        }}
                        className="group/collapsible"
                      >
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                              tooltip={item.title}
                              isActive={isSubActive}
                              className={`min-h-[42px] sm:min-h-[36px] w-full justify-between px-3 sm:px-2 text-sm sm:text-xs font-medium transition-colors cursor-pointer rounded-lg ${
                                isSubActive
                                  ? "bg-slate-100 font-semibold text-slate-900"
                                  : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                              }`}
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