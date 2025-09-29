#!/bin/bash

# 🚀 AWS S3 + CloudFront Deployment Script
# ApeCoin NFT Raffle System

set -e

BUCKET_NAME="apechain-nft-raffle"
REGION="us-east-1"
BUILD_DIR="/home/ubuntu/apechain-nft-raffle/frontend/build"

echo "🚀 Deploying ApeCoin NFT Raffle to AWS S3 + CloudFront..."

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &>/dev/null; then
    echo "❌ AWS CLI not configured. Run: aws configure"
    exit 1
fi

# Check if build exists
if [ ! -d "$BUILD_DIR" ]; then
    echo "❌ Build directory not found. Run: npm run build"
    exit 1
fi

echo "📦 Creating S3 bucket: $BUCKET_NAME"
aws s3 mb s3://$BUCKET_NAME --region $REGION 2>/dev/null || echo "Bucket already exists"

echo "📤 Uploading files to S3..."
cd /home/ubuntu/apechain-nft-raffle/frontend
aws s3 sync build/ s3://$BUCKET_NAME --delete --cache-control "public, max-age=31536000" --exclude "*.html" --exclude "service-worker.js"
aws s3 sync build/ s3://$BUCKET_NAME --delete --cache-control "public, max-age=0, must-revalidate" --include "*.html" --include "service-worker.js"

echo "🌐 Enabling static website hosting..."
aws s3 website s3://$BUCKET_NAME --index-document index.html --error-document index.html

echo "🔓 Disabling block public access..."
aws s3api put-public-access-block --bucket $BUCKET_NAME --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

echo "🔓 Setting public read policy..."
aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy '{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicReadGetObject",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::'$BUCKET_NAME'/*"
  }]
}'

echo "☁️ Creating CloudFront distribution..."
DISTRIBUTION_CONFIG='{
  "CallerReference": "'$(date +%s)'",
  "Comment": "ApeCoin NFT Raffle System",
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-'$BUCKET_NAME'",
    "ViewerProtocolPolicy": "redirect-to-https",
    "TrustedSigners": {
      "Enabled": false,
      "Quantity": 0
    },
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {"Forward": "none"}
    },
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000
  },
  "Origins": {
    "Quantity": 1,
    "Items": [{
      "Id": "S3-'$BUCKET_NAME'",
      "DomainName": "'$BUCKET_NAME'.s3-website-'$REGION'.amazonaws.com",
      "CustomOriginConfig": {
        "HTTPPort": 80,
        "HTTPSPort": 443,
        "OriginProtocolPolicy": "http-only"
      }
    }]
  },
  "Enabled": true,
  "CustomErrorResponses": {
    "Quantity": 1,
    "Items": [{
      "ErrorCode": 404,
      "ResponsePagePath": "/index.html",
      "ResponseCode": "200",
      "ErrorCachingMinTTL": 300
    }]
  }
}'

DISTRIBUTION_ID=$(aws cloudfront create-distribution --distribution-config "$DISTRIBUTION_CONFIG" --query 'Distribution.Id' --output text)

echo "✅ Deployment Complete!"
echo ""
echo "📍 S3 Website URL: http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com"
echo "🌍 CloudFront URL: https://$(aws cloudfront get-distribution --id $DISTRIBUTION_ID --query 'Distribution.DomainName' --output text)"
echo "🔄 CloudFront Distribution ID: $DISTRIBUTION_ID"
echo ""
echo "⏳ CloudFront deployment takes 15-20 minutes to propagate globally"
echo "💰 Platform will start earning 10% fees on first raffle creation!"
echo ""
echo "🎯 Next Steps:"
echo "1. Wait for CloudFront deployment"
echo "2. Test wallet connection on live site"
echo "3. Create your first raffle"
echo "4. Share with ApeCoin community!"