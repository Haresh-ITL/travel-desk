"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.employeeRouter = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const uuidv4_1 = require("uuidv4");
const auth_1 = require("../middleware/auth");
const travel_request_1 = require("../models/travel-request");
const bookings_1 = require("../models/bookings");
const user_1 = require("../models/user");
const role_1 = require("../models/role");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const util_1 = require("util");
const readFile = (0, util_1.promisify)(fs_1.default.readFile);
const upload = (0, multer_1.default)({ dest: "uploads/" });
exports.employeeRouter = (0, express_1.Router)();
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
exports.employeeRouter.post("/requests", auth_1.requireUser, (0, auth_1.requireRole)(["ROLE_EMPLOYEE", "EMPLOYEE"]), upload.fields([
    { name: "files", maxCount: 10 },
    { name: "idProof", maxCount: 1 },
    { name: "passport", maxCount: 1 }
]), async (req, res) => {
    var _a, _b, _c;
    try {
        const { from, to, travelType, startDate, endDate, purpose, primaryManagerUuid, managerId, modeOfTransport, isDisabled, disabilityDescription, foodPreference, specificFoodPreferences, localTransportRequired, numberOfSeats, driverPhoneNumber, carModel, carColor, numberPlate, hotelStarRating, numberOfRooms } = req.body;
        // Log received preference data for debugging
        console.log('=== Employee POST /requests - Received Preference Data ===');
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
        // Support both managerId (from frontend) and primaryManagerUuid
        const managerUuid = primaryManagerUuid || managerId;
        const files = req.files;
        const filePaths = ((_a = files.files) === null || _a === void 0 ? void 0 : _a.map((f) => f.path)) || [];
        const idProofFile = (_b = files.idProof) === null || _b === void 0 ? void 0 : _b[0];
        const passportFile = (_c = files.passport) === null || _c === void 0 ? void 0 : _c[0];
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
        const tr = await travel_request_1.TravelRequest.create({
            uuid: (0, uuidv4_1.uuid)(),
            employeeId: req.user.uuid,
            primaryManagerId: managerUuid,
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
            status: "PENDING",
            ...preferenceData
        });
        console.log('=== Saved Travel Request ===');
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
        console.log('===========================');
        const formatted = await formatTravelRequest(tr);
        res.json(formatted);
    }
    catch (error) {
        console.error('Error creating travel request:', error);
        res.status(500).json({ message: "Failed to create travel request" });
    }
});
// employee dashboard: own requests
exports.employeeRouter.get("/requests", auth_1.requireUser, (0, auth_1.requireRole)(["ROLE_EMPLOYEE", "EMPLOYEE"]), async (req, res) => {
    try {
        const employeeUuid = req.user.uuid;
        console.log('Fetching requests for employee:', employeeUuid);
        const list = await travel_request_1.TravelRequest.find({ employeeId: employeeUuid });
        console.log('Found', list.length, 'requests for employee', employeeUuid);
        const formatted = await Promise.all(list.map(formatTravelRequest));
        // Log preference data from first request for debugging
        if (formatted.length > 0) {
            console.log('=== GET /requests - First Request Preference Data ===');
            const firstReq = formatted[0];
            console.log('isDisabled:', firstReq.isDisabled);
            console.log('disabilityDescription:', firstReq.disabilityDescription);
            console.log('foodPreference:', firstReq.foodPreference);
            console.log('specificFoodPreferences:', firstReq.specificFoodPreferences);
            console.log('localTransportRequired:', firstReq.localTransportRequired);
            console.log('driverPhoneNumber:', firstReq.driverPhoneNumber);
            console.log('carModel:', firstReq.carModel);
            console.log('carColor:', firstReq.carColor);
            console.log('numberPlate:', firstReq.numberPlate);
            console.log('hotelStarRating:', firstReq.hotelStarRating);
            console.log('numberOfRooms:', firstReq.numberOfRooms);
            console.log('=====================================================');
        }
        // Log status counts for debugging
        const statusCounts = {
            PENDING: formatted.filter(r => r.status === 'PENDING').length,
            APPROVED: formatted.filter(r => r.status === 'APPROVED').length,
            BOOKED: formatted.filter(r => r.status === 'BOOKED').length,
            REJECTED: formatted.filter(r => r.status === 'REJECTED').length,
            TOTAL: formatted.length
        };
        console.log('Status counts for employee:', statusCounts);
        res.json(formatted);
    }
    catch (error) {
        console.error('Error fetching employee requests:', error);
        res.status(500).json({ message: "Failed to fetch requests" });
    }
});
// Get employee profile
exports.employeeRouter.get("/profile", auth_1.requireUser, (0, auth_1.requireRole)(["ROLE_EMPLOYEE", "EMPLOYEE"]), async (req, res) => {
    var _a;
    try {
        const user = await user_1.User.findOne({ uuid: req.user.uuid });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const role = await role_1.Role.findOne({ uuid: user.roleId });
        console.log('=== Fetching Profile ===');
        console.log('User UUID:', req.user.uuid);
        console.log('User documents from DB:', user.documents);
        console.log('Documents count:', ((_a = user.documents) === null || _a === void 0 ? void 0 : _a.length) || 0);
        // Format documents with base64 data
        const documents = (user.documents || []).map(doc => {
            var _a;
            const formatted = {
                type: doc.type,
                url: doc.url || undefined, // For backward compatibility
                data: doc.data || undefined, // Base64 data URL
                mimeType: doc.mimeType || undefined,
                fileName: doc.fileName || undefined,
                uploadedAt: doc.uploadedAt || undefined
            };
            console.log(`Formatted document ${doc.type}:`, {
                hasData: !!formatted.data,
                dataLength: ((_a = formatted.data) === null || _a === void 0 ? void 0 : _a.length) || 0,
                hasMimeType: !!formatted.mimeType,
                hasFileName: !!formatted.fileName
            });
            return formatted;
        });
        console.log('Total formatted documents:', documents.length);
        console.log('Documents array:', JSON.stringify(documents.map(d => ({ type: d.type, hasData: !!d.data })), null, 2));
        const response = {
            uuid: user.uuid,
            name: user.name,
            email: user.email,
            roleName: (role === null || role === void 0 ? void 0 : role.name) || "",
            documents: documents || [], // Ensure it's always an array
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };
        console.log('Sending profile response with', documents.length, 'documents');
        console.log('Response has documents field:', 'documents' in response);
        console.log('Response documents is array:', Array.isArray(response.documents));
        res.json(response);
    }
    catch (error) {
        console.error("Error fetching profile:", error);
        res.status(500).json({ message: "Failed to fetch profile", error: error instanceof Error ? error.message : "Unknown error" });
    }
});
// Update employee profile
exports.employeeRouter.put("/profile", auth_1.requireUser, (0, auth_1.requireRole)(["ROLE_EMPLOYEE", "EMPLOYEE"]), async (req, res) => {
    try {
        const { name, email } = req.body;
        const user = await user_1.User.findOne({ uuid: req.user.uuid });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (name)
            user.name = name;
        if (email) {
            const existing = await user_1.User.findOne({ email, uuid: { $ne: req.user.uuid } });
            if (existing) {
                return res.status(400).json({ message: "Email already exists" });
            }
            user.email = email;
        }
        await user.save();
        const role = await role_1.Role.findOne({ uuid: user.roleId });
        res.json({
            uuid: user.uuid,
            name: user.name,
            email: user.email,
            roleName: (role === null || role === void 0 ? void 0 : role.name) || "",
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        });
    }
    catch (error) {
        res.status(500).json({ message: "Failed to update profile" });
    }
});
// Upload document (ID proof, passport, etc.)
exports.employeeRouter.post("/profile/documents", auth_1.requireUser, (0, auth_1.requireRole)(["ROLE_EMPLOYEE", "EMPLOYEE"]), upload.single("file"), async (req, res) => {
    var _a, _b, _c, _d;
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        const { type } = req.body;
        if (!type) {
            return res.status(400).json({ message: "Document type is required" });
        }
        const user = await user_1.User.findOne({ uuid: req.user.uuid });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        console.log('=== Document Upload Started ===');
        console.log('User UUID:', req.user.uuid);
        console.log('Document Type:', type);
        console.log('File Name:', req.file.originalname);
        console.log('File Path:', req.file.path);
        console.log('File Size:', req.file.size, 'bytes');
        // Read file and convert to base64
        const fileBuffer = await readFile(req.file.path);
        const base64Data = fileBuffer.toString('base64');
        const mimeType = req.file.mimetype || 'application/octet-stream';
        // Construct data URL for response
        const dataUrl = `data:${mimeType};base64,${base64Data}`;
        // Also keep file URL for backward compatibility
        const fileName = path_1.default.basename(req.file.path);
        const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${fileName}`;
        console.log('File converted to base64. Size:', base64Data.length, 'characters');
        console.log('MIME Type:', mimeType);
        // Initialize documents array if it doesn't exist
        if (!user.documents) {
            user.documents = [];
            console.log('Initialized empty documents array');
        }
        // Remove existing document of the same type if it exists
        const beforeCount = user.documents.length;
        user.documents = user.documents.filter(doc => doc.type !== type);
        const removedCount = beforeCount - user.documents.length;
        if (removedCount > 0) {
            console.log(`Removed ${removedCount} existing document(s) of type ${type}`);
        }
        // Add new document with base64 data
        const newDocument = {
            type: type,
            url: fileUrl, // Keep for backward compatibility
            data: dataUrl, // Base64 data URL
            mimeType: mimeType,
            fileName: req.file.originalname || fileName,
            uploadedAt: new Date()
        };
        // Ensure documents array exists and is an array
        if (!Array.isArray(user.documents)) {
            user.documents = [];
        }
        // Add new document
        user.documents.push(newDocument);
        console.log('Added new document to array. Total documents:', user.documents.length);
        // Mark the documents array as modified to ensure Mongoose saves it
        user.markModified('documents');
        // Save to database
        const savedUser = await user.save();
        console.log('User saved to database');
        console.log('Document count after save:', ((_a = savedUser.documents) === null || _a === void 0 ? void 0 : _a.length) || 0);
        if (savedUser.documents && savedUser.documents.length > 0) {
            const lastDoc = savedUser.documents[savedUser.documents.length - 1];
            console.log('Document has data:', !!(lastDoc === null || lastDoc === void 0 ? void 0 : lastDoc.data));
            console.log('Document data length:', ((_b = lastDoc === null || lastDoc === void 0 ? void 0 : lastDoc.data) === null || _b === void 0 ? void 0 : _b.length) || 0);
        }
        // Verify the save by fetching the user again
        const verifyUser = await user_1.User.findOne({ uuid: req.user.uuid });
        if (verifyUser && verifyUser.documents) {
            const savedDoc = verifyUser.documents.find(d => d.type === type);
            console.log('Verified document from DB:', {
                type: savedDoc === null || savedDoc === void 0 ? void 0 : savedDoc.type,
                hasData: !!(savedDoc === null || savedDoc === void 0 ? void 0 : savedDoc.data),
                dataLength: ((_c = savedDoc === null || savedDoc === void 0 ? void 0 : savedDoc.data) === null || _c === void 0 ? void 0 : _c.length) || 0,
                mimeType: savedDoc === null || savedDoc === void 0 ? void 0 : savedDoc.mimeType,
                fileName: savedDoc === null || savedDoc === void 0 ? void 0 : savedDoc.fileName
            });
        }
        else {
            console.error('ERROR: Could not verify user after save!');
        }
        console.log('=== Document Upload Completed ===');
        // Prepare response object
        const responseData = {
            url: fileUrl,
            data: dataUrl, // Base64 data URL
            mimeType: mimeType,
            type: type,
            uploadedAt: newDocument.uploadedAt,
            fileName: newDocument.fileName,
            message: "Document saved successfully to database as base64"
        };
        console.log('Sending response with fields:', Object.keys(responseData));
        console.log('Response data URL length:', ((_d = responseData.data) === null || _d === void 0 ? void 0 : _d.length) || 0);
        console.log('Response type:', responseData.type);
        console.log('Response mimeType:', responseData.mimeType);
        // Return the saved document with base64 data
        res.json(responseData);
    }
    catch (error) {
        console.error('=== Error uploading document ===');
        console.error('Error details:', error);
        if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }
        res.status(500).json({
            message: "Failed to upload document",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
});
// Get mapped managers for employee
exports.employeeRouter.get("/managers", auth_1.requireUser, (0, auth_1.requireRole)(["ROLE_EMPLOYEE", "EMPLOYEE"]), async (req, res) => {
    try {
        const user = await user_1.User.findOne({ uuid: req.user.uuid });
        if (!user || !user.managerIds || user.managerIds.length === 0) {
            return res.json([]);
        }
        const managers = await user_1.User.find({ uuid: { $in: user.managerIds } });
        const managersWithRoles = await Promise.all(managers.map(async (manager) => {
            const role = await role_1.Role.findOne({ uuid: manager.roleId });
            return {
                uuid: manager.uuid,
                name: manager.name,
                email: manager.email,
                roleName: (role === null || role === void 0 ? void 0 : role.name) || "",
                createdAt: manager.createdAt,
                updatedAt: manager.updatedAt
            };
        }));
        res.json(managersWithRoles);
    }
    catch (error) {
        res.status(500).json({ message: "Failed to fetch managers" });
    }
});
// Get employee dashboard statistics
exports.employeeRouter.get("/dashboard/stats", auth_1.requireUser, (0, auth_1.requireRole)(["ROLE_EMPLOYEE", "EMPLOYEE"]), async (req, res) => {
    try {
        const employeeUuid = req.user.uuid;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // Total trips - all requests for this employee
        const totalTrips = await travel_request_1.TravelRequest.countDocuments({ employeeId: employeeUuid });
        // Upcoming trips - approved or booked requests with startDate >= today
        const upcomingTrips = await travel_request_1.TravelRequest.countDocuments({
            employeeId: employeeUuid,
            status: { $in: ["APPROVED", "BOOKED"] },
            startDate: { $gte: today }
        });
        // Pending approvals - requests with status PENDING
        const pendingApprovals = await travel_request_1.TravelRequest.countDocuments({
            employeeId: employeeUuid,
            status: "PENDING"
        });
        const stats = {
            totalTrips,
            upcomingTrips,
            pendingApprovals
        };
        console.log('Employee dashboard stats for', employeeUuid, ':', stats);
        res.json(stats);
    }
    catch (error) {
        console.error('Error fetching employee dashboard stats:', error);
        res.status(500).json({ message: "Failed to fetch dashboard statistics" });
    }
});
// Debug endpoint to check user documents (for testing)
exports.employeeRouter.get("/profile/documents/debug", auth_1.requireUser, (0, auth_1.requireRole)(["ROLE_EMPLOYEE", "EMPLOYEE"]), async (req, res) => {
    var _a;
    try {
        const user = await user_1.User.findOne({ uuid: req.user.uuid });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json({
            userId: user.uuid,
            userEmail: user.email,
            documentsCount: ((_a = user.documents) === null || _a === void 0 ? void 0 : _a.length) || 0,
            documents: user.documents || [],
            rawDocuments: JSON.stringify(user.documents, null, 2)
        });
    }
    catch (error) {
        res.status(500).json({ message: "Failed to fetch documents", error: error instanceof Error ? error.message : "Unknown error" });
    }
});
// Get booking for a specific travel request (for viewing itinerary)
exports.employeeRouter.get("/requests/:requestUuid/booking", auth_1.requireUser, (0, auth_1.requireRole)(["ROLE_EMPLOYEE", "EMPLOYEE"]), async (req, res) => {
    try {
        const { requestUuid } = req.params;
        const employeeUuid = req.user.uuid;
        // First verify the travel request belongs to this employee
        const travelRequest = await travel_request_1.TravelRequest.findOne({ uuid: requestUuid, employeeId: employeeUuid });
        if (!travelRequest) {
            return res.status(404).json({ message: "Travel request not found or access denied" });
        }
        // Find booking for this request
        const booking = await bookings_1.Booking.findOne({ requestUuid }).lean();
        if (!booking) {
            return res.status(404).json({ message: "Booking not found for this request" });
        }
        // Return booking with travel request details
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
        console.error('Error fetching booking for employee:', error);
        res.status(500).json({
            message: "Failed to fetch booking",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
});
// Get all bookings for employee's travel requests
exports.employeeRouter.get("/bookings", auth_1.requireUser, (0, auth_1.requireRole)(["ROLE_EMPLOYEE", "EMPLOYEE"]), async (req, res) => {
    try {
        const employeeUuid = req.user.uuid;
        // Find all travel requests for this employee
        const travelRequests = await travel_request_1.TravelRequest.find({ employeeId: employeeUuid }).select("uuid").lean();
        const requestUuids = travelRequests.map(tr => tr.uuid);
        if (requestUuids.length === 0) {
            return res.json([]);
        }
        // Find all bookings for these requests
        const bookings = await bookings_1.Booking.find({ requestUuid: { $in: requestUuids } })
            .sort({ createdAt: -1 })
            .lean();
        // Map bookings with travel request details
        const bookingsWithDetails = await Promise.all(bookings.map(async (booking) => {
            const request = travelRequests.find(tr => tr.uuid === booking.requestUuid);
            return {
                uuid: booking.uuid,
                requestUuid: booking.requestUuid,
                flight: booking.flight,
                hotel: booking.hotel,
                cab: booking.cab,
                itineraryHtml: booking.itineraryHtml,
                confirmationFiles: booking.confirmationFiles || [],
                status: booking.status,
                from: booking.from,
                to: booking.to,
                createdAt: booking.createdAt,
                updatedAt: booking.updatedAt,
                confirmedAt: booking.confirmedAt
            };
        }));
        res.json(bookingsWithDetails);
    }
    catch (error) {
        console.error('Error fetching bookings for employee:', error);
        res.status(500).json({
            message: "Failed to fetch bookings",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
});
