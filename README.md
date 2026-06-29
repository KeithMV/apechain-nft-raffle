# Web3 NFT Raffle Platform

Production multi-chain raffle platform deployed at [web3raffles.io](https://web3raffles.io).

## What It Does

Create raffles for NFTs. Users buy tickets, winner selected on-chain using commit-reveal randomness. Platform takes 5% fee.

**Stats:**
- 341+ on-chain raffles
- Multi-chain: ApeChain + Polygon

## Architecture

**Smart Contracts**

Factory pattern using EIP-1167 minimal clones. Each raffle is a lightweight clone of the template contract.

- Factory: Deploys raffle clones, validates NFT ownership, manages platform fees
- Raffle: Individual raffle logic with commit-reveal winner selection

Deployed on ApeChain and Polygon mainnets.

**Frontend**

- React + TypeScript
- Wagmi + Viem for Web3 interactions
- Web3Modal (WalletConnect, MetaMask, Coinbase)
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

Test coverage includes contract interactions, input validation, UI components, user workflows, and smart contract logic.

```bash
yarn test:run        # Run all tests
yarn test:coverage   # Coverage report
```

## Security

**Contracts:**
- OpenZeppelin: ReentrancyGuard, Pausable, Ownable
- Commit-reveal pattern for winner selection (VRF integration in progress)
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

## Troubleshooting

### High Gas Fees on Desktop

If you see unusually high gas estimates in MetaMask desktop:

**Cause:** MetaMask uses its own configured RPC endpoint (not the dApp's) for gas estimation.

**Solution:**
1. Open MetaMask → Settings → Networks
2. Select the network (ApeChain or Polygon)
3. Update RPC URL to:
   - **ApeChain**: `https://rpc.apechain.com`
   - **Polygon**: `https://polygon-rpc.com`
4. Save and retry your transaction

Gas estimates should now be accurate.

**Note:** MetaMask mobile browser works correctly by default.

## Operating Costs

**Monthly: ~$3-5**
- CloudFront: ~$1-2 (CDN bandwidth)
- S3: <$1 (static hosting)
- Route 53: $0.50 per hosted zone
- Lambda: <$1 (image proxy, low traffic)
- Alchemy API: Free tier (300M compute units/month)

Domain and SSL certificates managed through Route 53 and ACM (AWS Certificate Manager).

---

Live: [web3raffles.io](https://web3raffles.io) | Built by [Keith Vose](https://github.com/KeithMV)
