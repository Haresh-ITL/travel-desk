import { Schema, model } from "mongoose";

export type TravelStatus = "PENDING" | "APPROVED" | "BOOKED" | "REJECTED";
export type TransportMode = "FLIGHT" | "TRAIN" | "BUS";

export interface ITravelRequest {
  uuid: string;
  employeeId: string;
  primaryManagerId?: string;
  from: string;
  to: string;
  travelType: "DOMESTIC" | "INTERNATIONAL";
  modeOfTransport?: TransportMode;
  startDate: Date;
  endDate: Date;
  purpose: string;
  filePaths: string[];
  idProofUrl?: string;
  passportUrl?: string;
  status: TravelStatus;
  managerComment?: string;
  isDisabled?: boolean;
  disabilityDescription?: string;
  foodPreference?: "VEG" | "NON_VEG";
  specificFoodPreferences?: string;
  localTransportRequired?: boolean;
  numberOfSeats?: number;
  driverPhoneNumber?: string;
  carModel?: string;
  carColor?: string;
  numberPlate?: string;
  hotelStarRating?: string;
  numberOfRooms?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const travelRequestSchema = new Schema<ITravelRequest>({
  uuid: { type: String, required: true, unique: true },
  employeeId: { type: String, required: true },
  primaryManagerId: { type: String },
  from: { type: String, required: true },
  to: { type: String, required: true },
  travelType: { type: String, required: true },
  modeOfTransport: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  purpose: { type: String, required: true },
  filePaths: [{ type: String }],
  idProofUrl: { type: String },
  passportUrl: { type: String },
  status: { type: String, required: true, default: "PENDING" },
  managerComment: { type: String },
  isDisabled: { type: Boolean, default: false },
  disabilityDescription: { type: String },
  foodPreference: { type: String },
  specificFoodPreferences: { type: String },
  localTransportRequired: { type: Boolean, default: false },
  numberOfSeats: { type: Number, default: 1 },
  driverPhoneNumber: { type: String },
  carModel: { type: String },
  carColor: { type: String },
  numberPlate: { type: String },
  hotelStarRating: { type: String },
  numberOfRooms: { type: Number, default: 1 }
}, {
  timestamps: true
});

export const TravelRequest = model<ITravelRequest>(
  "TravelRequest",
  travelRequestSchema
);
