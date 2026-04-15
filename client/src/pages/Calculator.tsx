import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, ArrowRight, DollarSign, TrendingDown, Clock, CheckCircle2, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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

const countries = [
  "China", "Vietnam", "Mexico", "India", "Canada", "Bangladesh",
  "Indonesia", "Thailand", "Taiwan", "South Korea", "Germany",
  "Japan", "Malaysia", "Cambodia", "Other"
];

const categories = [
  "Electronics & Components",
  "Apparel & Textiles",
  "Steel & Aluminum Products",
  "Consumer Goods & Housewares",
  "Industrial Equipment",
  "Automotive Parts",
  "Furniture & Home Furnishings",
  "Toys & Games",
  "Food & Beverages",
  "Chemicals & Materials",
  "Medical Devices",
  "Software / Hardware",
  "Other",
];

function formatDollar(n: number): string {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(2)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

type Result = {
  estimatedRefund: number;
  estimatedSavings: number;
  status: string;
  id: number;
};

export default function Calculator() {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    companyName: "",
    email: "",
    annualImportSpend: "",
    primaryCountry: "",
    productCategory: "",
  });
  const [result, setResult] = useState<Result | null>(null);

  const mutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest("POST", "/api/refund-assessment", data).then(r => r.json()),
    onSuccess: (data: Result) => {
      setResult(data);
      setStep(3);
    },
    onError: () => {
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    mutation.mutate({
      ...form,
      annualImportSpend: parseFloat(form.annualImportSpend.replace(/[,$]/g, "")),
    });
  };

  const spendNum = parseFloat(form.annualImportSpend.replace(/[,$]/g, "")) || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <TariffShieldLogo size={24} />
              <span className="font-bold text-foreground tracking-tight text-sm">TariffShield</span>
            </div>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-muted-foreground text-sm gap-1">
              <ArrowLeft className="w-3 h-3" /> Back
            </Button>
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 bg-amber/10 border border-amber/30 rounded-full px-4 py-1.5 mb-6">
            <AlertTriangle className="w-4 h-4 text-amber" />
            <span className="text-amber text-sm font-semibold">IEEPA Refund Deadline: July 15, 2026</span>
          </div>
          <h1 className="text-3xl font-black text-foreground mb-2">Free IEEPA Refund Calculator</h1>
          <p className="text-muted-foreground text-sm">
            The Supreme Court invalidated IEEPA tariffs. Find out how much you're owed back in 30 seconds.
          </p>
        </div>

        {/* Progress */}
        {step < 3 && (
          <div className="flex items-center gap-2 mb-8">
            {[1, 2].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step >= s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                }`}>{s}</div>
                {s < 2 && <div className={`h-px w-16 transition-all ${step > s ? "bg-primary" : "bg-border"}`} />}
              </div>
            ))}
            <span className="text-xs text-muted-foreground ml-2">Step {step} of 2</span>
          </div>
        )}

        {/* ── Step 1 ── */}
        {step === 1 && (
          <div className="card-surface p-8 space-y-6">
            <div>
              <h2 className="font-bold text-foreground mb-1">Your company information</h2>
              <p className="text-xs text-muted-foreground">We'll send your full assessment to your email</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="companyName" className="text-sm text-muted-foreground mb-1.5 block">Company Name</Label>
                <Input
                  id="companyName"
                  data-testid="input-company-name"
                  placeholder="Acme Imports LLC"
                  value={form.companyName}
                  onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground/50"
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-sm text-muted-foreground mb-1.5 block">Email Address</Label>
                <Input
                  id="email"
                  data-testid="input-email"
                  type="email"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground/50"
                />
              </div>

              <div>
                <Label htmlFor="spend" className="text-sm text-muted-foreground mb-1.5 block">Annual Import Spend (USD)</Label>
                <Input
                  id="spend"
                  data-testid="input-spend"
                  placeholder="$2,500,000"
                  value={form.annualImportSpend}
                  onChange={e => setForm(f => ({ ...f, annualImportSpend: e.target.value }))}
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground/50 font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1">Total value of imported goods per year</p>
              </div>
            </div>

            <Button
              data-testid="button-next-step1"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
              disabled={!form.companyName || !form.email || !form.annualImportSpend}
              onClick={() => setStep(2)}
            >
              Continue <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* ── Step 2 ── */}
        {step === 2 && (
          <div className="card-surface p-8 space-y-6">
            <div>
              <h2 className="font-bold text-foreground mb-1">Your import profile</h2>
              <p className="text-xs text-muted-foreground">We use this to calculate your specific IEEPA exposure</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground mb-1.5 block">Primary Import Country</Label>
                <Select
                  value={form.primaryCountry}
                  onValueChange={v => setForm(f => ({ ...f, primaryCountry: v }))}
                >
                  <SelectTrigger data-testid="select-country" className="bg-input border-border text-foreground">
                    <SelectValue placeholder="Select country..." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {countries.map(c => (
                      <SelectItem key={c} value={c} className="text-foreground">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm text-muted-foreground mb-1.5 block">Product Category</Label>
                <Select
                  value={form.productCategory}
                  onValueChange={v => setForm(f => ({ ...f, productCategory: v }))}
                >
                  <SelectTrigger data-testid="select-category" className="bg-input border-border text-foreground">
                    <SelectValue placeholder="Select category..." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {categories.map(c => (
                      <SelectItem key={c} value={c} className="text-foreground">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Live preview */}
              {spendNum > 0 && form.primaryCountry && (
                <div className="bg-amber/5 border border-amber/20 rounded-lg p-4">
                  <p className="text-xs font-semibold text-amber uppercase tracking-wider mb-2">Estimated Refund Preview</p>
                  <div className="text-2xl font-black text-amber num">
                    {formatDollar(spendNum * (form.primaryCountry === "China" ? 0.15 : 0.075))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Based on {form.primaryCountry === "China" ? "20%" : "10%"} IEEPA rate × 9 months
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="border-border"
                onClick={() => setStep(1)}
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button
                data-testid="button-calculate"
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
                disabled={!form.primaryCountry || !form.productCategory || mutation.isPending}
                onClick={handleSubmit}
              >
                {mutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</>
                ) : (
                  <>Calculate My Refund <ArrowRight className="w-4 h-4 ml-2" /></>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 3: Results ── */}
        {step === 3 && result && (
          <div className="space-y-6">
            {/* Main result */}
            <div className="card-surface border-amber/30 p-8 text-center glow-amber">
              <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-4 py-1.5 mb-6">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span className="text-green-400 text-sm font-semibold">Assessment Complete</span>
              </div>

              <p className="text-sm text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Your Estimated IEEPA Refund</p>
              <div className="text-5xl font-black text-amber num mb-2 count-animate">
                {formatDollar(result.estimatedRefund)}
              </div>
              <p className="text-sm text-muted-foreground">Based on your import spend, country, and IEEPA payment period</p>
            </div>

            {/* Savings breakdown */}
            <div className="grid grid-cols-2 gap-4">
              <div className="card-surface p-5 text-center">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <DollarSign className="w-4 h-4 text-amber" />
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">IEEPA Refund</span>
                </div>
                <div className="text-2xl font-black text-amber num">{formatDollar(result.estimatedRefund)}</div>
                <div className="text-xs text-muted-foreground mt-1">One-time recovery</div>
              </div>
              <div className="card-surface p-5 text-center">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <TrendingDown className="w-4 h-4 text-teal" />
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Annual Savings</span>
                </div>
                <div className="text-2xl font-black text-teal num">{formatDollar(result.estimatedSavings)}</div>
                <div className="text-xs text-muted-foreground mt-1">Ongoing per year</div>
              </div>
            </div>

            {/* Deadline */}
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-start gap-3">
              <Clock className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-400">Filing deadline: July 15, 2026</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  IEEPA refund claims must be filed before this date. TariffShield handles the entire process for a 15% success fee — you pay nothing unless we recover money for you.
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="card-surface p-6 space-y-4">
              <h3 className="font-bold text-foreground">Claim your refund — zero upfront cost</h3>
              <p className="text-sm text-muted-foreground">
                TariffShield manages the full IEEPA refund filing process. We earn 15% of what we recover. If we don't find anything, you owe nothing.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/onboarding" className="flex-1">
                  <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold">
                    Start Recovery Process
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline" className="w-full border-border font-semibold">
                    View Dashboard
                  </Button>
                </Link>
              </div>
              <p className="text-xs text-muted-foreground">
                Results also sent to <strong className="text-foreground">{form.email}</strong>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
