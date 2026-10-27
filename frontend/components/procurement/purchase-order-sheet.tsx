"use client"

import * as React from "react"
import { numberToWordsBDT } from "@/components/logistics/order-invoice"
import { Building2, Calendar, FileText, MapPin, Phone, ShieldCheck, ThermometerSnowflake, Truck } from "lucide-react"

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
  const subtotal = order.subtotalBDT ?? items.reduce((sum, it) => sum + (it.totalCostBDT || 0), 0)
  const discount = order.discountBDT ?? 0
  const tax = order.taxBDT ?? 0
  const total = order.totalAmountBDT ?? (subtotal - discount + tax)

  return (
    <div className="w-full bg-white text-slate-900 font-sans text-xs selection:bg-none print:p-0">
      {/* 1. Header: Horizontal Logo & Motto + Corporate PO Metadata */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-200/90 gap-4">
        {/* Brand Horizontal Logo with Motto */}
        <div className="flex flex-col items-start max-w-[400px]">
          <img
            src="/horizontal-logo-motto.svg"
            alt="AK Pharma - Smart Solutions for Healthier Living"
            className="h-10 w-auto object-contain"
          />
          <div className="mt-2 text-[11px] leading-relaxed text-slate-500 font-normal">
            <p className="font-semibold text-slate-700">AK Pharma Ltd. • Central Supply Chain & Procurement</p>
            <p>10/26, Rupnagar R/A, Mirpur, Dhaka 1216, Bangladesh</p>
            <p>Tel: +8801712-611071 • Email: akpharmabd@gmail.com</p>
            <p className="text-[10px] text-slate-400">DGDA Lic: DL-2024-DH-08492 • Tax TIN: 4892-1082-9381</p>
          </div>
        </div>

        {/* PO Meta Block */}
        <div className="text-left sm:text-right space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold uppercase tracking-wider">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
            {order.status ? `${order.status} Order` : "Confirmed PO"}
          </div>
          <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase">
            Purchase Order
          </h2>
          <p className="font-mono text-xs font-bold text-slate-800">
            PO No: <span className="text-blue-600">{order.poNumber}</span>
          </p>
          <div className="text-[11px] text-slate-500 space-y-0.5">
            <p>
              Order Date: <span className="font-semibold text-slate-700">{order.poDate}</span>
            </p>
            <p>
              Due Date: <span className="font-semibold text-slate-700">{order.expectedDeliveryDate || "7 Business Days"}</span>
            </p>
            {order.requisitionRef && (
              <p className="font-mono text-[10px]">
                Requisition Ref: <span className="text-slate-600">{order.requisitionRef}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 2. Dual Side-by-Side Cards: Vendor Profile vs Ship-To Destination */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Vendor Card */}
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
          <div className="flex items-center gap-2 mb-2.5">
            <Building2 className="h-4 w-4 text-blue-600" />
            <h3 className="font-bold text-slate-800 text-[11px] tracking-wider uppercase">
              Vendor / Supplier Profile
            </h3>
          </div>
          <div className="space-y-1.5 text-xs">
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Wholesaler / Manufacturer</p>
              <p className="font-bold text-slate-900 text-sm">{order.wholesalerName}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Supplier Code</p>
                <p className="font-mono font-semibold text-slate-700">{order.wholesalerCode || "SUP-CORP"}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Contact Person</p>
                <p className="font-medium text-slate-800">{order.contactPerson || "Sales Director"}</p>
              </div>
            </div>
            <div className="pt-1 text-[11px] text-slate-600 space-y-0.5">
              <p className="flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                <span className="truncate">{order.wholesalerAddress || "Commercial Hub, Dhaka"}</span>
              </p>
              <p className="flex items-center gap-1.5">
                <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                <span>{order.phone || "+8801712-611071"}{order.email ? ` • ${order.email}` : ""}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Ship-To & Commercial Terms Card */}
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
          <div className="flex items-center gap-2 mb-2.5">
            <Truck className="h-4 w-4 text-emerald-600" />
            <h3 className="font-bold text-slate-800 text-[11px] tracking-wider uppercase">
              Ship-To Destination & Commercial Terms
            </h3>
          </div>
          <div className="space-y-1.5 text-xs">
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Delivery Warehouse</p>
              <p className="font-bold text-slate-900">{order.deliveryWarehouse || "Central Distribution Hub - Tejgaon Depot"}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Payment Terms</p>
                <p className="font-semibold text-slate-800">{order.paymentTerms || "Net 30 Days"}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Shipping Terms</p>
                <p className="font-semibold text-slate-800">{order.shippingTerms || "FOB Central Depot"}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Delivery Window</p>
                <p className="font-medium text-slate-700">{order.expectedDeliveryDate || "Within 7 Days"}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Billing Currency</p>
                <p className="font-mono font-bold text-emerald-700">BDT (৳) Tax-Compliant</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Procurement Line Items Table */}
      <div className="mt-5 rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/80 text-slate-600 border-b border-slate-200 text-[11px] uppercase tracking-wider">
              <th className="w-10 py-2.5 px-3 text-center font-semibold">SL</th>
              <th className="py-2.5 px-3 text-left font-semibold">Product Description & Formulation</th>
              <th className="w-32 py-2.5 px-3 text-center font-semibold">Storage Condition</th>
              <th className="w-20 py-2.5 px-3 text-center font-semibold">Qty</th>
              <th className="w-28 py-2.5 px-3 text-right font-semibold">Unit Rate (৳)</th>
              <th className="w-32 py-2.5 px-3 text-right font-semibold">Total Amount (৳)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((row, idx) => {
              const isColdChain = (row.storageRequirement || "").toLowerCase().includes("cold") || (row.storageRequirement || "").includes("2-8") || (row.storageRequirement || "").includes("2°C")
              return (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-2 px-3 text-center font-mono text-slate-400 text-[11px]">
                    {String(row.no || idx + 1).padStart(2, "0")}
                  </td>
                  <td className="py-2 px-3">
                    <p className="font-bold text-slate-900">{row.drugName}</p>
                    {row.genericName && (
                      <p className="text-[11px] text-slate-500">{row.genericName}</p>
                    )}
                    {row.skuCode && (
                      <p className="text-[10px] font-mono text-slate-400">SKU: {row.skuCode}</p>
                    )}
                  </td>
                  <td className="py-2 px-3 text-center">
                    {isColdChain ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 border border-cyan-200 text-cyan-700">
                        <ThermometerSnowflake className="h-3 w-3" />
                        Cold Chain 2-8°C
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                        {row.storageRequirement || "Ambient <25°C"}
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-center font-mono font-bold text-slate-800">
                    {row.quantityOrdered.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-slate-700">
                    ৳{row.unitCostBDT.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                    ৳{row.totalCostBDT.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* 4. Financial Calculations & Words Callout */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
        {/* Left: Amount in Words */}
        <div className="sm:col-span-7 rounded-xl border border-blue-100 bg-blue-50/40 p-4">
          <p className="text-[10px] font-bold text-blue-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-blue-600" />
            Total Purchase Commitment in Words
          </p>
          <p className="text-xs font-semibold text-blue-950 italic leading-relaxed">
            "{numberToWordsBDT(total)}"
          </p>
          <div className="mt-3 pt-2.5 border-t border-blue-200/50 flex flex-wrap items-center justify-between text-[11px] text-blue-800">
            <span>Commercial Status: <strong>{order.status}</strong></span>
            <span>Incoterms: <strong>{order.shippingTerms || "FOB Central Depot"}</strong></span>
          </div>
        </div>

        {/* Right: Subtotal, Discount, Tax, Grand Total Breakdown */}
        <div className="sm:col-span-5 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Subtotal</span>
            <span className="font-mono font-semibold text-slate-800">
              ৳{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {discount > 0 && (
            <div className="flex items-center justify-between text-xs text-amber-700">
              <span>Trade Discount</span>
              <span className="font-mono font-semibold">
                - ৳{discount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}

          {tax > 0 && (
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Statutory VAT (15%)</span>
              <span className="font-mono font-semibold text-slate-800">
                + ৳{tax.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}

          <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
            <span className="font-bold text-slate-900 text-xs uppercase tracking-wide">
              Grand Total
            </span>
            <span className="font-mono text-base font-black text-indigo-700">
              ৳{total.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* 5. GxP Pharma Regulatory Compliance & Delivery Protocol */}
      <div className="mt-4 rounded-xl border border-emerald-200/70 bg-emerald-50/30 p-3.5 text-xs text-slate-700 space-y-1.5">
        <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-[11px] tracking-wide uppercase">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          Pharma Regulatory Compliance & Cold Chain Protocol
        </div>
        <p className="text-[11px] leading-relaxed text-slate-600">
          1. <strong>Certificate of Analysis (CoA):</strong> All deliveries must include original manufacturer batch CoA with minimum 75% remaining shelf life.
        </p>
        <p className="text-[11px] leading-relaxed text-slate-600">
          2. <strong>Cold Chain Verification:</strong> Thermolabile products must arrive in validated insulated shippers with active temperature monitoring loggers intact.
        </p>
        <p className="text-[11px] leading-relaxed text-slate-600">
          3. <strong>Goods Challan:</strong> Delivery Challan must clearly state Batch Number, Manufacturing Date, and Expiry Date matching external carton barcodes.
        </p>
        {order.notes && (
          <p className="pt-1 text-[11px] font-semibold text-slate-800">
            Special Procurement Note: <span className="font-normal">{order.notes}</span>
          </p>
        )}
      </div>

      {/* 6. Executive 3-Tier Signatures */}
      <div className="mt-10 pt-4 grid grid-cols-3 gap-6 text-center text-xs">
        <div>
          <div className="w-36 mx-auto border-t border-slate-400 mb-1.5" />
          <p className="font-bold text-slate-800">{order.createdBy || "Procurement Officer"}</p>
          <p className="text-[10px] text-slate-400">Prepared & Initiated By</p>
        </div>
        <div>
          <div className="w-36 mx-auto border-t border-slate-400 mb-1.5" />
          <p className="font-bold text-slate-800">{order.approvedBy || "Lead Pharmacist / QA Head"}</p>
          <p className="text-[10px] text-slate-400">Technical & Regulatory Approval</p>
        </div>
        <div>
          <div className="w-36 mx-auto border-t border-slate-400 mb-1.5" />
          <p className="font-bold text-slate-800">Supplier Acceptance</p>
          <p className="text-[10px] text-slate-400">Authorized Signatory & Seal</p>
        </div>
      </div>
    </div>
  )
}
