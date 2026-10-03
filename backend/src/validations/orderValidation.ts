import { z } from "zod";

const orderItemSchema = z.object({
  no: z.number().int().positive(),
  description: z.string().min(1),
  quantity: z.number().int().positive(),
  unitCost: z.number().min(0),
  total: z.number().min(0),
});

export const createOrderSchema = z.object({
  body: z.object({
    orderNumber: z.string().min(1, "Order number is required"),
    orderDate: z.string().min(1, "Order date is required"),
    pharmacyName: z.string().min(1, "Pharmacy name is required"),
    territory: z.string().min(1, "Territory is required"),
    assignedMio: z.string().min(1, "Assigned MIO is required"),
    itemsSummary: z.string().optional().or(z.literal("")),
    itemsDetail: z.array(orderItemSchema).optional().default([]),
    totalBoxes: z.coerce.number().int().min(0).optional(),
    orderValue: z.coerce.number().min(0).optional(),
    deliveryMethod: z.string().min(1, "Delivery method is required"),
    status: z.string().min(1, "Status is required"),
    challanNumber: z.string().optional().or(z.literal("")),
    invoiceNumber: z.string().optional().or(z.literal("")),
  }),
});

export const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.string().min(1, "Status is required"),
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