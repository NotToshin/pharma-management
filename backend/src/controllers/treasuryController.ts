import { Request, Response } from "express";
import { treasuryService } from "../services/treasuryService";
import { sendResponse } from "../utils/response";
import { catchAsync } from "../utils/catchAsync";

export const getAllTreasuryDeposits = catchAsync(async (req: Request, res: Response) => {
  const deposits = await treasuryService.getAllDeposits();
  sendResponse(res, 200, "Treasury deposits retrieved successfully", deposits);
});

export const postTreasuryDeposit = catchAsync(async (req: Request, res: Response) => {
  const { destinationType, destinationName, amount } = req.body;

  const depositRecord = await treasuryService.createDeposit({
    destinationType,
    destinationName,
    amount: Number(amount) || 0,
  });

  sendResponse(res, 201, "Treasury deposit created successfully", depositRecord);
});