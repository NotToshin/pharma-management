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
        title: "Performance Analytics",
        icon: LineChart,
        defaultOpen: true,
        subItems: [
          { title: "Target vs. Achievement", href: "/analytics/targets" },
          {
            title: "Territory Sales Breakdown",
            href: "/analytics/territories",
          },
        ],
      },
    ],
  },
  {
    group: "FIELD FORCE (MIO)",
    items: [
      // {
      //   title: "Tour Programme (TP)",
      //   icon: UserCheck,
      //   defaultOpen: true,
      //   subItems: [
      //     { title: "All Tour Plans", href: "/field-force/tour-plans" },
      //     { title: "Pending Approvals", href: "/field-force/approvals" },
      //   ],
      // },
      {
        title: "Territory Management",
        icon: Map,
        defaultOpen: true,
        subItems: [
          { title: "MIO Zone Allocations", href: "/field-force/zones" },
          { title: "Route Optimization", href: "/field-force/routes" },
        ],
      },
    ],
  },
  {
    group: "DOCTOR REGISTRY",
    items: [
      {
        title: "Doctor Directory",
        icon: UserSquare2,
        defaultOpen: true,
        subItems: [
          { title: "Master Database", href: "/doctors/database" },
          // { title: "Add New Doctor", href: "/doctors/new" },
        ],
      },
      // {
      //   title: "Prescription Potential",
      //   icon: FileSpreadsheet,
      //   defaultOpen: true,
      //   subItems: [
      //     { title: "Category Ranking", href: "/doctors/ranking" },
      //     { title: "Visit History Timeline", href: "/doctors/timeline" },
      //   ],
      // },
      {
        title: "Daily Call Reports (DCR)",
        icon: Clock,
        defaultOpen: true,
        subItems: [
          { title: "Doctor Visit Logs", href: "/field-force/visit-logs" },
          // { title: "Sample & Gift Distribution", href: "/field-force/samples" },
        ],
      },
    ],
  },
  {
    group: "INVENTORY & WAREHOUSE",
    items: [
      {
        title: "FEFO Stock Control",
        icon: BarChart3,
        defaultOpen: true,
        subItems: [
          { title: "Active Inventory Ledger", href: "/inventory/ledger" },
          // { title: "Expiry Watchlist", href: "/inventory/expiry" },
        ],
      },
      {
        title: "Wholesaler Procurement",
        icon: Building2,
        defaultOpen: true,
        subItems: [
          { title: "Purchase Orders", href: "/procurement/orders" },
          // { title: "Receive Stock Batch Log", href: "/procurement/batch-logs" },
        ],
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
      // {
      //   title: "Order Processing",
      //   icon: Package,
      //   defaultOpen: true,
      //   subItems: [
      //     { title: "Active Inventory Ledger", href: "/sales/orders" },
      //     { title: "Expiry Watchlist", href: "/sales/expiry-watchlist" },
      //   ],
      // },
      {
        title: "Delivery Logistics",
        icon: Truck,
        defaultOpen: true,
        subItems: [
          { title: "Purchase Orders", href: "/logistics/orders" },
          { title: "Receive Stock Batch Log", href: "/logistics/batch-log" },
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
            superAdminOnly: true,
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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"
  const [currentUser, setCurrentUser] = React.useState<{
    name: string
    email: string
    role?: string
  } | null>(null)
  const [totalClientsCount, setTotalClientsCount] = React.useState<number | string>(12)

  const isSuperAdmin = React.useMemo(() => {
    if (!currentUser) return true // Default optimistic state during initial hydration
    return (currentUser.role || "").trim().replace(/_/g, "").toUpperCase() === "SUPERADMIN"
  }, [currentUser])

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
            <SidebarMenuButton
              size="lg"
              className="transition-colors hover:bg-slate-50"
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
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* 2. Scrollable Navigation Content with Draggable Scrollbar */}
      <SidebarContent className="draggable-scrollbar min-h-0 flex-1 gap-2 overscroll-contain px-2 py-2 focus:outline-none">
        {navSections.map((section) => (
          <SidebarGroup key={section.group} className="py-1">
            <SidebarGroupLabel className="mb-1 px-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase group-data-[collapsible=icon]:hidden">
              {section.group}
            </SidebarGroupLabel>
            <SidebarMenu className="gap-1">
              {section.items.map((item) => {
                const subItems = item.subItems || []
                const hasSub = subItems.length > 0
                const isSubActive =
                  hasSub && subItems.some((sub) => pathname === sub.href)
                const isDirectActive = item.href
                  ? pathname === item.href
                  : false

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
                            className="h-9 w-full justify-between px-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <item.icon className="h-4 w-4 shrink-0 text-slate-600" />
                              <span className="truncate group-data-[collapsible=icon]:hidden">
                                {item.title}
                              </span>
                            </div>
                            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200 group-data-[collapsible=icon]:hidden group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="group-data-[collapsible=icon]:hidden">
                          <SidebarMenuSub className="mx-2 space-y-1 border-l border-slate-200 py-1 pl-3.5">
                            {subItems
                              .filter((subItem) => !subItem.superAdminOnly || isSuperAdmin)
                              .map((subItem, idx) => {
                              const isActive = pathname === subItem.href
                              return (
                                <SidebarMenuSubItem
                                  key={`${subItem.title}-${idx}`}
                                >
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={isActive}
                                    className={`h-7 text-xs transition-colors ${isActive
                                      ? "bg-slate-100 font-semibold text-slate-900"
                                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                      }`}
                                  >
                                    <Link
                                      href={subItem.href}
                                      className="w-full"
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
                      className={`h-9 w-full justify-between rounded-md px-2 text-xs font-medium transition-colors ${isDirectActive
                        ? "bg-slate-100 font-semibold text-slate-900"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                    >
                      <Link
                        href={item.href || "#"}
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
        ))}
      </SidebarContent>

      {/* 3. User Dropdown Footer */}
      <SidebarFooter className="shrink-0 border-t border-slate-100 p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="transition-colors hover:bg-slate-50"
                >
                  <Avatar className="h-8 w-8 shrink-0 rounded-lg">
                    <AvatarImage
                      src="/avatar.png"
                      alt={currentUser?.name || "Operator"}
                    />
                    <AvatarFallback className="rounded-lg bg-black text-xs font-semibold text-white">
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
                className="w-56 rounded-lg"
                side={isCollapsed ? "right" : "bottom"}
                align="end"
                sideOffset={8}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-2 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarFallback className="rounded-lg bg-black text-xs font-semibold text-white">
                        {currentUser?.name
                          ? currentUser.name.slice(0, 2).toUpperCase()
                          : "AP"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-xs leading-tight">
                      <span className="truncate font-semibold text-slate-900">
                        {currentUser?.name || "Super Administrator"}
                      </span>
                      <span className="truncate font-mono text-[10px] text-slate-500">
                        {currentUser?.email || "superadmin@pharma.com"}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                {isSuperAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuItem asChild className="cursor-pointer text-xs">
                        <Link href="/settings/rbac">
                          <ShieldCheck className="mr-2 h-3.5 w-3.5 text-blue-600" />
                          Role Privileges (RBAC)
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => logout()}
                  className="cursor-pointer text-xs font-medium text-rose-600 focus:text-rose-700"
                >
                  <LogOut className="mr-2 h-3.5 w-3.5 text-rose-600" />
                  Log out
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
