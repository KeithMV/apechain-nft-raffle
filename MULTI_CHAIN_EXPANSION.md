# Multi-Chain Expansion Plan

## FIRST MOVE: Base Chain Deployment

### Step 1: Deploy Smart Contracts to Base
```bash
# In contracts/ directory
npx hardhat run scripts/deploy.js --network base
```
- Deploy RaffleFactorySecureV4.sol to Base mainnet
- Deploy RaffleContractSecureV3.sol template
- Record new Base contract addresses

### Step 2: Update Frontend Configuration

**File: `frontend/src/config/wagmi.ts`**
```typescript
import { base } from 'wagmi/chains'

export const config = createConfig({
  chains: [apechain, base], // Add base
  // ... rest of config
})
```

**File: `frontend/src/config/addresses.ts`**
```typescript
export const FACTORY_ADDRESSES = {
  33139: '0x4dF4e9aeb0d58AbE64E7FbC0160119304e9764E4', // ApeChain
  8453: '0x[NEW_BASE_ADDRESS]' // Base
}

export const RAFFLE_FACTORY_ADDRESS = FACTORY_ADDRESSES[33139] // Keep current default
```

### Step 3: Update Contract Hooks

**File: `frontend/src/hooks/useRaffleContractV4.ts`**
```typescript
import { useNetwork } from 'wagmi'

// Replace hardcoded address with:
const { chain } = useNetwork()
const factoryAddress = FACTORY_ADDRESSES[chain?.id] || FACTORY_ADDRESSES[33139]
```

### Step 4: Add Network Switcher UI

**File: `frontend/src/components/NetworkSwitcher.tsx`** (NEW FILE)
```typescript
import { useSwitchChain, useChainId } from 'wagmi'

const NetworkSwitcher = () => {
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  
  return (
    <select onChange={(e) => switchChain({ chainId: Number(e.target.value) })}>
      <option value={33139}>ApeChain</option>
      <option value={8453}>Base</option>
    </select>
  )
}
```

### Step 5: Update Token Symbols

**File: `frontend/src/config/tokens.ts`** (NEW FILE)
```typescript
export const CHAIN_TOKENS = {
  33139: { symbol: 'APE', decimals: 18 },
  8453: { symbol: 'ETH', decimals: 18 }
}
```

## DEPLOYMENT ORDER
1. **Base contracts first** (test with small deployment)
2. **Frontend config updates** 
3. **Network switcher UI**
4. **Test thoroughly** on Base
5. **Add remaining chains** (Polygon, Arbitrum, Optimism)

## FILES TO MODIFY
- `frontend/src/config/wagmi.ts`
- `frontend/src/config/addresses.ts` 
- `frontend/src/hooks/useRaffleContractV4.ts`
- `frontend/src/hooks/useRaffleContract.ts`
- `contracts/hardhat.config.js` (add Base network)
- `frontend/src/components/BasicNFTImage.tsx` (add network parameter)
- `frontend/src/App.tsx` (add NetworkSwitcher component)

## MISSING PIECES TO ADD

### Hardhat Base Network Config
**File: `contracts/hardhat.config.js`**
```javascript
networks: {
  base: {
    url: 'https://mainnet.base.org',
    accounts: [process.env.PRIVATE_KEY],
    chainId: 8453
  }
}
```

### Update All Contract Hooks
**Files to update with dynamic addresses:**
- `frontend/src/hooks/useRaffleContractV4.ts`
- `frontend/src/hooks/useRaffleContract.ts`
- `frontend/src/hooks/useRafflePositions.ts`
- `frontend/src/hooks/useCancelRaffle.ts`
- `frontend/src/hooks/useWinnerSelection.ts`

### Image Proxy Updates
**File: `frontend/src/components/BasicNFTImage.tsx`**
```typescript
// Add network parameter to API calls
const imageUrl = `/api/nft-image?contract=${contractAddress}&tokenId=${tokenId}&network=${chain?.id}`
```

## TESTING CHECKLIST
- [ ] Deploy contracts to Base
- [ ] Update frontend configs
- [ ] Test network switching
- [ ] Test raffle creation on Base
- [ ] Test ticket buying on Base
- [ ] Test NFT image loading on Base

## MULTI-CHAIN ARCHITECTURE

### Current Architecture Strengths
- Wagmi config supports multiple chains
- Contract addresses in separate config files
- Hooks use dynamic contract loading
- Network detection already implemented

### Network Switcher User Experience
**Header placement** - next to wallet connection button:
```
[ApeChain Raffles] [Create] [Dashboard] [Browse] | [⚡ ApeChain ▼] [Connect Wallet]
```

**User Flow:**
1. User clicks network dropdown
2. Selects "Base" 
3. MetaMask popup: "Switch to Base network?"
4. User approves
5. App detects network change
6. Contract addresses update automatically
7. Token symbols change (APE → ETH)
8. Page refreshes raffle data for Base

### NFT Image Display
- Current proxy system will work across chains
- Needs network parameter support
- Chain-specific API endpoint routing
- Estimated effort: 1-2 hours to add multi-chain support

## TARGET CHAINS
1. **Base** (highest liquidity, Coinbase users)
2. **Arbitrum** (established DeFi ecosystem)  
3. **Polygon** (low gas, high adoption)
4. **Optimism** (growing ecosystem)

**START WITH BASE - VALIDATE - THEN SCALE**