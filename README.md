# ApeCoin NFT Raffle System

A decentralized raffle platform for NFTs on ApeChain, allowing users to raffle expensive NFTs for affordable APE tickets.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MetaMask or compatible wallet
- APE tokens for gas fees
- NFTs to raffle

### Deployment

1. **Clone and setup:**
```bash
git clone <your-repo>
cd apechain-nft-raffle
```

2. **Deploy contracts:**
```bash
cd contracts
npm install
# Add your private key to .env file
echo "DEPLOYER_PRIVATE_KEY=your_private_key_here" > .env
npx hardhat run scripts/deploy.js --network apechain
```

3. **Update frontend config:**
```bash
# Copy deployed addresses to frontend/src/config/addresses.ts
cd ../frontend
npm install
npm run build
```

4. **Run locally:**
```bash
npm start
```

## 🏗️ Architecture

Built using factory pattern with template cloning for gas efficiency:

- **RaffleFactory**: Creates individual raffle instances
- **RaffleContract**: Template for individual raffles  
- **Frontend**: React/TypeScript with Wagmi integration

## 💰 Revenue Model

- 10% platform fee on all ticket sales
- Automated fee collection and distribution
- Configurable fee structure (owner only)

## 🔧 Technical Features

- **Gas Optimized**: Template cloning reduces deployment costs
- **Provably Fair**: On-chain random winner selection
- **Secure Escrow**: NFTs held safely until winner selected
- **Real-time Updates**: Live raffle tracking and notifications

## 📊 Code Reuse

This project reuses 80% of the codebase from the proven ApeChain NFT Fractionalization platform:

- ✅ Smart contract architecture and security patterns
- ✅ Frontend services and transaction handling  
- ✅ UI components and styling
- ✅ Deployment and infrastructure setup

## 🎯 User Flows

### Create Raffle
1. Connect wallet to ApeChain
2. Approve NFT contract for transfers
3. Set ticket price, quantity, and duration
4. Deploy raffle and transfer NFT to escrow

### Buy Tickets  
1. Browse active raffles
2. Select quantity and buy tickets with APE
3. Track participation in dashboard
4. Automatic winner notification

### Winner Selection
1. Raffle ends when sold out or time expires
2. Anyone can trigger winner selection
3. Random winner chosen on-chain
4. NFT automatically transferred to winner
5. APE revenue distributed to creator (minus 10% fee)

## 🔐 Security Features

- **ReentrancyGuard**: Prevents reentrancy attacks
- **Ownership Verification**: Only NFT owners can create raffles
- **Escrow System**: NFTs held safely in contract
- **Gas Limits**: Prevents out-of-gas failures
- **Input Validation**: Sanitized user inputs

## 🌐 Network Configuration

- **Chain**: ApeChain (33139)
- **RPC**: https://apechain.calderachain.xyz/http
- **Explorer**: https://apechain.calderaexplorer.xyz
- **Gas Token**: APE

## 📈 Business Metrics

- Platform fee revenue per raffle
- Total raffle volume and participation
- User retention and engagement
- NFT price discovery through raffle mechanics

## 🛠️ Development

### Local Testing
```bash
# Test contracts
cd contracts
npx hardhat test

# Run frontend
cd frontend  
npm start
```

### Contract Verification
```bash
npx hardhat verify --network apechain <CONTRACT_ADDRESS>
```

## 📞 Support

Built on proven architecture from ApeChain NFT Fractionalization platform. 

For technical support or partnership inquiries, contact the development team.# Pipeline Test Tue Sep 30 00:34:35 UTC 2025
