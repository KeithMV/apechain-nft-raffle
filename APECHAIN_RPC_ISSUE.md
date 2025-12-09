# ApeChain RPC Gas Estimation Issue

## Problem Summary
ApeChain RPC endpoint `https://apechain.calderachain.xyz/http` returns `undefined` for `eth_estimateGas` calls, causing MetaMask to display inflated gas fees ($2.3M instead of ~$0.002).

## Root Cause Analysis
- **Direct RPC Test**: Confirmed ApeChain RPC returns `undefined` for gas estimation
- **MetaMask Behavior**: Shows $2,347,483.647 as safety fallback when RPC fails
- **Transaction Success**: Actual gas usage is normal (~$0.002), only estimation is broken

## Evidence
```javascript
// Direct RPC call to ApeChain
const response = await fetch('https://apechain.calderachain.xyz/http', {
  method: 'POST',
  body: JSON.stringify({
    method: 'eth_estimateGas',
    params: [{ from: '0x...', to: '0x...', data: '0x...' }]
  })
});
// Result: { result: undefined } ❌
```

## Impact
- Users see scary $2.3M gas estimates
- Prevents second raffle creation attempts
- Affects complex multi-contract interactions most

## Platform Status
- ✅ 58+ raffles successfully created
- ✅ V3 factory operational with 0 APE stuck fees
- ✅ All functionality works (transactions succeed despite estimation)
- ❌ Gas estimation unreliable due to ApeChain RPC

## Recommendation for ApeChain Team
Fix `eth_estimateGas` RPC method to return valid gas estimates instead of `undefined`.

---
*Issue documented: December 2024*
*Platform: ApeChain Raffles (apechainraffles.io)*