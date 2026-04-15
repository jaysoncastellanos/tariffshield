import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, ArrowRight, Plus, X, CheckCircle2, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

function TariffShieldLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-label="TariffShield">
      <path d="M20 3L4 9v12c0 8.2 6.8 15.4 16 17 9.2-1.6 16-8.8 16-17V9L20 3z" fill="hsl(38 95% 55%)" fillOpacity="0.15" stroke="hsl(38 95% 55%)" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M20 8L8 13v9c0 5.8 5 11 12 12.5C27 33 32 27.8 32 22v-9L20 8z" fill="hsl(38 95% 55%)" fillOpacity="0.08"/>
      <path d="M15 20l3.5 3.5L26 16" stroke="hsl(38 95% 55%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

const countryOptions = [
  "China", "Vietnam", "Mexico", "India", "Canada", "Bangladesh",
  "Indonesia", "Thailand", "Taiwan", "South Korea", "Germany", "Japan",
];

const tierInfo = {
  monitor: { label: "MONITOR", price: "$500/mo", color: "text-teal", border: "border-teal/30" },
  recover: { label: "RECOVER", price: "15% of refund", color: "text-amber", border: "border-amber/30" },
  enterprise: { label: "OPTIMIZE", price: "$2,500/mo", color: "text-muted-foreground", border: "border-border" },
};

type HtsCode = { code: string; description: string; annualValue: string };

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [tier, setTier] = useState("monitor");
  const [company, setCompany] = useState({ name: "", email: "", annualImportSpend: "" });
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [htsCodes, setHtsCodes] = useState<HtsCode[]>([{ code: "", description: "", annualValue: "" }]);

  const mutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest("POST", "/api/companies", data).then(r => r.json()),
    onSuccess: () => {
      setStep(5);
    },
    onError: () => {
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    },
  });

  const toggleCountry = (c: string) => {
    setSelectedCountries(prev =>
      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
    );
  };

  const addHtsCode = () => {
    setHtsCodes(prev => [...prev, { code: "", description: "", annualValue: "" }]);
  };

  const removeHtsCode = (i: number) => {
    setHtsCodes(prev => prev.filter((_, idx) => idx !== i));
  };

  const updateHtsCode = (i: number, field: keyof HtsCode, val: string) => {
    setHtsCodes(prev => prev.map((h, idx) => idx === i ? { ...h, [field]: val } : h));
  };

  const handleSubmit = () => {
    mutation.mutate({
      name: company.name,
      email: company.email,
      annualImportSpend: parseFloat(company.annualImportSpend.replace(/[,$]/g, "")) || 0,
      primaryCountries: JSON.stringify(selectedCountries),
      htsCodesJson: JSON.stringify(htsCodes.filter(h => h.code)),
      tier,
      createdAt: new Date().toISOString(),
    });
  };

  const steps = ["Choose Plan", "Company Info", "Import Countries", "HTS Codes", "Active"];

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <TariffShieldLogo size={24} />
              <span className="font-bold text-foreground tracking-tight text-sm">TariffShield</span>
            </div>
          </Link>
          {step < 5 && (
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-muted-foreground text-sm gap-1">
                <ArrowLeft className="w-3 h-3" /> Cancel
              </Button>
            </Link>
          )}
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* Progress steps */}
        {step < 5 && (
          <div className="flex items-center gap-1 mb-10">
            {steps.slice(0, 4).map((s, i) => (
              <div key={s} className="flex items-center gap-1 flex-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                  step > i + 1 ? "bg-green-500 text-white" :
                  step === i + 1 ? "bg-primary text-primary-foreground" :
                  "bg-secondary text-muted-foreground"
                }`}>
                  {step > i + 1 ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <span className={`text-xs hidden sm:block ${step === i + 1 ? "text-foreground font-medium" : "text-muted-foreground"}`}>{s}</span>
                {i < 3 && <div className={`h-px flex-1 mx-1 ${step > i + 1 ? "bg-green-500" : "bg-border"}`} />}
              </div>
            ))}
          </div>
        )}

        {/* ── Step 1: Choose Plan ── */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-black text-foreground mb-1">Choose your plan</h1>
              <p className="text-muted-foreground text-sm">Most clients start with RECOVER — zero upfront cost</p>
            </div>

            <div className="space-y-3">
              {[
                {
                  id: "recover",
                  label: "TariffShield RECOVER",
                  price: "15% of refund recovered",
                  sub: "$0 upfront · Performance-fee only",
                  features: ["IEEPA refund identification & filing", "Past 12-month entry audit", "No refund = no fee"],
                  highlight: true,
                },
                {
                  id: "monitor",
                  label: "TariffShield MONITOR",
                  price: "$500/month",
                  sub: "Billed monthly · Cancel anytime",
                  features: ["Real-time tariff change monitoring", "Weekly intelligence briefings", "HTS-specific alert mapping"],
                  highlight: false,
                },
                {
                  id: "enterprise",
                  label: "TariffShield OPTIMIZE",
                  price: "$2,500/month",
                  sub: "For importers $5M+ annual spend",
                  features: ["Everything in MONITOR", "Monthly strategy call", "FTZ & sourcing optimization"],
                  highlight: false,
                },
              ].map(plan => (
                <div
                  key={plan.id}
                  data-testid={`plan-${plan.id}`}
                  onClick={() => setTier(plan.id)}
                  className={`card-surface p-5 cursor-pointer transition-all ${
                    tier === plan.id
                      ? plan.highlight ? "border-amber/50 glow-amber" : "border-teal/40 glow-teal"
                      : "hover:border-border/80"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-foreground text-sm">{plan.label}</span>
                        {plan.highlight && <Badge className="bg-amber/15 text-amber border-amber/30 text-xs">Most Popular</Badge>}
                      </div>
                      <div className={`text-sm font-bold ${plan.highlight ? "text-amber" : "text-teal"} num`}>{plan.price}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{plan.sub}</div>
                      <ul className="mt-3 space-y-1">
                        {plan.features.map(f => (
                          <li key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <CheckCircle2 className="w-3 h-3 text-green-400 flex-shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 transition-all ${
                      tier === plan.id
                        ? plan.highlight ? "border-amber bg-amber" : "border-teal bg-teal"
                        : "border-border"
                    }`} />
                  </div>
                </div>
              ))}
            </div>

            <Button
              data-testid="button-next-step1-onboarding"
              onClick={() => setStep(2)}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
            >
              Continue with {tier === "recover" ? "RECOVER" : tier === "monitor" ? "MONITOR" : "OPTIMIZE"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* ── Step 2: Company Info ── */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-black text-foreground mb-1">Your company</h1>
              <p className="text-muted-foreground text-sm">Basic info to set up your account</p>
            </div>

            <div className="card-surface p-6 space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground mb-1.5 block">Company Name</Label>
                <Input
                  data-testid="input-company-name-onboarding"
                  placeholder="Acme Imports LLC"
                  value={company.name}
                  onChange={e => setCompany(c => ({ ...c, name: e.target.value }))}
                  className="bg-input border-border text-foreground"
                />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground mb-1.5 block">Contact Email</Label>
                <Input
                  data-testid="input-email-onboarding"
                  type="email"
                  placeholder="you@company.com"
                  value={company.email}
                  onChange={e => setCompany(c => ({ ...c, email: e.target.value }))}
                  className="bg-input border-border text-foreground"
                />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground mb-1.5 block">Annual Import Spend (USD)</Label>
                <Input
                  data-testid="input-spend-onboarding"
                  placeholder="$2,500,000"
                  value={company.annualImportSpend}
                  onChange={e => setCompany(c => ({ ...c, annualImportSpend: e.target.value }))}
                  className="bg-input border-border text-foreground font-mono"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="border-border" onClick={() => setStep(1)}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
                disabled={!company.name || !company.email || !company.annualImportSpend}
                onClick={() => setStep(3)}
              >
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 3: Import Countries ── */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-black text-foreground mb-1">Import countries</h1>
              <p className="text-muted-foreground text-sm">Select all countries you import from. We monitor tariff exposure by origin.</p>
            </div>

            <div className="card-surface p-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {countryOptions.map(country => (
                  <div
                    key={country}
                    data-testid={`country-${country.toLowerCase()}`}
                    onClick={() => toggleCountry(country)}
                    className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer border transition-all ${
                      selectedCountries.includes(country)
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border hover:border-border/80 text-muted-foreground"
                    }`}
                  >
                    <Checkbox
                      checked={selectedCountries.includes(country)}
                      className="pointer-events-none"
                    />
                    <span className="text-sm font-medium">{country}</span>
                  </div>
                ))}
              </div>
              {selectedCountries.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-1">
                  {selectedCountries.map(c => (
                    <Badge key={c} variant="outline" className="text-xs border-primary/40 text-primary">
                      {c}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="border-border" onClick={() => setStep(2)}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
                disabled={selectedCountries.length === 0}
                onClick={() => setStep(4)}
              >
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 4: HTS Codes ── */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-black text-foreground mb-1">Your HTS codes</h1>
              <p className="text-muted-foreground text-sm">Add your top products. We'll map every tariff change to these specific codes.</p>
            </div>

            <div className="card-surface p-5 space-y-3">
              {htsCodes.map((h, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-3">
                    <Input
                      data-testid={`input-hts-code-${i}`}
                      placeholder="8471.30"
                      value={h.code}
                      onChange={e => updateHtsCode(i, "code", e.target.value)}
                      className="bg-input border-border text-foreground font-mono text-sm"
                    />
                  </div>
                  <div className="col-span-5">
                    <Input
                      data-testid={`input-hts-desc-${i}`}
                      placeholder="Product description"
                      value={h.description}
                      onChange={e => updateHtsCode(i, "description", e.target.value)}
                      className="bg-input border-border text-foreground text-sm"
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      data-testid={`input-hts-value-${i}`}
                      placeholder="$500K/yr"
                      value={h.annualValue}
                      onChange={e => updateHtsCode(i, "annualValue", e.target.value)}
                      className="bg-input border-border text-foreground font-mono text-sm"
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    {i > 0 && (
                      <button onClick={() => removeHtsCode(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <div className="pt-2 border-t border-border flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  <span className="text-foreground font-mono">HTS Code</span> · <span className="text-foreground font-mono">Description</span> · <span className="text-foreground font-mono">Annual Value</span>
                </div>
                <Button
                  data-testid="button-add-hts"
                  variant="ghost"
                  size="sm"
                  onClick={addHtsCode}
                  className="text-teal hover:bg-teal/10 text-xs gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Code
                </Button>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="border-border" onClick={() => setStep(3)}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button
                data-testid="button-activate"
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
                disabled={mutation.isPending}
                onClick={handleSubmit}
              >
                {mutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Activating...</>
                ) : (
                  <>Activate TariffShield <Shield className="w-4 h-4 ml-2" /></>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 5: Success ── */}
        {step === 5 && (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-400" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-black text-foreground mb-2">You're protected.</h1>
              <p className="text-muted-foreground">
                TariffShield is now monitoring tariff changes for <strong className="text-foreground">{company.name}</strong>. Your first intelligence briefing will arrive within 24 hours.
              </p>
            </div>

            <div className="card-surface p-5 text-left space-y-3">
              <p className="text-sm font-bold text-foreground">What happens next:</p>
              {[
                "Perplexity Computer agents begin monitoring Federal Register, USTR, and CBP for your HTS codes",
                "Your first tariff exposure report is generated within 24 hours",
                "Weekly briefings delivered every Monday morning",
                "Real-time alerts sent immediately when a change affects your products",
                tier === "recover" ? "IEEPA refund analysis begins — we'll contact you within 48 hours with your refund estimate" : "",
              ].filter(Boolean).map((item, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-teal flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/dashboard" className="flex-1">
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold">
                  Open Dashboard <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/calculator">
                <Button variant="outline" className="w-full border-border font-semibold">
                  Run Refund Calculator
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
