#!/bin/bash

# ApeChain NFT Raffle - Staging Deployment Script
# Deploy develop branch to staging environment

set -e

echo "🚀 Deploying ApeChain NFT Raffle to STAGING..."

# Ensure we're on staging branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "staging" ]; then
  echo "❌ Must be on staging branch for staging deployment"
  echo "Current branch: $CURRENT_BRANCH"
  exit 1
fi

# Build React app with staging environment
echo "📦 Building React app for staging..."
cd frontend

# Check if ALCHEMY_API_KEY is set
if [ -z "$ALCHEMY_API_KEY" ]; then
  echo "❌ ALCHEMY_API_KEY environment variable is required"
  echo "💡 Set it with: export ALCHEMY_API_KEY=your_api_key_here"
  exit 1
fi

# Build with environment variables
REACT_APP_ENV=staging REACT_APP_ENVIRONMENT=staging REACT_APP_ALCHEMY_API_KEY=$ALCHEMY_API_KEY yarn build

# Deploy to Staging S3
echo "☁️ Uploading to Staging S3..."
aws s3 sync build/ s3://apechain-nft-raffle-staging-856872546342-us-east-1/ --delete

# Invalidate Staging CloudFront cache
echo "🔄 Invalidating Staging CloudFront cache..."
aws cloudfront create-invalidation --distribution-id E2OQG8N4GFFTXI --paths "/*"

echo "✅ Staging deployment complete!"
echo "🌐 Staging URL: https://d1784e9dgxn2du.cloudfront.net"
echo "⏱️ Cache invalidation may take 1-2 minutes to propagate globally"
echo ""
echo "🔍 Environment: STAGING (testnet 33111)"
echo "📋 To promote to production: merge staging → main"