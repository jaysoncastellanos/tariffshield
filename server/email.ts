import nodemailer from "nodemailer";

// ── Transporter ───────────────────────────────────────────
// Uses environment variable SMTP config. Falls back to Ethereal (test) in dev.
let transporter: nodemailer.Transporter | null = null;

async function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Ethereal test account for development
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    console.log("[email] Using Ethereal test account:", testAccount.user);
  }
  return transporter;
}

const FROM = process.env.EMAIL_FROM || "TariffShield <intelligence@tariffshield.ai>";

// ── Email templates ───────────────────────────────────────
function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0f1e; color: #e8edf5; margin: 0; padding: 0; }
  .wrapper { max-width: 600px; margin: 0 auto; padding: 32px 16px; }
  .logo { display: flex; align-items: center; gap: 8px; margin-bottom: 32px; }
  .logo-text { font-weight: 800; font-size: 18px; color: #fff; letter-spacing: -0.02em; }
  .logo-badge { background: #f59e0b; color: #0a0f1e; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; letter-spacing: 0.05em; }
  .card { background: #111827; border: 1px solid #1e2d4a; border-radius: 12px; padding: 28px; margin-bottom: 20px; }
  .amber { color: #f59e0b; }
  .teal { color: #2dd4bf; }
  .red { color: #f87171; }
  h1 { font-size: 24px; font-weight: 800; margin: 0 0 8px; line-height: 1.2; }
  h2 { font-size: 16px; font-weight: 700; color: #f59e0b; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 12px; }
  p { font-size: 15px; line-height: 1.6; color: #94a3b8; margin: 0 0 16px; }
  .btn { display: inline-block; background: #f59e0b; color: #0a0f1e; font-weight: 700; font-size: 15px; padding: 14px 28px; border-radius: 8px; text-decoration: none; margin-top: 8px; }
  .stat { display: inline-block; margin-right: 24px; margin-bottom: 12px; }
  .stat-value { font-size: 28px; font-weight: 900; color: #f59e0b; display: block; }
  .stat-label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; }
  .alert-row { padding: 12px 0; border-bottom: 1px solid #1e2d4a; }
  .alert-row:last-child { border-bottom: none; }
  .badge { display: inline-block; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.06em; }
  .badge-critical { background: rgba(248,113,113,0.15); color: #f87171; }
  .badge-warning { background: rgba(245,158,11,0.15); color: #f59e0b; }
  .badge-info { background: rgba(45,212,191,0.15); color: #2dd4bf; }
  .footer { text-align: center; color: #334155; font-size: 12px; padding-top: 24px; }
  .action-item { padding: 8px 0 8px 16px; border-left: 2px solid #f59e0b; margin-bottom: 8px; color: #cbd5e1; font-size: 14px; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="logo">
    <svg width="28" height="28" viewBox="0 0 40 40" fill="none"><path d="M20 3L4 9v12c0 8.2 6.8 15.4 16 17 9.2-1.6 16-8.8 16-17V9L20 3z" fill="#f59e0b" fill-opacity="0.2" stroke="#f59e0b" stroke-width="1.5"/><path d="M15 20l3.5 3.5L26 16" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <span class="logo-text">TariffShield</span>
    <span class="logo-badge">AI</span>
  </div>
  ${content}
  <div class="footer">
    <p>TariffShield Intelligence · Powered by Perplexity Computer Agents<br>
    You're receiving this because you're a TariffShield subscriber.<br>
    <a href="#" style="color: #475569;">Unsubscribe</a></p>
  </div>
</div>
</body>
</html>`;
}

// ── Send functions ────────────────────────────────────────
export async function sendWelcomeEmail(to: string, name: string, plan: string): Promise<void> {
  const t = await getTransporter();
  const planDisplay = plan.toUpperCase();
  const info = await t.sendMail({
    from: FROM,
    to,
    subject: "Welcome to TariffShield — Your AI tariff intelligence is active",
    html: baseTemplate(`
      <div class="card">
        <h1>Welcome to TariffShield, ${name}.</h1>
        <p>Your <strong class="amber">TARIFFSHIELD ${planDisplay}</strong> subscription is active. Perplexity Computer agents are now monitoring the Federal Register, USTR, CBP, and Commerce.gov on your behalf — 24/7.</p>
        <div style="margin: 20px 0;">
          <div class="stat"><span class="stat-value">312</span><span class="stat-label">Federal Register pages scanned daily</span></div>
          <div class="stat"><span class="stat-value">$133B</span><span class="stat-label">IEEPA refunds available</span></div>
        </div>
        <p><strong>Your first intelligence briefing will arrive this week.</strong> In the meantime, complete your import profile so our agents can map tariff changes to your specific HTS codes.</p>
        <a href="${process.env.APP_URL || 'https://tariffshield.ai'}/#/dashboard" class="btn">Open Your Dashboard →</a>
      </div>
      <div class="card">
        <h2>⚠ Immediate Action Required</h2>
        <p>The <strong class="amber">IEEPA refund filing deadline is July 15, 2026</strong>. If you imported goods between April 2025 and March 2026, you may be owed a significant refund. Our agents are calculating your exposure now.</p>
        <div class="action-item">File IEEPA refund claim before July 15 — avg. refund $127K</div>
        <div class="action-item">Review Section 301 List 3 rate increases effective May 1, 2026</div>
        <div class="action-item">Complete your HTS code profile for personalized intelligence</div>
      </div>
    `),
  });
  if (process.env.NODE_ENV !== "production") {
    console.log("[email] Preview URL:", nodemailer.getTestMessageUrl(info));
  }
}

export async function sendWeeklyBriefingEmail(
  to: string,
  name: string,
  briefing: {
    headline: string;
    summary: string;
    savingsFound: number;
    alertsTriggered: number;
    actionsRequired: string[];
    alerts: Array<{ title: string; severity: string; estimatedImpact: number | null }>;
  }
): Promise<void> {
  const t = await getTransporter();
  const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n}`;
  const alertRows = briefing.alerts.slice(0, 5).map(a => `
    <div class="alert-row">
      <span class="badge badge-${a.severity}">${a.severity}</span>
      <span style="color:#e2e8f0; font-size:14px; margin-left:8px;">${a.title}</span>
      ${a.estimatedImpact ? `<span style="float:right;color:#f59e0b;font-weight:700;font-size:14px;">${fmt(a.estimatedImpact)}</span>` : ""}
    </div>
  `).join("");

  const actionItems = briefing.actionsRequired.map(a => `<div class="action-item">${a}</div>`).join("");

  const info = await t.sendMail({
    from: FROM,
    to,
    subject: `TariffShield Weekly Intelligence — ${briefing.headline}`,
    html: baseTemplate(`
      <div class="card">
        <p style="color:#64748b; font-size:12px; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:4px;">Weekly Intelligence Briefing · Powered by Perplexity Computer</p>
        <h1>${briefing.headline}</h1>
        <div style="margin: 20px 0;">
          <div class="stat"><span class="stat-value amber">${fmt(briefing.savingsFound)}</span><span class="stat-label">Savings identified</span></div>
          <div class="stat"><span class="stat-value">${briefing.alertsTriggered}</span><span class="stat-label">Alerts triggered</span></div>
        </div>
        <p>${briefing.summary}</p>
      </div>
      <div class="card">
        <h2>Active Intelligence Alerts</h2>
        ${alertRows}
      </div>
      <div class="card">
        <h2>Required Actions</h2>
        ${actionItems}
        <a href="${process.env.APP_URL || 'https://tariffshield.ai'}/#/dashboard" class="btn" style="margin-top:16px;">View Full Dashboard →</a>
      </div>
    `),
  });
  if (process.env.NODE_ENV !== "production") {
    console.log("[email] Preview URL:", nodemailer.getTestMessageUrl(info));
  }
}

export async function sendRefundAssessmentEmail(
  to: string,
  name: string,
  estimatedRefund: number,
  estimatedSavings: number
): Promise<void> {
  const t = await getTransporter();
  const fmt = (n: number) => n >= 1000000 ? `$${(n / 1000000).toFixed(1)}M` : `$${(n / 1000).toFixed(0)}K`;
  const info = await t.sendMail({
    from: FROM,
    to,
    subject: `Your IEEPA Refund Assessment — ${fmt(estimatedRefund)} identified`,
    html: baseTemplate(`
      <div class="card">
        <h2>IEEPA Refund Assessment Complete</h2>
        <h1>We found <span class="amber">${fmt(estimatedRefund)}</span> in potential refunds.</h1>
        <p>Based on your import spend, country of origin, and product category, TariffShield's Perplexity Computer agents have identified a significant IEEPA refund opportunity for your company.</p>
        <div style="margin: 24px 0;">
          <div class="stat"><span class="stat-value amber">${fmt(estimatedRefund)}</span><span class="stat-label">One-time IEEPA refund</span></div>
          <div class="stat"><span class="stat-value teal">${fmt(estimatedSavings)}</span><span class="stat-label">Annual ongoing savings</span></div>
        </div>
        <p><strong style="color:#f87171;">⚠ Filing deadline: July 15, 2026.</strong> IEEPA refund claims must be filed before this date. TariffShield handles the entire process for a 15% success fee — you pay nothing unless we recover money for you.</p>
        <a href="${process.env.APP_URL || 'https://tariffshield.ai'}/#/onboarding" class="btn">Claim Your Refund — Zero Upfront →</a>
      </div>
    `),
  });
  if (process.env.NODE_ENV !== "production") {
    console.log("[email] Refund assessment email preview:", nodemailer.getTestMessageUrl(info));
  }
}

export async function sendAlertEmail(
  to: string,
  name: string,
  alert: { title: string; description: string; severity: string; estimatedImpact: number | null }
): Promise<void> {
  const t = await getTransporter();
  const severityLabel = alert.severity === "critical" ? "🚨 CRITICAL ALERT" : alert.severity === "warning" ? "⚠ WARNING" : "ℹ INFO";
  const info = await t.sendMail({
    from: FROM,
    to,
    subject: `${severityLabel}: ${alert.title}`,
    html: baseTemplate(`
      <div class="card" style="border-color: ${alert.severity === "critical" ? "rgba(248,113,113,0.3)" : "rgba(245,158,11,0.3)"}">
        <span class="badge badge-${alert.severity}" style="margin-bottom:12px;display:inline-block;">${alert.severity}</span>
        <h1 style="font-size:20px;">${alert.title}</h1>
        ${alert.estimatedImpact ? `<div class="stat" style="margin:16px 0"><span class="stat-value red">$${(alert.estimatedImpact/1000).toFixed(0)}K</span><span class="stat-label">Estimated impact</span></div>` : ""}
        <p>${alert.description}</p>
        <a href="${process.env.APP_URL || 'https://tariffshield.ai'}/#/dashboard" class="btn">View in Dashboard →</a>
      </div>
    `),
  });
  if (process.env.NODE_ENV !== "production") {
    console.log("[email] Alert email preview:", nodemailer.getTestMessageUrl(info));
  }
}
