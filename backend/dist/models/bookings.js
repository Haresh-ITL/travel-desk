"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Booking = void 0;
const mongoose_1 = require("mongoose");
const bookingSchema = new mongoose_1.Schema({
    uuid: { type: String, required: true, unique: true },
    requestUuid: { type: String, required: true },
    flight: { type: String },
    hotel: {
        type: mongoose_1.Schema.Types.Mixed, // Support both string and object
        validate: {
            validator: function (v) {
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
        type: mongoose_1.Schema.Types.Mixed, // Support both string and object
        validate: {
            validator: function (v) {
                // Allow string (legacy) or object with required fields
                return typeof v === 'string' ||
                    (typeof v === 'object' && v !== null &&
                        typeof v.name === 'string' &&
                        typeof v.driverName === 'string' &&
                        typeof v.phoneNumber === 'string' &&
                        (v.carModel === undefined || typeof v.carModel === 'string') &&
                        (v.carColor === undefined || typeof v.carColor === 'string') &&
                        (v.numberPlate === undefined || typeof v.numberPlate === 'string'));
            },
            message: 'Cab must be either a string or an object with name, driverName, phoneNumber, and optional carModel, carColor, numberPlate'
        }
    },
    confirmationFiles: [{
            type: mongoose_1.Schema.Types.Mixed, // Support both string (legacy) and object (new)
            validate: {
                validator: function (v) {
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
exports.Booking = (0, mongoose_1.model)("Booking", bookingSchema);
