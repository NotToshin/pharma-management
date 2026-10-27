import { z } from "zod";

const orderItemSchema = z.object({
  no: z.coerce.number().int().optional().default(1),
  description: z.string().min(1, "Description is required"),
  quantity: z.coerce.number().int().positive("Quantity must be positive"),
  unitCost: z.coerce.number().min(0).optional().default(0),
  total: z.coerce.number().min(0).optional().default(0),
});

export const createOrderSchema = z.object({
  body: z.object({
    orderNumber: z.string().optional().or(z.literal("")),
    orderDate: z.string().optional().or(z.literal("")),
    pharmacyName: z.string().min(1, "Pharmacy name is required"),
    territory: z.string().optional().or(z.literal("")),
    assignedMio: z.string().optional().or(z.literal("")),
    itemsSummary: z.string().optional().or(z.literal("")),
    itemsDetail: z.array(orderItemSchema).optional().default([]),
    totalBoxes: z.coerce.number().int().min(0).optional(),
    orderValue: z.coerce.number().min(0).optional(),
    discount: z.coerce.number().min(0).optional(),
    discountAmount: z.coerce.number().min(0).optional(),
    discountPercent: z.coerce.number().min(0).optional(),
    comments: z.string().optional().or(z.literal("")),
    deliveryMethod: z.string().optional().default("Sales Representative"),
    status: z.string().optional().default("FEFO Allocated"),
    challanNumber: z.string().optional().or(z.literal("")),
    invoiceNumber: z.string().optional().or(z.literal("")),
  }),
});

export const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.string().optional(),
    assignedMio: z.string().optional(),
    territory: z.string().optional(),
  }),
  params: z.object({
    id: z.string().min(1, "Order ID is required"),
  }),
});

export const orderIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Order ID is required"),
  }),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>["body"];
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>["body"];