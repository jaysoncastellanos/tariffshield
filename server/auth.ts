import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { db } from "./db";
import { users, sessions } from "@shared/schema";
import type { User } from "@shared/schema";
import { eq } from "drizzle-orm";
import type { Request, Response, NextFunction } from "express";

// ── Password hashing ──────────────────────────────────────
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ── Session management ────────────────────────────────────
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const SESSION_COOKIE = "ts_session";

export function createSession(userId: number): string {
  const sessionId = randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();
  db.insert(sessions).values({
    id: sessionId,
    userId,
    expiresAt,
    createdAt: new Date().toISOString(),
  }).run();
  return sessionId;
}

export function getSession(sessionId: string): { userId: number } | null {
  const session = db.select().from(sessions).where(eq(sessions.id, sessionId)).get();
  if (!session) return null;
  if (new Date(session.expiresAt) < new Date()) {
    db.delete(sessions).where(eq(sessions.id, sessionId)).run();
    return null;
  }
  return { userId: session.userId };
}

export function deleteSession(sessionId: string): void {
  db.delete(sessions).where(eq(sessions.id, sessionId)).run();
}

// ── User lookups ──────────────────────────────────────────
export function getUserById(id: number): User | undefined {
  return db.select().from(users).where(eq(users.id, id)).get();
}

export function getUserByEmail(email: string): User | undefined {
  return db.select().from(users).where(eq(users.email, email.toLowerCase())).get();
}

// ── Middleware ────────────────────────────────────────────
export interface AuthRequest extends Request {
  user?: User;
  sessionId?: string;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const sessionId = req.cookies?.[SESSION_COOKIE] || req.headers["x-session-id"] as string;
  if (!sessionId) return res.status(401).json({ error: "Not authenticated" });

  const session = getSession(sessionId);
  if (!session) return res.status(401).json({ error: "Session expired" });

  const user = getUserById(session.userId);
  if (!user) return res.status(401).json({ error: "User not found" });

  req.user = user;
  req.sessionId = sessionId;
  next();
}

export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const sessionId = req.cookies?.[SESSION_COOKIE] || req.headers["x-session-id"] as string;
  if (sessionId) {
    const session = getSession(sessionId);
    if (session) {
      const user = getUserById(session.userId);
      if (user) {
        req.user = user;
        req.sessionId = sessionId;
      }
    }
  }
  next();
}

export { SESSION_COOKIE };
