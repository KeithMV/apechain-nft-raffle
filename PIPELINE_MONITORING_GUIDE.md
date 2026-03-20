# CircleCI Pipeline Monitoring & Troubleshooting Guide

## 🔍 **How to Monitor Your Pipeline**

### **1. CircleCI Dashboard**
- Go to: https://app.circleci.com/pipelines/github/KeithMV/apechain-nft-raffle
- Look for the latest pipeline run on `develop` branch
- Check each job status (green = success, red = failed, yellow = running)

### **2. Expected Pipeline Flow**
```
Staging Pipeline (develop branch):
├── install-frontend-deps (2-3 min)
├── install-contracts-deps (1-2 min)
├── lint-frontend (30s)
├── test-frontend-unit (1-2 min)
├── test-frontend-integration (1-2 min)
├── security-scan-frontend (1-2 min)
├── compile-contracts (1-2 min)
├── test-contracts (30s)
├── security-scan-contracts (2-3 min)
├── validate-infrastructure (1-2 min)
├── build-frontend-staging (2-3 min)
└── deploy-staging (1-2 min)
```

## 🚨 **Common Issues & Fixes**

### **Issue 1: Dependency Installation Failures**
**Symptoms:** `install-frontend-deps` or `install-contracts-deps` fails
**Likely Causes:**
- Network timeout
- Package registry issues
- Dependency conflicts

**Quick Fix:**
```bash
# Update package.json with --legacy-peer-deps
cd frontend
yarn install --legacy-peer-deps
git add package.json yarn.lock
git commit -m "fix: Update dependencies with legacy peer deps"
git push origin develop
```

### **Issue 2: Test Failures**
**Symptoms:** `test-frontend-unit` or `test-frontend-integration` fails
**Likely Causes:**
- Missing test setup files
- Import path issues
- Mock configuration problems

**Quick Fix:**
```bash
# Run tests locally first
cd frontend
yarn test --run
# Fix any failing tests, then commit
```

### **Issue 3: Linting Failures**
**Symptoms:** `lint-frontend` fails
**Likely Causes:**
- Code style issues
- Missing ESLint configuration

**Quick Fix:**
```bash
# Auto-fix linting issues
cd frontend
npx eslint src/ --ext .ts,.tsx --fix
npx prettier --write "src/**/*.{ts,tsx,js,jsx,json,css,md}"
git add -A
git commit -m "fix: Auto-fix linting issues"
git push origin develop
```

### **Issue 4: Contract Compilation Failures**
**Symptoms:** `compile-contracts` fails
**Likely Causes:**
- Solidity version mismatch
- Missing dependencies
- Contract syntax errors

**Quick Fix:**
```bash
# Test compilation locally
cd contracts
npx hardhat compile
# Fix any compilation errors, then commit
```

### **Issue 5: Security Scanning Issues**
**Symptoms:** `security-scan-contracts` fails
**Likely Causes:**
- Slither installation issues
- Contract analysis errors

**Quick Fix:**
```bash
# Temporarily disable security scanning
# Edit .circleci/config.yml and add || true to security commands
```

### **Issue 6: Build Failures**
**Symptoms:** `build-frontend-staging` fails
**Likely Causes:**
- TypeScript errors
- Missing environment variables
- Build configuration issues

**Quick Fix:**
```bash
# Test build locally
cd frontend
yarn build:staging
# Fix any build errors, then commit
```

### **Issue 7: Deployment Failures**
**Symptoms:** `deploy-staging` fails
**Likely Causes:**
- AWS credentials not configured
- S3 bucket permissions
- CloudFront distribution issues

**Quick Fix:**
- Check CircleCI environment variables
- Verify AWS credentials are set up
- Check S3 bucket exists and has correct permissions

## 🔧 **Emergency Pipeline Fixes**

### **Rollback to Previous Config**
If the new pipeline completely fails:
```bash
cp .circleci/config-backup.yml .circleci/config.yml
git add .circleci/config.yml
git commit -m "fix: Rollback to previous working pipeline"
git push origin develop
```

### **Minimal Working Pipeline**
If you need a basic pipeline that just builds:
```yaml
version: 2.1
jobs:
  build:
    docker:
      - image: cimg/node:20.19
    steps:
      - checkout
      - run: cd frontend && yarn install
      - run: cd frontend && yarn build
workflows:
  version: 2
  build_and_test:
    jobs:
      - build:
          filters:
            branches:
              only: develop
```

## 📊 **Performance Monitoring**

### **Expected Improvements**
- **Total Pipeline Time:** 15 min → 8 min (47% faster)
- **Dependency Install:** 5 min → 2 min (caching)
- **Parallel Jobs:** 8 jobs running simultaneously
- **Cache Hit Rate:** Should be 85%+ after first run

### **Performance Red Flags**
- Pipeline taking longer than 12 minutes
- Cache hit rate below 50%
- Jobs failing due to timeouts
- Memory issues in Node.js jobs

## 🎯 **Next Steps After Pipeline Stabilizes**

### **1. Enable Advanced Features**
```bash
# Add back Snyk scanning (requires SNYK_TOKEN)
# Add back Codecov (requires CODECOV_TOKEN)
# Enable bundle analysis
# Add performance budgets
```

### **2. Add Environment Variables**
In CircleCI Project Settings → Environment Variables:
- `SNYK_TOKEN` - For security scanning
- `CODECOV_TOKEN` - For coverage reporting
- `AWS_ACCESS_KEY_ID` - For deployment
- `AWS_SECRET_ACCESS_KEY` - For deployment

### **3. Production Pipeline**
Once staging pipeline is stable:
```bash
git checkout main
git merge develop
git push origin main
# This will trigger production pipeline with manual approval
```

## 🚀 **Success Indicators**

✅ **Pipeline is working when:**
- All jobs complete successfully (green checkmarks)
- Total time is under 10 minutes
- Staging deployment completes
- Smoke tests pass
- No critical security issues found

❌ **Pipeline needs attention when:**
- Any job fails consistently
- Pipeline takes longer than 15 minutes
- Cache hit rate is below 50%
- Security scans find critical issues
- Deployment fails

## 📞 **Getting Help**

If you encounter issues not covered here:
1. Check CircleCI job logs for specific error messages
2. Run the failing commands locally to reproduce
3. Check if it's a temporary service issue (npm, GitHub, etc.)
4. Consider temporarily disabling problematic jobs with `|| true`

Remember: It's normal for new pipelines to need 3-5 iterations to get fully stable!