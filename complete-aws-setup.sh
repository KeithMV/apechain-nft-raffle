#!/bin/bash

# Complete AWS domain purchase and setup
set -e

echo "🚀 Complete AWS Route53 domain setup"
echo ""
echo "📝 Edit contact.json with your details first!"
echo "Then run these commands:"
echo ""
echo "# Buy apechainraffles.com"
echo "aws route53domains register-domain --domain-name apechainraffles.com --duration-in-years 1 --admin-contact file://contact.json --registrant-contact file://contact.json --tech-contact file://contact.json --region us-east-1"
echo ""
echo "# Buy apechainraffles.xyz" 
echo "aws route53domains register-domain --domain-name apechainraffles.xyz --duration-in-years 1 --admin-contact file://contact.json --registrant-contact file://contact.json --tech-contact file://contact.json --region us-east-1"
echo ""
echo "# After domains are registered (5-15 minutes), run:"
echo "bash setup-route53-dns.sh"