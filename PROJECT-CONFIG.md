# APEChain NFT Raffle - Project Configuration Reference

## ✅ CORRECT PROJECT SETTINGS

### AWS Infrastructure
- **S3 Bucket**: `apechain-nft-raffle-856872546342-us-east-1`
- **AWS Account**: `856872546342`
- **Region**: `us-east-1`

### Smart Contracts
- **Current Contract**: `0xf5cD6d3F118a3C31742DfFB50BFbFE452F5300D0` (v3-secure)
- **Legacy Contract**: `0x05139110Db8FF9cF82A836Af95eff4530011c705` (v2-legacy)
- **Template Contract**: `0xF038C04c3384419B91094Fbc21437E96c8fC1e59`

### Network Configuration
- **Primary Network**: ApeChain (33139)
- **RPC URL**: `https://apechain.calderachain.xyz/http`
- **Explorer**: `https://apescan.io`

### CloudFront CDN
- **Distribution ID**: `EH7R5RBQF66DL`
- **Domain**: `d3mce6qq270l98.cloudfront.net`
- **Status**: Deployed

### CircleCI Environment Variables Needed
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_DEFAULT_REGION` = `us-east-1`
- `CLOUDFRONT_DISTRIBUTION_ID` = `EH7R5RBQF66DL`

## ❌ THINGS TO AVOID
- Don't create new S3 buckets
- Don't use the legacy contract address in frontend
- Don't change the bucket name in CircleCI config

## 🚀 Deployment Target
Frontend deploys to: `s3://apechain-nft-raffle-856872546342-us-east-1`