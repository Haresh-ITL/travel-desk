import { Request, Response, NextFunction } from "express";
import { User } from "../models/user";

declare global {
  namespace Express {
    interface Request {
      user?: { uuid: string; roleId: string };
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
  req.user = { uuid: user.uuid, roleId: user.roleId };
  next();
};

export const requireRole =
  (allowedRoles: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (!allowedRoles.includes(req.user.roleId)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
