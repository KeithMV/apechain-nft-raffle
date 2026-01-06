# Development Environment Setup

## Overview
This document outlines the proper development workflow for the ApeChain NFT Raffle platform using Development → Staging → Production environments.

## Environment Structure

### 🔧 Development Environment
- **Purpose**: Local development and testing
- **Network**: Hardhat localhost (Chain ID: 31337)
- **URL**: http://localhost:3000
- **Features**: Hot reload, detailed logging, source maps enabled

### 🧪 Staging Environment  
- **Purpose**: Pre-production testing with testnet
- **Network**: ApeChain Curtis Testnet (Chain ID: 33111)
- **URL**: https://staging.apechainraffles.io
- **Features**: Production-like testing, testnet contracts

### 🚀 Production Environment
- **Purpose**: Live platform with real users and money
- **Network**: ApeChain Mainnet (Chain ID: 33139)
- **URL**: https://apechainraffles.io
- **Features**: Optimized builds, minimal logging

## Quick Start Commands

### Development
```bash
# Start local development
yarn start:dev

# Build for development
yarn build:dev
```

### Staging
```bash
# Start with staging config
yarn start:staging

# Build for staging
yarn build:staging

# Deploy to staging
./scripts/deploy-env.sh staging
```

### Production
```bash
# Build for production
yarn build:production

# Deploy to production (with confirmation)
./scripts/deploy-env.sh production
```

## Environment Files

- `.env.development` - Local development settings
- `.env.staging` - Staging environment settings  
- `.env.production` - Production environment settings

## Workflow Process

1. **Feature Development**
   - Work on `feature/*` branches
   - Test locally with `yarn start:dev`
   - Use Hardhat localhost network

2. **Integration Testing**
   - Merge to `develop` branch
   - Deploy to staging with `./scripts/deploy-env.sh staging`
   - Test on ApeChain testnet

3. **Production Release**
   - Merge `develop` to `main`
   - Deploy to production with `./scripts/deploy-env.sh production`
   - Monitor live platform

## Safety Features

- **Production Confirmation**: Script requires manual confirmation for production deployments
- **Environment Indicators**: App title shows current environment (DEV/STAGING)
- **Logging Control**: Detailed logs in dev/staging, minimal in production
- **Source Maps**: Enabled in development, disabled in staging/production

## Contract Addresses

Update these in the respective `.env` files:

- **Development**: `0x5FbDB2315678afecb367f032d93F642f64180aa3` (Hardhat default)
- **Staging**: Deploy test contracts to Curtis testnet
- **Production**: Your live mainnet contract addresses

## Best Practices

1. **Never deploy directly to production** - Always test in staging first
2. **Use environment-specific contracts** - Don't mix testnet and mainnet
3. **Monitor after deployment** - Check for errors and user feedback
4. **Keep staging updated** - Should mirror production as closely as possible

## Troubleshooting

### Environment Not Loading
Check that the correct `.env` file exists and `REACT_APP_ENV` is set properly.

### Wrong Network
Verify the `REACT_APP_CHAIN_ID` matches your target network.

### Contract Issues
Ensure contract addresses are correct for each environment.

## Next Steps

1. Set up staging domain: `staging.apechainraffles.io`
2. Deploy test contracts to Curtis testnet
3. Configure CI/CD pipeline for automatic deployments
4. Set up monitoring and alerts for production