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
    <div className="w-full bg-white text-black font-sans text-xs selection:bg-none print:p-0">
      {/* 1. Header: Logo (left) + Solid Black Title Box (right) */}
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

        {/* SALARY PAYSLIP Box */}
        <div className="bg-black text-white px-8 py-3.5 flex items-center justify-center min-w-[210px] h-[68px]">
          <span className="text-2xl font-extrabold tracking-[0.2em] text-white uppercase font-sans select-none whitespace-nowrap">
            SALARY PAYSLIP
          </span>
        </div>
      </div>

      {/* 2. Side-by-Side Dual Boxes: Employee Details (Left) vs Payslip Details (Right) */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        {/* Left Box: EMPLOYEE DETAILS */}
        <div className="border border-black">
          <div className="bg-black text-white font-bold text-xs px-2.5 py-1 tracking-wider uppercase">
            EMPLOYEE DETAILS:
          </div>
          <div className="p-2.5 text-xs text-black space-y-1">
            <p>
              <span className="font-normal">Employee Name: </span>
              <span className="font-semibold">{record.fullName}</span>
            </p>
            <p>
              <span className="font-normal">Employee ID: </span>
              <span className="font-semibold font-mono">{record.empId}</span>
            </p>
            <p>
              <span className="font-normal">Designation: </span>
              <span className="font-semibold">{record.designation}</span>
            </p>
            <p>
              <span className="font-normal">Department: </span>
              <span className="font-semibold">{record.department}</span>
            </p>
            <p>
              <span className="font-normal">Territory / Location: </span>
              <span className="font-semibold">{record.territory || "Head Office / Central"}</span>
            </p>
          </div>
        </div>

        {/* Right Box: PAYSLIP REF */}
        <div className="border border-black">
          <div className="bg-black text-white font-bold text-xs px-2.5 py-1 tracking-wider uppercase">
            REF: AKP/{record.empId || "EMP"}/SAL
          </div>
          <div className="p-2.5 text-xs text-black space-y-1">
            <p>
              <span className="font-normal">Pay Period: </span>
              <span className="font-semibold">{record.payPeriod}</span>
            </p>
            <p>
              <span className="font-normal">Bank Name: </span>
              <span className="font-semibold">{record.bankName || "Dutch-Bangla Bank PLC"}</span>
            </p>
            <p>
              <span className="font-normal">Bank Account: </span>
              <span className="font-semibold font-mono">{record.bankAccount || "Direct Payroll Transfer"}</span>
            </p>
            <p>
              <span className="font-normal">Status: </span>
              <span className="font-semibold">{record.status}</span>
            </p>
            <p>
              <span className="font-normal">Recorded Leaves: </span>
              <span className="font-semibold">{record.leaveDays || 0} Day(s)</span>
            </p>
          </div>
        </div>
      </div>

      {/* 3. Earnings & Deductions Table */}
      <table className="w-full border-collapse border border-black mt-6 text-xs text-black">
        <thead className="bg-black text-white font-bold text-xs uppercase">
          <tr>
            <th className="w-10 py-1.5 px-2 text-center border-r border-neutral-700">SL</th>
            <th className="py-1.5 px-3 text-left border-r border-neutral-700">Earnings Particulars</th>
            <th className="w-32 py-1.5 px-3 text-right border-r border-neutral-700">Amount</th>
            <th className="py-1.5 px-3 text-left border-r border-neutral-700">Deductions & Withholdings</th>
            <th className="w-32 py-1.5 px-3 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-black h-7">
            <td className="py-1 px-2 text-center border-r border-black font-mono">1</td>
            <td className="py-1 px-3 text-left border-r border-black font-medium">Basic Salary</td>
            <td className="py-1 px-3 text-right border-r border-black font-mono">
              ৳{(record.basicSalary || 0).toLocaleString("en-IN")}
            </td>
            <td className="py-1 px-3 text-left border-r border-black font-medium">Provident Fund (PF)</td>
            <td className="py-1 px-3 text-right font-mono">
              ৳{(record.providentFund || 0).toLocaleString("en-IN")}
            </td>
          </tr>
          <tr className="border-b border-black h-7">
            <td className="py-1 px-2 text-center border-r border-black font-mono">2</td>
            <td className="py-1 px-3 text-left border-r border-black font-medium">House Rent Allowance (50%)</td>
            <td className="py-1 px-3 text-right border-r border-black font-mono">
              ৳{(record.houseRent || 0).toLocaleString("en-IN")}
            </td>
            <td className="py-1 px-3 text-left border-r border-black font-medium">Income Tax Withholding</td>
            <td className="py-1 px-3 text-right font-mono">
              ৳{(record.taxDeduction || 0).toLocaleString("en-IN")}
            </td>
          </tr>
          <tr className="border-b border-black h-7">
            <td className="py-1 px-2 text-center border-r border-black font-mono">3</td>
            <td className="py-1 px-3 text-left border-r border-black font-medium">Medical Allowance</td>
            <td className="py-1 px-3 text-right border-r border-black font-mono">
              ৳{(record.medicalAllowance || 0).toLocaleString("en-IN")}
            </td>
            <td className="py-1 px-3 text-left border-r border-black font-medium">Other Deductions / Advance</td>
            <td className="py-1 px-3 text-right font-mono">
              ৳{(record.otherDeductions || 0).toLocaleString("en-IN")}
            </td>
          </tr>
          <tr className="border-b border-black h-7">
            <td className="py-1 px-2 text-center border-r border-black font-mono">4</td>
            <td className="py-1 px-3 text-left border-r border-black font-medium">Conveyance / TA-DA</td>
            <td className="py-1 px-3 text-right border-r border-black font-mono">
              ৳{(record.conveyanceTaDa || 0).toLocaleString("en-IN")}
            </td>
            <td className="py-1 px-3 text-left border-r border-black text-neutral-400 italic">Nil</td>
            <td className="py-1 px-3 text-right font-mono text-neutral-400">৳0</td>
          </tr>
          {(record.salesIncentive > 0 || record.specialBonus > 0) && (
            <>
              {record.salesIncentive > 0 && (
                <tr className="border-b border-black h-7">
                  <td className="py-1 px-2 text-center border-r border-black font-mono">5</td>
                  <td className="py-1 px-3 text-left border-r border-black font-medium">Field Sales Incentive</td>
                  <td className="py-1 px-3 text-right border-r border-black font-mono font-medium">
                    ৳{record.salesIncentive.toLocaleString("en-IN")}
                  </td>
                  <td className="py-1 px-3 text-left border-r border-black text-neutral-400 italic">Nil</td>
                  <td className="py-1 px-3 text-right font-mono text-neutral-400">৳0</td>
                </tr>
              )}
              {record.specialBonus > 0 && (
                <tr className="border-b border-black h-7">
                  <td className="py-1 px-2 text-center border-r border-black font-mono">
                    {record.salesIncentive > 0 ? 6 : 5}
                  </td>
                  <td className="py-1 px-3 text-left border-r border-black font-medium">Special Festival / Performance Bonus</td>
                  <td className="py-1 px-3 text-right border-r border-black font-mono font-medium">
                    ৳{record.specialBonus.toLocaleString("en-IN")}
                  </td>
                  <td className="py-1 px-3 text-left border-r border-black text-neutral-400 italic">Nil</td>
                  <td className="py-1 px-3 text-right font-mono text-neutral-400">৳0</td>
                </tr>
              )}
            </>
          )}
          <tr className="border-b border-black font-semibold bg-neutral-50 h-8">
            <td colSpan={2} className="py-1 px-3 text-right border-r border-black uppercase text-[11px]">
              Gross Remuneration :
            </td>
            <td className="py-1 px-3 text-right border-r border-black font-mono text-xs">
              ৳{gross.toLocaleString("en-IN")}
            </td>
            <td className="py-1 px-3 text-right border-r border-black uppercase text-[11px]">
              Total Deductions :
            </td>
            <td className="py-1 px-3 text-right font-mono text-xs">
              ৳{deductions.toLocaleString("en-IN")}
            </td>
          </tr>
        </tbody>
      </table>

      {/* 4. Financial Summary: Amount in Words (Left) & Net Pay Breakdown (Right) */}
      <div className="flex items-stretch border border-black border-t-0">
        {/* Left: Amount in Words */}
        <div className="flex-1 p-3 flex flex-col justify-between">
          <div className="text-xs text-black">
            <span className="font-semibold">Net Amount in Words: </span>
            <span className="font-medium underline decoration-black decoration-1 underline-offset-4">
              {numberToWordsBDT(net)}
            </span>
          </div>
          <div className="text-[11px] text-neutral-600 mt-2">
            Disbursement Mode: Direct Bank Credit / Account Payee Cheque
          </div>
        </div>

        {/* Right: Net Remuneration Box */}
        <div className="w-80 border-l border-black">
          <div className="flex border-b border-black text-xs">
            <div className="w-36 bg-black text-white font-bold py-1.5 px-3 flex items-center">
              GROSS PAY :
            </div>
            <div className="flex-1 py-1.5 px-3 text-right font-mono font-semibold text-black">
              ৳{gross.toLocaleString("en-IN")}
            </div>
          </div>
          <div className="flex border-b border-black text-xs">
            <div className="w-36 bg-black text-white font-bold py-1.5 px-3 flex items-center">
              TOTAL DED. :
            </div>
            <div className="flex-1 py-1.5 px-3 text-right font-mono font-semibold text-black">
              - ৳{deductions.toLocaleString("en-IN")}
            </div>
          </div>
          <div className="flex text-xs">
            <div className="w-36 bg-black text-white font-bold py-1.5 px-3 flex items-center">
              NET REMUNERATION:
            </div>
            <div className="flex-1 py-1.5 px-3 text-right font-mono font-bold text-sm text-black">
              ৳{net.toLocaleString("en-IN")}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Policy & Verification Note */}
      <div className="mt-6 border border-black">
        <div className="bg-black text-white font-bold text-xs px-2.5 py-1 tracking-wider uppercase">
          PAYROLL ADVICE & CONFIDENTIALITY:
        </div>
        <div className="p-3 text-xs text-black space-y-1">
          <p>
            1. This document is a computer-generated official pay advice issued by AK Pharma Bangladesh.
          </p>
          <p>
            2. Remuneration has been credited directly to the employee's registered salary bank account.
          </p>
          <p>
            3. Compensation details are strictly private and confidential between the employee and AK Pharma.
          </p>
        </div>
      </div>

      {/* 6. Signatures */}
      <div className="mt-14 pb-4 grid grid-cols-3 gap-8 text-center text-xs text-black">
        <div>
          <div className="w-40 mx-auto border-t border-black mb-1.5" />
          <span className="font-semibold text-black">Employee Signature</span>
        </div>
        <div>
          <div className="w-40 mx-auto border-t border-black mb-1.5" />
          <span className="font-semibold text-black">HR & Admin Officer</span>
        </div>
        <div>
          <div className="w-40 mx-auto border-t border-black mb-1.5" />
          <span className="font-semibold text-black">Authorized Signatory</span>
        </div>
      </div>
    </div>
  )
}
