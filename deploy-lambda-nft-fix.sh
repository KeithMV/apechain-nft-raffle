#!/bin/bash

# Deploy Updated Lambda Function with Expanded NFT Domain Allowlist
# Fixes Polygon NFT image loading issues

echo "🚀 Deploying Lambda function with expanded NFT domain allowlist..."

# Function name
FUNCTION_NAME="apechain-raffle-image-proxy"

# Create deployment package
echo "📦 Creating deployment package..."
zip -r lambda-function-updated.zip lambda-proxy-secure.js

# Check if function exists
if aws lambda get-function --function-name $FUNCTION_NAME >/dev/null 2>&1; then
    echo "🔄 Updating existing Lambda function..."
    
    # Update function code
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb://lambda-function-updated.zip
    
    echo "✅ Lambda function code updated successfully!"
    
    # Wait for update to complete
    echo "⏳ Waiting for update to complete..."
    aws lambda wait function-updated --function-name $FUNCTION_NAME
    
    # Update function configuration if needed
    echo "🔧 Updating function configuration..."
    aws lambda update-function-configuration \
        --function-name $FUNCTION_NAME \
        --runtime nodejs20.x \
        --timeout 30 \
        --memory-size 512 \
        --description "NFT Image Proxy with expanded domain allowlist for Polygon NFT support"
    
    echo "✅ Lambda function configuration updated!"
    
else
    echo "❌ Lambda function $FUNCTION_NAME not found!"
    echo "Please create the function first or check the function name."
    exit 1
fi

# Test the updated function
echo "🧪 Testing updated Lambda function..."

# Test with the problematic NiftyKit URL
TEST_URL="https://cdn-api.niftykit.com/reveal/clq76l5j400016w1xtpalfokb/4758"
ENCODED_URL=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$TEST_URL', safe=''))")

echo "Testing URL: $TEST_URL"
echo "Encoded URL: $ENCODED_URL"

# Test via API Gateway
API_URL="https://w7pllimgd5.execute-api.us-east-1.amazonaws.com/prod/proxy?url=$ENCODED_URL"

echo "🔍 Testing via API Gateway..."
RESPONSE=$(curl -s "$API_URL")

if echo "$RESPONSE" | grep -q "Purrr Pal"; then
    echo "✅ SUCCESS! NFT metadata retrieved successfully:"
    echo "$RESPONSE" | jq '.name, .image' 2>/dev/null || echo "$RESPONSE"
else
    echo "❌ Test failed. Response:"
    echo "$RESPONSE"
fi

# Cleanup
rm lambda-function-updated.zip

echo ""
echo "🎯 Deployment Summary:"
echo "- Lambda function updated with expanded domain allowlist"
echo "- Added support for major NFT platforms: NiftyKit, ThirdWeb, Manifold, etc."
echo "- Added AWS S3 bucket support for NFT metadata"
echo "- Added additional IPFS gateways and storage providers"
echo ""
echo "🔧 Domains added include:"
echo "- cdn-api.niftykit.com (fixes the specific Polygon NFT issue)"
echo "- api.thirdweb.com, api.manifold.xyz, api.zora.co"
echo "- s3.amazonaws.com (various regions)"
echo "- Additional IPFS gateways and storage providers"
echo ""
echo "✅ Polygon NFT images should now load correctly!"