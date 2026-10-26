"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { isAuthenticated } from "@/lib/auth"

export default function RootPage() {
  const router = useRouter()

  React.useEffect(() => {
    try {
      if (isAuthenticated()) {
        router.replace("/dashboard")
      } else {
        router.replace("/login")
      }
    } catch {
      router.replace("/login")
    }
  }, [router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-white">
      <div className="mb-3 h-6 w-6 animate-spin rounded-full border-2 border-[#0090FF] border-t-transparent" />
      <p className="font-mono text-xs tracking-wider text-slate-400 uppercase">
        Verifying Security Session...
      </p>
    </div>
  )
}
