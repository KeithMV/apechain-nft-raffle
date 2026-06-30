# Environment Variables Configuration

This document lists all required environment variables for the project. **Never commit sensitive values to version control.**

## CircleCI Environment Variables

Add these in CircleCI Project Settings → Environment Variables:

### Required for All Builds

```bash
# AWS Credentials
AWS_ACCESS_KEY_ID=<your-aws-access-key>
AWS_SECRET_ACCESS_KEY=<your-aws-secret-key>
AWS_DEFAULT_REGION=us-east-1

# AWS Account Info
CDK_DEFAULT_ACCOUNT=<your-12-digit-aws-account-id>
CDK_DEFAULT_REGION=us-east-1

# API Keys
REACT_APP_ALCHEMY_API_KEY=<your-alchemy-api-key>
WALLETCONNECT_PROJECT_ID=<your-walletconnect-project-id>

# Certificate ARNs
CERTIFICATE_ARN=arn:aws:acm:us-east-1:<account-id>:certificate/<cert-id>
STAGING_CERTIFICATE_ARN=arn:aws:acm:us-east-1:<account-id>:certificate/<cert-id>
```

### Deployment Configuration

```bash
# Staging Deployment
STAGING_BUCKET_NAME=apechain-nft-raffle-staging-v2-<account-id>-us-east-1
STAGING_DISTRIBUTION_ID=<cloudfront-distribution-id>
STAGING_CLOUDFRONT_URL=https://<distribution-id>.cloudfront.net

# Production Deployment (fetched from CloudFormation)
# These are automatically retrieved from CDK stack outputs

# App URLs
REACT_APP_APP_URL_STAGING=https://staging.apechainraffles.io
REACT_APP_APP_URL_PRODUCTION=https://web3raffles.io
```

## Local Development

Create `.env` files (already in `.gitignore`):

### Frontend `.env.local`

```bash
REACT_APP_ENV=development
REACT_APP_ENABLE_LOGGING=true
REACT_APP_NETWORK=apechain
REACT_APP_CHAIN_ID=33139
REACT_APP_APECHAIN_RPC_URL=https://apechain.calderachain.xyz/http
REACT_APP_CONTRACT_ADDRESS=0x1627E7e63b63878E61f91D336385a59B1747934a
REACT_APP_WALLETCONNECT_PROJECT_ID=<your-project-id>
REACT_APP_APP_NAME="ApeChain NFT Raffles (Dev)"
REACT_APP_APP_URL=http://localhost:3000
REACT_APP_ALCHEMY_API_KEY=<your-api-key>
```

### Infrastructure CDK

```bash
export CDK_DEFAULT_ACCOUNT=<your-aws-account-id>
export CDK_DEFAULT_REGION=us-east-1
export CERTIFICATE_ARN=arn:aws:acm:us-east-1:<account-id>:certificate/<cert-id>
```

## Security Notes

✅ **DO:**
- Store all sensitive values in CircleCI environment variables
- Use AWS Secrets Manager for production secrets
- Rotate API keys regularly
- Use least-privilege IAM policies

❌ **DON'T:**
- Commit API keys, account IDs, or credentials to Git
- Use hardcoded values in source code
- Share environment variables in public channels
- Use production credentials in development

## Setup Instructions

### 1. CircleCI Setup

1. Go to CircleCI Project Settings
2. Navigate to Environment Variables
3. Add each variable from the "Required for All Builds" section above
4. Redeploy the pipeline

### 2. CDK Deployment

```bash
cd infrastructure
export CDK_DEFAULT_ACCOUNT=<your-account-id>
export CDK_DEFAULT_REGION=us-east-1
export CERTIFICATE_ARN=<your-cert-arn>
yarn cdk deploy
```

### 3. Get Deployment IDs

After first CDK deployment, add to CircleCI:

```bash
# Get staging bucket name
aws cloudformation describe-stacks \
  --stack-name RaffleStagingStack \
  --query 'Stacks[0].Outputs[?OutputKey==`StagingBucketName`].OutputValue' \
  --output text

# Get staging distribution ID
aws cloudformation describe-stacks \
  --stack-name RaffleStagingStack \
  --query 'Stacks[0].Outputs[?OutputKey==`StagingDistributionId`].OutputValue' \
  --output text

# Get CloudFront URL
aws cloudformation describe-stacks \
  --stack-name RaffleStagingStack \
  --query 'Stacks[0].Outputs[?OutputKey==`StagingCloudFrontURL`].OutputValue' \
  --output text
```

## Validation

Run this to verify your environment is configured:

```bash
# Check AWS credentials
aws sts get-caller-identity

# Check required variables are set
echo "Account: $CDK_DEFAULT_ACCOUNT"
echo "Region: $CDK_DEFAULT_REGION"
echo "Certificate: ${CERTIFICATE_ARN:0:50}..."
```
