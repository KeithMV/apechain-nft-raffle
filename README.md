# 🎯 Web3 NFT Raffle Platform

> **A production multi-chain NFT raffle platform with 341+ on-chain raffles and active revenue**

[![Live Platform](https://img.shields.io/badge/🌐_Live-web3raffles.io-success)](https://web3raffles.io)
[![On-Chain Raffles](https://img.shields.io/badge/🎫_On--Chain_Raffles-341+-brightgreen)](https://web3raffles.io)
[![Multi-Chain](https://img.shields.io/badge/🌐_Multi--Chain-ApeChain_+_Polygon-blue)](https://github.com/KeithMV/apechain-nft-raffle)
[![Tests](https://img.shields.io/badge/🧪_Tests-56_Passing-green)](https://github.com/KeithMV/apechain-nft-raffle)
[![Build](https://img.shields.io/badge/🚀_CI/CD-CircleCI-brightgreen)](https://app.circleci.com/pipelines/github/KeithMV/apechain-nft-raffle)

This is a live production platform — 341+ raffles executed on-chain, real users, real revenue, deployed across two EVM networks.

---

## 📊 Platform Numbers

| Metric | Value |
|--------|-------|
| **On-Chain Raffles** | 341+ (314 ApeChain, 27 Polygon) |
| **Revenue Model** | 5% platform fee on all raffle sales |
| **Commits** | 1,322+ over 8 months |
| **Test Suite** | 56 tests across 7 test files |
| **Components** | 48 React components |
| **Custom Hooks** | 21 specialized hooks |
| **CI/CD Pipeline** | 2 workflows, 10 jobs, manual prod approval |
| **Networks** | ApeChain (33139) + Polygon (137) |

---

## 🏗️ Architecture

### Smart Contracts (Solidity ^0.8.19)

**Factory Pattern** — A factory deploys minimal clones of a raffle template for each new raffle.

```
RaffleFactorySecureV4 (Factory)
├── Clones raffle template via EIP-1167
├── Validates NFT ownership + approval before creation
├── Rate limiting (10s cooldown)
├── Emergency pause/unpause
├── NFT blacklisting
└── Platform fee management (5%, max 20%)

RaffleContractSecureV3 (Template)
├── Commit-reveal randomness for winner selection
├── Multi-source entropy fallback
├── Reentrancy protection (OpenZeppelin)
├── Auto-complete on sellout
├── Platform fees sent directly to factory owner
└── Creator can cancel if 0 tickets sold
```

**Deployed Contracts:**
| Network | Factory | Template |
|---------|---------|----------|
| ApeChain | `0x1627E7e63b63878E61f91D336385a59B1747934a` | `0x242f56507BFd5034b369418A7C9FB1b4643710a4` |
| Polygon | `0xC9Bd344f5E31481F202E400C33210Bd1AB542b42` | `0x7487bb0DdAd2d7ff7C59869536cbDcEBAd29D55e` |

### Frontend (React 19 + TypeScript 5.9)

```
frontend/src/
├── components/     48 React components
├── hooks/          21 custom hooks (Web3, caching, transactions)
├── services/       NFT metadata, image proxy, winner selection
├── config/         Wagmi, environment detection, feature flags
├── constants/      Chain IDs, architecture config
├── contexts/       Network context
├── contracts/      ABIs and contract interfaces
├── types/          TypeScript interfaces
└── utils/          Security, error handling, performance
```

**Key technical decisions:**
- **Wagmi v2 + Viem** for type-safe contract interactions
- **Web3Modal v5** with WalletConnect, MetaMask, Coinbase Wallet
- **Multi-chain config** — automatic chain detection and switching
- **Craco + Vite** — Craco for builds, Vite for testing (Vitest)
- **TailwindCSS** — utility-first, mobile-first responsive design

### Infrastructure (AWS CDK)

```
AWS Production
├── S3 + CloudFront (frontend hosting, OAC)
├── Lambda (NFT image proxy)
├── Route 53 (DNS)
├── ACM (SSL certificates)
└── CDK Stacks: Production, Staging, White-Label

CI/CD (CircleCI)
├── Staging Pipeline: install → build → deploy (fast)
└── Production Pipeline: install → lint → test → security scan →
    build → contract compile → contract test → contract security →
    infra validate → manual approval → deploy
```

### Subgraph (The Graph)

On-chain indexing for raffle events on ApeChain — tracks `RaffleCreated` events for queryable raffle data.

---

## 🛡️ Security

**Smart Contract:**
- OpenZeppelin ReentrancyGuard, Pausable, Ownable
- Commit-reveal pattern prevents winner manipulation
- Multi-source entropy fallback (block data + participant nonces)
- Rate limiting prevents spam (10s cooldown)
- NFT ownership + approval verified before transfer
- Emergency pause at factory and individual raffle level

**Frontend:**
- Input sanitization on all user inputs
- Console cleanup in production
- Log sanitization (no sensitive data leaks)
- CSRF protection considerations for Web3 dApps
- Error boundaries for graceful failure

**CI/CD:**
- Automated Slither analysis on contracts
- Frontend security scanning (dependency audit)
- Separate staging/production environments
- Manual approval gate before production deploy

### Security Improvements During Development

This repo shows the real development process, including how security issues were identified and fixed:

**CWE-798 (Hardcoded Credentials) - Fixed:**
- Early commits contain test API keys and empty wallet addresses used during initial Polygon deployment testing
- Identified in commits `7826048`, `ad52804`, `1c3c0ee`
- Fixed by moving all credentials to CircleCI encrypted environment variables
- Added .gitignore patterns to prevent future accidents

**Current Production Security:**
- All API keys managed through CircleCI secure environment variables
- No credentials in source code
- Private keys never used in production deployments
- Regular Slither security scans in CI/CD pipeline

The exposed test credentials in git history have been rotated and contained no funds. This demonstrates real-world security improvement practices.

---

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/KeithMV/apechain-nft-raffle.git
cd apechain-nft-raffle

# Frontend
cd frontend && yarn install
cp .env.example .env.local
# Add your REACT_APP_ALCHEMY_API_KEY
yarn start:dev

# Contracts
cd ../contracts && yarn install --legacy-peer-deps
cp .env.example .env
# Add your private key and RPC URLs
yarn compile && yarn test

# Infrastructure
cd ../infrastructure && yarn install
yarn build && yarn cdk synth
```

### Scripts

```bash
# Frontend
yarn start:dev            # Dev server (exposes local IP for mobile)
yarn start:staging        # Staging environment locally
yarn build:production     # Production build
yarn test:run             # Run all 56 tests
yarn test:watch           # Watch mode

# Contracts
yarn compile              # Compile Solidity
yarn test                 # Hardhat tests
yarn deploy               # Deploy to ApeChain

# On-chain verification
cd contracts && node get-raffle-count.js   # Check live raffle counts
```

---

## 🧪 Testing

**56 tests, 7 test files, all passing:**

| Category | Tests | Coverage |
|----------|-------|----------|
| Unit (hooks) | useRaffleContractV4, raffleUtils | Contract interaction logic |
| Unit (utils) | inputSanitizer | Security validation |
| Component | CreateRafflePage, WalletConnection | UI rendering + state |
| Integration | userWorkflow | Full wallet connect/disconnect flow |
| Performance | performanceTests | Render timing, memoization, debouncing |
| Contract | RaffleFactorySecureV4 | On-chain logic (Hardhat) |

```bash
yarn test:run        # 56 tests in 3s
yarn test:coverage   # Coverage report
```

---

## 🌐 Multi-Chain

| | ApeChain | Polygon |
|--|----------|---------|
| **Chain ID** | 33139 | 137 |
| **Currency** | APE | POL |
| **Raffles** | 314+ | 27+ |
| **RPC** | Caldera | Alchemy |
| **Explorer** | apescan.io | polygonscan.com |

Seamless network switching — users create and participate in raffles on either network. Chain detection is automatic, with fallback RPC endpoints configured for reliability.

---

## 💼 White-Label Business

The platform includes a white-label offering with:
- **CDK infrastructure stack** for per-client deployments
- **Sales materials** — pitch deck, email templates, demo script
- **Pricing**: $8,000 setup + $850/month
- **7-day deployment guarantee**
- **Target**: 10 clients = $126,000 ARR

See `white-label-business/` for full business materials and `infrastructure/lib/white-label-stack.ts` for the deployment infrastructure.

---

## 📁 Project Structure

```
apechain-nft-raffle/
├── frontend/           React 19 + TypeScript + Wagmi v2 + TailwindCSS
├── contracts/          Solidity smart contracts (Hardhat + Foundry)
├── infrastructure/     AWS CDK stacks (prod, staging, white-label)
├── subgraph/           The Graph indexing for on-chain events
├── white-label-business/  Business materials + sales docs
├── scripts/            Deployment and verification scripts
├── .circleci/          CI/CD pipeline configuration
└── .amazonq/           AI assistant project context
```

---

## 🔧 Development Workflow

```
develop → staging → main (production)
```

- **Staging branch**: Fast pipeline (build + deploy to CloudFront)
- **Main branch**: Full validation (lint, test, security, manual approval)
- **Feature branches**: Merge to develop, promote through staging

---

## 📈 What This Project Demonstrates

- **Full-stack Web3** — Solidity contracts through React frontend to AWS infrastructure
- **Production operations** — 341+ real on-chain transactions, real revenue
- **Security engineering** — Commit-reveal randomness, reentrancy protection, automated scanning
- **DevOps** — Multi-environment CI/CD with security gates and manual approval
- **Multi-chain architecture** — Same platform, multiple EVM networks
- **Business thinking** — White-label model, platform fees, scalable infrastructure
- **Testing discipline** — 56 automated tests, performance benchmarks
- **8 months of sustained development** — 1,322+ commits, systematic improvement

---

*Last updated: May 2026 — 341+ on-chain raffles, 56 passing tests, 1,322+ commits*
