import { Schema, model } from "mongoose";

export type BookingStatus = "PENDING" | "IN_PROGRESS" | "CONFIRMED" | "CANCELLED";

export interface ICabDetails {
  name: string;
  driverName: string;
  phoneNumber: string;
}

export interface IHotelDetails {
  name: string;
  phoneNumber: string;
  roomNumber: string;
  location: string;
}

export interface IBooking {
  uuid: string;
  requestUuid: string;
  flight?: string;
  hotel?: string | IHotelDetails; // Support both string (legacy) and object (new)
  cab?: string | ICabDetails; // Support both string (legacy) and object (new)
  confirmationFiles: string[];
  itineraryHtml: string;
  status: BookingStatus;
  from?: string;
  to?: string;
  createdAt: Date;
  updatedAt?: Date;
  confirmedAt?: Date; // When booking was confirmed by travel admin
}

const cabDetailsSchema = new Schema<ICabDetails>({
  name: { type: String, required: true },
  driverName: { type: String, required: true },
  phoneNumber: { type: String, required: true }
}, { _id: false });

const bookingSchema = new Schema<IBooking>({
  uuid: { type: String, required: true, unique: true },
  requestUuid: { type: String, required: true },
  flight: { type: String },
  hotel: { 
    type: Schema.Types.Mixed, // Support both string and object
    validate: {
      validator: function(v: any) {
        // Allow string (legacy) or object with required fields
        return typeof v === 'string' || 
               (typeof v === 'object' && v !== null && 
                typeof v.name === 'string' && 
                typeof v.phoneNumber === 'string' &&
                typeof v.roomNumber === 'string' &&
                typeof v.location === 'string');
      },
      message: 'Hotel must be either a string or an object with name, phoneNumber, roomNumber, and location'
    }
  },
  cab: { 
    type: Schema.Types.Mixed, // Support both string and object
    validate: {
      validator: function(v: any) {
        // Allow string (legacy) or object with required fields
        return typeof v === 'string' || 
               (typeof v === 'object' && v !== null && 
                typeof v.name === 'string' && 
                typeof v.driverName === 'string' && 
                typeof v.phoneNumber === 'string');
      },
      message: 'Cab must be either a string or an object with name, driverName, and phoneNumber'
    }
  },
  confirmationFiles: [{ type: String }],
  itineraryHtml: { type: String, required: true },
  status: { type: String, required: true, default: "PENDING", enum: ["PENDING", "IN_PROGRESS", "CONFIRMED", "CANCELLED"] },
  from: { type: String },
  to: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
  confirmedAt: { type: Date } // When booking was confirmed by travel admin
});

export const Booking = model<IBooking>("Booking", bookingSchema);
