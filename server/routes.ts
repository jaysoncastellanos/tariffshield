import type { Express, Request, Response } from "express";
import { Server } from "http";
import { storage } from "./storage";
import { insertCompanySchema, insertRefundSchema } from "@shared/schema";
import { z } from "zod";
import { hashPassword, verifyPassword, createSession, deleteSession, requireAuth, optionalAuth, SESSION_COOKIE, type AuthRequest } from "./auth";
import { sendWelcomeEmail, sendRefundAssessmentEmail, sendWeeklyBriefingEmail } from "./email";
import { scanTariffDevelopments, generateWeeklyBriefing, sendWeeklyBriefingsToAll } from "./agent";
import Stripe from "stripe";

// ── Stripe ────────────────────────────────────────────────
const stripeClient = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-03-31.basil" })
  : null;

const STRIPE_PRICES: Record<string, string> = {
  monitor: process.env.STRIPE_PRICE_MONITOR || "",
  optimize: process.env.STRIPE_PRICE_OPTIMIZE || "",
};

// ── Seed demo data ────────────────────────────────────────
function seedDemoData() {
  const existing = storage.getAlerts();
  if (existing.length > 0) return;

  const now = new Date();
  const alerts = [
    {
      companyId: null as any,
      title: "Section 301 List 3 Rate Increase — Electronics & Consumer Goods",
      description: "USTR published a Federal Register notice increasing Section 301 tariffs on List 3 goods from China from 25% to 35%, effective May 1, 2026. Products in HTS chapters 84–85 are directly affected. Importers should review landed cost models immediately.",
      severity: "critical", category: "section301",
      affectedHtsCodes: JSON.stringify(["8471", "8473", "8517", "8528", "8542"]),
      estimatedImpact: 180000, source: "Federal Register", sourceUrl: "https://federalregister.gov",
      publishedAt: new Date(now.getTime() - 2 * 86400000).toISOString(), isGlobal: 1,
    },
    {
      companyId: null as any,
      title: "IEEPA Refund Window Opening — File by July 15, 2026",
      description: "Following the Supreme Court's invalidation of IEEPA tariffs, CBP has announced a formal refund window. Importers who paid IEEPA duties between April 2025 and March 2026 may file for refunds. The filing deadline is July 15, 2026. Average refund across affected importers estimated at $127,000.",
      severity: "warning", category: "ieepa",
      affectedHtsCodes: JSON.stringify(["all"]), estimatedImpact: 127000,
      source: "CBP.gov", sourceUrl: "https://cbp.gov",
      publishedAt: new Date(now.getTime() - 1 * 86400000).toISOString(), isGlobal: 1,
    },
    {
      companyId: null as any,
      title: "USMCA Review — Stricter Rules of Origin Proposed for Textiles",
      description: "In advance of the July 1 USMCA formal review, USTR circulated a proposal to raise regional value content requirements for textile and apparel products from 55% to 75%. Companies currently qualifying for duty-free treatment under USMCA should assess compliance risk.",
      severity: "warning", category: "usmca",
      affectedHtsCodes: JSON.stringify(["5201", "5205", "6101", "6201", "6301"]),
      estimatedImpact: 95000, source: "USTR.gov", sourceUrl: "https://ustr.gov",
      publishedAt: new Date(now.getTime() - 3 * 86400000).toISOString(), isGlobal: 1,
    },
    {
      companyId: null as any,
      title: "Section 232 — Derivative Steel Products List Expanded",
      description: "The Department of Commerce added 47 new derivative steel-containing products to the Section 232 tariff list, now subject to a 50% duty rate. This includes steel components used in HVAC equipment, industrial shelving, and commercial kitchen equipment.",
      severity: "critical", category: "section232",
      affectedHtsCodes: JSON.stringify(["7308", "7326", "7615", "8516", "9403"]),
      estimatedImpact: 220000, source: "Commerce.gov", sourceUrl: "https://commerce.gov",
      publishedAt: new Date(now.getTime() - 4 * 86400000).toISOString(), isGlobal: 1,
    },
    {
      companyId: null as any,
      title: "Vietnam Transshipment Scrutiny — CBP Enhanced Targeting",
      description: "CBP has activated enhanced targeting algorithms for goods declared as Vietnam-origin. Importers with supply chains running through Vietnam should ensure complete documentation of substantial transformation.",
      severity: "warning", category: "new",
      affectedHtsCodes: JSON.stringify(["6201", "6403", "8471", "9401"]),
      estimatedImpact: 45000, source: "CBP Trade Alert", sourceUrl: "https://cbp.gov",
      publishedAt: new Date(now.getTime() - 5 * 86400000).toISOString(), isGlobal: 1,
    },
    {
      companyId: null as any,
      title: "FTZ Rule Change — Inverted Tariff Benefit Expansion",
      description: "CBP finalized a rule expanding Foreign Trade Zone inverted tariff benefits for electronics manufacturers. Companies assembling finished goods in FTZs from dutiable components may elect the finished product rate, potentially reducing effective duty rates by 15–30%.",
      severity: "info", category: "new",
      affectedHtsCodes: JSON.stringify(["8471", "8517", "8542"]),
      estimatedImpact: 85000, source: "Federal Register", sourceUrl: "https://federalregister.gov",
      publishedAt: new Date(now.getTime() - 6 * 86400000).toISOString(), isGlobal: 1,
    },
  ];

  for (const alert of alerts) storage.createAlert(alert as any);

  storage.createBriefing({
    companyId: null as any,
    weekOf: "April 14, 2026",
    headline: "IEEPA refund window open — $133B available, July 15 deadline",
    summary: "Critical week for US trade compliance. IEEPA refund window is now open — every importer who paid IEEPA duties between April 2025 and March 2026 may be owed significant money back. Section 301 rate increases on electronics confirmed for May 1. USMCA textile rules proposal creates exposure for apparel importers.",
    savingsFound: 312000, alertsTriggered: 6,
    actionsRequired: JSON.stringify([
      "File IEEPA refund claim before July 15 deadline — est. $127K recovery",
      "Review HTS 84-85 products: Sec. 301 rate increases 25%→35% on May 1",
      "Assess USMCA textile RVC compliance before July 1 review",
      "FTZ inverted tariff rule now covers 47 additional electronics components",
    ]),
    createdAt: new Date().toISOString(),
  });
}

// ── Register all routes ───────────────────────────────────
export function registerRoutes(httpServer: Server, app: Express) {
  seedDemoData();

  // ── Health check (Railway uses this) ──────────────────
  app.get("/api/health", (_req, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString(), version: "1.0.0" });
  });

  // ╔══════════════════════════════════════════════════════╗
  // ║  AUTH ROUTES                                         ║
  // ╚══════════════════════════════════════════════════════╝

  // Sign up
  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        name: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(8),
        plan: z.enum(["recover", "monitor", "optimize"]).optional().default("monitor"),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });

      const { name, email, password, plan } = parsed.data;
      const existing = storage.getUserByEmail(email);
      if (existing) return res.status(409).json({ error: "Email already registered" });

      const passwordHash = await hashPassword(password);
      const user = storage.createUser({
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: "customer",
        plan,
        subscriptionStatus: "inactive",
        createdAt: new Date().toISOString(),
      });

      const sessionId = createSession(user.id);
      res.cookie(SESSION_COOKIE, sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      // Send welcome email (non-blocking)
      sendWelcomeEmail(user.email, user.name, plan).catch(console.error);

      const { passwordHash: _, ...safeUser } = user;
      res.json({ user: safeUser, sessionId });
    } catch (e) {
      console.error("[auth] Signup error:", e);
      res.status(500).json({ error: "Signup failed" });
    }
  });

  // Login
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        email: z.string().email(),
        password: z.string().min(1),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

      const user = storage.getUserByEmail(parsed.data.email);
      if (!user) return res.status(401).json({ error: "Invalid email or password" });

      const valid = await verifyPassword(parsed.data.password, user.passwordHash);
      if (!valid) return res.status(401).json({ error: "Invalid email or password" });

      storage.updateUser(user.id, { lastLoginAt: new Date().toISOString() });

      const sessionId = createSession(user.id);
      res.cookie(SESSION_COOKIE, sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      const { passwordHash: _, ...safeUser } = user;
      res.json({ user: safeUser, sessionId });
    } catch (e) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req: AuthRequest, res: Response) => {
    const sessionId = req.cookies?.[SESSION_COOKIE] || req.headers["x-session-id"] as string;
    if (sessionId) deleteSession(sessionId);
    res.clearCookie(SESSION_COOKIE);
    res.json({ ok: true });
  });

  // Get current user
  app.get("/api/auth/me", requireAuth, (req: AuthRequest, res: Response) => {
    const { passwordHash: _, ...safeUser } = req.user!;
    res.json(safeUser);
  });

  // ╔══════════════════════════════════════════════════════╗
  // ║  STRIPE ROUTES                                       ║
  // ╚══════════════════════════════════════════════════════╝

  // Create checkout session
  app.post("/api/stripe/checkout", requireAuth, async (req: AuthRequest, res: Response) => {
    if (!stripeClient) {
      // Demo mode — simulate successful subscription
      storage.updateUser(req.user!.id, {
        subscriptionStatus: "active",
        plan: req.body.plan || "monitor",
      });
      return res.json({ url: `${process.env.APP_URL || ""}/#/dashboard?subscribed=true`, demo: true });
    }

    try {
      const { plan } = z.object({ plan: z.enum(["monitor", "optimize"]) }).parse(req.body);
      const priceId = STRIPE_PRICES[plan];
      if (!priceId) return res.status(400).json({ error: "Invalid plan" });

      let customerId = req.user!.stripeCustomerId;
      if (!customerId) {
        const customer = await stripeClient.customers.create({
          email: req.user!.email,
          name: req.user!.name,
          metadata: { userId: String(req.user!.id) },
        });
        customerId = customer.id;
        storage.updateUser(req.user!.id, { stripeCustomerId: customerId });
      }

      const session = await stripeClient.checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${process.env.APP_URL || "http://localhost:5000"}/#/dashboard?subscribed=true`,
        cancel_url: `${process.env.APP_URL || "http://localhost:5000"}/#/onboarding`,
        metadata: { userId: String(req.user!.id), plan },
        subscription_data: { metadata: { userId: String(req.user!.id), plan } },
      });

      res.json({ url: session.url });
    } catch (e: any) {
      console.error("[stripe] Checkout error:", e);
      res.status(500).json({ error: e.message || "Checkout failed" });
    }
  });

  // Stripe webhook — activates subscription after payment
  app.post("/api/stripe/webhook", async (req: Request, res: Response) => {
    if (!stripeClient) return res.json({ received: true });

    const sig = req.headers["stripe-signature"] as string;
    let event: Stripe.Event;

    try {
      event = stripeClient.webhooks.constructEvent(
        req.rawBody as any,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET || ""
      );
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = parseInt(session.metadata?.userId || "0");
      const plan = session.metadata?.plan || "monitor";
      if (userId) {
        storage.updateUser(userId, {
          subscriptionStatus: "active",
          plan,
          stripeSubscriptionId: session.subscription as string,
        });
        const user = storage.getUserById(userId);
        if (user) sendWelcomeEmail(user.email, user.name, plan).catch(console.error);
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;
      const userId = parseInt(sub.metadata?.userId || "0");
      if (userId) storage.updateUser(userId, { subscriptionStatus: "canceled" });
    }

    if (event.type === "customer.subscription.updated") {
      const sub = event.data.object as Stripe.Subscription;
      const userId = parseInt(sub.metadata?.userId || "0");
      if (userId) {
        storage.updateUser(userId, {
          subscriptionStatus: sub.status as any,
        });
      }
    }

    res.json({ received: true });
  });

  // Create RECOVER plan (performance fee — no upfront charge)
  app.post("/api/stripe/recover", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      // RECOVER plan = no payment needed upfront, just activate
      storage.updateUser(req.user!.id, {
        subscriptionStatus: "active",
        plan: "recover",
      });
      const user = storage.getUserById(req.user!.id);
      if (user) sendWelcomeEmail(user.email, user.name, "recover").catch(console.error);
      res.json({ ok: true, plan: "recover" });
    } catch (e) {
      res.status(500).json({ error: "Failed to activate RECOVER plan" });
    }
  });

  // ╔══════════════════════════════════════════════════════╗
  // ║  PUBLIC DATA ROUTES                                  ║
  // ╚══════════════════════════════════════════════════════╝

  app.get("/api/alerts", (_req, res: Response) => {
    try {
      res.json(storage.getGlobalAlerts());
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  });

  app.get("/api/briefings", (_req, res: Response) => {
    try {
      res.json(storage.getBriefings());
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch briefings" });
    }
  });

  app.get("/api/dashboard-stats", (_req, res: Response) => {
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

  // ╔══════════════════════════════════════════════════════╗
  // ║  REFUND CALCULATOR (public — lead gen)               ║
  // ╚══════════════════════════════════════════════════════╝

  app.post("/api/refund-assessment", optionalAuth, async (req: AuthRequest, res: Response) => {
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

      const { annualImportSpend, primaryCountry } = parsed.data;
      const ieepaRate = primaryCountry === "China" ? 0.20 : primaryCountry === "Vietnam" ? 0.15 : 0.10;
      const estimatedRefund = Math.round(annualImportSpend * ieepaRate * 0.75);
      const estimatedSavings = Math.round(annualImportSpend * (primaryCountry === "China" ? 0.08 : 0.05));

      const assessment = storage.createRefundAssessment({
        ...parsed.data,
        userId: req.user?.id || null as any,
        companyId: null as any,
        estimatedRefund,
        estimatedSavings,
        status: "processing",
        createdAt: new Date().toISOString(),
      });

      // Send assessment email (non-blocking)
      sendRefundAssessmentEmail(
        parsed.data.email,
        parsed.data.companyName,
        estimatedRefund,
        estimatedSavings
      ).catch(console.error);

      res.json(assessment);
    } catch (e) {
      res.status(500).json({ error: "Failed to create assessment" });
    }
  });

  app.get("/api/refund-assessments", (_req, res: Response) => {
    try {
      res.json(storage.getRefundAssessments());
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch assessments" });
    }
  });

  // ╔══════════════════════════════════════════════════════╗
  // ║  COMPANY / ONBOARDING                                ║
  // ╚══════════════════════════════════════════════════════╝

  app.post("/api/companies", optionalAuth, (req: AuthRequest, res: Response) => {
    try {
      const parsed = insertCompanySchema.safeParse({
        ...req.body,
        userId: req.user?.id || null,
      });
      if (!parsed.success) return res.status(400).json({ error: parsed.error });
      const company = storage.createCompany(parsed.data);
      res.json(company);
    } catch (e) {
      res.status(500).json({ error: "Failed to create company" });
    }
  });

  app.get("/api/companies", (_req, res: Response) => {
    try {
      res.json(storage.getCompanies());
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch companies" });
    }
  });

  // ╔══════════════════════════════════════════════════════╗
  // ║  COMPUTER AGENT ENDPOINTS                            ║
  // ╚══════════════════════════════════════════════════════╝

  // Trigger a live tariff scan (admin or cron)
  app.post("/api/agent/scan", async (req: Request, res: Response) => {
    const adminKey = req.headers["x-admin-key"];
    if (adminKey !== process.env.ADMIN_KEY && process.env.NODE_ENV === "production") {
      return res.status(403).json({ error: "Unauthorized" });
    }
    try {
      const result = await scanTariffDevelopments();
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Generate + send weekly briefings
  app.post("/api/agent/send-briefings", async (req: Request, res: Response) => {
    const adminKey = req.headers["x-admin-key"];
    if (adminKey !== process.env.ADMIN_KEY && process.env.NODE_ENV === "production") {
      return res.status(403).json({ error: "Unauthorized" });
    }
    try {
      const result = await sendWeeklyBriefingsToAll();
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Get agent scan log
  app.get("/api/agent/scans", (_req, res: Response) => {
    try {
      res.json(storage.getRecentScans());
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch scans" });
    }
  });

  return httpServer;
}
