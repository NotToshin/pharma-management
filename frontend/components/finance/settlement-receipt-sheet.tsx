"use client"

import * as React from "react"
import { numberToWordsBDT } from "@/components/logistics/order-invoice"

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
  const title = isIncoming ? "MONEY RECEIPT" : "PAYMENT VOUCHER"
  const partyHeader = isIncoming ? "RECEIVED FROM (CLIENT):" : "PAID TO (SUPPLIER):"
  const allocations = record.allocations || []
  const allocatedSum = allocations.reduce((sum, a) => sum + (a.allocatedAmount || 0), 0)

  return (
    <div className="w-full bg-white text-black font-sans text-xs selection:bg-none print:p-0">
      {/* 1. Header: Logo (left) + Solid Black Box (right) */}
      <div className="flex items-start justify-between">
        {/* Brand Logo & Contact */}
        <div className="flex flex-col items-start max-w-[340px]">
          <img
            src="/logo.svg"
            alt="AK Pharma"
            className="h-[74px] w-auto object-contain"
          />
          <div className="mt-1 text-[11px] leading-[1.35] text-black font-normal">
            <p>Dhaka, Bangladesh</p>
            <p>Phone: +8801712-611071, +8801798-112763</p>
            <p>Email: akpharmabd@gmail.com</p>
          </div>
        </div>

        {/* Title Box */}
        <div className="bg-black text-white px-8 py-3.5 flex items-center justify-center min-w-[210px] h-[68px]">
          <span className="text-2xl font-extrabold tracking-[0.2em] text-white uppercase font-sans select-none whitespace-nowrap">
            {title}
          </span>
        </div>
      </div>

      {/* 2. Side-by-Side Dual Boxes */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        {/* Left Box: PARTY DETAILS */}
        <div className="border border-black">
          <div className="bg-black text-white font-bold text-xs px-2.5 py-1 tracking-wider uppercase">
            {partyHeader}
          </div>
          <div className="p-2.5 text-xs text-black space-y-1">
            <p>
              <span className="font-normal">Party Name: </span>
              <span className="font-semibold">{record.partyName}</span>
            </p>
            <p>
              <span className="font-normal">Party Code: </span>
              <span className="font-semibold font-mono">{record.partyCode || "N/A"}</span>
            </p>
            <p>
              <span className="font-normal">Payment Instrument: </span>
              <span className="font-semibold">
                {record.paymentMethod}
                {record.transactionRef ? ` (Ref: ${record.transactionRef})` : ""}
              </span>
            </p>
            <p>
              <span className="font-normal">Purpose / Remarks: </span>
              <span className="font-semibold">{record.notes || "Commercial ledger settlement"}</span>
            </p>
          </div>
        </div>

        {/* Right Box: SETTLEMENT DETAILS */}
        <div className="border border-black">
          <div className="bg-black text-white font-bold text-xs px-2.5 py-1 tracking-wider uppercase">
            {isIncoming ? "RECEIPT NO:" : "VOUCHER NO:"} {record.paymentNumber}
          </div>
          <div className="p-2.5 text-xs text-black space-y-1">
            <p>
              <span className="font-normal">Date: </span>
              <span className="font-semibold">{record.paymentDate}</span>
            </p>
            <p>
              <span className="font-normal">
                {isIncoming ? "Deposited Into: " : "Disbursed From: "}
              </span>
              <span className="font-semibold">{record.accountTitle || "Primary Treasury Account"}</span>
            </p>
            <p>
              <span className="font-normal">Settlement Flow: </span>
              <span className="font-semibold">
                {isIncoming ? "Client Inflow (Accounts Receivable)" : "Supplier Outflow (Accounts Payable)"}
              </span>
            </p>
            <p>
              <span className="font-normal">Status: </span>
              <span className="font-semibold">{record.status}</span>
            </p>
          </div>
        </div>
      </div>

      {/* 3. Allocations Table */}
      <table className="w-full border-collapse border border-black mt-6 text-xs text-black">
        <thead className="bg-black text-white font-bold text-xs uppercase">
          <tr>
            <th className="w-12 py-1.5 px-2 text-center border-r border-neutral-700">SL</th>
            <th className="py-1.5 px-3 text-left border-r border-neutral-700">Document Type</th>
            <th className="py-1.5 px-3 text-left border-r border-neutral-700">Invoice / Document Ref</th>
            <th className="w-36 py-1.5 px-3 text-right">Allocated Amount</th>
          </tr>
        </thead>
        <tbody>
          {allocations.length > 0 ? (
            allocations.map((alloc, idx) => (
              <tr key={idx} className="border-b border-black h-7">
                <td className="py-1 px-2 text-center border-r border-black font-mono font-medium">
                  {idx + 1}
                </td>
                <td className="py-1 px-3 text-left border-r border-black font-medium">
                  {alloc.documentType || (isIncoming ? "Commercial Sales Invoice" : "Purchase Order")}
                </td>
                <td className="py-1 px-3 text-left border-r border-black font-mono font-semibold">
                  #{alloc.documentNumber}
                </td>
                <td className="py-1 px-3 text-right font-mono font-semibold">
                  ৳{(alloc.allocatedAmount || 0).toLocaleString("en-IN")}
                </td>
              </tr>
            ))
          ) : (
            <tr className="border-b border-black h-7">
              <td className="py-1 px-2 text-center border-r border-black font-mono font-medium">
                1
              </td>
              <td className="py-1 px-3 text-left border-r border-black font-medium">
                General Ledger Settlement
              </td>
              <td className="py-1 px-3 text-left border-r border-black font-mono font-semibold">
                Direct / Unallocated
              </td>
              <td className="py-1 px-3 text-right font-mono font-semibold">
                ৳{(record.amount || 0).toLocaleString("en-IN")}
              </td>
            </tr>
          )}

          {record.unallocatedAmount > 0 && allocations.length > 0 && (
            <tr className="border-b border-black h-7 bg-neutral-50">
              <td className="py-1 px-2 text-center border-r border-black font-mono font-medium">
                {allocations.length + 1}
              </td>
              <td className="py-1 px-3 text-left border-r border-black font-medium italic">
                Advance Customer Balance / Unallocated Reserve
              </td>
              <td className="py-1 px-3 text-left border-r border-black font-mono">
                Carry-forward Credit
              </td>
              <td className="py-1 px-3 text-right font-mono font-semibold text-neutral-800">
                ৳{(record.unallocatedAmount || 0).toLocaleString("en-IN")}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* 4. Financial Summary: Amount in Words (Left) & Settlement Totals (Right) */}
      <div className="flex items-stretch border border-black border-t-0">
        {/* Left: Amount in Words */}
        <div className="flex-1 p-3 flex flex-col justify-between">
          <div className="text-xs text-black">
            <span className="font-semibold">Settlement in Words: </span>
            <span className="font-medium underline decoration-black decoration-1 underline-offset-4">
              {numberToWordsBDT(record.amount)}
            </span>
          </div>
          <div className="text-[11px] text-neutral-600 mt-2">
            Settlement Mode: {record.paymentMethod} • Status: {record.status}
          </div>
        </div>

        {/* Right: Totals summary */}
        <div className="w-80 border-l border-black">
          <div className="flex border-b border-black text-xs">
            <div className="w-36 bg-black text-white font-bold py-1.5 px-3 flex items-center">
              ALLOCATED SUM :
            </div>
            <div className="flex-1 py-1.5 px-3 text-right font-mono font-semibold text-black">
              ৳{(allocatedSum || record.amount).toLocaleString("en-IN")}
            </div>
          </div>
          {record.unallocatedAmount > 0 && (
            <div className="flex border-b border-black text-xs">
              <div className="w-36 bg-black text-white font-bold py-1.5 px-3 flex items-center">
                UNALLOCATED :
              </div>
              <div className="flex-1 py-1.5 px-3 text-right font-mono font-semibold text-black">
                ৳{record.unallocatedAmount.toLocaleString("en-IN")}
              </div>
            </div>
          )}
          <div className="flex text-xs">
            <div className="w-36 bg-black text-white font-bold py-1.5 px-3 flex items-center">
              TOTAL AMOUNT:
            </div>
            <div className="flex-1 py-1.5 px-3 text-right font-mono font-bold text-sm text-black">
              ৳{(record.amount || 0).toLocaleString("en-IN")}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Treasury Verification & Audit Note */}
      <div className="mt-6 border border-black">
        <div className="bg-black text-white font-bold text-xs px-2.5 py-1 tracking-wider uppercase">
          TREASURY RECONCILIATION & AUDIT CONFIRMATION:
        </div>
        <div className="p-3 text-xs text-black space-y-1">
          <p>
            <span className="font-semibold">Financial Account: </span>
            {record.accountTitle || "Corporate Operating Account"}
          </p>
          <p>
            <span className="font-semibold">Reconciliation: </span>
            This settlement has been verified and posted into the General Ledger. Outstanding party balance updated immediately upon execution.
          </p>
        </div>
      </div>

      {/* 6. Signatures */}
      <div className="mt-14 pb-4 grid grid-cols-3 gap-8 text-center text-xs text-black">
        <div>
          <div className="w-40 mx-auto border-t border-black mb-1.5" />
          <span className="font-semibold text-black">Prepared By</span>
          <span className="block text-[10px] text-neutral-500">Accounts Officer</span>
        </div>
        <div>
          <div className="w-40 mx-auto border-t border-black mb-1.5" />
          <span className="font-semibold text-black">Finance Controller</span>
          <span className="block text-[10px] text-neutral-500">Audit & Approval</span>
        </div>
        <div>
          <div className="w-40 mx-auto border-t border-black mb-1.5" />
          <span className="font-semibold text-black">Party Acknowledged</span>
          <span className="block text-[10px] text-neutral-500">Authorized Signatory</span>
        </div>
      </div>
    </div>
  )
}
