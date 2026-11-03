import prisma from "../utils/prisma";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

function parseRecordDate(dateVal?: string | Date | null): { month: number; year: number } | null {
  if (!dateVal) return null;
  if (dateVal instanceof Date) {
    return isNaN(dateVal.getTime()) ? null : { month: dateVal.getMonth(), year: dateVal.getFullYear() };
  }

  const str = String(dateVal).trim();

  // 1. Check DD/MM/YYYY or DD-MM-YYYY first to avoid browser US MM/DD/YYYY mismatch
  const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmyMatch) {
    return { month: parseInt(dmyMatch[2], 10) - 1, year: parseInt(dmyMatch[3], 10) };
  }

  // 2. Check month name substring like "20 Oct 2026"
  for (let i = 0; i < MONTH_NAMES.length; i++) {
    const mPrefix = MONTH_NAMES[i].toLowerCase();
    if (str.toLowerCase().includes(mPrefix)) {
      const yearMatch = str.match(/\b(202\d)\b/);
      const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();
      return { month: i, year };
    }
  }

  // 3. Fallback standard Date parse
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return { month: parsed.getMonth(), year: parsed.getFullYear() };
  }

  return null;
}

interface OverviewParams {
  year?: string | number;
  month?: string | number;
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
  searchTerm?: string;
  type?: string;
}

export const financeOverviewService = {
  async getFinancialOverview(params: OverviewParams = {}) {
    const yearParam = params.year !== undefined ? parseInt(String(params.year), 10) || new Date().getFullYear() : new Date().getFullYear();
    const monthParam = params.month !== undefined ? parseInt(String(params.month), 10) : new Date().getMonth();

    const [orders, expenses, batches, journalTxs, collections] = await Promise.all([
      prisma.order.findMany({ where: { status: { not: "Cancelled" } }, orderBy: { createdAt: "desc" } }),
      prisma.expenseVoucher.findMany({ orderBy: { createdAt: "desc" } }).catch(() => []),
      prisma.inventoryBatch.findMany().catch(() => []),
      prisma.journalTransaction.findMany({
        include: { sourceAccount: true, destinationAccount: true },
        orderBy: { createdAt: "desc" },
      }).catch(() => []),
      prisma.deliveryCollection.findMany({ orderBy: { createdAt: "desc" } }).catch(() => []),
    ]);

    const batchCostMap = new Map<string, number>();
    batches.forEach((b) => {
      const brand = (b.brandName || "").trim().toLowerCase();
      if (brand) batchCostMap.set(brand, Number(b.unitPrice) || 0);
    });

    const monthlyTrend = MONTH_NAMES.map((mName, idx) => {
      const mOrders = orders.filter((o: any) => {
        const d = parseRecordDate(o.orderDate) || parseRecordDate(o.createdAt);
        return d ? d.month === idx && d.year === yearParam : false;
      });

      const revenueBDT = mOrders.reduce((sum, o: any) => sum + Number(o.orderValue || 0), 0);
      
      const mCollections = (collections as any[]).filter((c: any) => {
        if (c.status !== "Cleared & Deposited") return false;
        const d = parseRecordDate(c.collectionDate) || parseRecordDate(c.createdAt);
        return d ? d.month === idx && d.year === yearParam : false;
      });
      const directCollectionsBDT = mCollections.reduce((sum, c: any) => sum + Number(c.amountCollected || 0), 0);
      const orderCollectionsBDT = mOrders
        .filter((o: any) => o.status === "Delivered & Invoiced" || o.status === "Settled")
        .reduce((sum, o: any) => sum + Number(o.orderValue || 0), 0);
      const collectionsBDT = Math.max(orderCollectionsBDT, directCollectionsBDT);

      const mExpenses = (expenses as any[]).filter((e: any) => {
        const d = parseRecordDate(e.paymentDate) || parseRecordDate(e.createdAt);
        return d ? d.month === idx && d.year === yearParam : false;
      });
      const expensesBDT = mExpenses.reduce((sum, e: any) => sum + Number(e.amount || 0), 0);

      return {
        month: mName,
        monthIndex: idx,
        year: yearParam,
        Revenue: Number((revenueBDT / 100000).toFixed(2)),
        Collections: Number((collectionsBDT / 100000).toFixed(2)),
        Expenses: Number((expensesBDT / 100000).toFixed(2)),
        rawRevenue: revenueBDT,
        rawCollections: collectionsBDT,
        rawExpenses: expensesBDT,
      };
    });

    const focusedMonth = monthlyTrend[monthParam] || monthlyTrend[0];
    const activeOrders = orders.filter((o: any) => {
      const d = parseRecordDate(o.orderDate) || parseRecordDate(o.createdAt);
      return d ? d.month === monthParam && d.year === yearParam : false;
    });

    const evaluatedOrders = activeOrders.length > 0 ? activeOrders : orders;

    const currentEarnBDT = focusedMonth.rawRevenue > 0
      ? focusedMonth.rawRevenue
      : evaluatedOrders.reduce((sum, o: any) => sum + Number(o.orderValue || 0), 0);

    const currentCollectionsBDT = focusedMonth.rawCollections > 0
      ? focusedMonth.rawCollections
      : evaluatedOrders
          .filter((o: any) => o.status === "Delivered & Invoiced" || o.status === "Settled")
          .reduce((sum, o: any) => sum + Number(o.orderValue || 0), 0);

    const activeMonthExpenses = (expenses as any[]).filter((e: any) => {
      const d = parseRecordDate(e.paymentDate) || parseRecordDate(e.createdAt);
      return d ? d.month === monthParam && d.year === yearParam : false;
    });

    const currentBurnBDT = activeMonthExpenses.length > 0
      ? activeMonthExpenses.reduce((sum, e: any) => sum + Number(e.amount || 0), 0)
      : (expenses as any[]).reduce((sum, e: any) => sum + Number(e.amount || 0), 0);

    let dynamicCogs = 0;
    evaluatedOrders.forEach((o: any) => {
      let items: any[] = [];
      if (Array.isArray(o.itemsDetail)) items = o.itemsDetail;
      else if (typeof o.itemsDetail === "string") {
        try { items = JSON.parse(o.itemsDetail); } catch { items = []; }
      }

      if (items.length > 0) {
        items.forEach((item: any) => {
          const name = (item.description || "").trim().toLowerCase();
          const qty = Number(item.quantity) || 1;
          const cost = batchCostMap.get(name) || Number(item.unitCost) || 0;
          dynamicCogs += qty * cost;
        });
      } else {
        dynamicCogs += Math.round(Number(o.orderValue || 0) * 0.50);
      }
    });

    if (dynamicCogs >= currentEarnBDT && currentEarnBDT > 0) {
      dynamicCogs = Math.round(currentEarnBDT * 0.50);
    }

    const tadaBurn = currentBurnBDT;
    const profitAmount = Math.max(0, currentEarnBDT - dynamicCogs - tadaBurn);
    const cogsPercent = currentEarnBDT > 0 ? Number(((dynamicCogs / currentEarnBDT) * 100).toFixed(1)) : 0;
    const tadaPercent = currentEarnBDT > 0 ? Number(((tadaBurn / currentEarnBDT) * 100).toFixed(1)) : 0;
    const netMarginPercent = currentEarnBDT > 0 ? Number(((profitAmount / currentEarnBDT) * 100).toFixed(1)) : 0;

    const currentArBDT = Math.max(0, currentEarnBDT - currentCollectionsBDT);

    const annualEarnBDT = monthlyTrend.reduce((sum, m) => sum + m.rawRevenue, 0) || currentEarnBDT;
    const annualCollectionsBDT = monthlyTrend.reduce((sum, m) => sum + m.rawCollections, 0) || currentCollectionsBDT;
    const annualBurnBDT = monthlyTrend.reduce((sum, m) => sum + m.rawExpenses, 0) || tadaBurn;
    const annualNetProfitBDT = Math.max(0, annualCollectionsBDT - annualBurnBDT);

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
        status: o.status === "Delivered & Invoiced" || o.status === "Settled" ? "Settled" : "Pending Clearance",
      });
    });

    (expenses as any[]).forEach((e: any) => {
      transactions.push({
        id: `exp-${e.id}`,
        trxCode: e.voucherNo,
        partyName: `${e.payeeName} (${e.category})`,
        type: e.category?.includes("Wholesaler") ? "Wholesaler Settlement" : "Expense Disbursement",
        territory: e.sourceDetail || e.fundingSource || "Field Force",
        amount: Number(e.amount),
        date: e.paymentDate,
        status: "Settled",
      });
    });

    (collections as any[]).forEach((c: any) => {
      transactions.push({
        id: `col-${c.id}`,
        trxCode: c.receiptNo,
        partyName: `${c.chemistName} (${c.paymentMethod})`,
        type: "Sales Collection Deposit",
        territory: c.destinationName || c.territory || "Cash Safe",
        amount: Number(c.amountCollected),
        date: c.collectionDate,
        status: c.status === "Cleared & Deposited" ? "Settled" : "Pending Clearance",
      });
    });

    transactions.sort((a, b) => {
      const timeA = new Date(a.date).getTime() || 0;
      const timeB = new Date(b.date).getTime() || 0;
      return timeB - timeA;
    });

    // Server-side search / filter / sort / pagination for the transactions ledger
    const searchTerm = (params.search || params.searchTerm || "").trim().toLowerCase();
    const typeFilter = params.type && params.type !== "all" ? params.type : undefined;

    let listedTransactions = transactions.filter((t) => {
      if (typeFilter && t.type !== typeFilter) return false;
      if (searchTerm) {
        const haystack = `${t.trxCode || ""} ${t.partyName || ""} ${t.type || ""} ${t.territory || ""}`.toLowerCase();
        if (!haystack.includes(searchTerm)) return false;
      }
      return true;
    });

    const allowedSortFields = ["date", "amount", "trxCode", "partyName", "type", "status"];
    const sortBy = allowedSortFields.includes(params.sortBy || "") ? params.sortBy : "date";
    const sortOrder = params.sortOrder === "asc" ? 1 : -1;
    const timeOf = (val: string) => new Date(val).getTime() || 0;

    listedTransactions = [...listedTransactions].sort((a, b) => {
      let cmp = 0;
      if (sortBy === "date") cmp = timeOf(a.date) - timeOf(b.date);
      else if (sortBy === "amount") cmp = Number(a.amount) - Number(b.amount);
      else cmp = String(a[sortBy as keyof typeof a]).localeCompare(String(b[sortBy as keyof typeof b]));
      if (cmp === 0) cmp = timeOf(a.date) - timeOf(b.date);
      return cmp * sortOrder;
    });

    const page = Math.max(1, parseInt(params.page || "1", 10) || 1);
    const fetchAll = !params.limit || params.limit === "all" || params.limit === "-1";
    const limit = fetchAll ? 0 : Math.max(1, parseInt(params.limit || "10", 10) || 10);
    const skip = limit > 0 ? (page - 1) * limit : 0;
    const pagedTransactions = limit > 0 ? listedTransactions.slice(skip, skip + limit) : listedTransactions;

    const transactionsMeta = {
      total: listedTransactions.length,
      page,
      limit: limit > 0 ? limit : listedTransactions.length,
      totalPage: limit > 0 ? Math.ceil(listedTransactions.length / limit) || 1 : 1,
      totalPages: limit > 0 ? Math.ceil(listedTransactions.length / limit) || 1 : 1,
    };

    return {
      selectedYear: yearParam,
      selectedMonth: monthParam,
      metrics: {
        currentEarnBDT,
        currentCollectionsBDT,
        currentBurnBDT: tadaBurn,
        currentArBDT,
        currentNetProfitBDT: profitAmount,
      },
      marginBreakdown: {
        cogsPercent,
        cogsAmount: Math.round(dynamicCogs),
        tadaPercent,
        tadaAmount: Math.round(tadaBurn),
        netMarginPercent,
        profitAmount: Math.round(profitAmount),
      },
      annualMetrics: {
        annualEarnBDT,
        annualCollectionsBDT,
        annualBurnBDT,
        annualNetProfitBDT,
      },
      monthlyTrend,
      transactions: pagedTransactions,
      transactionsMeta,
    };
  },
};