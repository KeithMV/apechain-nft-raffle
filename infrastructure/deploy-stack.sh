#!/bin/bash

# 🏗️ CloudFormation Stack Deployment Script
# ApeCoin NFT Raffle System - Phase 1

set -e

STACK_NAME="apechain-nft-raffle-infrastructure"
TEMPLATE_FILE="cloudformation/raffle-infrastructure.yaml"
REGION="us-east-1"

echo "🏗️ Deploying CloudFormation Stack: $STACK_NAME"

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &>/dev/null; then
    echo "❌ AWS CLI not configured. Run: aws configure"
    exit 1
fi

# Deploy the stack
echo "📤 Deploying CloudFormation template..."
aws cloudformation deploy \
    --template-file $TEMPLATE_FILE \
    --stack-name $STACK_NAME \
    --region $REGION \
    --capabilities CAPABILITY_IAM \
    --no-fail-on-empty-changeset \
    --tags \
        Project=apechain-nft-raffle \
        Environment=prod \
        ManagedBy=CloudFormation

# Get stack outputs
echo "📋 Stack Outputs:"
aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
    --output table

echo ""
echo "✅ CloudFormation Stack Deployed Successfully!"
echo ""
echo "🎯 Next Steps:"
echo "1. Use the new CloudFront URL for production"
echo "2. Update DNS records (Phase 2)"
echo "3. Deploy frontend files to the new S3 bucket"