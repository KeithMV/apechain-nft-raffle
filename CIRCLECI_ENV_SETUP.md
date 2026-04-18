# CircleCI Environment Variables Setup

## Required Environment Variables

Add these environment variables in CircleCI Project Settings > Environment Variables:

### **REACT_APP_ALCHEMY_API_KEY**
- **Value**: `krTN79Cl9cUZKdtFDEled`
- **Used for**: Alchemy API access for blockchain interactions
- **Required for**: Both staging and production builds

## How to Add Environment Variables in CircleCI:

1. Go to your CircleCI project dashboard
2. Click on "Project Settings"
3. Click on "Environment Variables" in the left sidebar
4. Click "Add Environment Variable"
5. Add the variable name and value
6. Click "Add Variable"

## Security Notes:

- ✅ **Public configs** are in `.env.*.public` files (committed to git)
- ✅ **Secrets** are in CircleCI environment variables (not in git)
- ✅ **Local development** uses your existing `.env` files
- ✅ **CI/CD builds** combine public configs + CI secrets

## File Structure:

```
frontend/
├── .env.staging.public     # ✅ Committed (no secrets)
├── .env.production.public  # ✅ Committed (no secrets)
├── .env.staging           # ❌ Ignored (has secrets)
├── .env.production        # ❌ Ignored (has secrets)
└── .env                   # ❌ Ignored (has secrets)
```

## Build Process:

1. CircleCI copies `.env.staging.public` → `.env.staging`
2. CircleCI appends secrets from environment variables
3. Build uses complete configuration
4. Secrets never touch git repository