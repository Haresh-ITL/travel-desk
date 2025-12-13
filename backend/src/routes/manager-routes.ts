import { Router } from "express";
import multer from "multer";
import { uuid } from "uuidv4";
import { requireUser, requireRole } from "../middleware/auth";
import { TravelRequest } from "../models/travel-request";
import { User } from "../models/user";
import { Role } from "../models/role";

const upload = multer({ dest: "uploads/" });

export const managerRouter = Router();

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

// Get all requests for this manager
managerRouter.get(
  "/requests",
  requireUser,
  requireRole(["ROLE_MANAGER", "MANAGER"]),
  async (req, res) => {
    try {
      const list = await TravelRequest.find({
        primaryManagerId: req.user!.uuid
      });
      const formatted = await Promise.all(list.map(formatTravelRequest));
      res.json(formatted);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch requests" });
    }
  }
);

// pending requests for this manager
managerRouter.get(
  "/requests/pending",
  requireUser,
  requireRole(["ROLE_MANAGER", "MANAGER"]),
  async (req, res) => {
    try {
      const list = await TravelRequest.find({
        primaryManagerId: req.user!.uuid,
        status: "PENDING"
      });
      const formatted = await Promise.all(list.map(formatTravelRequest));
      res.json(formatted);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending requests" });
    }
  }
);

// Create travel request (Manager's own request - auto-approved)
managerRouter.post(
  "/requests",
  requireUser,
  requireRole(["ROLE_MANAGER", "MANAGER"]),
  upload.fields([
    { name: "files", maxCount: 10 },
    { name: "idProof", maxCount: 1 },
    { name: "passport", maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const { from, to, travelType, startDate, endDate, purpose, modeOfTransport } = req.body;
      
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const filePaths = files.files?.map((f) => f.path) || [];
      const idProofFile = files.idProof?.[0];
      const passportFile = files.passport?.[0];

      // Manager creates request for themselves - auto-approved
      const tr = await TravelRequest.create({
        uuid: uuid(),
        employeeId: req.user!.uuid, // Manager is the employee for their own request
        primaryManagerId: req.user!.uuid, // Manager is also the manager
        from,
        to,
        travelType,
        modeOfTransport,
        startDate,
        endDate,
        purpose,
        filePaths,
        idProofUrl: idProofFile?.path,
        passportUrl: passportFile?.path,
        status: "APPROVED", // Auto-approved for manager's own requests
        managerComment: "Auto-approved: Manager's own request"
      });

      const formatted = await formatTravelRequest(tr);
      res.json(formatted);
    } catch (error) {
      console.error('Error creating manager request:', error);
      res.status(500).json({ message: "Failed to create travel request" });
    }
  }
);

// approve or reject
managerRouter.put(
  "/requests/:uuid/decision",
  requireUser,
  requireRole(["ROLE_MANAGER", "MANAGER"]),
  async (req, res) => {
    try {
      const { status, comment } = req.body; // APPROVED / REJECTED
      const tr = await TravelRequest.findOne({ uuid: req.params.uuid });
      if (!tr) return res.status(404).json({ message: "Not found" });
      if (tr.primaryManagerId !== req.user!.uuid)
        return res.status(403).json({ message: "Forbidden" });

      tr.status = status;
      tr.managerComment = comment;
      await tr.save();
      
      const formatted = await formatTravelRequest(tr);
      res.json(formatted);
    } catch (error) {
      console.error('Error updating request decision:', error);
      res.status(500).json({ message: "Failed to update request" });
    }
  }
);
