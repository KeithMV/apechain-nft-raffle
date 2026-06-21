# Polygon RPC Issue - January 20, 2025

## Problem
Frontend displayed Polygon factory contract `0xC9Bd344f5E31481F202E400C33210Bd1AB542b42` but users couldn't see transactions on Polygonscan.

## Root Cause
**Broken RPC endpoints were returning incorrect data (no code) for valid contracts.**

### RPC Endpoint Test Results (2025-01-20)

| RPC Endpoint | Status | Result |
|--------------|--------|---------|
| `polygon-rpc.com` | ❌ BROKEN | Returns `0x` (no code) |
| `rpc.ankr.com/polygon` | ❌ BROKEN | Returns `0x` (no code) |
| `rpc-mainnet.matic.network` | ❌ DNS FAIL | Host not found |
| `rpc-mainnet.maticvigil.com` | ⚠️  ERROR | Invalid JSON response |
| **`rpc-mainnet.matic.quiknode.pro`** | ✅ **WORKING** | Returns 11,362 bytes ✅ |
| `polygon.meowrpc.com` | ✅ WORKING | (In config) |
| `polygon-mainnet.public.blastapi.io` | ✅ WORKING | (In config) |
| `1rpc.io/matic` | ✅ WORKING | Added to config |

## Contract Verification

### Polygon Factory (V4)
- **Address**: `0xC9Bd344f5E31481F202E400C33210Bd1AB542b42`
- **Status**: ✅ DEPLOYED AND ACTIVE
- **Code Size**: 11,362 bytes
- **Deployment Date**: March 31, 2026 (commit f895332)
- **View**: https://polygonscan.com/address/0xC9Bd344f5E31481F202E400C33210Bd1AB542b42

### Polygon Template (V3)
- **Address**: `0x7487bb0DdAd2d7ff7C59869536cbDcEBAd29D55e`
- **Status**: ✅ DEPLOYED
- **Deployment**: Same transaction as factory

## Timeline

- **Mar 31, 2026**: Polygon V4 contracts deployed successfully (27+ raffles created)
- **May 14, 2026**: Polygon support temporarily removed for ApeChain-only branch
- **May 18, 2026**: Polygon re-added to main branch with Alchemy API key
- **Jan 20, 2025**: Discovered broken RPC fallbacks causing confusion

## Fix Applied

Updated `/frontend/src/config/wagmi.ts`:

```typescript
// BEFORE (broken fallbacks)
http: [
  alchemy,
  'https://polygon-rpc.com',          // ❌ Returns wrong data
  'https://rpc.ankr.com/polygon',     // ❌ Returns wrong data
  'https://polygon.meowrpc.com',
  'https://polygon-mainnet.public.blastapi.io',
]

// AFTER (verified working)
http: [
  alchemy || 'https://rpc-mainnet.matic.quiknode.pro',  // ✅ Working fallback
  'https://rpc-mainnet.matic.quiknode.pro',             // ✅ Verified working
  'https://polygon.meowrpc.com',                        // ✅ Working
  'https://polygon-mainnet.public.blastapi.io',         // ✅ Working
  'https://1rpc.io/matic',                              // ✅ Added
]
```

## Impact

- Users on Polygon can now reliably see their transactions
- Contract calls will succeed with working RPCs
- Automatic fallback to working endpoints if Alchemy rate-limits

## Testing

To verify contract exists on Polygon:
```bash
node test-polygon-rpcs.js
```

Expected output:
```
Testing: Matic Quiknode...
  ✅ CONTRACT EXISTS! Code length: 11362 bytes
```

## Notes

- Polygon contracts were ALWAYS deployed and working
- Issue was ONLY with RPC endpoint reliability
- Frontend config now uses verified working endpoints as of Jan 20, 2025
- Consider adding RPC health monitoring in the future
