import { Request, Response } from "express";
import { purchaseOrderService } from "../services/purchaseOrderService";
import { sendResponse } from "../utils/response";
import { catchAsync } from "../utils/catchAsync";

// ─────────────────────────────────────────────
// Purchase Orders Endpoints
// ─────────────────────────────────────────────

export const getAllPurchaseOrders = catchAsync(async (req: Request, res: Response) => {
  const { search, status, priority, wholesaler } = req.query as {
    search?: string;
    status?: string;
    priority?: string;
    wholesaler?: string;
  };
  const orders = await purchaseOrderService.getAllPurchaseOrders({ search, status, priority, wholesaler });
  sendResponse(res, 200, "Purchase orders retrieved successfully", orders);
});

export const getProcurementMetrics = catchAsync(async (req: Request, res: Response) => {
  const metrics = await purchaseOrderService.getProcurementMetrics();
  sendResponse(res, 200, "Procurement metrics retrieved successfully", metrics);
});

export const getPurchaseOrderById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const order = await purchaseOrderService.getPurchaseOrderById(id);
  sendResponse(res, 200, "Purchase order details retrieved successfully", order);
});

export const createPurchaseOrder = catchAsync(async (req: Request, res: Response) => {
  const newOrder = await purchaseOrderService.createPurchaseOrder(req.body);
  sendResponse(res, 201, "Purchase order created successfully", newOrder);
});

export const updatePurchaseOrder = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updatedOrder = await purchaseOrderService.updatePurchaseOrder(id, req.body);
  sendResponse(res, 200, "Purchase order updated successfully", updatedOrder);
});

export const approvePurchaseOrder = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { approvedBy, approvalNote, notes } = req.body;
  const updatedOrder = await purchaseOrderService.approvePurchaseOrder(
    id,
    approvedBy,
    approvalNote || notes
  );
  sendResponse(res, 200, "Purchase order authorized successfully", updatedOrder);
});

export const updateOrderStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, approvalStage, notes, approvedBy } = req.body;
  const updatedOrder = await purchaseOrderService.updateOrderStatus(id, status, approvalStage, notes, approvedBy);
  sendResponse(res, 200, "Purchase order status updated successfully", updatedOrder);
});

export const receiveStock = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await purchaseOrderService.receiveStock(id, req.body);
  sendResponse(res, 200, "Stock intake successfully recorded and synchronized into warehouse ledger", result);
});

export const deletePurchaseOrder = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const deletedOrder = await purchaseOrderService.deletePurchaseOrder(id);
  sendResponse(res, 200, "Purchase order deleted successfully", deletedOrder);
});

// ─────────────────────────────────────────────
// Wholesalers Registry Endpoints
// ─────────────────────────────────────────────

export const getAllWholesalers = catchAsync(async (req: Request, res: Response) => {
  const wholesalers = await purchaseOrderService.getAllWholesalers();
  sendResponse(res, 200, "Wholesalers retrieved successfully", wholesalers);
});

export const getWholesalerById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const wholesaler = await purchaseOrderService.getWholesalerById(id);
  sendResponse(res, 200, "Wholesaler details retrieved successfully", wholesaler);
});

export const createWholesaler = catchAsync(async (req: Request, res: Response) => {
  const newWholesaler = await purchaseOrderService.createWholesaler(req.body);
  sendResponse(res, 201, "Wholesaler registered successfully", newWholesaler);
});

export const updateWholesaler = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updatedWholesaler = await purchaseOrderService.updateWholesaler(id, req.body);
  sendResponse(res, 200, "Wholesaler updated successfully", updatedWholesaler);
});

export const deleteWholesaler = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const deletedWholesaler = await purchaseOrderService.deleteWholesaler(id);
  sendResponse(res, 200, "Wholesaler deleted successfully", deletedWholesaler);
});
