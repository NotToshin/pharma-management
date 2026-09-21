"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
} from "lucide-react";

interface Waypoint {
  id: string;
  order: number;
  stopName: string;
  type: "Doctor Chamber" | "Chemist / Pharmacy" | "Diagnostic Lab";
  location: string;
  estimatedStay: string;
  eta: string;
  priority: "High" | "Medium" | "Low";
}

interface RouteSchedule {
  id: string;
  routeCode: string;
  title: string;
  territory: string;
  mioName: string;
  stopsCount: number;
  totalDistanceKm: number;
  estimatedTransitTime: string;
  efficiencyScore: number;
  status: "Optimal" | "Sub-optimal" | "Under Review";
  waypoints: Waypoint[];
}

const initialRoutes: RouteSchedule[] = [
  {
    id: "1",
    routeCode: "RT-DHK-N1",
    title: "Uttara Clinic & Pharmacy Cluster",
    territory: "Dhaka North",
    mioName: "Rafiqul Islam",
    stopsCount: 6,
    totalDistanceKm: 8.4,
    estimatedTransitTime: "2h 45m",
    efficiencyScore: 94,
    status: "Optimal",
    waypoints: [
      { id: "w1", order: 1, stopName: "Dr. Anwarul Azim Chamber", type: "Doctor Chamber", location: "Sector 3, Uttara", estimatedStay: "20 min", eta: "09:30 AM", priority: "High" },
      { id: "w2", order: 2, stopName: "Labaid Diagnostic Center", type: "Diagnostic Lab", location: "Sector 3 Main Road", estimatedStay: "25 min", eta: "10:05 AM", priority: "High" },
      { id: "w3", order: 3, stopName: "Care Pharmacy", type: "Chemist / Pharmacy", location: "Azampur Bus Stand", estimatedStay: "15 min", eta: "10:45 AM", priority: "Medium" },
      { id: "w4", order: 4, stopName: "Dr. Farhana Yasmin Clinic", type: "Doctor Chamber", location: "Sector 7 Road 1", estimatedStay: "20 min", eta: "11:15 AM", priority: "High" },
      { id: "w5", order: 5, stopName: "Green Life Chemist", type: "Chemist / Pharmacy", location: "Sector 9 Market", estimatedStay: "15 min", eta: "11:50 AM", priority: "Medium" },
      { id: "w6", order: 6, stopName: "Popular Consultation Center", type: "Diagnostic Lab", location: "Jashimuddin Avenue", estimatedStay: "30 min", eta: "12:20 PM", priority: "Low" },
    ],
  },
  {
    id: "2",
    routeCode: "RT-DHK-S2",
    title: "Dhanmondi Hospital Belt",
    territory: "Dhaka South",
    mioName: "Tanvir Ahmed",
    stopsCount: 5,
    totalDistanceKm: 6.2,
    estimatedTransitTime: "2h 10m",
    efficiencyScore: 89,
    status: "Optimal",
    waypoints: [
      { id: "w7", order: 1, stopName: "Dr. S. K. Roy Chamber", type: "Doctor Chamber", location: "Dhanmondi 27", estimatedStay: "20 min", eta: "10:00 AM", priority: "High" },
      { id: "w8", order: 2, stopName: "Ibn Sina Pharmacy Hub", type: "Chemist / Pharmacy", location: "Dhanmondi 15", estimatedStay: "15 min", eta: "10:35 AM", priority: "Medium" },
      { id: "w9", order: 3, stopName: "Medinova Specialized Clinics", type: "Diagnostic Lab", location: "Green Road", estimatedStay: "30 min", eta: "11:10 AM", priority: "High" },
      { id: "w10", order: 4, stopName: "Dr. Mehedi Hasan", type: "Doctor Chamber", location: "Panthapath Signal", estimatedStay: "20 min", eta: "11:55 AM", priority: "Medium" },
      { id: "w11", order: 5, stopName: "Central Model Chemist", type: "Chemist / Pharmacy", location: "Kalabagan", estimatedStay: "15 min", eta: "12:30 PM", priority: "Low" },
    ],
  },
  {
    id: "3",
    routeCode: "RT-CTG-C1",
    title: "GEC Circle - Agrabad Commercial Spine",
    territory: "Chittagong Central",
    mioName: "Kamrul Hasan",
    stopsCount: 4,
    totalDistanceKm: 14.2,
    estimatedTransitTime: "3h 40m",
    efficiencyScore: 72,
    status: "Sub-optimal",
    waypoints: [
      { id: "w12", order: 1, stopName: "Chevron Clinical Lab", type: "Diagnostic Lab", location: "GEC Circle", estimatedStay: "35 min", eta: "10:15 AM", priority: "High" },
      { id: "w13", order: 2, stopName: "Agrabad Health Complex", type: "Doctor Chamber", location: "Agrabad C/A", estimatedStay: "30 min", eta: "11:30 AM", priority: "High" },
      { id: "w14", order: 3, stopName: "Standard Pharma Retail", type: "Chemist / Pharmacy", location: "Badamtoli More", estimatedStay: "20 min", eta: "12:20 PM", priority: "Medium" },
      { id: "w15", order: 4, stopName: "Halishahar Clinic Point", type: "Doctor Chamber", location: "Halishahar Road", estimatedStay: "25 min", eta: "01:05 PM", priority: "Low" },
    ],
  },
];

export default function RouteOptimizationPage() {
  const [routes, setRoutes] = React.useState<RouteSchedule[]>(initialRoutes);
  const [selectedRouteId, setSelectedRouteId] = React.useState<string>(initialRoutes[0].id);
  const [territoryFilter, setTerritoryFilter] = React.useState("all");
  const [isNewRouteOpen, setIsNewRouteOpen] = React.useState(false);

  // New Route Modal Form
  const [routeTitle, setRouteTitle] = React.useState("");
  const [territory, setTerritory] = React.useState("Dhaka North");
  const [mioName, setMioName] = React.useState("");

  const activeRoute = routes.find((r) => r.id === selectedRouteId) || routes[0];

  const handleCreateRoute = (e: React.FormEvent) => {
    e.preventDefault();
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
        { id: `w-${Date.now()}-1`, order: 1, stopName: "Primary Doctor Hub", type: "Doctor Chamber", location: "Central Avenue", estimatedStay: "25 min", eta: "09:30 AM", priority: "High" },
        { id: `w-${Date.now()}-2`, order: 2, stopName: "Model Chemist Hub", type: "Chemist / Pharmacy", location: "Station Road", estimatedStay: "15 min", eta: "10:15 AM", priority: "Medium" },
        { id: `w-${Date.now()}-3`, order: 3, stopName: "General Clinic", type: "Doctor Chamber", location: "Main Market", estimatedStay: "20 min", eta: "10:45 AM", priority: "Medium" },
      ],
    };

    setRoutes((prev) => [newR, ...prev]);
    setSelectedRouteId(newR.id);
    setRouteTitle("");
    setMioName("");
    setIsNewRouteOpen(false);
  };

  const filteredRoutes =
    territoryFilter === "all"
      ? routes
      : routes.filter((r) => r.territory.toLowerCase().includes(territoryFilter.toLowerCase()));

  return (
    <div className="space-y-6 max-w-[1360px] mx-auto pb-10">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Route Optimization & Travel Sequence
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Algorithmic waypoint scheduling, transit time minimization, and field travel efficiency.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={territoryFilter} onValueChange={setTerritoryFilter}>
            <SelectTrigger className="h-9 w-[160px] text-xs bg-white border-slate-200">
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
              <Button size="sm" className="h-9 gap-1.5 bg-[#0090FF] hover:bg-[#0080e5] text-white text-xs font-semibold px-3.5 rounded-lg shadow-none">
                <Plus className="h-4 w-4" />
                Build Optimized Route
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[460px] bg-white rounded-xl">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900">Create New Route Sequence</DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Define territory and assign field officer to generate an automated travel itinerary.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateRoute} className="space-y-3.5 py-2">
                <div className="space-y-1.5">
                  <Label htmlFor="title" className="text-xs font-medium text-slate-700">Route Plan Title</Label>
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
                    <Label htmlFor="ter" className="text-xs font-medium text-slate-700">Territory</Label>
                    <Select value={territory} onValueChange={setTerritory}>
                      <SelectTrigger className="h-8 text-xs bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="text-xs">
                        <SelectItem value="Dhaka North">Dhaka North</SelectItem>
                        <SelectItem value="Dhaka South">Dhaka South</SelectItem>
                        <SelectItem value="Chittagong Central">Chittagong Central</SelectItem>
                        <SelectItem value="Sylhet Sadar">Sylhet Sadar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="mio" className="text-xs font-medium text-slate-700">Assigned Officer</Label>
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
                  <Button type="submit" className="h-8 text-xs bg-[#0090FF] hover:bg-[#0080e5] text-white">
                    Generate Itinerary
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 2. Key Efficiency Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Avg. Route Efficiency</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 leading-none">
            88.3%
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            +18% travel time saved vs manual routes
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Daily Travel Distance</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-[#0090FF]">
              <Compass className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 leading-none">
            9.6 km
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Average distance per field MIO shift
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Transit Duration / Shift</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 leading-none">
            2h 35m
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Leaves 5h 25m for direct physician detailing
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Sub-optimal Flags</span>
            <Badge variant="outline" className="text-[11px] font-semibold text-amber-700 bg-amber-50 border-amber-200 px-2 py-0.5 rounded-md">
              1 Flagged
            </Badge>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 leading-none">
            1 Route
          </div>
          <p className="text-[11px] text-amber-600 font-medium mt-3">
            Chittagong route has high transit variance
          </p>
        </Card>
      </div>

      {/* 3. Main Grid: Route Selector on Left, Timeline Sequencer on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Available Route Plans */}
        <Card className="lg:col-span-5 rounded-xl border border-slate-200/90 shadow-none bg-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
                Active Itinerary Routes
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Select a route to inspect sequence</p>
            </div>
            <span className="text-xs text-slate-400 font-medium">{filteredRoutes.length} Plans</span>
          </div>

          <div className="space-y-2.5">
            {filteredRoutes.map((route) => {
              const isSelected = route.id === selectedRouteId;
              return (
                <div
                  key={route.id}
                  onClick={() => setSelectedRouteId(route.id)}
                  className={`cursor-pointer rounded-xl p-3.5 border transition-all ${
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
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                        route.status === "Optimal"
                          ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                          : "text-amber-700 bg-amber-50 border-amber-200"
                      }`}
                    >
                      {route.status} ({route.efficiencyScore}%)
                    </Badge>
                  </div>

                  <p className="text-xs font-bold text-slate-900 mt-2">{route.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {route.territory} • MIO: {route.mioName}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
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
              );
            })}
          </div>
        </Card>

        {/* Right Column: Ordered Waypoint Timeline */}
        <Card className="lg:col-span-7 rounded-xl border border-slate-200/90 shadow-none bg-white p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-[#0090FF]">
                  {activeRoute.routeCode}
                </span>
                <span className="text-xs text-slate-300">•</span>
                <span className="text-xs font-semibold text-slate-600">{activeRoute.territory}</span>
              </div>
              <h2 className="text-sm font-bold text-slate-900 mt-0.5">{activeRoute.title}</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="h-7 text-xs border-slate-200 gap-1.5 text-slate-700">
                <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
                Re-calculate
              </Button>
              <Button size="sm" className="h-7 text-xs bg-[#0090FF] hover:bg-[#0080e5] text-white shadow-none">
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
                  <div className="absolute left-[13px] top-[26px] bottom-[-16px] w-[2px] bg-slate-200" />
                )}

                {/* Stop Order Indicator */}
                <div className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white border-2 border-[#0090FF] text-[11px] font-bold text-[#0090FF]">
                  {wp.order}
                </div>

                {/* Content Box */}
                <div className="flex-1 rounded-xl p-3 border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900">{wp.stopName}</span>
                      <span className="block text-[11px] text-slate-500 mt-0.5">
                        {wp.location} • <span className="text-slate-400 font-medium">{wp.type}</span>
                      </span>
                    </div>

                    <Badge
                      variant="outline"
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                        wp.priority === "High"
                          ? "text-blue-700 bg-blue-50 border-blue-200"
                          : wp.priority === "Medium"
                          ? "text-slate-700 bg-white border-slate-200"
                          : "text-slate-500 bg-white border-slate-100"
                      }`}
                    >
                      {wp.priority} Priority
                    </Badge>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-200/50 flex items-center justify-between text-[11px] text-slate-500">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span>ETA: <strong className="text-slate-800">{wp.eta}</strong></span>
                    </div>
                    <div>
                      <span>Stay: <strong className="text-slate-800">{wp.estimatedStay}</strong></span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}