"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.travelDeskRouter = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const uuidv4_1 = require("uuidv4");
const auth_1 = require("../middleware/auth");
const bookings_1 = require("../models/bookings");
const travel_request_1 = require("../models/travel-request");
const user_1 = require("../models/user");
const role_1 = require("../models/role");
const path_1 = __importDefault(require("path"));
const upload = (0, multer_1.default)({ dest: "uploads/" });
exports.travelDeskRouter = (0, express_1.Router)();
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
// view approved requests
exports.travelDeskRouter.get("/requests/approved", auth_1.requireUser, (0, auth_1.requireRole)(["ROLE_TRAVEL_DESK_ADMIN", "TRAVEL_DESK_ADMIN"]), async (req, res) => {
    try {
        const list = await travel_request_1.TravelRequest.find({ status: "APPROVED" });
        const formatted = await Promise.all(list.map(formatTravelRequest));
        res.json(formatted);
    }
    catch (error) {
        res.status(500).json({ message: "Failed to fetch approved requests" });
    }
});
// Get user documents (profile files) for a specific employee/manager
exports.travelDeskRouter.get("/users/:employeeUuid/documents", auth_1.requireUser, (0, auth_1.requireRole)(["ROLE_TRAVEL_DESK_ADMIN", "TRAVEL_DESK_ADMIN"]), async (req, res) => {
    try {
        const { employeeUuid } = req.params;
        const user = await user_1.User.findOne({ uuid: employeeUuid });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // Format documents with base64 data
        const documents = (user.documents || []).map(doc => ({
            type: doc.type,
            url: doc.url || undefined,
            data: doc.data || undefined, // Base64 data URL
            mimeType: doc.mimeType || undefined,
            fileName: doc.fileName || undefined,
            uploadedAt: doc.uploadedAt || undefined
        }));
        res.json({
            uuid: user.uuid,
            name: user.name,
            email: user.email,
            documents: documents || []
        });
    }
    catch (error) {
        console.error("Error fetching user documents:", error);
        res.status(500).json({ message: "Failed to fetch user documents" });
    }
});
// Update travel request and set status to BOOKED (with file upload support)
// NOTE: This endpoint is deprecated. Use POST /bookings instead to create proper bookings.
// This endpoint is kept for backward compatibility but should create a booking record.
exports.travelDeskRouter.put("/requests/:uuid/book", auth_1.requireUser, (0, auth_1.requireRole)(["ROLE_TRAVEL_DESK_ADMIN", "TRAVEL_DESK_ADMIN"]), upload.fields([
    { name: "files", maxCount: 10 },
    { name: "bookingDocuments", maxCount: 10 }
]), async (req, res) => {
    try {
        const { uuid: requestUuid } = req.params;
        console.log('PUT /requests/:uuid/book - UUID:', requestUuid);
        const travelRequest = await travel_request_1.TravelRequest.findOne({ uuid: requestUuid });
        if (!travelRequest) {
            console.log('Travel request not found for UUID:', requestUuid);
            return res.status(404).json({ message: "Travel request not found", uuid: requestUuid });
        }
        console.log('Found travel request:', travelRequest.uuid, 'Status:', travelRequest.status);
        // BUSINESS RULE: Only APPROVED requests can be booked
        if (travelRequest.status !== "APPROVED") {
            return res.status(400).json({
                message: `Cannot book request with status: ${travelRequest.status}. Only APPROVED requests can be booked.`
            });
        }
        // Handle file uploads
        const files = req.files;
        const uploadedFiles = files.files || [];
        const bookingDocs = files.bookingDocuments || [];
        // Combine all uploaded files
        const allUploadedFiles = [...uploadedFiles, ...bookingDocs];
        console.log('Uploaded files count:', allUploadedFiles.length);
        if (allUploadedFiles.length > 0) {
            // Add new file paths to existing filePaths array
            const newFilePaths = allUploadedFiles.map((f) => f.path);
            travelRequest.filePaths = [...(travelRequest.filePaths || []), ...newFilePaths];
            console.log('Added file paths:', newFilePaths);
        }
        // Create a basic booking record if one doesn't exist
        let booking = await bookings_1.Booking.findOne({ requestUuid });
        if (!booking) {
            booking = await bookings_1.Booking.create({
                uuid: (0, uuidv4_1.uuid)(),
                requestUuid: requestUuid,
                flight: undefined,
                hotel: undefined,
                cab: undefined,
                confirmationFiles: [],
                itineraryHtml: "", // Empty - generate on demand
                status: "PENDING",
                from: travelRequest.from,
                to: travelRequest.to
            });
            console.log('Created basic booking record:', booking.uuid);
        }
        // Update travel request status to BOOKED
        travelRequest.status = "BOOKED";
        await travelRequest.save();
        console.log('Travel request updated successfully. New status:', travelRequest.status);
        const formatted = await formatTravelRequest(travelRequest);
        res.json(formatted);
    }
    catch (error) {
        console.error('Error updating travel request status:', error);
        res.status(500).json({
            message: "Failed to update travel request",
            error: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined
        });
    }
});
// assign booking + itinerary (accepts JSON)
exports.travelDeskRouter.post("/bookings", auth_1.requireUser, (0, auth_1.requireRole)(["ROLE_TRAVEL_DESK_ADMIN", "TRAVEL_DESK_ADMIN"]), async (req, res) => {
    try {
        // Log the entire request for debugging
        console.log('POST /bookings - Request received');
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        console.log('Request body keys:', Object.keys(req.body || {}));
        console.log('Content-Type:', req.get('Content-Type'));
        const { requestUuid, travelRequestId, // Support both field names for compatibility
        flightAirline, flightNumber, flightDepartureAirport, flightDepartureTime, flightArrivalAirport, flightArrivalTime, hotelName, hotelLocation, hotelRoomNumber, hotelCheckin, hotelCheckout, hotelAmount, cabProvider, cabDriverName, cabPickupTime, cabNotes, itineraryHtml, flightConfirmationUrl, hotelConfirmationUrl, cabConfirmationUrl, confirmationFiles, // Array of { fileName, base64, mimeType }
        hotel, // Object format: { name, roomNumber, location, phoneNumber }
        cab, // Object format: { name, driverName, phoneNumber, carModel, carColor, numberPlate }
        driverPhoneNumber, carModel, carColor, numberPlate } = req.body || {};
        // Use requestUuid or travelRequestId (support both for compatibility)
        const finalRequestUuid = requestUuid || travelRequestId;
        console.log('Extracted requestUuid:', requestUuid);
        console.log('Extracted travelRequestId:', travelRequestId);
        console.log('Final requestUuid:', finalRequestUuid);
        if (!finalRequestUuid) {
            console.error('POST /bookings - Missing requestUuid. Body:', JSON.stringify(req.body));
            return res.status(400).json({
                message: "requestUuid is required",
                received: {
                    requestUuid: requestUuid || null,
                    travelRequestId: travelRequestId || null,
                    bodyKeys: Object.keys(req.body || {}),
                    bodyType: typeof req.body,
                    bodyStringified: JSON.stringify(req.body)
                }
            });
        }
        console.log('POST /bookings - Creating booking for requestUuid:', finalRequestUuid);
        const travelRequest = await travel_request_1.TravelRequest.findOne({ uuid: finalRequestUuid });
        if (!travelRequest) {
            console.error('Travel request not found for UUID:', finalRequestUuid);
            return res.status(404).json({
                message: "Request not found",
                requestUuid: finalRequestUuid
            });
        }
        console.log('Found travel request:', {
            uuid: travelRequest.uuid,
            status: travelRequest.status,
            employeeId: travelRequest.employeeId,
            from: travelRequest.from,
            to: travelRequest.to,
            fromType: typeof travelRequest.from,
            toType: typeof travelRequest.to
        });
        // BUSINESS RULE: Only APPROVED requests can be booked
        if (travelRequest.status !== "APPROVED") {
            console.error('Cannot book request - status is:', travelRequest.status);
            return res.status(400).json({
                message: `Cannot create booking for request with status: ${travelRequest.status}. Only APPROVED requests can be booked.`,
                currentStatus: travelRequest.status,
                requestUuid: finalRequestUuid
            });
        }
        // Check if booking already exists for this request
        const existingBooking = await bookings_1.Booking.findOne({ requestUuid: finalRequestUuid });
        if (existingBooking) {
            return res.status(400).json({
                message: "Booking already exists for this request. Use PUT /bookings/:uuid to update."
            });
        }
        // For POST route, we'll accept flight/hotel/cab as strings (simple text) or objects
        // The frontend can send them as strings for simplicity or as objects
        const flightValue = flightAirline || flightNumber
            ? `${flightAirline || ''} ${flightNumber || ''}`.trim()
            : undefined;
        // Handle hotel - prefer object format, fallback to string
        let hotelValue = undefined;
        if (hotel && typeof hotel === 'object') {
            // Object format: { name, roomNumber, location, phoneNumber }
            hotelValue = {
                name: hotel.name || hotelName || '',
                roomNumber: hotel.roomNumber || hotelRoomNumber || '',
                location: hotel.location || hotelLocation || '',
                phoneNumber: hotel.phoneNumber || ''
            };
        }
        else if (hotelName || hotelLocation || hotelRoomNumber) {
            // String format for backward compatibility
            const hotelParts = [];
            if (hotelName)
                hotelParts.push(hotelName);
            if (hotelRoomNumber)
                hotelParts.push(`Room: ${hotelRoomNumber}`);
            if (hotelLocation)
                hotelParts.push(hotelLocation);
            hotelValue = hotelParts.length > 0 ? hotelParts.join(', ') : undefined;
        }
        // Handle cab - prefer object format, fallback to string
        let cabValue = undefined;
        if (cab && typeof cab === 'object') {
            // Object format: { name, driverName, phoneNumber, carModel, carColor, numberPlate }
            cabValue = {
                name: cab.name || cabProvider || 'Local Transport',
                driverName: cab.driverName || cabDriverName || '',
                phoneNumber: cab.phoneNumber || driverPhoneNumber || '',
                carModel: cab.carModel || carModel || '',
                carColor: cab.carColor || carColor || '',
                numberPlate: cab.numberPlate || numberPlate || ''
            };
        }
        else if (cabProvider || cabDriverName || driverPhoneNumber || carModel || carColor || numberPlate) {
            // If separate fields are provided, create object
            cabValue = {
                name: cabProvider || 'Local Transport',
                driverName: cabDriverName || '',
                phoneNumber: driverPhoneNumber || '',
                carModel: carModel || '',
                carColor: carColor || '',
                numberPlate: numberPlate || ''
            };
        }
        console.log('Creating booking with data:', {
            requestUuid: finalRequestUuid,
            flight: flightValue,
            hotel: hotelValue,
            cab: cabValue,
            itineraryHtml: itineraryHtml || ""
        });
        // Ensure from and to are always provided (required for booking)
        // Check if travelRequest has from/to values (they should be required in schema)
        const bookingFrom = (travelRequest.from && String(travelRequest.from).trim()) || null;
        const bookingTo = (travelRequest.to && String(travelRequest.to).trim()) || null;
        if (!bookingFrom || !bookingTo || bookingFrom === "" || bookingTo === "") {
            console.error('Travel request missing from/to:', {
                from: travelRequest.from,
                to: travelRequest.to,
                bookingFrom: bookingFrom,
                bookingTo: bookingTo,
                requestUuid: finalRequestUuid,
                travelRequestDoc: JSON.stringify(travelRequest.toObject())
            });
            return res.status(400).json({
                message: "Travel request is missing required location information (from/to). Please ensure the travel request has valid 'from' and 'to' locations.",
                details: {
                    from: travelRequest.from || null,
                    to: travelRequest.to || null
                }
            });
        }
        console.log('Creating booking with locations:', { from: bookingFrom, to: bookingTo });
        // Process confirmation files if provided
        let processedConfirmationFiles = [];
        if (confirmationFiles && Array.isArray(confirmationFiles) && confirmationFiles.length > 0) {
            processedConfirmationFiles = confirmationFiles.map((file) => {
                // Ensure base64 is a string and not double-encoded
                let base64Data = file.base64;
                if (typeof base64Data !== 'string') {
                    base64Data = String(base64Data);
                }
                // Remove any data URL prefix if present
                if (base64Data.includes(',')) {
                    base64Data = base64Data.split(',')[1];
                }
                return {
                    fileName: file.fileName || 'unknown',
                    base64: base64Data,
                    mimeType: file.mimeType || 'application/octet-stream'
                };
            });
            console.log('Processing confirmation files:', processedConfirmationFiles.length);
        }
        // Don't save itineraryHtml - generate it on demand instead
        const booking = await bookings_1.Booking.create({
            uuid: (0, uuidv4_1.uuid)(),
            requestUuid: finalRequestUuid,
            flight: flightValue,
            hotel: hotelValue,
            cab: cabValue,
            confirmationFiles: processedConfirmationFiles,
            itineraryHtml: "", // Empty - generate on demand
            status: "PENDING",
            from: bookingFrom,
            to: bookingTo
        });
        console.log('Booking created successfully:', booking.uuid, 'with', processedConfirmationFiles.length, 'confirmation files');
        // Update travel request status to BOOKED only after successful booking creation
        travelRequest.status = "BOOKED";
        await travelRequest.save();
        // Populate travel request for response
        const employeeForResponse = await user_1.User.findOne({ uuid: travelRequest.employeeId }).lean();
        const travelRequestData = {
            ...travelRequest.toObject(),
            employeeName: (employeeForResponse === null || employeeForResponse === void 0 ? void 0 : employeeForResponse.name) || travelRequest.employeeId
        };
        res.json({
            uuid: booking.uuid,
            requestUuid: booking.requestUuid,
            flight: booking.flight,
            hotel: booking.hotel,
            cab: booking.cab,
            itineraryHtml: "", // Empty - generate on demand
            confirmationFiles: booking.confirmationFiles || [],
            status: booking.status,
            from: booking.from,
            to: booking.to,
            createdAt: booking.createdAt,
            updatedAt: booking.updatedAt,
            travelRequest: travelRequestData
        });
    }
    catch (error) {
        console.error('POST /bookings - Unhandled error:', error);
        console.error('Error name:', error === null || error === void 0 ? void 0 : error.name);
        console.error('Error message:', error === null || error === void 0 ? void 0 : error.message);
        console.error('Error stack:', error === null || error === void 0 ? void 0 : error.stack);
        console.error('Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
        // Handle Mongoose validation errors
        if ((error === null || error === void 0 ? void 0 : error.name) === 'ValidationError') {
            const validationErrors = Object.keys(error.errors || {}).map(key => ({
                field: key,
                message: error.errors[key].message
            }));
            console.error('Mongoose validation errors:', validationErrors);
            return res.status(400).json({
                message: "Validation error creating booking",
                errors: validationErrors,
                details: error.message
            });
        }
        // Handle other errors
        const errorMessage = error instanceof Error ? error.message : ((error === null || error === void 0 ? void 0 : error.message) || "Unknown error");
        console.error('Returning error response:', errorMessage);
        res.status(500).json({
            message: "Failed to create booking",
            error: errorMessage,
            details: error === null || error === void 0 ? void 0 : error.stack
        });
    }
});
// Upload confirmation documents
exports.travelDeskRouter.post("/confirmations", auth_1.requireUser, (0, auth_1.requireRole)(["ROLE_TRAVEL_DESK_ADMIN", "TRAVEL_DESK_ADMIN"]), upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${path_1.default.basename(req.file.path)}`;
        res.json({ url: fileUrl });
    }
    catch (error) {
        res.status(500).json({ message: "Failed to upload confirmation" });
    }
});
// Get bookings that require action (PENDING or IN_PROGRESS)
exports.travelDeskRouter.get("/bookings/process", auth_1.requireUser, (0, auth_1.requireRole)(["ROLE_TRAVEL_DESK_ADMIN", "TRAVEL_DESK_ADMIN"]), async (req, res) => {
    try {
        const { status, limit = "20", page = "1", sortBy = "createdAt", sortOrder = "desc" } = req.query;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        const sort = {};
        sort[sortBy] = sortOrder === "asc" ? 1 : -1;
        // Build booking filter - default to PENDING and IN_PROGRESS if no status specified
        const bookingFilter = {};
        // Handle status filter - can be single value or array
        if (status) {
            const statusArray = Array.isArray(status) ? status : [status];
            bookingFilter.status = { $in: statusArray };
        }
        else {
            // Default to PENDING and IN_PROGRESS if no status filter
            bookingFilter.status = { $in: ["PENDING", "IN_PROGRESS"] };
        }
        // Find bookings with filters
        const bookings = await bookings_1.Booking.find(bookingFilter)
            .sort(sort)
            .skip(skip)
            .limit(limitNum)
            .lean();
        // Populate travel request information for each booking
        const bookingsWithDetails = await Promise.all(bookings.map(async (booking) => {
            const request = await travel_request_1.TravelRequest.findOne({ uuid: booking.requestUuid }).lean();
            let travelRequest = null;
            if (request) {
                const employee = await user_1.User.findOne({ uuid: request.employeeId }).lean();
                travelRequest = {
                    ...request,
                    employeeName: (employee === null || employee === void 0 ? void 0 : employee.name) || request.employeeId
                };
            }
            return {
                ...booking,
                travelRequest: travelRequest
            };
        }));
        const total = await bookings_1.Booking.countDocuments(bookingFilter);
        res.json({
            bookings: bookingsWithDetails,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching process bookings", error: error instanceof Error ? error.message : "Unknown error" });
    }
});
// Get all bookings
exports.travelDeskRouter.get("/bookings", auth_1.requireUser, (0, auth_1.requireRole)(["ROLE_TRAVEL_DESK_ADMIN", "TRAVEL_DESK_ADMIN"]), async (req, res) => {
    try {
        const { employeeId, startDate, endDate, travelType, status, limit = "20", page = "1", sortBy = "createdAt", sortOrder = "desc" } = req.query;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        const sort = {};
        sort[sortBy] = sortOrder === "asc" ? 1 : -1;
        // Build filter for bookings based on travel request
        let requestFilter = {};
        if (employeeId) {
            requestFilter.employeeId = employeeId;
        }
        if (travelType) {
            requestFilter.travelType = travelType;
        }
        if (startDate || endDate) {
            requestFilter.startDate = {};
            if (startDate) {
                requestFilter.startDate.$gte = new Date(startDate);
            }
            if (endDate) {
                requestFilter.startDate.$lte = new Date(endDate);
            }
        }
        // If we have request filters, first find matching request UUIDs
        let requestUuids = null;
        if (Object.keys(requestFilter).length > 0) {
            const matchingRequests = await travel_request_1.TravelRequest.find(requestFilter).select("uuid").lean();
            requestUuids = matchingRequests.map(r => r.uuid);
            if (requestUuids.length === 0) {
                // No matching requests, return empty result
                return res.json({
                    bookings: [],
                    pagination: {
                        page: pageNum,
                        limit: limitNum,
                        total: 0,
                        totalPages: 0
                    }
                });
            }
        }
        // Build booking filter
        const bookingFilter = {};
        if (requestUuids) {
            bookingFilter.requestUuid = { $in: requestUuids };
        }
        // Handle status filter if provided
        if (status) {
            const statusArray = Array.isArray(status) ? status : [status];
            bookingFilter.status = { $in: statusArray };
        }
        // Find bookings with filters
        const bookings = await bookings_1.Booking.find(bookingFilter)
            .sort(sort)
            .skip(skip)
            .limit(limitNum)
            .lean();
        // Populate travel request information for each booking
        const bookingsWithDetails = await Promise.all(bookings.map(async (booking) => {
            const request = await travel_request_1.TravelRequest.findOne({ uuid: booking.requestUuid }).lean();
            let travelRequest = null;
            if (request) {
                const employee = await user_1.User.findOne({ uuid: request.employeeId }).lean();
                travelRequest = {
                    ...request,
                    employeeName: (employee === null || employee === void 0 ? void 0 : employee.name) || request.employeeId
                };
            }
            return {
                ...booking,
                travelRequest: travelRequest
            };
        }));
        const total = await bookings_1.Booking.countDocuments(bookingFilter);
        res.json({
            bookings: bookingsWithDetails,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            },
            filters: {
                employeeId: employeeId || null,
                startDate: startDate || null,
                endDate: endDate || null,
                travelType: travelType || null
            }
        });
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching bookings", error: error instanceof Error ? error.message : "Unknown error" });
    }
});
// Update Booking - Update existing booking details
// PUT /bookings/:uuid
exports.travelDeskRouter.put("/bookings/:uuid", auth_1.requireUser, (0, auth_1.requireRole)(["ROLE_TRAVEL_DESK_ADMIN", "TRAVEL_DESK_ADMIN"]), async (req, res) => {
    try {
        const { uuid } = req.params;
        const { flight, hotel, cab, from, to, status, confirmationFiles, itineraryHtml } = req.body;
        const booking = await bookings_1.Booking.findOne({ uuid });
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }
        // Update booking fields (only update if provided)
        if (flight !== undefined)
            booking.flight = flight;
        if (hotel !== undefined)
            booking.hotel = hotel;
        if (cab !== undefined)
            booking.cab = cab;
        if (from !== undefined)
            booking.from = from;
        if (to !== undefined)
            booking.to = to;
        if (status !== undefined) {
            const validStatuses = ["PENDING", "IN_PROGRESS", "CONFIRMED", "CANCELLED"];
            if (validStatuses.includes(status)) {
                const oldStatus = booking.status;
                booking.status = status;
                // Set confirmedAt when status changes to CONFIRMED
                if (oldStatus !== "CONFIRMED" && status === "CONFIRMED") {
                    booking.confirmedAt = new Date();
                }
            }
        }
        // Don't save itineraryHtml - generate on demand instead
        // Remove any existing itineraryHtml
        booking.itineraryHtml = "";
        // Handle confirmation files - replace existing files if provided
        if (confirmationFiles !== undefined) {
            if (Array.isArray(confirmationFiles) && confirmationFiles.length > 0) {
                // Process and replace all files
                const processedFiles = confirmationFiles.map((file) => {
                    // Ensure base64 is a string and not double-encoded
                    let base64Data = file.base64;
                    if (typeof base64Data !== 'string') {
                        base64Data = String(base64Data);
                    }
                    // Remove any data URL prefix if present (shouldn't be, but safety check)
                    if (base64Data.includes(',')) {
                        base64Data = base64Data.split(',')[1];
                    }
                    return {
                        fileName: file.fileName || 'unknown',
                        base64: base64Data, // Store base64 string directly
                        mimeType: file.mimeType || 'application/octet-stream'
                    };
                });
                // Replace all files (not append)
                booking.confirmationFiles = processedFiles;
                console.log('Updated booking files:', processedFiles.length, 'files');
            }
            else {
                // Empty array means remove all files
                booking.confirmationFiles = [];
                console.log('Removed all booking files');
            }
        }
        booking.updatedAt = new Date();
        await booking.save();
        // Populate travel request if available
        const populatedRequest = await travel_request_1.TravelRequest.findOne({ uuid: booking.requestUuid }).lean();
        let travelRequestData = null;
        if (populatedRequest) {
            const employee = await user_1.User.findOne({ uuid: populatedRequest.employeeId }).lean();
            travelRequestData = {
                ...populatedRequest,
                employeeName: (employee === null || employee === void 0 ? void 0 : employee.name) || populatedRequest.employeeId
            };
        }
        res.json({
            uuid: booking.uuid,
            requestUuid: booking.requestUuid,
            flight: booking.flight,
            hotel: booking.hotel,
            cab: booking.cab,
            itineraryHtml: "", // Empty - generate on demand
            confirmationFiles: booking.confirmationFiles,
            status: booking.status,
            from: booking.from,
            to: booking.to,
            createdAt: booking.createdAt,
            updatedAt: booking.updatedAt,
            confirmedAt: booking.confirmedAt,
            travelRequest: travelRequestData
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Error updating booking",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
});
// simple analytics
exports.travelDeskRouter.get("/analytics", auth_1.requireUser, (0, auth_1.requireRole)(["ROLE_TRAVEL_DESK_ADMIN", "TRAVEL_DESK_ADMIN"]), async (req, res) => {
    try {
        const total = await travel_request_1.TravelRequest.countDocuments();
        const pending = await travel_request_1.TravelRequest.countDocuments({ status: "PENDING" });
        const approved = await travel_request_1.TravelRequest.countDocuments({ status: "APPROVED" });
        const booked = await travel_request_1.TravelRequest.countDocuments({ status: "BOOKED" });
        const rejected = await travel_request_1.TravelRequest.countDocuments({ status: "REJECTED" });
        res.json({ total, pending, approved, booked, rejected });
    }
    catch (error) {
        res.status(500).json({ message: "Failed to fetch analytics" });
    }
});
