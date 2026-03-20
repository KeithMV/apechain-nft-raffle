# ApeChain NFT Raffle Platform

A decentralized NFT raffle platform built for ApeChain with Polygon support.

## 🚀 Features

### ✅ Multi-Chain Support
- **ApeChain**: Native APE token raffles
- **Base**: ETH-based NFT raffles  
- **Network Switcher**: Easy switching between chains
- **Chain-Specific Balances**: Shows APE on ApeChain, ETH on Base

### ✅ Professional Development Environment
- **Development**: Safe local testing environment
- **Staging**: Pre-production testing with testnets
- **Production**: Live platform with mainnet contracts

### ✅ Mobile-First Design
- **Mobile Wallet Support**: MetaMask, Trust Wallet, WalletConnect
- **Responsive UI**: Works on all screen sizes
- **Touch-Friendly**: Optimized for mobile interactions

### ✅ Advanced Features
- **Provably Fair**: Commit-reveal randomness scheme
- **Emergency Controls**: Admin pause/unpause functionality
- **Rate Limiting**: 10-second cooldown between raffle creations
- **Fee Management**: 5% platform fee with owner controls

## 🌐 Supported Networks

| Network | Chain ID | Status | Contract Status |
|---------|----------|--------|-----------------|
| ApeChain | 33139 | ✅ Live | ✅ Deployed |
| Base | 8453 | 🔧 Ready | ⚠️ Needs Deployment |
| Base Sepolia | 84532 | 🧪 Testnet | ⚠️ Needs Deployment |

## 🛠 Development Setup

### Prerequisites
- Node.js 18+
- Yarn
- MetaMask or compatible wallet

### Quick Start
```bash
# Clone repository
git clone https://github.com/KeithMV/apechain-nft-raffle.git
cd apechain-nft-raffle

# Install dependencies
cd frontend && yarn install
cd ../contracts && yarn install

# Start development server
cd ../frontend && yarn start:dev
```

### Environment Commands
```bash
# Development (localhost with ApeChain)
yarn start:dev

# Staging (testnet testing)
yarn start:staging  

# Production build
yarn build:production

# Deploy to environment
./scripts/deploy-env.sh [development|staging|production]
```

## 📱 Mobile Access

**Local Development**: `http://192.168.0.217:3000`
**Production**: `https://apechainraffles.io`

## 🔧 Architecture

### Recent Improvements (Phase 1 Refactoring - January 2025)

#### Code Quality Enhancements
- **Component Extraction**: Broke down god components starting with CreateRafflePage (400+ → 340 lines)
- **Bug Fixes**: Resolved critical approval flow race conditions and render loops
- **Performance**: Eliminated expensive re-renders and improved state management
- **Architecture**: Introduced dedicated hooks for complex state management (useNFTApprovalManager)

#### Technical Debt Reduction
- **Extracted RaffleForm component** (197 lines) with proper TypeScript interfaces
- **Created useNFTApprovalManager** for contract-level approval state handling
- **Improved approval caching** - each contract maintains separate approval status
- **Better separation of concerns** between UI rendering and business logic
- **Eliminated circular dependencies** that caused infinite re-renders

#### Development Quality Score: **6.5/10** (improved from 5.5/10)
- ✅ Phase 1 refactoring completed - CreateRafflePage componentized
- ✅ Critical approval flow bugs fixed - no more stuck states
- ✅ Performance improvements - removed expensive JSON.stringify operations
- 🚧 Phase 2 in progress: BrowseRaffles component extraction (500+ lines)
- 🚧 Phase 3 planned: Centralized state management and error boundaries

### Frontend Stack
- **React 19** with TypeScript
- **Wagmi v2** for Web3 integration
- **Web3Modal v5** for wallet connections
- **TailwindCSS** for styling
- **Viem** for blockchain interactions

### Smart Contracts
- **RaffleFactorySecureV4**: Main factory contract
- **RaffleContractSecureV3**: Individual raffle logic
- **Commit-Reveal**: Provably fair winner selection
- **Emergency Controls**: Admin safety features

### Multi-Chain Architecture
```
┌─────────────────┐    ┌─────────────────┐
│   ApeChain      │    │      Base       │
│   Chain ID:     │    │   Chain ID:     │
│     33139       │    │     8453        │
│                 │    │                 │
│ ✅ Deployed     │    │ ⚠️  Pending     │
│ ✅ Live Raffles │    │ 🔧 Ready        │
└─────────────────┘    └─────────────────┘
```

## 🚀 Deployment Status

### ApeChain (Live)
- **Factory V4**: `0x1627E7e63b63878E61f91D336385a59B1747934a`
- **Template**: `0x242f56507BFd5034b369418A7C9FB1b4643710a4`
- **Status**: ✅ 65+ raffles completed
- **Revenue**: Active fee generation

### Base (Pending)
- **Contracts**: ⚠️ Need deployment
- **Frontend**: ✅ Ready
- **Testing**: ⚠️ Needs Base Sepolia deployment

## 📋 Next Steps

### Immediate (Base Launch)
1. **Deploy to Base Sepolia**
   ```bash
   cd contracts
   npx hardhat run scripts/deploy-secure.js --network base-sepolia
   ```

2. **Update Contract Addresses**
   ```typescript
   // frontend/src/config/addresses.ts
   8453: {
     RAFFLE_FACTORY_V4: '0x...', // Real Base address
     RAFFLE_TEMPLATE: '0x...'    // Real Base address
   }
   ```

3. **Test on Base Sepolia**
   - Create test raffle
   - Buy tickets with test ETH
   - Complete raffle flow

4. **Deploy to Base Mainnet**
   - Deploy production contracts
   - Update production config
   - Launch Base support

### Future Expansion
- **Polygon**: High-speed, low-cost raffles
- **Arbitrum**: Layer 2 scaling benefits  
- **Optimism**: OP ecosystem integration

## 🔐 Security Features

- **Reentrancy Protection**: OpenZeppelin ReentrancyGuard
- **Access Controls**: Owner-only admin functions
- **Emergency Pause**: Platform-wide safety switch
- **Commit-Reveal**: Prevents winner manipulation
- **Rate Limiting**: Spam prevention

## 📊 Platform Metrics

- **Total Raffles**: 65+ completed
- **Success Rate**: 100% fair winner selection
- **Uptime**: 99.9% availability
- **Mobile Users**: 60%+ of traffic

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Test thoroughly in development environment
4. Submit pull request with detailed description

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Links

- **Live Platform**: https://apechainraffles.io
- **ApeChain Explorer**: https://apechain.calderaexplorer.xyz
- **Base Explorer**: https://basescan.org
- **Documentation**: See `/docs` folder

---

**Built with ❤️ for the Web3 community**