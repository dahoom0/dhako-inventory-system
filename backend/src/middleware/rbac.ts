import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";
import { User } from "../models/types";

type Role = User["role"];

export function requireRole(...roles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Unauthenticated" });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: "Insufficient permissions" });
      return;
    }
    next();
  };
}

export const isAdmin         = requireRole("ADMIN");
export const isAdminOrStore  = requireRole("ADMIN", "STORE_MANAGER");
export const isManager       = requireRole("ADMIN", "STORE_MANAGER", "BRANCH_MANAGER");
