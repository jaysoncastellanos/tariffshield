import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { logout } from "@/lib/auth";
import { ArrowRight, Shield, TrendingDown, Bell, FileSearch, ChevronRight, DollarSign, Clock, Zap, BarChart3, AlertTriangle, CheckCircle2, LogIn, LogOut, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// ── Logo ──────────────────────────────────────────────────
function TariffShieldLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-label="TariffShield" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 3L4 9v12c0 8.2 6.8 15.4 16 17 9.2-1.6 16-8.8 16-17V9L20 3z" fill="hsl(38 95% 55%)" fillOpacity="0.15" stroke="hsl(38 95% 55%)" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M20 8L8 13v9c0 5.8 5 11 12 12.5C27 33 32 27.8 32 22v-9L20 8z" fill="hsl(38 95% 55%)" fillOpacity="0.08"/>
      <path d="M15 20l3.5 3.5L26 16" stroke="hsl(38 95% 55%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ── Ticker ────────────────────────────────────────────────
const tickerItems = [
  { label: "Section 301 (China)", value: "25–100%", change: "↑ NEW" },
  { label: "Section 232 (Steel)", value: "50%", change: "↑" },
  { label: "USMCA Review", value: "Jul 1, 2026", change: "⚠" },
  { label: "IEEPA Refund Deadline", value: "Jul 15, 2026", change: "🔴" },
  { label: "India Reciprocal", value: "50%", change: "ACTIVE" },
  { label: "Vietnam Scrutiny", value: "ENHANCED", change: "CBP" },
  { label: "EU Reciprocal", value: "15%", change: "ACTIVE" },
  { label: "Section 301 (Electronics)", value: "35%", change: "↑ May 1" },
  { label: "Duty Drawback Rate", value: "99%", change: "AVAILABLE" },
  { label: "FTZ Inverted Tariff", value: "NEW RULE", change: "EXPANDED" },
];

function Ticker() {
  const doubled = [...tickerItems, ...tickerItems];
  return (
    <div className="border-y border-border bg-muted/30 overflow-hidden py-2">
      <div className="ticker-track">
        {doubled.map((item, i) => (
          <div key={i} className="flex items-center gap-2 px-6 text-sm whitespace-nowrap">
            <span className="text-muted-foreground">{item.label}</span>
            <span className="font-bold text-foreground num">{item.value}</span>
            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
              item.change.includes("↑") || item.change === "ENHANCED" || item.change === "🔴"
                ? "bg-destructive/15 text-red-400"
                : item.change === "AVAILABLE" || item.change === "EXPANDED"
                ? "bg-green-500/15 text-green-400"
                : "bg-amber-500/15 text-amber-400"
            }`}>{item.change}</span>
            <span className="text-border mx-2">|</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Nav ───────────────────────────────────────────────────
function Nav() {
  const { user, setUser } = useAuth();
  const [, setLocation] = useLocation();

  async function handleLogout() {
    await logout();
    setUser(null);
    setLocation("/");
  }

  return (
    <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer">
            <TariffShieldLogo size={28} />
            <span className="font-bold text-foreground tracking-tight">TariffShield</span>
          </div>
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <Link href="/calculator"><span className="hover:text-foreground transition-colors cursor-pointer">Refund Calculator</span></Link>
          <Link href="/dashboard"><span className="hover:text-foreground transition-colors cursor-pointer">Dashboard</span></Link>
          <a href="#pricing" onClick={e => { e.preventDefault(); document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-foreground transition-colors cursor-pointer">Pricing</a>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden md:flex items-center gap-1.5 text-sm text-muted-foreground">
                <User className="w-3.5 h-3.5" />{user.name}
              </span>
              <Link href="/dashboard">
                <Button size="sm" className="bg-primary text-primary-foreground font-semibold text-sm">Dashboard</Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground text-sm">
                <LogOut className="w-3.5 h-3.5 mr-1" />Sign out
              </Button>
            </>
          ) : (
            <>
              <Link href="/calculator">
                <Button variant="ghost" size="sm" className="text-amber-400 hover:text-amber-300 hover:bg-amber-400/10 text-sm">Free Refund Scan</Button>
              </Link>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-sm"><LogIn className="w-3.5 h-3.5 mr-1" />Sign In</Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-sm">Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

// ── Hero Stats ─────────────────────────────────────────────
const heroStats = [
  { value: "$133B", label: "IEEPA refunds available", sub: "Supreme Court ruling" },
  { value: "11 days", label: "Avg. tariff change frequency", sub: "In 2025" },
  { value: "500K+", label: "SMB importers unprotected", sub: "No intelligence platform" },
  { value: "$1M+", label: "Avg. annual duty overpayment", sub: "Per $10M importer" },
];

// ── Case Studies ──────────────────────────────────────────
const caseStudies = [
  {
    company: "Home Goods Importer",
    location: "Dallas, TX",
    annualSpend: "$8.2M",
    result: "$127,000 IEEPA refund identified in 48 hours",
    ongoing: "$61,000/yr in ongoing savings",
    country: "China + Vietnam",
  },
  {
    company: "Electronics Distributor",
    location: "Los Angeles, CA",
    annualSpend: "$22M",
    result: "$340,000 in Section 301 optimization",
    ongoing: "$180,000/yr through FTZ strategy",
    country: "China",
  },
  {
    company: "Apparel Brand",
    location: "New York, NY",
    annualSpend: "$5.5M",
    result: "USMCA risk flagged 6 weeks before review",
    ongoing: "$95,000/yr exposure avoided",
    country: "Mexico + Vietnam",
  },
];

export default function Landing() {
  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard-stats"],
    queryFn: () => apiRequest("GET", "/api/dashboard-stats").then(r => r.json()),
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ["/api/alerts"],
    queryFn: () => apiRequest("GET", "/api/alerts").then(r => r.json()),
  });

  const criticalCount = (alerts as any[]).filter((a: any) => a.severity === "critical").length;

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <Ticker />

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative hero-gradient scan-grid overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-24">
          {/* Live alert badge */}
          {criticalCount > 0 && (
            <div className="inline-flex items-center gap-2 bg-destructive/10 border border-destructive/30 rounded-full px-4 py-1.5 mb-8">
              <span className="status-dot critical alert-live"></span>
              <span className="text-red-400 text-sm font-semibold">{criticalCount} Critical Tariff Alerts Active Right Now</span>
              <Link href="/dashboard"><ChevronRight className="w-4 h-4 text-red-400" /></Link>
            </div>
          )}

          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-foreground leading-tight mb-6" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
              Stop paying tariffs<br />
              <span className="text-amber">you don't owe.</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-4 max-w-2xl">
              AI agents monitor the Federal Register, USTR, and CBP around the clock — mapping every tariff change to your specific products and identifying savings in real time.
            </p>
            <p className="text-base text-muted-foreground mb-8 max-w-xl">
              The Supreme Court just invalidated IEEPA tariffs. <span className="text-amber font-semibold">$133 billion in refunds are on the table.</span> Most importers don't know they're owed money. We find it for you.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link href="/calculator">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-base px-8 glow-amber">
                  Calculate My IEEPA Refund
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="lg" variant="outline" className="border-border text-foreground hover:bg-secondary font-semibold text-base px-8">
                  Start Monitoring — $500/mo
                </Button>
              </Link>
            </div>

            <p className="text-xs text-muted-foreground mt-4">
              Performance-fee refund recovery available · No refund = no fee · Setup in 24 hours
            </p>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ─────────────────────────────────────── */}
      <section className="border-y border-border bg-card/50">
        <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {heroStats.map((s) => (
            <div key={s.value} className="text-center md:text-left">
              <div className="text-2xl md:text-3xl font-black text-amber num">{s.value}</div>
              <div className="text-sm font-semibold text-foreground mt-0.5">{s.label}</div>
              <div className="text-xs text-muted-foreground">{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── LIVE ALERTS PREVIEW ───────────────────────────── */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="status-dot critical alert-live"></span>
                <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Live Intelligence Feed</span>
              </div>
              <h2 className="text-2xl font-black text-foreground">This week's tariff changes</h2>
              <p className="text-muted-foreground mt-1 text-sm">Every alert is mapped to your specific HTS codes — not generic news</p>
            </div>
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="border-border hidden md:flex items-center gap-2">
                View Full Dashboard <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>

          <div className="space-y-3">
            {(alerts as any[]).slice(0, 4).map((alert: any, i: number) => (
              <div key={i} className="card-surface p-4 flex items-start gap-4 hover:card-surface-elevated transition-all">
                <div className={`mt-0.5 flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                  alert.severity === "critical" ? "bg-red-500" :
                  alert.severity === "warning" ? "bg-amber-500" : "bg-teal"
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-semibold text-foreground">{alert.title}</span>
                        <Badge variant="outline" className={`text-xs ${
                          alert.severity === "critical" ? "border-red-500/40 text-red-400 bg-red-500/10" :
                          alert.severity === "warning" ? "border-amber-500/40 text-amber-400 bg-amber-500/10" :
                          "border-teal/40 text-teal bg-teal/10"
                        }`}>
                          {alert.severity.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-xs border-border text-muted-foreground capitalize">
                          {alert.category.replace("section", "Sec. ")}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{alert.description}</p>
                    </div>
                    {alert.estimatedImpact && (
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-bold text-amber num">${(alert.estimatedImpact / 1000).toFixed(0)}K</div>
                        <div className="text-xs text-muted-foreground">Est. impact</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-6">
            <Link href="/dashboard">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground text-sm">
                View all {(alerts as any[]).length} active alerts →
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section className="py-16 border-t border-border bg-card/20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-12">
            <p className="text-xs font-semibold text-amber uppercase tracking-wider mb-2">How TariffShield Works</p>
            <h2 className="text-2xl font-black text-foreground">From exposure to savings in 24 hours</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                icon: FileSearch,
                title: "Map Your Exposure",
                desc: "Enter your HTS codes, supplier countries, and annual import spend. Our agents instantly calculate your full tariff exposure across all active duty programs.",
              },
              {
                step: "02",
                icon: Bell,
                title: "Monitor 24/7",
                desc: "Perplexity Computer agents read the Federal Register, USTR, and CBP every day. When a change affects your products, you get an alert before your next shipment.",
              },
              {
                step: "03",
                icon: DollarSign,
                title: "Recover & Save",
                desc: "We identify IEEPA refunds, FTA opportunities, duty drawback eligibility, and FTZ strategies — turning intelligence into real dollar recovery.",
              },
            ].map((item) => (
              <div key={item.step} className="card-surface p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-black text-amber num">{item.step}</span>
                  <item.icon className="w-5 h-5 text-teal" />
                </div>
                <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── IEEPA REFUND CTA ─────────────────────────────── */}
      <section className="py-16 border-t border-border">
        <div className="max-w-6xl mx-auto px-6">
          <div className="card-surface border-amber/20 p-8 md:p-10 relative overflow-hidden glow-amber">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="relative z-10 max-w-2xl">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-amber" />
                <span className="text-amber text-sm font-bold uppercase tracking-wider">Time-Sensitive: IEEPA Refund Window</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-foreground mb-3">
                The Supreme Court says you're owed money back.
              </h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                The U.S. Supreme Court invalidated IEEPA tariffs in early 2026. If you imported goods between April 2025 and March 2026, you likely overpaid. The refund filing window closes <span className="text-amber font-bold">July 15, 2026</span>. Run your free assessment now — it takes 2 minutes.
              </p>
              <div className="flex flex-wrap gap-3 items-center">
                <Link href="/calculator">
                  <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold">
                    Calculate My Refund — Free
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <span className="text-xs text-muted-foreground">No payment required · Results in 30 seconds</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CASE STUDIES ─────────────────────────────────── */}
      <section className="py-16 border-t border-border bg-card/20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-10">
            <p className="text-xs font-semibold text-teal uppercase tracking-wider mb-2">Early Customers</p>
            <h2 className="text-2xl font-black text-foreground">Real importers. Real savings.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {caseStudies.map((cs) => (
              <div key={cs.company} className="card-surface p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="font-bold text-foreground text-sm">{cs.company}</div>
                    <div className="text-xs text-muted-foreground">{cs.location}</div>
                  </div>
                  <Badge variant="outline" className="text-xs border-border text-muted-foreground">{cs.annualSpend}/yr</Badge>
                </div>
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span className="text-sm font-semibold text-foreground">{cs.result}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-teal flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{cs.ongoing}</span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground border-t border-border pt-3 mt-3">
                  Import countries: {cs.country}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────── */}
      <section id="pricing" className="py-16 border-t border-border">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-10">
            <p className="text-xs font-semibold text-amber uppercase tracking-wider mb-2">Pricing</p>
            <h2 className="text-2xl font-black text-foreground">Two ways to work with us</h2>
            <p className="text-muted-foreground mt-1 text-sm">Most clients start with RECOVER — zero risk, immediate results</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* RECOVER */}
            <div className="card-surface border-amber/30 p-6 glow-amber relative">
              <div className="absolute top-4 right-4">
                <Badge className="bg-amber text-primary-foreground text-xs font-bold">MOST POPULAR</Badge>
              </div>
              <div className="mb-4">
                <div className="text-xs font-bold text-amber uppercase tracking-wider mb-1">TariffShield RECOVER</div>
                <div className="text-3xl font-black text-foreground">15% <span className="text-lg text-muted-foreground font-normal">of refund</span></div>
                <div className="text-xs text-muted-foreground mt-1">$0 upfront · Performance-based only</div>
              </div>
              <ul className="space-y-2 text-sm mb-6">
                {[
                  "IEEPA refund identification & filing",
                  "CBP audit of past 12 months of entries",
                  "Overpayment recovery documentation",
                  "No refund found = no fee",
                  "Average recovery: $127,000",
                ].map(f => (
                  <li key={f} className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/calculator">
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold">
                  Calculate My Refund
                </Button>
              </Link>
            </div>

            {/* MONITOR */}
            <div className="card-surface p-6">
              <div className="mb-4">
                <div className="text-xs font-bold text-teal uppercase tracking-wider mb-1">TariffShield MONITOR</div>
                <div className="text-3xl font-black text-foreground">$500<span className="text-lg text-muted-foreground font-normal">/mo</span></div>
                <div className="text-xs text-muted-foreground mt-1">Billed monthly · Cancel anytime</div>
              </div>
              <ul className="space-y-2 text-sm mb-6">
                {[
                  "Real-time tariff change monitoring",
                  "Weekly intelligence briefings",
                  "HTS-specific alert mapping",
                  "USMCA qualification tracking",
                  "FTA & duty drawback screening",
                  "Dashboard access",
                ].map(f => (
                  <li key={f} className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup">
                <Button variant="outline" className="w-full border-border hover:bg-secondary font-semibold">
                  Start Monitoring
                </Button>
              </Link>
            </div>

            {/* OPTIMIZE */}
            <div className="card-surface p-6">
              <div className="mb-4">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">TariffShield OPTIMIZE</div>
                <div className="text-3xl font-black text-foreground">$2,500<span className="text-lg text-muted-foreground font-normal">/mo</span></div>
                <div className="text-xs text-muted-foreground mt-1">For importers $5M+ annual spend</div>
              </div>
              <ul className="space-y-2 text-sm mb-6">
                {[
                  "Everything in MONITOR",
                  "Monthly strategy call",
                  "Alternative sourcing analysis",
                  "FTZ feasibility assessment",
                  "Bonded warehouse modeling",
                  "Priority alert response",
                  "Customs broker coordination",
                ].map(f => (
                  <li key={f} className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup">
                <Button variant="outline" className="w-full border-border hover:bg-secondary font-semibold">
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────── */}
      <section className="py-20 border-t border-border bg-card/30">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <TariffShieldLogo size={48} />
          <h2 className="text-3xl font-black text-foreground mt-6 mb-3">
            Every day you wait costs money.
          </h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            The IEEPA refund deadline is July 15. Section 301 rates increase May 1. USMCA review is July 1. The importers who act now will recover hundreds of thousands. The ones who wait will miss the window.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/calculator">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold glow-amber">
                Get My Free Refund Estimate
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="lg" variant="outline" className="border-border font-semibold">
                Start Monitoring
              </Button>
            </Link>
          </div>
          <p className="text-xs text-muted-foreground mt-6">
            Powered by Perplexity Computer · Built for the Billion Dollar Build Challenge
          </p>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────── */}
      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <TariffShieldLogo size={20} />
            <span className="text-sm text-muted-foreground">TariffShield © 2026</span>
          </div>
          <div className="flex gap-6 text-xs text-muted-foreground">
            <span>Powered by Perplexity Computer</span>
            <span>·</span>
            <span>Not legal advice</span>
            <span>·</span>
            <span>US importers only</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
