# Staging Workflow Guide

## 🎯 Proper Development Flow

```
develop branch → Staging Environment → Testing → main branch → Production
```

## 🌐 Environment URLs

- **Production**: https://d3mce6qq270l98.cloudfront.net (main branch)
- **Staging**: https://d2v74bfsjdq40l.cloudfront.net (develop branch)

## 🔧 Environment Configuration

### Staging (develop branch)
- **Chain**: ApeChain Testnet (33111)
- **RPC**: https://curtis.rpc.caldera.xyz/http
- **Environment**: `REACT_APP_ENV=staging`
- **S3**: `apechain-nft-raffle-staging-856872546342-us-east-1`
- **CloudFront**: `E2OQG8N4GFFTXI`

### Production (main branch)
- **Chain**: ApeChain Mainnet (33139)
- **RPC**: https://apechain.calderachain.xyz/http
- **Environment**: `REACT_APP_ENV=production`
- **S3**: `apechain-nft-raffle-856872546342-us-east-1`
- **CloudFront**: `EH7R5RBQF66DL`

## 🚀 Deployment Methods

### Automatic (GitHub Actions)
- **Staging**: Push to `develop` branch → Auto-deploy to staging
- **Production**: Push to `main` branch → Auto-deploy to production

### Manual (Scripts)
```bash
# Deploy to staging
./scripts/deploy-staging.sh

# Deploy to production  
./scripts/deploy.sh
```

## 📋 Development Workflow

1. **Feature Development**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature
   # Make changes
   git commit -m "✨ Add your feature"
   git push origin feature/your-feature
   ```

2. **Staging Testing**
   ```bash
   git checkout develop
   git merge feature/your-feature
   git push origin develop  # Auto-deploys to staging
   ```

3. **Production Release**
   ```bash
   git checkout main
   git merge develop
   git push origin main  # Auto-deploys to production
   ```

## ✅ Current Status

- ✅ **Staging infrastructure** exists
- ✅ **Production infrastructure** exists  
- ✅ **Environment-driven configuration** implemented
- ✅ **Mobile wallet fixes** merged into staging
- ✅ **Multi-chain architecture** ready
- ✅ **Automated deployment workflows** created

## 🔍 Testing Mobile Wallets

**Staging URL**: https://d2v74bfsjdq40l.cloudfront.net
- Test mobile wallet connections
- Verify environment detection
- Check testnet functionality

**Production URL**: https://d3mce6qq270l98.cloudfront.net  
- Clean production environment
- Mainnet functionality
- No debug components