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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  MapPin,
  Users2,
  Building2,
  Search,
  Filter,
  Plus,
  ShieldCheck,
  Store,
  Calendar,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react"

interface AllocationItem {
  id: string
  mioName: string
  employeeId: string
  phone: string
  division: string
  territory: string
  allocatedZone: string
  assignedDoctors: number
  assignedPharmacies: number
  effectiveDate: string
  status: "Active" | "Probation" | "Reassigning"
}

const initialAllocations: AllocationItem[] = [
  {
    id: "1",
    mioName: "Rafiqul Islam",
    employeeId: "EMP-2041",
    phone: "+880 1711-234567",
    division: "Dhaka Division",
    territory: "Dhaka North",
    allocatedZone: "Sector 3, 7, 9 & Azampur Hub",
    assignedDoctors: 46,
    assignedPharmacies: 32,
    effectiveDate: "01 Jan 2026",
    status: "Active",
  },
  {
    id: "2",
    mioName: "Tanvir Ahmed",
    employeeId: "EMP-2042",
    phone: "+880 1812-345678",
    division: "Dhaka Division",
    territory: "Dhaka South",
    allocatedZone: "Dhanmondi, Green Road & Panthapath",
    assignedDoctors: 52,
    assignedPharmacies: 38,
    effectiveDate: "15 Jan 2026",
    status: "Active",
  },
  {
    id: "3",
    mioName: "Kamrul Hasan",
    employeeId: "EMP-2045",
    phone: "+880 1913-456789",
    division: "Chittagong Division",
    territory: "Chittagong Central",
    allocatedZone: "GEC Circle, Nasirabad & Agrabad C/A",
    assignedDoctors: 42,
    assignedPharmacies: 28,
    effectiveDate: "01 Feb 2026",
    status: "Active",
  },
  {
    id: "4",
    mioName: "Enamul Haque",
    employeeId: "EMP-2051",
    phone: "+880 1614-567890",
    division: "Sylhet Division",
    territory: "Sylhet Sadar",
    allocatedZone: "Zindabazar, Amberkhana & Subidbazar",
    assignedDoctors: 34,
    assignedPharmacies: 22,
    effectiveDate: "10 Mar 2026",
    status: "Probation",
  },
  {
    id: "5",
    mioName: "Sabbir Hossain",
    employeeId: "EMP-2058",
    phone: "+880 1515-678901",
    division: "Rajshahi Division",
    territory: "Rajshahi Metro",
    allocatedZone: "Shaheb Bazar, Laxmipur & Medical College",
    assignedDoctors: 38,
    assignedPharmacies: 24,
    effectiveDate: "01 Feb 2026",
    status: "Active",
  },
  {
    id: "6",
    mioName: "Mahmudul Hasan",
    employeeId: "EMP-2063",
    phone: "+880 1716-789012",
    division: "Khulna Division",
    territory: "Khulna Zone",
    allocatedZone: "Shibbari More, Daulatpur & Boyra",
    assignedDoctors: 30,
    assignedPharmacies: 20,
    effectiveDate: "01 Apr 2026",
    status: "Reassigning",
  },
]

export default function MioZoneAllocationsPage() {
  const [allocations, setAllocations] =
    React.useState<AllocationItem[]>(initialAllocations)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [divisionFilter, setDivisionFilter] = React.useState("all")

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [editingItem, setEditingItem] = React.useState<AllocationItem | null>(
    null
  )

  // Open Edit Form and populate inputs
  const handleOpenEdit = (item: AllocationItem) => {
    setEditingItem({ ...item })
    setIsEditOpen(true)
  }

  // Save changes to item
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return

    setAllocations((prev) =>
      prev.map((item) => (item.id === editingItem.id ? editingItem : item))
    )
    setIsEditOpen(false)
    setEditingItem(null)
  }

  // Delete item
  const handleDelete = (id: string) => {
    setAllocations((prev) => prev.filter((item) => item.id !== id))
  }

  const filteredAllocations = allocations.filter((item) => {
    const matchesSearch =
      item.mioName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.territory.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.allocatedZone.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesDivision =
      divisionFilter === "all" ||
      item.division.toLowerCase().includes(divisionFilter.toLowerCase())

    return matchesSearch && matchesDivision
  })

  return (
    <div className="mx-auto max-w-[1360px] space-y-6 pb-10">
      {/* 1. Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            MIO Zone Allocations
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Field representative territorial assignments, covered clinics, and
            retail territory footprints.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="rounded-lg border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800"
          >
            <ShieldCheck className="mr-1.5 inline h-3.5 w-3.5 text-emerald-600" />
            {allocations.filter((a) => a.status === "Active").length}/
            {allocations.length} Officers Deployed
          </Badge>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200/90 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search officer name, ID, or territory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 border-slate-200 bg-slate-50/50 pl-8 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={divisionFilter} onValueChange={setDivisionFilter}>
            <SelectTrigger className="h-8 w-[160px] border-slate-200 bg-white text-xs">
              <Filter className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
              <SelectValue placeholder="All Divisions" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">All Divisions</SelectItem>
              <SelectItem value="dhaka">Dhaka</SelectItem>
              <SelectItem value="chittagong">Chittagong</SelectItem>
              <SelectItem value="sylhet">Sylhet</SelectItem>
              <SelectItem value="rajshahi">Rajshahi</SelectItem>
              <SelectItem value="khulna">Khulna</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 3. Allocations Table with Edit/Delete Actions */}
      <Card className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-none">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
              FIELD OFFICER ALLOCATIONS REGISTER
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              Assigned boundary limits, verified practitioner contact counts,
              and retail clusters
            </p>
          </div>
          <span className="text-xs font-medium text-slate-400">
            Showing {filteredAllocations.length} Officers
          </span>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 text-xs text-slate-600 hover:bg-transparent">
              <TableHead className="pl-0 text-xs font-medium text-slate-600">
                Officer Details
              </TableHead>
              <TableHead className="text-xs font-medium text-slate-600">
                Territory & Division
              </TableHead>
              <TableHead className="text-xs font-medium text-slate-600">
                Allocated Zone Details
              </TableHead>
              <TableHead className="text-center text-xs font-medium text-slate-600">
                Docs / Stores
              </TableHead>
              <TableHead className="text-xs font-medium text-slate-600">
                Effective Date
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
            {filteredAllocations.map((item) => (
              <TableRow
                key={item.id}
                className="border-b border-slate-50 hover:bg-slate-50/50"
              >
                {/* Officer Details */}
                <TableCell className="py-3 pl-0">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-8 w-8 rounded-full border border-slate-200">
                      <AvatarFallback className="bg-slate-100 text-xs font-semibold text-slate-700">
                        {item.mioName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="leading-tight">
                      <span className="block text-xs font-semibold text-slate-900">
                        {item.mioName}
                      </span>
                      <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-slate-400">
                        <span className="font-mono">{item.employeeId}</span>
                        <span>•</span>
                        <span>{item.phone}</span>
                      </div>
                    </div>
                  </div>
                </TableCell>

                {/* Territory & Division */}
                <TableCell className="py-3 text-xs text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <div>
                      <span className="block font-medium text-slate-900">
                        {item.territory}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {item.division}
                      </span>
                    </div>
                  </div>
                </TableCell>

                {/* Allocated Zone */}
                <TableCell className="max-w-[260px] truncate py-3 text-xs text-slate-600">
                  {item.allocatedZone}
                </TableCell>

                {/* Docs / Stores */}
                <TableCell className="py-3 text-center text-xs">
                  <span className="font-semibold text-slate-900">
                    {item.assignedDoctors}
                  </span>
                  <span className="mx-1 text-slate-400">/</span>
                  <span className="font-medium text-slate-600">
                    {item.assignedPharmacies}
                  </span>
                </TableCell>

                {/* Effective Date */}
                <TableCell className="py-3 text-xs text-slate-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>{item.effectiveDate}</span>
                  </div>
                </TableCell>

                {/* Status */}
                <TableCell className="py-3 text-xs">
                  <Badge
                    variant="outline"
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                      item.status === "Active"
                        ? "border-emerald-300 bg-emerald-50/70 text-emerald-700"
                        : item.status === "Probation"
                          ? "border-amber-300 bg-amber-50/70 text-amber-700"
                          : "border-slate-300 bg-slate-50/70 text-slate-700"
                    }`}
                  >
                    {item.status}
                  </Badge>
                </TableCell>

                {/* Actions Button */}
                <TableCell className="py-3 pr-0 text-right text-xs">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 bg-white">
                      <DropdownMenuLabel className="text-[10px] tracking-wider text-slate-400 uppercase">
                        Actions
                      </DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => handleOpenEdit(item)}
                        className="cursor-pointer text-xs text-slate-700"
                      >
                        <Pencil className="mr-2 h-3.5 w-3.5 text-slate-500" />
                        Edit Allocation
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(item.id)}
                        className="cursor-pointer text-xs text-rose-600 focus:bg-rose-50 focus:text-rose-600"
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        Remove Officer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* 4. Edit Allocation Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="rounded-xl bg-white sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Edit Zone Allocation
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Update territory parameters, clinic counts, or reassign zone
              boundaries.
            </DialogDescription>
          </DialogHeader>

          {editingItem && (
            <form onSubmit={handleSaveEdit} className="space-y-3.5 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="edit-name"
                    className="text-xs font-medium text-slate-700"
                  >
                    Officer Name
                  </Label>
                  <Input
                    id="edit-name"
                    value={editingItem.mioName}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        mioName: e.target.value,
                      })
                    }
                    required
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="edit-phone"
                    className="text-xs font-medium text-slate-700"
                  >
                    Phone
                  </Label>
                  <Input
                    id="edit-phone"
                    value={editingItem.phone}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, phone: e.target.value })
                    }
                    required
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="edit-territory"
                    className="text-xs font-medium text-slate-700"
                  >
                    Territory Hub
                  </Label>
                  <Input
                    id="edit-territory"
                    value={editingItem.territory}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        territory: e.target.value,
                      })
                    }
                    required
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="edit-division"
                    className="text-xs font-medium text-slate-700"
                  >
                    Division
                  </Label>
                  <Input
                    id="edit-division"
                    value={editingItem.division}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        division: e.target.value,
                      })
                    }
                    required
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="edit-zone"
                  className="text-xs font-medium text-slate-700"
                >
                  Allocated Zone Details
                </Label>
                <Input
                  id="edit-zone"
                  value={editingItem.allocatedZone}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      allocatedZone: e.target.value,
                    })
                  }
                  required
                  className="h-8 text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="edit-docs"
                    className="text-xs font-medium text-slate-700"
                  >
                    Docs
                  </Label>
                  <Input
                    id="edit-docs"
                    type="number"
                    value={editingItem.assignedDoctors}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        assignedDoctors: Number(e.target.value),
                      })
                    }
                    required
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="edit-stores"
                    className="text-xs font-medium text-slate-700"
                  >
                    Stores
                  </Label>
                  <Input
                    id="edit-stores"
                    type="number"
                    value={editingItem.assignedPharmacies}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        assignedPharmacies: Number(e.target.value),
                      })
                    }
                    required
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="edit-status"
                    className="text-xs font-medium text-slate-700"
                  >
                    Status
                  </Label>
                  <Select
                    value={editingItem.status}
                    onValueChange={(val) =>
                      setEditingItem({
                        ...editingItem,
                        status: val as AllocationItem["status"],
                      })
                    }
                  >
                    <SelectTrigger className="h-8 bg-white text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Probation">Probation</SelectItem>
                      <SelectItem value="Reassigning">Reassigning</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter className="pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                  className="h-8 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="h-8 bg-[#0090FF] text-xs text-white hover:bg-[#0080e5]"
                >
                  Update Allocation
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
