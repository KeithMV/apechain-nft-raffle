#!/bin/bash

# Environment Setup Script - Systematic Approach
# Ensures consistent development environment across all machines

echo "🔧 Setting up ApeChain NFT Raffle development environment..."

# Check Node.js version
REQUIRED_NODE_VERSION="20.19.0"
CURRENT_NODE_VERSION=$(node --version | sed 's/v//')

if [ "$CURRENT_NODE_VERSION" != "$REQUIRED_NODE_VERSION" ]; then
    echo "⚠️  Node.js version mismatch!"
    echo "   Required: $REQUIRED_NODE_VERSION"
    echo "   Current:  $CURRENT_NODE_VERSION"
    echo ""
    echo "🔧 To fix this:"
    echo "   1. Install nvm: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
    echo "   2. Restart terminal"
    echo "   3. Run: nvm install $REQUIRED_NODE_VERSION"
    echo "   4. Run: nvm use $REQUIRED_NODE_VERSION"
    echo "   5. Run this script again"
    exit 1
fi

echo "✅ Node.js version correct: $CURRENT_NODE_VERSION"

# Check yarn version
YARN_VERSION=$(yarn --version)
echo "✅ Yarn version: $YARN_VERSION"

# Clean and reinstall dependencies
echo "🧹 Cleaning frontend dependencies..."
cd frontend
rm -rf node_modules yarn.lock
echo "📦 Installing frontend dependencies..."
yarn install

echo "🧹 Cleaning contract dependencies..."
cd ../contracts
rm -rf node_modules yarn.lock
echo "📦 Installing contract dependencies..."
yarn install --legacy-peer-deps

echo "🧹 Cleaning infrastructure dependencies..."
cd ../infrastructure
rm -rf node_modules yarn.lock
echo "📦 Installing infrastructure dependencies..."
yarn install

cd ..

echo ""
echo "✅ Environment setup complete!"
echo ""
echo "🚀 Next steps:"
echo "   1. Test frontend build: cd frontend && yarn build:staging"
echo "   2. Test contract compilation: cd contracts && yarn compile"
echo "   3. Run development server: cd frontend && yarn start:dev"
echo ""