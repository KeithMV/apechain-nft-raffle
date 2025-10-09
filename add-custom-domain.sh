#!/bin/bash

# Add custom domain to existing CloudFront distribution
# Usage: ./add-custom-domain.sh apechain-raffles.com

set -e

DOMAIN_NAME=$1
DISTRIBUTION_ID="EH7R5RBQF66DL"

if [ -z "$DOMAIN_NAME" ]; then
    echo "❌ Usage: ./add-custom-domain.sh <domain-name>"
    echo "Example: ./add-custom-domain.sh apechain-raffles.com"
    exit 1
fi

echo "🚀 Adding custom domain $DOMAIN_NAME to existing CloudFront distribution"

# Step 1: Request SSL certificate
echo "📜 Requesting SSL certificate for $DOMAIN_NAME..."
CERT_ARN=$(aws acm request-certificate \
    --domain-name "$DOMAIN_NAME" \
    --subject-alternative-names "www.$DOMAIN_NAME" \
    --validation-method DNS \
    --region us-east-1 \
    --query 'CertificateArn' \
    --output text)

echo "✅ Certificate requested: $CERT_ARN"
echo ""
echo "📋 IMPORTANT: You need to validate the certificate by adding DNS records."
echo "Run this command to see the validation records:"
echo "aws acm describe-certificate --certificate-arn $CERT_ARN --region us-east-1"
echo ""
echo "After DNS validation (5-30 minutes), run:"
echo "./update-cloudfront.sh $DOMAIN_NAME $CERT_ARN"