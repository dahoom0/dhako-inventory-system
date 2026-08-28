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

/**
 * Enforce location-based access control
 * - ADMIN (locationId = null) can access any location
 * - BRANCH_MANAGER and BRANCH_STAFF can only access their assigned location
 * - STORE_MANAGER/INVENTORY_MANAGER can only access assigned locations
 * 
 * Checks for locationId in: query.locationId, params.locationId, body.locationId, body.fromLocationId, body.toLocationId
 */
export function requireLocationAccess(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ success: false, error: "Unauthorized" });
    return;
  }

  // ADMIN (locationId = null) can access any location
  if (req.user.role === "ADMIN" || req.user.locationId === null) {
    next();
    return;
  }

  // Extract location IDs from request in order of precedence
  const requestedLocationIds: (string | null)[] = [];

  // Check query parameters
  if (req.query.locationId) {
    requestedLocationIds.push(Array.isArray(req.query.locationId) ? req.query.locationId[0] : req.query.locationId);
  }

  // Check URL parameters
  if (req.params.locationId) {
    requestedLocationIds.push(req.params.locationId);
  }

  // Check body parameters
  if (req.body?.locationId) {
    requestedLocationIds.push(req.body.locationId);
  }
  if (req.body?.fromLocationId) {
    requestedLocationIds.push(req.body.fromLocationId);
  }
  if (req.body?.toLocationId) {
    requestedLocationIds.push(req.body.toLocationId);
  }

  // Filter out null values
  const locationsToCheck = requestedLocationIds.filter((id): id is string => id !== null);

  // If no location specified, allow (might be list endpoints)
  if (locationsToCheck.length === 0) {
    next();
    return;
  }

  // Check if all requested locations match user's assigned location
  const userLocationId = req.user.locationId;
  const allAuthorized = locationsToCheck.every((locationId) => locationId === userLocationId);

  if (!allAuthorized) {
    res.status(403).json({
      success: false,
      error: "UNAUTHORIZED_LOCATION_ACCESS",
      message: "You do not have access to this location",
    });
    return;
  }

  next();
}