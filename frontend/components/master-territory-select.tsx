"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTerritories } from "@/hooks/use-territories"

// Legacy forms use a name; the API resolves it to an ID and canonical label.
export function MasterTerritorySelect({ value, onValueChange, id, className, optional = false, all = false }: {
  value: string
  onValueChange: (name: string) => void
  id?: string
  className?: string
  optional?: boolean
  all?: boolean
}) {
  const { territories, loading, error } = useTerritories()
  const selected = territories.find(t => t.id === value || t.name.toLowerCase() === value.toLowerCase())
  const choices = territories.filter(t => all || t.status === "Active" || t.id === selected?.id)
  return (
    <div className="space-y-1">
      <Select value={value === "all" && all ? "all" : selected?.id ?? (optional && !value ? "unassigned" : "")}
        onValueChange={id => onValueChange(id === "all" ? "all" : id === "unassigned" ? "" : territories.find(t => t.id === id)?.name ?? "")}
        disabled={loading || Boolean(error)}>
        <SelectTrigger id={id} aria-label="Territory" className={className ?? "h-8 bg-white text-xs"}>
          <SelectValue placeholder={loading ? "Loading territories..." : "Select territory"} />
        </SelectTrigger>
        <SelectContent className="max-h-60 text-xs">
          {all && <SelectItem value="all">All Territories</SelectItem>}
          {optional && <SelectItem value="unassigned">Unassigned</SelectItem>}
          {choices.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
          {!choices.length && <SelectItem value="empty" disabled>No master territories available</SelectItem>}
        </SelectContent>
      </Select>
      {error && <p role="alert" className="text-xs text-rose-600">{error}</p>}
      {!loading && !error && value && value !== "all" && !selected && <p className="text-xs text-amber-700">Previous territory: {value}. Select a master territory.</p>}
    </div>
  )
}
