import { Router } from "express";
import bcrypt from "bcryptjs";
import { uuid } from "uuidv4";
import { requireUser, requireRole } from "../middleware/auth";
import { User } from "../models/user";
import { Role } from "../models/role";
import { env } from "../config/env";

export const adminRouter = Router();

// Get all users
adminRouter.get(
  "/users",
  requireUser,
  requireRole(["ROLE_ORG_ADMIN", "ORG_ADMIN"]),
  async (req, res) => {
    try {
      const roleFilter = req.query.role as string | undefined;
      let users = await User.find();
      
      if (roleFilter) {
        const role = await Role.findOne({ name: roleFilter });
        if (role) {
          users = users.filter(u => u.roleId === role.uuid);
        }
      }

      const usersWithRoles = await Promise.all(
        users.map(async (user) => {
          const role = await Role.findOne({ uuid: user.roleId });
          return {
            uuid: user.uuid,
            name: user.name,
            email: user.email,
            roleName: role?.name || "",
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          };
        })
      );

      res.json(usersWithRoles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  }
);

// Create user
adminRouter.post(
  "/users",
  requireUser,
  requireRole(["ROLE_ORG_ADMIN", "ORG_ADMIN"]),
  async (req, res) => {
    try {
      const { name, email, password, roleName } = req.body;

      if (!name || !email || !password || !roleName) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const role = await Role.findOne({ name: roleName });
      if (!role) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const hash = await bcrypt.hash(password, env.bcryptRounds);
      const user = await User.create({
        uuid: uuid(),
        name,
        email,
        password: hash,
        roleId: role.uuid,
        managerIds: []
      });

      res.json({
        uuid: user.uuid,
        name: user.name,
        email: user.email,
        roleName: role.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to create user" });
    }
  }
);

// Update user
adminRouter.put(
  "/users/:uuid",
  requireUser,
  requireRole(["ROLE_ORG_ADMIN", "ORG_ADMIN"]),
  async (req, res) => {
    try {
      const { name, email, roleName } = req.body;
      const user = await User.findOne({ uuid: req.params.uuid });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (name) user.name = name;
      if (email) {
        const existing = await User.findOne({ email, uuid: { $ne: req.params.uuid } });
        if (existing) {
          return res.status(400).json({ message: "Email already exists" });
        }
        user.email = email;
      }
      if (roleName) {
        const role = await Role.findOne({ name: roleName });
        if (!role) {
          return res.status(400).json({ message: "Invalid role" });
        }
        user.roleId = role.uuid;
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
      res.status(500).json({ message: "Failed to update user" });
    }
  }
);

// Assign managers to employee
adminRouter.put(
  "/users/:uuid/managers",
  requireUser,
  requireRole(["ROLE_ORG_ADMIN", "ORG_ADMIN"]),
  async (req, res) => {
    try {
      const { managerUuids } = req.body;
      const user = await User.findOne({ uuid: req.params.uuid });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!Array.isArray(managerUuids)) {
        return res.status(400).json({ message: "managerUuids must be an array" });
      }

      user.managerIds = managerUuids;
      await user.save();

      res.json({ message: "Managers assigned successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to assign managers" });
    }
  }
);

