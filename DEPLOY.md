# TariffShield — Railway Production Deploy Guide

Everything is pre-built and ready. Follow these steps once to go live.

---

## Step 1: Create Railway Account + Project

1. Go to [railway.app](https://railway.app) → Sign Up (free)
2. Click **New Project** → **Empty Project**
3. Name it `tariffshield`
4. Click **Settings** → copy the **Project ID**

---

## Step 2: Get Your Railway Token

1. Go to [railway.app/account/tokens](https://railway.app/account/tokens)
2. Click **Create Token** → name it `tariffshield-deploy`
3. Copy the token (starts with `railway_...`)

---

## Step 3: Set Environment Variables in Railway

In your Railway project, go to **Variables** and add these:

```
NODE_ENV=production
PORT=5000
DATABASE_URL=/app/data/data.db
ADMIN_KEY=<generate: openssl rand -hex 32>
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_MONITOR=price_...
STRIPE_PRICE_OPTIMIZE=price_...
PERPLEXITY_API_KEY=pplx-...
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=<your-resend-api-key>
EMAIL_FROM=TariffShield <intelligence@tariffshield.ai>
APP_URL=https://<your-railway-domain>.up.railway.app
```

> **PERPLEXITY_API_KEY**: Get from https://www.perplexity.ai/settings/api
> **SMTP (Resend)**: Get from https://resend.com (free tier: 3,000 emails/mo)

---

## Step 4: Add Railway Volume (SQLite persistence)

1. In Railway project → **New** → **Volume**
2. Mount path: `/app/data`
3. Attach to your service

---

## Step 5: Deploy from Computer Sandbox

Run these commands (Computer will execute them for you):

```bash
# Set your Railway token
export RAILWAY_TOKEN=railway_your_token_here

# Link and deploy
cd /home/user/workspace/tariffshield
railway link --project-id YOUR_PROJECT_ID
railway up --detach
```

---

## Step 6: Set Up Stripe (if not done)

### Create Products:

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe login

# Create MONITOR product ($500/mo)
stripe products create --name="TariffShield Monitor" --description="Weekly tariff intelligence + HTS alerts"
stripe prices create --product=prod_XXXX --unit-amount=50000 --currency=usd --recurring[interval]=month

# Create OPTIMIZE product ($2,500/mo)
stripe products create --name="TariffShield Optimize" --description="Premium tariff strategy + FTZ modeling"
stripe prices create --product=prod_XXXX --unit-amount=250000 --currency=usd --recurring[interval]=month
```

Copy the `price_XXXX` IDs into Railway Variables above.

---

## Step 7: Wire Stripe Webhook

1. Get your Railway URL (e.g., `https://tariffshield-production.up.railway.app`)
2. Go to [Stripe Webhooks](https://dashboard.stripe.com/webhooks) → Add Endpoint
3. URL: `https://YOUR-DOMAIN.up.railway.app/api/stripe/webhook`
4. Events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Copy the **Signing Secret** → add to Railway as `STRIPE_WEBHOOK_SECRET`

---

## Step 8: Update Frontend with Railway URL

After Railway gives you a domain, Computer will:
1. Update `queryClient.ts` with the Railway URL (if needed)
2. Rebuild and redeploy the frontend

---

## Smoke Test Checklist

- [ ] `GET /api/health` returns `{"status":"ok"}`
- [ ] Sign up new user → session cookie set
- [ ] Login → redirects to /dashboard
- [ ] Dashboard loads with live data
- [ ] Calculator → submit → email received
- [ ] RECOVER signup → activates account immediately
- [ ] MONITOR signup → Stripe checkout → webhook fires → plan upgrades

---

## Architecture on Railway

```
Railway Service (Dockerfile)
├── Node.js Express server (port 5000)
├── Serves frontend (dist/public/*)
├── Serves API (/api/*)
├── Weekly cron: Monday 7am UTC (tariff scan + briefings)
└── SQLite DB → /app/data/data.db (Railway Volume)
```
