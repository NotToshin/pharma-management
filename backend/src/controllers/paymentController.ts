import { Request, Response } from "express";
import { paymentService } from "../services/paymentService";
import { sendResponse } from "../utils/response";
import { catchAsync } from "../utils/catchAsync";

export const getNextVoucherNumber = catchAsync(async (req: Request, res: Response) => {
  const nextCode = await paymentService.getNextVoucherNumber();
  sendResponse(res, 200, "Next voucher number generated", { nextVoucherNo: nextCode });
});

export const getAllVouchers = catchAsync(async (req: Request, res: Response) => {
  const vouchers = await paymentService.getAllVouchers();
  sendResponse(res, 200, "Payment vouchers retrieved successfully", vouchers);
});

export const createVoucher = catchAsync(async (req: Request, res: Response) => {
  const {
    voucherNo,
    payeeName,
    category,
    fundingSource,
    sourceDetail,
    amount,
    paymentDate,
    notes,
  } = req.body;

  const newVoucher = await paymentService.createVoucher({
    voucherNo,
    payeeName,
    category,
    fundingSource,
    sourceDetail,
    amount: Number(amount) || 0,
    paymentDate,
    notes,
  });

  sendResponse(res, 201, "Payment voucher created successfully", newVoucher);
});

export const updateVoucher = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    voucherNo,
    payeeName,
    category,
    fundingSource,
    sourceDetail,
    amount,
    paymentDate,
    notes,
  } = req.body;

  const updated = await paymentService.updateVoucher(id, {
    voucherNo,
    payeeName,
    category,
    fundingSource,
    sourceDetail,
    amount: amount !== undefined ? Number(amount) : undefined,
    paymentDate,
    notes,
  });

  sendResponse(res, 200, "Payment voucher updated successfully", updated);
});

export const deleteVoucher = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await paymentService.deleteVoucher(id);
  sendResponse(res, 200, "Voucher deleted successfully");
});