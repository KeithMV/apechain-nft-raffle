#!/bin/bash

# Staging Deployment Script
set -e

echo "🚀 Deploying ApeChain Raffle Platform to STAGING..."

# Build frontend for staging
echo "📦 Building frontend for staging..."
cd frontend
yarn build:staging

# Deploy infrastructure (if needed)
echo "🏗️  Checking staging infrastructure..."
cd ../infrastructure
npx cdk deploy RaffleStagingStack --require-approval never

# Get staging bucket name and distribution ID
STAGING_BUCKET=$(aws cloudformation describe-stacks --stack-name RaffleStagingStack --query 'Stacks[0].Outputs[?OutputKey==`StagingBucketName`].OutputValue' --output text)
STAGING_DISTRIBUTION=$(aws cloudformation describe-stacks --stack-name RaffleStagingStack --query 'Stacks[0].Outputs[?OutputKey==`StagingDistributionId`].OutputValue' --output text)

echo "📤 Uploading to S3: $STAGING_BUCKET"
cd ../frontend
aws s3 sync build/ s3://$STAGING_BUCKET/ --delete

echo "🔄 Invalidating CloudFront: $STAGING_DISTRIBUTION"
aws cloudfront create-invalidation --distribution-id $STAGING_DISTRIBUTION --paths "/*"

echo "✅ Staging deployment complete!"
echo "🌐 Staging URL: https://staging.apechainraffles.io"
echo ""
echo "🧪 Test the following:"
echo "  - Multi-chain network switching"
echo "  - Mobile wallet connections"
echo "  - Raffle creation (testnet)"
echo "  - Responsive design"