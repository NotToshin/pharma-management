"use client"

import * as React from "react"
import { Download, X } from "lucide-react"

const DISMISS_KEY = "ak-pwa-install-dismissed"
const SNOOZE_MS = 14 * 24 * 60 * 60 * 1000

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed"
    platform: string
  }>
  prompt: () => Promise<void>
}

function isStandaloneDisplay() {
  if (typeof window === "undefined") return false
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function wasDismissedRecently() {
  try {
    const raw = window.localStorage.getItem(DISMISS_KEY)
    if (!raw) return false
    const dismissedAt = Number(raw)
    return Number.isFinite(dismissedAt) && Date.now() - dismissedAt < SNOOZE_MS
  } catch {
    return false
  }
}

export function PwaInstall() {
  const [deferredPrompt, setDeferredPrompt] =
    React.useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = React.useState(false)
  const [installing, setInstalling] = React.useState(false)

  // The service worker is registered here so the app has a single client entry
  // point for PWA concerns. It is intentionally production-only.
  React.useEffect(() => {
    if (process.env.NODE_ENV !== "production") return
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return

    const register = () => {
      void navigator.serviceWorker.register("/sw.js").catch(() => {
        // Registration can fail on insecure origins or unsupported browsers.
      })
    }

    if (document.readyState === "complete") {
      register()
    } else {
      window.addEventListener("load", register, { once: true })
    }

    return () => window.removeEventListener("load", register)
  }, [])

  React.useEffect(() => {
    if (isStandaloneDisplay() || wasDismissedRecently()) return

    const handleBeforeInstall = (event: Event) => {
      event.preventDefault()
      if (isStandaloneDisplay() || wasDismissedRecently()) return
      setDeferredPrompt(event as BeforeInstallPromptEvent)
      setVisible(true)
    }

    const handleInstalled = () => {
      setVisible(false)
      setDeferredPrompt(null)
      try {
        window.localStorage.removeItem(DISMISS_KEY)
      } catch {
        // Storage is optional.
      }
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall)
    window.addEventListener("appinstalled", handleInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall)
      window.removeEventListener("appinstalled", handleInstalled)
    }
  }, [])

  const dismiss = React.useCallback(() => {
    setVisible(false)
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()))
    } catch {
      // Storage is optional; the prompt stays hidden for this mount.
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    setInstalling(true)

    try {
      await deferredPrompt.prompt()
      const choice = await deferredPrompt.userChoice
      if (choice.outcome === "accepted") {
        setVisible(false)
        try {
          window.localStorage.removeItem(DISMISS_KEY)
        } catch {
          // Storage is optional.
        }
      } else {
        dismiss()
      }
    } catch {
      // If the browser refuses to prompt, hide it rather than trapping the user.
      setVisible(false)
    } finally {
      setInstalling(false)
      setDeferredPrompt(null)
    }
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-labelledby="pwa-install-title"
      aria-describedby="pwa-install-description"
      className="fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 mx-auto max-w-[420px] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl sm:inset-x-auto sm:right-6 sm:bottom-[calc(1.5rem+env(safe-area-inset-bottom))] sm:w-[380px]"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0090FF]">
          <Download className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2
            id="pwa-install-title"
            className="text-sm font-bold tracking-tight text-slate-900"
          >
            Install AK Pharma
          </h2>
          <p
            id="pwa-install-description"
            className="mt-1 text-xs leading-relaxed text-slate-500"
          >
            Add the app to your home screen for a full-screen, faster experience.
          </p>
        </div>
        <button
          type="button"
          aria-label="Dismiss install prompt"
          onClick={dismiss}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={dismiss}
          className="h-8 rounded-lg px-3 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100"
        >
          Maybe Later
        </button>
        <button
          type="button"
          onClick={handleInstall}
          disabled={installing}
          className="h-8 rounded-lg bg-[#0090FF] px-3.5 text-xs font-semibold text-white transition-colors hover:bg-[#0080e5] disabled:opacity-60"
        >
          {installing ? "Opening..." : "Install"}
        </button>
      </div>
    </div>
  )
}
