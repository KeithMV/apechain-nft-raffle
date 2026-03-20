#!/bin/bash

# Comprehensive Lambda Multi-Environment Deployment Script
# Addresses security issues and environment isolation

set -e

FUNCTION_NAME="apechain-raffle-image-proxy"
REGION="us-east-1"
API_GATEWAY_ID="w7pllimgd5"

echo "🚀 Setting up secure multi-environment Lambda deployment..."

# Validate AWS CLI is configured
if ! aws sts get-caller-identity >/dev/null 2>&1; then
    echo "❌ AWS CLI not configured. Please run 'aws configure'"
    exit 1
fi

# Check if Lambda function exists
if aws lambda get-function --function-name $FUNCTION_NAME --region $REGION >/dev/null 2>&1; then
    echo "✅ Lambda function $FUNCTION_NAME exists"
else
    echo "❌ Lambda function $FUNCTION_NAME not found"
    echo "Creating Lambda function..."
    
    # Create IAM role for Lambda if it doesn't exist
    ROLE_NAME="lambda-image-proxy-role"
    if ! aws iam get-role --role-name $ROLE_NAME >/dev/null 2>&1; then
        echo "📝 Creating IAM role..."
        aws iam create-role \
            --role-name $ROLE_NAME \
            --assume-role-policy-document '{
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "lambda.amazonaws.com"
                        },
                        "Action": "sts:AssumeRole"
                    }
                ]
            }'
        
        aws iam attach-role-policy \
            --role-name $ROLE_NAME \
            --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
        
        echo "⏳ Waiting for IAM role to propagate..."
        sleep 10
    fi
    
    ROLE_ARN=$(aws iam get-role --role-name $ROLE_NAME --query 'Role.Arn' --output text)
    echo "Using IAM role: $ROLE_ARN"
fi

# Update Lambda function with secure code
echo "📦 Updating Lambda function with secure implementation..."
zip -j lambda-function-secure.zip lambda-proxy-secure.js

aws lambda update-function-code \
    --function-name $FUNCTION_NAME \
    --zip-file fileb://lambda-function-secure.zip \
    --region $REGION

if [ $? -eq 0 ]; then
    echo "✅ Lambda function code updated successfully"
else
    echo "❌ Failed to update Lambda function code"
    exit 1
fi

# Set secure environment variables
echo "🔧 Setting secure Lambda environment variables..."
aws lambda update-function-configuration \
    --function-name $FUNCTION_NAME \
    --environment Variables="{ENVIRONMENT=multi,NODE_ENV=production}" \
    --timeout 30 \
    --memory-size 256 \
    --region $REGION

# Get API Gateway information
echo "🌐 Analyzing API Gateway configuration..."
API_INFO=$(aws apigateway get-rest-api --rest-api-id $API_GATEWAY_ID --region $REGION)
API_NAME=$(echo $API_INFO | jq -r '.name')
echo "API Gateway: $API_NAME ($API_GATEWAY_ID)"

# Check existing stages
echo "📋 Checking existing stages..."
STAGES=$(aws apigateway get-stages --rest-api-id $API_GATEWAY_ID --region $REGION)
echo "Existing stages:"
echo $STAGES | jq -r '.item[] | "- \(.stageName): \(.deploymentId)"'

# Create staging deployment if it doesn't exist
if ! echo $STAGES | jq -e '.item[] | select(.stageName == "staging")' >/dev/null; then
    echo "📝 Creating staging stage..."
    
    # First, create a deployment
    DEPLOYMENT_ID=$(aws apigateway create-deployment \
        --rest-api-id $API_GATEWAY_ID \
        --stage-name staging \
        --stage-description "Staging environment for image proxy" \
        --description "Staging deployment $(date)" \
        --region $REGION \
        --query 'id' --output text)
    
    if [ $? -eq 0 ]; then
        echo "✅ Staging stage created with deployment: $DEPLOYMENT_ID"
    else
        echo "❌ Failed to create staging stage"
        exit 1
    fi
else
    echo "✅ Staging stage already exists"
fi

# Update stage settings for better performance and security
echo "⚙️ Configuring stage settings..."

# Configure production stage
aws apigateway update-stage \
    --rest-api-id $API_GATEWAY_ID \
    --stage-name prod \
    --patch-ops op=replace,path=/throttle/rateLimit,value=1000 \
    --patch-ops op=replace,path=/throttle/burstLimit,value=2000 \
    --region $REGION >/dev/null 2>&1

# Configure staging stage
aws apigateway update-stage \
    --rest-api-id $API_GATEWAY_ID \
    --stage-name staging \
    --patch-ops op=replace,path=/throttle/rateLimit,value=100 \
    --patch-ops op=replace,path=/throttle/burstLimit,value=200 \
    --region $REGION >/dev/null 2>&1

echo "✅ Stage throttling configured (prod: 1000/2000, staging: 100/200)"

# Test endpoints with security validation
echo "🧪 Testing endpoints with security validation..."

test_endpoint() {
    local stage=$1
    local url="https://$API_GATEWAY_ID.execute-api.$REGION.amazonaws.com/$stage/proxy"
    
    echo "Testing $stage endpoint..."
    
    # Test 1: Valid HTTPS URL
    echo "  Test 1: Valid HTTPS URL"
    local response1=$(curl -s -o /dev/null -w "%{http_code}" "$url?url=https://httpbin.org/json")
    echo "    Status: $response1"
    
    # Test 2: Invalid HTTP URL (should be blocked)
    echo "  Test 2: HTTP URL (should be blocked)"
    local response2=$(curl -s -o /dev/null -w "%{http_code}" "$url?url=http://httpbin.org/json")
    echo "    Status: $response2 (should be 400)"
    
    # Test 3: Private IP (should be blocked)
    echo "  Test 3: Private IP (should be blocked)"
    local response3=$(curl -s -o /dev/null -w "%{http_code}" "$url?url=https://127.0.0.1/test")
    echo "    Status: $response3 (should be 400)"
    
    # Test 4: AWS metadata service (should be blocked)
    echo "  Test 4: AWS metadata (should be blocked)"
    local response4=$(curl -s -o /dev/null -w "%{http_code}" "$url?url=https://169.254.169.254/latest/meta-data/")
    echo "    Status: $response4 (should be 400)"
    
    if [ "$response1" = "200" ] && [ "$response2" = "400" ] && [ "$response3" = "400" ] && [ "$response4" = "400" ]; then
        echo "  ✅ $stage endpoint security tests passed"
        return 0
    else
        echo "  ⚠️ $stage endpoint security tests failed"
        return 1
    fi
}

# Test both endpoints
test_endpoint "prod"
PROD_RESULT=$?

test_endpoint "staging"
STAGING_RESULT=$?

# Summary
echo ""
echo "🎉 Lambda multi-environment deployment complete!"
echo ""
echo "📋 Summary:"
echo "- Function: $FUNCTION_NAME"
echo "- Region: $REGION"
echo "- Production: https://$API_GATEWAY_ID.execute-api.$REGION.amazonaws.com/prod/proxy"
echo "- Staging: https://$API_GATEWAY_ID.execute-api.$REGION.amazonaws.com/staging/proxy"
echo ""
echo "🔒 Security Features:"
echo "- SSRF protection with URL validation"
echo "- Private IP blocking"
echo "- HTTPS-only enforcement"
echo "- Domain allowlisting"
echo "- Environment-aware CORS"
echo "- Rate limiting (prod: 1000/2000, staging: 100/200)"
echo ""
echo "🧪 Test Results:"
if [ $PROD_RESULT -eq 0 ]; then
    echo "- Production: ✅ All security tests passed"
else
    echo "- Production: ⚠️ Some security tests failed"
fi

if [ $STAGING_RESULT -eq 0 ]; then
    echo "- Staging: ✅ All security tests passed"
else
    echo "- Staging: ⚠️ Some security tests failed"
fi

# Clean up
rm -f lambda-function-secure.zip

echo ""
echo "🔄 Next steps:"
echo "1. Update your frontend to use the new secure endpoints"
echo "2. Monitor CloudWatch logs for any issues"
echo "3. Test with your actual NFT URLs"
echo "4. Consider setting up CloudWatch alarms for error rates"