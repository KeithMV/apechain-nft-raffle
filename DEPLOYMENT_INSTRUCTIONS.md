# 🚀 Frontend Deployment Instructions

Your ApeCoin NFT Raffle System frontend is built and ready for deployment!

## 📦 Build Location
```
/home/ubuntu/apechain-nft-raffle/frontend/build/
```

## 🌐 Deployment Options

### Option 1: AWS S3 + CloudFront (Recommended)
```bash
# 1. Create S3 bucket
aws s3 mb s3://apechain-nft-raffle

# 2. Upload build files
cd /home/ubuntu/apechain-nft-raffle/frontend
aws s3 sync build/ s3://apechain-nft-raffle --delete

# 3. Enable static website hosting
aws s3 website s3://apechain-nft-raffle --index-document index.html

# 4. Set public read policy
aws s3api put-bucket-policy --bucket apechain-nft-raffle --policy '{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicReadGetObject",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::apechain-nft-raffle/*"
  }]
}'
```

### Option 2: Vercel (Fastest)
```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy from build folder
cd /home/ubuntu/apechain-nft-raffle/frontend
vercel --prod

# Follow prompts - it will auto-detect React build
```

### Option 3: Netlify
```bash
# 1. Install Netlify CLI
npm install -g netlify-cli

# 2. Deploy
cd /home/ubuntu/apechain-nft-raffle/frontend
netlify deploy --prod --dir=build

# Follow authentication prompts
```

### Option 4: GitHub Pages
```bash
# 1. Push to GitHub repository
git init
git add .
git commit -m "ApeCoin NFT Raffle System"
git branch -M main
git remote add origin https://github.com/yourusername/apechain-nft-raffle.git
git push -u origin main

# 2. Enable GitHub Pages in repository settings
# Source: GitHub Actions
# Upload build/ folder contents
```

## 🔧 Custom Domain Setup

### For AWS CloudFront:
1. Create CloudFront distribution pointing to S3 bucket
2. Add custom domain (CNAME record)
3. Enable SSL certificate

### For Vercel/Netlify:
1. Add custom domain in dashboard
2. Update DNS records as instructed
3. SSL automatically provisioned

## 🎯 Recommended: AWS S3 + CloudFront

**Why AWS:**
- Same infrastructure as your fractionalization platform
- Global CDN with CloudFront
- Custom domain with SSL
- Scalable and reliable

**Estimated cost:** ~$1-5/month for moderate traffic

## ✅ Post-Deployment Checklist

1. **Test wallet connection** on live site
2. **Verify contract interactions** work
3. **Test raffle creation** flow
4. **Test ticket purchasing** flow
5. **Check mobile responsiveness**

## 🌍 Your Live Platform

Once deployed, users can access:
- **Create Raffle:** Upload NFTs and set ticket prices
- **Browse Raffles:** Discover active raffles
- **Buy Tickets:** Purchase entries with APE
- **Track Participation:** Monitor raffle status

**Your platform will start earning 10% fees immediately upon first raffle creation!**

## 📞 Support

Built using your proven architecture - same deployment patterns as your successful fractionalization platform.