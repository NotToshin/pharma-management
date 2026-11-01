"use client"

import * as React from "react"
import { apiFetch, getEndpoint } from "@/lib/api"

export interface MasterTerritory {
  id: string
  name: string
  division?: string | null
  status: string
}

export function groupTerritories(territories: MasterTerritory[]) {
  const groups: Record<string, MasterTerritory[]> = {}
  for (const territory of territories) {
    if (territory.status !== "Active") continue
    const division = territory.division || "General Division"
    if (!groups[division]) groups[division] = []
    groups[division].push(territory)
  }
  return groups
}

export function useTerritories() {
  const [territories, setTerritories] = React.useState<MasterTerritory[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState("")
  const reload = React.useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const response = await apiFetch(getEndpoint("/territories"))
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || "Could not load territories")
      setTerritories(result.data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load territories")
      setTerritories([])
    } finally {
      setLoading(false)
    }
  }, [])
  React.useEffect(() => { void reload() }, [reload])
  return { territories, loading, error, reload }
}
