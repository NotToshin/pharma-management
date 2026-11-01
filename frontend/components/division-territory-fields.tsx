"use client"

import * as React from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { MasterTerritory } from "@/hooks/use-territories"

export function DivisionTerritoryFields({ groups, value, onValueChange, loading, error, idPrefix, validationError }: {
  groups: Record<string, MasterTerritory[]>
  value: string
  onValueChange: (territory: MasterTerritory) => void
  loading: boolean
  error: string
  idPrefix: string
  validationError?: string
}) {
  const [requestedDivision, setRequestedDivision] = React.useState("")
  const divisions = Object.keys(groups).sort()
  const selected = Object.values(groups).flat().find(territory => territory.name.toLowerCase() === value.trim().toLowerCase())
  const division = selected ? selected.division || "General Division" : requestedDivision

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor={`${idPrefix}-division`} className="text-xs font-semibold text-slate-700">Division *</Label>
          <Select value={division} onValueChange={nextDivision => {
            setRequestedDivision(nextDivision)
            const first = groups[nextDivision]?.[0]
            if (first) onValueChange(first)
          }} disabled={loading || Boolean(error) || divisions.length === 0}>
            <SelectTrigger id={`${idPrefix}-division`} className="h-8 bg-white text-xs" aria-invalid={Boolean(validationError)}>
              <SelectValue placeholder={loading ? "Loading divisions..." : "Select Division"} />
            </SelectTrigger>
            <SelectContent className="text-xs">
              {divisions.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor={`${idPrefix}-territory`} className="text-xs font-semibold text-slate-700">Territory Station *</Label>
          <Select value={selected?.id || ""} onValueChange={id => {
            const territory = groups[division]?.find(item => item.id === id)
            if (territory) onValueChange(territory)
          }} disabled={loading || Boolean(error) || !division}>
            <SelectTrigger id={`${idPrefix}-territory`} className="h-8 bg-white text-xs" aria-invalid={Boolean(validationError)}>
              <SelectValue placeholder="Select Territory" />
            </SelectTrigger>
            <SelectContent className="max-h-56 text-xs">
              {(groups[division] || []).map(territory => <SelectItem key={territory.id} value={territory.id}>{territory.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      {(error || validationError) && <p role="alert" className="text-xs text-rose-600">{error || validationError}</p>}
      {!loading && !error && divisions.length === 0 && <p className="text-xs text-amber-700">No active territories available. Create a master territory before continuing.</p>}
      {!loading && !error && value && !selected && <p className="text-xs text-amber-700">Previous territory: {value}. Select a master territory.</p>}
    </div>
  )
}
