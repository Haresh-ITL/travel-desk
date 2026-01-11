"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.managerRouter = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const uuidv4_1 = require("uuidv4");
const auth_1 = require("../middleware/auth");
const travel_request_1 = require("../models/travel-request");
const bookings_1 = require("../models/bookings");
const user_1 = require("../models/user");
const role_1 = require("../models/role");
const upload = (0, multer_1.default)({ dest: "uploads/" });
exports.managerRouter = (0, express_1.Router)();
// Helper function to format travel request with populated data
async function formatTravelRequest(tr) {
    const employee = await user_1.User.findOne({ uuid: tr.employeeId });
    const employeeRole = employee ? await role_1.Role.findOne({ uuid: employee.roleId }) : null;
    let primaryManager = null;
    let primaryManagerRole = null;
    if (tr.primaryManagerId) {
        primaryManager = await user_1.User.findOne({ uuid: tr.primaryManagerId });
        if (primaryManager) {
            primaryManagerRole = await role_1.Role.findOne({ uuid: primaryManager.roleId });
        }
    }
    return {
        uuid: tr.uuid,
        employeeUuid: tr.employeeId,
        employeeName: (employee === null || employee === void 0 ? void 0 : employee.name) || "",
        from: tr.from,
        to: tr.to,
        travelType: tr.travelType,
        modeOfTransport: tr.modeOfTransport,
        startDate: tr.startDate,
        endDate: tr.endDate,
        purpose: tr.purpose,
        status: tr.status,
        primaryManagerUuid: tr.primaryManagerId,
        primaryManagerName: (primaryManager === null || primaryManager === void 0 ? void 0 : primaryManager.name) || "",
        managerComment: tr.managerComment,
        idProofUrl: tr.idProofUrl,
        passportUrl: tr.passportUrl,
        isDisabled: tr.isDisabled,
        disabilityDescription: tr.disabilityDescription,
        foodPreference: tr.foodPreference,
        specificFoodPreferences: tr.specificFoodPreferences,
        localTransportRequired: tr.localTransportRequired,
        numberOfSeats: tr.numberOfSeats,
        driverPhoneNumber: tr.driverPhoneNumber,
        carModel: tr.carModel,
        carColor: tr.carColor,
        numberPlate: tr.numberPlate,
        hotelStarRating: tr.hotelStarRating,
        numberOfRooms: tr.numberOfRooms,
        createdAt: tr.createdAt,
        updatedAt: tr.updatedAt
    };
}
// Get all requests for this manager (their own requests where they are the employee)
exports.managerRouter.get("/requests", auth_1.requireUser, (0, auth_1.requireRole)(["ROLE_MANAGER", "MANAGER"]), async (req, res) => {
    try {
        // Get requests where manager is the employee (for "My Travel Requests")
        const list = await travel_request_1.TravelRequest.find({
            employeeId: req.user.uuid
        });
        console.log(`Found ${list.length} own requests for manager ${req.user.uuid}`);
        const formatted = await Promise.all(list.map(formatTravelRequest));
        res.json(formatted);
    }
    catch (error) {
        console.error('Error fetching manager requests:', error);
        res.status(500).json({ message: "Failed to fetch requests" });
    }
});
// Get all employee requests for this manager (requests where manager is the primary manager, but NOT their own requests)
exports.managerRouter.get("/team-requests", auth_1.requireUser, (0, auth_1.requireRole)(["ROLE_MANAGER", "MANAGER"]), async (req, res) => {
    try {
        // Get requests where manager is the primary manager BUT exclude requests where manager is also the employee
        // This ensures we only get employee requests, not manager's own requests
        const list = await travel_request_1.TravelRequest.find({
            primaryManagerId: req.user.uuid,
            employeeId: { $ne: req.user.uuid } // Exclude requests where manager is the employee
        });
        console.log(`Found ${list.length} team requests for manager ${req.user.uuid}`);
        const formatted = await Promise.all(list.map(formatTravelRequest));
        res.json(formatted);
    }
    catch (error) {
        console.error('Error fetching team requests:', error);
        res.status(500).json({ message: "Failed to fetch team requests" });
    }
});
// pending requests for this manager (employee requests only, not manager's own)
exports.managerRouter.get("/requests/pending", auth_1.requireUser, (0, auth_1.requireRole)(["ROLE_MANAGER", "MANAGER"]), async (req, res) => {
    try {
        // Get pending requests where manager is the primary manager BUT exclude manager's own requests
        const list = await travel_request_1.TravelRequest.find({
            primaryManagerId: req.user.uuid,
            employeeId: { $ne: req.user.uuid }, // Exclude requests where manager is the employee
            status: "PENDING"
        });
        console.log(`Found ${list.length} pending team requests for manager ${req.user.uuid}`);
        const formatted = await Promise.all(list.map(formatTravelRequest));
        res.json(formatted);
    }
    catch (error) {
        console.error('Error fetching pending requests:', error);
        res.status(500).json({ message: "Failed to fetch pending requests" });
    }
});
// Create travel request (Manager's own request - auto-approved)
exports.managerRouter.post("/requests", auth_1.requireUser, (0, auth_1.requireRole)(["ROLE_MANAGER", "MANAGER"]), upload.fields([
    { name: "files", maxCount: 10 },
    { name: "idProof", maxCount: 1 },
    { name: "passport", maxCount: 1 }
]), async (req, res) => {
    var _a, _b, _c;
    try {
        const { from, to, travelType, startDate, endDate, purpose, modeOfTransport, isDisabled, disabilityDescription, foodPreference, specificFoodPreferences, localTransportRequired, numberOfSeats, driverPhoneNumber, carModel, carColor, numberPlate, hotelStarRating, numberOfRooms } = req.body;
        const files = req.files;
        const filePaths = ((_a = files.files) === null || _a === void 0 ? void 0 : _a.map((f) => f.path)) || [];
        const idProofFile = (_b = files.idProof) === null || _b === void 0 ? void 0 : _b[0];
        const passportFile = (_c = files.passport) === null || _c === void 0 ? void 0 : _c[0];
        // Log received preference data for debugging
        console.log('=== Manager POST /requests - Received Preference Data ===');
        console.log('isDisabled:', isDisabled, typeof isDisabled);
        console.log('disabilityDescription:', disabilityDescription);
        console.log('foodPreference:', foodPreference);
        console.log('specificFoodPreferences:', specificFoodPreferences);
        console.log('localTransportRequired:', localTransportRequired, typeof localTransportRequired);
        console.log('driverPhoneNumber:', driverPhoneNumber);
        console.log('carModel:', carModel);
        console.log('carColor:', carColor);
        console.log('numberPlate:', numberPlate);
        console.log('hotelStarRating:', hotelStarRating);
        console.log('numberOfRooms:', numberOfRooms, typeof numberOfRooms);
        console.log('==========================================================');
        // Handle preference fields - preserve empty strings if provided, but allow undefined
        const preferenceData = {
            isDisabled: isDisabled === 'true' || isDisabled === true || false,
            localTransportRequired: localTransportRequired === 'true' || localTransportRequired === true || false
        };
        // Handle numberOfSeats - convert to number if provided
        if (numberOfSeats !== undefined && numberOfSeats !== null && numberOfSeats !== '') {
            preferenceData.numberOfSeats = parseInt(numberOfSeats.toString(), 10) || 1;
        }
        // Only set string fields if they exist (not undefined/null), but allow empty strings
        if (disabilityDescription !== undefined && disabilityDescription !== null) {
            preferenceData.disabilityDescription = disabilityDescription;
        }
        if (foodPreference !== undefined && foodPreference !== null && foodPreference !== '') {
            preferenceData.foodPreference = foodPreference;
        }
        if (specificFoodPreferences !== undefined && specificFoodPreferences !== null) {
            preferenceData.specificFoodPreferences = specificFoodPreferences;
        }
        if (driverPhoneNumber !== undefined && driverPhoneNumber !== null) {
            preferenceData.driverPhoneNumber = driverPhoneNumber;
        }
        if (carModel !== undefined && carModel !== null) {
            preferenceData.carModel = carModel;
        }
        if (carColor !== undefined && carColor !== null) {
            preferenceData.carColor = carColor;
        }
        if (numberPlate !== undefined && numberPlate !== null) {
            preferenceData.numberPlate = numberPlate;
        }
        if (hotelStarRating !== undefined && hotelStarRating !== null && hotelStarRating !== '') {
            preferenceData.hotelStarRating = hotelStarRating;
        }
        if (numberOfRooms !== undefined && numberOfRooms !== null) {
            preferenceData.numberOfRooms = numberOfRooms ? parseInt(String(numberOfRooms)) : 1;
        }
        else {
            preferenceData.numberOfRooms = 1;
        }
        console.log('=== Processed Preference Data to Save ===');
        console.log(JSON.stringify(preferenceData, null, 2));
        console.log('========================================');
        // Manager creates request for themselves - auto-approved
        const tr = await travel_request_1.TravelRequest.create({
            uuid: (0, uuidv4_1.uuid)(),
            employeeId: req.user.uuid, // Manager is the employee for their own request
            primaryManagerId: req.user.uuid, // Manager is also the manager
            from,
            to,
            travelType,
            modeOfTransport,
            startDate,
            endDate,
            purpose,
            filePaths,
            idProofUrl: idProofFile === null || idProofFile === void 0 ? void 0 : idProofFile.path,
            passportUrl: passportFile === null || passportFile === void 0 ? void 0 : passportFile.path,
            status: "APPROVED", // Auto-approved for manager's own requests
            managerComment: "Auto-approved: Manager's own request",
            ...preferenceData
        });
        console.log('=== Saved Travel Request (Manager) ===');
        console.log('isDisabled:', tr.isDisabled);
        console.log('disabilityDescription:', tr.disabilityDescription);
        console.log('foodPreference:', tr.foodPreference);
        console.log('specificFoodPreferences:', tr.specificFoodPreferences);
        console.log('localTransportRequired:', tr.localTransportRequired);
        console.log('driverPhoneNumber:', tr.driverPhoneNumber);
        console.log('carModel:', tr.carModel);
        console.log('carColor:', tr.carColor);
        console.log('numberPlate:', tr.numberPlate);
        console.log('hotelStarRating:', tr.hotelStarRating);
        console.log('numberOfRooms:', tr.numberOfRooms);
        console.log('=======================================');
        const formatted = await formatTravelRequest(tr);
        res.json(formatted);
    }
    catch (error) {
        console.error('Error creating manager request:', error);
        res.status(500).json({ message: "Failed to create travel request" });
    }
});
// approve or reject
exports.managerRouter.put("/requests/:uuid/decision", auth_1.requireUser, (0, auth_1.requireRole)(["ROLE_MANAGER", "MANAGER"]), async (req, res) => {
    try {
        const { status, comment } = req.body; // APPROVED / REJECTED
        const tr = await travel_request_1.TravelRequest.findOne({ uuid: req.params.uuid });
        if (!tr)
            return res.status(404).json({ message: "Not found" });
        if (tr.primaryManagerId !== req.user.uuid)
            return res.status(403).json({ message: "Forbidden" });
        tr.status = status;
        tr.managerComment = comment;
        await tr.save();
        // Send email notification if request is approved
        if (status === "APPROVED") {
            try {
                const employee = await user_1.User.findOne({ uuid: tr.employeeId });
                if (employee && employee.email) {
                    const { sendApprovalEmail } = await Promise.resolve().then(() => __importStar(require("../utils/email.service")));
                    await sendApprovalEmail(employee.email, employee.name, {
                        from: tr.from,
                        to: tr.to,
                        travelType: tr.travelType,
                        startDate: tr.startDate,
                        endDate: tr.endDate,
                        purpose: tr.purpose,
                        managerComment: comment
                    });
                }
            }
            catch (emailError) {
                // Log email error but don't fail the request
                console.error('Error sending approval email:', emailError);
            }
        }
        const formatted = await formatTravelRequest(tr);
        res.json(formatted);
    }
    catch (error) {
        console.error('Error updating request decision:', error);
        res.status(500).json({ message: "Failed to update request" });
    }
});
// Get booking for a specific travel request (for viewing itinerary)
exports.managerRouter.get("/requests/:requestUuid/booking", auth_1.requireUser, (0, auth_1.requireRole)(["ROLE_MANAGER", "MANAGER"]), async (req, res) => {
    try {
        const { requestUuid } = req.params;
        const managerUuid = req.user.uuid;
        // First verify the travel request belongs to this manager's team
        const travelRequest = await travel_request_1.TravelRequest.findOne({
            uuid: requestUuid,
            primaryManagerId: managerUuid
        });
        if (!travelRequest) {
            return res.status(404).json({ message: "Travel request not found or access denied" });
        }
        // Find booking for this request
        const booking = await bookings_1.Booking.findOne({ requestUuid }).lean();
        if (!booking) {
            return res.status(404).json({ message: "Booking not found for this request" });
        }
        // Return booking with travel request details
        const employee = await user_1.User.findOne({ uuid: travelRequest.employeeId }).lean();
        res.json({
            uuid: booking.uuid,
            requestUuid: booking.requestUuid,
            flight: booking.flight,
            hotel: booking.hotel,
            cab: booking.cab,
            confirmationFiles: booking.confirmationFiles || [],
            itineraryHtml: booking.itineraryHtml || "",
            status: booking.status,
            from: booking.from,
            to: booking.to,
            createdAt: booking.createdAt,
            updatedAt: booking.updatedAt,
            confirmedAt: booking.confirmedAt,
            travelRequest: {
                uuid: travelRequest.uuid,
                employeeId: travelRequest.employeeId,
                employeeName: (employee === null || employee === void 0 ? void 0 : employee.name) || travelRequest.employeeId,
                from: travelRequest.from,
                to: travelRequest.to,
                travelType: travelRequest.travelType,
                startDate: travelRequest.startDate,
                endDate: travelRequest.endDate,
                purpose: travelRequest.purpose,
                status: travelRequest.status,
                filePaths: travelRequest.filePaths || []
            }
        });
    }
    catch (error) {
        console.error('Error fetching booking for manager:', error);
        res.status(500).json({
            message: "Failed to fetch booking",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
});
