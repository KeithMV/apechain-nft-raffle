#!/bin/bash

# Update CloudFront distribution with custom domain and SSL certificate
# Usage: ./update-cloudfront.sh apechain-raffles.com arn:aws:acm:...

set -e

DOMAIN_NAME=$1
CERT_ARN=$2
DISTRIBUTION_ID="EH7R5RBQF66DL"

if [ -z "$DOMAIN_NAME" ] || [ -z "$CERT_ARN" ]; then
    echo "❌ Usage: ./update-cloudfront.sh <domain-name> <certificate-arn>"
    exit 1
fi

echo "🔄 Updating CloudFront distribution with custom domain..."

# Get current distribution config
aws cloudfront get-distribution-config --id $DISTRIBUTION_ID > current-config.json

# Extract ETag and config
ETAG=$(jq -r '.ETag' current-config.json)
jq '.DistributionConfig' current-config.json > distribution-config.json

# Update config with custom domain and certificate
jq --arg domain "$DOMAIN_NAME" --arg cert "$CERT_ARN" '
.Aliases = {
  "Quantity": 2,
  "Items": [$domain, ("www." + $domain)]
} |
.ViewerCertificate = {
  "ACMCertificateArn": $cert,
  "SSLSupportMethod": "sni-only",
  "MinimumProtocolVersion": "TLSv1.2_2021",
  "CertificateSource": "acm"
}' distribution-config.json > updated-config.json

# Update distribution
aws cloudfront update-distribution \
    --id $DISTRIBUTION_ID \
    --distribution-config file://updated-config.json \
    --if-match $ETAG

echo "✅ CloudFront distribution updated successfully!"
echo "🌐 Your site will be available at: https://$DOMAIN_NAME"
echo ""
echo "📋 Next steps:"
echo "1. Register domain: $DOMAIN_NAME"
echo "2. Point DNS to: d3mce6qq270l98.cloudfront.net"
echo "3. Wait for propagation (5-30 minutes)"

# Cleanup
rm -f current-config.json distribution-config.json updated-config.json