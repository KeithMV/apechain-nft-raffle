# ApeChain NFT Raffle - AWS Resources Reference

## 🎯 **Active AWS Resources**

### **CloudFormation Stack**
- **Name**: `RaffleInfrastructureStack`
- **Status**: CREATE_COMPLETE
- **Created**: 2025-09-29 14:34:28 UTC-0700

### **S3 Bucket (Static Website Hosting)**
- **Name**: `apechain-nft-raffle-856872546342-us-east-1`
- **Region**: us-east-1
- **Purpose**: Hosts React frontend files
- **Access**: Private (via CloudFront only)

### **CloudFront Distribution (CDN)**
- **ID**: `EH7R5RBQF66DL`
- **URL**: https://d3mce6qq270l98.cloudfront.net
- **Purpose**: Global content delivery
- **Origin**: S3 bucket above

## 🔄 **Deployment Commands**

### **Update Frontend**
```bash
# Build React app
cd frontend
npm run build

# Deploy to S3
aws s3 sync build/ s3://apechain-nft-raffle-856872546342-us-east-1/ --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id EH7R5RBQF66DL --paths "/*"
```

### **Check Status**
```bash
# Check S3 bucket
aws s3 ls s3://apechain-nft-raffle-856872546342-us-east-1/

# Check CloudFront distribution
aws cloudfront get-distribution --id EH7R5RBQF66DL

# Check stack status
aws cloudformation describe-stacks --stack-name RaffleInfrastructureStack
```

## 💰 **Cost Estimate**
- **S3 Storage**: ~$1-2/month
- **CloudFront**: ~$1-3/month  
- **Total**: ~$5/month maximum

## 🚫 **What We DON'T Use**
- ❌ EC2 instances
- ❌ RDS databases
- ❌ Lambda functions
- ❌ API Gateway
- ❌ Load Balancers
- ❌ ECS/EKS containers

## 🏗️ **Architecture**
```
Users → CloudFront CDN → S3 Bucket → React App → ApeChain Blockchain
```

## 📝 **Notes**
- Pure Web3 architecture - blockchain handles backend logic
- No traditional servers or databases needed
- Static hosting only - all dynamic data from blockchain
- Global CDN for fast loading worldwide

---
**Last Updated**: 2025-09-30
**Live URL**: https://d3mce6qq270l98.cloudfront.net