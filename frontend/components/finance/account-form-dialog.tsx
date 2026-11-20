"use client"

import * as React from "react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api"
import {
  BANGLADESH_BANKS,
  CUSTOM_INSTITUTION_VALUE,
  institutionsForCategory,
  isKnownInstitution,
} from "@/lib/bank-institutions"
import { bankAccountFormSchema } from "@/lib/validations/bankAccountValidation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface FinancialAccountRecord {
  id: string
  accountTitle: string
  category: "BANK" | "CASH"
  institution: string
  accountNumber: string
  branch: string
  accountClass: string
  balance: number
  isActive?: boolean
  transactionCount?: number
  blockingTransactionCount?: number
  linkedCollections?: number
  linkedExpenses?: number
  linkedSettlements?: number
  canDelete?: boolean
  lastTransactionAt?: string | null
}

interface AccountFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  account: FinancialAccountRecord | null
  onSaved: () => void
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-[10px] font-medium text-rose-600">{message}</p>
}

export function AccountFormDialog({
  open,
  onOpenChange,
  account,
  onSaved,
}: AccountFormDialogProps) {
  const isEdit = Boolean(account?.id)

  const [category, setCategory] = React.useState<"BANK" | "CASH">("BANK")
  const [institution, setInstitution] = React.useState<string>(BANGLADESH_BANKS.conventional[0])
  const [customInstitution, setCustomInstitution] = React.useState(false)
  const [customInstitutionName, setCustomInstitutionName] = React.useState("")
  const [accountTitle, setAccountTitle] = React.useState("")
  const [accountNumber, setAccountNumber] = React.useState("")
  const [branch, setBranch] = React.useState("")
  const [accountClass, setAccountClass] = React.useState("Current")
  const [balance, setBalance] = React.useState("0")
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({})
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (!open) return
    setFormErrors({})
    setSaving(false)

    if (account) {
      setCategory(account.category)
      const known = isKnownInstitution(account.category, account.institution)
      setCustomInstitution(!known)
      setCustomInstitutionName(known ? "" : account.institution)
      setInstitution(
        known ? account.institution : institutionsForCategory(account.category)[0]
      )
      setAccountTitle(account.accountTitle)
      setAccountNumber(account.accountNumber)
      setBranch(account.branch || "")
      setAccountClass(account.accountClass || "")
      setBalance(String(Number(account.balance) || 0))
      return
    }

    setCategory("BANK")
    setCustomInstitution(false)
    setCustomInstitutionName("")
    setInstitution(BANGLADESH_BANKS.conventional[0])
    setAccountTitle("")
    setAccountNumber("")
    setBranch("")
    setAccountClass("Current")
    setBalance("0")
  }, [open, account])

  const handleCategoryChange = (value: "BANK" | "CASH") => {
    setCategory(value)
    if (!customInstitution && !isKnownInstitution(value, institution)) {
      setInstitution(institutionsForCategory(value)[0])
    }
    if (value === "CASH" && (!accountClass || accountClass === "Current")) {
      setAccountClass("Petty Cash")
    }
  }

  const handleInstitutionChange = (value: string) => {
    if (value === CUSTOM_INSTITUTION_VALUE) {
      setCustomInstitution(true)
      setCustomInstitutionName("")
      return
    }
    setCustomInstitution(false)
    setInstitution(value)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const resolvedNumber =
      accountNumber.trim() || (category === "CASH" ? "CASH-VAULT" : "")

    const parsed = bankAccountFormSchema.safeParse({
      accountTitle,
      category,
      institution: customInstitution ? customInstitutionName : institution,
      accountNumber: resolvedNumber,
      branch,
      accountClass,
      balance: balance.trim() === "" ? 0 : balance,
    })

    if (!parsed.success) {
      const nextErrors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] || "form")
        if (!nextErrors[key]) nextErrors[key] = issue.message
      }
      setFormErrors(nextErrors)
      toast.error("Please fix the highlighted account fields.")
      return
    }

    setFormErrors({})
    setSaving(true)
    const values = parsed.data
    const toastId = toast.loading(
      isEdit ? `Updating ${values.accountTitle}...` : `Creating ${values.accountTitle}...`
    )

    try {
      const payload: Record<string, unknown> = {
        accountTitle: values.accountTitle,
        category: values.category,
        institution: values.institution,
        accountNumber: values.accountNumber,
        branch: values.branch || "",
        accountClass: values.accountClass,
      }

      if (isEdit) {
        const originalBalance = Number(account?.balance) || 0
        if (values.balance !== originalBalance) {
          payload.balance = values.balance
        }
      } else {
        payload.initialBalance = values.balance
      }

      const res = await apiFetch(
        isEdit
          ? `/account-ledger/accounts/${account?.id}`
          : "/account-ledger/accounts",
        {
          method: isEdit ? "PUT" : "POST",
          body: JSON.stringify(payload),
        }
      )
      const json = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(json.message || "Failed to save the account")
      }

      toast.success(
        isEdit
          ? `Account "${values.accountTitle}" updated successfully.`
          : `Treasury account "${values.accountTitle}" created successfully.`,
        { id: toastId }
      )
      onOpenChange(false)
      onSaved()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save the account.",
        { id: toastId }
      )
    } finally {
      setSaving(false)
    }
  }

  const institutionValue = customInstitution ? CUSTOM_INSTITUTION_VALUE : institution
  const isCash = category === "CASH"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-xl bg-white sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900">
            {isEdit ? "Edit Bank Account / Cash Drawer" : "Add Bank Account / Cash Drawer"}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            {isEdit
              ? "Update the account details. Any balance change is posted as an adjustment entry in the account statement."
              : "Register a corporate bank account or a physical cash drawer. A non-zero opening balance is posted to the account statement."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 py-2 text-xs">
          <div className="space-y-1">
            <Label className="text-xs font-medium text-slate-700">Type of Account *</Label>
            <Select
              value={category}
              onValueChange={(value: "BANK" | "CASH") => handleCategoryChange(value)}
            >
              <SelectTrigger className="h-8 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="BANK">Corporate Bank Account</SelectItem>
                <SelectItem value="CASH">Physical Cash Drawer / Safe</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-medium text-slate-700">
              {isCash ? "Cash Drawer / Safe Name *" : "Bank / Financial Institution *"}
            </Label>
            <Select value={institutionValue} onValueChange={handleInstitutionChange}>
              <SelectTrigger className="h-8 bg-white" aria-invalid={Boolean(formErrors.institution)}>
                <SelectValue placeholder={isCash ? "Select a drawer" : "Select a bank"} />
              </SelectTrigger>
              <SelectContent className="max-h-[260px] text-xs">
                {isCash ? (
                  <SelectGroup>
                    <SelectLabel className="text-[10px] text-slate-400">
                      Cash Registers &amp; Safes
                    </SelectLabel>
                    {BANGLADESH_BANKS.cashCounters.map((safe) => (
                      <SelectItem key={safe} value={safe}>
                        {safe}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ) : (
                  <>
                    <SelectGroup>
                      <SelectLabel className="text-[10px] text-slate-400">
                        Conventional Banks
                      </SelectLabel>
                      {BANGLADESH_BANKS.conventional.map((bank) => (
                        <SelectItem key={bank} value={bank}>
                          {bank}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel className="text-[10px] text-slate-400">
                        Islamic Shariah Banks
                      </SelectLabel>
                      {BANGLADESH_BANKS.islamic.map((bank) => (
                        <SelectItem key={bank} value={bank}>
                          {bank}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel className="text-[10px] text-slate-400">
                        Foreign / Multinational Banks
                      </SelectLabel>
                      {BANGLADESH_BANKS.foreign.map((bank) => (
                        <SelectItem key={bank} value={bank}>
                          {bank}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </>
                )}
                <SelectGroup>
                  <SelectLabel className="text-[10px] text-slate-400">Not Listed</SelectLabel>
                  <SelectItem value={CUSTOM_INSTITUTION_VALUE}>Other / Custom name</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            {customInstitution && (
              <Input
                autoFocus
                value={customInstitutionName}
                onChange={(event) => setCustomInstitutionName(event.target.value)}
                placeholder={isCash ? "e.g. Tongi Depot Cash Vault" : "e.g. NRB Bank PLC"}
                className="mt-1.5 h-8"
                aria-invalid={Boolean(formErrors.institution)}
              />
            )}
            <FieldError message={formErrors.institution} />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-medium text-slate-700">Display Title *</Label>
            <Input
              value={accountTitle}
              onChange={(event) => setAccountTitle(event.target.value)}
              placeholder={
                isCash
                  ? "e.g. Head Office Main Cash Drawer"
                  : "e.g. EBL Operations Clearing Account"
              }
              className="h-8"
              aria-invalid={Boolean(formErrors.accountTitle)}
            />
            <FieldError message={formErrors.accountTitle} />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs font-medium text-slate-700">
                Account # / Vault ID {isCash ? "" : "*"}
              </Label>
              <Input
                value={accountNumber}
                onChange={(event) => setAccountNumber(event.target.value)}
                placeholder={isCash ? "e.g. SAFE-01" : "e.g. 104-102-998"}
                className="h-8 font-mono"
                aria-invalid={Boolean(formErrors.accountNumber)}
              />
              <FieldError message={formErrors.accountNumber} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium text-slate-700">
                Branch / Physical Location
              </Label>
              <Input
                value={branch}
                onChange={(event) => setBranch(event.target.value)}
                placeholder={isCash ? "e.g. Mirpur 10 HQ" : "e.g. Gulshan Corporate"}
                className="h-8"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs font-medium text-slate-700">Account Class *</Label>
              <Input
                value={accountClass}
                onChange={(event) => setAccountClass(event.target.value)}
                placeholder={isCash ? "Petty Cash / Cash Desk" : "Current / Savings / Escrow"}
                className="h-8"
                aria-invalid={Boolean(formErrors.accountClass)}
              />
              <FieldError message={formErrors.accountClass} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium text-slate-700">
                {isEdit ? "Current Balance (৳)" : "Opening Balance (৳)"}
              </Label>
              <Input
                type="number"
                value={balance}
                onChange={(event) => setBalance(event.target.value)}
                className="h-8 font-mono font-bold"
                aria-invalid={Boolean(formErrors.balance)}
              />
              <FieldError message={formErrors.balance} />
              <p className="text-[10px] leading-relaxed text-slate-400">
                {isEdit
                  ? "Changing this value creates a balance adjustment entry in the statement."
                  : "A non-zero opening balance creates an opening entry in the statement."}
              </p>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="h-8 bg-[#0090FF] text-xs text-white hover:bg-[#0080e5]"
            >
              {saving ? "Saving..." : isEdit ? "Update Account" : "Save Account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
