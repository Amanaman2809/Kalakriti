import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../lib/jwt";
import { Role } from "../generated/prisma";

export type AuthenticatedRequest = Request & {
  user?: {
    id: string;
    email: string;
    role: Role;
  };
};

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid token" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = (await verifyToken(token)) as {
      id: string;
      email: string;
      role:Role;
    };
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as AuthenticatedRequest).user;

  if (user?.role !== "ADMIN") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  next();
}
