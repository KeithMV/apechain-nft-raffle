#!/bin/bash

# ApeChain NFT Raffle - Deployment Script
# Quick reference for deploying frontend updates

set -e

echo "🚀 Deploying ApeChain NFT Raffle Frontend..."

# Build React app
echo "📦 Building React app..."
cd frontend
yarn build

# Deploy to S3
echo "☁️ Uploading to S3..."
aws s3 sync build/ s3://apechain-nft-raffle-856872546342-us-east-1/ --delete

# Invalidate CloudFront cache
echo "🔄 Invalidating CloudFront cache..."
aws cloudfront create-invalidation --distribution-id EH7R5RBQF66DL --paths "/*"

echo "✅ Deployment complete!"
echo "🌐 Live URL: https://d3mce6qq270l98.cloudfront.net"
echo "⏱️ Cache invalidation may take 1-2 minutes to propagate globally"