import { Request, Response } from "express";
import { orderService } from "../services/orderService";
import { sendResponse } from "../utils/response";
import { catchAsync } from "../utils/catchAsync";

export const getAllOrders = catchAsync(async (req: Request, res: Response) => {
  const orders = await orderService.getAllOrders();
  sendResponse(res, 200, "Orders retrieved successfully", orders);
});

export const createOrder = catchAsync(async (req: Request, res: Response) => {
  const {
    orderNumber,
    orderDate,
    pharmacyName,
    territory,
    assignedMio,
    itemsSummary,
    itemsDetail,
    totalBoxes,
    orderValue,
    deliveryMethod,
    status,
    challanNumber,
    invoiceNumber,
  } = req.body;

  const result = await orderService.createOrder({
    orderNumber,
    orderDate,
    pharmacyName,
    territory,
    assignedMio,
    itemsSummary,
    itemsDetail: Array.isArray(itemsDetail) ? itemsDetail : [],
    totalBoxes: totalBoxes ? Number(totalBoxes) : undefined,
    orderValue: orderValue ? Number(orderValue) : undefined,
    deliveryMethod,
    status,
    challanNumber,
    invoiceNumber,
  });

  sendResponse(res, 201, "Order created successfully", result);
});

export const updateOrderStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const updatedOrder = await orderService.updateOrderStatus(id, status);
  sendResponse(res, 200, "Order status updated successfully", updatedOrder);
});

export const deleteOrder = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await orderService.deleteOrder(id);
  sendResponse(res, 200, "Order deleted successfully");
});