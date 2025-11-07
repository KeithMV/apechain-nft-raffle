#!/bin/bash

set -euo pipefail

# Monitor domain registration and auto-setup DNS

echo "⏳ Monitoring domain registration..."

while true; do
    COM_STATUS=$(aws route53domains get-operation-detail --operation-id 1499f72e-2afe-4114-a09e-1abeb6bf81fa --region us-east-1 --query 'Status' --output text || echo "ERROR")
    XYZ_STATUS=$(aws route53domains get-operation-detail --operation-id 0c8e0010-e70a-464b-abda-53f13837420b --region us-east-1 --query 'Status' --output text || echo "ERROR")
    
    if [ "$COM_STATUS" = "ERROR" ] || [ "$XYZ_STATUS" = "ERROR" ]; then
        echo "❌ Failed to check domain status"
        exit 1
    fi
    
    echo "Status: apechainraffles.com=$COM_STATUS, apechainraffles.xyz=$XYZ_STATUS"
    
    if [ "$COM_STATUS" = "SUCCESSFUL" ] && [ "$XYZ_STATUS" = "SUCCESSFUL" ]; then
        echo "✅ Both domains registered successfully!"
        echo "🚀 Starting DNS setup..."
        if ! bash setup-route53-dns.sh; then
            echo "❌ DNS setup failed"
            exit 1
        fi
        break
    elif [ "$COM_STATUS" = "FAILED" ] || [ "$XYZ_STATUS" = "FAILED" ]; then
        echo "❌ Domain registration failed!"
        exit 1
    fi
    
    sleep 30
done