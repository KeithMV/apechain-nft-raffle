#!/bin/bash

# ApeChain NFT Raffle - Deployment Script
# Quick reference for deploying frontend updates

set -e

echo "🚀 Deploying ApeChain NFT Raffle Frontend..."

# Build React app
echo "📦 Building React app..."
cd frontend

# Check if ALCHEMY_API_KEY is set
if [ -z "$ALCHEMY_API_KEY" ]; then
  echo "❌ ALCHEMY_API_KEY environment variable is required"
  echo "💡 Set it with: export ALCHEMY_API_KEY=your_api_key_here"
  exit 1
fi

# Build with environment variables
REACT_APP_ALCHEMY_API_KEY=$ALCHEMY_API_KEY yarn build

# Deploy to S3
echo "☁️ Uploading to S3..."
aws s3 sync build/ s3://apechain-nft-raffle-856872546342-us-east-1/ --delete

# Invalidate CloudFront cache
echo "🔄 Invalidating CloudFront cache..."
aws cloudfront create-invalidation --distribution-id EH7R5RBQF66DL --paths "/*"

echo "✅ Deployment complete!"
echo "🌐 Live URL: https://web3raffles.io"
echo "⏱️ Cache invalidation may take 1-2 minutes to propagate globally"