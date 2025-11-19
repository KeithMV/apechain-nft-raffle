# 🚀 ApeChain NFT Raffles - Complete Setup Guide

## 📋 Prerequisites

### **Required Software**
- Node.js 20+ ([Download](https://nodejs.org/))
- Git ([Download](https://git-scm.com/))
- AWS CLI ([Install Guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html))

### **Required Accounts**
- GitHub account (for repo access)
- AWS account (for deployment)
- Alchemy account (for RPC endpoints)
- WalletConnect account (for Web3Modal)

---

## 🔧 Fresh Setup Instructions

### **1. Clone Repository**
```bash
git clone https://github.com/KeithMV/apechain-nft-raffle.git
cd apechain-nft-raffle
```

### **2. Install Dependencies**
```bash
# Install Yarn globally
npm install -g yarn

# Install frontend dependencies
cd frontend
yarn install

# Install contract dependencies
cd ../contracts
yarn install

# Return to root
cd ..
```

### **3. Environment Configuration**

#### **Frontend Environment (.env)**
```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env`:
```env
REACT_APP_WALLETCONNECT_PROJECT_ID=b848c907908cee0c1bcf0ab0493da6c4
REACT_APP_ALCHEMY_API_KEY=your_alchemy_api_key_here
REACT_APP_APECHAIN_RPC_URL=https://apechain.calderachain.xyz/http
REACT_APP_BACKUP_RPC_URL=https://rpc.apechain.com
REACT_APP_APP_NAME=ApeChain NFT Raffles
REACT_APP_APP_URL=https://d3mce6qq270l98.cloudfront.net
REACT_APP_ENVIRONMENT=development
```

#### **Contracts Environment (.env)**
```bash
cd ../contracts
cp .env.example .env
```

Edit `contracts/.env`:
```env
PRIVATE_KEY=your_wallet_private_key_here
APECHAIN_RPC_URL=https://apechain.calderachain.xyz/http
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

### **4. AWS Configuration**
```bash
aws configure
```
Enter:
- AWS Access Key ID: `your_aws_access_key`
- AWS Secret Access Key: `your_aws_secret_key`
- Default region: `us-east-1`
- Default output format: `json`

### **5. Test Setup**
```bash
# Test frontend
cd frontend
yarn start
# Should open http://localhost:3000

# Test contracts (in new terminal)
cd contracts
yarn test
# Should run contract tests

# Test build
cd ../frontend
yarn build
# Should create build/ directory
```

---

## 🔑 Required API Keys & Credentials

### **Alchemy API Key**
1. Go to [Alchemy Dashboard](https://dashboard.alchemy.com/)
2. Create new app for ApeChain
3. Copy API key to `REACT_APP_ALCHEMY_API_KEY`

### **Wallet Private Key**
1. Export private key from MetaMask/wallet
2. Add to `contracts/.env` as `PRIVATE_KEY`
3. **⚠️ NEVER commit this to git**

### **AWS Credentials**
1. Go to AWS IAM Console
2. Create user with S3 and CloudFront permissions
3. Generate access keys
4. Use in `aws configure`

### **WalletConnect Project ID**
- Current ID: `b848c907908cee0c1bcf0ab0493da6c4`
- Or create new at [WalletConnect Cloud](https://cloud.walletconnect.com/)

---

## 🚀 Development Commands

### **Frontend Development**
```bash
cd frontend
yarn start          # Start dev server
yarn build          # Build for production
yarn test           # Run tests
yarn lint           # Check code quality
```

### **Smart Contracts**
```bash
cd contracts
yarn compile        # Compile contracts
yarn test           # Run tests
yarn deploy         # Deploy to ApeChain
yarn verify         # Verify on explorer
```

### **Deployment**
```bash
# Automatic via CircleCI on git push
git add .
git commit -m "Your changes"
git push origin main

# Manual deployment
cd frontend
yarn build
aws s3 sync build/ s3://apechain-nft-raffle-856872546342-us-east-1 --delete
aws cloudfront create-invalidation --distribution-id EH7R5RBQF66DL --paths "/*"
```

---

## 📁 Project Structure

```
apechain-nft-raffle/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── services/        # Web3 services
│   │   ├── config/          # Configuration
│   │   └── utils/           # Utilities
│   ├── public/              # Static assets
│   └── .env                 # Environment variables
├── contracts/               # Smart contracts
│   ├── contracts/          # Solidity files
│   ├── scripts/            # Deployment scripts
│   ├── test/               # Contract tests
│   └── .env                # Environment variables
├── infrastructure/         # AWS infrastructure
├── white-label-business/   # Business documentation
└── .circleci/             # CI/CD pipeline
```

---

## 🔧 Troubleshooting

### **Common Issues**

#### **"Module not found" errors**
```bash
# Delete node_modules and reinstall
rm -rf node_modules yarn.lock
yarn install
```

#### **"Network error" in frontend**
- Check RPC URLs in `.env`
- Verify Alchemy API key is correct
- Try switching to backup RPC

#### **Contract deployment fails**
- Check private key in `contracts/.env`
- Ensure wallet has APE tokens for gas
- Verify RPC URL is correct

#### **AWS deployment fails**
- Run `aws configure` again
- Check S3 bucket permissions
- Verify CloudFront distribution ID

### **Environment Variables Missing**
If you see configuration errors:
1. Check `.env` files exist in both directories
2. Verify all required variables are set
3. Restart development server after changes

---

## 🎯 Quick Recovery Checklist

If you lose your computer, follow this checklist:

- [ ] Install Node.js 20+, Git, AWS CLI
- [ ] Clone repository
- [ ] Install dependencies (`yarn install` in both directories)
- [ ] Create `.env` files with your API keys
- [ ] Configure AWS credentials
- [ ] Test frontend (`yarn start`)
- [ ] Test contracts (`yarn test`)
- [ ] Verify deployment works

**Total time:** ~30 minutes

---

## 📞 Support Resources

### **Documentation**
- [React Documentation](https://react.dev/)
- [Wagmi Documentation](https://wagmi.sh/)
- [Hardhat Documentation](https://hardhat.org/)
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)

### **Key Files to Reference**
- `STABILIZATION_GUIDE.md` - Development workflow
- `PROJECT-CONFIG.md` - Infrastructure details
- `README.md` - Project overview

### **Emergency Contacts**
- GitHub Issues: Report bugs and issues
- AWS Support: Infrastructure problems
- Alchemy Support: RPC endpoint issues

---

## 🔒 Security Notes

### **Never Commit These Files:**
- `frontend/.env`
- `contracts/.env`
- Private keys
- AWS credentials

### **Keep These Secure:**
- Wallet private keys
- AWS access keys
- API keys
- Environment variables

**Remember:** All sensitive data should be in `.env` files, which are gitignored.