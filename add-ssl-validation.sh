#!/bin/bash

set -euo pipefail

# Add SSL validation records for apechain-raffles.com
ZONE_ID="Z0411573M9M1F4CGHKBF"

# Create validation records for apechain-raffles.com
cat > apechain-validation.json << EOF
{
  "Changes": [
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "_2cd267c00260204bdf2fe836ce53ce8e.apechain-raffles.com",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [{"Value": "_0711171f33bbbeb7610886ea3be6a726.xlfgrmvvlj.acm-validations.aws."}]
      }
    },
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "_f7858f76d6e4455b24e28059326d8a7f.www.apechain-raffles.com",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [{"Value": "_9e7f5f1160fe5c515c5dbf127086e4b8.xlfgrmvvlj.acm-validations.aws."}]
      }
    }
  ]
}
EOF

aws route53 change-resource-record-sets --hosted-zone-id "$ZONE_ID" --change-batch file://apechain-validation.json || { echo "❌ Failed to add SSL validation records"; exit 1; }

echo "✅ SSL validation records added for apechain-raffles.com"
echo "⏳ Waiting for SSL validation..."

# Wait for certificate validation
CERT_ARN="arn:aws:acm:us-east-1:856872546342:certificate/687ec056-71ce-47aa-9708-567ae7a7f0f2"

while true; do
    STATUS=$(aws acm describe-certificate --certificate-arn "$CERT_ARN" --region us-east-1 --query 'Certificate.Status' --output text || echo "ERROR")
    
    if [ "$STATUS" = "ERROR" ]; then
        echo "❌ Failed to check certificate status"
        exit 1
    fi
    
    if [ "$STATUS" = "ISSUED" ]; then
        echo "✅ SSL certificate validated!"
        break
    elif [ "$STATUS" = "FAILED" ]; then
        echo "❌ SSL certificate validation failed!"
        exit 1
    else
        echo "Status: $STATUS - waiting..."
        sleep 30
    fi
done

# Update CloudFront with new certificate
echo "🔄 Updating CloudFront with new certificate..."
if ! bash update-domains.sh "$CERT_ARN"; then
    echo "❌ Failed to update CloudFront"
    exit 1
fi

rm -f apechain-validation.json
echo "🎉 All domains now have SSL support!"