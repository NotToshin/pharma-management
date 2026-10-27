"use client"

import * as React from "react"
import { numberToWordsBDT } from "@/components/logistics/order-invoice"

export interface SalaryPayslipData {
  id?: string
  empId: string
  fullName: string
  designation: string
  department: string
  territory?: string
  bankName?: string
  bankAccount?: string
  payPeriod: string
  basicSalary: number
  houseRent: number
  medicalAllowance: number
  conveyanceTaDa: number
  salesIncentive: number
  specialBonus: number
  providentFund: number
  taxDeduction: number
  otherDeductions: number
  leaveDays?: number
  status: string
}

export function SalaryPayslipSheet({
  record,
}: {
  record: SalaryPayslipData
}) {
  const gross =
    (record.basicSalary || 0) +
    (record.houseRent || 0) +
    (record.medicalAllowance || 0) +
    (record.conveyanceTaDa || 0) +
    (record.salesIncentive || 0) +
    (record.specialBonus || 0)

  const deductions =
    (record.providentFund || 0) +
    (record.taxDeduction || 0) +
    (record.otherDeductions || 0)

  const net = Math.max(0, gross - deductions)

  return (
    <div className="w-full bg-white text-slate-900 font-sans text-xs selection:bg-none print:p-0">
      {/* 1. Corporate Header: Horizontal Logo & Motto + Executive Pay Slip Title */}
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
            <p>Hotline: +8801712-611071, +8801798-112763 • Email: akpharmabd@gmail.com</p>
          </div>
        </div>

        {/* Executive Pay Advice Block */}
        <div className="text-left sm:text-right space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold uppercase tracking-wider">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {record.status === "Disbursed" ? "Disbursed & Confirmed" : record.status}
          </div>
          <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase">
            Official Salary Payslip
          </h2>
          <p className="text-xs font-semibold text-slate-700">
            Pay Period: <span className="font-bold text-blue-600">{record.payPeriod}</span>
          </p>
          <p className="font-mono text-[11px] text-slate-400">
            Ref Code: AKP/{record.empId || "EMP"}/SAL
          </p>
        </div>
      </div>

      {/* 2. Employee Profile 4-Column Summary Card */}
      <div className="mt-5 rounded-xl border border-slate-200/90 bg-slate-50/70 p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          {/* Col 1 */}
          <div className="space-y-1">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Employee Name
            </span>
            <span className="block font-bold text-slate-900 text-sm">
              {record.fullName}
            </span>
            <span className="block text-[11px] text-slate-600 font-medium">
              {record.designation}
            </span>
          </div>

          {/* Col 2 */}
          <div className="space-y-1">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Staff ID & Dept
            </span>
            <span className="block font-mono font-bold text-slate-800 text-sm">
              {record.empId}
            </span>
            <span className="block text-[11px] text-slate-600">
              {record.department} ({record.territory || "Head Office"})
            </span>
          </div>

          {/* Col 3 */}
          <div className="space-y-1">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Disbursement Channel
            </span>
            <span className="block font-semibold text-slate-800">
              {record.bankName || "Dutch-Bangla Bank PLC"}
            </span>
            <span className="block font-mono text-[11px] text-slate-600">
              A/C: {record.bankAccount || "Direct Payroll Credit"}
            </span>
          </div>

          {/* Col 4 */}
          <div className="space-y-1">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Leaves & Attendance
            </span>
            <span className="block font-bold text-slate-800">
              {record.leaveDays || 0} Day(s) Leave
            </span>
            <span className="block text-[11px] text-emerald-600 font-medium">
              Pay Status: Active Regular
            </span>
          </div>
        </div>
      </div>

      {/* 3. Dual Breakdown Cards: Earnings vs Deductions */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Earnings Card */}
        <div className="rounded-xl border border-slate-200/90 overflow-hidden bg-white shadow-xs">
          <div className="bg-slate-100/80 px-4 py-2.5 flex items-center justify-between border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Remuneration / Earnings
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Standard BDT</span>
          </div>
          <div className="p-3.5 space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Basic Salary</span>
              <span className="font-mono font-medium text-slate-900">
                ৳{(record.basicSalary || 0).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">House Rent Allowance (50%)</span>
              <span className="font-mono font-medium text-slate-900">
                ৳{(record.houseRent || 0).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Medical Allowance</span>
              <span className="font-mono font-medium text-slate-900">
                ৳{(record.medicalAllowance || 0).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Conveyance / TA-DA</span>
              <span className="font-mono font-medium text-slate-900">
                ৳{(record.conveyanceTaDa || 0).toLocaleString("en-IN")}
              </span>
            </div>
            {record.salesIncentive > 0 && (
              <div className="flex justify-between py-1 border-b border-slate-100 text-emerald-700 font-medium">
                <span>Field Sales Performance Incentive</span>
                <span className="font-mono">+৳{record.salesIncentive.toLocaleString("en-IN")}</span>
              </div>
            )}
            {record.specialBonus > 0 && (
              <div className="flex justify-between py-1 border-b border-slate-100 text-emerald-700 font-medium">
                <span>Special Festival / Bonus</span>
                <span className="font-mono">+৳{record.specialBonus.toLocaleString("en-IN")}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 text-xs font-bold text-slate-900">
              <span className="uppercase text-[11px] text-slate-700">Gross Earnings</span>
              <span className="font-mono text-sm text-slate-900 font-black">
                ৳{gross.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        {/* Deductions Card */}
        <div className="rounded-xl border border-slate-200/90 overflow-hidden bg-white shadow-xs">
          <div className="bg-slate-100/80 px-4 py-2.5 flex items-center justify-between border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Deductions & Withholdings
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Statutory & Other</span>
          </div>
          <div className="p-3.5 space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Provident Fund (PF Withholding)</span>
              <span className="font-mono font-medium text-slate-900">
                ৳{(record.providentFund || 0).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Income Tax (TDS Withholding)</span>
              <span className="font-mono font-medium text-slate-900">
                ৳{(record.taxDeduction || 0).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Salary Advance / Other Deductions</span>
              <span className="font-mono font-medium text-slate-900">
                ৳{(record.otherDeductions || 0).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 text-slate-400 italic">
              <span>Unpaid Leave / Loss of Pay</span>
              <span className="font-mono">৳0</span>
            </div>
            <div className="flex justify-between pt-6 text-xs font-bold text-rose-700">
              <span className="uppercase text-[11px]">Total Deductions</span>
              <span className="font-mono text-sm font-black">
                - ৳{deductions.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Executive Net Pay Highlight Banner (Workday / Enterprise ERP Style) */}
      <div className="mt-5 rounded-xl bg-slate-900 text-white p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold tracking-wider text-slate-300 uppercase">
              Net Remuneration Disbursed
            </span>
            <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-emerald-400">
              ৳ {net.toLocaleString("en-IN")}
            </div>
            <p className="text-xs text-slate-300 italic pt-0.5">
              <span className="font-semibold text-slate-200">Amount in Words: </span>
              {numberToWordsBDT(net)}
            </p>
          </div>

          <div className="sm:text-right border-t sm:border-t-0 sm:border-l border-slate-700 pt-3 sm:pt-0 sm:pl-6 space-y-1 text-xs">
            <div className="text-slate-300">
              Gross Earnings: <strong className="text-white font-mono">৳{gross.toLocaleString("en-IN")}</strong>
            </div>
            <div className="text-slate-300">
              Total Deductions: <strong className="text-rose-400 font-mono">-৳{deductions.toLocaleString("en-IN")}</strong>
            </div>
            <div className="text-[11px] text-slate-400 pt-1">
              Transfer Mode: Direct Bank Credit (BEFTN)
            </div>
          </div>
        </div>
      </div>

      {/* 5. Confidentiality & Payroll Policy Note */}
      <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-[11px] text-slate-600 leading-relaxed space-y-1">
        <p className="font-semibold text-slate-700">
          Official Payroll Certification & Privacy Notice:
        </p>
        <p>
          1. This pay advice is generated by the central ERP of AK Pharma Bangladesh and is certified accurate as per approved attendance and payroll records.
        </p>
        <p>
          2. Remuneration has been transferred directly into the designated bank account on record. Compensation terms are confidential between AK Pharma and the employee.
        </p>
      </div>

      {/* 6. Corporate Signatures */}
      <div className="mt-12 pb-2 grid grid-cols-3 gap-6 text-center text-xs text-slate-600">
        <div>
          <div className="w-36 mx-auto border-b border-slate-300 pb-1 mb-1.5" />
          <span className="font-semibold text-slate-800 block">{record.fullName}</span>
          <span className="text-[10px] text-slate-400">Employee Acknowledgment</span>
        </div>
        <div>
          <div className="w-36 mx-auto border-b border-slate-300 pb-1 mb-1.5" />
          <span className="font-semibold text-slate-800 block">HR & Talent Operations</span>
          <span className="text-[10px] text-slate-400">Verified & Processed</span>
        </div>
        <div>
          <div className="w-36 mx-auto border-b border-slate-300 pb-1 mb-1.5" />
          <span className="font-semibold text-slate-800 block">Finance Controller</span>
          <span className="text-[10px] text-slate-400">Authorized Signatory</span>
        </div>
      </div>
    </div>
  )
}
