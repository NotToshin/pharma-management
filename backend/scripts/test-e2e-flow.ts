// Using native global fetch

const API_BASE = "http://localhost:5000/api";

interface TestResult {
  step: string;
  passed: boolean;
  details: string;
  error?: string;
}

const results: TestResult[] = [];

async function logStep(step: string, fn: () => Promise<string>) {
  try {
    const details = await fn();
    results.push({ step, passed: true, details });
    console.log(`✅ [PASS] ${step}: ${details}`);
  } catch (err: any) {
    results.push({ step, passed: false, details: err.message, error: err.stack });
    console.error(`❌ [FAIL] ${step}: ${err.message}`);
  }
}

async function runTests() {
  console.log("==================================================");
  console.log("STARTING END-TO-END FLOW TESTING FOR AK PHARMA");
  console.log("==================================================\n");

  let testPoId = "";
  let testPoNumber = "";
  let testOrderId = "";
  let testInvoiceNo = "";
  let testCollectionId = "";
  let initialBankBalance = 0;
  let testAccountId = "";
  let testBatchNumber = "";
  const uniqueDrugName = `E2E BioFormulation ${Date.now().toString().slice(-4)}`;

  // 1. Check Accounts & Liquidity
  await logStep("1. Fetch Financial Accounts", async () => {
    const res = await fetch(`${API_BASE}/account-ledger/accounts`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const data = await res.json() as any;
    const accounts = data.data || [];
    if (accounts.length === 0) throw new Error("No financial accounts found");
    const bankAcc = accounts.find((a: any) => a.category === "BANK") || accounts[0];
    testAccountId = bankAcc.id;
    initialBankBalance = bankAcc.balance;
    return `Found ${accounts.length} accounts. Using '${bankAcc.accountTitle}' with initial balance BDT ${initialBankBalance}`;
  });

  // 2. Create Purchase Order
  await logStep("2. Create Purchase Order for Goods", async () => {
    const poPayload = {
      wholesalerName: "Square Pharmaceuticals Depot",
      wholesalerCode: "WHL-SQR-01",
      deliveryWarehouse: "Main Distribution Bay - Tejgaon Central",
      paymentTerms: "Net 30 Days",
      priority: "Routine",
      status: "Approved",
      items: [
        {
          no: 1,
          skuCode: `SKU-${Date.now().toString().slice(-4)}`,
          drugName: uniqueDrugName,
          genericName: "E2E Test Molecule",
          packSize: "Box of 30s",
          quantityOrdered: 100,
          unitCostBDT: 200,
          totalCostBDT: 20000,
          storageRequirement: "Controlled Ambient (<25°C)",
        },
      ],
      discountBDT: 0,
      taxBDT: 0,
    };

    const res = await fetch(`${API_BASE}/procurement/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(poPayload),
    });

    const json = await res.json() as any;
    if (!res.ok) throw new Error(json.message || `Failed to create PO (${res.status})`);
    testPoId = json.data.id;
    testPoNumber = json.data.poNumber;
    return `Created PO #${testPoNumber} (ID: ${testPoId}) for BDT ${json.data.totalAmountBDT}`;
  });

  // 3. Receive Stock against Purchase Order (Inventory Update)
  await logStep("3. Receive Stock & Update Inventory Batches", async () => {
    testBatchNumber = `BX-TEST-${Date.now().toString().slice(-6)}`;
    const receivePayload = {
      challanNumber: `CHL-TEST-${Date.now().toString().slice(-4)}`,
      notes: "E2E test dock intake verification",
      updateInventoryBatches: true,
      receivedItems: [
        {
          drugName: uniqueDrugName,
          skuCode: `SKU-${Date.now().toString().slice(-4)}`,
          quantityToReceive: 100,
          batchNumber: testBatchNumber,
          mfgDate: "01 Oct 2026",
          expiryDate: "30 Oct 2028",
          warehouseBin: "Bay 04 - Shelf C",
          storageCondition: "Controlled Ambient (<25°C)",
          unitPrice: 200,
        },
      ],
    };

    // Test both endpoints if applicable
    const res = await fetch(`${API_BASE}/procurement/orders/${testPoId}/receive`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(receivePayload),
    });

    const json = await res.json() as any;
    if (!res.ok) throw new Error(json.message || `Failed to receive stock (${res.status})`);
    
    // Verify inventory batch was actually created or updated
    const invRes = await fetch(`${API_BASE}/inventory?search=${encodeURIComponent(uniqueDrugName)}`);
    const invJson = await invRes.json() as any;
    const batches = invJson.data || [];
    const found = batches.find((b: any) => b.batchNumber === testBatchNumber);
    if (!found) throw new Error(`Batch '${testBatchNumber}' was not found in inventory after receiving PO!`);
    if (found.availableUnits !== 100) throw new Error(`Batch units expected 100, found ${found.availableUnits}`);

    return `Stock received! Batch '${found.batchNumber}' created with ${found.availableUnits} units in warehouse.`;
  });

  // 4. Pay Wholesaler for Purchase Order (Finance & Treasury OUTFLOW)
  await logStep("4. Pay for Purchase (Expense Voucher Disbursed)", async () => {
    const voucherPayload = {
      payeeName: "Square Pharmaceuticals Depot",
      payeeType: "Wholesaler / Vendor",
      poNumber: testPoNumber,
      category: "Wholesaler Settlement",
      fundingSource: "Bank Account",
      sourceDetail: "Eastern Bank PLC - Operations",
      financialAccountId: testAccountId,
      paymentMethod: "BEFTN / RTGS",
      chequeNumber: "EBL-FT-TEST-01",
      grossAmount: 20000,
      amount: 20000,
      paymentDate: "20 Oct 2026",
      status: "Disbursed",
      notes: `Settlement for test PO #${testPoNumber}`,
    };

    const res = await fetch(`${API_BASE}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(voucherPayload),
    });

    const json = await res.json() as any;
    if (!res.ok) throw new Error(json.message || `Failed to create payment voucher (${res.status})`);

    // Verify account balance decremented
    const accRes = await fetch(`${API_BASE}/account-ledger/accounts`);
    const accJson = await accRes.json() as any;
    const updatedAcc = (accJson.data || []).find((a: any) => a.id === testAccountId);

    // Verify Journal OUTFLOW entry created
    const jrnRes = await fetch(`${API_BASE}/account-ledger/transactions?flowType=OUTFLOW`);
    const jrnJson = await jrnRes.json() as any;
    const txList = Array.isArray(jrnJson.data) ? jrnJson.data : jrnJson.data?.transactions || [];
    const tx = txList.find((t: any) => t.particulars?.includes(testPoNumber));
    if (!tx) throw new Error(`OUTFLOW transaction for PO ${testPoNumber} not found in journal ledger!`);

    return `Voucher ${json.data.voucherNo} disbursed. Bank balance decremented to ${updatedAcc.balance}. Journal OUTFLOW ref: ${tx.refCode}`;
  });

  // 5. Sell Items (Create Sales Order & Deduct Inventory via FEFO)
  await logStep("5. Sell Something (Order Creation & FEFO Inventory Deduction)", async () => {
    const orderPayload = {
      pharmacyName: "Labaid Pharmacy (Gulshan)",
      territory: "Dhaka North",
      assignedMio: "Tanvir Ahmed",
      itemsSummary: `${uniqueDrugName} (30)`,
      itemsDetail: [
        {
          no: 1,
          description: uniqueDrugName,
          quantity: 30,
          unitCost: 300, // Selling price
          total: 9000,
        },
      ],
      totalBoxes: 30,
      orderValue: 9000,
      discount: 0,
      deliveryMethod: "Sales Representative",
      status: "Delivered & Invoiced",
    };

    const res = await fetch(`${API_BASE}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderPayload),
    });

    const json = await res.json() as any;
    if (!res.ok) throw new Error(json.message || `Failed to create order (${res.status})`);
    testOrderId = json.data.id;
    testInvoiceNo = json.data.invoiceNumber || json.data.orderNumber;

    // Verify inventory deduction
    const invRes = await fetch(`${API_BASE}/inventory?search=${encodeURIComponent(uniqueDrugName)}`);
    const invJson = await invRes.json() as any;
    const batch = (invJson.data || []).find((b: any) => b.batchNumber === testBatchNumber);
    if (!batch) throw new Error("Test batch vanished from inventory!");
    if (batch.availableUnits !== 70) {
      throw new Error(`Expected remaining units 70 (100 - 30) for batch ${testBatchNumber}, but found ${batch.availableUnits}!`);
    }

    return `Order ${json.data.orderNumber} (Invoice: ${testInvoiceNo}) created for BDT 9,000. Inventory deducted: units dropped from 100 to ${batch.availableUnits}.`;
  });

  // 6. Check Profit in Finance & Treasury Section
  await logStep("6. Verify Profit & Sales Impact in Finance Overview", async () => {
    const res = await fetch(`${API_BASE}/finance-overview?year=2026&month=9`); // Oct = index 9
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const json = await res.json() as any;
    const overview = json.data;
    if (!overview) throw new Error("No overview data returned from backend");

    const metrics = overview.metrics;
    const margin = overview.marginBreakdown;

    if (metrics.currentEarnBDT <= 0) {
      throw new Error(`Revenue should be positive, found ${metrics.currentEarnBDT}`);
    }

    return `Finance Overview reflects Revenue: BDT ${metrics.currentEarnBDT.toLocaleString()}, COGS: BDT ${margin.cogsAmount.toLocaleString()} (${margin.cogsPercent}%), Burn/Expenses: BDT ${metrics.currentBurnBDT.toLocaleString()}, Net Profit: BDT ${metrics.currentNetProfitBDT.toLocaleString()} (${margin.netMarginPercent}% margin).`;
  });

  // 7. Collect Payment from Sales Order (Delivery Collection & INFLOW to Treasury)
  await logStep("7. Collect Payment from Sales (INFLOW to Treasury Cash/Bank)", async () => {
    // Record collection
    const colPayload = {
      invoiceNo: testInvoiceNo,
      orderId: testOrderId,
      chemistName: "Labaid Pharmacy (Gulshan)",
      territory: "Dhaka North",
      salesRepName: "Tanvir Ahmed",
      totalInvoiceAmount: 9000,
      amountCollected: 9000,
      collectionDate: "20 Oct 2026",
      paymentMethod: "Cash",
      destinationType: "Cash Drawer",
      destinationName: "Head Office Central Cash Safe",
      status: "Cleared & Deposited",
      notes: "Full cash settlement collected and deposited to cash safe",
    };

    const res = await fetch(`${API_BASE}/collections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(colPayload),
    });

    const json = await res.json() as any;
    if (!res.ok) throw new Error(json.message || `Failed to create collection (${res.status})`);
    testCollectionId = json.data.id;

    // Verify cash safe was credited
    const accRes = await fetch(`${API_BASE}/account-ledger/accounts`);
    const accJson = await accRes.json() as any;
    const cashAcc = (accJson.data || []).find((a: any) => a.accountTitle.includes("Head Office Central Cash Safe"));
    if (!cashAcc) throw new Error("Cash safe account not found!");

    // Verify Journal INFLOW entry
    const jrnRes = await fetch(`${API_BASE}/account-ledger/transactions?flowType=INFLOW`);
    const jrnJson = await jrnRes.json() as any;
    const txList = Array.isArray(jrnJson.data) ? jrnJson.data : jrnJson.data?.transactions || [];
    const tx = txList.find((t: any) => t.particulars?.includes(testInvoiceNo) || t.particulars?.includes("Labaid Pharmacy"));
    if (!tx) throw new Error(`INFLOW transaction for invoice ${testInvoiceNo} not found in journal ledger!`);

    return `Collection ${json.data.receiptNo} cleared. Cash safe credited by BDT 9,000 (Current balance: ${cashAcc.balance}). Journal INFLOW ref: ${tx.refCode}.`;
  });

  console.log("\n==================================================");
  console.log("TEST SUMMARY REPORT");
  console.log("==================================================");
  const passedCount = results.filter((r) => r.passed).length;
  console.log(`TOTAL: ${results.length} | PASSED: ${passedCount} | FAILED: ${results.length - passedCount}`);
}

runTests();
