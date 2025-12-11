import { Router } from "express";
import multer from "multer";
import { uuid } from "uuidv4";
import { requireUser, requireRole } from "../middleware/auth";
import { Booking } from "../models/bookings";
import { TravelRequest } from "../models/travel-request";

const upload = multer({ dest: "uploads/" });
export const travelDeskRouter = Router();

// view approved requests
travelDeskRouter.get(
  "/requests/approved",
  requireUser,
  requireRole(["ROLE_TRAVEL_DESK_ADMIN"]),
  async (req, res) => {
    const list = await TravelRequest.find({ status: "APPROVED" });
    res.json(list);
  }
);

// assign booking + itinerary
travelDeskRouter.post(
  "/bookings",
  requireUser,
  requireRole(["ROLE_TRAVEL_DESK_ADMIN"]),
  upload.array("confirmations"),
  async (req, res) => {
    const { requestUuid, flight, hotel, cab, itineraryHtml } = req.body;
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
      itineraryHtml
    });

    request.status = "BOOKED";
    await request.save();

    res.json(booking);
  }
);

// simple analytics
travelDeskRouter.get(
  "/analytics",
  requireUser,
  requireRole(["ROLE_TRAVEL_DESK_ADMIN"]),
  async (req, res) => {
    const total = await TravelRequest.countDocuments();
    const pending = await TravelRequest.countDocuments({ status: "PENDING" });
    const approved = await TravelRequest.countDocuments({ status: "APPROVED" });
    const booked = await TravelRequest.countDocuments({ status: "BOOKED" });
    const rejected = await TravelRequest.countDocuments({ status: "REJECTED" });
    res.json({ total, pending, approved, booked, rejected });
  }
);
