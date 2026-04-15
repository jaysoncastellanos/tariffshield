import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ── Users (Auth) ──────────────────────────────────────────
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("customer"), // customer | admin
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: text("subscription_status").default("inactive"), // inactive | active | past_due | canceled
  plan: text("plan").default("none"), // none | recover | monitor | optimize
  createdAt: text("created_at").notNull(),
  lastLoginAt: text("last_login_at"),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// ── Sessions ──────────────────────────────────────────────
export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id").notNull(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull(),
});

export type Session = typeof sessions.$inferSelect;

// ── Companies ──────────────────────────────────────────────
export const companies = sqliteTable("companies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id"),
  name: text("name").notNull(),
  email: text("email").notNull(),
  annualImportSpend: real("annual_import_spend").notNull(),
  primaryCountries: text("primary_countries").notNull(), // JSON array
  htsCodesJson: text("hts_codes_json").notNull(), // JSON array of {code, description, annualValue}
  tier: text("tier").notNull().default("monitor"), // monitor | recover | enterprise
  createdAt: text("created_at").notNull(),
});

export const insertCompanySchema = createInsertSchema(companies).omit({ id: true });
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companies.$inferSelect;

// ── Tariff Alerts ─────────────────────────────────────────
export const tariffAlerts = sqliteTable("tariff_alerts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyId: integer("company_id"),
  title: text("title").notNull(),
  description: text("description").notNull(),
  severity: text("severity").notNull(), // critical | warning | info
  category: text("category").notNull(), // section301 | section232 | ieepa | usmca | new
  affectedHtsCodes: text("affected_hts_codes").notNull(), // JSON
  estimatedImpact: real("estimated_impact"),
  source: text("source").notNull(),
  sourceUrl: text("source_url"),
  publishedAt: text("published_at").notNull(),
  isGlobal: integer("is_global").notNull().default(1),
});

export const insertAlertSchema = createInsertSchema(tariffAlerts).omit({ id: true });
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type TariffAlert = typeof tariffAlerts.$inferSelect;

// ── IEEPA Refund Assessments ──────────────────────────────
export const refundAssessments = sqliteTable("refund_assessments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id"),
  companyId: integer("company_id"),
  companyName: text("company_name").notNull(),
  email: text("email").notNull(),
  annualImportSpend: real("annual_import_spend").notNull(),
  primaryCountry: text("primary_country").notNull(),
  productCategory: text("product_category").notNull(),
  estimatedRefund: real("estimated_refund").notNull(),
  estimatedSavings: real("estimated_savings").notNull(),
  status: text("status").notNull().default("pending"), // pending | processing | complete
  createdAt: text("created_at").notNull(),
});

export const insertRefundSchema = createInsertSchema(refundAssessments).omit({ id: true });
export type InsertRefund = z.infer<typeof insertRefundSchema>;
export type RefundAssessment = typeof refundAssessments.$inferSelect;

// ── Weekly Briefings ──────────────────────────────────────
export const briefings = sqliteTable("briefings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyId: integer("company_id"),
  weekOf: text("week_of").notNull(),
  headline: text("headline").notNull(),
  summary: text("summary").notNull(),
  savingsFound: real("savings_found").notNull().default(0),
  alertsTriggered: integer("alerts_triggered").notNull().default(0),
  actionsRequired: text("actions_required").notNull(), // JSON array
  createdAt: text("created_at").notNull(),
});

export const insertBriefingSchema = createInsertSchema(briefings).omit({ id: true });
export type InsertBriefing = z.infer<typeof insertBriefingSchema>;
export type Briefing = typeof briefings.$inferSelect;

// ── Agent Scan Log ────────────────────────────────────────
export const agentScans = sqliteTable("agent_scans", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  source: text("source").notNull(), // federal_register | ustr | cbp | commerce
  pagesScanned: integer("pages_scanned").notNull().default(0),
  alertsFound: integer("alerts_found").notNull().default(0),
  summary: text("summary"),
  ranAt: text("ran_at").notNull(),
});

export type AgentScan = typeof agentScans.$inferSelect;
