#!/bin/bash
# TariffShield Railway Deploy Script
# Usage: RAILWAY_TOKEN=xxx RAILWAY_PROJECT_ID=xxx bash scripts/deploy-railway.sh

set -e

if [ -z "$RAILWAY_TOKEN" ]; then
  echo "❌ RAILWAY_TOKEN not set. Get it from https://railway.app/account/tokens"
  exit 1
fi

if [ -z "$RAILWAY_PROJECT_ID" ]; then
  echo "❌ RAILWAY_PROJECT_ID not set. Get it from your Railway project settings."
  exit 1
fi

echo "🚂 Deploying TariffShield to Railway..."
echo "   Project: $RAILWAY_PROJECT_ID"

# Link to Railway project
echo ""
echo "📎 Linking to Railway project..."
railway link --project-id "$RAILWAY_PROJECT_ID"

# Deploy
echo ""
echo "🚀 Deploying..."
railway up --detach

echo ""
echo "✅ Deploy triggered! Monitor at: https://railway.app/project/$RAILWAY_PROJECT_ID"
echo ""
echo "📋 After deploy completes:"
echo "   1. Copy your Railway domain from Project Settings"
echo "   2. Add APP_URL=https://your-domain.up.railway.app to Railway variables"
echo "   3. Update Stripe webhook URL to https://your-domain.up.railway.app/api/stripe/webhook"
echo "   4. Run smoke test: curl https://your-domain.up.railway.app/api/health"
