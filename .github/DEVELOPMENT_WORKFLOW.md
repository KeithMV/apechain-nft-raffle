# 🚀 ApeChain NFT Raffle - Development Workflow

## 📋 Daily Development Routine

### 🌅 Starting Your Development Session
```bash
# 1. Switch to staging branch (if not already there)
git checkout staging

# 2. Sync with remote changes
git pull origin staging

# 3. Check current status
git status

# 4. Start local development server
cd frontend
npm run start:staging
```

### 💻 During Development
```bash
# Check what you've changed
git status
git diff

# Test your changes locally
npm run start:staging

# Stage specific files (recommended)
git add path/to/specific/file.ts

# Or stage all changes (use carefully)
git add .

# Commit with descriptive message
git commit -m "feat: add specific improvement description"
```

### 🔄 Regular Backup (End of Session)
```bash
# Push your commits to remote
git push origin staging
```

## 📝 Commit Message Guidelines

### Format:
```
type: brief description

Optional longer description
- Bullet point details
- What was changed
- Why it was changed
```

### Types:
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code refactoring
- `style:` - UI/styling changes
- `docs:` - Documentation
- `test:` - Testing
- `chore:` - Maintenance

### Examples:
```bash
git commit -m "feat: add raffle analytics dashboard"
git commit -m "fix: resolve mobile responsive layout issue"
git commit -m "refactor: optimize NFT loading performance"
```

## 🎯 Development Best Practices

### ✅ DO:
- Commit frequently (every 30-60 minutes of work)
- Test changes before committing
- Use descriptive commit messages
- Push to remote daily for backup
- Keep staging branch deployable

### ❌ AVOID:
- Leaving uncommitted work for days
- Pushing broken code
- Mixing unrelated changes in one commit
- Generic commit messages like "updates" or "fixes"

## 🔧 Common Commands

### Quick Status Check:
```bash
git status --short  # Compact status view
```

### View Recent Commits:
```bash
git log --oneline -10  # Last 10 commits
```

### Undo Last Commit (if not pushed):
```bash
git reset --soft HEAD~1  # Keep changes staged
git reset HEAD~1         # Keep changes unstaged
```

### Create Feature Branch (for experimental work):
```bash
git checkout -b feature/experimental-feature
# ... work on feature ...
git checkout staging
git merge feature/experimental-feature
```

## 🚀 Deployment Commands

### Deploy to Staging Environment:
```bash
./scripts/deploy-staging.sh
```

### Build for Production:
```bash
cd frontend
npm run build:production
```

## 📊 Current Branch Strategy

```
staging (active development) ← YOU WORK HERE
├── All latest improvements
├── Alchemy API integration
├── V4 hooks system
├── Enhanced error handling
└── Ready for deployment

develop (older, stable)
└── Fallback branch

main (production)
└── Production releases
```

## 🎯 Next Steps Checklist

- [ ] Test new useCancelRaffleV4() functionality
- [ ] Validate enhanced error handling with various scenarios
- [ ] Test duration conversion fixes
- [ ] Mobile optimization improvements
- [ ] Performance optimization
- [ ] Add progress indicators for multi-step processes

---

**Remember: Staging is your main development branch. Commit often, test before pushing, and keep it deployable!**