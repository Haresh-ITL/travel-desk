import { Router } from "express";
import multer from "multer";
import { uuid } from "uuidv4";
import { requireUser, requireRole } from "../middleware/auth";
import { Booking } from "../models/bookings";
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
      
      const request = await TravelRequest.findOne({ uuid: requestUuid });
      if (!request) return res.status(404).json({ message: "Request not found" });

      const flight = (flightAirline || flightNumber) ? {
        airline: flightAirline,
        flightNumber: flightNumber,
        departureAirport: flightDepartureAirport,
        departureTime: flightDepartureTime ? new Date(flightDepartureTime) : undefined,
        arrivalAirport: flightArrivalAirport,
        arrivalTime: flightArrivalTime ? new Date(flightArrivalTime) : undefined
      } : undefined;

      const hotel = (hotelName || hotelLocation) ? {
        name: hotelName,
        location: hotelLocation,
        checkin: hotelCheckin ? new Date(hotelCheckin) : undefined,
        checkout: hotelCheckout ? new Date(hotelCheckout) : undefined,
        amount: hotelAmount ? parseFloat(hotelAmount) : undefined
      } : undefined;

      const cab = (cabProvider || cabPickupTime) ? {
        provider: cabProvider,
        pickupTime: cabPickupTime ? new Date(cabPickupTime) : undefined,
        notes: cabNotes
      } : undefined;

      const booking = await Booking.create({
        uuid: uuid(),
        requestUuid,
        employeeId: request.employeeId,
        flight,
        hotel,
        cab,
        confirmationFiles: [],
        flightConfirmationUrl,
        hotelConfirmationUrl,
        cabConfirmationUrl,
        itineraryHtml: itineraryHtml || ""
      });

      request.status = "BOOKED";
      await request.save();

      res.json({
        uuid: booking.uuid,
        requestUuid: booking.requestUuid,
        employeeUuid: booking.employeeId,
        flight: booking.flight,
        hotel: booking.hotel,
        cab: booking.cab,
        itineraryHtml: booking.itineraryHtml,
        flightConfirmationUrl: booking.flightConfirmationUrl,
        hotelConfirmationUrl: booking.hotelConfirmationUrl,
        cabConfirmationUrl: booking.cabConfirmationUrl,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt
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
  upload.array("confirmations", 10), // Optional file uploads
  async (req, res) => {
    try {
      const { uuid } = req.params;
      const { flight, hotel, cab, itineraryHtml, flightConfirmationUrl, hotelConfirmationUrl, cabConfirmationUrl } = req.body;

      const booking = await Booking.findOne({ uuid });
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Update booking fields (only update if provided)
      if (flight !== undefined) booking.flight = flight;
      if (hotel !== undefined) booking.hotel = hotel;
      if (cab !== undefined) booking.cab = cab;
      if (itineraryHtml !== undefined) booking.itineraryHtml = itineraryHtml;
      if (flightConfirmationUrl !== undefined) booking.flightConfirmationUrl = flightConfirmationUrl;
      if (hotelConfirmationUrl !== undefined) booking.hotelConfirmationUrl = hotelConfirmationUrl;
      if (cabConfirmationUrl !== undefined) booking.cabConfirmationUrl = cabConfirmationUrl;

      // Handle file uploads if provided
      if (req.files && (req.files as Express.Multer.File[]).length > 0) {
        const newFiles = (req.files as Express.Multer.File[]).map((f) => f.path);
        booking.confirmationFiles = [...(booking.confirmationFiles || []), ...newFiles];
      }

      await booking.save();

      // Populate travel request if available
      const request = await TravelRequest.findOne({ uuid: booking.requestUuid }).lean();
      let travelRequest = null;
      if (request) {
        const employee = await User.findOne({ uuid: request.employeeId }).lean();
        travelRequest = {
          ...request,
          employeeName: employee?.name || request.employeeId
        };
      }

      res.json({
        uuid: booking.uuid,
        requestUuid: booking.requestUuid,
        employeeUuid: booking.employeeId,
        flight: booking.flight,
        hotel: booking.hotel,
        cab: booking.cab,
        itineraryHtml: booking.itineraryHtml,
        flightConfirmationUrl: booking.flightConfirmationUrl,
        hotelConfirmationUrl: booking.hotelConfirmationUrl,
        cabConfirmationUrl: booking.cabConfirmationUrl,
        confirmationFiles: booking.confirmationFiles,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        travelRequest: travelRequest
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
