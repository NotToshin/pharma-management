import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/app-sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(geistSans.variable, geistMono.variable)}
    >
      <body
        suppressHydrationWarning
        className="min-h-screen bg-[#FDFDFD] font-sans text-slate-900 antialiased"
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <TooltipProvider delayDuration={0}>
            <SidebarProvider
              defaultOpen={true}
              style={
                {
                  "--sidebar-width": "19rem", // 304px — provides full clearance for long titles like "Territory Sales Breakdown"
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

                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src="/avatar.png" alt="Toshin" />
                      <AvatarFallback className="rounded-lg bg-indigo-600 text-white text-xs font-semibold">
                        TO
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid text-left leading-none">
                      <span className="text-xs font-bold text-slate-900">Toshin</span>
                      <span className="text-[10px] text-slate-500 mt-1">Managing Director</span>
                    </div>
                  </div>
                </header>

                <main className="flex-1 p-6 md:p-8">{children}</main>
              </SidebarInset>
            </SidebarProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}