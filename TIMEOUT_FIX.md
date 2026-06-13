# Transaction Timeout Fix - Desktop False Errors

## Problem Identified

**Root Cause**: Aggressive 30s and 60s timeouts (added in commit `eacf147` on March 31, 2026) were firing false errors on desktop when users took time to review MetaMask transactions.

**Symptoms**:
- False error: "Transaction taking too long. Cleared processing state." (30s)
- False error: "Transaction timed out. Please refresh and try again." (60s)
- Transaction succeeds anyway, but error already displayed
- Only happened on desktop (MetaMask popup slower than mobile)
- Intermittent based on how fast user confirms

## Solution Implemented

### Changes Made to `useOptimizedTransactionManager.ts`

#### 1. ✅ Removed Aggressive 30s/60s Timeouts
**Before**: Showed errors after 30s and 60s regardless of transaction state
**After**: No premature timeouts during user interaction

#### 2. ✅ Smart Safety Timeout (3 minutes)
**Condition**: Only fires if NO transaction hash after 3 minutes
**Logic**: No hash = transaction never submitted (truly stuck)
**Message**: "Transaction appears to be stuck. Please try again."
**Increased**: From 2 minutes to 3 minutes for extra buffer

#### 3. ✅ Smart Confirmation Timeout  
**Condition**: Only fires if hash exists but confirmation slow
**Logic**: Hash exists = transaction accepted by network, will complete
**Message**: Changed from ERROR to WARNING
**New Message**: "Transaction is taking longer than expected. It will likely still complete. Check your wallet or explorer."
**Buffer**: Increased from 5s to 10s

## The New Logic

```
User clicks "Create Raffle"
  ↓
MetaMask opens (no timeout during review)
  ↓
User confirms (even if takes 2+ minutes - OK!)
  ↓
Transaction submitted
  ↓
IF hash received:
  ✅ Transaction WILL complete (shows warning only if very slow)
  
IF no hash after 3 minutes:
  ❌ Truly stuck (shows error)
  
IF user rejects:
  ❌ Immediate error (real failure)
```

## Benefits

✅ **No false errors** - Users can review transactions carefully
✅ **Desktop works** - MetaMask popup delays don't cause errors  
✅ **Mobile still fast** - No negative impact
✅ **Real errors still caught** - Truly stuck transactions still show error after 3 minutes
✅ **Better UX** - Warning instead of error when hash exists (transaction will complete)

## Testing Checklist

- [ ] Create raffle on desktop, take 60+ seconds to confirm in MetaMask → Should succeed without error
- [ ] Create raffle on mobile, confirm quickly → Should succeed as before
- [ ] Create raffle and reject in MetaMask → Should show immediate error (correct behavior)
- [ ] Leave MetaMask open without confirming for 3+ minutes → Should show "truly stuck" error (correct behavior)
- [ ] Create raffle with slow RPC (hash exists but slow confirmation) → Should show warning, not error

## Deployment

**Next Steps**:
1. Test locally on desktop
2. Commit to staging branch
3. Push to CloudFront staging
4. Test on staging
5. Merge to main for production

## Commit Message

```
fix: remove aggressive 30s/60s timeouts causing false errors on desktop

- Remove aggressive 30s/60s timeouts from executeTransaction
- Increase safety timeout from 2min to 3min (only fires if no hash)
- Change confirmation timeout from error to warning (hash = will complete)
- Increase confirmation buffer from 5s to 10s
- Fixes intermittent false errors when MetaMask popup is slow on desktop
- Mobile unaffected, desktop UX significantly improved
```
