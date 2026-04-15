import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signup } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

function TariffShieldLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-label="TariffShield">
      <path d="M20 3L4 9v12c0 8.2 6.8 15.4 16 17 9.2-1.6 16-8.8 16-17V9L20 3z" fill="hsl(38 95% 55%)" fillOpacity="0.15" stroke="hsl(38 95% 55%)" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M15 20l3.5 3.5L26 16" stroke="hsl(38 95% 55%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

const plans = [
  {
    id: "recover",
    label: "RECOVER",
    price: "15% of refund",
    sub: "$0 upfront · Performance-fee only",
    description: "We find your IEEPA refund. You pay 15% only if we recover money.",
    highlight: true,
    popular: true,
  },
  {
    id: "monitor",
    label: "MONITOR",
    price: "$500/mo",
    sub: "Billed monthly · Cancel anytime",
    description: "Real-time tariff monitoring, weekly AI briefings, HTS-specific alerts.",
    highlight: false,
    popular: false,
  },
  {
    id: "optimize",
    label: "OPTIMIZE",
    price: "$2,500/mo",
    sub: "For importers $5M+ annual spend",
    description: "Everything in MONITOR + strategy calls + FTZ & sourcing optimization.",
    highlight: false,
    popular: false,
  },
];

export default function Signup() {
  const [, setLocation] = useLocation();
  const { setUser } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<"plan" | "account">("plan");
  const [selectedPlan, setSelectedPlan] = useState("recover");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { user } = await signup(name, email, password, selectedPlan);
      setUser(user);

      // For paid plans — redirect to Stripe
      if (selectedPlan === "monitor" || selectedPlan === "optimize") {
        const res = await apiRequest("POST", "/api/stripe/checkout", { plan: selectedPlan });
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
          return;
        }
      }

      // RECOVER plan — activate and go to onboarding
      if (selectedPlan === "recover") {
        await apiRequest("POST", "/api/stripe/recover", {});
      }

      toast({ title: "Welcome to TariffShield", description: "Your account is active. Check your email." });
      setLocation("/onboarding");
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12 scan-grid">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-8">
          <TariffShieldLogo size={32} />
          <span className="font-bold text-xl tracking-tight">TariffShield</span>
        </div>

        {step === "plan" && (
          <div>
            <h1 className="text-2xl font-bold text-center mb-1">Choose your plan</h1>
            <p className="text-sm text-muted-foreground text-center mb-8">
              Most clients start with RECOVER — zero upfront, immediate results
            </p>

            <div className="space-y-3 mb-6">
              {plans.map(plan => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`w-full text-left card-surface p-5 rounded-xl border-2 transition-all ${
                    selectedPlan === plan.id
                      ? "border-primary glow-amber"
                      : "border-border hover:border-border/80"
                  }`}
                  data-testid={`plan-${plan.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold tracking-widest text-amber-400">{plan.label}</span>
                        {plan.popular && (
                          <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded font-semibold">MOST POPULAR</span>
                        )}
                      </div>
                      <div className="font-bold text-lg text-foreground">{plan.price}</div>
                      <div className="text-xs text-muted-foreground mb-2">{plan.sub}</div>
                      <div className="text-sm text-muted-foreground">{plan.description}</div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-1 flex items-center justify-center ${
                      selectedPlan === plan.id ? "border-primary bg-primary" : "border-muted-foreground"
                    }`}>
                      {selectedPlan === plan.id && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <Button
              onClick={() => setStep("account")}
              className="w-full bg-primary text-primary-foreground font-bold"
              data-testid="button-continue-plan"
            >
              Continue with {plans.find(p => p.id === selectedPlan)?.label} →
            </Button>

            <p className="text-center text-sm text-muted-foreground mt-4">
              Already have an account?{" "}
              <Link href="/login">
                <span className="text-amber-400 hover:text-amber-300 cursor-pointer font-medium">Sign in</span>
              </Link>
            </p>
          </div>
        )}

        {step === "account" && (
          <div className="card-surface p-8">
            <button
              onClick={() => setStep("plan")}
              className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1"
            >
              ← Back
            </button>
            <h1 className="text-xl font-bold mb-1">Create your account</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Plan: <span className="text-amber-400 font-semibold">{plans.find(p => p.id === selectedPlan)?.label}</span>
              {" · "}{plans.find(p => p.id === selectedPlan)?.price}
            </p>

            {error && (
              <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3 mb-4 text-sm text-red-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" type="text" placeholder="Jane Smith" value={name} onChange={e => setName(e.target.value)} required data-testid="input-name" className="bg-input border-border" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Work Email</Label>
                <Input id="email" type="email" placeholder="jane@company.com" value={email} onChange={e => setEmail(e.target.value)} required data-testid="input-email" className="bg-input border-border" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPw ? "text" : "password"}
                    placeholder="8+ characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={8}
                    data-testid="input-password"
                    className="bg-input border-border pr-10"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground font-bold" data-testid="button-signup">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {loading ? "Creating account..." : selectedPlan === "recover" ? "Start Free — Claim My Refund" : `Subscribe to ${plans.find(p => p.id === selectedPlan)?.label}`}
              </Button>
            </form>

            <div className="mt-4 space-y-1.5">
              {["No credit card required for RECOVER", "Cancel anytime", "Setup in under 60 seconds"].map(t => (
                <div key={t} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal" />
                  {t}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
