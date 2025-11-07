#!/bin/bash

set -euo pipefail

echo "🚀 Deploying ApeCoin NFT Raffle System to ApeChain..."

# Deploy contracts
echo "📦 Step 1: Deploying smart contracts..."
cd contracts || { echo "❌ Failed to change to contracts directory"; exit 1; }
npm install || { echo "❌ npm install failed"; exit 1; }
npx hardhat compile || { echo "❌ Compilation failed"; exit 1; }
npx hardhat run scripts/deploy.js --network apechain || { echo "❌ Deployment failed"; exit 1; }

# Get deployment addresses (you'll need to update these after deployment)
echo "📝 Step 2: Update contract addresses in frontend..."
echo "⚠️  MANUAL STEP REQUIRED:"
echo "   1. Copy the deployed contract addresses from above"
echo "   2. Update frontend/src/config/addresses.ts with the new addresses"
echo "   3. Run: cd ../frontend && npm run build"

# Build frontend
echo "🎨 Step 3: Building frontend..."
cd ../frontend || { echo "❌ Failed to change to frontend directory"; exit 1; }
npm install || { echo "❌ Frontend npm install failed"; exit 1; }
# npm run build  # Uncomment after updating addresses

echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Update contract addresses in frontend/src/config/addresses.ts"
echo "   2. Build frontend: cd frontend && npm run build"
echo "   3. Deploy frontend to your hosting platform"
echo ""
echo "🎉 Your ApeCoin NFT Raffle System is ready!"