import { Request, Response } from "express";
import { paymentService } from "../services/paymentService";
import { sendResponse } from "../utils/response";
import { catchAsync } from "../utils/catchAsync";

export const getNextVoucherNumber = catchAsync(async (req: Request, res: Response) => {
  const nextCode = await paymentService.getNextVoucherNumber();
  sendResponse(res, 200, "Next voucher number generated", { nextVoucherNo: nextCode });
});

export const getVoucherMetrics = catchAsync(async (req: Request, res: Response) => {
  const metrics = await paymentService.getVoucherMetrics();
  sendResponse(res, 200, "Voucher metrics retrieved successfully", metrics);
});

export const getAllVouchers = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentService.getAllVouchers(req.query);
  sendResponse(res, 200, "Payment vouchers retrieved successfully", result.vouchers, result.meta);
});

export const getVoucherById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const voucher = await paymentService.getVoucherById(id);
  sendResponse(res, 200, "Payment voucher retrieved successfully", voucher);
});

export const createVoucher = catchAsync(async (req: Request, res: Response) => {
  const actorName =
    (req as any).user?.name ||
    (req.headers["x-user-name"] as string) ||
    "Finance Controller";

  const newVoucher = await paymentService.createVoucher(req.body, actorName);
  sendResponse(res, 201, "Payment voucher created successfully", newVoucher);
});

export const updateVoucher = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const actorName =
    (req as any).user?.name ||
    (req.headers["x-user-name"] as string) ||
    "Finance Controller";

  const updated = await paymentService.updateVoucher(id, req.body, actorName);
  sendResponse(res, 200, "Payment voucher updated successfully", updated);
});

export const authorizeVoucher = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { action, chequeNumber, financialAccountId, paymentMethod, rejectionReason, approverName } = req.body;

  const actor =
    approverName ||
    (req as any).user?.name ||
    (req.headers["x-user-name"] as string) ||
    "Authorized Officer";

  const result = await paymentService.authorizeVoucher(
    id,
    action,
    {
      chequeNumber,
      financialAccountId,
      paymentMethod,
      rejectionReason,
      approverName: actor,
    }
  );

  sendResponse(res, 200, `Payment voucher ${action}d successfully`, result);
});

export const deleteVoucher = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const actorName =
    (req as any).user?.name ||
    (req.headers["x-user-name"] as string) ||
    "Finance Controller";

  await paymentService.deleteVoucher(id, actorName);
  sendResponse(res, 200, "Payment voucher deleted successfully");
});