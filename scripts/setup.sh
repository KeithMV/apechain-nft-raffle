#!/bin/bash

# ApeChain NFT Raffles - Automated Setup Script
# Run this after cloning the repository

set -e  # Exit on any error

echo "🚀 Setting up ApeChain NFT Raffles..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 20+ first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please install Node.js 18+ or 20+."
    exit 1
fi

echo "✅ Node.js $(node -v) found"

# Install Yarn if not present
if ! command -v yarn &> /dev/null; then
    echo "📦 Installing Yarn..."
    npm install -g yarn
fi

echo "✅ Yarn $(yarn -v) found"

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
if [ ! -f "package.json" ]; then
    echo "❌ frontend/package.json not found. Are you in the right directory?"
    exit 1
fi
yarn install

# Install contract dependencies
echo "📦 Installing contract dependencies..."
cd ../contracts
if [ ! -f "package.json" ]; then
    echo "❌ contracts/package.json not found. Are you in the right directory?"
    exit 1
fi
yarn install

# Return to root
cd ..

# Create environment files if they don't exist
echo "⚙️  Setting up environment files..."

# Frontend .env
if [ ! -f "frontend/.env" ]; then
    if [ -f "frontend/.env.example" ]; then
        cp frontend/.env.example frontend/.env
        echo "✅ Created frontend/.env from .env.example"
    else
        cat > frontend/.env << EOF
REACT_APP_WALLETCONNECT_PROJECT_ID=b848c907908cee0c1bcf0ab0493da6c4
REACT_APP_ALCHEMY_API_KEY=your_alchemy_api_key_here
REACT_APP_APECHAIN_RPC_URL=https://apechain.calderachain.xyz/http
REACT_APP_BACKUP_RPC_URL=https://rpc.apechain.com
REACT_APP_APP_NAME=ApeChain NFT Raffles
REACT_APP_APP_URL=https://d3mce6qq270l98.cloudfront.net
REACT_APP_ENVIRONMENT=development
EOF
        echo "✅ Created frontend/.env with default values"
    fi
else
    echo "✅ frontend/.env already exists"
fi

# Contracts .env
if [ ! -f "contracts/.env" ]; then
    if [ -f "contracts/.env.example" ]; then
        cp contracts/.env.example contracts/.env
        echo "✅ Created contracts/.env from .env.example"
    else
        cat > contracts/.env << EOF
PRIVATE_KEY=your_wallet_private_key_here
APECHAIN_RPC_URL=https://apechain.calderachain.xyz/http
ETHERSCAN_API_KEY=your_etherscan_api_key_here
EOF
        echo "✅ Created contracts/.env with default values"
    fi
else
    echo "✅ contracts/.env already exists"
fi

# Test frontend build
echo "🧪 Testing frontend build..."
cd frontend
if yarn build > /dev/null 2>&1; then
    echo "✅ Frontend builds successfully"
else
    echo "⚠️  Frontend build failed - check your .env configuration"
fi

# Test contracts compilation
echo "🧪 Testing contract compilation..."
cd ../contracts
if yarn compile > /dev/null 2>&1; then
    echo "✅ Contracts compile successfully"
else
    echo "⚠️  Contract compilation failed - check your setup"
fi

cd ..

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Edit frontend/.env with your API keys"
echo "2. Edit contracts/.env with your wallet private key"
echo "3. Configure AWS credentials: aws configure"
echo "4. Start development: cd frontend && yarn start"
echo ""
echo "📚 See SETUP.md for detailed instructions"
echo "🔧 See STABILIZATION_GUIDE.md for development workflow"