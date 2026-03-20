#!/bin/bash

# Deploy Lambda function with staging endpoint support
# This creates both /prod and /staging endpoints for the same Lambda function

FUNCTION_NAME="apechain-raffle-image-proxy"
REGION="us-east-1"
API_GATEWAY_ID="w7pllimgd5"

echo "🚀 Setting up staging Lambda endpoint..."

# Check if Lambda function exists
if aws lambda get-function --function-name $FUNCTION_NAME --region $REGION >/dev/null 2>&1; then
    echo "✅ Lambda function $FUNCTION_NAME exists"
else
    echo "❌ Lambda function $FUNCTION_NAME not found"
    echo "Please create the Lambda function first"
    exit 1
fi

# Update Lambda function code with the fixed version
echo "📦 Updating Lambda function code..."
zip -j lambda-function-staging.zip lambda-proxy-fixed.js

aws lambda update-function-code \
    --function-name $FUNCTION_NAME \
    --zip-file fileb://lambda-function-staging.zip \
    --region $REGION

if [ $? -eq 0 ]; then
    echo "✅ Lambda function code updated successfully"
else
    echo "❌ Failed to update Lambda function code"
    exit 1
fi

# Set environment variables for staging support
echo "🔧 Setting Lambda environment variables..."
aws lambda update-function-configuration \
    --function-name $FUNCTION_NAME \
    --environment Variables="{ALCHEMY_API_KEY=hCQL99tnvVmLRlDVwJgiH,ENVIRONMENT=multi}" \
    --region $REGION

# Create staging stage in API Gateway (if it doesn't exist)
echo "🌐 Setting up API Gateway staging endpoint..."

# Check if staging stage exists
if aws apigateway get-stage --rest-api-id $API_GATEWAY_ID --stage-name staging --region $REGION >/dev/null 2>&1; then
    echo "✅ Staging stage already exists"
else
    echo "📝 Creating staging stage..."
    aws apigateway create-deployment \
        --rest-api-id $API_GATEWAY_ID \
        --stage-name staging \
        --region $REGION
    
    if [ $? -eq 0 ]; then
        echo "✅ Staging stage created successfully"
    else
        echo "❌ Failed to create staging stage"
        exit 1
    fi
fi

# Test both endpoints
echo "🧪 Testing endpoints..."

echo "Testing production endpoint..."
PROD_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "https://$API_GATEWAY_ID.execute-api.$REGION.amazonaws.com/prod/proxy?url=https://httpbin.org/json")
echo "Production endpoint status: $PROD_RESPONSE"

echo "Testing staging endpoint..."
STAGING_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "https://$API_GATEWAY_ID.execute-api.$REGION.amazonaws.com/staging/proxy?url=https://httpbin.org/json")
echo "Staging endpoint status: $STAGING_RESPONSE"

if [ "$STAGING_RESPONSE" = "200" ]; then
    echo "✅ Staging Lambda endpoint is working!"
    echo "🌐 Staging URL: https://$API_GATEWAY_ID.execute-api.$REGION.amazonaws.com/staging/proxy"
else
    echo "⚠️ Staging endpoint returned status: $STAGING_RESPONSE"
    echo "This may be expected if the endpoint needs additional configuration"
fi

echo "🎉 Lambda staging setup complete!"
echo ""
echo "📋 Summary:"
echo "- Production: https://$API_GATEWAY_ID.execute-api.$REGION.amazonaws.com/prod/proxy"
echo "- Staging: https://$API_GATEWAY_ID.execute-api.$REGION.amazonaws.com/staging/proxy"
echo "- Function: $FUNCTION_NAME updated with latest code"

# Clean up
rm -f lambda-function-staging.zip