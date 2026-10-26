"use client"

import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

export function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      theme="light"
      duration={500}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-slate-900 group-[.toaster]:border-slate-200 group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl text-xs font-sans",
          description: "group-[.toast]:text-slate-500 text-[11px]",
          actionButton:
            "group-[.toast]:bg-slate-900 group-[.toast]:text-white font-medium text-xs",
          cancelButton:
            "group-[.toast]:bg-slate-100 group-[.toast]:text-slate-500 font-medium text-xs",
        },
      }}
      {...props}
    />
  )
}
