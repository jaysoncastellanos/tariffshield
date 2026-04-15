import { Link } from "wouter";
import { Shield, AlertTriangle, TrendingDown, Bell, FileText, DollarSign, Clock, ChevronRight, RefreshCw, ArrowLeft, Zap, BarChart2, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

// ── Logo ──────────────────────────────────────────────────
function TariffShieldLogo({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-label="TariffShield">
      <path d="M20 3L4 9v12c0 8.2 6.8 15.4 16 17 9.2-1.6 16-8.8 16-17V9L20 3z" fill="hsl(38 95% 55%)" fillOpacity="0.15" stroke="hsl(38 95% 55%)" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M20 8L8 13v9c0 5.8 5 11 12 12.5C27 33 32 27.8 32 22v-9L20 8z" fill="hsl(38 95% 55%)" fillOpacity="0.08"/>
      <path d="M15 20l3.5 3.5L26 16" stroke="hsl(38 95% 55%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function formatDollar(n: number): string {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(2)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

// Demo savings trend data
const savingsTrend = [
  { week: "Wk 1", savings: 18000, alerts: 2 },
  { week: "Wk 2", savings: 45000, alerts: 4 },
  { week: "Wk 3", savings: 82000, alerts: 3 },
  { week: "Wk 4", savings: 127000, alerts: 6 },
  { week: "Wk 5", savings: 190000, alerts: 5 },
  { week: "Wk 6", savings: 245000, alerts: 7 },
  { week: "Now", savings: 312000, alerts: 6 },
];

const tariffsExposure = [
  { name: "Sec. 301", rate: 35, spend: 220000 },
  { name: "Sec. 232", rate: 50, spend: 180000 },
  { name: "IEEPA", rate: 10, spend: 150000 },
  { name: "AD/CVD", rate: 25, spend: 95000 },
  { name: "USMCA Risk", rate: 30, spend: 60000 },
];

const weeklyBriefing = {
  headline: "IEEPA refund window open — file by July 15 · Sec. 301 increase confirmed May 1",
  actions: [
    { priority: "critical", text: "File IEEPA refund claim before July 15 deadline — est. $127K recovery" },
    { priority: "warning", text: "Review HTS 84-85 products: Sec. 301 rate increases 25%→35% on May 1" },
    { priority: "warning", text: "Assess USMCA textile RVC compliance before July 1 review" },
    { priority: "info", text: "FTZ inverted tariff rule now covers 47 additional electronics components" },
  ],
  computerActivity: [
    "Scanned 312 Federal Register pages this week",
    "Mapped 6 new tariff changes to client HTS codes",
    "Identified $312,000 in refund/savings opportunities",
    "Monitored USTR, CBP, and Commerce daily",
    "Generated weekly intelligence briefing for 23 clients",
  ],
};

// ── Custom Tooltip ─────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-3 text-sm shadow-xl">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold num">
          {p.name === "savings" ? formatDollar(p.value) : `${p.value} alerts`}
        </p>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard-stats"],
    queryFn: () => apiRequest("GET", "/api/dashboard-stats").then(r => r.json()),
    refetchInterval: 30000,
  });

  const { data: alerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ["/api/alerts"],
    queryFn: () => apiRequest("GET", "/api/alerts").then(r => r.json()),
  });

  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="min-h-screen bg-background">
      {/* ── Top Nav ───────────────────────────────────────── */}
      <nav className="border-b border-border bg-card/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer">
                <TariffShieldLogo size={22} />
                <span className="font-bold text-foreground tracking-tight text-sm">TariffShield</span>
              </div>
            </Link>
            <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-3 py-1.5 rounded-full">
              <span className="status-dot monitoring alert-live w-1.5 h-1.5"></span>
              <span>Live · Updated {timeStr}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/calculator">
              <Button size="sm" variant="ghost" className="text-amber text-xs hover:bg-amber/10">
                + New Refund Scan
              </Button>
            </Link>
            <Link href="/onboarding">
              <Button size="sm" className="bg-primary text-primary-foreground text-xs font-semibold">
                Add Client
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* ── Page Header ────────────────────────────────── */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-black text-foreground">Intelligence Dashboard</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Week of April 14, 2026 · Perplexity Computer agent active</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <RefreshCw className="w-3 h-3" />
            <span>Auto-refresh every 30s</span>
          </div>
        </div>

        {/* ── KPI Row ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {statsLoading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="skeleton h-24 rounded-xl" />
            ))
          ) : (
            <>
              <div className="card-surface p-4" data-testid="kpi-active-alerts">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Active Alerts</span>
                  <Bell className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-black text-foreground num">{stats?.activeAlerts ?? 0}</div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="status-dot critical w-1.5 h-1.5"></span>
                  <span className="text-xs text-red-400">{stats?.criticalAlerts ?? 0} critical</span>
                </div>
              </div>

              <div className="card-surface p-4 border-amber/20 glow-amber" data-testid="kpi-refund-pipeline">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Refund Pipeline</span>
                  <DollarSign className="w-4 h-4 text-amber" />
                </div>
                <div className="text-2xl font-black text-amber num">{formatDollar(stats?.refundPipeline ?? 0)}</div>
                <div className="text-xs text-muted-foreground mt-1">IEEPA recovery identified</div>
              </div>

              <div className="card-surface p-4" data-testid="kpi-savings-found">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Savings Found</span>
                  <TrendingDown className="w-4 h-4 text-teal" />
                </div>
                <div className="text-2xl font-black text-teal num">{formatDollar(stats?.totalSavingsFound ?? 0)}</div>
                <div className="text-xs text-muted-foreground mt-1">Annual ongoing savings</div>
              </div>

              <div className="card-surface p-4" data-testid="kpi-clients">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Clients Monitored</span>
                  <Shield className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-black text-foreground num">{stats?.clientsMonitored ?? 0}</div>
                <div className="text-xs text-green-400 mt-1">↑ {stats?.weeklyGrowth ?? 0}% this week</div>
              </div>
            </>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          {/* ── Left: Alerts + Briefing ─────────────────── */}
          <div className="lg:col-span-2 space-y-5">
            {/* Weekly Briefing */}
            <div className="card-surface p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber" />
                  <span className="font-bold text-foreground text-sm">Weekly Briefing</span>
                  <Badge className="bg-amber/15 text-amber border-amber/30 text-xs">Week of Apr 14</Badge>
                </div>
                <span className="text-xs text-muted-foreground">Generated by Computer</span>
              </div>

              <p className="text-sm text-foreground font-medium mb-4 leading-relaxed border-l-2 border-amber pl-3">
                {weeklyBriefing.headline}
              </p>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Required Actions</p>
                {weeklyBriefing.actions.map((action, i) => (
                  <div key={i} className="flex items-start gap-2.5 py-2 border-b border-border/50 last:border-0">
                    <div className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      action.priority === "critical" ? "bg-red-500" :
                      action.priority === "warning" ? "bg-amber-500" : "bg-teal"
                    }`} />
                    <span className="text-sm text-muted-foreground">{action.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Alerts */}
            <div className="card-surface">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="font-bold text-foreground text-sm">Active Intelligence Alerts</span>
                </div>
                <Badge variant="outline" className="text-xs border-red-500/30 text-red-400">
                  {(alerts as any[]).filter((a: any) => a.severity === "critical").length} Critical
                </Badge>
              </div>

              {alertsLoading ? (
                <div className="p-4 space-y-3">
                  {Array(3).fill(0).map((_, i) => <div key={i} className="skeleton h-14 rounded-lg" />)}
                </div>
              ) : (
                <table className="data-table w-full">
                  <thead>
                    <tr>
                      <th className="text-left">Alert</th>
                      <th className="text-center">Severity</th>
                      <th className="text-right">Est. Impact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(alerts as any[]).map((alert: any, i: number) => (
                      <tr key={i} className="group">
                        <td>
                          <div className="font-medium text-foreground text-xs leading-snug">{alert.title}</div>
                          <div className="text-muted-foreground text-xs mt-0.5 line-clamp-1">{alert.source}</div>
                        </td>
                        <td className="text-center">
                          <Badge variant="outline" className={`text-xs ${
                            alert.severity === "critical" ? "border-red-500/40 text-red-400 bg-red-500/10" :
                            alert.severity === "warning" ? "border-amber-500/40 text-amber-400 bg-amber-500/10" :
                            "border-teal/40 text-teal bg-teal/10"
                          }`}>
                            {alert.severity}
                          </Badge>
                        </td>
                        <td className="text-right">
                          <span className={`text-sm font-bold num ${
                            alert.severity === "critical" ? "text-red-400" : "text-amber"
                          }`}>
                            {alert.estimatedImpact ? formatDollar(alert.estimatedImpact) : "—"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Savings Trend Chart */}
            <div className="card-surface p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="font-bold text-foreground text-sm">Cumulative Savings Identified</span>
                  <p className="text-xs text-muted-foreground mt-0.5">7-week trend across all monitored clients</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-amber num">$312K</div>
                  <div className="text-xs text-muted-foreground">Total this period</div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={savingsTrend}>
                  <defs>
                    <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(38 95% 55%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(38 95% 55%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: "hsl(210 10% 55%)" }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="savings" stroke="hsl(38 95% 55%)" fill="url(#savingsGrad)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── Right: Computer Activity + Exposure ─────── */}
          <div className="space-y-5">
            {/* Computer Activity */}
            <div className="card-surface p-5">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-teal" />
                <span className="font-bold text-foreground text-sm">Computer Activity</span>
                <span className="status-dot monitoring alert-live w-1.5 h-1.5 ml-auto"></span>
              </div>
              <div className="space-y-2.5">
                {weeklyBriefing.computerActivity.map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-muted-foreground leading-snug">{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <div className="text-xs text-muted-foreground">Powered by</div>
                <div className="text-xs font-semibold text-foreground mt-0.5">Perplexity Computer Agents</div>
              </div>
            </div>

            {/* Tariff Exposure Breakdown */}
            <div className="card-surface p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 className="w-4 h-4 text-amber" />
                <span className="font-bold text-foreground text-sm">Tariff Exposure by Program</span>
              </div>
              <div className="space-y-3">
                {tariffsExposure.map((t) => (
                  <div key={t.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-foreground">{t.name}</span>
                      <span className="text-xs text-muted-foreground num">{formatDollar(t.spend)}/yr</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber rounded-full transition-all"
                          style={{ width: `${(t.spend / 220000) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-amber font-bold num w-8 text-right">{t.rate}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* IEEPA Deadline countdown */}
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-red-400" />
                <span className="text-sm font-bold text-red-400">IEEPA Filing Deadline</span>
              </div>
              <div className="text-2xl font-black text-foreground num">92 days</div>
              <p className="text-xs text-muted-foreground mt-1">Until July 15, 2026 cutoff</p>
              <Link href="/calculator">
                <Button size="sm" className="mt-3 w-full bg-primary text-primary-foreground font-semibold text-xs">
                  File Refund Now <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>

            {/* USMCA Countdown */}
            <div className="bg-amber/5 border border-amber/20 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber" />
                <span className="text-sm font-bold text-amber">USMCA Review</span>
              </div>
              <div className="text-2xl font-black text-foreground num">78 days</div>
              <p className="text-xs text-muted-foreground mt-1">Until July 1, 2026 formal review</p>
              <p className="text-xs text-muted-foreground mt-2">Stricter rules of origin proposed — review your Mexico/Canada imports now</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
