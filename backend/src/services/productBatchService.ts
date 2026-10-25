import { Prisma } from "@prisma/client";
import prisma from "../utils/prisma";
import { AppError } from "../errors";

type Db = Prisma.TransactionClient | typeof prisma;

export type ReceiveBatchInput = {
  brandName: string;
  genericName?: string | null;
  skuCode?: string | null;
  category?: string | null;
  packSize?: string | null;
  batchNumber: string;
  mfgDate: string;
  expiryDate: string;
  quantity: number;
  purchasePrice: number;
  warehouseBin: string;
  storageCondition: string;
  purchaseOrderId?: string;
  poNumber?: string;
};

const normalizeName = (value: string) => value.trim().replace(/\s+/g, " ");

const skuFromBrand = (brandName: string) => {
  const slug = normalizeName(brandName)
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toUpperCase()
    .slice(0, 28);
  return `SKU-${slug || "MED"}`;
};

const pricesMatch = (left: number, right: number) => Math.abs(left - right) < 0.001;

const sameMedicine = (left: string, right: string) =>
  normalizeName(left).toLowerCase() === normalizeName(right).toLowerCase();

export async function ensureMasterProduct(
  db: Db,
  input: {
    brandName: string;
    genericName?: string | null;
    skuCode?: string | null;
    category?: string | null;
    packSize?: string | null;
    storageCondition?: string | null;
  }
) {
  const brandName = normalizeName(input.brandName);
  if (!brandName) {
    throw new AppError("A product name is required to receive stock", 400);
  }

  const byName = await db.product.findFirst({
    where: { brandName: { equals: brandName, mode: "insensitive" } },
  });
  if (byName) return byName;

  let skuCode = input.skuCode?.trim() || "";
  let genericSource = input.genericName?.trim() || "";

  // A purchase line can keep another medicine's SKU after the name is edited.
  // That SKU must not rename this receipt onto the other product.
  if (skuCode) {
    const skuOwner = await db.product.findUnique({ where: { skuCode } });
    if (skuOwner && !sameMedicine(skuOwner.brandName, brandName)) {
      if (genericSource && sameMedicine(genericSource, skuOwner.genericName)) {
        genericSource = "";
      }
      skuCode = "";
    }
  }

  const storageCondition = input.storageCondition || "Controlled Ambient (<25°C)";
  const data = {
    skuCode: skuCode || skuFromBrand(brandName),
    brandName,
    genericName: normalizeName(genericSource || brandName),
    category:
      input.category ||
      (storageCondition.includes("Cold") ? "Cold Chain Biologics" : "General Oral Solid"),
    packSize: input.packSize?.trim() || null,
    storageCondition,
  };

  try {
    return await db.product.create({ data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const existing = await db.product.findFirst({
        where: {
          OR: [
            { skuCode: data.skuCode },
            { brandName: { equals: brandName, mode: "insensitive" } },
          ],
        },
      });
      if (existing && sameMedicine(existing.brandName, brandName)) return existing;
      if (existing) {
        return db.product.create({
          data: {
            ...data,
            skuCode: `${skuFromBrand(brandName)}-${Math.floor(100 + Math.random() * 900)}`,
          },
        });
      }
    }
    throw error;
  }
}

/**
 * Opens stock for one purchase lot.
 * A new batch number always becomes its own ProductBatch.
 * Quantity is added to an existing lot only when the batch number, expiry,
 * and purchase price are all the same physical lot.
 */
export async function receiveIndependentBatch(db: Db, input: ReceiveBatchInput) {
  const product = await ensureMasterProduct(db, input);
  const batchNumber = input.batchNumber.trim();
  const expiryDate = input.expiryDate.trim();
  const quantity = Math.max(0, Math.round(Number(input.quantity) || 0));
  const purchasePrice = Math.max(0, Number(input.purchasePrice) || 0);
  const mfgDate = input.mfgDate.trim();
  const warehouseBin = input.warehouseBin.trim() || "Receiving Bay Dock 1";
  const storageCondition = input.storageCondition || product.storageCondition;

  if (!batchNumber) {
    throw new AppError("Batch number is required for each purchase lot", 400);
  }
  if (quantity <= 0) {
    throw new AppError(`Received quantity for ${product.brandName} must be greater than zero`, 400);
  }

  const existingLot = await db.inventoryBatch.findUnique({
    where: { batchNumber },
  });

  if (existingLot) {
    const sameLot =
      sameMedicine(existingLot.brandName, product.brandName) &&
      existingLot.expiryDate === expiryDate &&
      pricesMatch(existingLot.unitPrice, purchasePrice);

    if (!sameLot) {
      throw new AppError(
        `Batch ${batchNumber} is already in stock for ${existingLot.brandName} ` +
          `(expiry ${existingLot.expiryDate}, purchase price ৳${existingLot.unitPrice}). ` +
          `This receipt of ${product.brandName} has expiry ${expiryDate} at ৳${purchasePrice} ` +
          `and was not merged. Enter the batch number printed on this consignment.`,
        409
      );
    }

    const inventoryBatch = await db.inventoryBatch.update({
      where: { id: existingLot.id },
      data: {
        availableUnits: { increment: quantity },
        productId: existingLot.productId || product.id,
        skuCode: product.skuCode,
      },
    });

    const linked = await db.productBatch.findFirst({
      where: {
        OR: [{ inventoryBatchId: existingLot.id }, { productId: product.id, batchNumber }],
      },
    });

    const productBatch = linked
      ? await db.productBatch.update({
          where: { id: linked.id },
          data: {
            quantity: inventoryBatch.availableUnits,
            inventoryBatchId: inventoryBatch.id,
            purchasePrice,
            expiryDate,
          },
        })
      : await db.productBatch.create({
          data: {
            productId: product.id,
            batchNumber,
            purchasePrice,
            mfgDate: existingLot.mfgDate || mfgDate,
            expiryDate,
            quantity: inventoryBatch.availableUnits,
            warehouseBin: existingLot.warehouseBin,
            storageCondition: existingLot.storageCondition,
            purchaseOrderId: input.purchaseOrderId,
            poNumber: input.poNumber,
            inventoryBatchId: inventoryBatch.id,
          },
        });

    return { product, productBatch, inventoryBatch, created: false as const };
  }

  const inventoryBatch = await db.inventoryBatch.create({
    data: {
      productId: product.id,
      skuCode: product.skuCode,
      brandName: product.brandName,
      genericName: product.genericName,
      category: product.category,
      batchNumber,
      mfgDate,
      expiryDate,
      availableUnits: quantity,
      unitPrice: purchasePrice,
      warehouseBin,
      storageCondition,
    },
  });

  const productBatch = await db.productBatch.create({
    data: {
      productId: product.id,
      batchNumber,
      purchasePrice,
      mfgDate,
      expiryDate,
      quantity,
      warehouseBin,
      storageCondition,
      purchaseOrderId: input.purchaseOrderId,
      poNumber: input.poNumber,
      inventoryBatchId: inventoryBatch.id,
    },
  });

  return { product, productBatch, inventoryBatch, created: true as const };
}

export async function mirrorBatchQuantity(db: Db, inventoryBatchId: string, quantity: number) {
  await db.productBatch.updateMany({
    where: { inventoryBatchId },
    data: { quantity: Math.max(0, quantity) },
  });
}
