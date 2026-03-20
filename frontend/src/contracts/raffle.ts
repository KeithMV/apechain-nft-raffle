/**
 * Individual Raffle Contract ABIs
 * Contract definitions for raffle instances
 */

export const RAFFLE_CONTRACT_ABI = [
  {
    "inputs": [{"internalType": "uint256", "name": "quantity", "type": "uint256"}],
    "name": "buyTickets",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "totalQuantity", "type": "uint256"}],
    "name": "buyTicketsBatch",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "bytes32", "name": "_commitHash", "type": "bytes32"}],
    "name": "commitRandomness",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_nonce", "type": "uint256"}],
    "name": "revealAndSelectWinner",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "emergencySelectWinner",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "cancelRaffle",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTotalTickets",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getRaffleInfo",
    "outputs": [
      {
        "components": [
          {"internalType": "address", "name": "nftContract", "type": "address"},
          {"internalType": "uint256", "name": "tokenId", "type": "uint256"},
          {"internalType": "address", "name": "creator", "type": "address"},
          {"internalType": "uint256", "name": "ticketPrice", "type": "uint256"},
          {"internalType": "uint256", "name": "maxTickets", "type": "uint256"},
          {"internalType": "uint256", "name": "ticketsSold", "type": "uint256"},
          {"internalType": "uint256", "name": "endTime", "type": "uint256"},
          {"internalType": "address", "name": "winner", "type": "address"},
          {"internalType": "bool", "name": "completed", "type": "bool"},
          {"internalType": "uint256", "name": "platformFee", "type": "uint256"}
        ],
        "internalType": "struct RaffleContract.RaffleInfo",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "isActive",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
    "name": "ticketsPurchased",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "buyer", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "quantity", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "totalSpent", "type": "uint256"}
    ],
    "name": "TicketsPurchased",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "winner", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "totalSales", "type": "uint256"}
    ],
    "name": "RaffleCompleted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": false, "internalType": "uint256", "name": "tokenId", "type": "uint256"}
    ],
    "name": "RaffleCancelled",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": false, "internalType": "bytes32", "name": "commitHash", "type": "bytes32"}
    ],
    "name": "CommitSubmitted",
    "type": "event"
  }
] as const;