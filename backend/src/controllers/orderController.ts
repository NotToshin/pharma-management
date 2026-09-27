import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getAllOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      orderNumber,
      orderDate,
      pharmacyName,
      territory,
      assignedMio,
      itemsSummary,
      totalBoxes,
      orderValue,
      deliveryMethod,
      status,
      challanNumber,
    } = req.body;

    const newOrder = await prisma.order.create({
      data: {
        orderNumber: orderNumber || `SO-2026-${Math.floor(4500 + Math.random() * 500)}`,
        orderDate: orderDate || new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        pharmacyName,
        territory: territory || "Dhaka North",
        assignedMio: assignedMio || "General MIO",
        itemsSummary,
        totalBoxes: Number(totalBoxes) || 10,
        orderValue: Number(orderValue) || 25000,
        deliveryMethod: deliveryMethod || "Company Van (Ambient)",
        status: status || "FEFO Allocated",
        challanNumber: challanNumber || `DC-2026-${Math.floor(1100 + Math.random() * 100)}`,
      },
    });

    res.status(201).json(newOrder);
  } catch (error: any) {
    console.error("Error creating order:", error);
    res.status(400).json({ error: error.message || "Failed to create order." });
  }
};

export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const isDelivered = status === "Delivered & Invoiced";
    const invoiceNum = isDelivered ? `INV-2026-${Math.floor(9020 + Math.random() * 80)}` : undefined;

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status,
        ...(invoiceNum ? { invoiceNumber: invoiceNum } : {}),
      },
    });

    res.status(200).json(updatedOrder);
  } catch (error: any) {
    console.error("Error updating order status:", error);
    res.status(400).json({ error: error.message || "Failed to update order status" });
  }
};

export const deleteOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.order.delete({ where: { id } });
    res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ error: "Failed to delete order record" });
  }
};