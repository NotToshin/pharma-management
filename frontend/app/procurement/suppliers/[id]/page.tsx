"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api"
import {
  ServerListPagination,
  ServerListToolbar,
  useServerListQuery,
} from "@/components/server-list-controls"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileBadge,
  ShieldCheck,
  Truck,
  Star,
  Clock,
  Package,
  Wallet,
  ArrowUpRight,
  FileText,
} from "lucide-react"

interface Wholesaler {
  id: string
  wholesalerCode: string
  name: string
  contactPerson: string
  phone: string
  email?: string | null
  drugLicenseNo: string
  tradeLicense?: string | null
  address: string
  territory: string
  paymentTerms: string
  rating: number
  status: string
  leadTimeDays: number
  suppliedCategories: string[]
}

interface OpenBill {
  id: string
  number: string
  date: string
  total: number
  paid: number
  balance: number
  documentStatus: string
}

interface Settlement {
  id: string
  paymentNumber: string
  amount: number
  paymentMethod: string
  paymentDate: string
  status: string
}

interface PurchaseOrder {
  id: string
  poNumber: string
  poDate: string
  status: string
  totalAmountBDT: number
  paidAmountBDT: number
  paymentStatus: string
}

const money = (value: number) =>
  `৳${(Number(value) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function statusClass(status: string) {
  if (status === "Active") return "border-emerald-200 bg-emerald-50 text-emerald-700"
  if (status === "Under Review") return "border-amber-200 bg-amber-50 text-amber-700"
  if (status === "Blacklisted") return "border-rose-200 bg-rose-50 text-rose-700"
  return "border-slate-200 bg-slate-50 text-slate-700"
}

function poStatusClass(status: string) {
  if (status === "Received") return "border-emerald-200 bg-emerald-50 text-emerald-700"
  if (status === "Approved") return "border-blue-200 bg-blue-50 text-blue-700"
  if (status === "Submitted" || status === "Partially Received") return "border-amber-200 bg-amber-50 text-amber-700"
  if (status === "Cancelled") return "border-rose-200 bg-rose-50 text-rose-700"
  return "border-slate-200 bg-slate-50 text-slate-700"
}

const PO_STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "Draft", label: "Draft" },
  { value: "Submitted", label: "Submitted" },
  { value: "Approved", label: "Approved" },
  { value: "Partially Received", label: "Partially Received" },
  { value: "Received", label: "Received" },
  { value: "Cancelled", label: "Cancelled" },
]

export default function SupplierDetailsPage() {
  const params = useParams<{ id: string }>()
  const supplierId = Array.isArray(params?.id) ? params.id[0] : params?.id || ""

  const [supplier, setSupplier] = React.useState<Wholesaler | null>(null)
  const [bills, setBills] = React.useState<OpenBill[]>([])
  const [payments, setPayments] = React.useState<Settlement[]>([])
  const [balances, setBalances] = React.useState({ openBalance: 0, advanceBalance: 0 })
  const [loading, setLoading] = React.useState(true)
  const [notFound, setNotFound] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<"orders" | "register">("orders")

  // Server-driven purchase order list (search, filter, pagination)
  const ordersQuery = useServerListQuery({ initialLimit: 10, initialFilters: { status: "all" } })
  const [orders, setOrders] = React.useState<PurchaseOrder[]>([])
  const [ordersMeta, setOrdersMeta] = React.useState({ total: 0, totalPages: 1 })
  const [ordersLoading, setOrdersLoading] = React.useState(false)

  const ordersQueryString = React.useMemo(() => {
    const params = new URLSearchParams(ordersQuery.queryKey)
    if (supplier) params.set("wholesaler", supplier.name)
    return params.toString()
  }, [ordersQuery.queryKey, supplier])

  React.useEffect(() => {
    if (!supplier) return
    let cancelled = false

    const loadOrders = async () => {
      setOrdersLoading(true)
      try {
        const res = await apiFetch(`/procurement/orders?${ordersQueryString}`)
        const json = await res.json()
        if (cancelled) return
        if (!res.ok) throw new Error(json.message || "Failed to load purchase orders")
        setOrders(Array.isArray(json.data) ? json.data : [])
        setOrdersMeta({
          total: json.meta?.total || 0,
          totalPages: json.meta?.totalPage || json.meta?.totalPages || 1,
        })
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "Failed to load purchase orders")
        }
      } finally {
        if (!cancelled) setOrdersLoading(false)
      }
    }

    loadOrders()
    return () => {
      cancelled = true
    }
  }, [ordersQueryString, supplier])

  React.useEffect(() => {
    if (!supplierId) return
    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const res = await apiFetch(`/wholesalers/${supplierId}`)
        const json = await res.json()
        if (!res.ok) {
          if (res.status === 404 && !cancelled) setNotFound(true)
          throw new Error(json.message || "Failed to load supplier details")
        }
        const loaded = json.data as Wholesaler
        if (cancelled) return
        setSupplier(loaded)
        setNotFound(false)

        try {
          const [billsRes, payRes] = await Promise.all([
            apiFetch(`/settlements/open-bills?direction=OUTGOING&partyName=${encodeURIComponent(loaded.name)}`),
            apiFetch(`/settlements?direction=OUTGOING&partyName=${encodeURIComponent(loaded.name)}&limit=all`),
          ])
          const billsJson = await billsRes.json()
          const payJson = await payRes.json()
          if (cancelled) return

          if (billsRes.ok) {
            setBills(billsJson.data?.bills || [])
            const party = (billsJson.data?.parties || []).find(
              (item: { name: string }) =>
                (item.name || "").trim().toLowerCase() === loaded.name.trim().toLowerCase()
            )
            setBalances({
              openBalance: party?.openBalance || 0,
              advanceBalance: party?.advanceBalance || 0,
            })
          }
          if (payRes.ok) {
            const rows = Array.isArray(payJson.data) ? payJson.data : []
            setPayments(rows.filter((row: Settlement) => row.status === "COMPLETED"))
          }
        } catch (summaryError) {
          if (!cancelled) {
            toast.error(
              summaryError instanceof Error
                ? summaryError.message
                : "Could not load this supplier's payment summary"
            )
          }
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "Failed to load supplier details")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [supplierId])

  if (loading) {
    return <div className="p-6 text-xs text-slate-400">Loading supplier details...</div>
  }

  if (notFound || !supplier) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-[620px] flex-col items-center justify-center p-6 text-center">
        <div className="w-full rounded-2xl border border-rose-200 bg-rose-50/40 p-8">
          <Badge variant="outline" className="border-rose-300 bg-white px-3 py-1 text-xs font-bold text-rose-700 uppercase">
            Supplier Not Found
          </Badge>
          <h2 className="mt-4 text-xl font-black tracking-tight text-slate-900">
            This supplier no longer exists in the vendor registry
          </h2>
          <p className="mt-2.5 text-xs leading-relaxed text-slate-600">
            The wholesaler may have been deregistered from the approved vendor directory.
          </p>
          <div className="mt-6 flex justify-center">
            <Button asChild variant="outline" size="sm" className="h-9 text-xs font-semibold">
              <Link href="/finance/supplier-payments">
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                Back to Supplier Payments
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const totalPaid = payments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white">
            <Building2 className="h-5 w-5 text-[#0090FF]" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">{supplier.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] text-slate-400">{supplier.wholesalerCode}</span>
              <Badge variant="outline" className={`text-[10px] ${statusClass(supplier.status)}`}>
                {supplier.status}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm" className="h-9 text-xs font-semibold">
            <Link href="/finance/supplier-payments">
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              Supplier Payments
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="h-9 text-xs font-semibold">
            <Link href="/procurement/orders">
              <FileText className="mr-1.5 h-3.5 w-3.5" />
              Purchase Orders
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-slate-200 p-4 shadow-none">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Open payable</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{money(balances.openBalance)}</p>
          <p className="mt-1 text-[11px] text-slate-400">{bills.length} open purchase order{bills.length === 1 ? "" : "s"}</p>
        </Card>
        <Card className="border-slate-200 p-4 shadow-none">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Advance balance</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{money(balances.advanceBalance)}</p>
          <p className="mt-1 text-[11px] text-slate-400">Unapplied supplier advance</p>
        </Card>
        <Card className="border-slate-200 p-4 shadow-none">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Total paid</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{money(totalPaid)}</p>
          <p className="mt-1 text-[11px] text-slate-400">{payments.length} recorded payment{payments.length === 1 ? "" : "s"}</p>
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="border-slate-200 p-4 shadow-none">
          <div className="mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[#0090FF]" />
            <h2 className="text-sm font-bold text-slate-900">Contact &amp; Address</h2>
          </div>
          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-2.5">
              <Phone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
              <div>
                <p className="font-semibold text-slate-800">{supplier.phone}</p>
                <p className="text-[11px] text-slate-400">Contact: {supplier.contactPerson || "—"}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
              <p className="break-all font-mono text-[11px] text-slate-600">{supplier.email || "—"}</p>
            </div>
            <div className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
              <p className="leading-relaxed text-slate-600">{supplier.address}</p>
            </div>
          </div>
        </Card>

        <Card className="border-slate-200 p-4 shadow-none">
          <div className="mb-3 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#0090FF]" />
            <h2 className="text-sm font-bold text-slate-900">Regulatory &amp; Compliance</h2>
          </div>
          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-2.5">
              <FileBadge className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">DGDA Drug License</p>
                <p className="font-mono font-semibold text-slate-800">{supplier.drugLicenseNo}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Trade License</p>
                <p className="font-mono font-semibold text-slate-800">{supplier.tradeLicense || "—"}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Territory</p>
                <p className="font-semibold text-slate-800">{supplier.territory || "—"}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Package className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Supplied Categories</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {(supplier.suppliedCategories || []).length === 0 ? (
                    <span className="text-slate-400">—</span>
                  ) : (
                    supplier.suppliedCategories.map((category) => (
                      <Badge key={category} variant="outline" className="border-slate-200 bg-slate-50 text-[10px] text-slate-600">
                        {category}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="border-slate-200 p-4 shadow-none">
          <div className="mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#0090FF]" />
            <h2 className="text-sm font-bold text-slate-900">Commercial Terms</h2>
          </div>
          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-2.5">
              <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Payment Terms</p>
                <p className="font-semibold text-slate-800">{supplier.paymentTerms}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Truck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Lead Time</p>
                <p className="font-semibold text-slate-800">{supplier.leadTimeDays} day{supplier.leadTimeDays === 1 ? "" : "s"}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Star className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Supplier Rating</p>
                <p className="font-semibold text-slate-800">{Number(supplier.rating || 0).toFixed(1)} / 5.0</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Registry Status</p>
                <Badge variant="outline" className={`mt-0.5 text-[10px] ${statusClass(supplier.status)}`}>
                  {supplier.status}
                </Badge>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="border-slate-200 p-4 shadow-none">
        {/* Navigation Tabs (White Active State, RBAC style) */}
        <div className="mb-3 border-b border-slate-100 pb-3">
          <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200/80 bg-slate-100/80 p-1">
            <button
              type="button"
              onClick={() => setActiveTab("orders")}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                activeTab === "orders"
                  ? "bg-white font-bold text-slate-900 shadow-xs ring-1 ring-slate-900/5"
                  : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
              }`}
            >
              <ArrowUpRight className={`h-3.5 w-3.5 ${activeTab === "orders" ? "text-[#0090FF]" : "text-slate-400"}`} />
              <span>Purchase Order</span>
              <span
                className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  activeTab === "orders" ? "bg-blue-50 text-[#0090FF]" : "bg-slate-200/70 text-slate-600"
                }`}
              >
                {ordersMeta.total}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("register")}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                activeTab === "register"
                  ? "bg-white font-bold text-slate-900 shadow-xs ring-1 ring-slate-900/5"
                  : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
              }`}
            >
              <Wallet className={`h-3.5 w-3.5 ${activeTab === "register" ? "text-[#0090FF]" : "text-slate-400"}`} />
              <span>Payment Register</span>
              <span
                className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  activeTab === "register" ? "bg-blue-50 text-[#0090FF]" : "bg-slate-200/70 text-slate-600"
                }`}
              >
                {payments.length}
              </span>
            </button>
          </div>
        </div>

        {activeTab === "orders" && (
        <div className="space-y-3">
          <ServerListToolbar
            search={ordersQuery.search}
            onSearchChange={ordersQuery.setSearch}
            searchPlaceholder="Search PO number, ref, or contact..."
            loading={ordersLoading}
            filters={[
              {
                id: "status",
                value: ordersQuery.filters.status || "all",
                onValueChange: (value) => ordersQuery.setFilter("status", value),
                options: PO_STATUS_OPTIONS,
                placeholder: "All Statuses",
                widthClassName: "w-[190px]",
              },
            ]}
          />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Order</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-right text-xs">Total</TableHead>
                <TableHead className="text-right text-xs">Paid</TableHead>
                <TableHead className="text-right text-xs">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordersLoading && orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-xs text-slate-400">
                    Loading purchase orders...
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-xs text-slate-400">
                    No purchase orders match this search or filter.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="py-3">
                      <span className="block font-mono text-xs font-bold text-[#0090FF]">{order.poNumber}</span>
                      <span className="text-[10px] text-slate-400">{order.poDate}</span>
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge variant="outline" className={`text-[10px] ${poStatusClass(order.status)}`}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 text-right font-mono text-xs">{money(order.totalAmountBDT)}</TableCell>
                    <TableCell className="py-3 text-right font-mono text-xs text-slate-500">{money(order.paidAmountBDT)}</TableCell>
                    <TableCell className="py-3 text-right font-mono text-xs font-bold">
                      {money(Math.max(0, (Number(order.totalAmountBDT) || 0) - (Number(order.paidAmountBDT) || 0)))}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <ServerListPagination
            page={ordersQuery.page}
            totalPages={ordersMeta.totalPages}
            total={ordersMeta.total}
            limit={ordersQuery.limit}
            onPageChange={ordersQuery.setPage}
            onLimitChange={ordersQuery.setLimit}
            loading={ordersLoading}
          />
        </div>
        )}

        {activeTab === "register" && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Receipt</TableHead>
              <TableHead className="text-xs">Date</TableHead>
              <TableHead className="text-xs">Method</TableHead>
              <TableHead className="text-right text-xs">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-xs text-slate-400">
                  No payments recorded for this supplier yet.
                </TableCell>
              </TableRow>
            ) : (
              payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="py-3">
                    <span className="block font-mono text-xs font-bold text-slate-800">{payment.paymentNumber}</span>
                  </TableCell>
                  <TableCell className="py-3 text-xs text-slate-600">{payment.paymentDate}</TableCell>
                  <TableCell className="py-3 text-xs text-slate-600">{payment.paymentMethod}</TableCell>
                  <TableCell className="py-3 text-right font-mono text-xs font-bold">{money(payment.amount)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        )}
      </Card>

      <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
        <Wallet className="h-3.5 w-3.5" />
        Balances and payments reflect posted supplier settlements against this vendor.
      </p>
    </div>
  )
}
