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
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
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
      className={cn("antialiased", geistSans.variable, geistMono.variable, "font-sans")}
    >
      <body suppressHydrationWarning className="min-h-screen bg-[#FDFDFD] text-slate-900">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <TooltipProvider delayDuration={0}>
            <SidebarProvider>
              <AppSidebar />
              <SidebarInset className="bg-[#FDFDFD]">
                {/* Exact Header from Target Image */}
                <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
                  <div className="flex items-center gap-3">
                    <SidebarTrigger className="-ml-1 text-slate-600 hover:text-slate-900" />
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
                      <span className="text-[10px] text-slate-500 mt-0.5">Managing Director</span>
                    </div>
                  </div>
                </header>

                <main className="p-6 md:p-8">{children}</main>
              </SidebarInset>
            </SidebarProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}