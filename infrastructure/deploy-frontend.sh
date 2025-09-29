#!/bin/bash

# 📤 Deploy Frontend to CloudFormation Infrastructure
# ApeCoin NFT Raffle System

set -e

STACK_NAME="apechain-nft-raffle-infrastructure"
BUILD_DIR="../frontend/build"

echo "📤 Deploying frontend to CloudFormation infrastructure..."

# Get bucket name from CloudFormation stack
BUCKET_NAME=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region us-east-1 \
    --query 'Stacks[0].Outputs[?OutputKey==`BucketName`].OutputValue' \
    --output text)

echo "🪣 Target bucket: $BUCKET_NAME"

# Check if build exists
if [ ! -d "$BUILD_DIR" ]; then
    echo "❌ Build directory not found. Run: npm run build in frontend/"
    exit 1
fi

# Upload files with proper caching
echo "📤 Uploading files..."
cd ../frontend
aws s3 sync build/ s3://$BUCKET_NAME --delete \
    --cache-control "public, max-age=31536000" \
    --exclude "*.html" --exclude "service-worker.js"

aws s3 sync build/ s3://$BUCKET_NAME --delete \
    --cache-control "public, max-age=0, must-revalidate" \
    --include "*.html" --include "service-worker.js"

# Get CloudFront distribution ID and invalidate cache
DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region us-east-1 \
    --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' \
    --output text)

echo "🔄 Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
    --distribution-id $DISTRIBUTION_ID \
    --paths "/*" > /dev/null

echo "✅ Frontend deployed successfully!"
echo ""
echo "🌍 CloudFront URL: https://$(aws cloudformation describe-stacks --stack-name $STACK_NAME --region us-east-1 --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontURL`].OutputValue' --output text | sed 's|https://||')"