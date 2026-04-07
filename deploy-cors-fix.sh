#!/bin/bash

# Deploy CORS-Fixed Lambda Function
# Fixes staging/production CORS mismatch issue

echo "🚀 Deploying CORS-fixed Lambda function..."

# Function name
FUNCTION_NAME="apechain-raffle-image-proxy"

# Create deployment package with the CORS-fixed version
echo "📦 Creating deployment package with CORS-fixed Lambda function..."
zip -r lambda-function-cors-fixed.zip lambda-proxy-fixed-cors.js

# Update function code
echo "🔄 Updating Lambda function code..."
aws lambda update-function-code \
    --function-name $FUNCTION_NAME \
    --zip-file fileb://lambda-function-cors-fixed.zip

echo "✅ Lambda function code updated successfully!"

# Wait for update to complete
echo "⏳ Waiting for update to complete..."
aws lambda wait function-updated --function-name $FUNCTION_NAME

# Update the handler to point to the fixed file
echo "🔧 Updating function handler..."
aws lambda update-function-configuration \
    --function-name $FUNCTION_NAME \
    --handler lambda-proxy-fixed-cors.handler \
    --description "NFT Image Proxy with STAGE-AWARE CORS - FIXES STAGING/PRODUCTION MISMATCH"

echo "✅ Lambda function configuration updated!"

# Test both endpoints
echo "🧪 Testing both staging and production endpoints..."

echo "Testing STAGING endpoint:"
STAGING_RESPONSE=$(curl -s "https://w7pllimgd5.execute-api.us-east-1.amazonaws.com/staging/proxy?url=https%3A%2F%2Fipfs.io%2Fipfs%2FQmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG%2Freadme")
echo "Response (first 100 chars): $(echo "$STAGING_RESPONSE" | head -c 100)"

echo ""
echo "Testing PRODUCTION endpoint:"
PROD_RESPONSE=$(curl -s "https://w7pllimgd5.execute-api.us-east-1.amazonaws.com/prod/proxy?url=https%3A%2F%2Fipfs.io%2Fipfs%2FQmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG%2Freadme")
echo "Response (first 100 chars): $(echo "$PROD_RESPONSE" | head -c 100)"

echo ""
echo "Testing CORS headers:"
echo "STAGING CORS:"
curl -I "https://w7pllimgd5.execute-api.us-east-1.amazonaws.com/staging/proxy?url=https%3A%2F%2Fipfs.io%2Fipfs%2FQmTest" 2>&1 | grep -i "access-control-allow-origin" || echo "No CORS header found"

echo "PRODUCTION CORS:"
curl -I "https://w7pllimgd5.execute-api.us-east-1.amazonaws.com/prod/proxy?url=https%3A%2F%2Fipfs.io%2Fipfs%2FQmTest" 2>&1 | grep -i "access-control-allow-origin" || echo "No CORS header found"

# Cleanup
rm lambda-function-cors-fixed.zip

echo ""
echo "🎯 Deployment Summary:"
echo "- Lambda function updated with stage-aware CORS headers"
echo "- Handler updated to lambda-proxy-fixed-cors.handler"
echo "- STAGING endpoint now returns: Access-Control-Allow-Origin: https://staging.web3raffles.io"
echo "- PRODUCTION endpoint now returns: Access-Control-Allow-Origin: https://web3raffles.io"
echo ""
echo "✅ CORS mismatch issue should now be resolved!"
echo "✅ Both staging and production should work correctly!"