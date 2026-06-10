# Web3 NFT Raffle Platform

Production multi-chain raffle platform deployed at [web3raffles.io](https://web3raffles.io). 341+ raffles executed on-chain across ApeChain and Polygon.

## What It Does

Create raffles for NFTs. Users buy tickets, winner selected on-chain using commit-reveal randomness. Platform takes 5% fee.

**Live Stats:**
- 341 on-chain raffles (314 ApeChain, 27 Polygon)
- 1,372+ commits over 8 months
- 56 passing tests
- Multi-chain: ApeChain (33139) + Polygon (137)

## Architecture

**Smart Contracts** (Solidity 0.8.19)

Factory pattern using EIP-1167 minimal clones. Each raffle is a lightweight clone of the template contract.

- `RaffleFactorySecureV4`: Deploys raffle clones, validates NFT ownership, manages platform fees
- `RaffleContractSecureV3`: Individual raffle logic with commit-reveal winner selection

Deployed contracts:
- ApeChain Factory: `0x1627E7e63b63878E61f91D336385a59B1747934a`
- Polygon Factory: `0xC9Bd344f5E31481F202E400C33210Bd1AB542b42`

**Frontend** (React 19 + TypeScript)

- Wagmi v2 + Viem for Web3 interactions
- Web3Modal v5 (WalletConnect, MetaMask, Coinbase)
- 48 components, 21 custom hooks
- Craco for builds, Vitest for testing
- TailwindCSS for styling

**Infrastructure** (AWS)

- S3 + CloudFront for hosting
- Lambda for NFT image proxy
- Route 53 + ACM for DNS/SSL
- CDK for infrastructure as code
- CircleCI for CI/CD with manual production approval

## Quick Start

```bash
git clone https://github.com/KeithMV/apechain-nft-raffle.git
cd apechain-nft-raffle

# Frontend
cd frontend
yarn install
cp .env.example .env.local
# Add REACT_APP_ALCHEMY_API_KEY
yarn start:dev

# Contracts
cd ../contracts
yarn install --legacy-peer-deps
cp .env.example .env
# Add private key and RPC URLs
yarn compile
yarn test
```

## Testing

56 tests covering:
- Contract interaction hooks (useRaffleContractV4, raffleUtils)
- Input validation and security (inputSanitizer)
- UI components (CreateRafflePage, WalletConnection)
- Full user workflows (wallet connect/disconnect)
- Performance benchmarks (render timing, memoization)
- Smart contract logic (Hardhat tests)

```bash
yarn test:run        # Run all tests
yarn test:coverage   # Coverage report
```

## Security

**Contracts:**
- OpenZeppelin: ReentrancyGuard, Pausable, Ownable
- Commit-reveal pattern for winner selection
- Rate limiting (10s cooldown between raffles)
- NFT ownership verification before transfer
- Emergency pause functionality

**CI/CD:**
- Automated Slither analysis on contracts
- Frontend dependency security scans
- Manual approval gate for production
- Staging environment for testing

**Note:** Early commits contain revoked test API keys from development. All production credentials managed via CircleCI environment variables.

## Multi-Chain Support

| Network | Chain ID | Currency | Raffles |
|---------|----------|----------|---------|
| ApeChain | 33139 | APE | 314+ |
| Polygon | 137 | POL | 27+ |

Automatic network detection and switching. Fallback RPC endpoints configured for reliability.

## Project Structure

```
apechain-nft-raffle/
├── frontend/              React app with Web3 integration
├── contracts/             Solidity contracts (Hardhat + Foundry)
├── infrastructure/        AWS CDK deployment stacks
├── subgraph/              The Graph indexing (ApeChain)
├── white-label-business/  Business docs and sales materials
├── scripts/               Deployment utilities
└── .circleci/             CI/CD pipeline config
```

## Development Workflow

```
develop → staging → main (production)
```

- Staging: Fast deployment for testing
- Production: Full validation pipeline with manual approval

## What This Demonstrates

Real production Web3 application with:
- Full-stack blockchain development (Solidity → React → AWS)
- Multi-chain EVM architecture
- 341+ on-chain transactions with actual users
- Security best practices (commit-reveal, reentrancy protection)
- Automated testing and CI/CD
- 8 months of sustained development

---

Live: [web3raffles.io](https://web3raffles.io) | Built by [Keith Vose](https://github.com/KeithMV)
