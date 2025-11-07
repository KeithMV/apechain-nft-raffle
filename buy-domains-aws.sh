#!/bin/bash

# Buy domains through AWS Route53
set -e

echo "🛒 Buying domains through AWS Route53..."

# Check domain availability
echo "📋 Checking domain availability..."
aws route53domains check-domain-availability --domain-name apechainraffles.com --region us-east-1
aws route53domains check-domain-availability --domain-name apechainraffles.xyz --region us-east-1

echo ""
echo "💰 Estimated costs:"
echo "apechainraffles.com: ~$12/year"
echo "apechainraffles.xyz: ~$12/year"
echo "Total: ~$24/year"
echo ""
echo "🚀 To purchase, run:"
echo "aws route53domains register-domain --domain-name apechainraffles.com --duration-in-years 1 --admin-contact file://contact.json --registrant-contact file://contact.json --tech-contact file://contact.json --region us-east-1"
echo ""
echo "📝 First create contact.json with your details"