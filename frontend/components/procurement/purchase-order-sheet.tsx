"use client"

import * as React from "react"
import { numberToWordsBDT } from "@/components/logistics/order-invoice"

export interface PurchaseOrderItemData {
  no?: number
  skuCode?: string | null
  drugName: string
  genericName?: string | null
  packSize?: string | null
  quantityOrdered: number
  quantityReceived?: number
  unitCostBDT: number
  totalCostBDT: number
  storageRequirement?: string
}

export interface PurchaseOrderData {
  id?: string
  poNumber: string
  poDate: string
  expectedDeliveryDate?: string | null
  wholesalerName: string
  wholesalerCode?: string | null
  contactPerson?: string | null
  phone?: string | null
  email?: string | null
  wholesalerAddress?: string | null
  deliveryWarehouse: string
  paymentTerms: string
  shippingTerms?: string | null
  requisitionRef?: string | null
  subtotalBDT: number
  discountBDT: number
  taxBDT: number
  totalAmountBDT: number
  status: string
  notes?: string | null
  createdBy?: string | null
  approvedBy?: string | null
  items?: PurchaseOrderItemData[]
}

export function PurchaseOrderSheet({
  order,
}: {
  order: PurchaseOrderData
}) {
  const items = order.items || []

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

        {/* PURCHASE ORDER Box */}
        <div className="bg-black text-white px-8 py-3.5 flex items-center justify-center min-w-[210px] h-[68px]">
          <span className="text-2xl font-extrabold tracking-[0.2em] text-white uppercase font-sans select-none whitespace-nowrap">
            PURCHASE ORDER
          </span>
        </div>
      </div>

      {/* 2. Side-by-Side Dual Boxes */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        {/* Left Box: VENDOR DETAILS */}
        <div className="border border-black">
          <div className="bg-black text-white font-bold text-xs px-2.5 py-1 tracking-wider uppercase">
            VENDOR / WHOLESALER:
          </div>
          <div className="p-2.5 text-xs text-black space-y-1">
            <p>
              <span className="font-normal">Wholesaler Name: </span>
              <span className="font-semibold">{order.wholesalerName}</span>
            </p>
            <p>
              <span className="font-normal">Supplier Code: </span>
              <span className="font-semibold font-mono">{order.wholesalerCode || "N/A"}</span>
            </p>
            <p>
              <span className="font-normal">Contact Person: </span>
              <span className="font-semibold">{order.contactPerson || "Sales Director"}</span>
            </p>
            <p>
              <span className="font-normal">Address / Depot: </span>
              <span className="font-semibold">{order.wholesalerAddress || "Dhaka Commercial Zone"}</span>
            </p>
            <p>
              <span className="font-normal">Phone / Email: </span>
              <span className="font-semibold">{order.phone || "+8801712-611071"}</span>
            </p>
          </div>
        </div>

        {/* Right Box: PO DETAILS */}
        <div className="border border-black">
          <div className="bg-black text-white font-bold text-xs px-2.5 py-1 tracking-wider uppercase">
            PO NUMBER: {order.poNumber}
          </div>
          <div className="p-2.5 text-xs text-black space-y-1">
            <p>
              <span className="font-normal">PO Date: </span>
              <span className="font-semibold">{order.poDate}</span>
            </p>
            <p>
              <span className="font-normal">Expected Delivery: </span>
              <span className="font-semibold">{order.expectedDeliveryDate || "Immediate / 7 Days"}</span>
            </p>
            <p>
              <span className="font-normal">Destination Warehouse: </span>
              <span className="font-semibold">{order.deliveryWarehouse}</span>
            </p>
            <p>
              <span className="font-normal">Payment Terms: </span>
              <span className="font-semibold">{order.paymentTerms}</span>
            </p>
            <p>
              <span className="font-normal">Requisition Ref: </span>
              <span className="font-semibold font-mono">{order.requisitionRef || "Central Depot Req"}</span>
            </p>
          </div>
        </div>
      </div>

      {/* 3. Items Table */}
      <table className="w-full border-collapse border border-black mt-6 text-xs text-black">
        <thead className="bg-black text-white font-bold text-xs uppercase">
          <tr>
            <th className="w-12 py-1.5 px-2 text-center border-r border-neutral-700">SL</th>
            <th className="py-1.5 px-3 text-left border-r border-neutral-700">Product Name & Generic</th>
            <th className="w-24 py-1.5 px-2 text-center border-r border-neutral-700">Storage</th>
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
                <div>{row.drugName}</div>
                {row.genericName && (
                  <div className="text-[10px] text-neutral-600 font-normal">{row.genericName}</div>
                )}
              </td>
              <td className="py-1 px-2 text-center border-r border-black text-[11px]">
                {row.storageRequirement || "Ambient"}
              </td>
              <td className="py-1 px-2 text-center border-r border-black font-mono font-medium">
                {row.quantityOrdered.toLocaleString()}
              </td>
              <td className="py-1 px-3 text-right border-r border-black font-mono">
                ৳{row.unitCostBDT.toLocaleString("en-IN")}
              </td>
              <td className="py-1 px-3 text-right font-mono font-semibold">
                ৳{row.totalCostBDT.toLocaleString("en-IN")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 4. Financial Summary: Amount in Words (Left) & Grand Totals (Right) */}
      <div className="flex items-stretch border border-black border-t-0">
        {/* Left: Amount in Words */}
        <div className="flex-1 p-3 flex flex-col justify-between">
          <div className="text-xs text-black">
            <span className="font-semibold">Total Amount in Words: </span>
            <span className="font-medium underline decoration-black decoration-1 underline-offset-4">
              {numberToWordsBDT(order.totalAmountBDT)}
            </span>
          </div>
          <div className="text-[11px] text-neutral-600 mt-2">
            Status: {order.status} • Shipping: {order.shippingTerms || "FOB Central Depot"}
          </div>
        </div>

        {/* Right: Subtotal, Discount, Tax, Grand Total Table */}
        <div className="w-72 border-l border-black">
          <div className="flex border-b border-black text-xs">
            <div className="w-32 bg-black text-white font-bold py-1.5 px-3 flex items-center">
              SUBTOTAL :
            </div>
            <div className="flex-1 py-1.5 px-3 text-right font-mono font-semibold text-black">
              ৳{(order.subtotalBDT || 0).toLocaleString("en-IN")}
            </div>
          </div>
          {order.discountBDT > 0 && (
            <div className="flex border-b border-black text-xs">
              <div className="w-32 bg-black text-white font-bold py-1.5 px-3 flex items-center">
                DISCOUNT :
              </div>
              <div className="flex-1 py-1.5 px-3 text-right font-mono font-semibold text-black">
                - ৳{order.discountBDT.toLocaleString("en-IN")}
              </div>
            </div>
          )}
          {order.taxBDT > 0 && (
            <div className="flex border-b border-black text-xs">
              <div className="w-32 bg-black text-white font-bold py-1.5 px-3 flex items-center">
                STATUTORY VAT :
              </div>
              <div className="flex-1 py-1.5 px-3 text-right font-mono font-semibold text-black">
                + ৳{order.taxBDT.toLocaleString("en-IN")}
              </div>
            </div>
          )}
          <div className="flex text-xs">
            <div className="w-32 bg-black text-white font-bold py-1.5 px-3 flex items-center">
              GRAND TOTAL:
            </div>
            <div className="flex-1 py-1.5 px-3 text-right font-mono font-bold text-sm text-black">
              ৳{(order.totalAmountBDT || 0).toLocaleString("en-IN")}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Special Pharma Instructions & Compliance */}
      <div className="mt-6 border border-black">
        <div className="bg-black text-white font-bold text-xs px-2.5 py-1 tracking-wider uppercase">
          SPECIAL INSTRUCTIONS & COLD CHAIN COMPLIANCE:
        </div>
        <div className="p-3 text-xs text-black space-y-1">
          <p>
            1. All batches must be supplied with original Manufacturer Certificate of Analysis (CoA) with minimum 75% remaining shelf life.
          </p>
          <p>
            2. Temperature-sensitive pharmaceuticals must maintain strict cold chain (2°C - 8°C) with data loggers attached.
          </p>
          <p>
            3. Goods Delivery Challan must clearly state Batch Number, Manufacturing Date, and Expiry Date.
          </p>
          {order.notes && (
            <p className="pt-1 font-semibold">Special Note: {order.notes}</p>
          )}
        </div>
      </div>

      {/* 6. Signatures */}
      <div className="mt-14 pb-4 grid grid-cols-3 gap-8 text-center text-xs text-black">
        <div>
          <div className="w-40 mx-auto border-t border-black mb-1.5" />
          <span className="font-semibold text-black">{order.createdBy || "Procurement Officer"}</span>
          <span className="block text-[10px] text-neutral-500">Prepared By</span>
        </div>
        <div>
          <div className="w-40 mx-auto border-t border-black mb-1.5" />
          <span className="font-semibold text-black">{order.approvedBy || "Lead QA Pharmacist"}</span>
          <span className="block text-[10px] text-neutral-500">Verified & Approved</span>
        </div>
        <div>
          <div className="w-40 mx-auto border-t border-black mb-1.5" />
          <span className="font-semibold text-black">Supplier Acceptance</span>
          <span className="block text-[10px] text-neutral-500">Authorized Signatory</span>
        </div>
      </div>
    </div>
  )
}
