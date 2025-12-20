# 🎯 Send In/Send Out NFT Feature - Game Plan

**Date:** December 20, 2025  
**Target:** Universal NFT management for all wallet types  
**Effort:** ~4-6 hours total

## 🎪 Feature Overview

**Universal NFT Transfer System:**
- ✅ **Send Out** - Transfer NFTs from connected wallet to any address
- ✅ **Send In** - Receive NFTs from external wallets  
- ✅ **All Wallet Types** - MetaMask, Social, Rainbow, Trust Wallet
- ✅ **Seamless UX** - Integrated with existing NFT display

## 📋 Implementation Plan

### Phase 1: Core Transfer Logic (1-2 hours)
**Files to create/modify:**
- `src/hooks/useNFTTransfer.ts` - Transfer hook with wagmi
- `src/utils/nftTransfer.ts` - Transfer utilities
- `src/types/nft.ts` - NFT transfer types

**Key functions:**
```typescript
const transferNFT = async (contractAddress, tokenId, toAddress)
const validateAddress = (address) => boolean
const estimateTransferGas = (contractAddress, tokenId, toAddress)
```

### Phase 2: UI Components (2-3 hours)
**Components to create:**
- `src/components/SendOutModal.tsx` - Transfer NFT modal
- `src/components/SendInModal.tsx` - Receive NFT modal  
- `src/components/NFTTransferButton.tsx` - Action buttons
- `src/components/TransferConfirmation.tsx` - Success/error states

**UI Flow:**
1. NFT card shows [Send Out] [Send In] buttons
2. Click → Modal opens with address input
3. Validate → Show gas estimate
4. Confirm → Execute transfer
5. Success → Update NFT list

### Phase 3: Integration (1 hour)
**Files to modify:**
- `src/components/BrowseRaffles.tsx` - Add transfer buttons
- `src/components/RaffleDashboard.tsx` - Add to user NFTs
- `src/components/WalletInfo.tsx` - Add transfer stats

## 🛠️ Technical Requirements

### Smart Contract Interactions
```typescript
// ERC721 transfer
contract.safeTransferFrom(from, to, tokenId)

// Approval check
contract.getApproved(tokenId)
contract.isApprovedForAll(owner, operator)
```

### Validation & Security
- ✅ **Address validation** - Valid Ethereum address
- ✅ **Ownership check** - User owns the NFT
- ✅ **Approval status** - NFT approved for transfer
- ✅ **Gas estimation** - Show transfer cost
- ✅ **Error handling** - Clear error messages

### UX Considerations
- 🎨 **Consistent styling** - Match existing design
- 📱 **Mobile responsive** - Works on all devices
- ⚡ **Loading states** - Show transfer progress
- 🔔 **Toast notifications** - Success/error feedback
- 💾 **Transaction history** - Track transfers

## 🎯 User Stories

### Story 1: Social Wallet Escape
**As a** social wallet user  
**I want to** send my won NFT to MetaMask  
**So that** I have true ownership with private keys

### Story 2: MetaMask Portfolio Management  
**As a** MetaMask user  
**I want to** send NFTs between wallets  
**So that** I can organize my collection

### Story 3: Friend-to-Friend Transfers
**As a** platform user  
**I want to** easily send NFTs to friends  
**So that** I can share my collection

## 🚀 Success Metrics

**Functionality:**
- ✅ Transfer works for all wallet types
- ✅ Gas estimation accurate
- ✅ Error handling comprehensive
- ✅ Mobile UX smooth

**User Experience:**
- ✅ Intuitive button placement
- ✅ Clear transfer flow
- ✅ Fast transaction confirmation
- ✅ Helpful error messages

## 🔧 Development Order

### Tomorrow's Tasks:
1. **Morning (2 hours):** Build core transfer logic + hooks
2. **Afternoon (2 hours):** Create Send Out modal + UI
3. **Evening (1 hour):** Create Send In modal
4. **Final (1 hour):** Integration + testing

### Testing Checklist:
- [ ] Transfer NFT from MetaMask → external address
- [ ] Transfer NFT from social wallet → MetaMask  
- [ ] Receive NFT from external wallet
- [ ] Gas estimation accuracy
- [ ] Error handling (invalid address, insufficient gas)
- [ ] Mobile responsiveness
- [ ] Transaction confirmation flow

## 🎪 Integration Points

**Existing Systems:**
- ✅ **NFT Display** - Add buttons to existing NFT cards
- ✅ **Wallet Connection** - Use current wallet system
- ✅ **Toast Notifications** - Use existing react-hot-toast
- ✅ **Modal System** - Follow existing modal patterns
- ✅ **Error Handling** - Use existing error boundaries

**New Capabilities:**
- 🆕 **Universal NFT Management** - Works with any wallet
- 🆕 **Social Wallet Freedom** - Escape custody easily  
- 🆕 **Portfolio Tools** - Advanced NFT organization
- 🆕 **Community Features** - Easy friend transfers

---

## 🏆 Expected Outcome

**Phase 6.9.4 - Universal NFT Management:**
- Complete Send In/Send Out functionality
- All wallet types supported
- Seamless user experience
- Social wallet custody solution
- Enhanced platform value

**This feature transforms the platform from "NFT raffle only" to "Complete NFT management hub"** 🚀

---

**Ready to build tomorrow!** 💪