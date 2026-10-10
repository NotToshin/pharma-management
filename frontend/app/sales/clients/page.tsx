"use client"

import * as React from "react"
import { API_URL } from "@/lib/api"
import * as XLSX from "xlsx"
import { toast } from "sonner"
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Store,
  Plus,
  Download,
  Upload,
  Search,
  Filter,
  Phone,
  FileText,
  CreditCard,
  Printer,
  Pencil,
  Trash2,
  Truck,
  Receipt,
  Clock,
  MoreHorizontal,
} from "lucide-react"

export interface ClientProfile {
  id: string
  clientCode: string
  pharmacyName: string
  proprietor: string
  phone: string
  drugLicenseNo: string
  tradeLicenseNo: string
  address: string
  territory: string
  assignedMio: string
  creditLimitBDT: number
  outstandingBalanceBDT: number
  creditTermDays: number
  status: "Active / Healthy" | "Credit Hold" | "Watchlist"
  lastBilledDate: string
}

export default function ClientsDirectoryPage() {
  const router = useRouter()
  const [clients, setClients] = React.useState<ClientProfile[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [territoryFilter, setTerritoryFilter] = React.useState("all")
  const [statusFilter, setStatusFilter] = React.useState("all")

  // Create & Edit State
  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [formData, setFormData] = React.useState<Omit<ClientProfile, "id">>({
    clientCode: "",
    pharmacyName: "",
    proprietor: "",
    phone: "+880 ",
    drugLicenseNo: "",
    tradeLicenseNo: "",
    address: "",
    territory: "Dhaka North",
    assignedMio: "",
    creditLimitBDT: 150000,
    outstandingBalanceBDT: 0,
    creditTermDays: 30,
    status: "Active / Healthy",
    lastBilledDate: new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
  })

  // Statement / Profile Modal State
  const [activeClient, setActiveClient] = React.useState<ClientProfile | null>(
    null
  )
  const [isStatementOpen, setIsStatementOpen] = React.useState(false)

  // Global Delete Modal State
  const [clientToDelete, setClientToDelete] = React.useState<ClientProfile | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false)
  const [isDeletingClient, setIsDeletingClient] = React.useState(false)

  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  // Fetch Live Client Data from Backend API
  const fetchClients = async () => {
    try {
      const res = await fetch(`${API_URL}/clients`)
      if (!res.ok) throw new Error("Failed to fetch client directory")
      const data = await res.json()

      const formatted = data.map((item: any) => ({
        id: item.id,
        clientCode: item.clientCode || `AKP-CL-${item.id.slice(0, 4)}`,
        pharmacyName: item.pharmacyName,
        proprietor: item.proprietor || "N/A",
        phone: item.phone || "+880 ",
        drugLicenseNo: item.drugLicenseNo || "N/A",
        tradeLicenseNo: item.tradeLicenseNo || "N/A",
        address: item.address || "N/A",
        territory: item.territory || "Dhaka North",
        assignedMio: item.assignedMio || "Unassigned",
        creditLimitBDT: Number(item.creditLimitBDT) || 150000,
        outstandingBalanceBDT: Number(item.outstandingBalanceBDT) || 0,
        creditTermDays: Number(item.creditTermDays) || 30,
        status: item.status || "Active / Healthy",
        lastBilledDate: item.lastBilledDate || "Recent",
      }))

      setClients(formatted)
      setLoading(false)
    } catch (err) {
      console.error("Error loading clients from database:", err)
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchClients()
  }, [])

  // Direct connection to /logistics/orders
  const handleRedirectToOrder = (client: ClientProfile) => {
    const availableCredit = Math.max(
      0,
      client.creditLimitBDT - client.outstandingBalanceBDT
    )
    const params = new URLSearchParams({
      clientCode: client.clientCode,
      pharmacy: client.pharmacyName,
      territory: client.territory,
      mio: client.assignedMio,
      creditStatus: client.status,
      availableCredit: String(availableCredit),
    })
    router.push(`/logistics/orders?${params.toString()}`)
  }

  const handleOpenCreate = () => {
    setEditingId(null)
    setFormData({
      clientCode: `AKP-CL-${Math.floor(1000 + Math.random() * 9000)}`,
      pharmacyName: "",
      proprietor: "",
      phone: "+880 ",
      drugLicenseNo: "",
      tradeLicenseNo: "",
      address: "",
      territory: "Dhaka North",
      assignedMio: "",
      creditLimitBDT: 150000,
      outstandingBalanceBDT: 0,
      creditTermDays: 30,
      status: "Active / Healthy",
      lastBilledDate: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    })
    setIsFormOpen(true)
  }

  const handleOpenEdit = (client: ClientProfile) => {
    setEditingId(client.id)
    setFormData({
      clientCode: client.clientCode,
      pharmacyName: client.pharmacyName,
      proprietor: client.proprietor,
      phone: client.phone,
      drugLicenseNo: client.drugLicenseNo,
      tradeLicenseNo: client.tradeLicenseNo,
      address: client.address,
      territory: client.territory,
      assignedMio: client.assignedMio,
      creditLimitBDT: client.creditLimitBDT,
      outstandingBalanceBDT: client.outstandingBalanceBDT,
      creditTermDays: client.creditTermDays,
      status: client.status,
      lastBilledDate: client.lastBilledDate,
    })
    setIsFormOpen(true)
  }

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault()
    const toastId = toast.loading(editingId ? "Updating pharmacy client record..." : "Enrolling new chemist client...")
    try {
      const endpoint = editingId
        ? `${API_URL}/clients/${editingId}`
        : `${API_URL}/clients`
      const method = editingId ? "PUT" : "POST"

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message || "Failed to save client record")
      }

      toast.success(editingId ? `Pharmacy ${formData.pharmacyName} updated successfully!` : `Pharmacy ${formData.pharmacyName} enrolled successfully!`, { id: toastId })
      setIsFormOpen(false)
      fetchClients()
    } catch (error: any) {
      console.error("Error saving client:", error)
      toast.error(error.message || "Failed to save client record to database.", { id: toastId })
    }
  }

  // Delete Client Handlers
  const handleOpenDeleteModal = (client: ClientProfile) => {
    setClientToDelete(client)
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDeleteClient = async () => {
    if (!clientToDelete) return
    const toastId = toast.loading(`Deleting pharmacy client record for ${clientToDelete.pharmacyName}...`)
    try {
      setIsDeletingClient(true)
      const res = await fetch(`${API_URL}/clients/${clientToDelete.id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message || "Failed to delete client record")
      }

      toast.success(`Pharmacy client ${clientToDelete.pharmacyName} deleted successfully.`, { id: toastId })
      setIsDeleteModalOpen(false)
      setClientToDelete(null)
      fetchClients()
    } catch (error: any) {
      console.error("Error deleting client:", error)
      toast.error(error.message || "Failed to delete client record.", { id: toastId })
    } finally {
      setIsDeletingClient(false)
    }
  }

  // Excel Import Handler
  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result
        const workbook = XLSX.read(bstr, { type: "binary" })
        const wsname = workbook.SheetNames[0]
        const ws = workbook.Sheets[wsname]
        const data = XLSX.utils.sheet_to_json(ws) as any[]

        for (const row of data) {
          const clientPayload = {
            clientCode:
              row["Client Code"] ||
              `AKP-CL-${Math.floor(1000 + Math.random() * 9000)}`,
            pharmacyName:
              row["Pharmacy / Chemist"] ||
              row["Pharmacy Name"] ||
              "Unnamed Pharmacy",
            proprietor: row["Proprietor"] || "N/A",
            phone: String(row["Phone"] || "+880 "),
            drugLicenseNo: String(row["Drug License #"] || "N/A"),
            tradeLicenseNo: String(row["Trade License #"] || "N/A"),
            address: row["Address"] || "N/A",
            territory: row["Territory"] || "Dhaka North",
            assignedMio: row["Assigned MIO"] || "Unassigned",
            creditLimitBDT: Number(row["Credit Limit (BDT)"]) || 150000,
            outstandingBalanceBDT:
              Number(row["Outstanding Balance (BDT)"]) || 0,
            creditTermDays: Number(row["Credit Terms (Days)"]) || 30,
            status: row["Account Status"] || "Active / Healthy",
          }

          await fetch(`${API_URL}/clients`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(clientPayload),
          })
        }

        fetchClients()
        alert("Client Roster imported successfully!")
      } catch (err) {
        console.error("Error parsing Excel file:", err)
        alert("Failed to import Excel file format.")
      }
    }
    reader.readAsBinaryString(file)
  }

  const handleOpenStatement = (client: ClientProfile) => {
    setActiveClient(client)
    setIsStatementOpen(true)
  }

  const handleExportExcel = () => {
    const data = clients.map((c) => ({
      "Client Code": c.clientCode,
      "Pharmacy / Chemist": c.pharmacyName,
      Proprietor: c.proprietor,
      Phone: c.phone,
      "Drug License #": c.drugLicenseNo,
      "Trade License #": c.tradeLicenseNo,
      Address: c.address,
      Territory: c.territory,
      "Assigned MIO": c.assignedMio,
      "Credit Limit (BDT)": c.creditLimitBDT,
      "Outstanding Balance (BDT)": c.outstandingBalanceBDT,
      "Credit Available (BDT)": Math.max(
        0,
        c.creditLimitBDT - c.outstandingBalanceBDT
      ),
      "Credit Terms (Days)": c.creditTermDays,
      "Account Status": c.status,
      "Last Billed Date": c.lastBilledDate,
    }))

    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Client Directory")
    XLSX.writeFile(
      workbook,
      `AK_Pharma_Client_Directory_${new Date().toISOString().slice(0, 10)}.xlsx`
    )
  }

  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.pharmacyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.clientCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.proprietor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.drugLicenseNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.assignedMio.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesTerritory =
      territoryFilter === "all" ||
      c.territory.toLowerCase() === territoryFilter.toLowerCase()

    const matchesStatus =
      statusFilter === "all" ||
      c.status.toLowerCase() === statusFilter.toLowerCase()

    return matchesSearch && matchesTerritory && matchesStatus
  })

  const totalCreditAllocated = clients.reduce(
    (acc, curr) => acc + curr.creditLimitBDT,
    0
  )
  const totalOutstanding = clients.reduce(
    (acc, curr) => acc + curr.outstandingBalanceBDT,
    0
  )
  const totalAvailableHeadroom = Math.max(
    0,
    totalCreditAllocated - totalOutstanding
  )
  const creditHoldCount = clients.filter(
    (c) => c.status === "Credit Hold"
  ).length

  return (
    <div className="mx-auto max-w-[1380px] space-y-6 pb-16">
      {/* Hidden file input for excel import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportExcel}
        accept=".xlsx, .xls, .csv"
        className="hidden"
      />

      {/* 1. Header Toolbar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#0090FF]" />
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              COMMERCIAL SALES & DISTRIBUTION
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
            Pharmacy & Wholesale Client Master
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Licensed chemist accounts, statutory DGDA drug licenses, territorial
            assignments, and credit limit governance.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="h-9 gap-1.5 rounded-lg border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-none hover:bg-slate-50"
          >
            <Upload className="h-3.5 w-3.5 text-blue-600" />
            Import Excel
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportExcel}
            className="h-9 gap-1.5 rounded-lg border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-none hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" />
            Export Directory
          </Button>

          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="h-9 gap-1.5 rounded-lg bg-[#0090FF] px-3.5 text-xs font-semibold text-white shadow-none hover:bg-[#0080e5]"
          >
            <Plus className="h-4 w-4" />
            Onboard New Pharmacy
          </Button>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 print:hidden">
        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              Total Enrolled Accounts
            </span>
            <div className="rounded-xl bg-blue-50 p-2 text-[#0090FF]">
              <Store className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-[28px] leading-none font-extrabold tracking-tight text-slate-900">
            {clients.length} Chemist Outlets
          </div>
          <p className="mt-3 text-[11px] font-medium text-slate-400">
            Active regional database records
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              Total Floating Credit (A/R)
            </span>
            <div className="rounded-xl bg-amber-50 p-2 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-[28px] leading-none font-extrabold tracking-tight text-slate-900">
            ৳{totalOutstanding.toLocaleString("en-IN")}
          </div>
          <p className="mt-3 text-[11px] font-medium text-slate-400">
            Active receivables linked to Collections
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              Available Credit Headroom
            </span>
            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-[28px] leading-none font-extrabold tracking-tight text-emerald-600">
            ৳{totalAvailableHeadroom.toLocaleString("en-IN")}
          </div>
          <p className="mt-3 text-[11px] font-medium text-emerald-600">
            Safe limit capacity for new deliveries
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              Credit Hold Risk
            </span>
            <Badge
              variant="outline"
              className="border-rose-200 bg-rose-50 text-[10px] font-bold text-rose-700"
            >
              {creditHoldCount} Accounts
            </Badge>
          </div>
          <div className="mt-3 font-mono text-[28px] leading-none font-extrabold tracking-tight text-rose-600">
            {creditHoldCount} Blocked
          </div>
          <p className="mt-3 text-[11px] font-medium text-rose-600">
            Dispatch locked pending payment clearance
          </p>
        </Card>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200/90 bg-white p-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search pharmacy, code, proprietor, phone, DL..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 border-slate-200 bg-slate-50/50 pl-8 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={territoryFilter} onValueChange={setTerritoryFilter}>
            <SelectTrigger className="h-8 w-[170px] border-slate-200 bg-white text-xs">
              <Filter className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
              <SelectValue placeholder="All Territories" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">All Territories</SelectItem>
              <SelectItem value="dhaka north">Dhaka North</SelectItem>
              <SelectItem value="dhaka south">Dhaka South</SelectItem>
              <SelectItem value="chittagong central">
                Chittagong Central
              </SelectItem>
              <SelectItem value="sylhet sadar">Sylhet Sadar</SelectItem>
              <SelectItem value="rajshahi metro">Rajshahi Metro</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-[160px] border-slate-200 bg-white text-xs">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active / healthy">Active / Healthy</SelectItem>
              <SelectItem value="credit hold">Credit Hold</SelectItem>
              <SelectItem value="watchlist">Watchlist</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 4. Client Master Table */}
      <Card className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-none print:hidden">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
              REGISTERED PHARMACY & CHEMIST ACCOUNTS
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              Click "Create Order" to auto-dispatch consignments, "Statement"
              for account confirmation, or "Edit" to modify limits
            </p>
          </div>
          <span className="text-xs font-medium text-slate-400">
            Showing {filteredClients.length} Accounts
          </span>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 text-xs text-slate-600 hover:bg-transparent">
              <TableHead className="pl-0 text-xs font-medium text-slate-600">
                Pharmacy & Code
              </TableHead>
              <TableHead className="text-xs font-medium text-slate-600">
                Proprietor & Phone
              </TableHead>
              <TableHead className="text-xs font-medium text-slate-600">
                Drug License #
              </TableHead>
              <TableHead className="text-xs font-medium text-slate-600">
                Territory & MIO
              </TableHead>
              <TableHead className="text-right text-xs font-medium text-slate-600">
                Credit Limit
              </TableHead>
              <TableHead className="text-right text-xs font-medium text-slate-600">
                Dues (A/R)
              </TableHead>
              <TableHead className="text-xs font-medium text-slate-600">
                Status
              </TableHead>
              <TableHead className="pr-0 text-right text-xs font-medium text-slate-600">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-8 text-center text-xs text-slate-400"
                >
                  Loading client directory from database...
                </TableCell>
              </TableRow>
            ) : filteredClients.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-8 text-center text-xs text-slate-400"
                >
                  No pharmacy client records found. Click "Onboard New Pharmacy"
                  or "Import Excel" to add accounts.
                </TableCell>
              </TableRow>
            ) : (
              filteredClients.map((client) => {
                const availableHeadroom = Math.max(
                  0,
                  client.creditLimitBDT - client.outstandingBalanceBDT
                )

                return (
                  <TableRow
                    key={client.id}
                    className="border-b border-slate-50 hover:bg-slate-50/50"
                  >
                    <TableCell className="py-3 pl-0">
                      <div className="leading-tight">
                        <span className="block text-xs font-bold text-slate-900">
                          {client.pharmacyName}
                        </span>
                        <span className="mt-0.5 block font-mono text-[10px] text-[#0090FF]">
                          {client.clientCode}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="py-3 text-xs">
                      <div>
                        <span className="block font-semibold text-slate-900">
                          {client.proprietor}
                        </span>
                        <div className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-400">
                          <Phone className="h-2.5 w-2.5 text-slate-400" />
                          <span className="font-mono text-slate-600">
                            {client.phone}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="py-3 font-mono text-xs text-slate-700">
                      <div>
                        <span className="block font-medium">
                          {client.drugLicenseNo}
                        </span>
                        <span className="block text-[10px] text-slate-400">
                          {client.tradeLicenseNo}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="py-3 text-xs text-slate-700">
                      <div>
                        <span className="block font-medium text-slate-900">
                          {client.territory}
                        </span>
                        <span className="block text-[10px] text-slate-400">
                          MIO: {client.assignedMio}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="py-3 text-right font-mono text-xs text-slate-700">
                      ৳{client.creditLimitBDT.toLocaleString("en-IN")}
                      <span className="block text-[10px] text-slate-400">
                        {client.creditTermDays} Days Term
                      </span>
                    </TableCell>

                    <TableCell className="py-3 text-right font-mono text-xs font-bold text-slate-900">
                      {client.outstandingBalanceBDT > 0 ? (
                        <span
                          className={
                            client.status === "Credit Hold"
                              ? "text-rose-600"
                              : "text-amber-600"
                          }
                        >
                          ৳
                          {client.outstandingBalanceBDT.toLocaleString("en-IN")}
                        </span>
                      ) : (
                        <span className="font-normal text-emerald-600">
                          ৳0 (Clear)
                        </span>
                      )}
                      <span className="block text-[10px] font-normal text-slate-400">
                        Avail: ৳{availableHeadroom.toLocaleString("en-IN")}
                      </span>
                    </TableCell>

                    <TableCell className="py-3 text-xs">
                      <Badge
                        variant="outline"
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          client.status === "Active / Healthy"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : client.status === "Watchlist"
                              ? "border-amber-200 bg-amber-50 text-amber-700"
                              : "border-rose-200 bg-rose-50 text-rose-700"
                        }`}
                      >
                        {client.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="py-3 pr-0 text-right text-xs">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRedirectToOrder(client)}
                          className="h-7 gap-1 border-blue-200 px-2.5 text-xs font-semibold text-[#0090FF] hover:bg-blue-50"
                        >
                          <Truck className="h-3 w-3" />
                          Create Order
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenEdit(client)}
                          className="h-7 gap-1 border-slate-200 px-2 text-xs text-slate-700 hover:bg-slate-50"
                        >
                          <Pencil className="h-3 w-3 text-slate-400" />
                          Edit
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenStatement(client)}
                          className="h-7 gap-1 border-slate-200 px-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <FileText className="h-3 w-3" />
                          Statement
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-7 w-7 p-0 text-slate-400 hover:text-slate-800"
                            >
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-52 bg-white"
                          >
                            <DropdownMenuLabel className="text-[10px] tracking-wider text-slate-400 uppercase">
                              Direct Workflows
                            </DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => handleRedirectToOrder(client)}
                              className="cursor-pointer text-xs"
                            >
                              <Truck className="mr-2 h-3.5 w-3.5 text-[#0090FF]" />
                              Book Delivery Order
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              asChild
                              className="cursor-pointer text-xs"
                            >
                              <Link href="/finance/collections">
                                <Receipt className="mr-2 h-3.5 w-3.5 text-emerald-600" />
                                Record Collection Receipt
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleOpenStatement(client)}
                              className="cursor-pointer text-xs text-slate-700"
                            >
                              <Printer className="mr-2 h-3.5 w-3.5 text-slate-500" />
                              Print Account Statement
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleOpenDeleteModal(client)}
                              className="cursor-pointer text-xs text-rose-600 focus:bg-rose-50 focus:text-rose-600"
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5 text-rose-600" />
                              Delete / Deactivate Client
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* 5. Create & Edit Pharmacy Modal */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto rounded-2xl bg-white sm:max-w-[620px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {editingId
                ? "Edit Pharmacy Client Particulars"
                : "Enroll New Chemist Client"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Configure business licenses, territorial field assignment, and
              credit limits.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveForm} className="space-y-4 py-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">
                  Client Code *
                </Label>
                <Input
                  value={formData.clientCode}
                  onChange={(e) =>
                    setFormData({ ...formData, clientCode: e.target.value })
                  }
                  required
                  className="h-8 font-mono text-xs font-bold"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">
                  Pharmacy / Chemist Name *
                </Label>
                <Input
                  placeholder="e.g. Al-Madina Model Pharmacy"
                  value={formData.pharmacyName}
                  onChange={(e) =>
                    setFormData({ ...formData, pharmacyName: e.target.value })
                  }
                  required
                  className="h-8 text-xs font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">
                  Proprietor Name *
                </Label>
                <Input
                  placeholder="e.g. Rafiq Ahmed"
                  value={formData.proprietor}
                  onChange={(e) =>
                    setFormData({ ...formData, proprietor: e.target.value })
                  }
                  required
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">
                  Official Contact Phone *
                </Label>
                <Input
                  placeholder="+880 1711-000000"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  required
                  className="h-8 font-mono text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">
                  DGDA Drug License # *
                </Label>
                <Input
                  placeholder="DL-DH-00000"
                  value={formData.drugLicenseNo}
                  onChange={(e) =>
                    setFormData({ ...formData, drugLicenseNo: e.target.value })
                  }
                  required
                  className="h-8 font-mono text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">
                  City Trade License #
                </Label>
                <Input
                  placeholder="TRAD/DNCC/00000"
                  value={formData.tradeLicenseNo}
                  onChange={(e) =>
                    setFormData({ ...formData, tradeLicenseNo: e.target.value })
                  }
                  className="h-8 font-mono text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-slate-700">
                Outlet Address *
              </Label>
              <Input
                placeholder="Shop 12, Market Point, Road 4, Dhaka"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                required
                className="h-8 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">
                  Territory
                </Label>
                <Select
                  value={formData.territory}
                  onValueChange={(val) =>
                    setFormData({ ...formData, territory: val })
                  }
                >
                  <SelectTrigger className="h-8 bg-white text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="Dhaka North">Dhaka North</SelectItem>
                    <SelectItem value="Dhaka South">Dhaka South</SelectItem>
                    <SelectItem value="Chittagong Central">
                      Chittagong Central
                    </SelectItem>
                    <SelectItem value="Sylhet Sadar">Sylhet Sadar</SelectItem>
                    <SelectItem value="Rajshahi Metro">
                      Rajshahi Metro
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">
                  Assigned MIO
                </Label>
                <Input
                  placeholder="Rafiqul Islam"
                  value={formData.assignedMio}
                  onChange={(e) =>
                    setFormData({ ...formData, assignedMio: e.target.value })
                  }
                  required
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
              <span className="block text-[11px] font-bold tracking-wider text-slate-800 uppercase">
                Credit Line & Governance
              </span>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-slate-700">
                    Credit Limit (৳)
                  </Label>
                  <Input
                    type="number"
                    value={formData.creditLimitBDT}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        creditLimitBDT: Number(e.target.value) || 0,
                      })
                    }
                    required
                    className="h-8 font-mono text-xs font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-slate-700">
                    Current Dues (৳)
                  </Label>
                  <Input
                    type="number"
                    value={formData.outstandingBalanceBDT}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        outstandingBalanceBDT: Number(e.target.value) || 0,
                      })
                    }
                    className="h-8 font-mono text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-slate-700">
                    Credit Term (Days)
                  </Label>
                  <Input
                    type="number"
                    value={formData.creditTermDays}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        creditTermDays: Number(e.target.value) || 0,
                      })
                    }
                    className="h-8 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">
                  Account Health Status
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(val) =>
                    setFormData({
                      ...formData,
                      status: val as ClientProfile["status"],
                    })
                  }
                >
                  <SelectTrigger className="h-8 bg-white text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="Active / Healthy">
                      Active / Healthy
                    </SelectItem>
                    <SelectItem value="Watchlist">Watchlist</SelectItem>
                    <SelectItem value="Credit Hold">
                      Credit Hold (Dispatch Blocked)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-8 bg-[#0090FF] text-xs text-white hover:bg-[#0080e5]"
              >
                {editingId ? "Save Changes" : "Enroll Pharmacy"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 6. Printable Account Statement & Health Slip */}
      <Dialog open={isStatementOpen} onOpenChange={setIsStatementOpen}>
        <DialogContent className="flex max-h-[95vh] flex-col overflow-hidden rounded-2xl bg-white p-0 sm:max-w-[760px]">
          {activeClient && (
            <>
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 p-4 print:hidden">
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-[#0090FF]" />
                  <span className="text-xs font-bold text-slate-800">
                    Chemist Ledger Certificate — {activeClient.pharmacyName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => window.print()}
                    className="h-8 gap-1.5 bg-[#0090FF] text-xs text-white shadow-none hover:bg-[#0080e5]"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Print Statement
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsStatementOpen(false)}
                    className="h-8 text-xs"
                  >
                    Close
                  </Button>
                </div>
              </div>

              <div
                className="overflow-y-auto p-8 font-sans text-xs leading-relaxed text-slate-900 sm:p-10 print:m-0 print:overflow-visible print:p-0"
                id="printable-client-statement"
              >
                <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
                  <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                      AK PHARMA
                    </h1>
                    <p className="mt-0.5 text-[11px] font-semibold text-slate-600">
                      Commercial Distribution & Credit Management
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Plot 14, Sector 7, Uttara Commercial Zone, Dhaka • DGDA
                      Lic: DL-PH-2026-88
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="block inline-block border border-slate-900 px-2 py-0.5 text-xs font-extrabold tracking-wider text-slate-900 uppercase">
                      CLIENT ACCOUNT STATEMENT
                    </span>
                    <span className="mt-1.5 block font-mono text-xs font-bold text-[#0090FF]">
                      {activeClient.clientCode}
                    </span>
                    <span className="mt-0.5 block font-mono text-[10px] text-slate-500">
                      Date: {new Date().toISOString().slice(0, 10)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 border-b border-slate-300 py-4 text-xs">
                  <div className="space-y-1">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase">
                        Chemist Outlet:
                      </span>
                      <strong className="block text-sm text-slate-900">
                        {activeClient.pharmacyName}
                      </strong>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400">
                        Proprietor / Signatory:
                      </span>
                      <span className="font-semibold text-slate-800">
                        {activeClient.proprietor}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400">
                        Outlet Address:
                      </span>
                      <span className="text-slate-800">
                        {activeClient.address}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 text-right sm:text-left">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase">
                        DGDA Drug License #:
                      </span>
                      <strong className="block font-mono text-slate-900">
                        {activeClient.drugLicenseNo}
                      </strong>
                      <span className="font-mono text-[10px] text-slate-500">
                        {activeClient.tradeLicenseNo}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400">
                        Territory & Assigned Field Officer:
                      </span>
                      <span className="font-medium text-slate-800">
                        {activeClient.territory} • MIO:{" "}
                        {activeClient.assignedMio}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400">
                        Account Standing:
                      </span>
                      <strong
                        className={
                          activeClient.status === "Credit Hold"
                            ? "text-rose-600"
                            : "text-emerald-700"
                        }
                      >
                        {activeClient.status}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Credit Matrix */}
                <div className="my-4 space-y-2 rounded-xl border border-slate-300 bg-slate-50 p-4">
                  <span className="block text-xs font-bold tracking-wider text-slate-800 uppercase">
                    Credit Position & Balance Summary
                  </span>
                  <div className="grid grid-cols-3 gap-4 pt-1 text-xs">
                    <div>
                      <span className="block text-[11px] text-slate-500">
                        Approved Limit:
                      </span>
                      <span className="font-mono text-sm font-bold text-slate-900">
                        ৳{activeClient.creditLimitBDT.toLocaleString("en-IN")}/-
                      </span>
                      <span className="mt-0.5 block text-[10px] text-slate-400">
                        Term: {activeClient.creditTermDays} Days
                      </span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-slate-500">
                        Outstanding Receivable:
                      </span>
                      <span className="font-mono text-sm font-bold text-rose-600">
                        ৳
                        {activeClient.outstandingBalanceBDT.toLocaleString(
                          "en-IN"
                        )}
                        /-
                      </span>
                      <span className="mt-0.5 block text-[10px] text-slate-400">
                        Last Billed: {activeClient.lastBilledDate}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-slate-500">
                        Available Headroom:
                      </span>
                      <span className="font-mono text-sm font-bold text-emerald-600">
                        ৳
                        {Math.max(
                          0,
                          activeClient.creditLimitBDT -
                            activeClient.outstandingBalanceBDT
                        ).toLocaleString("en-IN")}
                        /-
                      </span>
                      <span className="mt-0.5 block text-[10px] font-semibold text-emerald-600">
                        Eligible for Dispatch
                      </span>
                    </div>
                  </div>
                </div>

                <p className="mt-4 text-[11px] leading-relaxed text-slate-500">
                  This confirmation certificate is generated from the central
                  enterprise ledger of AK PHARMA. All shipments dispatched under
                  commercial Delivery Challans remain subject to verified
                  payment realization according to agreed terms.
                </p>

                {/* Sign-off Blocks */}
                <div className="mt-14 grid grid-cols-3 gap-6 border-t-2 border-slate-200 pt-8 text-center text-[11px]">
                  <div>
                    <div className="mx-auto mb-1.5 w-36 border-b border-slate-400" />
                    <span className="block font-bold text-slate-900">
                      {activeClient.assignedMio}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Territory MIO
                    </span>
                  </div>
                  <div>
                    <div className="mx-auto mb-1.5 w-36 border-b border-slate-400" />
                    <span className="block font-bold text-slate-900">
                      Territory Credit Auditor
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Accounts & Receivables
                    </span>
                  </div>
                  <div>
                    <div className="mx-auto mb-1.5 w-36 border-b border-slate-400" />
                    <span className="block font-bold text-slate-900">
                      Authorized Signatory
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Commercial Operations
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Global Delete Confirmation Modal */}
      <DeleteConfirmationModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={handleConfirmDeleteClient}
        title="Delete Pharmacy Client Record"
        description="Are you sure you want to remove this pharmacy client record from the master directory? This action cannot be undone."
        itemName={clientToDelete ? `${clientToDelete.pharmacyName} (${clientToDelete.clientCode} - Prop: ${clientToDelete.proprietor})` : undefined}
        confirmText="Delete Client"
        cancelText="Cancel"
        isDeleting={isDeletingClient}
      />
    </div>
  )
}
