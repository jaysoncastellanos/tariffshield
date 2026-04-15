import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@shared/schema";
import path from "path";

// In production, use /app/data/data.db (Railway persistent volume)
// In development, use ./data.db (local)
const dbPath = process.env.DATABASE_URL || "data.db";

// Ensure the directory exists
import { mkdirSync } from "fs";
try {
  mkdirSync(path.dirname(dbPath), { recursive: true });
} catch {
  // Directory already exists
}

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });
