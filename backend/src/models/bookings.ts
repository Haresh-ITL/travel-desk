import { Schema, model } from "mongoose";

export interface IBooking {
  uuid: string;
  requestUuid: string;
  flight?: string;
  hotel?: string;
  cab?: string;
  confirmationFiles: string[];
  itineraryHtml: string;     
}

const bookingSchema = new Schema<IBooking>({
  uuid: { type: String, required: true, unique: true },
  requestUuid: { type: String, required: true },
  flight: { type: String },
  hotel: { type: String },
  cab: { type: String },
  confirmationFiles: [{ type: String }],
  itineraryHtml: { type: String, required: true }
});

export const Booking = model<IBooking>("Booking", bookingSchema);
