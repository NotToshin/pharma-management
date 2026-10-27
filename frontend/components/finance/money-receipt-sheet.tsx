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

        {/* MONEY RECEIPT Box */}
        <div className="bg-black text-white px-8 py-3.5 flex items-center justify-center min-w-[210px] h-[68px]">
          <span className="text-2xl font-extrabold tracking-[0.2em] text-white uppercase font-sans select-none whitespace-nowrap">
            MONEY RECEIPT
          </span>
        </div>
      </div>

      {/* 2. Side-by-Side Dual Boxes */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        {/* Left Box: RECEIVED FROM */}
        <div className="border border-black">
          <div className="bg-black text-white font-bold text-xs px-2.5 py-1 tracking-wider uppercase">
            RECEIVED FROM:
          </div>
          <div className="p-2.5 text-xs text-black space-y-1">
            <p>
              <span className="font-normal">Chemist / Pharmacy: </span>
              <span className="font-semibold">{record.chemistName}</span>
            </p>
            <p>
              <span className="font-normal">Territory: </span>
              <span className="font-semibold">{record.territory}</span>
            </p>
            <p>
              <span className="font-normal">Invoice Reference: </span>
              <span className="font-semibold font-mono">Invoice #{record.invoiceNo}</span>
            </p>
            {record.orderId && (
              <p>
                <span className="font-normal">Order Reference: </span>
                <span className="font-semibold font-mono">Order #{record.orderId}</span>
              </p>
            )}
          </div>
        </div>

        {/* Right Box: RECEIPT DETAILS */}
        <div className="border border-black">
          <div className="bg-black text-white font-bold text-xs px-2.5 py-1 tracking-wider uppercase">
            RECEIPT NO: {record.receiptNo}
          </div>
          <div className="p-2.5 text-xs text-black space-y-1">
            <p>
              <span className="font-normal">Date: </span>
              <span className="font-semibold">{record.collectionDate}</span>
            </p>
            <p>
              <span className="font-normal">Collecting MIO/SR: </span>
              <span className="font-semibold">{record.salesRepName}</span>
            </p>
            <p>
              <span className="font-normal">Payment Instrument: </span>
              <span className="font-semibold">
                {record.paymentMethod}
                {record.chequeNumber ? ` (Ref: ${record.chequeNumber})` : ""}
              </span>
            </p>
            <p>
              <span className="font-normal">Status: </span>
              <span className="font-semibold">{record.status}</span>
            </p>
          </div>
        </div>
      </div>

      {/* 3. Collection Particulars Table */}
      <table className="w-full border-collapse border border-black mt-6 text-xs text-black">
        <thead className="bg-black text-white font-bold text-xs uppercase">
          <tr>
            <th className="w-12 py-1.5 px-2 text-center border-r border-neutral-700">SL</th>
            <th className="py-1.5 px-3 text-left border-r border-neutral-700">Particulars Description</th>
            <th className="w-32 py-1.5 px-3 text-right border-r border-neutral-700">Total Invoice</th>
            <th className="w-32 py-1.5 px-3 text-right border-r border-neutral-700">Amount Received</th>
            <th className="w-32 py-1.5 px-3 text-right">Remaining Due</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-black h-8">
            <td className="py-1 px-2 text-center border-r border-black font-mono font-medium">
              1
            </td>
            <td className="py-1 px-3 text-left border-r border-black font-semibold">
              Delivery collection settlement against Invoice #{record.invoiceNo}
              {record.notes ? ` (${record.notes})` : ""}
            </td>
            <td className="py-1 px-3 text-right border-r border-black font-mono">
              ৳{(record.totalInvoiceAmount || 0).toLocaleString("en-IN")}
            </td>
            <td className="py-1 px-3 text-right border-r border-black font-mono font-bold">
              ৳{(record.amountCollected || 0).toLocaleString("en-IN")}
            </td>
            <td className="py-1 px-3 text-right font-mono font-semibold">
              ৳{(record.dueAmountRemaining || 0).toLocaleString("en-IN")}
            </td>
          </tr>
        </tbody>
      </table>

      {/* 4. Financial Summary: Amount in Words (Left) & Realized Totals (Right) */}
      <div className="flex items-stretch border border-black border-t-0">
        {/* Left: Amount in Words */}
        <div className="flex-1 p-3 flex flex-col justify-between">
          <div className="text-xs text-black">
            <span className="font-semibold">Received in Words: </span>
            <span className="font-medium underline decoration-black decoration-1 underline-offset-4">
              {numberToWordsBDT(record.amountCollected)}
            </span>
          </div>
          <div className="text-[11px] text-neutral-600 mt-2">
            Payment Mode: {record.paymentMethod} • Status: {record.status}
          </div>
        </div>

        {/* Right: Totals summary */}
        <div className="w-80 border-l border-black">
          <div className="flex border-b border-black text-xs">
            <div className="w-36 bg-black text-white font-bold py-1.5 px-3 flex items-center">
              INVOICE VALUE :
            </div>
            <div className="flex-1 py-1.5 px-3 text-right font-mono font-semibold text-black">
              ৳{(record.totalInvoiceAmount || 0).toLocaleString("en-IN")}
            </div>
          </div>
          <div className="flex border-b border-black text-xs">
            <div className="w-36 bg-black text-white font-bold py-1.5 px-3 flex items-center">
              REMAINING DUE :
            </div>
            <div className="flex-1 py-1.5 px-3 text-right font-mono font-semibold text-black">
              ৳{(record.dueAmountRemaining || 0).toLocaleString("en-IN")}
            </div>
          </div>
          <div className="flex text-xs">
            <div className="w-36 bg-black text-white font-bold py-1.5 px-3 flex items-center">
              AMOUNT RECEIVED:
            </div>
            <div className="flex-1 py-1.5 px-3 text-right font-mono font-bold text-sm text-black">
              ৳{(record.amountCollected || 0).toLocaleString("en-IN")}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Vault & Deposit Verification */}
      <div className="mt-6 border border-black">
        <div className="bg-black text-white font-bold text-xs px-2.5 py-1 tracking-wider uppercase">
          TREASURY CLEARANCE & SAFE DEPOSIT:
        </div>
        <div className="p-3 text-xs text-black space-y-1">
          <p>
            <span className="font-semibold">Deposited Into: </span>
            {record.depositedInto || "Primary Cash Vault / Treasury Clearance Account"}
          </p>
          <p>
            <span className="font-semibold">Verification Officer: </span>
            {record.clearedBy || "Cashier & Treasury Verification Team"}
          </p>
          <p>
            <span className="font-semibold">Official Receipt Policy: </span>
            Cheque payments are subject to actual realization in bank. Official receipt is valid only with authorized stamp and signature.
          </p>
        </div>
      </div>

      {/* 6. Signatures */}
      <div className="mt-14 pb-4 grid grid-cols-3 gap-8 text-center text-xs text-black">
        <div>
          <div className="w-40 mx-auto border-t border-black mb-1.5" />
          <span className="font-semibold text-black">Customer / Chemist Stamp</span>
          <span className="block text-[10px] text-neutral-500">Acknowledged</span>
        </div>
        <div>
          <div className="w-40 mx-auto border-t border-black mb-1.5" />
          <span className="font-semibold text-black">{record.salesRepName}</span>
          <span className="block text-[10px] text-neutral-500">Collecting Agent (MIO)</span>
        </div>
        <div>
          <div className="w-40 mx-auto border-t border-black mb-1.5" />
          <span className="font-semibold text-black">{record.clearedBy || "Authorized Treasury"}</span>
          <span className="block text-[10px] text-neutral-500">Finance & Accounts</span>
        </div>
      </div>
    </div>
  )
}
