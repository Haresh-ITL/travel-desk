import { Router } from "express";
import multer from "multer";
import { uuid } from "uuidv4";
import { requireUser, requireRole } from "../middleware/auth";
import { TravelRequest } from "../models/travel-request";
import { Booking } from "../models/bookings";
import { User } from "../models/user";
import { Role } from "../models/role";
import path from "path";
import fs from "fs";
import { promisify } from "util";

const readFile = promisify(fs.readFile);

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
      const employeeUuid = req.user!.uuid;
      console.log('Fetching requests for employee:', employeeUuid);
      
      const list = await TravelRequest.find({ employeeId: employeeUuid });
      console.log('Found', list.length, 'requests for employee', employeeUuid);
      
      const formatted = await Promise.all(list.map(formatTravelRequest));
      
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
    } catch (error) {
      console.error('Error fetching employee requests:', error);
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
      
      console.log('=== Fetching Profile ===');
      console.log('User UUID:', req.user!.uuid);
      console.log('User documents from DB:', user.documents);
      console.log('Documents count:', user.documents?.length || 0);
      
      // Format documents with base64 data
      const documents = (user.documents || []).map(doc => {
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
          dataLength: formatted.data?.length || 0,
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
        roleName: role?.name || "",
        documents: documents || [], // Ensure it's always an array
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };

      console.log('Sending profile response with', documents.length, 'documents');
      console.log('Response has documents field:', 'documents' in response);
      console.log('Response documents is array:', Array.isArray(response.documents));
      res.json(response);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile", error: error instanceof Error ? error.message : "Unknown error" });
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

      const { type } = req.body;
      if (!type) {
        return res.status(400).json({ message: "Document type is required" });
      }

      const user = await User.findOne({ uuid: req.user!.uuid });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      console.log('=== Document Upload Started ===');
      console.log('User UUID:', req.user!.uuid);
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
      const fileName = path.basename(req.file.path);
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
      console.log('Document count after save:', savedUser.documents?.length || 0);
      if (savedUser.documents && savedUser.documents.length > 0) {
        const lastDoc = savedUser.documents[savedUser.documents.length - 1];
        console.log('Document has data:', !!lastDoc?.data);
        console.log('Document data length:', lastDoc?.data?.length || 0);
      }

      // Verify the save by fetching the user again
      const verifyUser = await User.findOne({ uuid: req.user!.uuid });
      if (verifyUser && verifyUser.documents) {
        const savedDoc = verifyUser.documents.find(d => d.type === type);
        console.log('Verified document from DB:', {
          type: savedDoc?.type,
          hasData: !!savedDoc?.data,
          dataLength: savedDoc?.data?.length || 0,
          mimeType: savedDoc?.mimeType,
          fileName: savedDoc?.fileName
        });
      } else {
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
      console.log('Response data URL length:', responseData.data?.length || 0);
      console.log('Response type:', responseData.type);
      console.log('Response mimeType:', responseData.mimeType);

      // Return the saved document with base64 data
      res.json(responseData);
    } catch (error) {
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

// Get employee dashboard statistics
employeeRouter.get(
  "/dashboard/stats",
  requireUser,
  requireRole(["ROLE_EMPLOYEE", "EMPLOYEE"]),
  async (req, res) => {
    try {
      const employeeUuid = req.user!.uuid;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Total trips - all requests for this employee
      const totalTrips = await TravelRequest.countDocuments({ employeeId: employeeUuid });

      // Upcoming trips - approved or booked requests with startDate >= today
      const upcomingTrips = await TravelRequest.countDocuments({
        employeeId: employeeUuid,
        status: { $in: ["APPROVED", "BOOKED"] },
        startDate: { $gte: today }
      });

      // Pending approvals - requests with status PENDING
      const pendingApprovals = await TravelRequest.countDocuments({
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
    } catch (error) {
      console.error('Error fetching employee dashboard stats:', error);
      res.status(500).json({ message: "Failed to fetch dashboard statistics" });
    }
  }
);

// Debug endpoint to check user documents (for testing)
employeeRouter.get(
  "/profile/documents/debug",
  requireUser,
  requireRole(["ROLE_EMPLOYEE", "EMPLOYEE"]),
  async (req, res) => {
    try {
      const user = await User.findOne({ uuid: req.user!.uuid });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        userId: user.uuid,
        userEmail: user.email,
        documentsCount: user.documents?.length || 0,
        documents: user.documents || [],
        rawDocuments: JSON.stringify(user.documents, null, 2)
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch documents", error: error instanceof Error ? error.message : "Unknown error" });
    }
  }
);

// Get booking for a specific travel request (for viewing itinerary)
employeeRouter.get(
  "/requests/:requestUuid/booking",
  requireUser,
  requireRole(["ROLE_EMPLOYEE", "EMPLOYEE"]),
  async (req, res) => {
    try {
      const { requestUuid } = req.params;
      const employeeUuid = req.user!.uuid;

      // First verify the travel request belongs to this employee
      const travelRequest = await TravelRequest.findOne({ uuid: requestUuid, employeeId: employeeUuid });
      if (!travelRequest) {
        return res.status(404).json({ message: "Travel request not found or access denied" });
      }

      // Find booking for this request
      const booking = await Booking.findOne({ requestUuid }).lean();
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
    } catch (error) {
      console.error('Error fetching booking for employee:', error);
      res.status(500).json({ 
        message: "Failed to fetch booking", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  }
);

// Get all bookings for employee's travel requests
employeeRouter.get(
  "/bookings",
  requireUser,
  requireRole(["ROLE_EMPLOYEE", "EMPLOYEE"]),
  async (req, res) => {
    try {
      const employeeUuid = req.user!.uuid;

      // Find all travel requests for this employee
      const travelRequests = await TravelRequest.find({ employeeId: employeeUuid }).select("uuid").lean();
      const requestUuids = travelRequests.map(tr => tr.uuid);

      if (requestUuids.length === 0) {
        return res.json([]);
      }

      // Find all bookings for these requests
      const bookings = await Booking.find({ requestUuid: { $in: requestUuids } })
        .sort({ createdAt: -1 })
        .lean();

      // Map bookings with travel request details
      const bookingsWithDetails = await Promise.all(
        bookings.map(async (booking) => {
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
        })
      );

      res.json(bookingsWithDetails);
    } catch (error) {
      console.error('Error fetching bookings for employee:', error);
      res.status(500).json({ 
        message: "Failed to fetch bookings", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  }
);
