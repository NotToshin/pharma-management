"use client"

import * as React from "react"

export interface InvoiceItem {
  no: number
  description: string
  quantity: number
  unitCost: number
  total: number
}

export interface OrderInvoiceData {
  id?: string
  orderNumber: string
  orderDate: string
  pharmacyName: string
  territory: string
  assignedMio: string
  invoiceNumber: string
  paymentTerms?: string | null
  status: string
  comments?: string
  itemsDetail?: InvoiceItem[]
  itemsSummary?: string
  totalBoxes?: number
  orderValue?: number
  discountPercent?: number
  discountAmount?: number
}

export interface ClientInvoiceData {
  id?: string
  clientCode?: string
  pharmacyName?: string
  proprietor?: string
  address?: string
  phone?: string
  territory?: string
  creditTermDays?: number
}

export function formatInvoiceDate(dateInput?: string): string {
  if (!dateInput) {
    return "Not recorded"
  }

  const isoDate = /^(\d{4})-(\d{2})-(\d{2})(?:T|$)/.exec(dateInput)
  if (isoDate) return `${isoDate[3]}/${isoDate[2]}/${isoDate[1]}`

  // If already DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateInput)) return dateInput

  // Try parsing dateInput
  const parsed = Date.parse(dateInput)
  if (!isNaN(parsed)) {
    const dt = new Date(parsed)
    const d = String(dt.getDate()).padStart(2, "0")
    const m = String(dt.getMonth() + 1).padStart(2, "0")
    const y = dt.getFullYear()
    return `${d}/${m}/${y}`
  }

  // "27 Oct 2026" or similar
  const parts = dateInput.trim().split(/[\s-]+/)
  if (parts.length === 3) {
    const months: Record<string, string> = {
      jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
      jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
      january: "01", february: "02", march: "03", april: "04", june: "06",
      july: "07", august: "08", september: "09", october: "10", november: "11", december: "12",
    }
    const day = parts[0].padStart(2, "0")
    const mKey = parts[1].slice(0, 3).toLowerCase()
    const month = months[mKey] || "01"
    const year = parts[2]
    if (year.length === 4) {
      return `${day}/${month}/${year}`
    }
  }

  return dateInput
}

export function numberToWordsBDT(num: number): string {
  if (num === 0) return "Zero Taka Only"
  const a = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ]
  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ]

  function inWords(n: number): string {
    if (n < 20) return a[n]
    if (n < 100)
      return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "")
    if (n < 1000)
      return (
        a[Math.floor(n / 100)] +
        " Hundred" +
        (n % 100 !== 0 ? " and " + inWords(n % 100) : "")
      )
    if (n < 100000)
      return (
        inWords(Math.floor(n / 1000)) +
        " Thousand" +
        (n % 1000 !== 0 ? " " + inWords(n % 1000) : "")
      )
    if (n < 10000000)
      return (
        inWords(Math.floor(n / 100000)) +
        " Lakh" +
        (n % 100000 !== 0 ? " " + inWords(n % 100000) : "")
      )
    return (
      inWords(Math.floor(n / 10000000)) +
      " Crore" +
      (n % 10000000 !== 0 ? " " + inWords(n % 10000000) : "")
    )
  }

  const rounded = Math.round(Math.abs(num))
  return inWords(rounded).trim() + " Taka Only"
}

export function OrderInvoiceSheet({
  order,
  client,
  items,
  subtotal,
  discountAmount,
  grandTotal,
}: {
  order: OrderInvoiceData
  client?: ClientInvoiceData | null
  items: InvoiceItem[]
  subtotal: number
  discountAmount: number
  grandTotal: number
}) {
  const formattedDate = formatInvoiceDate(order.orderDate)
  const creditDays = client?.creditTermDays
  const paymentTerms = order.paymentTerms?.trim() || (
    creditDays === 0 ? "Due on Receipt" :
    creditDays != null ? `Credit (${creditDays} Days)` : "Not recorded"
  )

  return (
    <div className="w-full bg-white text-black font-sans text-xs selection:bg-none print:p-0">
      {/* 1. Header: Logo (left) + Solid Black INVOICE Box (right) */}
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

        {/* INVOICE Box */}
        <div className="bg-black text-white px-8 py-3.5 flex items-center justify-center min-w-[210px] h-[68px]">
          <span className="text-3xl font-extrabold tracking-[0.22em] text-white uppercase font-sans select-none">
            INVOICE
          </span>
        </div>
      </div>

      {/* 2. Side-by-Side Boxes: BILL TO (Left) vs Invoice Details (Right) */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        {/* Left Box: BILL TO */}
        <div className="border border-black">
          <div className="bg-black text-white font-bold text-xs px-2.5 py-1 tracking-wider uppercase">
            BILL TO:
          </div>
          <div className="p-2.5 text-xs text-black space-y-1">
            <p>
              <span className="font-normal">Pharmacy Name: </span>
              <span className="font-semibold">{order.pharmacyName}</span>
            </p>
            <p>
              <span className="font-normal">Contact Person: </span>
              <span className="font-semibold">{client?.proprietor || "In-charge / Proprietor"}</span>
            </p>
            <p>
              <span className="font-normal">Address: </span>
              <span className="font-semibold">{client?.address || order.territory || "Dhaka, Bangladesh"}</span>
            </p>
            <p>
              <span className="font-normal">Phone Number: </span>
              <span className="font-semibold">{client?.phone || "On Record"}</span>
            </p>
          </div>
        </div>

        {/* Right Box: Invoice Details */}
        <div className="border border-black">
          <div className="bg-black text-white font-bold text-xs px-2.5 py-1 tracking-wider uppercase">
            Invoice No: {order.invoiceNumber || "Not issued"}
          </div>
          <div className="p-2.5 text-xs text-black space-y-1">
            <p>
              <span className="font-normal">Date: </span>
              <span className="font-semibold">{formattedDate}</span>
            </p>
            <p>
              <span className="font-normal">Payment Terms: </span>
              <span className="font-semibold">{paymentTerms}</span>
            </p>
            <p>
              <span className="font-normal">MIO/SR Name: </span>
              <span className="font-semibold">{order.assignedMio || "___________"}</span>
            </p>
            <p>
              <span className="font-normal">Territory: </span>
              <span className="font-semibold">{order.territory || "___________"}</span>
            </p>
          </div>
        </div>
      </div>

      {/* 3. Items Table */}
      <table className="w-full border-collapse border border-black mt-6 text-xs text-black">
        <thead className="bg-black text-white font-bold text-xs uppercase">
          <tr>
            <th className="w-12 py-1.5 px-2 text-center border-r border-neutral-700">SL</th>
            <th className="py-1.5 px-3 text-left border-r border-neutral-700">Product Name</th>
            <th className="w-20 py-1.5 px-2 text-center border-r border-neutral-700">Qty</th>
            <th className="w-28 py-1.5 px-3 text-right border-r border-neutral-700">Unit Price</th>
            <th className="w-32 py-1.5 px-3 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((row, idx) => (
            <tr key={idx} className="border-b border-black h-7">
              <td className="py-1 px-2 text-center border-r border-black font-mono font-medium">
                {row.no || idx + 1}
              </td>
              <td className="py-1 px-3 text-left border-r border-black font-semibold">
                {row.description}
              </td>
              <td className="py-1 px-2 text-center border-r border-black font-mono font-medium">
                {row.quantity}
              </td>
              <td className="py-1 px-3 text-right border-r border-black font-mono">
                ৳{row.unitCost.toLocaleString("en-IN")}
              </td>
              <td className="py-1 px-3 text-right font-mono font-semibold">
                ৳{row.total.toLocaleString("en-IN")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 4. Financial Summary: Amount in Words (Left) & Subtotal / Discount / Grand Total (Right) */}
      <div className="flex items-stretch border border-black border-t-0">
        {/* Left: Amount in Words */}
        <div className="flex-1 p-3 flex flex-col justify-between">
          <div className="text-xs text-black">
            <span className="font-semibold">Amount in Words: </span>
            <span className="font-medium underline decoration-black decoration-1 underline-offset-4">
              {numberToWordsBDT(grandTotal)}
            </span>
          </div>
        </div>

        {/* Right: Subtotal, Discount, Grand Total Table */}
        <div className="w-72 border-l border-black">
          <div className="flex border-b border-black text-xs">
            <div className="w-32 bg-black text-white font-bold py-1.5 px-3 flex items-center">
              SUBTOTAL :
            </div>
            <div className="flex-1 py-1.5 px-3 text-right font-mono font-semibold text-black">
              ৳{subtotal.toLocaleString("en-IN")}
            </div>
          </div>
          <div className="flex border-b border-black text-xs">
            <div className="w-32 bg-black text-white font-bold py-1.5 px-3 flex items-center">
              DISCOUNT :
            </div>
            <div className="flex-1 py-1.5 px-3 text-right font-mono font-semibold text-black">
              ৳{discountAmount.toLocaleString("en-IN")}
            </div>
          </div>
          <div className="flex text-xs">
            <div className="w-32 bg-black text-white font-bold py-1.5 px-3 flex items-center">
              GRAND TOTAL:
            </div>
            <div className="flex-1 py-1.5 px-3 text-right font-mono font-bold text-sm text-black">
              ৳{grandTotal.toLocaleString("en-IN")}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Payment & Bank Details */}
      {order.comments && (
        <p className="mt-4 whitespace-pre-wrap text-xs"><span className="font-semibold">Comments: </span>{order.comments}</p>
      )}
      <div className="mt-6 border border-black">
        <div className="bg-black text-white font-bold text-xs px-2.5 py-1 tracking-wider uppercase">
          PAYMENT & BANK DETAILS:
        </div>
        <div className="p-3 text-xs text-black space-y-1">
          <p><span className="font-semibold">Bank Name: </span>Dutch-Bangla Bank PLC (DBBL)</p>
          <p><span className="font-semibold">A/C Name: </span>AK Pharma</p>
          <p><span className="font-semibold">A/C No.: </span>2111100019128</p>
          <p><span className="font-semibold">Branch Name: </span>Pallabi Branch/090263581</p>
          <p><span className="font-semibold">SWIFT Code: </span>DBBLBDDH</p>
          <div className="pt-1 space-y-0.5">
            <p className="font-semibold">Terms & Conditions:</p>
            <p className="pl-1">1. Goods once sold will be accepted for return only in case of expiry as per standard replacement policy.</p>
            <p className="pl-1">2. Please verify physical box count and seal integrity at the time of delivery.</p>
          </div>
        </div>
      </div>

      {/* 6. Signatures */}
      <div className="mt-14 pb-4 grid grid-cols-3 gap-8 text-center text-xs text-black">
        <div>
          <div className="w-40 mx-auto border-t border-black mb-1.5" />
          <span className="font-semibold text-black">Customer</span>
        </div>
        <div>
          <div className="w-40 mx-auto border-t border-black mb-1.5" />
          <span className="font-semibold text-black">MIO / SR</span>
        </div>
        <div>
          <div className="w-40 mx-auto border-t border-black mb-1.5" />
          <span className="font-semibold text-black">Authorized Signature</span>
        </div>
      </div>
    </div>
  )
}
