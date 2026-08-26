import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AuthTokenPayload } from "../models/types";

export function signToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn } as jwt.SignOptions);
}
