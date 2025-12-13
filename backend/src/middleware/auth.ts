import { Request, Response, NextFunction } from "express";
import { User } from "../models/user";
import { Role } from "../models/role";

declare global {
  namespace Express {
    interface Request {
      user?: { uuid: string; roleId: string; roleName?: string };
    }
  }
}

// X-USER-UUID header used as pseudo-session for hackathon
export const requireUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const uuid = req.header("x-user-uuid");
  if (!uuid) {
    return res.status(401).json({ message: "Missing x-user-uuid header" });
  }
  const user = await User.findOne({ uuid });
  if (!user) {
    return res.status(401).json({ message: "User not found" });
  }
  const role = await Role.findOne({ uuid: user.roleId });
  req.user = { 
    uuid: user.uuid, 
    roleId: user.roleId,
    roleName: role?.name
  };
  next();
};

export const requireRole =
  (allowedRoles: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    
    // If roleName is already set, use it; otherwise fetch it
    let userRoleName = req.user.roleName;
    if (!userRoleName) {
      const { Role } = await import("../models/role");
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
