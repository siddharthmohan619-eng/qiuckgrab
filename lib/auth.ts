import { verify, sign } from "jsonwebtoken";
import { NextRequest } from "next/server";

/**
 * Get JWT secret from environment
 * Throws error in production if not set
 */
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    // In development, use a default (with warning)
    if (process.env.NODE_ENV === "development") {
      console.warn("⚠️ JWT_SECRET not set. Using development default. DO NOT use in production!");
      return "dev-only-secret-do-not-use-in-production";
    }
    throw new Error("JWT_SECRET environment variable is required in production");
  }
  
  return secret;
}

/**
 * Extract user ID from Bearer token in request
 */
export async function getUserFromRequest(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7);
  try {
    const decoded = verify(token, getJwtSecret()) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}

/**
 * Create a JWT token for a user
 */
export function createToken(userId: string): string {
  return sign({ userId }, getJwtSecret(), { expiresIn: "7d" });
}

/**
 * Verify a JWT token
 */
export function verifyToken(token: string): { userId: string } | null {
  try {
    return verify(token, getJwtSecret()) as { userId: string };
  } catch {
    return null;
  }
}
