# 🌐 Custom Domain Setup Guide

## Quick Setup Options

### **Option A: I Have a Domain Already**
```bash
cd infrastructure
./deploy-with-domain.sh your-domain.com
```

### **Option B: I Need to Buy a Domain**
1. **Buy domain** from:
   - Namecheap (recommended, ~$10/year)
   - GoDaddy (~$15/year)
   - AWS Route53 (~$12/year)

2. **Deploy with domain**:
```bash
cd infrastructure
./deploy-with-domain.sh your-new-domain.com
```

### **Option C: Full AWS Route53 Setup**
```bash
# If you bought domain through AWS Route53
cd infrastructure
./deploy-with-domain.sh your-domain.com Z1234567890ABC
```

## 🚀 **Recommended Domains for Your Raffle Platform**

- `apechain-raffles.com`
- `aperaffles.com` 
- `nft-raffle.app`
- `apecoinnft.com`
- `raffleape.com`

## ⚡ **After Deployment**

1. **Wait for SSL certificate** (5-30 minutes)
2. **Update DNS** (if not using Route53):
   - Point your domain to the CloudFront URL
   - Add CNAME for www subdomain
3. **Deploy frontend**:
```bash
cd ../frontend
npm run build
aws s3 sync build/ s3://$(aws cloudformation describe-stacks --stack-name RaffleInfrastructureStack --query 'Stacks[0].Outputs[?OutputKey==`BucketName`].OutputValue' --output text)/
```

## 🔧 **Manual DNS Setup** (if not using Route53)

After deployment, you'll get a CloudFront URL like: `d1234567890.cloudfront.net`

**Add these DNS records in your domain provider:**
- **A Record**: `@` → CloudFront IP (or CNAME to CloudFront URL)
- **CNAME**: `www` → CloudFront URL

## ✅ **Verification**

1. Visit `https://your-domain.com`
2. MetaMask warnings should be gone
3. SSL certificate should show as valid
4. Site loads properly

## 💰 **Cost**

- **Domain**: $10-15/year
- **SSL Certificate**: Free (AWS Certificate Manager)
- **CloudFront**: ~$1-5/month
- **Route53**: $0.50/month (if used)

**Total**: ~$10-20/year + minimal AWS costs

## 🆘 **Troubleshooting**

**SSL Certificate Pending?**
- Wait 5-30 minutes for DNS validation
- Check domain DNS settings

**Domain not resolving?**
- DNS changes take 24-48 hours to propagate
- Use CloudFront URL temporarily

**MetaMask still warning?**
- Clear browser cache
- Wait for full DNS propagation
- Ensure HTTPS is working