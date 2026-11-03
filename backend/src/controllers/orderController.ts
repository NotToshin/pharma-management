import { Request, Response } from "express";
import { orderService } from "../services/orderService";
import { sendResponse } from "../utils/response";
import { catchAsync } from "../utils/catchAsync";
import { GetOrdersQueryInput } from "../validations/orderValidation";

export const getAllOrders = catchAsync(async (req: Request, res: Response) => {
  const query = req.query as GetOrdersQueryInput;
  const result = await orderService.getAllOrders(query);
  sendResponse(res, 200, "Orders retrieved successfully", result.rows, result.meta);
});

export const getOrderStats = catchAsync(async (req: Request, res: Response) => {
  const stats = await orderService.getOrderStats();
  sendResponse(res, 200, "Sales order statistics retrieved successfully", stats);
});

export const createOrder = catchAsync(async (req: Request, res: Response) => {
  const result = await orderService.createOrder(req.body);
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

export const updateOrderInvoice = catchAsync(async (req: Request, res: Response) => {
  const order = await orderService.updateOrderInvoice(req.params.id, req.body);
  sendResponse(res, 200, "Invoice details updated successfully", order);
});
