# Deployment Guidelines

## 🚫 PIPELINE-ONLY DEPLOYMENTS

### Rules:
1. **NO direct deployments to production**
2. **ALL changes must go through CI/CD pipeline**
3. **Tests must pass before deployment**
4. **Security scans must complete**

### Workflow:
1. Create feature branch
2. Make changes
3. Push to GitHub
4. Create Pull Request
5. Pipeline runs tests & security scans
6. Merge to main (triggers deployment)

### Pipeline Validation:
- ✅ 22 automated tests must pass
- ✅ Security analysis (Slither)
- ✅ Build validation
- ✅ Contract compilation
- ✅ CDK infrastructure validation

### Emergency Deployments:
- Still go through pipeline
- Use hotfix branch → PR → merge
- Never bypass CI/CD

## Current Pipelines:
- **GitHub Actions**: Primary deployment
- **CircleCI**: Advanced testing & security
- **Both must pass** for production deployment