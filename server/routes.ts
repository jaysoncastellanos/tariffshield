import type { Express } from "express";
import { Server } from "http";
import { storage } from "./storage";
import { insertCompanySchema, insertRefundSchema } from "@shared/schema";
import { z } from "zod";

// Seed realistic demo data on startup
function seedDemoData() {
  const existing = storage.getAlerts();
  if (existing.length > 0) return;

  const now = new Date();
  const alerts = [
    {
      companyId: null,
      title: "Section 301 List 3 Rate Increase — Electronics & Consumer Goods",
      description: "USTR published a Federal Register notice increasing Section 301 tariffs on List 3 goods from China from 25% to 35%, effective May 1, 2026. Products in HTS chapters 84–85 are directly affected. Importers should review landed cost models immediately.",
      severity: "critical",
      category: "section301",
      affectedHtsCodes: JSON.stringify(["8471", "8473", "8517", "8528", "8542"]),
      estimatedImpact: 180000,
      source: "Federal Register",
      sourceUrl: "https://federalregister.gov",
      publishedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      isGlobal: 1,
    },
    {
      companyId: null,
      title: "IEEPA Refund Window Opening — File by July 15, 2026",
      description: "Following the Supreme Court's invalidation of IEEPA tariffs, CBP has announced a formal refund window. Importers who paid IEEPA duties between April 2025 and March 2026 may file for refunds. The filing deadline is July 15, 2026. Average refund across affected importers estimated at $127,000.",
      severity: "warning",
      category: "ieepa",
      affectedHtsCodes: JSON.stringify(["all"]),
      estimatedImpact: 127000,
      source: "CBP.gov",
      sourceUrl: "https://cbp.gov",
      publishedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      isGlobal: 1,
    },
    {
      companyId: null,
      title: "USMCA Review — Stricter Rules of Origin Proposed for Textiles",
      description: "In advance of the July 1 USMCA formal review, USTR circulated a proposal to raise regional value content requirements for textile and apparel products from 55% to 75%. Companies currently qualifying for duty-free treatment under USMCA should assess compliance risk.",
      severity: "warning",
      category: "usmca",
      affectedHtsCodes: JSON.stringify(["5201", "5205", "6101", "6201", "6301"]),
      estimatedImpact: 95000,
      source: "USTR.gov",
      sourceUrl: "https://ustr.gov",
      publishedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      isGlobal: 1,
    },
    {
      companyId: null,
      title: "Section 232 — Derivative Steel Products List Expanded",
      description: "The Department of Commerce added 47 new derivative steel-containing products to the Section 232 tariff list, now subject to a 50% duty rate. This includes steel components used in HVAC equipment, industrial shelving, and commercial kitchen equipment.",
      severity: "critical",
      category: "section232",
      affectedHtsCodes: JSON.stringify(["7308", "7326", "7615", "8516", "9403"]),
      estimatedImpact: 220000,
      source: "Commerce.gov",
      sourceUrl: "https://commerce.gov",
      publishedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      isGlobal: 1,
    },
    {
      companyId: null,
      title: "Vietnam Transshipment Scrutiny — CBP Enhanced Targeting",
      description: "CBP has activated enhanced targeting algorithms for goods declared as Vietnam-origin. Importers with supply chains running through Vietnam should ensure complete documentation of substantial transformation and value-add operations to avoid holds and penalties.",
      severity: "warning",
      category: "new",
      affectedHtsCodes: JSON.stringify(["6201", "6403", "8471", "9401"]),
      estimatedImpact: 45000,
      source: "CBP Trade Alert",
      sourceUrl: "https://cbp.gov",
      publishedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      isGlobal: 1,
    },
    {
      companyId: null,
      title: "FTZ Rule Change — Inverted Tariff Benefit Expansion",
      description: "CBP finalized a rule expanding Foreign Trade Zone inverted tariff benefits for electronics manufacturers. Companies assembling finished goods in FTZs from dutiable components may now elect the finished product rate, potentially reducing effective duty rates by 15–30%.",
      severity: "info",
      category: "new",
      affectedHtsCodes: JSON.stringify(["8471", "8517", "8542"]),
      estimatedImpact: 85000,
      source: "Federal Register",
      sourceUrl: "https://federalregister.gov",
      publishedAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      isGlobal: 1,
    },
  ];

  for (const alert of alerts) {
    storage.createAlert(alert as any);
  }

  // Demo briefing
  storage.createBriefing({
    companyId: null as any,
    weekOf: "April 14, 2026",
    headline: "IEEPA refund window opens — $133B available, July 15 deadline",
    summary: "This week's critical action: IEEPA refund filing window is now open. The Supreme Court ruling means every importer who paid IEEPA duties is potentially owed money back. Section 301 rate increases on electronics are confirmed for May 1. USMCA textile rules proposal creates exposure for apparel importers.",
    savingsFound: 312000,
    alertsTriggered: 6,
    actionsRequired: JSON.stringify([
      "File IEEPA refund claim before July 15 deadline",
      "Review HTS 84-85 products for May 1 Section 301 increase",
      "Assess USMCA textile RVC compliance",
    ]),
    createdAt: new Date().toISOString(),
  });
}

export function registerRoutes(httpServer: Server, app: Express) {
  seedDemoData();

  // ── Alerts ──────────────────────────────────────────────
  app.get("/api/alerts", (_req, res) => {
    try {
      const alerts = storage.getGlobalAlerts();
      res.json(alerts);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  });

  // ── Companies ────────────────────────────────────────────
  app.post("/api/companies", (req, res) => {
    try {
      const parsed = insertCompanySchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error });
      const company = storage.createCompany(parsed.data);
      res.json(company);
    } catch (e) {
      res.status(500).json({ error: "Failed to create company" });
    }
  });

  app.get("/api/companies", (_req, res) => {
    try {
      res.json(storage.getCompanies());
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch companies" });
    }
  });

  // ── Refund Assessments ────────────────────────────────────
  app.post("/api/refund-assessment", (req, res) => {
    try {
      const schema = z.object({
        companyName: z.string().min(1),
        email: z.string().email(),
        annualImportSpend: z.number().positive(),
        primaryCountry: z.string().min(1),
        productCategory: z.string().min(1),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error });

      const { annualImportSpend, primaryCountry, productCategory } = parsed.data;

      // Calculate estimated IEEPA refund based on spend, country, and period
      // IEEPA was ~10% baseline on most goods + higher on China
      const ieepaRate = primaryCountry === "China" ? 0.20 : 0.10;
      const ieepaPeriod = 0.75; // ~9 months of IEEPA tariffs paid
      const estimatedRefund = Math.round(annualImportSpend * ieepaRate * ieepaPeriod);

      // Estimate ongoing savings from optimization
      const savingsRate = primaryCountry === "China" ? 0.08 : 0.05;
      const estimatedSavings = Math.round(annualImportSpend * savingsRate);

      const assessment = storage.createRefundAssessment({
        ...parsed.data,
        companyId: null as any,
        estimatedRefund,
        estimatedSavings,
        status: "processing",
        createdAt: new Date().toISOString(),
      });
      res.json(assessment);
    } catch (e) {
      res.status(500).json({ error: "Failed to create assessment" });
    }
  });

  app.get("/api/refund-assessments", (_req, res) => {
    try {
      res.json(storage.getRefundAssessments());
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch assessments" });
    }
  });

  // ── Briefings ─────────────────────────────────────────────
  app.get("/api/briefings", (_req, res) => {
    try {
      res.json(storage.getBriefings());
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch briefings" });
    }
  });

  // ── Dashboard Stats ───────────────────────────────────────
  app.get("/api/dashboard-stats", (_req, res) => {
    try {
      const alerts = storage.getGlobalAlerts();
      const assessments = storage.getRefundAssessments();
      const critical = alerts.filter(a => a.severity === "critical").length;
      const totalRefundPipeline = assessments.reduce((s, a) => s + a.estimatedRefund, 0);
      const totalSavings = assessments.reduce((s, a) => s + a.estimatedSavings, 0);

      res.json({
        activeAlerts: alerts.length,
        criticalAlerts: critical,
        refundPipeline: totalRefundPipeline || 312000,
        totalSavingsFound: totalSavings || 185000,
        clientsMonitored: assessments.length || 23,
        lastUpdated: new Date().toISOString(),
        weeklyGrowth: 34,
      });
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  return httpServer;
}
