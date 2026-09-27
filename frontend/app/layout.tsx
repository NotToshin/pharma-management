"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/app-sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Shield, User, LogOut, Camera } from "lucide-react";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);
  const [authorized, setAuthorized] = React.useState(false);

  // User Session State
  const [userData, setUserData] = React.useState({
    name: "Toshin",
    email: "toshin@akpharma.com",
    roleName: "Managing Director / Super Admin",
    territory: "Central HQ",
    avatar: "",
    permissions: [] as any[],
  });

  // Modal Dialog states
  const [isAccountOpen, setIsAccountOpen] = React.useState(false);
  const [isPrivilegesOpen, setIsPrivilegesOpen] = React.useState(false);
  const [editName, setEditName] = React.useState("Toshin");
  const [editAvatar, setEditAvatar] = React.useState("");

  const isLoginPage = pathname === "/login";

  React.useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("ak_token");
    const rawUser = localStorage.getItem("ak_user");

    if (!token && !isLoginPage) {
      router.replace("/login");
    } else {
      if (rawUser) {
        try {
          const parsed = JSON.parse(rawUser);
          setUserData({
            name: parsed.name || "Toshin",
            email: parsed.email || "toshin@akpharma.com",
            roleName: parsed.roleName || parsed.roleCode || "Administrator",
            territory: parsed.territory || "Central HQ",
            avatar: parsed.avatar || "",
            permissions: parsed.permissions || [],
          });
          setEditName(parsed.name || "Toshin");
          setEditAvatar(parsed.avatar || "");
        } catch {
          // Fallback
        }
      }
      setAuthorized(true);
    }
  }, [pathname, router, isLoginPage]);

  const handleLogout = () => {
    localStorage.removeItem("ak_token");
    localStorage.removeItem("ak_user");
    router.push("/login");
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...userData,
      name: editName,
      avatar: editAvatar,
    };
    setUserData(updated);
    localStorage.setItem("ak_user", JSON.stringify(updated));
    setIsAccountOpen(false);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Prevent server-client hydration tree mismatches
  if (!mounted) {
    return (
      <html lang="en" suppressHydrationWarning className={cn(geistSans.variable, geistMono.variable, "light")}>
        <body suppressHydrationWarning className="min-h-screen bg-white font-sans text-slate-900 antialiased">
          <div className="flex items-center justify-center min-h-screen text-slate-400 text-xs font-mono">
            Loading...
          </div>
        </body>
      </html>
    );
  }

  if (isLoginPage) {
    return (
      <html
        lang="en"
        suppressHydrationWarning
        className={cn(geistSans.variable, geistMono.variable, "light")}
      >
        <body suppressHydrationWarning className="min-h-screen bg-white font-sans text-slate-900 antialiased">
          {children}
        </body>
      </html>
    );
  }

  if (!authorized) {
    return (
      <html lang="en">
        <body className="flex items-center justify-center min-h-screen bg-slate-50 text-slate-400 text-xs font-mono">
          Authenticating secure session...
        </body>
      </html>
    );
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
                    <SidebarTrigger className="-ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100" />
                    <span className="text-sm font-semibold text-slate-900">Dashboard</span>
                  </div>

                  {/* Profile Dropdown Menu */}
                  <div className="flex items-center gap-2.5">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer outline-none">
                          <Avatar className="h-8 w-8 rounded-lg border border-slate-200">
                            {userData.avatar ? (
                              <AvatarImage src={userData.avatar} alt={userData.name} />
                            ) : null}
                            <AvatarFallback className="rounded-lg bg-indigo-600 text-white text-xs font-semibold">
                              {userData.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="grid text-left leading-none">
                            <span className="text-xs font-bold text-slate-900">{userData.name}</span>
                            <span className="text-[10px] text-slate-500 mt-1">{userData.roleName}</span>
                          </div>
                        </button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end" className="w-56 bg-white rounded-xl shadow-lg border border-slate-200 p-1.5 text-xs">
                        <DropdownMenuLabel className="px-2 py-1.5 font-normal">
                          <div className="flex flex-col space-y-1">
                            <p className="text-xs font-bold text-slate-900">{userData.name}</p>
                            <p className="text-[10px] text-slate-500 font-mono truncate">{userData.email}</p>
                          </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-slate-100 my-1" />

                        <DropdownMenuItem
                          onClick={() => setIsAccountOpen(true)}
                          className="cursor-pointer gap-2 py-2 text-slate-700 rounded-lg focus:bg-slate-50"
                        >
                          <User className="h-4 w-4 text-slate-500" />
                          <span>Account Overview</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => setIsPrivilegesOpen(true)}
                          className="cursor-pointer gap-2 py-2 text-slate-700 rounded-lg focus:bg-slate-50"
                        >
                          <Shield className="h-4 w-4 text-[#0090FF]" />
                          <span>Role Privileges</span>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator className="bg-slate-100 my-1" />

                        <DropdownMenuItem
                          onClick={handleLogout}
                          className="cursor-pointer gap-2 py-2 text-rose-600 font-semibold rounded-lg focus:bg-rose-50 focus:text-rose-600"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Log out</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </header>

                <main className="flex-1 p-6 md:p-8">{children}</main>
              </SidebarInset>
            </SidebarProvider>
          </TooltipProvider>

          {/* 1. Account Overview & Profile Picture Upload Dialog */}
          <Dialog open={isAccountOpen} onOpenChange={setIsAccountOpen}>
            <DialogContent className="sm:max-w-[420px] bg-white rounded-2xl p-6">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900">Account Overview</DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Manage your personal identity, avatar image, and assigned territory.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSaveProfile} className="space-y-4 py-2 text-xs">
                <div className="flex flex-col items-center justify-center space-y-2 py-2">
                  <Avatar className="h-20 w-20 rounded-2xl border-2 border-slate-200 shadow-sm">
                    {editAvatar ? (
                      <AvatarImage src={editAvatar} alt={editName} />
                    ) : null}
                    <AvatarFallback className="bg-indigo-600 text-white text-xl font-bold rounded-2xl">
                      {editName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-semibold transition-colors">
                    <Camera className="h-3.5 w-3.5 text-slate-500" />
                    <span>Upload Avatar Image</span>
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                  </label>
                </div>

                <div className="space-y-1">
                  <Label className="font-semibold text-slate-700">Full Name</Label>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className="h-8 text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="font-semibold text-slate-700">Email Address (Login)</Label>
                  <Input value={userData.email} disabled className="h-8 text-xs bg-slate-50 font-mono text-slate-500" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="font-semibold text-slate-700">Security Role</Label>
                    <Input value={userData.roleName} disabled className="h-8 text-xs bg-slate-50 text-slate-500 font-medium" />
                  </div>
                  <div className="space-y-1">
                    <Label className="font-semibold text-slate-700">Territory Station</Label>
                    <Input value={userData.territory} disabled className="h-8 text-xs bg-slate-50 text-slate-500" />
                  </div>
                </div>

                <DialogFooter className="pt-3">
                  <Button type="button" variant="outline" onClick={() => setIsAccountOpen(false)} className="h-8 text-xs">
                    Cancel
                  </Button>
                  <Button type="submit" className="h-8 text-xs bg-[#0090FF] hover:bg-[#0080e5] text-white">
                    Save Changes
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* 2. Role Privileges Dialog */}
          <Dialog open={isPrivilegesOpen} onOpenChange={setIsPrivilegesOpen}>
            <DialogContent className="sm:max-w-[540px] bg-white rounded-2xl p-6">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-[#0090FF]" />
                  Active Role Privileges & Scope
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Your current security clearance level and granted module privileges.
                </DialogDescription>
              </DialogHeader>

              <div className="py-3 space-y-3 text-xs">
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#0090FF] block">Assigned Clearance</span>
                    <strong className="text-slate-900 font-bold text-sm block mt-0.5">{userData.roleName}</strong>
                  </div>
                  <Badge className="bg-[#0090FF] text-white text-[10px]">Verified Session</Badge>
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block px-1">
                    Granted Module Access
                  </span>

                  <div className="max-h-[240px] overflow-y-auto space-y-1.5 pr-1">
                    {userData.permissions.length === 0 ? (
                      <div className="p-4 text-center text-slate-400 bg-slate-50 rounded-lg">
                        Full Super Administrator clearance active. All operational modules unlocked.
                      </div>
                    ) : (
                      userData.permissions.map((p: any, i: number) => (
                        <div key={i} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-900 block">{p.module}</span>
                            <span className="text-[10px] text-slate-400">{p.category} Scope</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {p.read && <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-700 border-emerald-200">Read</Badge>}
                            {p.create && <Badge variant="outline" className="text-[9px] bg-blue-50 text-blue-700 border-blue-200">Create</Badge>}
                            {p.edit && <Badge variant="outline" className="text-[9px] bg-amber-50 text-amber-700 border-amber-200">Edit</Badge>}
                            {p.delete && <Badge variant="outline" className="text-[9px] bg-rose-50 text-rose-700 border-rose-200">Delete</Badge>}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button onClick={() => setIsPrivilegesOpen(false)} className="h-8 text-xs bg-slate-900 text-white">
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </ThemeProvider>
      </body>
    </html>
  );
}