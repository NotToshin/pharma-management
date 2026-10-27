"use client"

import * as React from "react"
import { numberToWordsBDT } from "@/components/logistics/order-invoice"

export interface ExpenseVoucherLineItem {
  itemName: string
  quantity: number
  unitCostBDT?: number | null
  lineTotalBDT?: number | null
}

export interface ExpenseVoucherData {
  id?: string
  voucherNo: string
  payeeName: string
  payeeType?: string
  category: string
  amount: number
  grossAmount?: number | null
  tdsAmount?: number | null
  vdsAmount?: number | null
  paymentDate: string
  paymentMethod?: string
  chequeNumber?: string | null
  fundingSource?: string
  sourceDetail?: string
  status: string
  notes?: string | null
  poNumber?: string | null
  preparedBy?: string | null
  approvedBy?: string | null
  disbursedBy?: string | null
  lineItems?: ExpenseVoucherLineItem[]
}

export function ExpenseVoucherSheet({
  record,
  particulars = [],
}: {
  record: ExpenseVoucherData
  particulars?: ExpenseVoucherLineItem[]
}) {
  const lineItems = particulars.length > 0 ? particulars : record.lineItems || []
  const gross = record.grossAmount ?? record.amount
  const tds = record.tdsAmount ?? 0
  const vds = record.vdsAmount ?? 0
  const net = record.amount

  return (
    <div className="w-full bg-white text-slate-900 font-sans text-xs selection:bg-none print:p-0">
      {/* 1. Header: Horizontal Logo & Motto + Corporate Voucher Details */}
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
            <p>Treasury Operations • Hotline: +8801712-611071 • Email: akpharmabd@gmail.com</p>
          </div>
        </div>

        {/* Voucher Tag Block */}
        <div className="text-left sm:text-right space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-bold uppercase tracking-wider">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            {record.status === "Disbursed" ? "Disbursed & Settled" : record.status}
          </div>
          <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase">
            Payment Voucher
          </h2>
          <p className="font-mono text-xs font-bold text-slate-800">
            Voucher No: <span className="text-blue-600">{record.voucherNo}</span>
          </p>
          <p className="text-[11px] text-slate-500">
            Disbursement Date: <span className="font-semibold text-slate-700">{record.paymentDate}</span>
          </p>
        </div>
      </div>

      {/* 2. Payee Profile vs Treasury Funding Cards */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Payee Details */}
        <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-4 space-y-2">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Payee / Beneficiary
          </span>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">{record.payeeName}</h3>
            <p className="text-slate-600 text-[11px] mt-0.5">
              Category: <strong className="text-slate-800">{record.category}</strong> ({record.payeeType || "Vendor / Commercial"})
            </p>
          </div>
          {record.poNumber && (
            <div className="pt-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-[11px] font-mono font-semibold text-blue-800">
                PO Reference: #{record.poNumber}
              </span>
            </div>
          )}
          {record.notes && (
            <p className="text-slate-500 text-[11px] italic pt-1 border-t border-slate-200/60">
              Note: "{record.notes}"
            </p>
          )}
        </div>

        {/* Right: Treasury Funding & Method */}
        <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-4 space-y-2">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Funding Source & Instrument
          </span>
          <div>
            <p className="font-semibold text-slate-900">
              {record.sourceDetail || "Corporate Central Vault"}
            </p>
            <p className="text-slate-600 text-[11px] mt-0.5">
              Account Type: <strong className="text-slate-800">{record.fundingSource || "Treasury Account"}</strong>
            </p>
          </div>
          <div className="pt-1 text-[11px] text-slate-700">
            <span>Payment Mode: </span>
            <strong className="font-mono text-slate-900">{record.paymentMethod || "Cash Safe / Transfer"}</strong>
            {record.chequeNumber && (
              <span className="ml-2 font-mono text-slate-600">(Cheque #{record.chequeNumber})</span>
            )}
          </div>
          <div className="pt-1 text-[11px] text-slate-500 border-t border-slate-200/60 flex items-center justify-between">
            <span>Audit Trail: Verified</span>
            <span className="font-mono text-emerald-600 font-semibold">Ledger Posted</span>
          </div>
        </div>
      </div>

      {/* 3. Itemized Expenditure Breakdown Table */}
      <div className="mt-5 rounded-xl border border-slate-200/90 overflow-hidden shadow-xs">
        <table className="w-full text-xs">
          <thead className="bg-slate-100/90 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-3 text-center w-12">#</th>
              <th className="py-2.5 px-3 text-left">Expenditure Particulars & Cost Center</th>
              <th className="py-2.5 px-3 text-center w-20">Qty</th>
              <th className="py-2.5 px-3 text-right w-28">Unit Rate</th>
              <th className="py-2.5 px-3 text-right w-32">Total (৳)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lineItems.length > 0 ? (
              lineItems.map((item, idx) => {
                const lineAmt =
                  item.lineTotalBDT != null
                    ? item.lineTotalBDT
                    : item.unitCostBDT != null
                      ? item.unitCostBDT * item.quantity
                      : gross
                const unitCost =
                  item.unitCostBDT != null
                    ? item.unitCostBDT
                    : item.quantity > 0
                      ? lineAmt / item.quantity
                      : lineAmt

                return (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 text-center text-slate-400 font-mono">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">
                      {item.itemName}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                      {item.quantity}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                      ৳{Math.round(unitCost).toLocaleString("en-IN")}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      ৳{Math.round(lineAmt).toLocaleString("en-IN")}
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td className="py-3 px-3 text-center text-slate-400 font-mono">1</td>
                <td className="py-3 px-3 font-medium text-slate-800">
                  Operational & Commercial disbursement for {record.category} to {record.payeeName}
                </td>
                <td className="py-3 px-3 text-center font-mono text-slate-600">1</td>
                <td className="py-3 px-3 text-right font-mono text-slate-600">
                  ৳{gross.toLocaleString("en-IN")}
                </td>
                <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                  ৳{gross.toLocaleString("en-IN")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Financial Withholdings & Net Settlement Box */}
      <div className="mt-5 flex flex-col md:flex-row md:items-start justify-between gap-5">
        {/* Left: Amount in Words */}
        <div className="flex-1 rounded-xl border border-slate-200/90 bg-slate-50/70 p-4 space-y-2">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Net Disbursed in Words
          </span>
          <p className="text-xs font-semibold text-slate-800 italic leading-relaxed">
            "{numberToWordsBDT(net)}"
          </p>
          <div className="pt-2 text-[11px] text-slate-500 border-t border-slate-200/60 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Disbursement Mode: {record.paymentMethod || "Cash Safe / Transfer"}</span>
          </div>
        </div>

        {/* Right: Structured Totals */}
        <div className="w-full md:w-80 rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-2 text-xs">
          <div className="flex justify-between text-slate-600 pb-1 border-b border-slate-100">
            <span>Gross Expenditure:</span>
            <span className="font-mono font-semibold text-slate-800">
              ৳{gross.toLocaleString("en-IN")}
            </span>
          </div>
          {tds > 0 && (
            <div className="flex justify-between text-rose-600 pb-1 border-b border-slate-100">
              <span>Less TDS Withholding:</span>
              <span className="font-mono font-semibold">
                - ৳{tds.toLocaleString("en-IN")}
              </span>
            </div>
          )}
          {vds > 0 && (
            <div className="flex justify-between text-rose-600 pb-1 border-b border-slate-100">
              <span>Less VDS Withholding:</span>
              <span className="font-mono font-semibold">
                - ৳{vds.toLocaleString("en-IN")}
              </span>
            </div>
          )}
          <div className="flex justify-between pt-1 text-sm font-bold text-slate-900 border-t border-slate-200">
            <span className="text-slate-900">Net Disbursed:</span>
            <span className="font-mono font-black text-blue-700 text-base">
              ৳{net.toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      </div>

      {/* 5. Statutory Withholding & Compliance Notice */}
      <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-[11px] text-slate-600 space-y-1">
        <p className="font-semibold text-slate-700">
          Tax Withholding (TDS/VDS) Certification & General Ledger Entry:
        </p>
        <p>
          Deductions are withheld in compliance with the National Board of Revenue (NBR) and Income Tax Act. A Withholding Tax Certificate (Mushak 6.3 / TDS Challan) will be furnished to the beneficiary.
        </p>
      </div>

      {/* 6. Maker - Checker - Approver Signatures */}
      <div className="mt-12 pb-2 grid grid-cols-3 gap-6 text-center text-xs text-slate-600">
        <div>
          <div className="w-36 mx-auto border-b border-slate-300 pb-1 mb-1.5" />
          <span className="font-semibold text-slate-800 block">
            {record.preparedBy || "Accounts Officer"}
          </span>
          <span className="text-[10px] text-slate-400">Prepared By (Maker)</span>
        </div>
        <div>
          <div className="w-36 mx-auto border-b border-slate-300 pb-1 mb-1.5" />
          <span className="font-semibold text-slate-800 block">
            {record.approvedBy || "Internal Audit / Checker"}
          </span>
          <span className="text-[10px] text-slate-400">Audit & Pre-check</span>
        </div>
        <div>
          <div className="w-36 mx-auto border-b border-slate-300 pb-1 mb-1.5" />
          <span className="font-semibold text-slate-800 block">
            {record.disbursedBy || "Finance Controller"}
          </span>
          <span className="text-[10px] text-slate-400">Authorized & Disbursed</span>
        </div>
      </div>
    </div>
  )
}
