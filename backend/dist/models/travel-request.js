"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TravelRequest = void 0;
const mongoose_1 = require("mongoose");
const travelRequestSchema = new mongoose_1.Schema({
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
exports.TravelRequest = (0, mongoose_1.model)("TravelRequest", travelRequestSchema);
