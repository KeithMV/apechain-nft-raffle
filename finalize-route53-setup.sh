#!/bin/bash

echo "🔄 Finalizing Route53 setup for apechain-raffles.com..."

# Check registration status
STATUS=$(aws route53domains get-operation-detail --operation-id 28dfc473-20ba-4cc5-b5d7-6418d76452d6 --query 'Status' --output text)

if [ "$STATUS" != "SUCCESSFUL" ]; then
    echo "⏳ Domain registration still in progress. Status: $STATUS"
    echo "Run this script again in 5-10 minutes."
    exit 1
fi

echo "✅ Domain registration complete!"

# Get hosted zone ID
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones-by-name --dns-name apechain-raffles.com --query 'HostedZones[0].Id' --output text | cut -d'/' -f3)

echo "📋 Hosted Zone ID: $HOSTED_ZONE_ID"

# Add SSL validation records to Route53
echo "🔐 Adding SSL validation records..."

aws route53 change-resource-record-sets --hosted-zone-id $HOSTED_ZONE_ID --change-batch '{
  "Changes": [
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "_2cd267c00260204bdf2fe836ce53ce8e.apechain-raffles.com",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [{"Value": "_0711171f33bbbeb7610886ea3be6a726.xlfgrmvvlj.acm-validations.aws"}]
      }
    },
    {
      "Action": "CREATE", 
      "ResourceRecordSet": {
        "Name": "_f7858f76d6e4455b24e28059326d8a7f.www.apechain-raffles.com",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [{"Value": "_9e7f5f1160fe5c515c5dbf127086e4b8.xlfgrmvvlj.acm-validations.aws"}]
      }
    }
  ]
}'

echo "✅ SSL validation records added!"
echo "⏳ Waiting for SSL certificate validation (5-30 minutes)..."
echo ""
echo "Run this when SSL is validated:"
echo "bash complete-domain-setup.sh"