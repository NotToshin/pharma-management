"use client"

import * as React from "react"
import { toast } from "sonner"
import { DivisionTerritoryFields } from "@/components/division-territory-fields"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { MasterTerritory } from "@/hooks/use-territories"
import { formatInvoiceDate, type OrderInvoiceData } from "./order-invoice"

export interface InvoiceDetailsInput {
  orderDate: string
  territoryId: string
  territory: string
  assignedMio: string
  paymentTerms: string
  comments: string
}

interface InvoiceDetailsDraft {
  orderDate: string
  territoryId: string
  territory: string
  assignedMio: string
  paymentTerms: string
  comments: string
}

export function InvoiceDetailsForm({ order, staff, saving, onSave, territoryGroups, territoriesLoading, territoriesError }: {
  order: OrderInvoiceData
  staff: Array<{ id: string; fullName: string }>
  saving: boolean
  onSave: (details: InvoiceDetailsInput) => Promise<void>
  territoryGroups: Record<string, MasterTerritory[]>
  territoriesLoading: boolean
  territoriesError: string
}) {
  const initial = React.useMemo<InvoiceDetailsDraft>(() => ({
    orderDate: formatInvoiceDate(order.orderDate).split("/").reverse().join("-"),
    territoryId: order.territoryId || "",
    territory: order.territory,
    assignedMio: order.assignedMio,
    paymentTerms: order.paymentTerms || "",
    comments: order.comments || "",
  }), [order.id, order.orderDate, order.territoryId, order.territory, order.assignedMio, order.paymentTerms, order.comments])
  const [draft, setDraft] = React.useState<InvoiceDetailsDraft>(initial)
  const [territoryError, setTerritoryError] = React.useState("")
  React.useEffect(() => {
    setDraft(initial)
    setTerritoryError("")
  }, [initial])

  const selectedTerritory = React.useMemo(() => {
    const territories = Object.values(territoryGroups).flat()
    return territories.find(territory => territory.id === draft.territoryId)
      ?? territories.find(territory => territory.name.toLowerCase() === draft.territory.trim().toLowerCase())
  }, [territoryGroups, draft.territoryId, draft.territory])

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault()
    if (territoriesLoading) {
      toast.error("Territory stations are still loading. Please try again.")
      return
    }
    if (territoriesError) {
      toast.error(territoriesError)
      return
    }
    if (!selectedTerritory) {
      setTerritoryError("Select a division and territory station.")
      toast.error("Select a division and territory station.")
      return
    }
    setTerritoryError("")
    void onSave({
      ...draft,
      territoryId: selectedTerritory.id,
      territory: selectedTerritory.name,
    })
  }

  return (
    <form onSubmit={handleSave}>
      <fieldset disabled={saving} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="invoice-date">Invoice date</Label>
          <Input id="invoice-date" type="date" required value={draft.orderDate}
            onChange={(e) => setDraft({ ...draft, orderDate: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="invoice-mio">MIO/SR name</Label>
          <Input id="invoice-mio" list="invoice-staff-options" required maxLength={200} value={draft.assignedMio}
            onChange={(e) => setDraft({ ...draft, assignedMio: e.target.value })} />
          <datalist id="invoice-staff-options">
            {staff.map((person) => <option key={person.id} value={person.fullName} />)}
          </datalist>
        </div>
        <DivisionTerritoryFields
          className="sm:col-span-2"
          groups={territoryGroups}
          value={draft.territory}
          selectedTerritoryId={draft.territoryId}
          onValueChange={(territory) => {
            setDraft({ ...draft, territory: territory.name, territoryId: territory.id })
            setTerritoryError("")
          }}
          loading={territoriesLoading}
          error={territoriesError}
          validationError={territoryError}
          idPrefix="invoice"
        />
        <div className="space-y-1">
          <Label htmlFor="invoice-terms">Payment terms</Label>
          <Input id="invoice-terms" maxLength={200} placeholder="Use client credit terms" value={draft.paymentTerms}
            onChange={(e) => setDraft({ ...draft, paymentTerms: e.target.value })} />
          <p className="text-xs text-slate-500">Leave blank to use the client's current credit terms.</p>
        </div>
        <div className="space-y-1">
          <Label htmlFor="invoice-comments">Comments</Label>
          <Input id="invoice-comments" maxLength={2000} value={draft.comments}
            onChange={(e) => setDraft({ ...draft, comments: e.target.value })} />
        </div>
        <Button type="submit" size="sm" className="sm:col-span-2" disabled={territoriesLoading}>
          {saving ? "Saving…" : "Save invoice details"}
        </Button>
      </fieldset>
    </form>
  )
}
