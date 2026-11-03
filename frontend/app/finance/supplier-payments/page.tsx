"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { PartySettlementPage } from "@/components/finance/party-settlement-page"
import { GlobalLoadingSpinner } from "@/components/ui/global-loading-spinner"

function SupplierPaymentsContent() {
  const params = useSearchParams()
  return <PartySettlementPage direction="OUTGOING" presetDocumentId={params.get("poId")} />
}

export default function SupplierPaymentsPage() {
  return (
    <Suspense fallback={<GlobalLoadingSpinner className="py-6" />}>
      <SupplierPaymentsContent />
    </Suspense>
  )
}
