# SYSTEMATIC CI/CD PIPELINE WORKFLOW
# Complete Development → Staging → Production Flow

## 🎯 **BRANCH STRATEGY**

### **Branch Hierarchy:**
```
main (production)
  ↑
staging (pre-production)
  ↑  
develop (development)
  ↑
feature/* (feature branches)
```

### **Pipeline Triggers:**

| Branch | Pipeline | Deployment Target | Trigger |
|--------|----------|-------------------|---------|
| `develop` | `development_pipeline` | None (testing only) | Auto on push |
| `staging` | `staging_pipeline` | Staging environment | Auto on push |
| `main` | `production_pipeline` | Production environment | Auto + Manual approval |

## 🚀 **SYSTEMATIC WORKFLOW**

### **Phase 1: Development (develop branch)**
```bash
# Work on develop branch
git checkout develop
git pull origin develop

# Make changes, commit, push
git add .
git commit -m "feat: your changes"
git push origin develop
```

**Pipeline Actions:**
- ✅ Install dependencies (frontend + contracts)
- ✅ Lint code (ESLint + Prettier)
- ✅ Run unit tests
- ✅ Run integration tests
- ✅ Security scanning
- ✅ Build staging version
- ✅ Contract compilation & testing
- ✅ Infrastructure validation
- ❌ No deployment (testing only)

### **Phase 2: Staging Promotion (staging branch)**
```bash
# Promote develop to staging
./scripts/promote-branch.sh staging

# Or manually:
git checkout staging
git merge develop --no-ff
git push origin staging
```

**Pipeline Actions:**
- ✅ All development pipeline steps
- ✅ Deploy to staging environment
- ✅ Staging smoke tests
- ✅ CloudFront cache invalidation

**Staging Environment:**
- **URL**: https://d1784e9dgxn2du.cloudfront.net
- **S3 Bucket**: apechain-nft-raffle-staging-v2-856872546342-us-east-1
- **CloudFront**: EDPIS47D31NKW

### **Phase 3: Production Promotion (main branch)**
```bash
# After staging testing is complete
./scripts/promote-branch.sh production

# Or manually:
git checkout main
git merge staging --no-ff
git push origin main
```

**Pipeline Actions:**
- ✅ All staging pipeline steps
- ✅ Manual approval required
- ✅ Deploy to production environment
- ✅ Production smoke tests

**Production Environment:**
- **URL**: https://apechainraffles.io
- **S3 Bucket**: Dynamic (from CDK stack)
- **CloudFront**: Dynamic (from CDK stack)

## 🔧 **PIPELINE JOBS BREAKDOWN**

### **Frontend Pipeline:**
1. `install-frontend-deps` - Install Node.js 20.19 dependencies
2. `lint-frontend` - ESLint + Prettier checks
3. `test-frontend-unit` - Vitest unit tests
4. `test-frontend-integration` - Integration tests
5. `security-scan-frontend` - Yarn audit + security checks
6. `build-frontend-staging/production` - Optimized builds

### **Contract Pipeline:**
1. `install-contracts-deps` - Install contract dependencies
2. `compile-contracts` - Hardhat compilation
3. `test-contracts` - Contract unit tests
4. `security-scan-contracts` - Slither security analysis

### **Infrastructure Pipeline:**
1. `validate-infrastructure` - CDK validation
2. `deploy-staging/production` - AWS deployment

## 📊 **MONITORING & DEBUGGING**

### **Pipeline Status Indicators:**
- 🟢 **Success**: All jobs passed
- 🟡 **Warning**: Non-critical issues (ESLint warnings)
- 🔴 **Failed**: Critical issues blocking deployment
- ⚪ **Created**: Pipeline triggered but not running

### **Common Issues & Solutions:**

| Issue | Cause | Solution |
|-------|-------|----------|
| "Created" only | Wrong branch filter | Check branch name matches workflow |
| Build failures | Environment mismatch | Verify Node.js 20.19.0 |
| Test failures | Missing dependencies | Check yarn.lock consistency |
| Security scan fails | High/critical vulnerabilities | Run `yarn audit fix` |
| Deployment fails | AWS credentials | Check CircleCI environment variables |

## 🎯 **BEST PRACTICES**

### **Development Workflow:**
1. Always work on `develop` branch for new features
2. Test locally before pushing
3. Monitor pipeline status after push
4. Fix any pipeline failures immediately

### **Staging Workflow:**
1. Only promote to staging when develop pipeline passes
2. Test thoroughly in staging environment
3. Verify all functionality works as expected
4. Check staging URL: https://d1784e9dgxn2du.cloudfront.net

### **Production Workflow:**
1. Only promote to production after staging validation
2. Requires manual approval in CircleCI
3. Monitor production deployment carefully
4. Have rollback plan ready

## 🚨 **EMERGENCY PROCEDURES**

### **Rollback Production:**
```bash
# Revert to previous commit
git checkout main
git revert HEAD --no-edit
git push origin main
```

### **Hotfix Process:**
```bash
# Create hotfix from main
git checkout main
git checkout -b hotfix/critical-fix
# Make fix, test, commit
git checkout main
git merge hotfix/critical-fix
git push origin main
```

### **Pipeline Debugging:**
1. Check CircleCI dashboard for detailed logs
2. Verify branch filters in workflow configuration
3. Check environment variables and AWS credentials
4. Review recent commits for breaking changes

This systematic approach ensures reliable, predictable deployments with proper testing and validation at each stage.