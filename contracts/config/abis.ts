// Contract ABIs for ApeCoin NFT Raffle System

export const RAFFLE_FACTORY_ABI = [
  "function createRaffle(address nftContract, uint256 tokenId, uint256 ticketPrice, uint256 maxTickets, uint256 duration) external",
  "function getRaffleContract(uint256 raffleId) external view returns (address)",
  "function isValidRaffle(address raffleContract) external view returns (bool)",
  "function platformFee() external view returns (uint256)",
  "function raffleCounter() external view returns (uint256)",
  "function updatePlatformFee(uint256 _fee) external",
  "function withdrawFees() external",
  "event RaffleCreated(uint256 indexed raffleId, address indexed creator, address indexed nftContract, uint256 tokenId, address raffleContract, uint256 ticketPrice, uint256 maxTickets)",
  "event RaffleCompleted(uint256 indexed raffleId, address indexed winner, address raffleContract)"
];

export const RAFFLE_CONTRACT_ABI = [
  "function buyTickets(uint256 quantity) external payable",
  "function selectWinner() external",
  "function cancelRaffle() external",
  "function getRaffleInfo() external view returns (tuple(address nftContract, uint256 tokenId, address creator, uint256 ticketPrice, uint256 maxTickets, uint256 ticketsSold, uint256 endTime, address winner, bool completed, uint256 platformFee))",
  "function getParticipantCount() external view returns (uint256)",
  "function isActive() external view returns (bool)",
  "function ticketsPurchased(address user) external view returns (uint256)",
  "event TicketsPurchased(address indexed buyer, uint256 quantity, uint256 totalSpent)",
  "event WinnerSelected(address indexed winner, uint256 randomSeed)",
  "event RaffleCompleted(address indexed winner, uint256 totalSales)"
];