import { Schema, model } from "mongoose";

export interface FlightDetails {
  airline?: string;
  flightNumber?: string;
  departureAirport?: string;
  departureTime?: Date;
  arrivalAirport?: string;
  arrivalTime?: Date;
}

export interface HotelDetails {
  name?: string;
  location?: string;
  checkin?: Date;
  checkout?: Date;
  amount?: number;
}

export interface CabDetails {
  provider?: string;
  pickupTime?: Date;
  notes?: string;
}

export interface IBooking {
  uuid: string;
  requestUuid: string;
  employeeId: string;
  flight?: FlightDetails;
  hotel?: HotelDetails;
  cab?: CabDetails;
  confirmationFiles: string[];
  flightConfirmationUrl?: string;
  hotelConfirmationUrl?: string;
  cabConfirmationUrl?: string;
  itineraryHtml: string;     
  createdAt?: Date;
  updatedAt?: Date;
}

const flightDetailsSchema = new Schema<FlightDetails>({
  airline: { type: String },
  flightNumber: { type: String },
  departureAirport: { type: String },
  departureTime: { type: Date },
  arrivalAirport: { type: String },
  arrivalTime: { type: Date }
}, { _id: false });

const hotelDetailsSchema = new Schema<HotelDetails>({
  name: { type: String },
  location: { type: String },
  checkin: { type: Date },
  checkout: { type: Date },
  amount: { type: Number }
}, { _id: false });

const cabDetailsSchema = new Schema<CabDetails>({
  provider: { type: String },
  pickupTime: { type: Date },
  notes: { type: String }
}, { _id: false });

const bookingSchema = new Schema<IBooking>({
  uuid: { type: String, required: true, unique: true },
  requestUuid: { type: String, required: true },
  employeeId: { type: String, required: true },
  flight: { type: flightDetailsSchema },
  hotel: { type: hotelDetailsSchema },
  cab: { type: cabDetailsSchema },
  confirmationFiles: [{ type: String }],
  flightConfirmationUrl: { type: String },
  hotelConfirmationUrl: { type: String },
  cabConfirmationUrl: { type: String },
  itineraryHtml: { type: String, required: true }
}, {
  timestamps: true
});

export const Booking = model<IBooking>("Booking", bookingSchema);
