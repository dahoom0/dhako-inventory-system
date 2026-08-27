import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AuthTokenPayload } from "../models/types";

export interface AuthRequest extends Request {
  user?: AuthTokenPayload;
  body: any;
  params: any;
  query: any;
  headers: any;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ success: false, error: "Missing or invalid token" });
    return;
  }
  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, env.jwtSecret) as AuthTokenPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ success: false, error: "Invalid or expired token" });
  }
}