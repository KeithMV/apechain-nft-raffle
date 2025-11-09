#!/bin/bash

# Add multiple domains to existing CloudFront distribution
# Usage: ./add-multiple-domains.sh domain1.com domain2.com domain3.com

set -e

DISTRIBUTION_ID="EH7R5RBQF66DL"
DOMAINS=("$@")

if [ ${#DOMAINS[@]} -eq 0 ]; then
    echo "❌ Usage: ./add-multiple-domains.sh <domain1> <domain2> ..."
    echo "Example: ./add-multiple-domains.sh new-domain.com another-domain.com"
    exit 1
fi

echo "🚀 Adding domains to CloudFront distribution: ${DOMAINS[*]}"

# Get current config
aws cloudfront get-distribution-config --id $DISTRIBUTION_ID > current-config.json
ETAG=$(jq -r '.ETag' current-config.json)
jq '.DistributionConfig' current-config.json > distribution-config.json

# Build domains array (keep existing + add new)
DOMAIN_LIST='["apechain-raffles.com", "www.apechain-raffles.com", "apechainraffles.io", "www.apechainraffles.io"'
for domain in "${DOMAINS[@]}"; do
    DOMAIN_LIST+=", \"$domain\", \"www.$domain\""
done
DOMAIN_LIST+=']'

# Update config
jq --argjson domains "$DOMAIN_LIST" '
.Aliases = {
  "Quantity": ($domains | length),
  "Items": $domains
}' distribution-config.json > updated-config.json

# Update distribution
aws cloudfront update-distribution \
    --id $DISTRIBUTION_ID \
    --distribution-config file://updated-config.json \
    --if-match $ETAG

echo "✅ Domains added successfully!"
echo "📋 Configure DNS for each domain to point to: d3mce6qq270l98.cloudfront.net"

# Cleanup
rm -f current-config.json distribution-config.json updated-config.json