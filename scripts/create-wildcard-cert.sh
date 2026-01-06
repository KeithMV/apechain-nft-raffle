#!/bin/bash

# Create Wildcard SSL Certificate for apechainraffles.io
set -e

echo "🔐 Creating wildcard SSL certificate for *.apechainraffles.io..."

# Request wildcard certificate
CERT_ARN=$(aws acm request-certificate \
  --domain-name "apechainraffles.io" \
  --subject-alternative-names "*.apechainraffles.io" \
  --validation-method DNS \
  --region us-east-1 \
  --query 'CertificateArn' \
  --output text)

echo "📋 Certificate ARN: $CERT_ARN"

# Wait a moment for certificate to be created
sleep 5

# Get DNS validation records
echo "🔍 Getting DNS validation records..."
aws acm describe-certificate \
  --certificate-arn "$CERT_ARN" \
  --region us-east-1 \
  --query 'Certificate.DomainValidationOptions[*].{Domain:DomainName,Name:ResourceRecord.Name,Value:ResourceRecord.Value,Type:ResourceRecord.Type}' \
  --output table

echo ""
echo "📝 NEXT STEPS:"
echo "1. Add the DNS validation records to Route53"
echo "2. Wait for certificate validation (5-10 minutes)"
echo "3. Update staging stack with new certificate ARN:"
echo "   $CERT_ARN"
echo ""
echo "🔗 Check certificate status:"
echo "   aws acm describe-certificate --certificate-arn $CERT_ARN --region us-east-1 --query 'Certificate.Status'"