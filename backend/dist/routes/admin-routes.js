"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRouter = void 0;
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const uuidv4_1 = require("uuidv4");
const auth_1 = require("../middleware/auth");
const user_1 = require("../models/user");
const role_1 = require("../models/role");
const env_1 = require("../config/env");
exports.adminRouter = (0, express_1.Router)();
// Get all users
exports.adminRouter.get("/users", auth_1.requireUser, (0, auth_1.requireRole)(["ROLE_ORG_ADMIN", "ORG_ADMIN"]), async (req, res) => {
    try {
        const roleFilter = req.query.role;
        let users = await user_1.User.find();
        if (roleFilter) {
            const role = await role_1.Role.findOne({ name: roleFilter });
            if (role) {
                users = users.filter(u => u.roleId === role.uuid);
            }
        }
        const usersWithRoles = await Promise.all(users.map(async (user) => {
            const role = await role_1.Role.findOne({ uuid: user.roleId });
            return {
                uuid: user.uuid,
                name: user.name,
                email: user.email,
                roleName: (role === null || role === void 0 ? void 0 : role.name) || "",
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            };
        }));
        res.json(usersWithRoles);
    }
    catch (error) {
        res.status(500).json({ message: "Failed to fetch users" });
    }
});
// Create user
exports.adminRouter.post("/users", auth_1.requireUser, (0, auth_1.requireRole)(["ROLE_ORG_ADMIN", "ORG_ADMIN"]), async (req, res) => {
    try {
        const { name, email, password, roleName } = req.body;
        if (!name || !email || !password || !roleName) {
            return res.status(400).json({ message: "Missing required fields" });
        }
        const role = await role_1.Role.findOne({ name: roleName });
        if (!role) {
            return res.status(400).json({ message: "Invalid role" });
        }
        const existing = await user_1.User.findOne({ email });
        if (existing) {
            return res.status(400).json({ message: "Email already exists" });
        }
        const hash = await bcryptjs_1.default.hash(password, env_1.env.bcryptRounds);
        const user = await user_1.User.create({
            uuid: (0, uuidv4_1.uuid)(),
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
    }
    catch (error) {
        res.status(500).json({ message: "Failed to create user" });
    }
});
// Update user
exports.adminRouter.put("/users/:uuid", auth_1.requireUser, (0, auth_1.requireRole)(["ROLE_ORG_ADMIN", "ORG_ADMIN"]), async (req, res) => {
    try {
        const { name, email, roleName } = req.body;
        const user = await user_1.User.findOne({ uuid: req.params.uuid });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (name)
            user.name = name;
        if (email) {
            const existing = await user_1.User.findOne({ email, uuid: { $ne: req.params.uuid } });
            if (existing) {
                return res.status(400).json({ message: "Email already exists" });
            }
            user.email = email;
        }
        if (roleName) {
            const role = await role_1.Role.findOne({ name: roleName });
            if (!role) {
                return res.status(400).json({ message: "Invalid role" });
            }
            user.roleId = role.uuid;
        }
        await user.save();
        const role = await role_1.Role.findOne({ uuid: user.roleId });
        res.json({
            uuid: user.uuid,
            name: user.name,
            email: user.email,
            roleName: (role === null || role === void 0 ? void 0 : role.name) || "",
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        });
    }
    catch (error) {
        res.status(500).json({ message: "Failed to update user" });
    }
});
// Assign managers to employee
exports.adminRouter.put("/users/:uuid/managers", auth_1.requireUser, (0, auth_1.requireRole)(["ROLE_ORG_ADMIN", "ORG_ADMIN"]), async (req, res) => {
    try {
        const { managerUuids } = req.body;
        const user = await user_1.User.findOne({ uuid: req.params.uuid });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (!Array.isArray(managerUuids)) {
            return res.status(400).json({ message: "managerUuids must be an array" });
        }
        user.managerIds = managerUuids;
        await user.save();
        res.json({ message: "Managers assigned successfully" });
    }
    catch (error) {
        res.status(500).json({ message: "Failed to assign managers" });
    }
});
