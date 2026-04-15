import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ── Companies ──────────────────────────────────────────────
export const companies = sqliteTable("companies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
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
  estimatedImpact: real("estimated_impact"), // dollar amount
  source: text("source").notNull(),
  sourceUrl: text("source_url"),
  publishedAt: text("published_at").notNull(),
  isGlobal: integer("is_global").notNull().default(1), // 1 = affects all clients
});

export const insertAlertSchema = createInsertSchema(tariffAlerts).omit({ id: true });
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type TariffAlert = typeof tariffAlerts.$inferSelect;

// ── IEEPA Refund Assessments ──────────────────────────────
export const refundAssessments = sqliteTable("refund_assessments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
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
