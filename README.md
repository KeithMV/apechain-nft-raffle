# ApeChain NFT Raffle Platform

A decentralized raffle platform where NFT holders can create raffles for their assets. Built on ApeChain with React frontend and Solidity smart contracts.

**Live**: [apechain-raffles.com](https://apechain-raffles.com)

## Architecture

**Smart Contracts:**
- `RaffleFactory.sol` - Creates raffle instances using minimal proxy pattern
- `RaffleContract.sol` - Individual raffle logic with NFT escrow
- Factory pattern reduces deployment gas costs by ~80%

**Frontend:**
- React/TypeScript with Wagmi for Web3 integration
- Direct blockchain reads (no backend API)
- AWS S3 + CloudFront deployment

**Revenue:**
- 10% platform fee collected automatically on ticket sales
- Fees sent directly to owner wallet via smart contract

## Technical Implementation

**Randomness:**
- Commit-reveal scheme for fair winner selection
- Prevents manipulation through on-chain entropy

**Gas Optimization:**
- Minimal proxy cloning pattern
- Efficient storage layouts using mappings

**NFT Metadata Handling:**
- Multi-gateway IPFS fallback for reliability
- CORS proxy fallback for SSL issues
- 12s timeout with intelligent caching
- Dual ABI support for contract compatibility

**Event Processing:**
- Scans 200k block ranges for raffle discovery
- Handles both old and new contract formats
- Optimized batch processing for large datasets

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

## Status

- Smart contracts deployed to ApeChain mainnet
- Frontend live on AWS with CDN
- Security issues resolved
- 10% platform fee implemented
- Handles multiple contract versions
- 200k block scanning for raffle discovery

## Contact

- Email: kmvose@gmail.com
- Demo: https://apechain-raffles.com
- Portfolio: https://keithvose.com

## Resources

- [AWS Resources](AWS_RESOURCES.md)
- [White-Label Business Plan](white-label-business/)
- [Platform Education](white-label-business/PLATFORM_EDUCATION.md)
- [Demo Script](white-label-business/DEMO_SCRIPT.md)# Pipeline trigger Sun Nov 16 19:59:59 PST 2025
