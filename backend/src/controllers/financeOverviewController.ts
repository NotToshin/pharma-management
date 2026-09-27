import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

// Robust multi-format date parser (handles "27 Sep 2026", "2026-09-27", "27/09/2026", ISO)
function parseRecordDate(dateStr?: string | Date | null): { month: number; year: number } | null {
  if (!dateStr) return null;
  if (dateStr instanceof Date) {
    return isNaN(dateStr.getTime()) ? null : { month: dateStr.getMonth(), year: dateStr.getFullYear() };
  }

  // Try standard parse
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return { month: parsed.getMonth(), year: parsed.getFullYear() };
  }

  // Handle DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = String(dateStr).match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmyMatch) {
    return { month: parseInt(dmyMatch[2], 10) - 1, year: parseInt(dmyMatch[3], 10) };
  }

  // Handle "DD Mon YYYY" e.g., "27 Sep 2026"
  const textMatch = String(dateStr).match(/(\w{3})\s+(\d{4})/i);
  if (textMatch) {
    const mIdx = MONTH_NAMES.findIndex(
      (m) => m.toLowerCase() === textMatch[1].slice(0, 3).toLowerCase()
    );
    if (mIdx !== -1) {
      return { month: mIdx, year: parseInt(textMatch[2], 10) };
    }
  }

  return null;
}

export const getFinancialOverview = async (req: Request, res: Response): Promise<void> => {
  try {
    const yearParam = req.query.year ? parseInt(req.query.year as string, 10) : 2026;
    const monthParam = req.query.month !== undefined ? parseInt(req.query.month as string, 10) : new Date().getMonth();

    const [orders, expenses, journalTxs] = await Promise.all([
      prisma.order.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.expenseVoucher.findMany({ orderBy: { createdAt: "desc" } }).catch(() => []),
      prisma.journalTransaction.findMany({
        include: { sourceAccount: true, destinationAccount: true },
        orderBy: { createdAt: "desc" },
      }).catch(() => []),
    ]);

    // 1. Calculate 12-month Trend
    const monthlyTrend = MONTH_NAMES.map((mName, idx) => {
      const mOrders = orders.filter((o: any) => {
        const d = parseRecordDate(o.orderDate) || parseRecordDate(o.createdAt);
        return d ? d.month === idx && d.year === yearParam : false;
      });

      const revenueBDT = mOrders.reduce((sum, o: any) => sum + Number(o.orderValue || 0), 0);
      const collectionsBDT = mOrders
        .filter((o: any) => o.status === "Delivered & Invoiced")
        .reduce((sum, o: any) => sum + Number(o.orderValue || 0), 0);

      const mExpenses = (expenses as any[]).filter((e: any) => {
        const d = parseRecordDate(e.paymentDate) || parseRecordDate(e.createdAt);
        return d ? d.month === idx && d.year === yearParam : false;
      });
      const expensesBDT = mExpenses.reduce((sum, e: any) => sum + Number(e.amount || 0), 0);

      return {
        month: mName,
        monthIndex: idx,
        year: yearParam,
        Revenue: Number((revenueBDT / 100000).toFixed(2)),       // in Lakhs
        Collections: Number((collectionsBDT / 100000).toFixed(2)),
        Expenses: Number((expensesBDT / 100000).toFixed(2)),
        rawRevenue: revenueBDT,
        rawCollections: collectionsBDT,
        rawExpenses: expensesBDT,
      };
    });

    // 2. Focused Month Data & Category Breakdown
    const focusedMonth = monthlyTrend[monthParam] || monthlyTrend[0];
    const currentEarnBDT = focusedMonth.rawRevenue;
    const currentCollectionsBDT = focusedMonth.rawCollections;
    const currentBurnBDT = focusedMonth.rawExpenses;
    const currentArBDT = Math.max(0, currentEarnBDT - currentCollectionsBDT);
    const currentNetProfitBDT = Math.max(0, currentCollectionsBDT - currentBurnBDT);

    // Categorized Month Expenses
    const activeMonthExpenses = (expenses as any[]).filter((e: any) => {
      const d = parseRecordDate(e.paymentDate) || parseRecordDate(e.createdAt);
      return d ? d.month === monthParam && d.year === yearParam : false;
    });

    let cogsAmount = 0;
    let fieldForceAmount = 0;
    let logisticsAmount = 0;

    activeMonthExpenses.forEach((e: any) => {
      const cat = String(e.category || "").toLowerCase();
      const payee = String(e.payeeName || "").toLowerCase();
      const desc = String(e.particulars || "").toLowerCase();

      if (cat.includes("procurement") || cat.includes("raw") || cat.includes("cogs") || desc.includes("api")) {
        cogsAmount += Number(e.amount || 0);
      } else if (cat.includes("field") || cat.includes("mio") || cat.includes("sampling") || payee.includes("mio")) {
        fieldForceAmount += Number(e.amount || 0);
      } else if (cat.includes("logistics") || cat.includes("courier") || cat.includes("fleet") || cat.includes("delivery")) {
        logisticsAmount += Number(e.amount || 0);
      } else {
        // Distribute general operational expenses proportionally
        fieldForceAmount += Number(e.amount || 0) * 0.6;
        logisticsAmount += Number(e.amount || 0) * 0.4;
      }
    });

    // If no explicit expense vouchers exist yet, calculate standard pharma COGS baseline
    if (activeMonthExpenses.length === 0 && currentEarnBDT > 0) {
      cogsAmount = currentEarnBDT * 0.542;
      fieldForceAmount = currentEarnBDT * 0.184;
      logisticsAmount = currentEarnBDT * 0.078;
    }

    // Dynamic Percentages relative to Earned Revenue
    const divisor = currentEarnBDT > 0 ? currentEarnBDT : 1;
    const cogsPercent = currentEarnBDT > 0 ? Math.min(100, (cogsAmount / divisor) * 100) : 0;
    const fieldForcePercent = currentEarnBDT > 0 ? Math.min(100, (fieldForceAmount / divisor) * 100) : 0;
    const logisticsPercent = currentEarnBDT > 0 ? Math.min(100, (logisticsAmount / divisor) * 100) : 0;
    const netMarginPercent = currentEarnBDT > 0 ? Math.max(0, (currentNetProfitBDT / divisor) * 100) : 0;

    // 3. Fiscal Year Totals
    const annualEarnBDT = monthlyTrend.reduce((sum, m) => sum + m.rawRevenue, 0);
    const annualCollectionsBDT = monthlyTrend.reduce((sum, m) => sum + m.rawCollections, 0);
    const annualBurnBDT = monthlyTrend.reduce((sum, m) => sum + m.rawExpenses, 0);
    const annualNetProfitBDT = Math.max(0, annualCollectionsBDT - annualBurnBDT);

    // 4. Combined Recent Transactions
    const transactions: any[] = [];

    orders.forEach((o: any) => {
      transactions.push({
        id: `ord-${o.id}`,
        trxCode: o.invoiceNumber || o.orderNumber,
        partyName: o.pharmacyName,
        type: "Pharmacy Invoice",
        territory: o.territory,
        amount: Number(o.orderValue),
        date: o.orderDate,
        status: o.status === "Delivered & Invoiced" ? "Settled" : o.status === "Pending Credit Check" ? "Pending Clearance" : "Overdue",
      });
    });

    (expenses as any[]).forEach((e: any) => {
      transactions.push({
        id: `exp-${e.id}`,
        trxCode: e.voucherNo,
        partyName: `${e.payeeName} (${e.category})`,
        type: "Field Disbursement",
        territory: e.fundingSource,
        amount: Number(e.amount),
        date: e.paymentDate,
        status: "Settled",
      });
    });

    (journalTxs as any[]).forEach((j: any) => {
      if (j.flowType === "INFLOW" || j.flowType === "LOAN") {
        transactions.push({
          id: `jrn-${j.id}`,
          trxCode: j.refCode,
          partyName: j.particulars,
          type: j.flowType === "LOAN" ? "Loan Intake" : "Wholesale Deposit",
          territory: j.destinationAccount?.accountTitle || "Corporate Bank",
          amount: Number(j.amount),
          date: j.entryDate,
          status: j.reconciliationStatus === "Reconciled" ? "Settled" : "Pending Clearance",
        });
      }
    });

    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.status(200).json({
      selectedYear: yearParam,
      selectedMonth: monthParam,
      metrics: {
        currentEarnBDT,
        currentCollectionsBDT,
        currentBurnBDT,
        currentArBDT,
        currentNetProfitBDT,
      },
      marginBreakdown: {
        cogsPercent: Number(cogsPercent.toFixed(1)),
        cogsAmount: Math.round(cogsAmount),
        fieldForcePercent: Number(fieldForcePercent.toFixed(1)),
        fieldForceAmount: Math.round(fieldForceAmount),
        logisticsPercent: Number(logisticsPercent.toFixed(1)),
        logisticsAmount: Math.round(logisticsAmount),
        netMarginPercent: Number(netMarginPercent.toFixed(1)),
        netProfitAmount: Math.round(currentNetProfitBDT),
      },
      annualMetrics: {
        annualEarnBDT,
        annualCollectionsBDT,
        annualBurnBDT,
        annualNetProfitBDT,
      },
      monthlyTrend,
      transactions,
    });
  } catch (error: any) {
    console.error("Error generating finance overview:", error);
    res.status(500).json({ error: "Failed to generate financial overview" });
  }
};