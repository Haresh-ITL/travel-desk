import { Router } from "express";
import bcrypt from "bcryptjs";
import { env } from "../config/env";
import { Role } from "../models/role";
import { User } from "../models/user";
import { uuid } from "uuidv4";
import { logger } from "../logger";
import axios from "axios";

export const authRouter = Router();

// registration (basic)
authRouter.post("/register", async (req, res) => {
  const { name, email, password, roleName } = req.body;
  const role = await Role.findOne({ name: roleName });
  if (!role) return res.status(400).json({ message: "Invalid role" });

  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: "Email exists" });

  const hash = await bcrypt.hash(password, env.bcryptRounds);
  const user = await User.create({
    uuid: uuid(),
    name,
    email,
    password: hash,
    roleId: role.uuid,
    managerIds: []
  });
  res.json({ uuid: user.uuid, roleId: user.roleId });
});

// simple login returning uuid for header use
authRouter.post("/login", async (req, res) => {
  
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(400).json({ message: "Invalid credentials" });

  const role = await Role.findOne({ uuid: user.roleId });

  res.json({ 
    userUuid: user.uuid, 
    roleId: user.roleId, 
    roleName: role?.name,
    name: user.name || '',
    email: user.email || ''
  });
});

// integrate with AG
// New login endpoint that makes a proxy call to external authentication service
// This endpoint accepts email and password and validates through external AG service
// Returns all authentication data directly from AG - no local database operations
// Currently not in use - to be integrated when AG authentication is ready
authRouter.post("/login-proxy", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        message: "Email and password are required" 
      });
    }

    // TODO: Replace with actual AG authentication service URL
    const AG_AUTH_URL = process.env.AG_AUTH_URL || "https://ag-auth-service.example.com/api/authenticate";
    
    // Make proxy call to AG authentication service
    const proxyResponse = await axios.post(AG_AUTH_URL, {
      email: email,
      password: password
    }, {
      headers: {
        'Content-Type': 'application/json',
        // Add any required headers for AG service
        // 'Authorization': `Bearer ${process.env.AG_API_KEY}`,
      },
      timeout: 10000 // 10 second timeout
    });

    // Check if authentication was successful
    if (proxyResponse.status === 200 && proxyResponse.data) {
      // Return all authentication data directly from AG service
      // No local database lookup or operations
      return res.json({
        success: true,
        message: "Authentication successful",
        ...proxyResponse.data // Return all data from AG response
      });
    } else {
      return res.status(401).json({ 
        success: false,
        message: "Authentication failed" 
      });
    }
  } catch (error: any) {
    logger.error("AG Proxy login error:", error);
    
    // Handle different error scenarios
    if (error.response) {
      // AG service returned an error response
      return res.status(error.response.status || 401).json({
        success: false,
        message: error.response.data?.message || "Authentication failed",
        error: "AG service error"
      });
    } else if (error.request) {
      // Request was made but no response received
      return res.status(503).json({
        success: false,
        message: "Authentication service unavailable",
        error: "AG service timeout or unreachable"
      });
    } else {
      // Error in setting up the request
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message
      });
    }
  }
});
