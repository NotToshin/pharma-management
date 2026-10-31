"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AppSidebar } from "@/components/app-sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Shield, User, LogOut, Camera, ShieldAlert, ArrowLeft } from "lucide-react"
import { Toaster } from "@/components/ui/toaster"
import { isAuthenticated, getStoredUser, logout } from "@/lib/auth"
import { featureForPath, userCan } from "@/lib/permissions"

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
})

const routeTitleMap: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/analytics/targets": "Target Vs Achievement",
  "/analytics/territories": "Territory Sales Breakdown",
  "/field-force/visit-logs": "Doctor Visit Logs",
  "/field-force/zones": "MIO Zone Allocation",
  "/doctors/database": "Doctors List",
  "/inventory/ledger": "Stock Inventory",
  "/inventory/adjustments": "Stock Adjustments",
  "/procurement/orders": "Wholesale Purchase Orders",
  "/logistics/orders": "Sales Orders",
  "/sales/clients": "Pharmacy Clients",
  "/finance/overview": "Treasury Overview",
  "/finance/bank-ledger": "Bank Accounts Ledger",
  "/finance/collections": "Delivery Cash Collections",
  "/finance/payments": "Payments",
  "/finance/supplier-payments": "Supplier Payments",
  "/hr/staff-directory": "Staff Directory & Roles",
  "/hr/salary": "Salary",
  "/settings/rbac": "Role Permissions (RBAC)",
  "/settings/audit-logs": "Audit Logs (21 CFR Compliant)",
}

function getPageTitle(pathname: string): string {
  if (routeTitleMap[pathname]) return routeTitleMap[pathname]
  for (const [route, title] of Object.entries(routeTitleMap)) {
    if (pathname.startsWith(route)) return title
  }
  const segments = pathname.split("/").filter(Boolean)
  if (segments.length === 0) return "Dashboard"
  const last = segments[segments.length - 1]
  return last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, " ")
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = usePathname()
  const router = useRouter()
  const [mounted, setMounted] = React.useState(false)
  const [authorized, setAuthorized] = React.useState(false)

  // User Session State
  const [userData, setUserData] = React.useState({
    name: "Toshin",
    email: "toshin@akpharma.com",
    role: "SUPERADMIN",
    roleName: "Managing Director / Super Admin",
    territory: "Central HQ",
    avatar: "",
    permissions: [] as any[],
  })

  // Modal Dialog states
  const [isAccountOpen, setIsAccountOpen] = React.useState(false)
  const [isPrivilegesOpen, setIsPrivilegesOpen] = React.useState(false)
  const [editName, setEditName] = React.useState("Toshin")
  const [editAvatar, setEditAvatar] = React.useState("")

  const isLoginPage = pathname === "/login"

  React.useEffect(() => {
    setMounted(true)
    const active = isAuthenticated()
    const storedUser = getStoredUser()

    if (!active && !isLoginPage) {
      router.replace("/login")
    } else {
      if (storedUser) {
        setUserData({
          name: storedUser.name || "Toshin",
          email: storedUser.email || "toshin@akpharma.com",
          role: storedUser.role || storedUser.roleName || (storedUser as any).roleCode || "SUPERADMIN",
          roleName: storedUser.roleName || storedUser.role || "Administrator",
          territory: storedUser.territory || "Central HQ",
          avatar: storedUser.avatar || "",
          permissions: storedUser.permissions || [],
        })
        setEditName(storedUser.name || "Toshin")
        setEditAvatar(storedUser.avatar || "")
      }
      setAuthorized(true)
    }
  }, [pathname, router, isLoginPage])

  // Dynamic browser tab title
  React.useEffect(() => {
    const pageName = getPageTitle(pathname)
    document.title = `AK-Pharma | ${pageName}`
  }, [pathname])

  const isCurrentPageAllowed = React.useMemo(() => {
    if (pathname === "/login" || pathname === "/") return true
    const feature = featureForPath(pathname)
    if (!feature) return true
    return userCan(
      {
        id: "",
        name: userData.name,
        email: userData.email,
        role: userData.role,
        roleName: userData.roleName,
        permissions: userData.permissions,
      },
      feature,
      "view"
    )
  }, [pathname, userData])

  const handleLogout = () => {
    logout()
  }

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    const updated = {
      ...userData,
      name: editName,
      avatar: editAvatar,
    }
    setUserData(updated)
    localStorage.setItem("ak_user", JSON.stringify(updated))
    setIsAccountOpen(false)
  }

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setEditAvatar(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Prevent server-client hydration tree mismatches
  if (!mounted) {
    return (
      <html
        lang="en"
        suppressHydrationWarning
        className={cn(geistSans.variable, geistMono.variable, "light")}
      >
        <body
          suppressHydrationWarning
          className="min-h-screen bg-white font-sans text-slate-900 antialiased"
        >
          <div className="flex min-h-screen items-center justify-center font-mono text-xs text-slate-400">
            Loading...
          </div>
        </body>
      </html>
    )
  }

  if (isLoginPage) {
    return (
      <html
        lang="en"
        suppressHydrationWarning
        className={cn(geistSans.variable, geistMono.variable, "light")}
      >
        <body
          suppressHydrationWarning
          className="min-h-screen bg-white font-sans text-slate-900 antialiased"
        >
          {children}
        </body>
      </html>
    )
  }

  if (!authorized) {
    return (
      <html lang="en">
        <body className="flex min-h-screen items-center justify-center bg-slate-50 font-mono text-xs text-slate-400">
          Authenticating secure session...
        </body>
      </html>
    )
  }

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(geistSans.variable, geistMono.variable, "light")}
    >
      <body
        suppressHydrationWarning
        className="min-h-screen bg-[#FDFDFD] font-sans text-slate-900 antialiased"
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <Toaster position="top-right" richColors closeButton />
          <TooltipProvider delayDuration={0}>
            <SidebarProvider
              defaultOpen={true}
              style={
                {
                  "--sidebar-width": "19rem",
                  "--sidebar-width-icon": "3.5rem",
                } as React.CSSProperties
              }
            >
              <AppSidebar />
              <SidebarInset className="min-w-0 bg-[#FDFDFD]">
                <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white px-6">
                  <div className="flex items-center gap-3">
                    <SidebarTrigger className="-ml-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900" />
                    <span className="text-sm font-semibold text-slate-900">
                      {getPageTitle(pathname)}
                    </span>
                  </div>

                  {/* Profile Dropdown Menu */}
                  <div className="flex items-center gap-2.5">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex cursor-pointer items-center gap-2.5 rounded-lg p-1 transition-colors outline-none hover:bg-slate-100">
                          <Avatar className="h-8 w-8 rounded-lg border border-slate-200">
                            {userData.avatar ? (
                              <AvatarImage
                                src={userData.avatar}
                                alt={userData.name}
                              />
                            ) : null}
                            <AvatarFallback className="rounded-lg bg-indigo-600 text-xs font-semibold text-white">
                              {userData.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="grid text-left leading-none">
                            <span className="text-xs font-bold text-slate-900">
                              {userData.name}
                            </span>
                            <span className="mt-1 text-[10px] text-slate-500">
                              {userData.roleName}
                            </span>
                          </div>
                        </button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent
                        align="end"
                        className="w-56 rounded-xl border border-slate-200 bg-white p-1.5 text-xs shadow-lg"
                      >
                        <DropdownMenuLabel className="px-2 py-1.5 font-normal">
                          <div className="flex flex-col space-y-1">
                            <p className="text-xs font-bold text-slate-900">
                              {userData.name}
                            </p>
                            <p className="truncate font-mono text-[10px] text-slate-500">
                              {userData.email}
                            </p>
                          </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="my-1 bg-slate-100" />

                        <DropdownMenuItem
                          onClick={() => setIsAccountOpen(true)}
                          className="cursor-pointer gap-2 rounded-lg py-2 text-slate-700 focus:bg-slate-50"
                        >
                          <User className="h-4 w-4 text-slate-500" />
                          <span>Account Overview</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => setIsPrivilegesOpen(true)}
                          className="cursor-pointer gap-2 rounded-lg py-2 text-slate-700 focus:bg-slate-50"
                        >
                          <Shield className="h-4 w-4 text-[#0090FF]" />
                          <span>Role Privileges</span>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator className="my-1 bg-slate-100" />

                        <DropdownMenuItem
                          onClick={handleLogout}
                          className="cursor-pointer gap-2 rounded-lg py-2 font-semibold text-rose-600 focus:bg-rose-50 focus:text-rose-600"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Log out</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </header>

                <main className="flex-1 p-6 md:p-8">
                  {isCurrentPageAllowed ? (
                    children
                  ) : (
                    <div className="mx-auto flex min-h-[60vh] max-w-[620px] flex-col items-center justify-center p-6 text-center">
                      <div className="w-full rounded-2xl border border-rose-200 bg-rose-50/40 p-8 shadow-xs">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 ring-6 ring-rose-50">
                          <ShieldAlert className="h-7 w-7" />
                        </div>
                        <Badge
                          variant="outline"
                          className="mt-5 border-rose-300 bg-white px-3 py-1 text-xs font-bold text-rose-700 uppercase"
                        >
                          Access Denied • 403 Forbidden
                        </Badge>
                        <h2 className="mt-4 text-xl font-black tracking-tight text-slate-900">
                          Module Access Restricted: {getPageTitle(pathname)}
                        </h2>
                        <p className="mt-2.5 text-xs leading-relaxed text-slate-600">
                          Your assigned corporate operational role (
                          <strong className="text-rose-600">{userData.roleName}</strong>)
                          has not been granted view permissions for this page.
                          Please contact the Super Administrator to update your permissions in the
                          RBAC security control matrix.
                        </p>
                        <div className="mt-6 flex items-center justify-center">
                          <Button
                            asChild
                            className="h-8 gap-2 rounded-lg bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-slate-800"
                          >
                            <a href="/dashboard">
                              <ArrowLeft className="h-3.5 w-3.5" />
                              Return to Dashboard
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </main>
              </SidebarInset>
            </SidebarProvider>
          </TooltipProvider>

          {/* 1. Account Overview & Profile Picture Upload Dialog */}
          <Dialog open={isAccountOpen} onOpenChange={setIsAccountOpen}>
            <DialogContent className="rounded-2xl bg-white p-6 sm:max-w-[420px]">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900">
                  Account Overview
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Manage your personal identity, avatar image, and assigned
                  territory.
                </DialogDescription>
              </DialogHeader>

              <form
                onSubmit={handleSaveProfile}
                className="space-y-4 py-2 text-xs"
              >
                <div className="flex flex-col items-center justify-center space-y-2 py-2">
                  <Avatar className="h-20 w-20 rounded-2xl border-2 border-slate-200 shadow-sm">
                    {editAvatar ? (
                      <AvatarImage src={editAvatar} alt={editName} />
                    ) : null}
                    <AvatarFallback className="rounded-2xl bg-indigo-600 text-xl font-bold text-white">
                      {editName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition-colors hover:bg-slate-50">
                    <Camera className="h-3.5 w-3.5 text-slate-500" />
                    <span>Upload Avatar Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="space-y-1">
                  <Label className="font-semibold text-slate-700">
                    Full Name
                  </Label>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className="h-8 text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="font-semibold text-slate-700">
                    Email Address (Login)
                  </Label>
                  <Input
                    value={userData.email}
                    disabled
                    className="h-8 bg-slate-50 font-mono text-xs text-slate-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="font-semibold text-slate-700">
                      Security Role
                    </Label>
                    <Input
                      value={userData.roleName}
                      disabled
                      className="h-8 bg-slate-50 text-xs font-medium text-slate-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="font-semibold text-slate-700">
                      Territory Station
                    </Label>
                    <Input
                      value={userData.territory}
                      disabled
                      className="h-8 bg-slate-50 text-xs text-slate-500"
                    />
                  </div>
                </div>

                <DialogFooter className="pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAccountOpen(false)}
                    className="h-8 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="h-8 bg-[#0090FF] text-xs text-white hover:bg-[#0080e5]"
                  >
                    Save Changes
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* 2. Role Privileges Dialog */}
          <Dialog open={isPrivilegesOpen} onOpenChange={setIsPrivilegesOpen}>
            <DialogContent className="rounded-2xl bg-white p-6 sm:max-w-[540px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                  <Shield className="h-4 w-4 text-[#0090FF]" />
                  Active Role Privileges & Scope
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Your current security clearance level and granted module
                  privileges.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-3 text-xs">
                <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/60 p-3">
                  <div>
                    <span className="block text-[10px] font-bold text-[#0090FF] uppercase">
                      Assigned Clearance
                    </span>
                    <strong className="mt-0.5 block text-sm font-bold text-slate-900">
                      {userData.roleName}
                    </strong>
                  </div>
                  <Badge className="bg-[#0090FF] text-[10px] text-white">
                    Verified Session
                  </Badge>
                </div>

                <div className="space-y-2">
                  <span className="block px-1 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                    Granted Module Access
                  </span>

                  <div className="max-h-[240px] space-y-1.5 overflow-y-auto pr-1">
                    {userData.permissions.length === 0 ? (
                      <div className="rounded-lg bg-slate-50 p-4 text-center text-slate-400">
                        Full Super Administrator clearance active. All
                        operational modules unlocked.
                      </div>
                    ) : (
                      userData.permissions.map((p: any, i: number) => (
                        <div
                          key={i}
                          className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-2.5"
                        >
                          <div>
                            <span className="block font-bold text-slate-900">
                              {p.module}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {p.category} Scope
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {p.read && (
                              <Badge
                                variant="outline"
                                className="border-emerald-200 bg-emerald-50 text-[9px] text-emerald-700"
                              >
                                Read
                              </Badge>
                            )}
                            {p.create && (
                              <Badge
                                variant="outline"
                                className="border-blue-200 bg-blue-50 text-[9px] text-blue-700"
                              >
                                Create
                              </Badge>
                            )}
                            {p.edit && (
                              <Badge
                                variant="outline"
                                className="border-amber-200 bg-amber-50 text-[9px] text-amber-700"
                              >
                                Edit
                              </Badge>
                            )}
                            {p.delete && (
                              <Badge
                                variant="outline"
                                className="border-rose-200 bg-rose-50 text-[9px] text-rose-700"
                              >
                                Delete
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  onClick={() => setIsPrivilegesOpen(false)}
                  className="h-8 bg-slate-900 text-xs text-white"
                >
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </ThemeProvider>
      </body>
    </html>
  )
}
