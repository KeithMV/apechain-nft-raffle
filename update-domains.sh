#!/bin/bash

# Update CloudFront with new domains after SSL validation
set -e

CERT_ARN=$1
DISTRIBUTION_ID="EH7R5RBQF66DL"

if [ -z "$CERT_ARN" ]; then
    echo "❌ Usage: ./update-domains.sh <certificate-arn>"
    exit 1
fi

echo "🔄 Updating CloudFront with new domains..."

# Get current config
aws cloudfront get-distribution-config --id $DISTRIBUTION_ID > current-config.json
ETAG=$(jq -r '.ETag' current-config.json)
jq '.DistributionConfig' current-config.json > distribution-config.json

# Update with all domains
jq --arg cert "$CERT_ARN" '
.Aliases = {
  "Quantity": 6,
  "Items": [
    "apechain-raffles.com",
    "www.apechain-raffles.com", 
    "apechainraffles.com",
    "www.apechainraffles.com",
    "apechainraffles.xyz", 
    "www.apechainraffles.xyz"
  ]
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

echo "✅ CloudFront updated successfully!"
echo ""
echo "📋 DNS Records to Add:"
echo "For apechainraffles.com:"
echo "  A Record: apechainraffles.com → d3mce6qq270l98.cloudfront.net"
echo "  CNAME: www.apechainraffles.com → d3mce6qq270l98.cloudfront.net"
echo ""
echo "For apechainraffles.xyz:"
echo "  A Record: apechainraffles.xyz → d3mce6qq270l98.cloudfront.net" 
echo "  CNAME: www.apechainraffles.xyz → d3mce6qq270l98.cloudfront.net"

# Cleanup
rm -f current-config.json distribution-config.json updated-config.json