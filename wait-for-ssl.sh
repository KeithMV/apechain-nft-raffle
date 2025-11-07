#!/bin/bash

set -euo pipefail

# Wait for SSL certificate validation and complete setup
CERT_ARN="arn:aws:acm:us-east-1:856872546342:certificate/2635f7bd-91b5-4b6d-a1ae-74f9607d7981"

echo "⏳ Waiting for SSL certificate validation..."

while true; do
    STATUS=$(aws acm describe-certificate --certificate-arn "$CERT_ARN" --region us-east-1 --query 'Certificate.Status' --output text || echo "ERROR")
    
    if [ "$STATUS" = "ERROR" ]; then
        echo "❌ Failed to check certificate status"
        exit 1
    fi
    
    if [ "$STATUS" = "ISSUED" ]; then
        echo "✅ SSL certificate validated and issued!"
        break
    elif [ "$STATUS" = "FAILED" ]; then
        echo "❌ SSL certificate validation failed!"
        exit 1
    else
        echo "Status: $STATUS - waiting..."
        sleep 60
    fi
done

echo "🔄 Updating CloudFront with validated certificate..."
if ! bash update-domains.sh "$CERT_ARN"; then
    echo "❌ Failed to update CloudFront"
    exit 1
fi

echo "🌐 Adding final DNS records..."

# Get hosted zone IDs
COM_ZONE=$(aws route53 list-hosted-zones --query "HostedZones[?Name=='apechainraffles.com.'].Id" --output text | cut -d'/' -f3)
XYZ_ZONE=$(aws route53 list-hosted-zones --query "HostedZones[?Name=='apechainraffles.xyz.'].Id" --output text | cut -d'/' -f3)

if [ -z "$COM_ZONE" ] || [ -z "$XYZ_ZONE" ]; then
    echo "❌ Failed to get hosted zone IDs"
    exit 1
fi

# Add final DNS records
cat > com-final.json << EOF
{
  "Changes": [
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "apechainraffles.com",
        "Type": "A",
        "AliasTarget": {
          "DNSName": "d3mce6qq270l98.cloudfront.net",
          "EvaluateTargetHealth": false,
          "HostedZoneId": "Z2FDTNDATAQYW2"
        }
      }
    },
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "www.apechainraffles.com", 
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [{"Value": "d3mce6qq270l98.cloudfront.net"}]
      }
    }
  ]
}
EOF

cat > xyz-final.json << EOF
{
  "Changes": [
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "apechainraffles.xyz",
        "Type": "A", 
        "AliasTarget": {
          "DNSName": "d3mce6qq270l98.cloudfront.net",
          "EvaluateTargetHealth": false,
          "HostedZoneId": "Z2FDTNDATAQYW2"
        }
      }
    },
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "www.apechainraffles.xyz",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [{"Value": "d3mce6qq270l98.cloudfront.net"}]
      }
    }
  ]
}
EOF

aws route53 change-resource-record-sets --hosted-zone-id $COM_ZONE --change-batch file://com-final.json
aws route53 change-resource-record-sets --hosted-zone-id $XYZ_ZONE --change-batch file://xyz-final.json

echo "🎉 Setup complete! Your domains are live:"
echo "https://apechainraffles.com"
echo "https://apechainraffles.xyz"
echo "https://www.apechainraffles.com"  
echo "https://www.apechainraffles.xyz"

# Cleanup
rm -f com-final.json xyz-final.json