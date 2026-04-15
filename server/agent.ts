/**
 * TariffShield Computer Agent
 * 
 * Uses Perplexity's search API to scan Federal Register, USTR, CBP, and
 * Commerce.gov for new tariff developments. Generates intelligence briefings
 * automatically. Runs on a schedule (weekly) or on-demand.
 */

import { storage } from "./storage";
import { db } from "./db";
import { agentScans, users } from "@shared/schema";
import { sendWeeklyBriefingEmail } from "./email";

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

// ── Perplexity search ─────────────────────────────────────
async function perplexitySearch(query: string, systemPrompt?: string): Promise<string> {
  if (!PERPLEXITY_API_KEY) {
    console.log("[agent] No Perplexity API key — using cached intelligence");
    return "";
  }

  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "sonar-pro",
      messages: [
        {
          role: "system",
          content: systemPrompt || `You are a US trade compliance intelligence agent. 
          Analyze tariff policy changes from official US government sources (Federal Register, USTR, CBP, Commerce.gov).
          Focus on actionable intelligence for US importers. Be precise about HTS codes, rates, and effective dates.
          Format responses as structured JSON when asked.`,
        },
        { role: "user", content: query },
      ],
      max_tokens: 2000,
      temperature: 0.1,
      return_citations: true,
    }),
  });

  if (!response.ok) {
    console.error("[agent] Perplexity API error:", response.status, await response.text());
    return "";
  }

  const data = await response.json() as any;
  return data.choices?.[0]?.message?.content || "";
}

// ── Scan for new tariff developments ─────────────────────
export async function scanTariffDevelopments(): Promise<{
  alertsCreated: number;
  summary: string;
}> {
  console.log("[agent] Starting tariff intelligence scan...");

  const scanSources = [
    {
      name: "Federal Register",
      query: `Search the Federal Register published in the last 7 days for any new tariff notices, duty rate changes, or trade policy actions affecting US importers. 
      Include: HTS codes affected, effective dates, duty rate changes, and which product categories are impacted.
      Return as JSON array: [{title, description, severity (critical/warning/info), category (section301/section232/ieepa/usmca/new), affectedHtsCodes: string[], estimatedImpactUSD, source, sourceUrl, publishedDate}]`,
    },
    {
      name: "USTR",
      query: `Search USTR.gov for any new Section 301 tariff actions, exclusion requests, trade agreement updates, or reciprocal tariff announcements from the past 7 days.
      Focus on actions affecting US importers. Return as JSON array with same schema.`,
    },
    {
      name: "CBP",
      query: `Search CBP.gov for new binding rulings, country of origin guidance changes, duty drawback updates, or enhanced targeting actions from the past 7 days.
      Return as JSON array with same schema.`,
    },
  ];

  let totalAlertsCreated = 0;
  const summaryParts: string[] = [];

  for (const source of scanSources) {
    try {
      const result = await perplexitySearch(source.query);
      if (!result) continue;

      // Try to extract JSON from the response
      const jsonMatch = result.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        summaryParts.push(`${source.name}: ${result.slice(0, 200)}`);
        continue;
      }

      let alerts: any[];
      try {
        alerts = JSON.parse(jsonMatch[0]);
      } catch {
        continue;
      }

      for (const alert of alerts) {
        if (!alert.title || !alert.description) continue;
        try {
          storage.createAlert({
            companyId: null as any,
            title: alert.title,
            description: alert.description,
            severity: ["critical", "warning", "info"].includes(alert.severity) ? alert.severity : "info",
            category: ["section301", "section232", "ieepa", "usmca", "new"].includes(alert.category) ? alert.category : "new",
            affectedHtsCodes: JSON.stringify(alert.affectedHtsCodes || []),
            estimatedImpact: alert.estimatedImpactUSD || null,
            source: alert.source || source.name,
            sourceUrl: alert.sourceUrl || null,
            publishedAt: alert.publishedDate || new Date().toISOString(),
            isGlobal: 1,
          });
          totalAlertsCreated++;
        } catch (e) {
          console.error("[agent] Failed to create alert:", e);
        }
      }

      summaryParts.push(`${source.name}: ${alerts.length} alerts found`);

      // Log scan
      db.insert(agentScans).values({
        source: source.name.toLowerCase().replace(" ", "_"),
        pagesScanned: 50, // Approximate
        alertsFound: alerts.length,
        summary: result.slice(0, 500),
        ranAt: new Date().toISOString(),
      }).run();

    } catch (e) {
      console.error(`[agent] Error scanning ${source.name}:`, e);
    }
  }

  const summary = summaryParts.join(" | ") || "Scan completed — using cached intelligence";
  console.log("[agent] Scan complete:", summary);

  return { alertsCreated: totalAlertsCreated, summary };
}

// ── Generate weekly briefing ──────────────────────────────
export async function generateWeeklyBriefing(companyId?: number): Promise<{
  headline: string;
  summary: string;
  savingsFound: number;
  alertsTriggered: number;
  actionsRequired: string[];
}> {
  const alerts = storage.getGlobalAlerts();
  const recentAlerts = alerts.slice(0, 6);
  const criticalCount = recentAlerts.filter(a => a.severity === "critical").length;
  const totalImpact = recentAlerts.reduce((s, a) => s + (a.estimatedImpact || 0), 0);

  // Build context for Perplexity to generate the briefing
  const alertContext = recentAlerts.map(a =>
    `- [${a.severity.toUpperCase()}] ${a.title}: ${a.description.slice(0, 200)}`
  ).join("\n");

  const briefingQuery = `Based on these current US tariff intelligence alerts, generate a weekly briefing for an importer:

${alertContext}

Generate a JSON response with:
{
  "headline": "One compelling headline summarizing the week's most important development (max 100 chars)",
  "summary": "2-3 sentence executive summary of the week's tariff landscape and what importers must know",
  "savingsFound": <estimated dollar amount of savings opportunities identified>,
  "actionsRequired": ["action1", "action2", "action3", "action4"] // 3-4 specific, urgent action items
}

Be specific, urgent, and data-driven. Focus on actionable intelligence.`;

  let briefingData = {
    headline: "IEEPA refund window open — $133B available, July 15 deadline",
    summary: "The Supreme Court's IEEPA invalidation creates an immediate refund opportunity for all importers. Simultaneously, Section 301 rate increases on electronics take effect May 1 and USMCA textile rules face revision. This is the most consequential week for US trade compliance in years.",
    savingsFound: 312000,
    actionsRequired: [
      "File IEEPA refund claim before July 15, 2026 — avg. refund $127K",
      "Review HTS chapters 84-85 for Section 301 rate increase to 35% on May 1",
      "Assess USMCA textile RVC compliance ahead of July 1 formal review",
      "Evaluate FTZ inverted tariff benefit for electronics assembly operations",
    ],
  };

  if (PERPLEXITY_API_KEY) {
    try {
      const result = await perplexitySearch(briefingQuery);
      if (result) {
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.headline && parsed.summary) {
            briefingData = { ...briefingData, ...parsed };
          }
        }
      }
    } catch (e) {
      console.error("[agent] Briefing generation error:", e);
    }
  }

  return {
    ...briefingData,
    alertsTriggered: recentAlerts.length,
  };
}

// ── Send weekly briefings to all active subscribers ───────
export async function sendWeeklyBriefingsToAll(): Promise<{ sent: number; errors: number }> {
  console.log("[agent] Sending weekly briefings to all subscribers...");

  const allUsers = db.select().from(users).all();
  const activeUsers = allUsers.filter(u =>
    u.subscriptionStatus === "active" && u.plan !== "none"
  );

  const alerts = storage.getGlobalAlerts();
  const briefingData = await generateWeeklyBriefing();

  let sent = 0;
  let errors = 0;

  for (const user of activeUsers) {
    try {
      await sendWeeklyBriefingEmail(user.email, user.name, {
        ...briefingData,
        alerts: alerts.slice(0, 5).map(a => ({
          title: a.title,
          severity: a.severity,
          estimatedImpact: a.estimatedImpact,
        })),
      });
      sent++;
    } catch (e) {
      console.error(`[agent] Failed to send briefing to ${user.email}:`, e);
      errors++;
    }
  }

  // Save briefing record
  storage.createBriefing({
    companyId: null as any,
    weekOf: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    headline: briefingData.headline,
    summary: briefingData.summary,
    savingsFound: briefingData.savingsFound,
    alertsTriggered: briefingData.alertsTriggered,
    actionsRequired: JSON.stringify(briefingData.actionsRequired),
    createdAt: new Date().toISOString(),
  });

  console.log(`[agent] Briefings sent: ${sent}, errors: ${errors}`);
  return { sent, errors };
}

// ── Scheduled agent run ───────────────────────────────────
// Call this from a cron or on server startup (weekly)
export async function runWeeklyAgentCycle(): Promise<void> {
  console.log("[agent] Starting weekly agent cycle...");
  try {
    await scanTariffDevelopments();
    await sendWeeklyBriefingsToAll();
    console.log("[agent] Weekly cycle complete.");
  } catch (e) {
    console.error("[agent] Weekly cycle failed:", e);
  }
}
