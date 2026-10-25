"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { PartySettlementPage } from "@/components/finance/party-settlement-page"

function BuyerPaymentsContent() {
  const params = useSearchParams()
  return <PartySettlementPage direction="INCOMING" presetDocumentId={params.get("orderId")} />
}

export default function BuyerPaymentsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs text-slate-400">Loading buyer payments...</div>}>
      <BuyerPaymentsContent />
    </Suspense>
  )
}
