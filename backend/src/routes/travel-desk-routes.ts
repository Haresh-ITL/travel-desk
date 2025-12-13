import { Router } from "express";
import multer from "multer";
import { uuid } from "uuidv4";
import { requireUser, requireRole } from "../middleware/auth";
import { Booking, BookingStatus } from "../models/bookings";
import { TravelRequest } from "../models/travel-request";
import { User } from "../models/user";
import { Role } from "../models/role";
import path from "path";

const upload = multer({ dest: "uploads/" });
export const travelDeskRouter = Router();

// Helper function to format travel request with populated data
async function formatTravelRequest(tr: any) {
  const employee = await User.findOne({ uuid: tr.employeeId });
  const employeeRole = employee ? await Role.findOne({ uuid: employee.roleId }) : null;
  let primaryManager = null;
  let primaryManagerRole = null;
  
  if (tr.primaryManagerId) {
    primaryManager = await User.findOne({ uuid: tr.primaryManagerId });
    if (primaryManager) {
      primaryManagerRole = await Role.findOne({ uuid: primaryManager.roleId });
    }
  }

  return {
    uuid: tr.uuid,
    employeeUuid: tr.employeeId,
    employeeName: employee?.name || "",
    from: tr.from,
    to: tr.to,
    travelType: tr.travelType,
    modeOfTransport: tr.modeOfTransport,
    startDate: tr.startDate,
    endDate: tr.endDate,
    purpose: tr.purpose,
    status: tr.status,
    primaryManagerUuid: tr.primaryManagerId,
    primaryManagerName: primaryManager?.name || "",
    managerComment: tr.managerComment,
    idProofUrl: tr.idProofUrl,
    passportUrl: tr.passportUrl,
    createdAt: tr.createdAt,
    updatedAt: tr.updatedAt
  };
}

// view approved requests
travelDeskRouter.get(
  "/requests/approved",
  requireUser,
  requireRole(["ROLE_TRAVEL_DESK_ADMIN", "TRAVEL_DESK_ADMIN"]),
  async (req, res) => {
    try {
      const list = await TravelRequest.find({ status: "APPROVED" });
      const formatted = await Promise.all(list.map(formatTravelRequest));
      res.json(formatted);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch approved requests" });
    }
  }
);

// Update travel request and set status to BOOKED (with file upload support)
travelDeskRouter.put(
  "/requests/:uuid/book",
  requireUser,
  requireRole(["ROLE_TRAVEL_DESK_ADMIN", "TRAVEL_DESK_ADMIN"]),
  upload.fields([
    { name: "files", maxCount: 10 },
    { name: "bookingDocuments", maxCount: 10 }
  ]),
  async (req, res) => {
    try {
      const { uuid } = req.params;
      console.log('PUT /requests/:uuid/book - UUID:', uuid);
      
      const travelRequest = await TravelRequest.findOne({ uuid });
      
      if (!travelRequest) {
        console.log('Travel request not found for UUID:', uuid);
        return res.status(404).json({ message: "Travel request not found", uuid });
      }

      console.log('Found travel request:', travelRequest.uuid, 'Status:', travelRequest.status);

      // Handle file uploads
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
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

      // Update travel request status to BOOKED
      travelRequest.status = "BOOKED";
      await travelRequest.save();

      console.log('Travel request updated successfully. New status:', travelRequest.status);

      const formatted = await formatTravelRequest(travelRequest);
      res.json(formatted);
    } catch (error) {
      console.error('Error updating travel request status:', error);
      res.status(500).json({ 
        message: "Failed to update travel request", 
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }
);

// assign booking + itinerary (accepts JSON)
travelDeskRouter.post(
  "/bookings",
  requireUser,
  requireRole(["ROLE_TRAVEL_DESK_ADMIN", "TRAVEL_DESK_ADMIN"]),
  async (req, res) => {
    try {
      const { 
        requestUuid, 
        flightAirline,
        flightNumber,
        flightDepartureAirport,
        flightDepartureTime,
        flightArrivalAirport,
        flightArrivalTime,
        hotelName,
        hotelLocation,
        hotelCheckin,
        hotelCheckout,
        hotelAmount,
        cabProvider,
        cabPickupTime,
        cabNotes,
        itineraryHtml,
        flightConfirmationUrl,
        hotelConfirmationUrl,
        cabConfirmationUrl
      } = req.body;
      
      const travelRequest = await TravelRequest.findOne({ uuid: requestUuid });
      if (!travelRequest) return res.status(404).json({ message: "Request not found" });

      // For POST route, we'll accept flight/hotel/cab as strings (simple text) or objects
      // The frontend can send them as strings for simplicity
      const flightValue = flightAirline || flightNumber 
        ? `${flightAirline || ''} ${flightNumber || ''}`.trim() 
        : undefined;
      
      const hotelValue = hotelName || hotelLocation
        ? `${hotelName || ''} ${hotelLocation || ''}`.trim()
        : undefined;
      
      const cabValue = cabProvider
        ? cabProvider
        : undefined;

      const booking = await Booking.create({
        uuid: uuid(),
        requestUuid,
        flight: flightValue,
        hotel: hotelValue,
        cab: cabValue,
        confirmationFiles: [],
        itineraryHtml: itineraryHtml || "",
        status: "PENDING" as BookingStatus,
        from: travelRequest.from,
        to: travelRequest.to
      });

      travelRequest.status = "BOOKED";
      await travelRequest.save();

      // Populate travel request for response
      const employee = await User.findOne({ uuid: travelRequest.employeeId }).lean();
      const travelRequestData = {
        ...travelRequest.toObject(),
        employeeName: employee?.name || travelRequest.employeeId
      };

      res.json({
        uuid: booking.uuid,
        requestUuid: booking.requestUuid,
        flight: booking.flight,
        hotel: booking.hotel,
        cab: booking.cab,
        itineraryHtml: booking.itineraryHtml,
        confirmationFiles: booking.confirmationFiles,
        status: booking.status,
        from: booking.from,
        to: booking.to,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        travelRequest: travelRequestData
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to create booking" });
    }
  }
);

// Upload confirmation documents
travelDeskRouter.post(
  "/confirmations",
  requireUser,
  requireRole(["ROLE_TRAVEL_DESK_ADMIN", "TRAVEL_DESK_ADMIN"]),
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${path.basename(req.file.path)}`;
      res.json({ url: fileUrl });
    } catch (error) {
      res.status(500).json({ message: "Failed to upload confirmation" });
    }
  }
);

// Get bookings that require action (PENDING or IN_PROGRESS)
travelDeskRouter.get(
  "/bookings/process",
  requireUser,
  requireRole(["ROLE_TRAVEL_DESK_ADMIN", "TRAVEL_DESK_ADMIN"]),
  async (req, res) => {
    try {
      const {
        status,
        limit = "20",
        page = "1",
        sortBy = "createdAt",
        sortOrder = "desc"
      } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      const sort: Record<string, 1 | -1> = {};
      sort[sortBy as string] = sortOrder === "asc" ? 1 : -1;

      // Build booking filter - default to PENDING and IN_PROGRESS if no status specified
      const bookingFilter: Record<string, any> = {};
      
      // Handle status filter - can be single value or array
      if (status) {
        const statusArray = Array.isArray(status) ? status : [status];
        bookingFilter.status = { $in: statusArray };
      } else {
        // Default to PENDING and IN_PROGRESS if no status filter
        bookingFilter.status = { $in: ["PENDING", "IN_PROGRESS"] };
      }

      // Find bookings with filters
      const bookings = await Booking.find(bookingFilter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean();

      // Populate travel request information for each booking
      const bookingsWithDetails = await Promise.all(
        bookings.map(async (booking) => {
          const request = await TravelRequest.findOne({ uuid: booking.requestUuid }).lean();
          let travelRequest = null;
          
          if (request) {
            const employee = await User.findOne({ uuid: request.employeeId }).lean();
            travelRequest = {
              ...request,
              employeeName: employee?.name || request.employeeId
            };
          }
          
          return {
            ...booking,
            travelRequest: travelRequest
          };
        })
      );

      const total = await Booking.countDocuments(bookingFilter);

      res.json({
        bookings: bookingsWithDetails,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching process bookings", error: error instanceof Error ? error.message : "Unknown error" });
    }
  }
);

// Get all bookings
travelDeskRouter.get(
  "/bookings",
  requireUser,
  requireRole(["ROLE_TRAVEL_DESK_ADMIN", "TRAVEL_DESK_ADMIN"]),
  async (req, res) => {
    try {
      const {
        employeeId,
        startDate,
        endDate,
        travelType,
        status,
        limit = "20",
        page = "1",
        sortBy = "createdAt",
        sortOrder = "desc"
      } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      const sort: Record<string, 1 | -1> = {};
      sort[sortBy as string] = sortOrder === "asc" ? 1 : -1;

      // Build filter for bookings based on travel request
      let requestFilter: Record<string, any> = {};
      if (employeeId) {
        requestFilter.employeeId = employeeId;
      }
      if (travelType) {
        requestFilter.travelType = travelType;
      }
      if (startDate || endDate) {
        requestFilter.startDate = {};
        if (startDate) {
          requestFilter.startDate.$gte = new Date(startDate as string);
        }
        if (endDate) {
          requestFilter.startDate.$lte = new Date(endDate as string);
        }
      }

      // If we have request filters, first find matching request UUIDs
      let requestUuids: string[] | null = null;
      if (Object.keys(requestFilter).length > 0) {
        const matchingRequests = await TravelRequest.find(requestFilter).select("uuid").lean();
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
      const bookingFilter: Record<string, any> = {};
      if (requestUuids) {
        bookingFilter.requestUuid = { $in: requestUuids };
      }
      
      // Handle status filter if provided
      if (status) {
        const statusArray = Array.isArray(status) ? status : [status];
        bookingFilter.status = { $in: statusArray };
      }

      // Find bookings with filters
      const bookings = await Booking.find(bookingFilter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean();

      // Populate travel request information for each booking
      const bookingsWithDetails = await Promise.all(
        bookings.map(async (booking) => {
          const request = await TravelRequest.findOne({ uuid: booking.requestUuid }).lean();
          let travelRequest = null;
          
          if (request) {
            const employee = await User.findOne({ uuid: request.employeeId }).lean();
            travelRequest = {
              ...request,
              employeeName: employee?.name || request.employeeId
            };
          }
          
          return {
            ...booking,
            travelRequest: travelRequest
          };
        })
      );

      const total = await Booking.countDocuments(bookingFilter);

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
    } catch (error) {
      res.status(500).json({ message: "Error fetching bookings", error: error instanceof Error ? error.message : "Unknown error" });
    }
  }
);

// Update Booking - Update existing booking details
// PUT /bookings/:uuid
travelDeskRouter.put(
  "/bookings/:uuid",
  requireUser,
  requireRole(["ROLE_TRAVEL_DESK_ADMIN", "TRAVEL_DESK_ADMIN"]),
  async (req, res) => {
    try {
      const { uuid } = req.params;
      const { flight, hotel, cab, from, to, status, confirmationFiles } = req.body;

      const booking = await Booking.findOne({ uuid });
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Update booking fields (only update if provided)
      if (flight !== undefined) booking.flight = flight;
      if (hotel !== undefined) booking.hotel = hotel;
      if (cab !== undefined) booking.cab = cab;
      if (from !== undefined) booking.from = from;
      if (to !== undefined) booking.to = to;
      if (status !== undefined) {
        const validStatuses: BookingStatus[] = ["PENDING", "IN_PROGRESS", "CONFIRMED", "CANCELLED"];
        if (validStatuses.includes(status as BookingStatus)) {
          const oldStatus = booking.status;
          booking.status = status as BookingStatus;
          // Set confirmedAt when status changes to CONFIRMED
          if (oldStatus !== "CONFIRMED" && status === "CONFIRMED") {
            booking.confirmedAt = new Date();
          }
        }
      }
      // Handle base64 file uploads if provided
      if (confirmationFiles && Array.isArray(confirmationFiles) && confirmationFiles.length > 0) {
        // Store files as objects with fileName and base64 (base64 is already encoded, store as-is)
        const newFiles = confirmationFiles.map((file: any) => {
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
        // Append to existing files
        booking.confirmationFiles = [...(booking.confirmationFiles || []), ...newFiles];
      }

      booking.updatedAt = new Date();
      await booking.save();

      // Populate travel request if available
      const populatedRequest = await TravelRequest.findOne({ uuid: booking.requestUuid }).lean();
      let travelRequestData = null;
      if (populatedRequest) {
        const employee = await User.findOne({ uuid: populatedRequest.employeeId }).lean();
        travelRequestData = {
          ...populatedRequest,
          employeeName: employee?.name || populatedRequest.employeeId
        };
      }

      res.json({
        uuid: booking.uuid,
        requestUuid: booking.requestUuid,
        flight: booking.flight,
        hotel: booking.hotel,
        cab: booking.cab,
        itineraryHtml: booking.itineraryHtml,
        confirmationFiles: booking.confirmationFiles,
        status: booking.status,
        from: booking.from,
        to: booking.to,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        confirmedAt: booking.confirmedAt,
        travelRequest: travelRequestData
      });
    } catch (error) {
      res.status(500).json({ 
        message: "Error updating booking", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  }
);

// simple analytics
travelDeskRouter.get(
  "/analytics",
  requireUser,
  requireRole(["ROLE_TRAVEL_DESK_ADMIN", "TRAVEL_DESK_ADMIN"]),
  async (req, res) => {
    try {
      const total = await TravelRequest.countDocuments();
      const pending = await TravelRequest.countDocuments({ status: "PENDING" });
      const approved = await TravelRequest.countDocuments({ status: "APPROVED" });
      const booked = await TravelRequest.countDocuments({ status: "BOOKED" });
      const rejected = await TravelRequest.countDocuments({ status: "REJECTED" });
      res.json({ total, pending, approved, booked, rejected });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  }
);