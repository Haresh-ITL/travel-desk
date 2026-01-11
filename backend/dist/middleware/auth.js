"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.requireUser = void 0;
const user_1 = require("../models/user");
const role_1 = require("../models/role");
// X-USER-UUID header used as pseudo-session for hackathon
const requireUser = async (req, res, next) => {
    const uuid = req.header("x-user-uuid");
    if (!uuid) {
        return res.status(401).json({ message: "Missing x-user-uuid header" });
    }
    const user = await user_1.User.findOne({ uuid });
    if (!user) {
        return res.status(401).json({ message: "User not found" });
    }
    const role = await role_1.Role.findOne({ uuid: user.roleId });
    req.user = {
        uuid: user.uuid,
        roleId: user.roleId,
        roleName: role === null || role === void 0 ? void 0 : role.name
    };
    next();
};
exports.requireUser = requireUser;
const requireRole = (allowedRoles) => async (req, res, next) => {
    if (!req.user)
        return res.status(401).json({ message: "Unauthorized" });
    // If roleName is already set, use it; otherwise fetch it
    let userRoleName = req.user.roleName;
    if (!userRoleName) {
        const { Role } = await Promise.resolve().then(() => __importStar(require("../models/role")));
        const role = await Role.findOne({ uuid: req.user.roleId });
        if (!role) {
            return res.status(403).json({ message: "Role not found" });
        }
        userRoleName = role.name;
        req.user.roleName = userRoleName;
    }
    // Normalize role names - remove "ROLE_" prefix if present for comparison
    const normalizedUserRole = userRoleName.replace(/^ROLE_/, "");
    const normalizedAllowedRoles = allowedRoles.map(role => role.replace(/^ROLE_/, ""));
    if (!normalizedAllowedRoles.includes(normalizedUserRole)) {
        return res.status(403).json({ message: "Forbidden" });
    }
    next();
};
exports.requireRole = requireRole;
