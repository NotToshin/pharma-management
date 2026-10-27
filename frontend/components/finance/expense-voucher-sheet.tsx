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

        {/* PAYMENT VOUCHER Box */}
        <div className="bg-black text-white px-8 py-3.5 flex items-center justify-center min-w-[210px] h-[68px]">
          <span className="text-2xl font-extrabold tracking-[0.2em] text-white uppercase font-sans select-none whitespace-nowrap">
            PAYMENT VOUCHER
          </span>
        </div>
      </div>

      {/* 2. Side-by-Side Dual Boxes */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        {/* Left Box: PAYEE DETAILS */}
        <div className="border border-black">
          <div className="bg-black text-white font-bold text-xs px-2.5 py-1 tracking-wider uppercase">
            PAYEE / BENEFICIARY:
          </div>
          <div className="p-2.5 text-xs text-black space-y-1">
            <p>
              <span className="font-normal">Payee Name: </span>
              <span className="font-semibold">{record.payeeName}</span>
            </p>
            <p>
              <span className="font-normal">Category / Type: </span>
              <span className="font-semibold">
                {record.category} ({record.payeeType || "Vendor / Operational"})
              </span>
            </p>
            {record.poNumber && (
              <p>
                <span className="font-normal">PO Reference: </span>
                <span className="font-semibold font-mono">{record.poNumber}</span>
              </p>
            )}
            <p>
              <span className="font-normal">Purpose / Remarks: </span>
              <span className="font-semibold">{record.notes || "Official organizational payment"}</span>
            </p>
          </div>
        </div>

        {/* Right Box: VOUCHER DETAILS */}
        <div className="border border-black">
          <div className="bg-black text-white font-bold text-xs px-2.5 py-1 tracking-wider uppercase">
            VOUCHER NO: {record.voucherNo}
          </div>
          <div className="p-2.5 text-xs text-black space-y-1">
            <p>
              <span className="font-normal">Date: </span>
              <span className="font-semibold">{record.paymentDate}</span>
            </p>
            <p>
              <span className="font-normal">Payment Instrument: </span>
              <span className="font-semibold">
                {record.paymentMethod || "Cash Safe / Transfer"}
                {record.chequeNumber ? ` (Cheque #${record.chequeNumber})` : ""}
              </span>
            </p>
            <p>
              <span className="font-normal">Disbursed From: </span>
              <span className="font-semibold">
                {record.sourceDetail || "Treasury Account"} ({record.fundingSource || "Account"})
              </span>
            </p>
            <p>
              <span className="font-normal">Status: </span>
              <span className="font-semibold">
                {record.status === "Disbursed" ? "Disbursed & Settled" : record.status}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* 3. Expenditure Particulars Table */}
      <table className="w-full border-collapse border border-black mt-6 text-xs text-black">
        <thead className="bg-black text-white font-bold text-xs uppercase">
          <tr>
            <th className="w-12 py-1.5 px-2 text-center border-r border-neutral-700">SL</th>
            <th className="py-1.5 px-3 text-left border-r border-neutral-700">Expenditure Particulars</th>
            <th className="w-20 py-1.5 px-2 text-center border-r border-neutral-700">Qty</th>
            <th className="w-32 py-1.5 px-3 text-right border-r border-neutral-700">Unit Cost</th>
            <th className="w-36 py-1.5 px-3 text-right">Line Total</th>
          </tr>
        </thead>
        <tbody>
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
                <tr key={idx} className="border-b border-black h-7">
                  <td className="py-1 px-2 text-center border-r border-black font-mono font-medium">
                    {idx + 1}
                  </td>
                  <td className="py-1 px-3 text-left border-r border-black font-semibold">
                    {item.itemName}
                  </td>
                  <td className="py-1 px-2 text-center border-r border-black font-mono font-medium">
                    {item.quantity}
                  </td>
                  <td className="py-1 px-3 text-right border-r border-black font-mono">
                    ৳{Math.round(unitCost).toLocaleString("en-IN")}
                  </td>
                  <td className="py-1 px-3 text-right font-mono font-semibold">
                    ৳{Math.round(lineAmt).toLocaleString("en-IN")}
                  </td>
                </tr>
              )
            })
          ) : (
            <tr className="border-b border-black h-7">
              <td className="py-1 px-2 text-center border-r border-black font-mono font-medium">
                1
              </td>
              <td className="py-1 px-3 text-left border-r border-black font-semibold">
                Operational disbursement for {record.category} to {record.payeeName}
              </td>
              <td className="py-1 px-2 text-center border-r border-black font-mono font-medium">
                1
              </td>
              <td className="py-1 px-3 text-right border-r border-black font-mono">
                ৳{gross.toLocaleString("en-IN")}
              </td>
              <td className="py-1 px-3 text-right font-mono font-semibold">
                ৳{gross.toLocaleString("en-IN")}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* 4. Financial Summary: Amount in Words (Left) & Withholding Breakdown (Right) */}
      <div className="flex items-stretch border border-black border-t-0">
        {/* Left: Amount in Words */}
        <div className="flex-1 p-3 flex flex-col justify-between">
          <div className="text-xs text-black">
            <span className="font-semibold">Net Disbursed in Words: </span>
            <span className="font-medium underline decoration-black decoration-1 underline-offset-4">
              {numberToWordsBDT(net)}
            </span>
          </div>
          <div className="text-[11px] text-neutral-600 mt-2">
            Disbursement Mode: {record.paymentMethod || "Cash"} • Status: {record.status}
          </div>
        </div>

        {/* Right: Subtotal, TDS, VDS, Net Total */}
        <div className="w-80 border-l border-black">
          <div className="flex border-b border-black text-xs">
            <div className="w-36 bg-black text-white font-bold py-1.5 px-3 flex items-center">
              GROSS AMOUNT :
            </div>
            <div className="flex-1 py-1.5 px-3 text-right font-mono font-semibold text-black">
              ৳{gross.toLocaleString("en-IN")}
            </div>
          </div>
          {tds > 0 && (
            <div className="flex border-b border-black text-xs">
              <div className="w-36 bg-black text-white font-bold py-1.5 px-3 flex items-center">
                TDS DEDUCTION :
              </div>
              <div className="flex-1 py-1.5 px-3 text-right font-mono font-semibold text-black">
                - ৳{tds.toLocaleString("en-IN")}
              </div>
            </div>
          )}
          {vds > 0 && (
            <div className="flex border-b border-black text-xs">
              <div className="w-36 bg-black text-white font-bold py-1.5 px-3 flex items-center">
                VDS DEDUCTION :
              </div>
              <div className="flex-1 py-1.5 px-3 text-right font-mono font-semibold text-black">
                - ৳{vds.toLocaleString("en-IN")}
              </div>
            </div>
          )}
          <div className="flex text-xs">
            <div className="w-36 bg-black text-white font-bold py-1.5 px-3 flex items-center">
              NET DISBURSED:
            </div>
            <div className="flex-1 py-1.5 px-3 text-right font-mono font-bold text-sm text-black">
              ৳{net.toLocaleString("en-IN")}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Statutory Withholding & Compliance Note */}
      <div className="mt-6 border border-black">
        <div className="bg-black text-white font-bold text-xs px-2.5 py-1 tracking-wider uppercase">
          TREASURY & STATUTORY WITHHOLDING DETAILS:
        </div>
        <div className="p-3 text-xs text-black space-y-1">
          <p>
            <span className="font-semibold">Disbursed From: </span>
            {record.sourceDetail || "Primary Cash Safe / Bank"} ({record.fundingSource || "Account"})
          </p>
          <p>
            <span className="font-semibold">Statutory Compliance: </span>
            TDS (Tax Deducted at Source) and VDS (VAT Deducted at Source) are computed in accordance with the Income Tax Act & NBR SROs.
          </p>
          <p>
            <span className="font-semibold">Verification: </span>
            Recorded in internal general ledger and audited by finance controller.
          </p>
        </div>
      </div>

      {/* 6. Signatures */}
      <div className="mt-14 pb-4 grid grid-cols-3 gap-8 text-center text-xs text-black">
        <div>
          <div className="w-40 mx-auto border-t border-black mb-1.5" />
          <span className="font-semibold text-black">{record.preparedBy || "Prepared By (Maker)"}</span>
          <span className="block text-[10px] text-neutral-500">Accounts Officer</span>
        </div>
        <div>
          <div className="w-40 mx-auto border-t border-black mb-1.5" />
          <span className="font-semibold text-black">{record.approvedBy || "Audit & Accounts Approval"}</span>
          <span className="block text-[10px] text-neutral-500">Finance Controller</span>
        </div>
        <div>
          <div className="w-40 mx-auto border-t border-black mb-1.5" />
          <span className="font-semibold text-black">{record.disbursedBy || "Payee / Disbursed By"}</span>
          <span className="block text-[10px] text-neutral-500">Authorized Signatory</span>
        </div>
      </div>
    </div>
  )
}
