# 🆘 Emergency Recovery Guide

## 💻 Lost Computer? Follow These Steps

### **1. Quick Recovery (5 minutes)**
```bash
# Clone and run automated setup
git clone https://github.com/KeithMV/apechain-nft-raffle.git
cd apechain-nft-raffle
./scripts/setup.sh
```

### **2. Add Your Credentials**
Edit these files with your actual values:

**frontend/.env:**
```env
REACT_APP_ALCHEMY_API_KEY=your_actual_alchemy_key
```

**contracts/.env:**
```env
PRIVATE_KEY=your_actual_wallet_private_key
```

### **3. Configure AWS**
```bash
aws configure
# Enter your AWS access key and secret
```

### **4. Test Everything**
```bash
cd frontend && yarn start    # Should open localhost:3000
cd contracts && yarn test    # Should pass all tests
```

---

## 🔑 Critical Information Backup

### **API Keys You Need**
- **Alchemy API Key:** [Get from dashboard](https://dashboard.alchemy.com/)
- **Wallet Private Key:** Export from MetaMask
- **AWS Access Keys:** From AWS IAM console

### **Important Addresses**
- **Factory Contract:** `0xf5cD6d3F118a3C31742DfFB50BFbFE452F5300D0`
- **S3 Bucket:** `apechain-nft-raffle-856872546342-us-east-1`
- **CloudFront ID:** `EH7R5RBQF66DL`

### **Repository Info**
- **GitHub:** `https://github.com/KeithMV/apechain-nft-raffle.git`
- **Live Site:** `https://d3mce6qq270l98.cloudfront.net`
- **Network:** ApeChain (33139)

---

## 📱 Mobile Backup Checklist

Save this info on your phone:

**Essential Commands:**
```
git clone https://github.com/KeithMV/apechain-nft-raffle.git
cd apechain-nft-raffle && ./scripts/setup.sh
```

**Key Files to Edit:**
- `frontend/.env` - Add Alchemy key
- `contracts/.env` - Add private key
- Run `aws configure` - Add AWS keys

**Test Commands:**
```
cd frontend && yarn start
cd contracts && yarn test
```

---

## 🔄 Full Recovery Time: ~30 minutes

1. **Clone repo** (2 min)
2. **Run setup script** (5 min)
3. **Add credentials** (10 min)
4. **Test everything** (10 min)
5. **Deploy if needed** (3 min)

**You're back in business! 🚀**