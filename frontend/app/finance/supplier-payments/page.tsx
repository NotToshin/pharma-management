"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { PartySettlementPage } from "@/components/finance/party-settlement-page"

function SupplierPaymentsContent() {
  const params = useSearchParams()
  return <PartySettlementPage direction="OUTGOING" presetDocumentId={params.get("poId")} />
}

export default function SupplierPaymentsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs text-slate-400">Loading supplier payments...</div>}>
      <SupplierPaymentsContent />
    </Suspense>
  )
}
