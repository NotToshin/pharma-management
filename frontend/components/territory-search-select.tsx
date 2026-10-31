"use client"

import * as React from "react"
import { Search, MapPin, Check, ChevronDown, X, Plus, CheckCircle2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

export interface MasterTerritoryItem {
  id: string
  name: string
  division?: string | null
  status?: string
}

interface TerritorySearchSelectProps {
  label?: string
  required?: boolean
  selectedTerritoryName: string
  selectedTerritoryId?: string | null
  territories: MasterTerritoryItem[]
  territoryMioMap?: Record<string, string>
  isCustom: boolean
  customValue: string
  onCustomToggle: (isCustom: boolean) => void
  onCustomChange: (val: string) => void
  onSelect: (territory: { id: string; name: string; division?: string | null }) => void
  placeholder?: string
  className?: string
}

export function TerritorySearchSelect({
  label = "Assigned Territory",
  required = true,
  selectedTerritoryName,
  selectedTerritoryId,
  territories = [],
  territoryMioMap = {},
  isCustom,
  customValue,
  onCustomToggle,
  onCustomChange,
  onSelect,
  placeholder = "Search territory by name or division...",
  className = "",
}: TerritorySearchSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [highlightedIndex, setHighlightedIndex] = React.useState(0)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)

  // Find currently selected territory object
  const currentSelected = React.useMemo(() => {
    if (!selectedTerritoryName && !selectedTerritoryId) return null
    return (
      territories.find(
        (t) =>
          (selectedTerritoryId && t.id === selectedTerritoryId) ||
          t.name.toLowerCase() === selectedTerritoryName.toLowerCase()
      ) || null
    )
  }, [selectedTerritoryName, selectedTerritoryId, territories])

  // Filter territories based on search query
  const filteredTerritories = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return territories
    return territories.filter((t) => {
      const nameMatches = t.name.toLowerCase().includes(q)
      const divisionMatches = (t.division || "").toLowerCase().includes(q)
      const mioMatches = (territoryMioMap[t.name] || "").toLowerCase().includes(q)
      return nameMatches || divisionMatches || mioMatches
    })
  }, [territories, searchQuery, territoryMioMap])

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchQuery("")
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Reset highlighted index on search change
  React.useEffect(() => {
    setHighlightedIndex(0)
  }, [searchQuery])

  // Scroll highlighted item into view
  React.useEffect(() => {
    if (isOpen && listRef.current) {
      const activeEl = listRef.current.children[highlightedIndex] as HTMLElement
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" })
      }
    }
  }, [highlightedIndex, isOpen])

  const handleSelect = (terr: MasterTerritoryItem) => {
    onSelect({ id: terr.id, name: terr.name, division: terr.division })
    setIsOpen(false)
    setSearchQuery("")
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        e.preventDefault()
        setIsOpen(true)
      }
      return
    }

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev < filteredTerritories.length - 1 ? prev + 1 : prev))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (filteredTerritories[highlightedIndex]) {
        handleSelect(filteredTerritories[highlightedIndex])
      } else if (searchQuery.trim()) {
        onCustomToggle(true)
        onCustomChange(searchQuery.trim())
        setIsOpen(false)
      }
    } else if (e.key === "Escape") {
      e.preventDefault()
      setIsOpen(false)
      setSearchQuery("")
    }
  }

  return (
    <div className={`space-y-1.5 ${className}`} ref={containerRef}>
      {/* Label and Mode Switcher */}
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold text-slate-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </Label>
        <button
          type="button"
          onClick={() => {
            const nextMode = !isCustom
            onCustomToggle(nextMode)
            if (nextMode) {
              setIsOpen(false)
            } else {
              setSearchQuery("")
            }
          }}
          className="text-[11px] font-semibold text-[#0090FF] hover:underline"
        >
          {isCustom ? "Pick from Master Collection" : "+ Enter Custom"}
        </button>
      </div>

      {isCustom ? (
        <Input
          id="custom-territory-input"
          placeholder="e.g. Jamalpur Town"
          value={customValue}
          onChange={(e) => onCustomChange(e.target.value)}
          required={required}
          className="h-9 text-xs"
        />
      ) : (
        <div className="relative">
          {/* Search & Select Input Trigger */}
          <div className="relative flex items-center">
            {currentSelected && !isOpen ? (
              <MapPin className="absolute left-2.5 h-3.5 w-3.5 text-[#0090FF] shrink-0" />
            ) : (
              <Search className="absolute left-2.5 h-3.5 w-3.5 text-slate-400 shrink-0" />
            )}
            <Input
              ref={inputRef}
              type="text"
              readOnly={!isOpen && Boolean(selectedTerritoryName)}
              value={isOpen ? searchQuery : selectedTerritoryName || ""}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (!isOpen) {
                  setIsOpen(true)
                  setSearchQuery("")
                }
              }}
              onClick={() => {
                if (!isOpen) {
                  setIsOpen(true)
                  setSearchQuery("")
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder={selectedTerritoryName || placeholder}
              className={`h-9 pl-8 pr-16 text-xs bg-white cursor-pointer ${
                isOpen ? "border-[#0090FF] ring-2 ring-[#0090FF]/20" : ""
              }`}
            />

            {/* Clear and Dropdown Toggle Buttons */}
            <div className="absolute right-1.5 flex items-center gap-0.5">
              {(selectedTerritoryName || searchQuery) && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSearchQuery("")
                    if (selectedTerritoryName) {
                      onSelect({ id: "", name: "", division: null })
                    }
                    if (inputRef.current) inputRef.current.focus()
                    setIsOpen(true)
                  }}
                  className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  title="Clear territory"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsOpen((prev) => !prev)
                  if (!isOpen) setSearchQuery("")
                }}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform duration-150 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Active Selection Details Pill */}
          {currentSelected && !isOpen && (
            <div className="mt-1.5 flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50/50 px-2.5 py-1 text-[11px] text-slate-700">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#0090FF]" />
                <span className="font-semibold text-slate-900">{currentSelected.name}</span>
                {currentSelected.division && (
                  <Badge
                    variant="outline"
                    className="border-blue-200 bg-white px-1.5 py-0 text-[10px] text-blue-700 font-medium"
                  >
                    {currentSelected.division}
                  </Badge>
                )}
              </div>
              {territoryMioMap[currentSelected.name] && (
                <span className="text-[10px] text-slate-500">
                  Default MIO:{" "}
                  <strong className="text-slate-700">
                    {territoryMioMap[currentSelected.name]}
                  </strong>
                </span>
              )}
            </div>
          )}

          {/* Search Results Dropdown Menu */}
          {isOpen && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl flex flex-col">
              {/* Telemetry Status Bar */}
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-3 py-1.5 text-[10px] text-slate-500">
                <span className="font-semibold uppercase tracking-wider text-slate-600">
                  Master Territory Collection
                </span>
                <span>
                  {filteredTerritories.length} of {territories.length} territories
                </span>
              </div>

              {/* Scrollable Results List */}
              <div
                ref={listRef}
                className="max-h-52 overflow-y-auto p-1.5 space-y-0.5 text-xs"
              >
                {filteredTerritories.length === 0 ? (
                  <div className="py-4 px-3 text-center">
                    <p className="text-xs text-slate-500">
                      No territories matching &ldquo;
                      <span className="font-semibold text-slate-800">{searchQuery}</span>
                      &rdquo;
                    </p>
                    {searchQuery.trim() && (
                      <button
                        type="button"
                        onClick={() => {
                          onCustomToggle(true)
                          onCustomChange(searchQuery.trim())
                          setIsOpen(false)
                        }}
                        className="mt-2 inline-flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-[#0090FF] hover:bg-blue-100"
                      >
                        <Plus className="h-3 w-3" />
                        Use &ldquo;{searchQuery.trim()}&rdquo; as custom territory
                      </button>
                    )}
                  </div>
                ) : (
                  filteredTerritories.map((terr, index) => {
                    const isSelected =
                      (selectedTerritoryId && terr.id === selectedTerritoryId) ||
                      terr.name.toLowerCase() === selectedTerritoryName.toLowerCase()
                    const isHighlighted = index === highlightedIndex

                    return (
                      <div
                        key={terr.id}
                        onClick={() => handleSelect(terr)}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        className={`flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 transition-colors ${
                          isSelected
                            ? "bg-blue-50 text-blue-900 font-semibold"
                            : isHighlighted
                            ? "bg-slate-100 text-slate-900"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <MapPin
                            className={`h-3.5 w-3.5 shrink-0 ${
                              isSelected ? "text-[#0090FF]" : "text-slate-400"
                            }`}
                          />
                          <span className="text-xs">{terr.name}</span>
                          {territoryMioMap[terr.name] && (
                            <span className="text-[10px] text-slate-400">
                              ({territoryMioMap[terr.name]})
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {terr.division && (
                            <Badge
                              variant="outline"
                              className="border-slate-200 bg-slate-50 px-1.5 py-0 text-[10px] text-slate-500 font-normal shrink-0"
                            >
                              {terr.division}
                            </Badge>
                          )}
                          {isSelected && <Check className="h-3.5 w-3.5 text-[#0090FF]" />}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Footer Quick Action */}
              <div className="border-t border-slate-100 bg-slate-50/50 p-1.5">
                <button
                  type="button"
                  onClick={() => {
                    onCustomToggle(true)
                    onCustomChange(searchQuery.trim() || "")
                    setIsOpen(false)
                  }}
                  className="flex w-full items-center justify-center gap-1 rounded-md py-1 text-[11px] font-semibold text-[#0090FF] hover:bg-blue-50"
                >
                  <Plus className="h-3 w-3" />
                  Enter custom territory name manually
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

