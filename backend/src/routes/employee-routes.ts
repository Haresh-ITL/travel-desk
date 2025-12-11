import { Router } from "express";
import multer from "multer";
import { uuid } from "uuidv4";
import { requireUser, requireRole } from "../middleware/auth";
import { TravelRequest } from "../models/travel-request";

const upload = multer({ dest: "uploads/" });
export const employeeRouter = Router();

employeeRouter.post(
  "/requests",
  requireUser,
  requireRole(["ROLE_EMPLOYEE"]),
  upload.array("files"),
  async (req, res) => {
    const { from, to, travelType, startDate, endDate, purpose, managerId } =
      req.body;
    const filePaths = (req.files as Express.Multer.File[] | undefined)?.map(
      (f) => f.path
    ) || [];

    const tr = await TravelRequest.create({
      uuid: uuid(),
      employeeId: req.user!.uuid,
      managerId,
      from,
      to,
      travelType,
      startDate,
      endDate,
      purpose,
      filePaths,
      status: "PENDING"
    });
    res.json(tr);
  }
);

// employee dashboard: own requests
employeeRouter.get(
  "/requests",
  requireUser,
  requireRole(["ROLE_EMPLOYEE"]),
  async (req, res) => {
    const list = await TravelRequest.find({ employeeId: req.user!.uuid });
    res.json(list);
  }
);
