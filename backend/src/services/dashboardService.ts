import prisma from "../utils/prisma";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function calculateDaysToExpiry(expiryDateStr: string): number {
  const parsedTime = Date.parse(expiryDateStr);
  const targetDate = isNaN(parsedTime) ? new Date(2027, 11, 31).getTime() : parsedTime;
  const diffTime = targetDate - Date.now();
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
}

export const dashboardService = {
  async getDashboardTelemetry() {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    const [orders, batches, accounts, doctors, expenses, staffCount, adjustments] = await Promise.all([
      prisma.order.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.inventoryBatch.findMany({ orderBy: { expiryDate: "asc" } }).catch(() => []),
      prisma.financialAccount.findMany({ orderBy: { balance: "desc" } }).catch(() => []),
      prisma.doctor.findMany({ take: 5, orderBy: { createdAt: "desc" } }).catch(() => []),
      prisma.expenseVoucher.findMany({ orderBy: { createdAt: "desc" } }).catch(() => []),
      prisma.staff.count().catch(() => 0),
      prisma.stockAdjustment.findMany({ orderBy: { createdAt: "desc" } }).catch(() => []),
    ]);

    const stockAdjustmentsNetImpact = (adjustments as any[]).reduce((sum, a) => sum + Number(a.totalImpactBDT || 0), 0);
    const stockWriteOffCount = (adjustments as any[]).filter((a) => (a.type || "").toLowerCase().includes("write-off")).length;

    const grossTurnover = orders.reduce((sum, o) => sum + Number(o.orderValue || 0), 0);
    const realizedCash = orders
      .filter((o) => o.status === "Delivered & Invoiced")
      .reduce((sum, o) => sum + Number(o.orderValue || 0), 0);
    const recoveryRate = grossTurnover > 0 ? ((realizedCash / grossTurnover) * 100).toFixed(1) : "0.0";

    const recentMonthIndices: number[] = [];
    for (let i = 4; i >= 0; i--) {
      let m = currentMonth - i;
      if (m < 0) m += 12;
      recentMonthIndices.push(m);
    }

    const monthlyRunRate = recentMonthIndices.map((mIdx) => {
      const mOrders = orders.filter((o) => {
        const d = new Date(o.orderDate || o.createdAt);
        return !isNaN(d.getTime()) ? d.getMonth() === mIdx : false;
      });
      const mRevenue = mOrders.reduce((sum, o) => sum + Number(o.orderValue || 0), 0);
      const mCollections = mOrders
        .filter((o) => o.status === "Delivered & Invoiced")
        .reduce((sum, o) => sum + Number(o.orderValue || 0), 0);

      const mExpenses = (expenses as any[]).filter((e) => {
        const d = new Date(e.paymentDate || e.createdAt);
        return !isNaN(d.getTime()) ? d.getMonth() === mIdx : false;
      });
      const mBurn = mExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

      return {
        month: MONTH_NAMES[mIdx],
        Revenue: Number((mRevenue / 100000).toFixed(2)),
        Collections: Number((mCollections / 100000).toFixed(2)),
        Burn: Number((mBurn / 100000).toFixed(2)),
      };
    });

    let totalStockValuation = 0;
    let expiryExposureValue = 0;
    let criticalBatchCount = 0;

    const analyzedBatches = (batches as any[]).map((b) => {
      const days = calculateDaysToExpiry(b.expiryDate);
      const valuation = Number(b.availableUnits || 0) * Number(b.unitPrice || 0);
      totalStockValuation += valuation;

      if (days <= 90) {
        expiryExposureValue += valuation;
        criticalBatchCount++;
      }

      return {
        ...b,
        daysToExpiry: days,
        valuation,
        fefoStatus: days <= 60 ? "Near Expiry" : days <= 180 ? "Priority Out" : "Healthy",
      };
    });

    analyzedBatches.sort((a, b) => a.daysToExpiry - b.daysToExpiry);
    const criticalSurveillance = analyzedBatches.slice(0, 4);

    const categoryTotals: Record<string, number> = {};
    (batches as any[]).forEach((b) => {
      const cat = b.category || "General Formulations";
      const val = Number(b.availableUnits || 0) * Number(b.unitPrice || 0);
      categoryTotals[cat] = (categoryTotals[cat] || 0) + val;
    });

    const categorySalesShare = Object.entries(categoryTotals)
      .map(([category, val]) => ({
        category,
        share: totalStockValuation > 0 ? Math.round((val / totalStockValuation) * 100) : 0,
        value: `৳${(val / 100000).toFixed(1)}L`,
      }))
      .sort((a, b) => b.share - a.share)
      .slice(0, 5);

    const liquidBalance = (accounts as any[]).reduce((sum, a) => sum + Number(a.balance || 0), 0);

    const logisticsStream = orders.slice(0, 4).map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      invoiceNumber: o.invoiceNumber,
      challanNumber: o.challanNumber || `DC-${o.orderNumber.replace(/\D/g, "")}`,
      pharmacyName: o.pharmacyName,
      status: o.status,
      totalBoxes: o.totalBoxes,
      orderValue: Number(o.orderValue),
      deliveryMethod: o.deliveryMethod,
    }));

    const keyOpinionLeaders = (doctors as any[]).map((doc, idx) => ({
      id: doc.id,
      name: doc.name || doc.doctorName || "Dr. Assigned Specialist",
      tier: idx < 2 ? "Tier A+" : "Tier A",
      specialty: doc.specialization || doc.degrees || "Specialist Physician",
      chamber: doc.chamber || doc.institution || "Dhaka Medical Hub",
      estimatedPrescriptionYield: Number(doc.monthlyPrescriptionYield || 150000),
      adherence: Number(doc.complianceRate || 92) - idx * 3,
    }));

    return {
      kpis: {
        grossTurnover,
        realizedCash,
        recoveryRate,
        expiryExposureValue,
        criticalBatchCount,
        liquidBalance,
        totalStockValuation,
        reconciledAccountsCount: accounts.length,
        staffCount,
        stockAdjustmentsCount: (adjustments as any[]).length,
        stockAdjustmentsNetImpact,
        stockWriteOffCount,
      },
      stockAdjustmentsSummary: {
        totalCount: (adjustments as any[]).length,
        netImpactBDT: stockAdjustmentsNetImpact,
        writeOffCount: stockWriteOffCount,
        recent: (adjustments as any[]).slice(0, 5),
      },
      monthlyRunRate,
      categorySalesShare,
      criticalSurveillance,
      logisticsStream,
      accountsList: accounts.slice(0, 5),
      keyOpinionLeaders,
    };
  },
};