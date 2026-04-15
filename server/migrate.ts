/**
 * Auto-migration: Creates all tables if they don't exist.
 * Runs on every server startup — safe to run multiple times (uses IF NOT EXISTS).
 */
import { db } from "./db";
import { sql } from "drizzle-orm";

export function runMigrations() {
  try {
    db.run(sql`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'customer',
        stripe_customer_id TEXT,
        stripe_subscription_id TEXT,
        subscription_status TEXT DEFAULT 'inactive',
        plan TEXT DEFAULT 'none',
        created_at TEXT NOT NULL,
        last_login_at TEXT
      )
    `);

    db.run(sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `);

    db.run(sql`
      CREATE TABLE IF NOT EXISTS companies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        annual_import_spend REAL NOT NULL,
        primary_countries TEXT NOT NULL,
        hts_codes_json TEXT NOT NULL,
        tier TEXT NOT NULL DEFAULT 'monitor',
        created_at TEXT NOT NULL
      )
    `);

    db.run(sql`
      CREATE TABLE IF NOT EXISTS tariff_alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id INTEGER,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        severity TEXT NOT NULL,
        category TEXT NOT NULL,
        affected_hts_codes TEXT NOT NULL,
        estimated_impact REAL,
        source TEXT NOT NULL,
        source_url TEXT,
        published_at TEXT NOT NULL,
        is_global INTEGER NOT NULL DEFAULT 1
      )
    `);

    db.run(sql`
      CREATE TABLE IF NOT EXISTS refund_assessments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        company_id INTEGER,
        company_name TEXT NOT NULL,
        email TEXT NOT NULL,
        annual_import_spend REAL NOT NULL,
        primary_country TEXT NOT NULL,
        product_category TEXT NOT NULL,
        estimated_refund REAL NOT NULL,
        estimated_savings REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT NOT NULL
      )
    `);

    db.run(sql`
      CREATE TABLE IF NOT EXISTS briefings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id INTEGER,
        week_of TEXT NOT NULL,
        headline TEXT NOT NULL,
        summary TEXT NOT NULL,
        savings_found REAL NOT NULL DEFAULT 0,
        alerts_triggered INTEGER NOT NULL DEFAULT 0,
        actions_required TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `);

    db.run(sql`
      CREATE TABLE IF NOT EXISTS agent_scans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source TEXT NOT NULL,
        pages_scanned INTEGER NOT NULL DEFAULT 0,
        alerts_found INTEGER NOT NULL DEFAULT 0,
        summary TEXT,
        ran_at TEXT NOT NULL
      )
    `);

    console.log("[migrate] All tables ready");
  } catch (err) {
    console.error("[migrate] Migration failed:", err);
    throw err;
  }
}
