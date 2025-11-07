#!/bin/bash

# Setup apechainraffles.xyz and apechainraffles.com
set -e

echo "🚀 Setting up apechainraffles.xyz and apechainraffles.com"

# Request SSL certificate for both domains
echo "📜 Requesting SSL certificate..."
CERT_ARN=$(aws acm request-certificate \
    --domain-name "apechainraffles.com" \
    --subject-alternative-names "www.apechainraffles.com" "apechainraffles.xyz" "www.apechainraffles.xyz" \
    --validation-method DNS \
    --region us-east-1 \
    --query 'CertificateArn' \
    --output text)

echo "✅ Certificate requested: $CERT_ARN"
echo ""
echo "📋 NEXT STEPS:"
echo "1. Buy domains: apechainraffles.xyz and apechainraffles.com"
echo "2. Get DNS validation records:"
echo "   aws acm describe-certificate --certificate-arn $CERT_ARN --region us-east-1"
echo "3. Add validation records to your domain DNS"
echo "4. Wait 5-30 minutes for validation"
echo "5. Run: ./update-domains.sh $CERT_ARN"