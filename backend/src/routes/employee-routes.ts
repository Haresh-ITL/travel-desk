import { Router } from "express";
import multer from "multer";
import { uuid } from "uuidv4";
import { requireUser, requireRole } from "../middleware/auth";
import { TravelRequest } from "../models/travel-request";
import { User } from "../models/user";
import { Role } from "../models/role";
import path from "path";
import fs from "fs";

const upload = multer({ dest: "uploads/" });
export const employeeRouter = Router();

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

employeeRouter.post(
  "/requests",
  requireUser,
  requireRole(["ROLE_EMPLOYEE", "EMPLOYEE"]),
  upload.fields([
    { name: "files", maxCount: 10 },
    { name: "idProof", maxCount: 1 },
    { name: "passport", maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const { from, to, travelType, startDate, endDate, purpose, primaryManagerUuid, managerId, modeOfTransport } =
        req.body;
      
      // Support both managerId (from frontend) and primaryManagerUuid
      const managerUuid = primaryManagerUuid || managerId;
      
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const filePaths = files.files?.map((f) => f.path) || [];
      const idProofFile = files.idProof?.[0];
      const passportFile = files.passport?.[0];

      const tr = await TravelRequest.create({
        uuid: uuid(),
        employeeId: req.user!.uuid,
        primaryManagerId: managerUuid,
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
        status: "PENDING"
      });

      const formatted = await formatTravelRequest(tr);
      res.json(formatted);
    } catch (error) {
      res.status(500).json({ message: "Failed to create travel request" });
    }
  }
);

// employee dashboard: own requests
employeeRouter.get(
  "/requests",
  requireUser,
  requireRole(["ROLE_EMPLOYEE", "EMPLOYEE"]),
  async (req, res) => {
    try {
      const list = await TravelRequest.find({ employeeId: req.user!.uuid });
      const formatted = await Promise.all(list.map(formatTravelRequest));
      res.json(formatted);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch requests" });
    }
  }
);

// Get employee profile
employeeRouter.get(
  "/profile",
  requireUser,
  requireRole(["ROLE_EMPLOYEE", "EMPLOYEE"]),
  async (req, res) => {
    try {
      const user = await User.findOne({ uuid: req.user!.uuid });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const role = await Role.findOne({ uuid: user.roleId });
      res.json({
        uuid: user.uuid,
        name: user.name,
        email: user.email,
        roleName: role?.name || "",
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  }
);

// Update employee profile
employeeRouter.put(
  "/profile",
  requireUser,
  requireRole(["ROLE_EMPLOYEE", "EMPLOYEE"]),
  async (req, res) => {
    try {
      const { name, email } = req.body;
      const user = await User.findOne({ uuid: req.user!.uuid });
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (name) user.name = name;
      if (email) {
        const existing = await User.findOne({ email, uuid: { $ne: req.user!.uuid } });
        if (existing) {
          return res.status(400).json({ message: "Email already exists" });
        }
        user.email = email;
      }

      await user.save();

      const role = await Role.findOne({ uuid: user.roleId });
      res.json({
        uuid: user.uuid,
        name: user.name,
        email: user.email,
        roleName: role?.name || "",
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to update profile" });
    }
  }
);

// Upload document (ID proof, passport, etc.)
employeeRouter.post(
  "/profile/documents",
  requireUser,
  requireRole(["ROLE_EMPLOYEE", "EMPLOYEE"]),
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${path.basename(req.file.path)}`;
      res.json({ url: fileUrl });
    } catch (error) {
      res.status(500).json({ message: "Failed to upload document" });
    }
  }
);

// Get mapped managers for employee
employeeRouter.get(
  "/managers",
  requireUser,
  requireRole(["ROLE_EMPLOYEE", "EMPLOYEE"]),
  async (req, res) => {
    try {
      const user = await User.findOne({ uuid: req.user!.uuid });
      if (!user || !user.managerIds || user.managerIds.length === 0) {
        return res.json([]);
      }

      const managers = await User.find({ uuid: { $in: user.managerIds } });
      const managersWithRoles = await Promise.all(
        managers.map(async (manager) => {
          const role = await Role.findOne({ uuid: manager.roleId });
          return {
            uuid: manager.uuid,
            name: manager.name,
            email: manager.email,
            roleName: role?.name || "",
            createdAt: manager.createdAt,
            updatedAt: manager.updatedAt
          };
        })
      );

      res.json(managersWithRoles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch managers" });
    }
  }
);
