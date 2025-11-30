# 🎯 ApeChain NFT Raffles - Stabilization Guide

## 🚨 GOLDEN RULES

### **NEVER:**
- Make multiple changes at once
- Deploy without testing
- Fix something that's working
- Add features while bugs exist
- Rush fixes under pressure

### **ALWAYS:**
- Test before deploying
- Create git branch for each fix
- Document what you changed
- Have rollback plan ready
- Test the entire user flow

---

## 📋 PHASE 1: ASSESSMENT (Day 1)

### **Current State Analysis**
**Goal:** Know exactly what works and what doesn't

#### **Manual Testing Checklist**
```
□ Site loads without errors
□ Wallet connects successfully
□ Can browse existing raffles
□ Can view raffle details
□ Can create new raffle
□ Raffle shows correct duration
□ Can buy tickets
□ Transactions complete
□ Winner selection works
□ Platform fees collected
```

#### **Testing Process**
1. **Open browser dev tools** - watch for errors
2. **Test each feature** - document results
3. **Record any errors** - screenshots + console logs
4. **Note performance issues** - slow loading, timeouts
5. **Test on mobile** - responsive design issues

#### **Documentation Template**
```
Feature: [Feature Name]
Status: ✅ Working / ❌ Broken / ⚠️ Partial
Issues: [List specific problems]
Priority: High/Medium/Low
Notes: [Additional context]
```

---

## 📋 PHASE 2: CRITICAL FIXES (Days 2-5)

### **Fix Priority Order**
1. **Security vulnerabilities** - prevents attacks
2. **Core functionality bugs** - prevents usage
3. **Performance issues** - improves experience
4. **UI/UX problems** - polish

### **Single Fix Process**
```
1. CREATE BRANCH
   git checkout -b fix/[issue-name]

2. MAKE MINIMAL CHANGE
   - Smallest possible fix
   - Don't refactor while fixing
   - Focus on one issue only

3. TEST LOCALLY
   - yarn start
   - Test the specific fix
   - Test related functionality
   - Check for new errors

4. COMMIT & PUSH
   git add .
   git commit -m "Fix: [specific issue]"
   git push origin fix/[issue-name]

5. DEPLOY & VERIFY
   - Merge to main
   - Wait for pipeline
   - Test live site
   - Monitor for issues

6. ROLLBACK IF NEEDED
   git revert [commit-hash]
   git push origin main
```

---

## 🎯 CRITICAL FIXES LIST

### **Priority 1: Security (Fix First)**
- [ ] **SSRF in nftMetadataService.ts**
  - File: `frontend/src/services/nftMetadataService.ts`
  - Issue: Unvalidated external URLs
  - Fix: Add URL whitelist validation

- [ ] **Package vulnerabilities**
  - Command: `yarn audit --fix`
  - Test: Ensure build still works

- [ ] **Input sanitization**
  - Files: All form inputs
  - Issue: XSS potential
  - Fix: Sanitize user inputs

### **Priority 2: Core Bugs (Fix Second)**
- [ ] **Duration display issue**
  - File: `frontend/src/components/CreateRafflePage.tsx`
  - Issue: Raffles show expired immediately
  - Status: Fix deployed, needs verification

- [ ] **Error handling gaps**
  - Files: All service files
  - Issue: Unhandled promise rejections
  - Fix: Add try/catch blocks

- [ ] **Performance issues**
  - File: `frontend/src/services/rafflePositionService.ts`
  - Issue: Processing too many events
  - Fix: Reduce batch sizes

### **Priority 3: Stability (Fix Third)**
- [ ] **Memory leaks**
  - Files: React components
  - Issue: useEffect cleanup missing
  - Fix: Add cleanup functions

- [ ] **Request timeouts**
  - Files: All API calls
  - Issue: Hanging requests
  - Fix: Add timeout parameters

---

## 🧪 TESTING PROTOCOLS

### **Before Every Fix**
```bash
# 1. Create test branch
git checkout -b test/[feature]

# 2. Run local tests
cd frontend && yarn start
cd contracts && yarn test

# 3. Manual testing
- Test the specific feature
- Test related features
- Check browser console
- Test on mobile
```

### **After Every Fix**
```bash
# 1. Verify fix works
- Test the specific issue
- Confirm it's resolved

# 2. Regression testing
- Test all core features
- Ensure nothing else broke

# 3. Performance check
- Check loading times
- Monitor memory usage
- Watch for errors
```

### **Deployment Verification**
```bash
# 1. Wait for pipeline completion
# 2. Test live site immediately
# 3. Monitor for 30 minutes
# 4. Check error logs
# 5. Rollback if issues found
```

---

## 🚨 EMERGENCY PROCEDURES

### **If Something Breaks**
1. **STOP** - Don't make more changes
2. **ASSESS** - What exactly broke?
3. **ROLLBACK** - Revert to last working state
4. **INVESTIGATE** - Find root cause
5. **FIX PROPERLY** - Test thoroughly before redeploy

### **Rollback Commands**
```bash
# Find last working commit
git log --oneline

# Revert specific commit
git revert [commit-hash]
git push origin main

# Emergency rollback to previous version
git reset --hard [last-good-commit]
git push --force origin main
```

### **Emergency Contacts**
- Pipeline fails: Check CircleCI dashboard
- Site down: Check AWS CloudFront status
- Smart contract issues: Check ApeChain explorer

---

## 📊 SUCCESS METRICS

### **Daily Checks**
- [ ] Site loads without errors
- [ ] Core user flow works end-to-end
- [ ] No new console errors
- [ ] Performance acceptable (<3s load)

### **Weekly Goals**
- **Week 1:** All critical bugs fixed
- **Week 2:** All security issues resolved
- **Week 3:** Performance optimized
- **Week 4:** Ready for white label

### **Definition of Done**
- ✅ Feature works as expected
- ✅ No console errors
- ✅ Mobile responsive
- ✅ Performance acceptable
- ✅ Security validated
- ✅ Documented and tested

---

## 🎯 TEAM WORKFLOW

### **Daily Standup Questions**
1. What did you fix yesterday?
2. What are you fixing today?
3. Any blockers or new issues?
4. Did you test your changes?

### **Communication Protocol**
- **Before fixing:** Announce what you're working on
- **During fixing:** Share progress and blockers
- **After fixing:** Confirm deployment and testing
- **If issues:** Immediately notify team

### **Documentation Requirements**
- Every fix must be documented
- Include before/after behavior
- Note any side effects
- Update this guide as needed

---

## 🎉 COMPLETION CRITERIA

### **Platform is Stable When:**
- [ ] All core features work reliably
- [ ] No security vulnerabilities
- [ ] Performance is acceptable
- [ ] Error handling is comprehensive
- [ ] Mobile experience is smooth
- [ ] Ready for production traffic

**Remember:** Slow and steady wins. Better to have a working platform than a broken "perfect" one.