import { Router } from "express";
import multer from "multer";
import { uuid } from "uuidv4";
import { requireUser, requireRole } from "../middleware/auth";
import { Booking, BookingStatus } from "../models/bookings";
import { TravelRequest } from "../models/travel-request";

const upload = multer({ dest: "uploads/" });
export const travelDeskRouter = Router();

// view approved requests
travelDeskRouter.get(
  "/requests/approved",
  requireUser,
  requireRole(["TRAVEL_DESK_ADMIN"]),
  async (req, res) => {
    const list = await TravelRequest.find({ status: "APPROVED" });
    res.json(list);
  }
);

// assign booking + itinerary
travelDeskRouter.post(
  "/bookings",
  requireUser,
  requireRole(["TRAVEL_DESK_ADMIN"]),
  upload.array("confirmations"),
  async (req, res) => {
    const { requestUuid, flight, hotel, cab, itineraryHtml, from, to } = req.body;
    const request = await TravelRequest.findOne({ uuid: requestUuid });
    if (!request) return res.status(404).json({ message: "Request not found" });

    const confirmationFiles =
      (req.files as Express.Multer.File[] | undefined)?.map((f) => f.path) ||
      [];

    const booking = await Booking.create({
      uuid: uuid(),
      requestUuid,
      flight,
      hotel,
      cab,
      confirmationFiles,
      itineraryHtml,
      from: from || request.from,
      to: to || request.to,
      status: "PENDING"
    });

    request.status = "BOOKED";
    await request.save();

    res.json(booking);
  }
);

// Process Bookings - Fetch bookings that require admin action
// GET /bookings/process?status=PENDING&status=IN_PROGRESS&limit=10&page=1
travelDeskRouter.get(
  "/bookings/process",
  requireUser,
  requireRole(["TRAVEL_DESK_ADMIN"]),
  async (req, res) => {
    try {
      const { status, limit = "20", page = "1", sortBy = "createdAt", sortOrder = "desc" } = req.query;
      
      // Default to PENDING and IN_PROGRESS if no status specified
      const statusFilter = status 
        ? Array.isArray(status) ? status : [status]
        : ["PENDING", "IN_PROGRESS"];

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      const sort: Record<string, 1 | -1> = {};
      sort[sortBy as string] = sortOrder === "asc" ? 1 : -1;

      // Find bookings with matching status
      const bookings = await Booking.find({
        status: { $in: statusFilter }
      })
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
            // Also fetch employee information if available
            const { User } = await import("../models/user");
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

      const total = await Booking.countDocuments({
        status: { $in: statusFilter }
      });

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
      res.status(500).json({ message: "Error fetching bookings", error: error instanceof Error ? error.message : "Unknown error" });
    }
  }
);

// View All Bookings - Fetch all bookings with optional filters
// GET /bookings?status=CONFIRMED&employeeId=xxx&startDate=2024-01-01&endDate=2024-12-31&limit=20&page=1
travelDeskRouter.get(
  "/bookings",
  requireUser,
  requireRole(["TRAVEL_DESK_ADMIN"]),
  async (req, res) => {
    try {
      const {
        status,
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

      // Build filter for bookings
      const bookingFilter: Record<string, any> = {};
      if (status) {
        bookingFilter.status = Array.isArray(status) ? { $in: status } : status;
      }

      // If filtering by employeeId, startDate, endDate, or travelType, we need to join with TravelRequest
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
            // Also fetch employee information if available
            const { User } = await import("../models/user");
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
          status: status || null,
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
  requireRole(["TRAVEL_DESK_ADMIN"]),
  upload.array("confirmations", 10), // Optional file uploads
  async (req, res) => {
    try {
      const { uuid } = req.params;
      const { flight, hotel, cab, itineraryHtml, from, to, status } = req.body;

      const booking = await Booking.findOne({ uuid });
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Update booking fields (only update if provided)
      if (flight !== undefined) booking.flight = flight;
      if (hotel !== undefined) booking.hotel = hotel;
      if (cab !== undefined) booking.cab = cab;
      if (itineraryHtml !== undefined) booking.itineraryHtml = itineraryHtml;
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

      // Handle file uploads if provided
      if (req.files && (req.files as Express.Multer.File[]).length > 0) {
        const newFiles = (req.files as Express.Multer.File[]).map((f) => f.path);
        booking.confirmationFiles = [...(booking.confirmationFiles || []), ...newFiles];
      }

      booking.updatedAt = new Date();
      await booking.save();

      // Populate travel request if available
      const request = await TravelRequest.findOne({ uuid: booking.requestUuid }).lean();
      let travelRequest = null;
      if (request) {
        const { User } = await import("../models/user");
        const employee = await User.findOne({ uuid: request.employeeId }).lean();
        travelRequest = {
          ...request,
          employeeName: employee?.name || request.employeeId
        };
      }

      res.json({
        ...booking.toObject(),
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
  requireRole(["TRAVEL_DESK_ADMIN"]),
  async (req, res) => {
    const total = await TravelRequest.countDocuments();
    const pending = await TravelRequest.countDocuments({ status: "PENDING" });
    const approved = await TravelRequest.countDocuments({ status: "APPROVED" });
    const booked = await TravelRequest.countDocuments({ status: "BOOKED" });
    const rejected = await TravelRequest.countDocuments({ status: "REJECTED" });
    res.json({ total, pending, approved, booked, rejected });
  }
);
