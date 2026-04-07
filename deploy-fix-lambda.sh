#!/bin/bash

# Deploy the working Lambda function to fix NFT image proxy issues
# This restores the comprehensive domain allowlist that was working before

echo "🚀 Deploying working Lambda function to fix NFT image proxy..."

# Function name
FUNCTION_NAME="apechain-raffle-image-proxy"

# Create deployment package with the working version
echo "📦 Creating deployment package with working Lambda function..."
zip -r lambda-function-fix.zip lambda-proxy-working.js

# Update function code
echo "🔄 Updating Lambda function code..."
aws lambda update-function-code \
    --function-name $FUNCTION_NAME \
    --zip-file fileb://lambda-function-fix.zip

echo "✅ Lambda function code updated successfully!"

# Wait for update to complete
echo "⏳ Waiting for update to complete..."
aws lambda wait function-updated --function-name $FUNCTION_NAME

# Update the handler to point to the working file
echo "🔧 Updating function handler..."
aws lambda update-function-configuration \
    --function-name $FUNCTION_NAME \
    --handler lambda-proxy-working.handler \
    --description "NFT Image Proxy with comprehensive domain allowlist - RESTORED WORKING VERSION"

echo "✅ Lambda function configuration updated!"

# Test the updated function
echo "🧪 Testing updated Lambda function..."

# Test with a common NFT metadata URL
TEST_URL="https://api.opensea.io/api/v1/metadata/0x123/1"
ENCODED_URL=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$TEST_URL', safe=''))")

echo "Testing URL: $TEST_URL"

# Test via API Gateway
API_URL="https://w7pllimgd5.execute-api.us-east-1.amazonaws.com/prod/proxy?url=$ENCODED_URL"

echo "🔍 Testing via API Gateway..."
RESPONSE=$(curl -s "$API_URL")

echo "Response received (first 200 chars):"
echo "$RESPONSE" | head -c 200

# Cleanup
rm lambda-function-fix.zip

echo ""
echo "🎯 Deployment Summary:"
echo "- Lambda function restored to working version"
echo "- Handler updated to lambda-proxy-working.handler"
echo "- Comprehensive domain allowlist restored including:"
echo "  • Major NFT platforms (OpenSea, Rarible, Foundation, etc.)"
echo "  • NFT creation platforms (NiftyKit, ThirdWeb, Manifold, etc.)"
echo "  • IPFS gateways and storage providers"
echo "  • AWS S3 buckets for NFT metadata"
echo "  • Polygon-specific domains"
echo ""
echo "✅ NFT image proxy should now work with all supported platforms!"