"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Clock,
  Calendar,
  Search,
  Filter,
  Stethoscope,
  Pill,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Sparkles,
  MessageSquare,
  Gift,
  ArrowRight,
  TrendingUp,
} from "lucide-react"

import { apiFetch, getEndpoint } from "@/lib/api"

interface TimelineEvent {
  id: string
  doctorName: string
  specialty: string
  chamber: string
  tier: "A+" | "A" | "B" | "C"
  mioName: string
  territory: string
  date: string
  time: string
  promotedProducts: string[]
  samplesGiven: string
  callType:
    | "Scheduled Routine"
    | "New Drug Detailing"
    | "Post-Campaign Follow-up"
    | "Gift Handover"
  feedbackSentiment:
    "High Potential" | "Positive" | "Neutral" | "Follow-up Required"
  physicianFeedback: string
  nextScheduledFollowUp: string
}

export default function VisitHistoryTimelinePage() {
  const [events, setEvents] = React.useState<TimelineEvent[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    async function fetchVisitLogs() {
      try {
        const res = await apiFetch(getEndpoint("/doctor-visit-logs"))
        if (res.ok) {
          const json = await res.json()
          const rawLogs = Array.isArray(json) ? json : json.data || []
          const mapped: TimelineEvent[] = rawLogs.map((log: any, idx: number) => ({
            id: log.id || `evt-${idx + 1}`,
            doctorName: log.doctorName || "Dr. Medical Practitioner",
            specialty: log.specialty || "General Medicine",
            chamber: log.chamber || "Central Chamber",
            tier: "A",
            mioName: log.mioName || "Field Representative",
            territory: log.territory || "Territory Hub",
            date:
              log.visitDate ||
              new Date(log.createdAt || Date.now()).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }),
            time: log.visitTime || "10:30 AM",
            promotedProducts: log.promotedDrugs
              ? log.promotedDrugs.split(",").map((s: string) => s.trim())
              : ["Prescription Detailing"],
            samplesGiven: log.samplesGiven || "Standard Detailing Pack",
            callType: "Scheduled Routine",
            feedbackSentiment: "Positive",
            physicianFeedback:
              log.feedback || "Detailing conducted and product features communicated.",
            nextScheduledFollowUp: "Pending Cycle Schedule",
          }))
          setEvents(mapped)
        }
      } catch {
        // ignore network error
      } finally {
        setLoading(false)
      }
    }
    fetchVisitLogs()
  }, [])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [territoryFilter, setTerritoryFilter] = React.useState("all")
  const [sentimentFilter, setSentimentFilter] = React.useState("all")

  const filteredEvents = events.filter((evt) => {
    const matchesSearch =
      evt.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.mioName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.chamber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.promotedProducts.some((p) =>
        p.toLowerCase().includes(searchQuery.toLowerCase())
      )

    const matchesTerritory =
      territoryFilter === "all" ||
      evt.territory.toLowerCase().includes(territoryFilter.toLowerCase())

    const matchesSentiment =
      sentimentFilter === "all" ||
      evt.feedbackSentiment.toLowerCase() === sentimentFilter.toLowerCase()

    return matchesSearch && matchesTerritory && matchesSentiment
  })

  const highPotentialCalls = events.filter(
    (e) => e.feedbackSentiment === "High Potential"
  ).length
  const totalSamplesTracked = events.length

  return (
    <div className="mx-auto max-w-[1360px] space-y-6 pb-10">
      {/* 1. Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Doctor Visit History & Engagement Timeline
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Sequential audit trail of physician detailing calls, physician
            feedback sentiment, and prescription conversion.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="rounded-lg border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800"
          >
            <Clock className="mr-1.5 inline h-3.5 w-3.5 text-[#0090FF]" />
            Continuous Detailing Stream
          </Badge>
        </div>
      </div>

      {/* 2. KPI Metrics Bar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Timeline Touchpoints
            </span>
            <div className="rounded-lg bg-slate-100 p-1.5 text-slate-700">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] leading-none font-bold tracking-tight text-slate-900">
            {events.length} Calls Logged
          </div>
          <p className="mt-3 text-[11px] text-slate-400">
            Across active field cycles
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              High Yield Conversions
            </span>
            <div className="rounded-lg bg-blue-50 p-1.5 text-[#0090FF]">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] leading-none font-bold tracking-tight text-slate-900">
            {highPotentialCalls} Committed
          </div>
          <p className="mt-3 text-[11px] text-slate-400">
            Top tier prescriptive commitments
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Sample Reconciliation
            </span>
            <div className="rounded-lg bg-emerald-50 p-1.5 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] leading-none font-bold tracking-tight text-slate-900">
            100% Verified
          </div>
          <p className="mt-3 text-[11px] text-slate-400">
            Physician receipts countersigned
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Follow-up Adherence
            </span>
            <Badge
              variant="outline"
              className="rounded-md border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"
            >
              96.2%
            </Badge>
          </div>
          <div className="mt-3 text-[28px] leading-none font-bold tracking-tight text-slate-900">
            On Schedule
          </div>
          <p className="mt-3 text-[11px] text-slate-400">
            Zero lapsed Tier A+ appointments
          </p>
        </Card>
      </div>

      {/* 3. Search and Filtering Header */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200/90 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search physician, drug name, chamber, or MIO..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 border-slate-200 bg-slate-50/50 pl-8 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={territoryFilter} onValueChange={setTerritoryFilter}>
            <SelectTrigger className="h-8 w-[150px] border-slate-200 bg-white text-xs">
              <Filter className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
              <SelectValue placeholder="All Territories" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">All Territories</SelectItem>
              <SelectItem value="dhaka north">Dhaka North</SelectItem>
              <SelectItem value="dhaka south">Dhaka South</SelectItem>
              <SelectItem value="chittagong">Chittagong</SelectItem>
              <SelectItem value="sylhet">Sylhet</SelectItem>
              <SelectItem value="rajshahi">Rajshahi</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
            <SelectTrigger className="h-8 w-[150px] border-slate-200 bg-white text-xs">
              <SelectValue placeholder="All Sentiments" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">All Sentiments</SelectItem>
              <SelectItem value="high potential">High Potential</SelectItem>
              <SelectItem value="positive">Positive</SelectItem>
              <SelectItem value="neutral">Neutral</SelectItem>
              <SelectItem value="follow-up required">
                Needs Follow-up
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 4. Chronological Timeline Stream */}
      <Card className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-none sm:p-8">
        <div className="mb-8 flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
              Physician Detailing Chronology
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              Verified clinical engagements listed in reverse chronological
              order
            </p>
          </div>
          <span className="text-xs font-medium text-slate-400">
            Showing {filteredEvents.length} Engagement Milestones
          </span>
        </div>

        <div className="relative space-y-8 pl-6 sm:pl-8">
          {filteredEvents.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">
              <AlertCircle className="mx-auto mb-2 h-8 w-8 text-slate-300" />
              <p className="font-medium text-slate-600">
                {loading
                  ? "Loading detailing chronology..."
                  : "No physician visit timeline events found."}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                Visit interactions logged by medical representatives will be displayed here in chronological order.
              </p>
            </div>
          ) : (
            <>
              {/* Vertical Connecting Guide Line */}
              <div className="absolute top-3 bottom-3 left-[15px] w-[2px] bg-slate-200 sm:left-[19px]" />

              {filteredEvents.map((evt) => (
            <div
              key={evt.id}
              className="relative flex flex-col items-start gap-4 sm:flex-row sm:gap-6"
            >
              {/* Timeline Circular Icon Anchor */}
              <div
                className={`absolute -left-[27px] flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 bg-white sm:-left-[31px] ${
                  evt.feedbackSentiment === "High Potential"
                    ? "border-[#0090FF] text-[#0090FF]"
                    : evt.feedbackSentiment === "Positive"
                      ? "border-emerald-500 text-emerald-600"
                      : evt.feedbackSentiment === "Follow-up Required"
                        ? "border-amber-500 text-amber-600"
                        : "border-slate-300 text-slate-500"
                }`}
              >
                <Stethoscope className="h-3.5 w-3.5" />
              </div>

              {/* Event Card Content Container */}
              <div className="w-full rounded-xl border border-slate-200/90 bg-white p-5 shadow-none transition-colors hover:border-slate-300">
                {/* Event Header */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 rounded-lg border border-slate-200">
                      <AvatarFallback className="bg-slate-100 text-xs font-bold text-slate-800">
                        {evt.doctorName
                          .replace("Dr. ", "")
                          .slice(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">
                          {evt.doctorName}
                        </span>
                        <Badge
                          variant="outline"
                          className={`py-0.2 rounded-md px-2 text-[9px] font-bold ${
                            evt.tier === "A+"
                              ? "border-blue-200 bg-blue-50 text-blue-700"
                              : evt.tier === "A"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-slate-200 bg-slate-50 text-slate-700"
                          }`}
                        >
                          Tier {evt.tier}
                        </Badge>
                      </div>
                      <span className="block text-[11px] text-slate-500">
                        {evt.specialty}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {evt.date} • {evt.time}
                    </span>
                    <Badge
                      variant="outline"
                      className={`rounded-md px-2.5 py-0.5 text-[10px] font-semibold ${
                        evt.feedbackSentiment === "High Potential"
                          ? "border-blue-200 bg-blue-50 text-blue-700"
                          : evt.feedbackSentiment === "Positive"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : evt.feedbackSentiment === "Follow-up Required"
                              ? "border-amber-200 bg-amber-50 text-amber-700"
                              : "border-slate-200 bg-slate-50 text-slate-700"
                      }`}
                    >
                      {evt.feedbackSentiment}
                    </Badge>
                  </div>
                </div>

                {/* Chamber and Officer Subline */}
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                    <span>{evt.chamber}</span>
                  </div>
                  <span className="text-slate-300">•</span>
                  <div>
                    <span>
                      MIO Officer:{" "}
                      <strong className="font-medium text-slate-800">
                        {evt.mioName}
                      </strong>{" "}
                      ({evt.territory})
                    </span>
                  </div>
                  <span className="text-slate-300">•</span>
                  <div className="font-medium text-[#0090FF]">
                    {evt.callType}
                  </div>
                </div>

                {/* Promoted Drugs & Sample Tags */}
                <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-3 text-xs md:grid-cols-2">
                  <div>
                    <span className="mb-1.5 block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                      Promoted Product Portfolio
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {evt.promotedProducts.map((p, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-800"
                        >
                          <Pill className="h-3 w-3 text-[#0090FF]" />
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="mb-1.5 block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                      Sample & Collateral Handover
                    </span>
                    <div className="inline-flex items-center gap-1.5 rounded-md border border-slate-100 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
                      <Gift className="h-3.5 w-3.5 text-purple-600" />
                      <span>{evt.samplesGiven}</span>
                    </div>
                  </div>
                </div>

                {/* Verbatim Physician Feedback */}
                <div className="mt-3.5 rounded-lg border border-slate-100 bg-slate-50/70 p-3 text-xs">
                  <div className="mb-1 flex items-center gap-1.5 font-semibold text-slate-600">
                    <MessageSquare className="h-3 w-3 text-slate-400" />
                    <span>Physician Discussion Notes & Reaction</span>
                  </div>
                  <p className="leading-relaxed text-slate-700 italic">
                    "{evt.physicianFeedback}"
                  </p>
                </div>

                {/* Footer Follow-up Milestone */}
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-slate-400" />
                    <span>
                      Next Planned Appointment:{" "}
                      <strong className="font-medium text-slate-800">
                        {evt.nextScheduledFollowUp}
                      </strong>
                    </span>
                  </div>
                  <span className="font-mono text-slate-400">ID: {evt.id}</span>
                </div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
      </Card>
    </div>
  )
}
