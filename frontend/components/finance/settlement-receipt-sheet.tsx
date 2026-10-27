"use client"

import * as React from "react"
import { numberToWordsBDT } from "@/components/logistics/order-invoice"
import { Building2, Calendar, CheckCircle2, CreditCard, FileCheck2, FileText, Landmark, ShieldCheck, UserCheck } from "lucide-react"

export interface SettlementAllocationData {
  documentType: string
  documentId: string
  documentNumber: string
  allocatedAmount: number
}

export interface SettlementData {
  id?: string
  paymentNumber: string
  direction: "OUTGOING" | "INCOMING"
  partyName: string
  partyCode?: string | null
  amount: number
  unallocatedAmount: number
  paymentMethod: string
  paymentDate: string
  transactionRef?: string | null
  accountTitle?: string | null
  status: string
  notes?: string | null
  allocations?: SettlementAllocationData[]
}

export function SettlementReceiptSheet({
  record,
}: {
  record: SettlementData
}) {
  const isIncoming = record.direction === "INCOMING"
  const docTitle = isIncoming ? "Settlement Money Receipt" : "Remittance Payment Advice"
  const allocations = record.allocations || []
  const allocatedSum = allocations.reduce((sum, a) => sum + (a.allocatedAmount || 0), 0)

  return (
    <div className="w-full bg-white text-slate-900 font-sans text-xs selection:bg-none print:p-0">
      {/* 1. Header: Horizontal Logo & Motto + Enterprise Settlement Metadata */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-200/90 gap-4">
        {/* Brand Horizontal Logo with Motto */}
        <div className="flex flex-col items-start max-w-[390px]">
          <img
            src="/horizontal-logo-motto.svg"
            alt="AK Pharma - Smart Solutions for Healthier Living"
            className="h-10 w-auto object-contain"
          />
          <div className="mt-2 text-[11px] leading-relaxed text-slate-500 font-normal">
            <p className="font-semibold text-slate-700">AK Pharma Ltd. • Treasury & Commercial Remittance</p>
            <p>10/26, Rupnagar R/A, Mirpur, Dhaka 1216, Bangladesh</p>
            <p>Tel: +8801712-611071 • Email: akpharmabd@gmail.com</p>
            <p className="text-[10px] text-slate-400">DGDA Lic: DL-2024-DH-08492 • Tax TIN: 4892-1082-9381</p>
          </div>
        </div>

        {/* Settlement Meta Block */}
        <div className="text-left sm:text-right space-y-1">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wider ${
              isIncoming
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-blue-50 border-blue-200 text-blue-700"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isIncoming ? "bg-emerald-500" : "bg-blue-500"
              }`}
            />
            {isIncoming ? "Accounts Receivable (Inflow)" : "Accounts Payable (Outflow)"}
          </div>
          <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase">
            {docTitle}
          </h2>
          <p className="font-mono text-xs font-bold text-slate-800">
            {isIncoming ? "Receipt Ref:" : "Advice Ref:"}{" "}
            <span className={isIncoming ? "text-emerald-600" : "text-blue-600"}>
              {record.paymentNumber}
            </span>
          </p>
          <div className="text-[11px] text-slate-500 space-y-0.5">
            <p>
              Settlement Date: <span className="font-semibold text-slate-700">{record.paymentDate}</span>
            </p>
            <p>
              Clearance Status: <span className="font-semibold text-slate-700">{record.status}</span>
            </p>
          </div>
        </div>
      </div>

      {/* 2. Dual Side-by-Side Cards: Party Profile vs Treasury Settlement Details */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Party Card */}
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 relative overflow-hidden">
          <div
            className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
              isIncoming ? "from-emerald-500 to-teal-500" : "from-blue-500 to-indigo-500"
            }`}
          />
          <div className="flex items-center gap-2 mb-2.5">
            <Building2 className={`h-4 w-4 ${isIncoming ? "text-emerald-600" : "text-blue-600"}`} />
            <h3 className="font-bold text-slate-800 text-[11px] tracking-wider uppercase">
              {isIncoming ? "Payer / Client Information" : "Beneficiary / Supplier Information"}
            </h3>
          </div>
          <div className="space-y-1.5 text-xs">
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Party / Entity Name</p>
              <p className="font-bold text-slate-900 text-sm">{record.partyName}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Party Code</p>
                <p className="font-mono font-semibold text-slate-700">{record.partyCode || "N/A"}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Payment Mode</p>
                <p className="font-semibold text-slate-800">{record.paymentMethod}</p>
              </div>
            </div>
            {record.notes && (
              <div className="pt-1 border-t border-slate-200/60 text-[11px] text-slate-600">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Remittance Memo</span>
                <p className="italic text-slate-700">"{record.notes}"</p>
              </div>
            )}
          </div>
        </div>

        {/* Treasury Settlement Card */}
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-600 to-slate-800" />
          <div className="flex items-center gap-2 mb-2.5">
            <Landmark className="h-4 w-4 text-slate-700" />
            <h3 className="font-bold text-slate-800 text-[11px] tracking-wider uppercase">
              Treasury & Banking Details
            </h3>
          </div>
          <div className="space-y-1.5 text-xs">
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                {isIncoming ? "Deposited Into Account" : "Disbursed From Account"}
              </p>
              <p className="font-bold text-slate-900">{record.accountTitle || "Corporate Central Treasury Account"}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Transaction Ref</p>
                <p className="font-mono font-semibold text-slate-700">{record.transactionRef || "TXN-DIRECT"}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Ledger Type</p>
                <p className="font-semibold text-slate-800">
                  {isIncoming ? "Client AR Liquidation" : "Vendor AP Liquidation"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Audit Status</p>
                <p className="font-medium text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Reconciled
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Currency</p>
                <p className="font-mono font-bold text-slate-900">BDT (৳)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Allocations Table */}
      <div className="mt-5 rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/80 text-slate-600 border-b border-slate-200 text-[11px] uppercase tracking-wider">
              <th className="w-10 py-2.5 px-3 text-center font-semibold">SL</th>
              <th className="py-2.5 px-3 text-left font-semibold">Document / Ledger Type</th>
              <th className="py-2.5 px-3 text-left font-semibold">Reference Document Number</th>
              <th className="w-40 py-2.5 px-3 text-right font-semibold">Allocated Settlement (৳)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {allocations.length > 0 ? (
              allocations.map((alloc, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-2.5 px-3 text-center font-mono text-slate-400 text-[11px]">
                    {String(idx + 1).padStart(2, "0")}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-800">
                    {alloc.documentType || (isIncoming ? "Commercial Sales Invoice" : "Procurement Purchase Order")}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                    #{alloc.documentNumber}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                    ৳{(alloc.allocatedAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))
            ) : (
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-2.5 px-3 text-center font-mono text-slate-400 text-[11px]">01</td>
                <td className="py-2.5 px-3 font-medium text-slate-800">General Ledger Account Settlement</td>
                <td className="py-2.5 px-3 font-mono font-bold text-slate-900">Direct / On-Account</td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                  ৳{(record.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            )}

            {record.unallocatedAmount > 0 && allocations.length > 0 && (
              <tr className="bg-amber-50/40 border-t border-amber-200/60">
                <td className="py-2.5 px-3 text-center font-mono text-amber-700 text-[11px]">
                  {String(allocations.length + 1).padStart(2, "0")}
                </td>
                <td className="py-2.5 px-3 font-semibold text-amber-900">
                  {isIncoming ? "Customer Advance Credit Balance" : "Supplier Advance Payment Reserve"}
                </td>
                <td className="py-2.5 px-3 font-mono text-amber-800">
                  Carry-Forward Credit
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-900">
                  ৳{record.unallocatedAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Financial Calculations & Words Callout */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
        {/* Left: Amount in Words */}
        <div
          className={`sm:col-span-7 rounded-xl border p-4 ${
            isIncoming
              ? "border-emerald-100 bg-emerald-50/40"
              : "border-blue-100 bg-blue-50/40"
          }`}
        >
          <p
            className={`text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5 ${
              isIncoming ? "text-emerald-900" : "text-blue-900"
            }`}
          >
            <FileText className={`h-3.5 w-3.5 ${isIncoming ? "text-emerald-600" : "text-blue-600"}`} />
            Total Settled Amount in Words
          </p>
          <p
            className={`text-xs font-semibold italic leading-relaxed ${
              isIncoming ? "text-emerald-950" : "text-blue-950"
            }`}
          >
            "{numberToWordsBDT(record.amount)}"
          </p>
          <div
            className={`mt-3 pt-2.5 border-t flex flex-wrap items-center justify-between text-[11px] ${
              isIncoming
                ? "border-emerald-200/50 text-emerald-800"
                : "border-blue-200/50 text-blue-800"
            }`}
          >
            <span>Instrument: <strong>{record.paymentMethod}</strong></span>
            <span>Treasury Status: <strong>{record.status}</strong></span>
          </div>
        </div>

        {/* Right: Allocated vs Unallocated Summary */}
        <div className="sm:col-span-5 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Allocated Applied</span>
            <span className="font-mono font-semibold text-slate-800">
              ৳{(allocatedSum || record.amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {record.unallocatedAmount > 0 && (
            <div className="flex items-center justify-between text-xs text-amber-700">
              <span>Unallocated Advance</span>
              <span className="font-mono font-semibold">
                ৳{record.unallocatedAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}

          <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
            <span className="font-bold text-slate-900 text-xs uppercase tracking-wide">
              Total Settled
            </span>
            <span
              className={`font-mono text-base font-black ${
                isIncoming ? "text-emerald-700" : "text-blue-700"
              }`}
            >
              ৳{(record.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* 5. Audit & General Ledger Confirmation */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 text-xs text-slate-700 space-y-1">
        <div className="flex items-center gap-1.5 text-slate-800 font-bold text-[11px] tracking-wide uppercase">
          <ShieldCheck className="h-4 w-4 text-slate-600" />
          Treasury Reconciliation & General Ledger Confirmation
        </div>
        <p className="text-[11px] leading-relaxed text-slate-600">
          This document serves as formal confirmation of settlement applied against sub-ledger accounts.
          All allocations have been posted electronically and reconciled against banking records.
        </p>
      </div>

      {/* 6. Executive 3-Tier Signatures */}
      <div className="mt-10 pt-4 grid grid-cols-3 gap-6 text-center text-xs">
        <div>
          <div className="w-36 mx-auto border-t border-slate-400 mb-1.5" />
          <p className="font-bold text-slate-800">Accounts Officer</p>
          <p className="text-[10px] text-slate-400">Prepared & Entered By</p>
        </div>
        <div>
          <div className="w-36 mx-auto border-t border-slate-400 mb-1.5" />
          <p className="font-bold text-slate-800">Finance Controller</p>
          <p className="text-[10px] text-slate-400">Reconciled & Authorized</p>
        </div>
        <div>
          <div className="w-36 mx-auto border-t border-slate-400 mb-1.5" />
          <p className="font-bold text-slate-800">Authorized Signatory</p>
          <p className="text-[10px] text-slate-400">
            {isIncoming ? "Client / Depositor Acknowledgment" : "Payee / Supplier Acknowledgment"}
          </p>
        </div>
      </div>
    </div>
  )
}
