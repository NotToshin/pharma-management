"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();

  React.useEffect(() => {
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      const user = localStorage.getItem("user");

      if (token && user) {
        // Operator is already authenticated
        router.replace("/dashboard");
      } else {
        // No active session — force login
        router.replace("/login");
      }
    } catch {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
      <div className="h-6 w-6 border-2 border-[#0090FF] border-t-transparent rounded-full animate-spin mb-3" />
      <p className="text-xs text-slate-400 font-mono tracking-wider uppercase">
        Verifying Security Session...
      </p>
    </div>
  );
}
