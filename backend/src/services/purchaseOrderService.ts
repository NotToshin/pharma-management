import prisma from "../utils/prisma";
import { AppError } from "../errors";
import {
  CreatePurchaseOrderInput,
  UpdatePurchaseOrderInput,
  ReceiveStockInput,
  CreateWholesalerInput,
  UpdateWholesalerInput,
} from "../validations/purchaseOrderValidation";
import { auditLogService } from "./auditLogService";

function formatCurrentDate(d: Date = new Date()): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

const INITIAL_WHOLESALERS = [
  {
    wholesalerCode: "WHL-SQR-01",
    name: "Square Pharmaceuticals Depot",
    contactPerson: "Kazi Rafiqul Islam (Depot Manager)",
    phone: "+880 1711-234567",
    email: "depot.dhaka@squarepharma.com.bd",
    drugLicenseNo: "DA-DL-2022-8921",
    tradeLicense: "TRAD-DNCC-049182",
    address: "Tejgaon Industrial Area, Plot 48, Dhaka 1208",
    territory: "Dhaka Central",
    paymentTerms: "Net 30 Days",
    rating: 4.9,
    status: "Active",
    leadTimeDays: 2,
    suppliedCategories: ["Antibiotic", "Analgesic / Antipyretic", "Cardiovascular", "Respiratory"],
  },
  {
    wholesalerCode: "WHL-BEX-02",
    name: "Beximco Pharma Distribution",
    contactPerson: "Dr. Farhana Siddique (Distribution Lead)",
    phone: "+880 1819-876543",
    email: "procure@beximcopharma.com",
    drugLicenseNo: "DA-DL-2021-4412",
    tradeLicense: "TRAD-DSCC-109283",
    address: "Tongi Industrial Area, Gazipur, Dhaka Division",
    territory: "Dhaka North",
    paymentTerms: "Net 15 Days",
    rating: 4.8,
    status: "Active",
    leadTimeDays: 3,
    suppliedCategories: ["Antibiotic", "Gastrointestinal", "Cold Chain Vaccines", "Hormonal"],
  },
  {
    wholesalerCode: "WHL-INC-03",
    name: "Incepta Wholesalers Ltd",
    contactPerson: "Enamul Kabir (Senior Supply Officer)",
    phone: "+880 1912-345678",
    email: "logistics@inceptapharma.com",
    drugLicenseNo: "DA-DL-2023-7729",
    tradeLicense: "TRAD-DNCC-882312",
    address: "Dewan Idris Road, Zirabo, Savar, Dhaka",
    territory: "Dhaka Suburb",
    paymentTerms: "Net 30 Days",
    rating: 4.9,
    status: "Active",
    leadTimeDays: 2,
    suppliedCategories: ["Cardiovascular", "Diabetic Care", "Cold Chain (2-8°C)", "Critical Care"],
  },
  {
    wholesalerCode: "WHL-REN-04",
    name: "Renata Central Depot",
    contactPerson: "Tariq Mahmud (Supply Chain Director)",
    phone: "+880 1611-998877",
    email: "orders@renata-ltd.com",
    drugLicenseNo: "DA-DL-2020-1109",
    tradeLicense: "TRAD-DSCC-332119",
    address: "Plot 1, Milk Vita Road, Section 7, Mirpur, Dhaka 1216",
    territory: "Dhaka West",
    paymentTerms: "Net 30 Days",
    rating: 4.7,
    status: "Active",
    leadTimeDays: 2,
    suppliedCategories: ["Gastrointestinal", "Analgesic / Antipyretic", "Nutraceuticals"],
  },
  {
    wholesalerCode: "WHL-ACI-05",
    name: "ACI Healthcare Logistics",
    contactPerson: "Shamsun Nahar (Depot Supervisor)",
    phone: "+880 1713-445566",
    email: "pharma.sales@aci-bd.com",
    drugLicenseNo: "DA-DL-2022-9981",
    tradeLicense: "TRAD-DNCC-771190",
    address: "245 Tejgaon Industrial Area, Dhaka 1208",
    territory: "Dhaka Central",
    paymentTerms: "Immediate / COD",
    rating: 4.6,
    status: "Active",
    leadTimeDays: 1,
    suppliedCategories: ["Antiseptic & Disinfectant", "Antibiotic", "Dermatological"],
  },
];

const INITIAL_PURCHASE_ORDERS = [
  {
    poNumber: "PO-2026-0041",
    poDate: "14 Oct 2026",
    expectedDeliveryDate: "21 Oct 2026",
    wholesalerName: "Square Pharmaceuticals Depot",
    wholesalerCode: "WHL-SQR-01",
    contactPerson: "Kazi Rafiqul Islam (Depot Manager)",
    phone: "+880 1711-234567",
    email: "depot.dhaka@squarepharma.com.bd",
    wholesalerAddress: "Tejgaon Industrial Area, Plot 48, Dhaka 1208",
    deliveryWarehouse: "Main Distribution Bay - Tejgaon Central",
    paymentTerms: "Net 30 Days",
    priority: "Routine",
    status: "Approved",
    approvalStage: "Final Approved",
    requisitionRef: "REQ-2026-102",
    shippingTerms: "FOB Central Depot",
    notes: "Regular monthly stock replenishing for primary Dhaka hospital hubs.",
    createdBy: "Procurement Officer (A. Rahman)",
    approvedBy: "Mahbubur Rashid (Procurement Lead)",
    approvedAt: new Date("2026-10-15T09:30:00Z"),
    subtotalBDT: 342500.0,
    discountBDT: 6850.0,
    taxBDT: 16782.5,
    totalAmountBDT: 352432.5,
    totalUnits: 2500,
    items: [
      {
        no: 1,
        skuCode: "SKU-CF-200",
        drugName: "Cef-3 200mg/5ml Susp",
        genericName: "Cefixime Trihydrate",
        packSize: "Bottle of 70ml",
        quantityOrdered: 1000,
        quantityReceived: 0,
        unitCostBDT: 185.0,
        totalCostBDT: 185000.0,
        storageRequirement: "Cold Chain (2-8°C)",
      },
      {
        no: 2,
        skuCode: "SKU-CL-625",
        drugName: "Clavroc 625mg Tab",
        genericName: "Amoxicillin + Clavulanic Acid",
        packSize: "Box of 14s",
        quantityOrdered: 500,
        quantityReceived: 0,
        unitCostBDT: 315.0,
        totalCostBDT: 157500.0,
        storageRequirement: "Controlled Ambient (<25°C)",
      },
    ],
  },
  {
    poNumber: "PO-2026-0042",
    poDate: "16 Oct 2026",
    expectedDeliveryDate: "23 Oct 2026",
    wholesalerName: "Beximco Pharma Distribution",
    wholesalerCode: "WHL-BEX-02",
    contactPerson: "Dr. Farhana Siddique (Distribution Lead)",
    phone: "+880 1819-876543",
    email: "procure@beximcopharma.com",
    wholesalerAddress: "Tongi Industrial Area, Gazipur, Dhaka Division",
    deliveryWarehouse: "Central Cold Storage - Tongi HQ",
    paymentTerms: "Net 15 Days",
    priority: "Urgent / Stockout Risk",
    status: "Submitted",
    approvalStage: "Procurement Officer Review",
    requisitionRef: "REQ-2026-108",
    shippingTerms: "FOB Warehouse Dock",
    notes: "High market demand spike in respiratory therapies. Fast-track requested.",
    createdBy: "Procurement Officer (A. Rahman)",
    subtotalBDT: 188000.0,
    discountBDT: 3760.0,
    taxBDT: 9212.0,
    totalAmountBDT: 193452.0,
    totalUnits: 4000,
    items: [
      {
        no: 1,
        skuCode: "SKU-NP-500",
        drugName: "Napa Extra 500mg/65mg",
        genericName: "Paracetamol + Caffeine",
        packSize: "Box of 200s",
        quantityOrdered: 3000,
        quantityReceived: 0,
        unitCostBDT: 28.0,
        totalCostBDT: 84000.0,
        storageRequirement: "Controlled Ambient (<25°C)",
      },
      {
        no: 2,
        skuCode: "SKU-AZ-500",
        drugName: "Azithromycin 500mg Tab",
        genericName: "Azithromycin Dihydrate",
        packSize: "Box of 10s",
        quantityOrdered: 1000,
        quantityReceived: 0,
        unitCostBDT: 104.0,
        totalCostBDT: 104000.0,
        storageRequirement: "Controlled Ambient (<25°C)",
      },
    ],
  },
  {
    poNumber: "PO-2026-0043",
    poDate: "10 Oct 2026",
    expectedDeliveryDate: "17 Oct 2026",
    wholesalerName: "Incepta Wholesalers Ltd",
    wholesalerCode: "WHL-INC-03",
    contactPerson: "Enamul Kabir (Senior Supply Officer)",
    phone: "+880 1912-345678",
    email: "logistics@inceptapharma.com",
    wholesalerAddress: "Dewan Idris Road, Zirabo, Savar, Dhaka",
    deliveryWarehouse: "Main Distribution Bay - Tejgaon Central",
    paymentTerms: "Net 30 Days",
    priority: "Emergency Cold-Chain",
    status: "Partially Received",
    approvalStage: "Final Approved",
    requisitionRef: "REQ-2026-095",
    shippingTerms: "Temperature Controlled Courier",
    notes: "Batch 1 received and cleared quality inspection. Second consignment expected tomorrow.",
    createdBy: "Senior Buyer (N. Akter)",
    approvedBy: "Toshin Bin Azad (Super Admin)",
    approvedAt: new Date("2026-10-11T11:00:00Z"),
    receivedAt: new Date("2026-10-16T14:15:00Z"),
    subtotalBDT: 512000.0,
    discountBDT: 10240.0,
    taxBDT: 25088.0,
    totalAmountBDT: 526848.0,
    totalUnits: 3200,
    items: [
      {
        no: 1,
        skuCode: "SKU-PT-20",
        drugName: "Pantobex 20mg Tab",
        genericName: "Pantoprazole Sodium",
        packSize: "Box of 100s",
        quantityOrdered: 2000,
        quantityReceived: 2000,
        unitCostBDT: 140.0,
        totalCostBDT: 280000.0,
        storageRequirement: "Controlled Ambient (<25°C)",
      },
      {
        no: 2,
        skuCode: "SKU-MN-10",
        drugName: "Monas 10mg Tab",
        genericName: "Montelukast Sodium",
        packSize: "Box of 30s",
        quantityOrdered: 1200,
        quantityReceived: 400,
        unitCostBDT: 193.33,
        totalCostBDT: 232000.0,
        storageRequirement: "Controlled Ambient (<25°C)",
      },
    ],
  },
  {
    poNumber: "PO-2026-0044",
    poDate: "02 Oct 2026",
    expectedDeliveryDate: "08 Oct 2026",
    wholesalerName: "Renata Central Depot",
    wholesalerCode: "WHL-REN-04",
    contactPerson: "Tariq Mahmud (Supply Chain Director)",
    phone: "+880 1611-998877",
    email: "orders@renata-ltd.com",
    wholesalerAddress: "Plot 1, Milk Vita Road, Section 7, Mirpur, Dhaka 1216",
    deliveryWarehouse: "Main Distribution Bay - Tejgaon Central",
    paymentTerms: "Net 30 Days",
    priority: "Routine",
    status: "Received",
    approvalStage: "Final Approved",
    requisitionRef: "REQ-2026-088",
    shippingTerms: "FOB Central Depot",
    notes: "Fully delivered, inspected by QA Pharmacist, and merged into active warehouse bins.",
    createdBy: "Procurement Officer (A. Rahman)",
    approvedBy: "Mahbubur Rashid (Procurement Lead)",
    approvedAt: new Date("2026-10-03T10:00:00Z"),
    receivedAt: new Date("2026-10-08T15:20:00Z"),
    subtotalBDT: 275000.0,
    discountBDT: 5500.0,
    taxBDT: 13475.0,
    totalAmountBDT: 282975.0,
    totalUnits: 1500,
    items: [
      {
        no: 1,
        skuCode: "SKU-MX-20",
        drugName: "Maxpro 20mg Capsule",
        genericName: "Esomeprazole Magnesium",
        packSize: "Box of 100s",
        quantityOrdered: 1000,
        quantityReceived: 1000,
        unitCostBDT: 180.0,
        totalCostBDT: 180000.0,
        storageRequirement: "Controlled Ambient (<25°C)",
      },
      {
        no: 2,
        skuCode: "SKU-FX-120",
        drugName: "Fexo 120mg Tab",
        genericName: "Fexofenadine Hydrochloride",
        packSize: "Box of 50s",
        quantityOrdered: 500,
        quantityReceived: 500,
        unitCostBDT: 190.0,
        totalCostBDT: 95000.0,
        storageRequirement: "Controlled Ambient (<25°C)",
      },
    ],
  },
  {
    poNumber: "PO-2026-0045",
    poDate: "18 Oct 2026",
    expectedDeliveryDate: "25 Oct 2026",
    wholesalerName: "ACI Healthcare Logistics",
    wholesalerCode: "WHL-ACI-05",
    contactPerson: "Shamsun Nahar (Depot Supervisor)",
    phone: "+880 1713-445566",
    email: "pharma.sales@aci-bd.com",
    wholesalerAddress: "245 Tejgaon Industrial Area, Dhaka 1208",
    deliveryWarehouse: "Main Distribution Bay - Tejgaon Central",
    paymentTerms: "Immediate / COD",
    priority: "Routine",
    status: "Draft",
    approvalStage: "Procurement Officer Review",
    requisitionRef: "REQ-2026-114",
    shippingTerms: "FOB Central Depot",
    notes: "Preliminary draft. Awaiting quarterly volume discount confirmation.",
    createdBy: "Procurement Officer (A. Rahman)",
    subtotalBDT: 95000.0,
    discountBDT: 0.0,
    taxBDT: 4750.0,
    totalAmountBDT: 99750.0,
    totalUnits: 500,
    items: [
      {
        no: 1,
        skuCode: "SKU-SV-500",
        drugName: "Savlon Antiseptic Liquid",
        genericName: "Chlorhexidine + Cetrimide",
        packSize: "Bottle of 500ml",
        quantityOrdered: 500,
        quantityReceived: 0,
        unitCostBDT: 190.0,
        totalCostBDT: 95000.0,
        storageRequirement: "Controlled Ambient (<25°C)",
      },
    ],
  },
];

export const purchaseOrderService = {
  async seedInitialIfEmpty(): Promise<void> {
    try {
      const wholesalerCount = await prisma.wholesaler.count();
      if (wholesalerCount === 0) {
        for (const w of INITIAL_WHOLESALERS) {
          await prisma.wholesaler.create({ data: w });
        }
      }

      const poCount = await prisma.purchaseOrder.count();
      if (poCount === 0) {
        for (const po of INITIAL_PURCHASE_ORDERS) {
          await prisma.purchaseOrder.create({ data: po });
        }
      }
    } catch (err) {
      console.warn("Could not seed purchase orders or wholesalers:", err);
    }
  },

  async getAllPurchaseOrders(filters?: {
    search?: string;
    status?: string;
    priority?: string;
    wholesaler?: string;
  }) {
    await this.seedInitialIfEmpty();

    const where: any = {};

    if (filters?.search && filters.search.trim()) {
      const s = filters.search.trim();
      where.OR = [
        { poNumber: { contains: s, mode: "insensitive" } },
        { wholesalerName: { contains: s, mode: "insensitive" } },
        { wholesalerCode: { contains: s, mode: "insensitive" } },
        { requisitionRef: { contains: s, mode: "insensitive" } },
        { contactPerson: { contains: s, mode: "insensitive" } },
      ];
    }

    if (filters?.status && filters.status !== "all") {
      where.status = { equals: filters.status, mode: "insensitive" };
    }

    if (filters?.priority && filters.priority !== "all") {
      where.priority = { equals: filters.priority, mode: "insensitive" };
    }

    if (filters?.wholesaler && filters.wholesaler !== "all") {
      where.wholesalerName = { contains: filters.wholesaler.trim(), mode: "insensitive" };
    }

    const orders = await prisma.purchaseOrder.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return orders;
  },

  async getProcurementMetrics() {
    await this.seedInitialIfEmpty();

    const allOrders = await prisma.purchaseOrder.findMany();

    let totalSpendBDT = 0;
    let pendingApprovalCount = 0;
    let pendingApprovalValueBDT = 0;
    let inTransitCount = 0;
    let inTransitValueBDT = 0;
    let completedCount = 0;
    let completedValueBDT = 0;
    let coldChainPOCount = 0;
    let totalOrderedUnits = 0;
    let totalReceivedUnits = 0;

    for (const po of allOrders) {
      totalSpendBDT += po.totalAmountBDT;
      totalOrderedUnits += po.totalUnits || 0;

      let isColdChain = po.priority.includes("Cold-Chain");
      if (Array.isArray(po.items)) {
        for (const item of po.items) {
          totalReceivedUnits += item.quantityReceived || 0;
          if (item.storageRequirement?.includes("Cold Chain")) {
            isColdChain = true;
          }
        }
      }

      if (isColdChain) {
        coldChainPOCount += 1;
      }

      const st = po.status.toLowerCase();
      if (st === "submitted" || st === "draft") {
        pendingApprovalCount += 1;
        pendingApprovalValueBDT += po.totalAmountBDT;
      } else if (st === "approved" || st === "partially received") {
        inTransitCount += 1;
        inTransitValueBDT += po.totalAmountBDT;
      } else if (st === "received") {
        completedCount += 1;
        completedValueBDT += po.totalAmountBDT;
      }
    }

    const fulfillmentRate =
      totalOrderedUnits > 0 ? Math.round((totalReceivedUnits / totalOrderedUnits) * 100) : 0;

    return {
      totalOrdersCount: allOrders.length,
      totalSpendBDT,
      pendingApprovalCount,
      pendingApprovalValueBDT,
      inTransitCount,
      inTransitValueBDT,
      completedCount,
      completedValueBDT,
      coldChainPOCount,
      fulfillmentRate,
      totalOrderedUnits,
      totalReceivedUnits,
    };
  },

  async getPurchaseOrderById(id: string) {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
    });

    if (!po) {
      throw new AppError(`Purchase order with ID '${id}' not found`, 404);
    }

    return po;
  },

  async createPurchaseOrder(data: CreatePurchaseOrderInput) {
    let poNumber = data.poNumber?.trim();
    if (!poNumber) {
      const allPos = await prisma.purchaseOrder.findMany({ select: { poNumber: true } });
      let maxNum = 45;
      for (const p of allPos) {
        const match = p.poNumber?.match(/PO-\d+-(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      }
      poNumber = `PO-${new Date().getFullYear()}-${String(maxNum + 1).padStart(4, "0")}`;
    }

    const formattedItems = (data.items || []).map((item, idx) => {
      const quantityOrdered = Number(item.quantityOrdered) || 1;
      const unitCostBDT = Number(item.unitCostBDT) || 0;
      const totalCostBDT = item.totalCostBDT !== undefined ? Number(item.totalCostBDT) : quantityOrdered * unitCostBDT;

      return {
        no: item.no || idx + 1,
        skuCode: item.skuCode || null,
        drugName: item.drugName.trim(),
        genericName: item.genericName || null,
        packSize: item.packSize || null,
        quantityOrdered,
        quantityReceived: Number(item.quantityReceived) || 0,
        unitCostBDT,
        totalCostBDT,
        storageRequirement: item.storageRequirement || "Controlled Ambient (<25°C)",
      };
    });

    const subtotalBDT = formattedItems.reduce((acc, it) => acc + it.totalCostBDT, 0);
    const totalUnits = formattedItems.reduce((acc, it) => acc + it.quantityOrdered, 0);
    const discountBDT = Number(data.discountBDT) || 0;
    const taxBDT = Number(data.taxBDT) || 0;
    const totalAmountBDT = Math.max(0, subtotalBDT - discountBDT + taxBDT);

    const poDate = data.poDate?.trim() || formatCurrentDate();
    const status = data.status || "Draft";
    const priority = data.priority || "Routine";

    const created = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        poDate,
        expectedDeliveryDate: data.expectedDeliveryDate || null,
        wholesalerName: data.wholesalerName.trim(),
        wholesalerCode: data.wholesalerCode || null,
        contactPerson: data.contactPerson || null,
        phone: data.phone || null,
        email: data.email || null,
        wholesalerAddress: data.wholesalerAddress || null,
        deliveryWarehouse: data.deliveryWarehouse || "Main Distribution Bay - Tejgaon Central",
        paymentTerms: data.paymentTerms || "Net 30 Days",
        items: formattedItems,
        totalUnits,
        subtotalBDT,
        discountBDT,
        taxBDT,
        totalAmountBDT,
        status,
        approvalStage: data.approvalStage || (status === "Approved" ? "Final Approved" : "Procurement Officer Review"),
        priority,
        requisitionRef: data.requisitionRef || null,
        shippingTerms: data.shippingTerms || "FOB Central Depot",
        notes: data.notes || null,
        createdBy: data.createdBy || "Procurement Officer",
        approvedBy: status === "Approved" ? "Procurement Director" : null,
        approvedAt: status === "Approved" ? new Date() : null,
      },
    });

    await auditLogService.recordAuditEvent({
      module: "Procurement & Wholesalers",
      actionType: "PO Created",
      severity: priority.includes("Cold-Chain") || priority.includes("Urgent") ? "Critical" : "Routine",
      entityTarget: `PO # ${created.poNumber} (${created.wholesalerName})`,
      entityType: "PurchaseOrder",
      entityId: created.id,
      changeSummary: `Purchase order ${created.poNumber} created for ${created.wholesalerName}. Total valuation: BDT ${created.totalAmountBDT} across ${created.totalUnits} units. Status: ${created.status}.`,
      newPayload: created,
      reasonForChange: data.notes || "Commercial wholesale replenishment order generated",
      actorName: created.createdBy || "Procurement Officer",
    });

    return created;
  },

  async updatePurchaseOrder(id: string, data: UpdatePurchaseOrderInput) {
    const existing = await this.getPurchaseOrderById(id);

    const updateData: any = {};

    if (data.wholesalerName !== undefined) updateData.wholesalerName = data.wholesalerName.trim();
    if (data.wholesalerCode !== undefined) updateData.wholesalerCode = data.wholesalerCode;
    if (data.contactPerson !== undefined) updateData.contactPerson = data.contactPerson;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.wholesalerAddress !== undefined) updateData.wholesalerAddress = data.wholesalerAddress;
    if (data.deliveryWarehouse !== undefined) updateData.deliveryWarehouse = data.deliveryWarehouse;
    if (data.paymentTerms !== undefined) updateData.paymentTerms = data.paymentTerms;
    if (data.expectedDeliveryDate !== undefined) updateData.expectedDeliveryDate = data.expectedDeliveryDate;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.approvalStage !== undefined) updateData.approvalStage = data.approvalStage;
    if (data.requisitionRef !== undefined) updateData.requisitionRef = data.requisitionRef;
    if (data.shippingTerms !== undefined) updateData.shippingTerms = data.shippingTerms;
    if (data.notes !== undefined) updateData.notes = data.notes;

    if (data.items !== undefined) {
      const formattedItems = data.items.map((item, idx) => {
        const quantityOrdered = Number(item.quantityOrdered) || 1;
        const unitCostBDT = Number(item.unitCostBDT) || 0;
        const totalCostBDT = item.totalCostBDT !== undefined ? Number(item.totalCostBDT) : quantityOrdered * unitCostBDT;

        return {
          no: item.no || idx + 1,
          skuCode: item.skuCode || null,
          drugName: item.drugName.trim(),
          genericName: item.genericName || null,
          packSize: item.packSize || null,
          quantityOrdered,
          quantityReceived: Number(item.quantityReceived) || 0,
          unitCostBDT,
          totalCostBDT,
          storageRequirement: item.storageRequirement || "Controlled Ambient (<25°C)",
        };
      });

      const subtotalBDT = formattedItems.reduce((acc, it) => acc + it.totalCostBDT, 0);
      const totalUnits = formattedItems.reduce((acc, it) => acc + it.quantityOrdered, 0);
      const discountBDT = data.discountBDT !== undefined ? Number(data.discountBDT) : existing.discountBDT;
      const taxBDT = data.taxBDT !== undefined ? Number(data.taxBDT) : existing.taxBDT;
      const totalAmountBDT = Math.max(0, subtotalBDT - discountBDT + taxBDT);

      updateData.items = formattedItems;
      updateData.subtotalBDT = subtotalBDT;
      updateData.totalUnits = totalUnits;
      updateData.discountBDT = discountBDT;
      updateData.taxBDT = taxBDT;
      updateData.totalAmountBDT = totalAmountBDT;
    } else if (data.discountBDT !== undefined || data.taxBDT !== undefined) {
      const discountBDT = data.discountBDT !== undefined ? Number(data.discountBDT) : existing.discountBDT;
      const taxBDT = data.taxBDT !== undefined ? Number(data.taxBDT) : existing.taxBDT;
      updateData.discountBDT = discountBDT;
      updateData.taxBDT = taxBDT;
      updateData.totalAmountBDT = Math.max(0, existing.subtotalBDT - discountBDT + taxBDT);
    }

    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: updateData,
    });

    await auditLogService.recordAuditEvent({
      module: "Procurement & Wholesalers",
      actionType: "PO Updated",
      severity: "Routine",
      entityTarget: `PO # ${updated.poNumber} (${updated.wholesalerName})`,
      entityType: "PurchaseOrder",
      entityId: updated.id,
      changeSummary: `Purchase order ${updated.poNumber} details modified. Subtotal: BDT ${updated.subtotalBDT}, Net Total: BDT ${updated.totalAmountBDT}.`,
      priorPayload: existing,
      newPayload: updated,
      reasonForChange: data.notes || "Purchase order amendment",
    });

    return updated;
  },

  async updateOrderStatus(
    id: string,
    status: "Draft" | "Submitted" | "Approved" | "Partially Received" | "Received" | "Cancelled",
    approvalStage?: string,
    notes?: string,
    approvedBy?: string
  ) {
    const existing = await this.getPurchaseOrderById(id);

    const updateData: any = {
      status,
    };

    if (approvalStage) {
      updateData.approvalStage = approvalStage;
    } else {
      if (status === "Approved") updateData.approvalStage = "Final Approved";
      else if (status === "Submitted") updateData.approvalStage = "Procurement Review";
      else if (status === "Received") updateData.approvalStage = "Dock Intake Complete";
    }

    if (status === "Approved") {
      updateData.approvedBy = approvedBy || "Authorized Approver (Lead Pharmacist)";
      updateData.approvedAt = new Date();
    } else if (status === "Received") {
      updateData.receivedAt = new Date();
    }

    if (notes) {
      updateData.notes = existing.notes ? `${existing.notes} | ${notes}` : notes;
    }

    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: updateData,
    });

    await auditLogService.recordAuditEvent({
      module: "Procurement & Wholesalers",
      actionType: status === "Approved" ? "Multi-tier PO Approved" : `PO Status Changed to ${status}`,
      severity: status === "Approved" || status === "Cancelled" ? "Critical" : "Routine",
      entityTarget: `PO # ${updated.poNumber} (${updated.wholesalerName})`,
      entityType: "PurchaseOrder",
      entityId: updated.id,
      changeSummary: `PO status updated from '${existing.status}' to '${updated.status}'. Approver: ${updated.approvedBy || "System Operator"}. Approval Stage: ${updated.approvalStage}.`,
      priorPayload: existing,
      newPayload: updated,
      reasonForChange: notes || `Administrative status transition to ${status}`,
      signerName: approvedBy || updated.approvedBy || undefined,
      signatureMeaning: status === "Approved" ? "Approval" : "Verification",
    });

    return updated;
  },

  async receiveStock(id: string, input: ReceiveStockInput) {
    const existing = await this.getPurchaseOrderById(id);

    if (existing.status === "Cancelled") {
      throw new AppError("Cannot receive stock for a cancelled purchase order", 400);
    }

    const updatedItems = [...existing.items];
    const createdBatchIds: string[] = [];

    for (const item of input.receivedItems) {
      const idx = updatedItems.findIndex(
        (it) => (it.skuCode && it.skuCode === item.skuCode) || it.drugName.toLowerCase() === item.drugName.toLowerCase()
      );

      if (idx !== -1) {
        const currentRec = updatedItems[idx].quantityReceived || 0;
        updatedItems[idx].quantityReceived = currentRec + Number(item.quantityToReceive);
      }

      // If user wants to inject directly into Active FEFO Inventory
      if (input.updateInventoryBatches) {
        const batchNum = item.batchNumber.trim();
        const existingBatch = await prisma.inventoryBatch.findUnique({
          where: { batchNumber: batchNum },
        });

        if (existingBatch) {
          // Increment stock
          const updatedBatch = await prisma.inventoryBatch.update({
            where: { batchNumber: batchNum },
            data: {
              availableUnits: existingBatch.availableUnits + Number(item.quantityToReceive),
            },
          });
          createdBatchIds.push(updatedBatch.id);
        } else {
          // Create new batch in warehouse
          const skuCode = item.skuCode || `SKU-${batchNum.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase()}`;
          
          // Check if skuCode already exists to prevent duplicate key error
          let finalSkuCode = skuCode;
          const skuCheck = await prisma.inventoryBatch.findUnique({ where: { skuCode: finalSkuCode } });
          if (skuCheck) {
            finalSkuCode = `${skuCode}-${Math.floor(100 + Math.random() * 900)}`;
          }

          const newBatch = await prisma.inventoryBatch.create({
            data: {
              skuCode: finalSkuCode,
              brandName: item.drugName,
              genericName: item.drugName,
              category: item.storageCondition?.includes("Cold Chain") ? "Cold Chain Biologics" : "General Oral Solid",
              batchNumber: batchNum,
              mfgDate: item.mfgDate || formatCurrentDate(),
              expiryDate: item.expiryDate || formatCurrentDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 2)),
              availableUnits: Number(item.quantityToReceive),
              unitPrice: Number(item.unitPrice) || 150.0,
              warehouseBin: item.warehouseBin || "Dock Bay 01",
              storageCondition: item.storageCondition || "Controlled Ambient (<25°C)",
            },
          });
          createdBatchIds.push(newBatch.id);
        }
      }
    }

    // Determine new status: fully received or partially received
    const allFulfilled = updatedItems.every(
      (it) => (it.quantityReceived || 0) >= it.quantityOrdered
    );
    const newStatus = allFulfilled ? "Received" : "Partially Received";
    const approvalStage = allFulfilled ? "Dock Intake Complete" : "Partial Intake Verified";

    const updatedPO = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        items: updatedItems,
        status: newStatus,
        approvalStage,
        receivedAt: new Date(),
        notes: input.notes
          ? `${existing.notes || ""} [Intake Note: ${input.notes} | Challan: ${input.challanNumber || "N/A"}]`
          : existing.notes,
      },
    });

    await auditLogService.recordAuditEvent({
      module: "FEFO Warehouse",
      actionType: "Wholesaler Goods Received",
      severity: "Routine",
      entityTarget: `PO # ${existing.poNumber} | Wholesaler: ${existing.wholesalerName}`,
      entityType: "PurchaseOrder",
      entityId: existing.id,
      changeSummary: `Stock intake recorded for PO ${existing.poNumber}. New status: ${newStatus}. Received batches synchronized into warehouse inventory ledger.`,
      newPayload: {
        poNumber: existing.poNumber,
        receivedItems: input.receivedItems,
        challanNumber: input.challanNumber,
        createdBatchCount: createdBatchIds.length,
      },
      reasonForChange: input.notes || "Dock intake verified and received against purchase order",
      actorName: input.receivedBy || "Receiving Pharmacist",
    });

    return {
      purchaseOrder: updatedPO,
      allFulfilled,
      syncedBatchesCount: createdBatchIds.length,
    };
  },

  async deletePurchaseOrder(id: string) {
    const existing = await this.getPurchaseOrderById(id);

    const deleted = await prisma.purchaseOrder.delete({
      where: { id },
    });

    await auditLogService.recordAuditEvent({
      module: "Procurement & Wholesalers",
      actionType: "PO Deleted",
      severity: "Critical",
      entityTarget: `PO # ${existing.poNumber} (${existing.wholesalerName})`,
      entityType: "PurchaseOrder",
      entityId: existing.id,
      changeSummary: `Purchase order ${existing.poNumber} (Valuation: BDT ${existing.totalAmountBDT}) deleted from registry.`,
      priorPayload: existing,
      reasonForChange: "Procurement record purged by authorized user",
    });

    return deleted;
  },

  // ─────────────────────────────────────────────
  // Wholesaler Registry CRUD
  // ─────────────────────────────────────────────

  async getAllWholesalers() {
    await this.seedInitialIfEmpty();
    return prisma.wholesaler.findMany({
      orderBy: { name: "asc" },
    });
  },

  async getWholesalerById(id: string) {
    const wholesaler = await prisma.wholesaler.findUnique({
      where: { id },
    });

    if (!wholesaler) {
      throw new AppError(`Wholesaler with ID '${id}' not found`, 404);
    }

    return wholesaler;
  },

  async createWholesaler(data: CreateWholesalerInput) {
    let wholesalerCode = data.wholesalerCode?.trim();
    if (!wholesalerCode) {
      const count = await prisma.wholesaler.count();
      const initials = data.name.substring(0, 3).toUpperCase();
      wholesalerCode = `WHL-${initials}-${String(count + 1).padStart(2, "0")}`;
    }

    const wholesaler = await prisma.wholesaler.create({
      data: {
        wholesalerCode,
        name: data.name.trim(),
        contactPerson: data.contactPerson.trim(),
        phone: data.phone.trim(),
        email: data.email?.trim() || null,
        drugLicenseNo: data.drugLicenseNo.trim(),
        tradeLicense: data.tradeLicense?.trim() || null,
        address: data.address.trim(),
        territory: data.territory || "Dhaka Metro",
        paymentTerms: data.paymentTerms || "Net 30 Days",
        rating: Number(data.rating) || 5.0,
        status: data.status || "Active",
        leadTimeDays: Number(data.leadTimeDays) || 3,
        suppliedCategories: data.suppliedCategories || [],
      },
    });

    await auditLogService.recordAuditEvent({
      module: "Procurement & Wholesalers",
      actionType: "Wholesaler Registered",
      severity: "Routine",
      entityTarget: `${wholesaler.name} (${wholesaler.wholesalerCode})`,
      entityType: "Wholesaler",
      entityId: wholesaler.id,
      changeSummary: `New pharmaceutical distributor '${wholesaler.name}' licensed and added to approved vendor registry.`,
      newPayload: wholesaler,
      reasonForChange: "Wholesaler onboarding",
    });

    return wholesaler;
  },

  async updateWholesaler(id: string, data: UpdateWholesalerInput) {
    const existing = await this.getWholesalerById(id);

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.wholesalerCode !== undefined) updateData.wholesalerCode = data.wholesalerCode.trim();
    if (data.contactPerson !== undefined) updateData.contactPerson = data.contactPerson.trim();
    if (data.phone !== undefined) updateData.phone = data.phone.trim();
    if (data.email !== undefined) updateData.email = data.email?.trim() || null;
    if (data.drugLicenseNo !== undefined) updateData.drugLicenseNo = data.drugLicenseNo.trim();
    if (data.tradeLicense !== undefined) updateData.tradeLicense = data.tradeLicense?.trim() || null;
    if (data.address !== undefined) updateData.address = data.address.trim();
    if (data.territory !== undefined) updateData.territory = data.territory;
    if (data.paymentTerms !== undefined) updateData.paymentTerms = data.paymentTerms;
    if (data.rating !== undefined) updateData.rating = Number(data.rating);
    if (data.status !== undefined) updateData.status = data.status;
    if (data.leadTimeDays !== undefined) updateData.leadTimeDays = Number(data.leadTimeDays);
    if (data.suppliedCategories !== undefined) updateData.suppliedCategories = data.suppliedCategories;

    const updated = await prisma.wholesaler.update({
      where: { id },
      data: updateData,
    });

    await auditLogService.recordAuditEvent({
      module: "Procurement & Wholesalers",
      actionType: "Wholesaler Updated",
      severity: "Routine",
      entityTarget: `${updated.name} (${updated.wholesalerCode})`,
      entityType: "Wholesaler",
      entityId: updated.id,
      changeSummary: `Wholesaler '${updated.name}' profile modified. Status: ${updated.status}.`,
      priorPayload: existing,
      newPayload: updated,
      reasonForChange: "Vendor compliance updates",
    });

    return updated;
  },

  async deleteWholesaler(id: string) {
    const existing = await this.getWholesalerById(id);

    const activeOrders = await prisma.purchaseOrder.count({
      where: {
        wholesalerName: existing.name,
        status: { in: ["Submitted", "Approved", "Partially Received"] },
      },
    });

    if (activeOrders > 0) {
      throw new AppError(
        `Cannot delete wholesaler '${existing.name}' because they have ${activeOrders} active purchase order(s) pending fulfillment`,
        400
      );
    }

    const deleted = await prisma.wholesaler.delete({
      where: { id },
    });

    await auditLogService.recordAuditEvent({
      module: "Procurement & Wholesalers",
      actionType: "Wholesaler Deleted",
      severity: "Critical",
      entityTarget: `${existing.name} (${existing.wholesalerCode})`,
      entityType: "Wholesaler",
      entityId: existing.id,
      changeSummary: `Wholesaler '${existing.name}' removed from approved vendor registry.`,
      priorPayload: existing,
      reasonForChange: "Vendor deregistered",
    });

    return deleted;
  },
};
