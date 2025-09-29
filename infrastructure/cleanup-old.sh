#!/bin/bash

# 🧹 Cleanup Old Manual Infrastructure
# ApeCoin NFT Raffle System

set -e

OLD_BUCKET="apechain-nft-raffle"
REGION="us-east-1"

echo "🧹 Cleaning up old manual infrastructure..."

# Get old CloudFront distribution ID
echo "🔍 Finding old CloudFront distribution..."
OLD_DISTRIBUTION_ID=$(aws cloudfront list-distributions \
    --query 'DistributionList.Items[?Origins.Items[0].DomainName==`'$OLD_BUCKET'.s3-website-'$REGION'.amazonaws.com`].Id | [0]' \
    --output text)

if [ -n "$OLD_DISTRIBUTION_ID" ] && [ "$OLD_DISTRIBUTION_ID" != "None" ]; then
    echo "📡 Found old CloudFront distribution: $OLD_DISTRIBUTION_ID"
    echo "⚠️ CloudFront distribution needs manual cleanup in AWS Console:"
    echo "   1. Go to CloudFront console"
    echo "   2. Disable distribution $OLD_DISTRIBUTION_ID"
    echo "   3. Wait 15-20 minutes for deployment"
    echo "   4. Delete the distribution"
else
    echo "ℹ️ No old CloudFront distribution found"
fi

# Delete S3 bucket
echo "🪣 Deleting old S3 bucket: $OLD_BUCKET"
if aws s3api head-bucket --bucket $OLD_BUCKET 2>/dev/null; then
    aws s3 rm s3://$OLD_BUCKET --recursive
    aws s3 rb s3://$OLD_BUCKET
    echo "✅ S3 bucket deleted"
else
    echo "ℹ️ Old S3 bucket not found"
fi

# Cleanup temp files
rm -f /tmp/dist-config.json /tmp/dist-config-disabled.json

echo ""
echo "✅ Cleanup Complete!"
echo ""
echo "🎯 Active Infrastructure:"
echo "📍 S3 Bucket: apechain-nft-raffle-cf-prod"
echo "🌍 CloudFront: https://dowwrsg3z2a4o.cloudfront.net"
echo "💰 Monthly savings: ~$2-6"