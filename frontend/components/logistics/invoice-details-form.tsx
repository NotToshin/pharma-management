"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatInvoiceDate, type OrderInvoiceData } from "./order-invoice"

export interface InvoiceDetailsInput {
  orderDate: string
  territory: string
  assignedMio: string
  paymentTerms: string
  comments: string
}

export function InvoiceDetailsForm({ order, staff, saving, onSave }: {
  order: OrderInvoiceData
  staff: Array<{ id: string; fullName: string }>
  saving: boolean
  onSave: (details: InvoiceDetailsInput) => Promise<void>
}) {
  const initial = React.useMemo(() => ({
    orderDate: formatInvoiceDate(order.orderDate).split("/").reverse().join("-"),
    territory: order.territory,
    assignedMio: order.assignedMio,
    paymentTerms: order.paymentTerms || "",
    comments: order.comments || "",
  }), [order.id, order.orderDate, order.territory, order.assignedMio, order.paymentTerms, order.comments])
  const [draft, setDraft] = React.useState(initial)
  React.useEffect(() => setDraft(initial), [initial])

  return (
    <form onSubmit={(event) => { event.preventDefault(); void onSave(draft) }}>
      <fieldset disabled={saving} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="invoice-date">Invoice date</Label>
          <Input id="invoice-date" type="date" required value={draft.orderDate}
            onChange={(e) => setDraft({ ...draft, orderDate: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="invoice-territory">Territory</Label>
          <Input id="invoice-territory" required maxLength={200} value={draft.territory}
            onChange={(e) => setDraft({ ...draft, territory: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="invoice-mio">MIO/SR name</Label>
          <Input id="invoice-mio" list="invoice-staff-options" required maxLength={200} value={draft.assignedMio}
            onChange={(e) => setDraft({ ...draft, assignedMio: e.target.value })} />
          <datalist id="invoice-staff-options">
            {staff.map((person) => <option key={person.id} value={person.fullName} />)}
          </datalist>
        </div>
        <div className="space-y-1">
          <Label htmlFor="invoice-terms">Payment terms</Label>
          <Input id="invoice-terms" maxLength={200} placeholder="Use client credit terms" value={draft.paymentTerms}
            onChange={(e) => setDraft({ ...draft, paymentTerms: e.target.value })} />
          <p className="text-xs text-slate-500">Leave blank to use the client's current credit terms.</p>
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="invoice-comments">Comments</Label>
          <Input id="invoice-comments" maxLength={2000} value={draft.comments}
            onChange={(e) => setDraft({ ...draft, comments: e.target.value })} />
        </div>
        <Button type="submit" size="sm" className="sm:col-span-2">{saving ? "Saving…" : "Save invoice details"}</Button>
      </fieldset>
    </form>
  )
}
