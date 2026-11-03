"use client"

import * as React from "react"
import { RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

interface GlobalLoadingSpinnerProps {
  /** Optional message shown under the spinner. */
  message?: string
  /** Spinner size. */
  size?: "sm" | "md" | "lg"
  /**
   * "block" renders an inline centered block for a page section;
   * "overlay" covers its relative parent with a translucent backdrop.
   */
  variant?: "block" | "overlay"
  className?: string
}

const SIZE_CLASS: Record<NonNullable<GlobalLoadingSpinnerProps["size"]>, string> = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
}

/**
 * Global loading spinner used across the app.
 * Import from `@/components/ui/global-loading-spinner` on any page.
 */
export function GlobalLoadingSpinner({
  message,
  size = "md",
  variant = "block",
  className,
}: GlobalLoadingSpinnerProps) {
  if (variant === "overlay") {
    return (
      <div
        role="status"
        aria-live="polite"
        className={cn(
          "absolute inset-0 z-40 flex flex-col items-center justify-center bg-white/70 backdrop-blur-[2px]",
          className
        )}
      >
        <RefreshCw className={cn("animate-spin text-[#0090FF]", SIZE_CLASS[size])} />
        {message ? <p className="mt-2 text-xs font-medium text-slate-600">{message}</p> : null}
      </div>
    )
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("flex flex-col items-center justify-center py-16 text-slate-400", className)}
    >
      <RefreshCw className={cn("animate-spin text-[#0090FF]", SIZE_CLASS[size])} />
      {message ? <p className="mt-2 text-xs font-medium">{message}</p> : null}
    </div>
  )
}

export default GlobalLoadingSpinner
