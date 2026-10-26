"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Loader2, Trash2 } from "lucide-react"

export interface DeleteConfirmationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void | Promise<void>
  title?: string
  description?: string
  itemName?: string
  confirmText?: string
  cancelText?: string
  isDeleting?: boolean
}

export function DeleteConfirmationModal({
  open,
  onOpenChange,
  onConfirm,
  title = "Confirm Deletion",
  description = "Are you sure you want to delete this record? This action cannot be undone.",
  itemName,
  confirmText = "Delete Record",
  cancelText = "Cancel",
  isDeleting = false,
}: DeleteConfirmationModalProps) {
  const handleConfirm = async () => {
    await onConfirm()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl border border-slate-200 bg-white p-6 sm:max-w-[420px] shadow-xl">
        <DialogHeader className="flex flex-col items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600 ring-4 ring-rose-50/50">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-1 text-left">
            <DialogTitle className="text-base font-bold text-slate-900">
              {title}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 leading-relaxed">
              {description}
              {itemName && (
                <span className="mt-2 block rounded-lg border border-slate-100 bg-slate-50 p-2 font-semibold text-slate-800">
                  Target: {itemName}
                </span>
              )}
            </DialogDescription>
          </div>
        </DialogHeader>

        <DialogFooter className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="h-9 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="h-9 bg-rose-600 text-xs font-semibold text-white hover:bg-rose-700 focus:ring-2 focus:ring-rose-500/20"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                {confirmText}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
