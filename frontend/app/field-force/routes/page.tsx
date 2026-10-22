"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
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
  Navigation,
  MapPin,
  Clock,
  Fuel,
  Sparkles,
  ArrowRight,
  Plus,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Footprints,
  Compass,
  Building2,
  Calendar,
} from "lucide-react"

interface Waypoint {
  id: string
  order: number
  stopName: string
  type: "Doctor Chamber" | "Chemist / Pharmacy" | "Diagnostic Lab"
  location: string
  estimatedStay: string
  eta: string
  priority: "High" | "Medium" | "Low"
}

interface RouteSchedule {
  id: string
  routeCode: string
  title: string
  territory: string
  mioName: string
  stopsCount: number
  totalDistanceKm: number
  estimatedTransitTime: string
  efficiencyScore: number
  status: "Optimal" | "Sub-optimal" | "Under Review"
  waypoints: Waypoint[]
}
export default function RouteOptimizationPage() {
  const [routes, setRoutes] = React.useState<RouteSchedule[]>([])
  const [selectedRouteId, setSelectedRouteId] = React.useState<string>("")
  const [territoryFilter, setTerritoryFilter] = React.useState("all")
  const [isNewRouteOpen, setIsNewRouteOpen] = React.useState(false)

  // New Route Modal Form
  const [routeTitle, setRouteTitle] = React.useState("")
  const [territory, setTerritory] = React.useState("Dhaka North")
  const [mioName, setMioName] = React.useState("")

  const activeRoute = routes.find((r) => r.id === selectedRouteId) || routes[0] || null

  const handleCreateRoute = (e: React.FormEvent) => {
    e.preventDefault()
    const newR: RouteSchedule = {
      id: Date.now().toString(),
      routeCode: `RT-${territory.slice(0, 3).toUpperCase()}-${routes.length + 1}`,
      title: routeTitle,
      territory,
      mioName,
      stopsCount: 3,
      totalDistanceKm: 5.5,
      estimatedTransitTime: "1h 45m",
      efficiencyScore: 92,
      status: "Optimal",
      waypoints: [
        {
          id: `w-${Date.now()}-1`,
          order: 1,
          stopName: "Primary Doctor Hub",
          type: "Doctor Chamber",
          location: "Central Avenue",
          estimatedStay: "25 min",
          eta: "09:30 AM",
          priority: "High",
        },
        {
          id: `w-${Date.now()}-2`,
          order: 2,
          stopName: "Model Chemist Hub",
          type: "Chemist / Pharmacy",
          location: "Station Road",
          estimatedStay: "15 min",
          eta: "10:15 AM",
          priority: "Medium",
        },
        {
          id: `w-${Date.now()}-3`,
          order: 3,
          stopName: "General Clinic",
          type: "Doctor Chamber",
          location: "Main Market",
          estimatedStay: "20 min",
          eta: "10:45 AM",
          priority: "Medium",
        },
      ],
    }

    setRoutes((prev) => [newR, ...prev])
    setSelectedRouteId(newR.id)
    setRouteTitle("")
    setMioName("")
    setIsNewRouteOpen(false)
  }

  const filteredRoutes =
    territoryFilter === "all"
      ? routes
      : routes.filter((r) =>
          r.territory.toLowerCase().includes(territoryFilter.toLowerCase())
        )

  return (
    <div className="mx-auto max-w-[1360px] space-y-6 pb-10">
      {/* 1. Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Route Optimization & Travel Sequence
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Algorithmic waypoint scheduling, transit time minimization, and
            field travel efficiency.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={territoryFilter} onValueChange={setTerritoryFilter}>
            <SelectTrigger className="h-9 w-[160px] border-slate-200 bg-white text-xs">
              <SelectValue placeholder="All Territories" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">All Territories</SelectItem>
              <SelectItem value="dhaka north">Dhaka North</SelectItem>
              <SelectItem value="dhaka south">Dhaka South</SelectItem>
              <SelectItem value="chittagong">Chittagong</SelectItem>
            </SelectContent>
          </Select>

          {/* New Route Modal */}
          <Dialog open={isNewRouteOpen} onOpenChange={setIsNewRouteOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="h-9 gap-1.5 rounded-lg bg-[#0090FF] px-3.5 text-xs font-semibold text-white shadow-none hover:bg-[#0080e5]"
              >
                <Plus className="h-4 w-4" />
                Build Optimized Route
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-xl bg-white sm:max-w-[460px]">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900">
                  Create New Route Sequence
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Define territory and assign field officer to generate an
                  automated travel itinerary.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateRoute} className="space-y-3.5 py-2">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="title"
                    className="text-xs font-medium text-slate-700"
                  >
                    Route Plan Title
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g. Mirpur 10 - 14 Clinic Circuit"
                    value={routeTitle}
                    onChange={(e) => setRouteTitle(e.target.value)}
                    required
                    className="h-8 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="ter"
                      className="text-xs font-medium text-slate-700"
                    >
                      Territory
                    </Label>
                    <Select value={territory} onValueChange={setTerritory}>
                      <SelectTrigger className="h-8 bg-white text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="text-xs">
                        <SelectItem value="Dhaka North">Dhaka North</SelectItem>
                        <SelectItem value="Dhaka South">Dhaka South</SelectItem>
                        <SelectItem value="Chittagong Central">
                          Chittagong Central
                        </SelectItem>
                        <SelectItem value="Sylhet Sadar">
                          Sylhet Sadar
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="mio"
                      className="text-xs font-medium text-slate-700"
                    >
                      Assigned Officer
                    </Label>
                    <Input
                      id="mio"
                      placeholder="e.g. Rafiqul Islam"
                      value={mioName}
                      onChange={(e) => setMioName(e.target.value)}
                      required
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <DialogFooter className="pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsNewRouteOpen(false)}
                    className="h-8 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="h-8 bg-[#0090FF] text-xs text-white hover:bg-[#0080e5]"
                  >
                    Generate Itinerary
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 2. Key Efficiency Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Avg. Route Efficiency
            </span>
            <div className="rounded-lg bg-emerald-50 p-1.5 text-emerald-600">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] leading-none font-bold tracking-tight text-slate-900">
            88.3%
          </div>
          <p className="mt-3 text-[11px] text-slate-400">
            +18% travel time saved vs manual routes
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Daily Travel Distance
            </span>
            <div className="rounded-lg bg-blue-50 p-1.5 text-[#0090FF]">
              <Compass className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] leading-none font-bold tracking-tight text-slate-900">
            9.6 km
          </div>
          <p className="mt-3 text-[11px] text-slate-400">
            Average distance per field MIO shift
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Transit Duration / Shift
            </span>
            <div className="rounded-lg bg-slate-100 p-1.5 text-slate-700">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] leading-none font-bold tracking-tight text-slate-900">
            2h 35m
          </div>
          <p className="mt-3 text-[11px] text-slate-400">
            Leaves 5h 25m for direct physician detailing
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Sub-optimal Flags
            </span>
            <Badge
              variant="outline"
              className="rounded-md border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700"
            >
              1 Flagged
            </Badge>
          </div>
          <div className="mt-3 text-[28px] leading-none font-bold tracking-tight text-slate-900">
            1 Route
          </div>
          <p className="mt-3 text-[11px] font-medium text-amber-600">
            Chittagong route has high transit variance
          </p>
        </Card>
      </div>

      {/* 3. Main Grid: Route Selector on Left, Timeline Sequencer on Right */}
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
        {/* Left Column: Available Route Plans */}
        <Card className="space-y-4 rounded-xl border border-slate-200/90 bg-white p-5 shadow-none lg:col-span-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
                Active Itinerary Routes
              </h3>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Select a route to inspect sequence
              </p>
            </div>
            <span className="text-xs font-medium text-slate-400">
              {filteredRoutes.length} Plans
            </span>
          </div>

          <div className="space-y-2.5">
            {filteredRoutes.map((route) => {
              const isSelected = route.id === selectedRouteId
              return (
                <div
                  key={route.id}
                  onClick={() => setSelectedRouteId(route.id)}
                  className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
                    isSelected
                      ? "border-[#0090FF] bg-blue-50/25 shadow-xs"
                      : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-[#0090FF]">
                      {route.routeCode}
                    </span>
                    <Badge
                      variant="outline"
                      className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                        route.status === "Optimal"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-amber-200 bg-amber-50 text-amber-700"
                      }`}
                    >
                      {route.status} ({route.efficiencyScore}%)
                    </Badge>
                  </div>

                  <p className="mt-2 text-xs font-bold text-slate-900">
                    {route.title}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {route.territory} • MIO: {route.mioName}
                  </p>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] text-slate-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-slate-400" />
                      <span>{route.stopsCount} Stops</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Compass className="h-3 w-3 text-slate-400" />
                      <span>{route.totalDistanceKm} km</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span>{route.estimatedTransitTime}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Right Column: Ordered Waypoint Timeline */}
        <Card className="space-y-5 rounded-xl border border-slate-200/90 bg-white p-6 shadow-none lg:col-span-7">
          <div className="flex flex-col gap-2 border-b border-slate-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-[#0090FF]">
                  {activeRoute.routeCode}
                </span>
                <span className="text-xs text-slate-300">•</span>
                <span className="text-xs font-semibold text-slate-600">
                  {activeRoute.territory}
                </span>
              </div>
              <h2 className="mt-0.5 text-sm font-bold text-slate-900">
                {activeRoute.title}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1.5 border-slate-200 text-xs text-slate-700"
              >
                <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
                Re-calculate
              </Button>
              <Button
                size="sm"
                className="h-7 bg-[#0090FF] text-xs text-white shadow-none hover:bg-[#0080e5]"
              >
                Dispatch Route
              </Button>
            </div>
          </div>

          {/* Waypoint Chronological Flow */}
          <div className="space-y-4">
            {activeRoute.waypoints.map((wp, idx) => (
              <div key={wp.id} className="relative flex items-start gap-4">
                {/* Visual Line connector */}
                {idx !== activeRoute.waypoints.length - 1 && (
                  <div className="absolute top-[26px] bottom-[-16px] left-[13px] w-[2px] bg-slate-200" />
                )}

                {/* Stop Order Indicator */}
                <div className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-[#0090FF] bg-white text-[11px] font-bold text-[#0090FF]">
                  {wp.order}
                </div>

                {/* Content Box */}
                <div className="flex-1 rounded-xl border border-slate-100 bg-slate-50/50 p-3 transition-colors hover:bg-slate-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900">
                        {wp.stopName}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-slate-500">
                        {wp.location} •{" "}
                        <span className="font-medium text-slate-400">
                          {wp.type}
                        </span>
                      </span>
                    </div>

                    <Badge
                      variant="outline"
                      className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${
                        wp.priority === "High"
                          ? "border-blue-200 bg-blue-50 text-blue-700"
                          : wp.priority === "Medium"
                            ? "border-slate-200 bg-white text-slate-700"
                            : "border-slate-100 bg-white text-slate-500"
                      }`}
                    >
                      {wp.priority} Priority
                    </Badge>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between border-t border-slate-200/50 pt-2 text-[11px] text-slate-500">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span>
                        ETA:{" "}
                        <strong className="text-slate-800">{wp.eta}</strong>
                      </span>
                    </div>
                    <div>
                      <span>
                        Stay:{" "}
                        <strong className="text-slate-800">
                          {wp.estimatedStay}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
