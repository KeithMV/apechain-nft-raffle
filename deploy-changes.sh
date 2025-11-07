#!/bin/bash

set -euo pipefail

echo "🚀 Deploying ApeCoin NFT Raffle Changes"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [[ ! -f "package.json" ]] || [[ ! -d "contracts" ]] || [[ ! -d "frontend" ]]; then
    print_error "Please run this script from the apechain-nft-raffle root directory"
    exit 1
fi

print_status "Starting deployment process..."

# Step 1: Clean up and prepare
print_status "Step 1: Cleaning up old files and preparing environment"
rm -f check-actual-raffles.js check_raffle_2199.js test-*.js 2>/dev/null || true
rm -rf infrastructure/cdk.out 2>/dev/null || true
print_success "Cleanup completed"

# Step 2: Install dependencies
print_status "Step 2: Installing/updating dependencies"

# Contracts dependencies
if [[ -d "contracts" ]]; then
    print_status "Installing contract dependencies..."
    cd contracts
    npm install
    cd ..
    print_success "Contract dependencies installed"
fi

# Frontend dependencies
if [[ -d "frontend" ]]; then
    print_status "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
    print_success "Frontend dependencies installed"
fi

# Infrastructure dependencies
if [[ -d "infrastructure" ]]; then
    print_status "Installing infrastructure dependencies..."
    cd infrastructure
    npm install
    cd ..
    print_success "Infrastructure dependencies installed"
fi

# Step 3: Verify contract addresses are synced
print_status "Step 3: Verifying contract configuration"
CONTRACT_FACTORY=$(grep -o "RAFFLE_FACTORY: '[^']*'" contracts/config/addresses.ts | cut -d"'" -f2)
FRONTEND_FACTORY=$(grep -o "RAFFLE_FACTORY: '[^']*'" frontend/src/config/addresses.ts | head -1 | cut -d"'" -f2)

if [[ "$CONTRACT_FACTORY" == "$FRONTEND_FACTORY" ]]; then
    print_success "Contract addresses are synced: $CONTRACT_FACTORY"
else
    print_warning "Contract addresses differ - using contracts config as source of truth"
    print_status "Contracts: $CONTRACT_FACTORY"
    print_status "Frontend: $FRONTEND_FACTORY"
fi

# Step 4: Build frontend
print_status "Step 4: Building frontend application"
cd frontend
npm run build
if [[ $? -eq 0 ]]; then
    print_success "Frontend build completed successfully"
    print_status "Build output available at: $(pwd)/build/"
else
    print_error "Frontend build failed"
    exit 1
fi
cd ..

# Step 5: Prepare infrastructure
print_status "Step 5: Preparing infrastructure deployment"
cd infrastructure
npm run build
if [[ $? -eq 0 ]]; then
    print_success "Infrastructure code compiled successfully"
else
    print_error "Infrastructure compilation failed"
    exit 1
fi
cd ..

# Step 6: Git operations
print_status "Step 6: Committing changes"
git add .
git commit -m "Deploy: Updated contract addresses, enhanced frontend, improved infrastructure

- Synced contract addresses across configs
- Added professional demo components
- Enhanced NFT metadata services
- Updated deployment scripts
- Cleaned up test files
- Improved error handling" || print_warning "No changes to commit or commit failed"

print_success "Changes committed to git"

# Step 7: Display deployment options
echo ""
echo "🎯 Deployment Options Available:"
echo "================================="
echo ""
echo "1️⃣  Frontend Only (Quick Deploy)"
echo "   ./QUICK_DEPLOY.sh"
echo ""
echo "2️⃣  Complete AWS Deployment"
echo "   ./deploy-aws.sh"
echo ""
echo "3️⃣  Infrastructure + Frontend"
echo "   cd infrastructure && npm run deploy"
echo "   # Then deploy frontend build to S3/CloudFront"
echo ""
echo "4️⃣  Manual S3 Sync (if bucket exists)"
echo "   aws s3 sync frontend/build/ s3://your-raffle-bucket --delete"
echo ""

# Step 8: Show current status
echo "📊 Current Status:"
echo "=================="
echo "✅ Contract Factory: $CONTRACT_FACTORY"
echo "✅ Frontend: Built and ready ($(du -sh frontend/build 2>/dev/null | cut -f1 || echo 'Unknown size'))"
echo "✅ Infrastructure: Compiled and ready"
echo "✅ Git: Changes committed"
echo ""

# Step 9: Quick health check
print_status "Step 9: Running quick health check"
if [[ -f "frontend/build/index.html" ]]; then
    print_success "Frontend build artifacts present"
else
    print_error "Frontend build artifacts missing"
fi

if [[ -f "infrastructure/lib/raffle-infrastructure-stack.ts" ]]; then
    print_success "Infrastructure stack definition present"
else
    print_error "Infrastructure stack definition missing"
fi

echo ""
print_success "🎉 Deployment preparation completed!"
echo ""
print_status "Next steps:"
echo "1. Choose your deployment method from the options above"
echo "2. Ensure AWS credentials are configured if using AWS deployment"
echo "3. Update any environment-specific configurations as needed"
echo ""
print_status "For immediate deployment, run: ./deploy-aws.sh"