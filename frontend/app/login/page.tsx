"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle2, Loader2, Lock } from "lucide-react"
import { setAuthSession } from "@/lib/auth"
import { API_URL, getApiUrl } from "@/lib/api"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const fromUrl = searchParams.get("from")
  const isExpired = searchParams.get("expired") === "1"

  const [email, setEmail] = React.useState("superadmin@pharma.com")
  const [password, setPassword] = React.useState("admin123456")
  const [loading, setLoading] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(
    null
  )

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    if (!email.trim() || !password) {
      setErrorMessage("Please enter both email and password.")
      return
    }

    try {
      setLoading(true)

      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        const errorText =
          data?.message ||
          data?.error ||
          "Authentication failed. Please verify credentials."
        setErrorMessage(errorText)
        return
      }

      if (!data) {
        setErrorMessage(
          "Invalid response from server. Please check backend deployment."
        )
        return
      }

      const payload = data.data || data
      const user = payload.user || data.user
      const accessToken = payload.accessToken || data.accessToken
      const refreshToken = payload.refreshToken || data.refreshToken

      // Persist auth session profile and tokens
      setAuthSession({ user, accessToken, refreshToken })

      setSuccessMessage("Session verified. Redirecting...")

      // Target redirect destination
      const targetDestination =
        fromUrl && fromUrl.startsWith("/") && !fromUrl.startsWith("//")
          ? fromUrl
          : "/dashboard"

      router.push(targetDestination)
      router.refresh()
    } catch (err: any) {
      console.error("Login request failed:", err)
      setErrorMessage(
        `Unable to reach authentication server at ${getApiUrl()}. Please check backend service.`
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex w-full max-w-[440px] flex-col items-center">
      {/* AK Pharma Brand Header */}
      <div className="mb-6 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-black text-white">
          <span className="text-[11px] font-bold tracking-tighter">AK</span>
        </div>
        <span className="text-sm font-bold tracking-tight text-slate-900">
          AK Pharma ERP
        </span>
      </div>

      {/* Card Component */}
      <div className="w-full rounded-2xl border border-slate-200/90 bg-white p-8 shadow-sm">
        <div className="mb-6 space-y-1">
          <h1 className="text-xl font-bold tracking-tight text-slate-950">
            Login to your account
          </h1>
          <p className="text-xs text-slate-500">
            Enter your enterprise credentials below to access the command center
          </p>
        </div>

        {isExpired && !errorMessage && (
          <div className="mb-5 flex animate-in items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 duration-200 fade-in">
            <Lock className="h-4 w-4 shrink-0 text-amber-600" />
            <span>
              Your session has expired. Please sign in again to continue.
            </span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-5 flex animate-in items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 duration-200 fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-5 flex animate-in items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700 duration-200 fade-in">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5 text-left">
            <Label
              htmlFor="email"
              className="text-xs font-semibold text-slate-900"
            >
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="operator@akpharma.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              autoComplete="email"
              className="h-10 rounded-lg border-slate-200 text-xs placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-slate-950"
            />
          </div>

          <div className="space-y-1.5 text-left">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="password"
                className="text-xs font-semibold text-slate-900"
              >
                Password
              </Label>
              <button
                type="button"
                onClick={() =>
                  alert(
                    "Please contact your System Administrator to reset your security credentials."
                  )
                }
                className="text-xs text-slate-500 transition-colors hover:text-slate-900"
              >
                Forgot password?
              </button>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              autoComplete="current-password"
              className="h-10 rounded-lg border-slate-200 text-xs focus-visible:ring-1 focus-visible:ring-slate-950"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#18181B] text-xs font-semibold text-white shadow-none transition-all hover:bg-black"
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {loading ? "Authenticating..." : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  )
}


export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-between bg-[#FAFAFA] px-4 py-12 selection:bg-slate-900 selection:text-white">
      <div className="w-full" />

      <React.Suspense
        fallback={
          <div className="flex items-center justify-center p-8 font-mono text-xs text-slate-400">
            Loading login portal...
          </div>
        }
      >
        <LoginForm />
      </React.Suspense>

      {/* Footer */}
      <div className="mt-8 max-w-sm text-center text-[11px] leading-relaxed text-slate-500">
        By clicking continue, you agree to AK Pharma{" "}
        <Link
          href="#"
          className="underline underline-offset-4 hover:text-slate-900"
        >
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link
          href="#"
          className="underline underline-offset-4 hover:text-slate-900"
        >
          Statutory Compliance Policy
        </Link>
        .
      </div>
    </div>
  )
}
