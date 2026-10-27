"use client"

import * as React from "react"
import { numberToWordsBDT } from "@/components/logistics/order-invoice"

export interface MoneyReceiptData {
  id?: string
  receiptNo: string
  invoiceNo: string
  orderId?: string | null
  chemistName: string
  salesRepName: string
  territory: string
  collectionDate: string
  amountCollected: number
  totalInvoiceAmount: number
  dueAmountRemaining: number
  paymentMethod: string
  chequeNumber?: string | null
  bankName?: string | null
  depositedInto?: string | null
  clearedBy?: string | null
  status: string
  notes?: string | null
}

export function MoneyReceiptSheet({
  record,
}: {
  record: MoneyReceiptData
}) {
  const previouslyPaid = Math.max(
    0,
    (record.totalInvoiceAmount || 0) - (record.amountCollected || 0) - (record.dueAmountRemaining || 0)
  )

  return (
    <div className="w-full bg-white text-slate-900 font-sans text-xs selection:bg-none print:p-0">
      {/* 1. Header: Horizontal Logo & Motto + Corporate Receipt Details */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-200/90 gap-4">
        {/* Brand Horizontal Logo with Motto */}
        <div className="flex flex-col items-start max-w-[380px]">
          <img
            src="/horizontal-logo-motto.svg"
            alt="AK Pharma - Smart Solutions for Healthier Living"
            className="h-10 w-auto object-contain"
          />
          <div className="mt-2 text-[11px] leading-relaxed text-slate-500 font-normal">
            <p>10/26, Rupnagar R/A, Mirpur, Dhaka 1216, Bangladesh</p>
            <p>Collections & Treasury • Hotline: +8801712-611071 • Email: akpharmabd@gmail.com</p>
          </div>
        </div>

        {/* Receipt Header Tag Block */}
        <div className="text-left sm:text-right space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold uppercase tracking-wider">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {record.status === "Cleared" ? "Cleared & Vault Deposited" : record.status}
          </div>
          <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase">
            Official Money Receipt
          </h2>
          <p className="font-mono text-xs font-bold text-slate-800">
            Receipt No: <span className="text-blue-600">{record.receiptNo}</span>
          </p>
          <p className="text-[11px] text-slate-500">
            Collection Date: <span className="font-semibold text-slate-700">{record.collectionDate}</span>
          </p>
        </div>
      </div>

      {/* 2. Chemist Details vs Collection Channel Cards */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Chemist / Pharmacy */}
        <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-4 space-y-2">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Received From (Chemist / Pharmacy)
          </span>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">{record.chemistName}</h3>
            <p className="text-slate-600 text-[11px] mt-0.5">
              Territory / Route: <strong className="text-slate-800">{record.territory}</strong>
            </p>
          </div>
          <div className="pt-1 flex flex-wrap gap-2 text-[11px]">
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 border border-blue-200 font-mono font-semibold text-blue-800">
              Invoice #{record.invoiceNo}
            </span>
            {record.orderId && (
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-slate-700">
                Order #{record.orderId}
              </span>
            )}
          </div>
        </div>

        {/* Right: Collecting Agent & Treasury */}
        <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-4 space-y-2">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Collection Officer & Instrument
          </span>
          <div>
            <p className="font-semibold text-slate-900">
              Collector (MIO): <strong className="text-slate-900">{record.salesRepName}</strong>
            </p>
            <p className="text-slate-600 text-[11px] mt-0.5 font-mono">
              Mode: {record.paymentMethod}
              {record.chequeNumber ? ` (Cheque / Ref: ${record.chequeNumber})` : ""}
            </p>
          </div>
          <div className="pt-1 text-[11px] text-slate-600">
            Deposited Safe: <strong className="text-slate-800">{record.depositedInto || "Primary Cash Vault"}</strong>
          </div>
          <div className="pt-1 text-[11px] text-slate-500 border-t border-slate-200/60 flex items-center justify-between">
            <span>Treasury Status: Verified</span>
            <span className="font-mono text-emerald-600 font-semibold">{record.status}</span>
          </div>
        </div>
      </div>

      {/* 3. Invoice Realization Breakdown Table */}
      <div className="mt-5 rounded-xl border border-slate-200/90 overflow-hidden shadow-xs">
        <table className="w-full text-xs">
          <thead className="bg-slate-100/90 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-3 text-center w-12">#</th>
              <th className="py-2.5 px-3 text-left">Particulars & Invoice Reference</th>
              <th className="py-2.5 px-3 text-right w-28">Total Invoice</th>
              <th className="py-2.5 px-3 text-right w-28">Previously Paid</th>
              <th className="py-2.5 px-3 text-right w-32">Received Today</th>
              <th className="py-2.5 px-3 text-right w-28">Balance Due</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr className="hover:bg-slate-50/50">
              <td className="py-3 px-3 text-center text-slate-400 font-mono">1</td>
              <td className="py-3 px-3 font-medium text-slate-800">
                Delivery collection against Commercial Invoice #{record.invoiceNo}
                {record.notes ? ` (${record.notes})` : ""}
              </td>
              <td className="py-3 px-3 text-right font-mono text-slate-600">
                ৳{(record.totalInvoiceAmount || 0).toLocaleString("en-IN")}
              </td>
              <td className="py-3 px-3 text-right font-mono text-slate-600">
                ৳{previouslyPaid.toLocaleString("en-IN")}
              </td>
              <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700 text-sm">
                ৳{(record.amountCollected || 0).toLocaleString("en-IN")}
              </td>
              <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900">
                ৳{(record.dueAmountRemaining || 0).toLocaleString("en-IN")}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 4. Financial Summary Cards */}
      <div className="mt-5 flex flex-col md:flex-row md:items-start justify-between gap-5">
        {/* Left: Amount in Words */}
        <div className="flex-1 rounded-xl border border-slate-200/90 bg-slate-50/70 p-4 space-y-2">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Amount Received in Words
          </span>
          <p className="text-xs font-semibold text-slate-800 italic leading-relaxed">
            "{numberToWordsBDT(record.amountCollected)}"
          </p>
          <div className="pt-2 text-[11px] text-slate-500 border-t border-slate-200/60 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Clearing Verification: {record.clearedBy || "Cashier & Treasury Officer"}</span>
          </div>
        </div>

        {/* Right: Balance Summary */}
        <div className="w-full md:w-80 rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-2 text-xs">
          <div className="flex justify-between text-slate-600 pb-1 border-b border-slate-100">
            <span>Original Invoice Value:</span>
            <span className="font-mono font-semibold text-slate-800">
              ৳{(record.totalInvoiceAmount || 0).toLocaleString("en-IN")}
            </span>
          </div>
          <div className="flex justify-between text-slate-600 pb-1 border-b border-slate-100">
            <span>Remaining Due Balance:</span>
            <span className="font-mono font-semibold text-slate-800">
              ৳{(record.dueAmountRemaining || 0).toLocaleString("en-IN")}
            </span>
          </div>
          <div className="flex justify-between pt-1 text-sm font-bold text-slate-900 border-t border-slate-200">
            <span className="text-slate-900">Amount Received:</span>
            <span className="font-mono font-black text-emerald-700 text-base">
              ৳{(record.amountCollected || 0).toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      </div>

      {/* 5. Treasury Compliance & Official Terms */}
      <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-[11px] text-slate-600 space-y-1">
        <p className="font-semibold text-slate-700">
          Official Delivery Receipt Terms & Audit Reconciliation:
        </p>
        <p>
          1. This official money receipt is issued upon receiving cash or instrument payment for pharmaceutical goods delivered.
        </p>
        <p>
          2. Cheque and electronic payments are accepted subject to actual realization in AK Pharma corporate bank account.
        </p>
      </div>

      {/* 6. Signatures */}
      <div className="mt-12 pb-2 grid grid-cols-3 gap-6 text-center text-xs text-slate-600">
        <div>
          <div className="w-36 mx-auto border-b border-slate-300 pb-1 mb-1.5" />
          <span className="font-semibold text-slate-800 block">Chemist / Pharmacy</span>
          <span className="text-[10px] text-slate-400">Stamp & Signature</span>
        </div>
        <div>
          <div className="w-36 mx-auto border-b border-slate-300 pb-1 mb-1.5" />
          <span className="font-semibold text-slate-800 block">{record.salesRepName}</span>
          <span className="text-[10px] text-slate-400">Collecting Agent (MIO)</span>
        </div>
        <div>
          <div className="w-36 mx-auto border-b border-slate-300 pb-1 mb-1.5" />
          <span className="font-semibold text-slate-800 block">{record.clearedBy || "Cashier & Vault Officer"}</span>
          <span className="text-[10px] text-slate-400">Treasury Verification</span>
        </div>
      </div>
    </div>
  )
}
