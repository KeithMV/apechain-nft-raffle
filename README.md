# ApeChain NFT Raffle Platform

Enterprise-grade decentralized raffle platform optimized for production deployment. NFT holders create raffles with professional UX and cross-platform mobile compatibility.

**Live**: [apechain-raffles.com](https://apechain-raffles.com)

## Production Architecture

**Optimized Smart Contracts:**
- Single factory contract: `0x0D0cd14b36B5FBb10F274cd3EC2FA3bBa79FC900`
- Minimal proxy pattern with 80% gas cost reduction
- Professional 35-day scanning range for optimal performance

**Enterprise Frontend:**
- React/TypeScript with optimized Wagmi v2 integration
- Cross-platform mobile Safari compatibility
- Production-ready AWS CloudFront deployment
- Zero legacy code - fully modernized codebase

**Revenue Model:**
- Automated 10% platform fee collection
- Direct smart contract fee distribution

## Production Optimizations

**Performance:**
- Optimized 35-day blockchain scanning range
- Single contract architecture eliminates legacy overhead
- Professional error handling and retry logic
- Mobile-first responsive design

**Cross-Platform Compatibility:**
- Mobile Safari connector fixes implemented
- Enhanced wallet session management
- TypeScript 5.9.3 compatibility maintained
- Zero MetaMask password prompts for unlocked wallets

**Enterprise Features:**
- Professional dashboard with clean UI
- Automated raffle discovery and management
- Production-ready deployment pipeline
- Comprehensive error handling and logging

## Security

Builds on audited patterns from previous NFT platform projects:

- Factory pattern with ReentrancyGuard
- Commit-reveal randomness (no block.timestamp dependencies)
- Safe external calls using `.call{value:}("")`
- Ownership verification at execution time
- Input validation and error handling

## Usage

**Create Raffle:**
1. Connect wallet, approve NFT transfer
2. Set ticket price/quantity/duration
3. Deploy raffle contract (NFT held in escrow)

**Buy Tickets:**
1. Browse active raffles
2. Purchase with APE tokens
3. Track entries in dashboard

**Winner Selection:**
1. Raffle ends (sold out or expired)
2. Anyone can trigger selection
3. Winner receives NFT, creator gets APE (minus fee)

## Security Fixes

**Resolved Issues:**
- Weak randomness → commit-reveal scheme
- Gas limit DoS → dynamic estimation
- Unsafe external calls → safe call pattern
- Access control gaps → runtime ownership checks
- APE decimal precision errors
- CORS issues with IPFS gateways
- Contract ABI version mismatches

**Current Protections:**
- ReentrancyGuard on all state changes
- Runtime NFT ownership verification
- Input validation and error handling
- Optimized gas usage patterns

## Network

- Chain: ApeChain (33139)
- RPC: https://apechain.calderachain.xyz/http
- Explorer: https://apechain.calderaexplorer.xyz
- Gas Token: APE

## Infrastructure

**Frontend:**
- React/TypeScript with Wagmi
- AWS S3 + CloudFront deployment
- ~$5/month hosting costs

**Backend:**
- Smart contracts handle all logic
- No traditional servers or databases
- APE token payments (no payment processors)

**Monitoring:**
- Platform fee collection tracking
- Raffle participation metrics
- User engagement analytics

## Development

```bash
# Test contracts
cd contracts
npx hardhat test

# Run frontend
cd frontend  
npm start

# Verify contracts
npx hardhat verify --network apechain <CONTRACT_ADDRESS>

# Deploy frontend
npm run build
aws s3 sync build/ s3://bucket-name/
aws cloudfront create-invalidation --distribution-id ID --paths "/*"
```

## Deployment Status

- Production smart contracts on ApeChain mainnet
- Optimized frontend with AWS CloudFront CDN
- Enterprise security implementation complete
- Professional platform fee collection active
- Single contract architecture (legacy removed)
- Optimized 35-day scanning for performance

## Contact

- Email: kmvose@gmail.com
- Demo: https://apechain-raffles.com
- Portfolio: https://keithvose.com

## Development Log

**Phase 6.5 - Enterprise Wallet Service (Latest)**
- Implemented professional `WalletConnectionService` following Web3 industry standards
- Address-first validation pattern used by Uniswap, Aave, Compound
- Mobile Safari compatibility with graceful network validation fallback
- TypeScript 5.9.3 compatibility maintained with proper type safety
- 3-second timeout protection for mobile networks
- Professional error handling with user-friendly messages

**Phase 6.4 - Mobile Safari Connector Fixes**
- Resolved persistent "Connector not connected" errors on mobile Safari
- Enhanced connection validation with explicit account passing
- Cross-platform compatibility improvements
- Professional error classification and user guidance

**Phase 6.3 - Platform Optimization**
- Single contract architecture (`0x0D0cd14b36B5FBb10F274cd3EC2FA3bBa79FC900`)
- Optimized 35-day blockchain scanning range
- Removed all legacy code and contract support
- Professional UI/UX with clean dashboard
- Production-ready deployment pipeline

**Phase 6.2 - TypeScript & Build Optimization**
- Updated to TypeScript 5.9.3 with proper Wagmi v2 compatibility
- Fixed build compilation errors and type mismatches
- Optimized wagmi configuration for mobile networks
- Enhanced error handling across all services

**Phase 6.1 - Wallet Session Management**
- Perfect wallet UX with zero MetaMask password prompts
- Enhanced session persistence and connection recovery
- Mobile-first responsive design implementation
- Professional error boundaries and logging

## Production Status

**Enterprise-Ready Deployment**: Production-optimized platform with:
- Industry-standard wallet connection patterns
- Cross-platform mobile Safari compatibility
- Professional error handling and user guidance
- Zero legacy code overhead
- Automated CI/CD pipeline
- AWS CloudFront CDN optimization

## Resources

- [AWS Resources](AWS_RESOURCES.md)
- [White-Label Business Plan](white-label-business/)
- [Platform Education](white-label-business/PLATFORM_EDUCATION.md)
- [Demo Script](white-label-business/DEMO_SCRIPT.md)

# Pipeline trigger - Enterprise wallet service deployment
