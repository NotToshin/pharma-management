"use client"

import * as React from "react"
import { RefreshCw, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

export const SERVER_LIST_PAGE_SIZES = [10, 20, 50, 100] as const

export type SortOrder = "asc" | "desc"

export interface ServerListOption {
  value: string
  label: string
}

export interface ServerListFilterField {
  id: string
  value: string
  onValueChange: (value: string) => void
  options: ServerListOption[]
  placeholder?: string
  widthClassName?: string
  icon?: React.ReactNode
}

export interface UseServerListQueryOptions {
  initialPage?: number
  initialLimit?: number
  initialSortBy?: string
  initialSortOrder?: SortOrder
  initialFilters?: Record<string, string>
  debounceMs?: number
}

/**
 * List query state for server-driven tables.
 * Search is debounced. Page resets when search, sort, filter, or page size changes.
 * `queryKey` is the query string the page sends to the API.
 */
export function useServerListQuery(options: UseServerListQueryOptions = {}) {
  const debounceMs = options.debounceMs ?? 350
  const [page, setPage] = React.useState(options.initialPage ?? 1)
  const [limit, setLimitState] = React.useState(options.initialLimit ?? 10)
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [sortBy, setSortBy] = React.useState(options.initialSortBy ?? "")
  const [sortOrder, setSortOrder] = React.useState<SortOrder>(options.initialSortOrder ?? "desc")
  const [filters, setFilters] = React.useState<Record<string, string>>(options.initialFilters ?? {})
  const skipPageReset = React.useRef(true)

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search)
      if (skipPageReset.current) {
        skipPageReset.current = false
        return
      }
      setPage(1)
    }, debounceMs)
    return () => window.clearTimeout(timer)
  }, [search, debounceMs])

  const setLimit = React.useCallback((next: number) => {
    setLimitState(next)
    setPage(1)
  }, [])

  const setFilter = React.useCallback((key: string, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }))
    setPage(1)
  }, [])

  const setSort = React.useCallback((field: string, order: SortOrder = "desc") => {
    setSortBy(field)
    setSortOrder(order)
    setPage(1)
  }, [])

  const params = React.useMemo(() => {
    const searchParams = new URLSearchParams()
    searchParams.set("page", String(page))
    searchParams.set("limit", String(limit))
    const term = debouncedSearch.trim()
    if (term) {
      searchParams.set("searchTerm", term)
      searchParams.set("search", term)
    }
    if (sortBy) searchParams.set("sortBy", sortBy)
    searchParams.set("sortOrder", sortOrder)
    for (const [key, value] of Object.entries(filters)) {
      if (!value || value.toLowerCase() === "all") continue
      searchParams.set(key, value)
    }
    return searchParams
  }, [page, limit, debouncedSearch, sortBy, sortOrder, filters])

  const queryKey = params.toString()

  return {
    page,
    setPage,
    limit,
    setLimit,
    search,
    setSearch,
    debouncedSearch,
    sortBy,
    sortOrder,
    setSort,
    filters,
    setFilter,
    params,
    queryKey,
  }
}

export function buildPaginationItems(page: number, totalPages: number) {
  const items: Array<{ type: "page" | "ellipsis"; page?: number }> = []
  const total = Math.max(1, totalPages)
  const current = Math.min(Math.max(1, page), total)

  if (total <= 5) {
    for (let i = 1; i <= total; i++) items.push({ type: "page", page: i })
    return items
  }

  items.push({ type: "page", page: 1 })
  if (current > 3) items.push({ type: "ellipsis" })
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) items.push({ type: "page", page: i })
  if (current < total - 2) items.push({ type: "ellipsis" })
  items.push({ type: "page", page: total })
  return items
}

interface ServerListToolbarProps {
  search: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  loading?: boolean
  filters?: ServerListFilterField[]
  sort?: {
    value: string
    onValueChange: (value: string) => void
    options: ServerListOption[]
    widthClassName?: string
  }
}

export function ServerListToolbar({
  search,
  onSearchChange,
  searchPlaceholder = "Search...",
  loading = false,
  filters = [],
  sort,
}: ServerListToolbarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200/90 bg-white p-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
      <div className="relative max-w-sm flex-1">
        <Search className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-400" />
        <Input
          placeholder={searchPlaceholder}
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="h-8 border-slate-200 bg-slate-50/50 pr-7 pl-8 text-xs"
        />
        {loading ? (
          <RefreshCw className="absolute top-2.5 right-2.5 h-3 w-3 animate-spin text-slate-400" />
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {sort ? (
          <Select value={sort.value} onValueChange={sort.onValueChange}>
            <SelectTrigger className={`h-8 border-slate-200 bg-white text-xs ${sort.widthClassName ?? "w-[160px]"}`}>
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              {sort.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}

        {filters.map((filter) => (
          <Select key={filter.id} value={filter.value} onValueChange={filter.onValueChange}>
            <SelectTrigger
              className={`h-8 border-slate-200 bg-white text-xs ${filter.widthClassName ?? "w-[160px]"}`}
            >
              {filter.icon}
              <SelectValue placeholder={filter.placeholder} />
            </SelectTrigger>
            <SelectContent className="text-xs">
              {filter.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
      </div>
    </div>
  )
}

interface ServerListPaginationProps {
  page: number
  totalPages: number
  total: number
  limit: number
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
  loading?: boolean
  pageSizeOptions?: readonly number[]
}

export function ServerListPagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onLimitChange,
  loading = false,
  pageSizeOptions = SERVER_LIST_PAGE_SIZES,
}: ServerListPaginationProps) {
  const pages = Math.max(1, totalPages)
  const current = Math.min(Math.max(1, page), pages)
  const items = buildPaginationItems(current, pages)
  const atStart = current <= 1 || loading
  const atEnd = current >= pages || loading

  return (
    <div className="mt-5 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-4 sm:flex-row">
      <div className="flex items-center gap-3 text-xs text-slate-500">
        <span>
          Page {current} of {pages} ({total} total)
        </span>
        <div className="flex items-center gap-1.5">
          <span>Rows per page:</span>
          <Select
            value={String(limit)}
            onValueChange={(value) => onLimitChange(Number(value))}
          >
            <SelectTrigger className="h-7 w-[70px] border-slate-200 bg-white text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="text-xs">
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Pagination className="mx-0 w-auto justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => onPageChange(Math.max(1, current - 1))}
              aria-disabled={atStart}
              className={
                atStart
                  ? "pointer-events-none cursor-not-allowed opacity-40"
                  : "cursor-pointer hover:bg-slate-100"
              }
            />
          </PaginationItem>

          {items.map((item, index) => (
            <PaginationItem key={`${item.type}-${item.page ?? index}`}>
              {item.type === "page" ? (
                <PaginationLink
                  isActive={item.page === current}
                  onClick={() => item.page && onPageChange(item.page)}
                  disabled={loading}
                  className="cursor-pointer"
                >
                  {item.page}
                </PaginationLink>
              ) : (
                <PaginationEllipsis />
              )}
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext
              onClick={() => onPageChange(Math.min(pages, current + 1))}
              aria-disabled={atEnd}
              className={
                atEnd
                  ? "pointer-events-none cursor-not-allowed opacity-40"
                  : "cursor-pointer hover:bg-slate-100"
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
