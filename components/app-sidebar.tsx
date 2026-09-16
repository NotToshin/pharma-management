"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";

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
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navSections = [
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
          { title: "Territory Sales Breakdown", href: "/analytics/territories" },
        ],
      },
    ],
  },
  {
    group: "FIELD FORCE (MIO)",
    items: [
      {
        title: "Tour Programme (TP)",
        icon: UserCheck,
        defaultOpen: true,
        subItems: [
          { title: "All Tour Plans", href: "/field-force/tour-plans" },
          { title: "Pending Approvals", href: "/field-force/approvals" },
        ],
      },
      {
        title: "Daily Call Reports (DCR)",
        icon: Clock,
        defaultOpen: true,
        subItems: [
          { title: "Doctor Visit Logs", href: "/field-force/visit-logs" },
          { title: "Sample & Gift Distribution", href: "/field-force/samples" },
        ],
      },
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
          { title: "Add New Doctor", href: "/doctors/new" },
        ],
      },
      {
        title: "Prescription Potential",
        icon: FileSpreadsheet,
        defaultOpen: true,
        subItems: [
          { title: "Category Ranking", href: "/doctors/ranking" },
          { title: "Visit History Timeline", href: "/doctors/timeline" },
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
          { title: "Expiry Watchlist", href: "/inventory/expiry" },
        ],
      },
      {
        title: "Wholesaler Procurement",
        icon: Building2,
        defaultOpen: true,
        subItems: [
          { title: "Purchase Orders", href: "/procurement/orders" },
          { title: "Receive Stock Batch Log", href: "/procurement/batch-logs" },
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
      {
        title: "Order Processing",
        icon: Package,
        defaultOpen: true,
        subItems: [
          { title: "Active Inventory Ledger", href: "/sales/orders" },
          { title: "Expiry Watchlist", href: "/sales/expiry-watchlist" },
        ],
      },
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
      },
    ],
  },
  {
    group: "FINANCE & TREASURY",
    items: [
      {
        title: "Accounts & Cash",
        icon: Wallet,
        defaultOpen: false,
        subItems: [{ title: "Cash Book", href: "/finance/cash-book" }],
      },
      {
        title: "Transactions",
        icon: Receipt,
        defaultOpen: false,
        subItems: [{ title: "Transaction History", href: "/finance/transactions" }],
      },
    ],
  },
  {
    group: "HR & SYSTEM CONTROL",
    items: [
      {
        title: "Team & Payroll",
        icon: Users2,
        defaultOpen: false,
        subItems: [{ title: "Employee Directory", href: "/hr/team" }],
      },
      {
        title: "System Settings",
        icon: Settings,
        defaultOpen: false,
        subItems: [{ title: "Configurations", href: "/settings" }],
      },
    ],
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-white" {...props}>
      {/* 1. Brand Header */}
      <SidebarHeader className="p-3 border-b border-sidebar-border/60">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="hover:bg-slate-100/80 transition-colors">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-black text-white font-bold text-sm tracking-tight">
                AK
              </div>
              <div className="grid flex-1 text-left leading-tight ml-2.5">
                <span className="truncate font-bold text-sm text-slate-900 tracking-tight">AK PHARMA</span>
                <span className="truncate text-xs text-muted-foreground">Pharmaceutical</span>
              </div>
              <ChevronsUpDown className="ml-auto h-4 w-4 text-muted-foreground" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* 2. Scrollable Navigation List */}
      <SidebarContent className="px-2.5 py-3 gap-2 overflow-y-auto">
        {navSections.map((section) => (
          <SidebarGroup key={section.group} className="py-1.5">
            {/* Headers: Scaled to Large text (text-xs/text-sm uppercase) */}
            <SidebarGroupLabel className="px-2 text-xs md:text-sm font-bold tracking-wider text-slate-500 uppercase mb-1">
              {section.group}
            </SidebarGroupLabel>
            <SidebarMenu className="gap-1">
              {section.items.map((item) => {
                const hasSub = item.subItems && item.subItems.length > 0;
                const isSubActive =
                  hasSub && item.subItems.some((sub) => pathname === sub.href);
                const isDirectActive = item.href ? pathname === item.href : false;

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
                            className="w-full justify-between h-9 px-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-100/80 hover:text-slate-900 transition-colors"
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <item.icon className="h-4 w-4 shrink-0 text-slate-600" />
                              <span className="truncate">{item.title}</span>
                            </div>
                            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub className="mx-2 pl-3.5 border-l-2 border-slate-200 space-y-1 py-1">
                            {item.subItems.map((subItem) => {
                              const isActive = pathname === subItem.href;
                              return (
                                <SidebarMenuSubItem key={subItem.title}>
                                  {/* Submenu Item: Scaled to Medium font (text-sm font-medium) */}
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={isActive}
                                    className={`h-8 text-sm font-medium transition-colors ${
                                      isActive
                                        ? "font-semibold text-slate-950 bg-slate-100"
                                        : "text-slate-600 hover:text-slate-950 hover:bg-slate-50"
                                    }`}
                                  >
                                    <Link href={subItem.href}>
                                      <span>{subItem.title}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              );
                            })}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                }

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isDirectActive}
                      tooltip={item.title}
                      className={`w-full justify-start h-9 px-2.5 text-sm font-semibold rounded-md transition-colors ${
                        isDirectActive
                          ? "bg-slate-100 text-slate-950 font-bold"
                          : "text-slate-800 hover:bg-slate-100/80 hover:text-slate-950"
                      }`}
                    >
                      <Link href={item.href || "#"} className="flex items-center gap-2.5">
                        <item.icon className="h-4 w-4 shrink-0 text-slate-600" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* 3. User Profile Dropdown Footer */}
      <SidebarFooter className="p-3 border-t border-sidebar-border/60">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-slate-100 hover:bg-slate-100/80 transition-colors"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src="/avatar.png" alt="shadcn" />
                    <AvatarFallback className="rounded-lg bg-purple-600 text-white font-semibold text-xs">
                      SC
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-xs leading-tight ml-2">
                    <span className="truncate font-semibold text-slate-900">shadcn</span>
                    <span className="truncate text-[10px] text-muted-foreground">m@example.com</span>
                  </div>
                  <ChevronsUpDown className="ml-auto h-4 w-4 text-muted-foreground" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarFallback className="rounded-lg bg-purple-600 text-white font-semibold text-xs">
                        SC
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-xs leading-tight">
                      <span className="truncate font-semibold text-slate-900">shadcn</span>
                      <span className="truncate text-[10px] text-muted-foreground">m@example.com</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem className="text-xs">
                    <Sparkles className="mr-2 h-3.5 w-3.5" />
                    Account Overview
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-xs">
                    <ShieldCheck className="mr-2 h-3.5 w-3.5" />
                    Role Privileges
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-3.5 w-3.5" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}