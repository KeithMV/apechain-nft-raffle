#!/bin/bash

# Script to set Alchemy API key as Lambda environment variable
# This keeps the API key secure on the server side

FUNCTION_NAME="apechain-raffle-image-proxy"
ALCHEMY_API_KEY="hCQL99tnvVmLRlDVwJgiH"

echo "Setting Alchemy API key as Lambda environment variable..."

aws lambda update-function-configuration \
  --function-name $FUNCTION_NAME \
  --environment Variables="{ALCHEMY_API_KEY=$ALCHEMY_API_KEY}" \
  --region us-east-1

if [ $? -eq 0 ]; then
    echo "✅ Successfully set ALCHEMY_API_KEY environment variable for Lambda function"
    echo "🔒 API key is now secure on the server side"
else
    echo "❌ Failed to set environment variable. Check AWS CLI configuration."
fi