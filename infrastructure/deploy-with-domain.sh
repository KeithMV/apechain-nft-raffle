#!/bin/bash

# Deploy ApeCoin NFT Raffle with Custom Domain
# Usage: ./deploy-with-domain.sh your-domain.com

set -e

DOMAIN_NAME=$1
HOSTED_ZONE_ID=$2

if [ -z "$DOMAIN_NAME" ]; then
    echo "❌ Usage: ./deploy-with-domain.sh <domain-name> [hosted-zone-id]"
    echo "Example: ./deploy-with-domain.sh apechain-raffles.com Z1234567890ABC"
    exit 1
fi

echo "🚀 Deploying ApeCoin NFT Raffle with custom domain: $DOMAIN_NAME"

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS CLI not configured. Run 'aws configure' first."
    exit 1
fi

# Install dependencies
echo "📦 Installing CDK dependencies..."
npm install

# Bootstrap CDK (if not already done)
echo "🔧 Bootstrapping CDK..."
npx cdk bootstrap || true

# Deploy with domain configuration
echo "🏗️ Deploying infrastructure with domain: $DOMAIN_NAME"

if [ -n "$HOSTED_ZONE_ID" ]; then
    # Deploy with both domain and hosted zone
    npx cdk deploy RaffleInfrastructureStack \
        --context domainName="$DOMAIN_NAME" \
        --context hostedZoneId="$HOSTED_ZONE_ID" \
        --require-approval never
else
    # Deploy with domain only (manual DNS setup required)
    npx cdk deploy RaffleInfrastructureStack \
        --context domainName="$DOMAIN_NAME" \
        --require-approval never
fi

echo "✅ Infrastructure deployed successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. If you don't have a hosted zone, create DNS records manually:"
echo "   - Point $DOMAIN_NAME to the CloudFront distribution"
echo "   - Point www.$DOMAIN_NAME to the CloudFront distribution"
echo ""
echo "2. Wait for SSL certificate validation (can take 5-30 minutes)"
echo ""
echo "3. Deploy frontend:"
echo "   cd ../frontend && npm run build"
echo "   aws s3 sync build/ s3://\$(aws cloudformation describe-stacks --stack-name RaffleInfrastructureStack --query 'Stacks[0].Outputs[?OutputKey==\`BucketName\`].OutputValue' --output text)/"
echo ""
echo "4. Test your site at: https://$DOMAIN_NAME"