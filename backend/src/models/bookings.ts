import { Schema, model } from "mongoose";

export type BookingStatus = 'PENDING' | 'IN_PROGRESS' | 'CONFIRMED' | 'CANCELLED';

export interface IConfirmationFile {
  fileName: string;
  base64: string;
  mimeType?: string;
}

export interface IHotelDetails {
  name: string;
  phoneNumber: string;
  roomNumber: string;
  location: string;
}

export interface ICabDetails {
  name: string;
  driverName: string;
  phoneNumber: string;
}

export interface IBooking {
  uuid: string;
  requestUuid: string;
  flight?: string;
  hotel?: string | IHotelDetails; // Support both string (legacy) and object (new)
  cab?: string | ICabDetails; // Support both string (legacy) and object (new)
  confirmationFiles: (string | IConfirmationFile)[]; // Support both string (legacy) and object (new)
  itineraryHtml: string;
  status: BookingStatus;
  from?: string;
  to?: string;
  createdAt: Date;
  updatedAt?: Date;
  confirmedAt?: Date;
}

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
  confirmationFiles: [{ 
    type: Schema.Types.Mixed, // Support both string (legacy) and object (new)
    validate: {
      validator: function(v: any) {
        // Allow string (legacy) or object with fileName and base64
        return typeof v === 'string' || 
               (typeof v === 'object' && v !== null && 
                typeof v.fileName === 'string' && 
                typeof v.base64 === 'string');
      },
      message: 'Confirmation file must be either a string or an object with fileName and base64'
    }
  }],
  itineraryHtml: { type: String, required: false, default: "" },
  status: { type: String, required: true, default: "PENDING", enum: ["PENDING", "IN_PROGRESS", "CONFIRMED", "CANCELLED"] },
  from: { type: String, required: true },
  to: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
  confirmedAt: { type: Date } // When booking was confirmed by travel admin
}, {
  timestamps: false // We're managing timestamps manually
});

export const Booking = model<IBooking>("Booking", bookingSchema);
