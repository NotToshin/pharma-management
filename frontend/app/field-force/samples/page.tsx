"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Gift,
  Pill,
  Search,
  Filter,
  Plus,
  CalendarDays,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  PackageCheck,
} from "lucide-react"

interface DistributionItem {
  id: string
  refCode: string
  itemType: "Sample Drug" | "Promotional Gift"
  itemName: string
  batchOrSku: string
  recipientDoctor: string
  chamberHospital: string
  issuedByMio: string
  territory: string
  quantity: number
  date: string
  complianceStatus: "Logged & Verified" | "Pending Slip" | "Audit Flagged"
}

const initialDistributions: DistributionItem[] = [
  {
    id: "1",
    refCode: "DIS-2026-301",
    itemType: "Sample Drug",
    itemName: "Rosuvastatin 10mg Strips",
    batchOrSku: "BX-7721",
    recipientDoctor: "Dr. Anwarul Azim",
    chamberHospital: "Popular Diagnostic, Dhanmondi",
    issuedByMio: "Rafiqul Islam",
    territory: "Dhaka North",
    quantity: 6,
    date: "16 Sep 2026",
    complianceStatus: "Logged & Verified",
  },
  {
    id: "2",
    refCode: "DIS-2026-302",
    itemType: "Promotional Gift",
    itemName: "Executive Leather Diary & Parker Pen",
    batchOrSku: "GFT-2026-B",
    recipientDoctor: "Dr. Farhana Yasmin",
    chamberHospital: "Labaid Specialized Hospital",
    issuedByMio: "Rafiqul Islam",
    territory: "Dhaka North",
    quantity: 1,
    date: "16 Sep 2026",
    complianceStatus: "Logged & Verified",
  },
  {
    id: "3",
    refCode: "DIS-2026-303",
    itemType: "Sample Drug",
    itemName: "Azithromycin 500mg (Pack of 3)",
    batchOrSku: "BX-9940",
    recipientDoctor: "Dr. S. K. Roy",
    chamberHospital: "Medinova Medical, Mirpur",
    issuedByMio: "Tanvir Ahmed",
    territory: "Dhaka South",
    quantity: 4,
    date: "15 Sep 2026",
    complianceStatus: "Logged & Verified",
  },
  {
    id: "4",
    refCode: "DIS-2026-304",
    itemType: "Sample Drug",
    itemName: "Cef-3 Pediatric Suspension 50ml",
    batchOrSku: "BX-5529",
    recipientDoctor: "Dr. Mehedi Hasan",
    chamberHospital: "Chevron Clinical Lab, Chittagong",
    issuedByMio: "Kamrul Hasan",
    territory: "Chittagong Central",
    quantity: 5,
    date: "15 Sep 2026",
    complianceStatus: "Pending Slip",
  },
  {
    id: "5",
    refCode: "DIS-2026-305",
    itemType: "Promotional Gift",
    itemName: "Digital Stethoscope Desk Clock",
    batchOrSku: "GFT-4410",
    recipientDoctor: "Dr. Mustafizur Rahman",
    chamberHospital: "Ibn Sina Hospital, Sylhet",
    issuedByMio: "Enamul Haque",
    territory: "Sylhet Sadar",
    quantity: 1,
    date: "14 Sep 2026",
    complianceStatus: "Audit Flagged",
  },
  {
    id: "6",
    refCode: "DIS-2026-306",
    itemType: "Sample Drug",
    itemName: "Pantoprazole 20mg Strips",
    batchOrSku: "BX-1284",
    recipientDoctor: "Dr. Nadia Islam",
    chamberHospital: "Apollo Clinic, Rajshahi",
    issuedByMio: "Sabbir Hossain",
    territory: "Rajshahi Metro",
    quantity: 8,
    date: "14 Sep 2026",
    complianceStatus: "Logged & Verified",
  },
]

export default function SampleAndGiftDistributionPage() {
  const [items, setItems] =
    React.useState<DistributionItem[]>(initialDistributions)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [typeFilter, setTypeFilter] = React.useState("all")
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)

  // Form states
  const [itemType, setItemType] = React.useState<
    "Sample Drug" | "Promotional Gift"
  >("Sample Drug")
  const [itemName, setItemName] = React.useState("")
  const [batchOrSku, setBatchOrSku] = React.useState("")
  const [recipientDoctor, setRecipientDoctor] = React.useState("")
  const [chamberHospital, setChamberHospital] = React.useState("")
  const [issuedByMio, setIssuedByMio] = React.useState("")
  const [territory, setTerritory] = React.useState("")
  const [quantity, setQuantity] = React.useState("")

  const handleAddDistribution = (e: React.FormEvent) => {
    e.preventDefault()
    const newItem: DistributionItem = {
      id: Date.now().toString(),
      refCode: `DIS-2026-30${items.length + 7}`,
      itemType,
      itemName,
      batchOrSku: batchOrSku || "GEN-BATCH",
      recipientDoctor,
      chamberHospital,
      issuedByMio,
      territory,
      quantity: Number(quantity) || 1,
      date: "16 Sep 2026",
      complianceStatus: "Logged & Verified",
    }

    setItems((prev) => [newItem, ...prev])
    setItemName("")
    setBatchOrSku("")
    setRecipientDoctor("")
    setChamberHospital("")
    setIssuedByMio("")
    setTerritory("")
    setQuantity("")
    setIsDialogOpen(false)
  }

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.recipientDoctor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.issuedByMio.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.batchOrSku.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesType =
      typeFilter === "all" ||
      item.itemType.toLowerCase().includes(typeFilter.toLowerCase())

    return matchesSearch && matchesType
  })

  const totalSamples = items
    .filter((i) => i.itemType === "Sample Drug")
    .reduce((acc, curr) => acc + curr.quantity, 0)

  const totalGifts = items
    .filter((i) => i.itemType === "Promotional Gift")
    .reduce((acc, curr) => acc + curr.quantity, 0)

  const flaggedCount = items.filter(
    (i) => i.complianceStatus === "Audit Flagged"
  ).length

  return (
    <div className="mx-auto max-w-[1360px] space-y-6 pb-10">
      {/* 1. Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Sample & Gift Distribution Ledger
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Audit-ready tracking of clinical trial drug samples, physician
            collateral, and field inventory reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="rounded-lg border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800"
          >
            <CalendarDays className="mr-1.5 inline h-3.5 w-3.5 text-slate-600" />
            Active Stock Cycle
          </Badge>

          {/* Issue Modal */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="h-9 gap-1.5 rounded-lg bg-[#0090FF] px-3.5 text-xs font-semibold text-white shadow-none hover:bg-[#0080e5]"
              >
                <Plus className="h-4 w-4" />
                Disburse Sample / Gift
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-xl bg-white sm:max-w-[480px]">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900">
                  Record Sample or Gift Issuance
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Log physician receipt details for statutory marketing
                  compliance and warehouse deduction.
                </DialogDescription>
              </DialogHeader>

              <form
                onSubmit={handleAddDistribution}
                className="space-y-3.5 py-2"
              >
                <div className="space-y-1.5">
                  <Label
                    htmlFor="type"
                    className="text-xs font-medium text-slate-700"
                  >
                    Item Category
                  </Label>
                  <Select
                    value={itemType}
                    onValueChange={(val) =>
                      setItemType(val as "Sample Drug" | "Promotional Gift")
                    }
                  >
                    <SelectTrigger className="h-8 bg-white text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      <SelectItem value="Sample Drug">
                        Sample Drug (Physician Free Trial)
                      </SelectItem>
                      <SelectItem value="Promotional Gift">
                        Promotional Gift (Branded Stationery/Device)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="item"
                      className="text-xs font-medium text-slate-700"
                    >
                      Item Name / Formulation
                    </Label>
                    <Input
                      id="item"
                      placeholder="e.g. Napa Extra Strip"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      required
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="batch"
                      className="text-xs font-medium text-slate-700"
                    >
                      Batch # / SKU
                    </Label>
                    <Input
                      id="batch"
                      placeholder="e.g. BX-9941"
                      value={batchOrSku}
                      onChange={(e) => setBatchOrSku(e.target.value)}
                      required
                      className="h-8 font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="doc"
                      className="text-xs font-medium text-slate-700"
                    >
                      Recipient Doctor
                    </Label>
                    <Input
                      id="doc"
                      placeholder="e.g. Dr. Tareq Mahmud"
                      value={recipientDoctor}
                      onChange={(e) => setRecipientDoctor(e.target.value)}
                      required
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="qty"
                      className="text-xs font-medium text-slate-700"
                    >
                      Quantity Issued
                    </Label>
                    <Input
                      id="qty"
                      type="number"
                      placeholder="4"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      required
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="chamber"
                    className="text-xs font-medium text-slate-700"
                  >
                    Chamber / Institute
                  </Label>
                  <Input
                    id="chamber"
                    placeholder="e.g. Popular Diagnostic, Mirpur"
                    value={chamberHospital}
                    onChange={(e) => setChamberHospital(e.target.value)}
                    required
                    className="h-8 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="mio"
                      className="text-xs font-medium text-slate-700"
                    >
                      Issued by MIO
                    </Label>
                    <Input
                      id="mio"
                      placeholder="e.g. Rafiqul Islam"
                      value={issuedByMio}
                      onChange={(e) => setIssuedByMio(e.target.value)}
                      required
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="territory"
                      className="text-xs font-medium text-slate-700"
                    >
                      Territory
                    </Label>
                    <Input
                      id="territory"
                      placeholder="e.g. Dhaka North"
                      value={territory}
                      onChange={(e) => setTerritory(e.target.value)}
                      required
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <DialogFooter className="pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="h-8 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="h-8 bg-[#0090FF] text-xs text-white hover:bg-[#0080e5]"
                  >
                    Confirm & Deduct Stock
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Medicine Samples Disbursed
            </span>
            <div className="rounded-lg bg-blue-50 p-1.5 text-[#0090FF]">
              <Pill className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] leading-none font-bold tracking-tight text-slate-900">
            {totalSamples} Units
          </div>
          <p className="mt-3 text-[11px] text-slate-400">
            Across 4 key therapeutic categories
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Promotional Gifts Issued
            </span>
            <div className="rounded-lg bg-purple-50 p-1.5 text-purple-600">
              <Gift className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] leading-none font-bold tracking-tight text-slate-900">
            {totalGifts} Units
          </div>
          <p className="mt-3 text-[11px] text-slate-400">
            Brand collateral & reminder tokens
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Recipient Doctors
            </span>
            <div className="rounded-lg bg-slate-100 p-1.5 text-slate-700">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] leading-none font-bold tracking-tight text-slate-900">
            {new Set(items.map((i) => i.recipientDoctor)).size} Physicians
          </div>
          <p className="mt-3 text-[11px] text-slate-400">
            Covered in this review interval
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Compliance Audit Flags
            </span>
            <div className="rounded-lg bg-amber-50 p-1.5 text-amber-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] leading-none font-bold tracking-tight text-slate-900">
            {flaggedCount} Cases
          </div>
          <p className="mt-3 text-[11px] font-medium text-amber-600">
            Awaiting signed physical receipt slip
          </p>
        </Card>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200/90 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search by doctor, item name, MIO, or batch..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 border-slate-200 bg-slate-50/50 pl-8 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-8 w-[160px] border-slate-200 bg-white text-xs">
              <Filter className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">All Items</SelectItem>
              <SelectItem value="sample">Sample Drug Only</SelectItem>
              <SelectItem value="gift">Promotional Gift Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 4. Distribution Ledger Table */}
      <Card className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-none">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
              Distribution & Collateral Ledger
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              Statutory verification records for free medicine samples and
              branded materials
            </p>
          </div>
          <span className="text-xs font-medium text-slate-400">
            Showing {filteredItems.length} Records
          </span>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 text-xs text-slate-600 hover:bg-transparent">
              <TableHead className="pl-0 text-xs font-medium text-slate-600">
                Issue Ref
              </TableHead>
              <TableHead className="text-xs font-medium text-slate-600">
                Type
              </TableHead>
              <TableHead className="text-xs font-medium text-slate-600">
                Item Description
              </TableHead>
              <TableHead className="text-xs font-medium text-slate-600">
                Batch / SKU
              </TableHead>
              <TableHead className="text-xs font-medium text-slate-600">
                Recipient Doctor
              </TableHead>
              <TableHead className="text-xs font-medium text-slate-600">
                Issued by (MIO)
              </TableHead>
              <TableHead className="text-center text-xs font-medium text-slate-600">
                Qty
              </TableHead>
              <TableHead className="pr-0 text-right text-xs font-medium text-slate-600">
                Audit Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => (
              <TableRow
                key={item.id}
                className="border-b border-slate-50 hover:bg-slate-50/50"
              >
                <TableCell className="py-3 pl-0 font-mono text-xs font-semibold text-[#0090FF]">
                  {item.refCode}
                </TableCell>
                <TableCell className="py-3 text-xs">
                  <Badge
                    variant="outline"
                    className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${
                      item.itemType === "Sample Drug"
                        ? "border-blue-200 bg-blue-50 text-blue-700"
                        : "border-purple-200 bg-purple-50 text-purple-700"
                    }`}
                  >
                    {item.itemType === "Sample Drug" ? (
                      <Pill className="mr-1 inline h-3 w-3" />
                    ) : (
                      <Gift className="mr-1 inline h-3 w-3" />
                    )}
                    {item.itemType}
                  </Badge>
                </TableCell>
                <TableCell className="py-3 text-xs font-semibold text-slate-900">
                  {item.itemName}
                </TableCell>
                <TableCell className="py-3 font-mono text-xs text-slate-500">
                  {item.batchOrSku}
                </TableCell>
                <TableCell className="py-3 text-xs text-slate-800">
                  <div>
                    <span className="font-medium">{item.recipientDoctor}</span>
                    <span className="block max-w-[200px] truncate text-[10px] text-slate-400">
                      {item.chamberHospital}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-3 text-xs text-slate-600">
                  <div>
                    <span>{item.issuedByMio}</span>
                    <span className="block text-[10px] text-slate-400">
                      ({item.territory})
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-3 text-center text-xs font-bold text-slate-900">
                  {item.quantity}
                </TableCell>
                <TableCell className="py-3 pr-0 text-right text-xs">
                  <Badge
                    variant="outline"
                    className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                      item.complianceStatus === "Logged & Verified"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : item.complianceStatus === "Pending Slip"
                          ? "border-amber-200 bg-amber-50 text-amber-700"
                          : "border-rose-200 bg-rose-50 text-rose-700"
                    }`}
                  >
                    {item.complianceStatus}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
