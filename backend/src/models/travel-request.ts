import { Schema, model } from "mongoose";

export type TravelStatus = "PENDING" | "APPROVED" | "BOOKED" | "REJECTED";

export interface ITravelRequest {
  uuid: string;
  employeeId: string;
  managerId?: string;
  from: string;
  to: string;
  travelType: "DOMESTIC" | "INTERNATIONAL";
  startDate: Date;
  endDate: Date;
  purpose: string;
  filePaths: string[];
  status: TravelStatus;
  managerComment?: string;
  createdAt: Date;
}

const travelRequestSchema = new Schema<ITravelRequest>({
  uuid: { type: String, required: true, unique: true },
  employeeId: { type: String, required: true },
  managerId: { type: String },
  from: { type: String, required: true },
  to: { type: String, required: true },
  travelType: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  purpose: { type: String, required: true },
  filePaths: [{ type: String }],
  status: { type: String, required: true, default: "PENDING" },
  managerComment: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export const TravelRequest = model<ITravelRequest>(
  "TravelRequest",
  travelRequestSchema
);
