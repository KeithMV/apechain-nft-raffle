#!/bin/bash

# Deployment Script for ApeChain NFT Raffle Platform
# Usage: ./deploy.sh [development|staging|production]

set -e

ENVIRONMENT=${1:-production}
PROJECT_ROOT="/Users/keith/apechain-nft-raffle"

echo "🚀 Deploying to $ENVIRONMENT environment..."

case $ENVIRONMENT in
  "development")
    echo "📦 Building for development..."
    cd "$PROJECT_ROOT/frontend"
    yarn build:dev
    echo "✅ Development build complete"
    echo "💡 Run 'yarn start:dev' to test locally"
    ;;
    
  "staging")
    echo "📦 Building for staging..."
    cd "$PROJECT_ROOT/frontend"
    yarn build:staging
    echo "✅ Staging build complete"
    echo "🌐 Deploy to staging.apechainraffles.io"
    ;;
    
  "production")
    echo "⚠️  PRODUCTION DEPLOYMENT"
    echo "Are you sure? This will affect live users. (y/N)"
    read -r confirmation
    if [[ $confirmation != [yY] ]]; then
      echo "❌ Deployment cancelled"
      exit 1
    fi
    
    echo "📦 Building for production..."
    cd "$PROJECT_ROOT/frontend"
    yarn build:production
    echo "✅ Production build complete"
    echo "🌐 Deploy to apechainraffles.io"
    ;;
    
  *)
    echo "❌ Invalid environment: $ENVIRONMENT"
    echo "Usage: ./deploy.sh [development|staging|production]"
    exit 1
    ;;
esac

echo "🎉 Deployment preparation complete for $ENVIRONMENT!"