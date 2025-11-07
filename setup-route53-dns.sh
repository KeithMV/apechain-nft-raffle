#!/bin/bash

# Setup Route53 DNS after domain purchase
set -e

echo "🌐 Setting up Route53 DNS for purchased domains..."

# Get hosted zone IDs
COM_ZONE=$(aws route53 list-hosted-zones --query 'HostedZones[?Name==`apechainraffles.com.`].Id' --output text | cut -d'/' -f3)
XYZ_ZONE=$(aws route53 list-hosted-zones --query 'HostedZones[?Name==`apechainraffles.xyz.`].Id' --output text | cut -d'/' -f3)

echo "📋 Found hosted zones:"
echo "apechainraffles.com: $COM_ZONE"
echo "apechainraffles.xyz: $XYZ_ZONE"

# Add SSL validation records automatically
echo "🔐 Adding SSL validation records..."

# Create change batch for .com domain
cat > com-validation.json << EOF
{
  "Changes": [
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "_b285b31925e0d25cada7687ffeb70958.apechainraffles.com",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [{"Value": "_6f0a45ca28a1436a78b737f563a08d98.jkddzztszm.acm-validations.aws."}]
      }
    },
    {
      "Action": "CREATE", 
      "ResourceRecordSet": {
        "Name": "_07eeab0b5c1ba99cadcc6205d6bacd11.www.apechainraffles.com",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [{"Value": "_fda1194fcbbef3ba1e0e150b2f1821e6.jkddzztszm.acm-validations.aws."}]
      }
    }
  ]
}
EOF

# Create change batch for .xyz domain
cat > xyz-validation.json << EOF
{
  "Changes": [
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "_e89394f14924b6cd2ffd5961a4d93f49.apechainraffles.xyz",
        "Type": "CNAME", 
        "TTL": 300,
        "ResourceRecords": [{"Value": "_f0f804063efc8d306ee351b7d07d778d.jkddzztszm.acm-validations.aws."}]
      }
    },
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "_34c8e79ff496f6121d9b0eb5f32f299f.www.apechainraffles.xyz",
        "Type": "CNAME",
        "TTL": 300, 
        "ResourceRecords": [{"Value": "_376f0e73d00662a5c1ea3ef9969ec76a.jkddzztszm.acm-validations.aws."}]
      }
    }
  ]
}
EOF

# Apply DNS changes
aws route53 change-resource-record-sets --hosted-zone-id $COM_ZONE --change-batch file://com-validation.json
aws route53 change-resource-record-sets --hosted-zone-id $XYZ_ZONE --change-batch file://xyz-validation.json

echo "✅ SSL validation records added!"
echo "⏳ Waiting 5 minutes for SSL validation..."
sleep 300

# Update CloudFront
bash update-domains.sh arn:aws:acm:us-east-1:856872546342:certificate/2635f7bd-91b5-4b6d-a1ae-74f9607d7981

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

echo "🎉 Complete! Your domains are live:"
echo "https://apechainraffles.com"
echo "https://apechainraffles.xyz"

# Cleanup
rm -f com-validation.json xyz-validation.json com-final.json xyz-final.json