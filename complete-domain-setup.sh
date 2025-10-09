#!/bin/bash

# Complete domain setup after DNS validation
echo "🔄 Completing domain setup..."

# Update CloudFront with custom domain
bash update-cloudfront.sh apechain-raffles.com arn:aws:acm:us-east-1:856872546342:certificate/3259def5-920b-4cf9-99c7-de4e44a56cc3

echo ""
echo "📋 Final DNS Records to Add:"
echo "A Record: apechain-raffles.com → d3mce6qq270l98.cloudfront.net"
echo "CNAME: www.apechain-raffles.com → d3mce6qq270l98.cloudfront.net"
echo ""
echo "✅ Setup complete! Site will be live at: https://apechain-raffles.com"