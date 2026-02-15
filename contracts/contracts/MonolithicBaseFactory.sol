// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MonolithicBaseFactory - All-in-One Raffle System for Base
 * @dev Embeds all raffle logic in factory to avoid contract creation issues
 */
contract MonolithicBaseFactory is Ownable, ReentrancyGuard, Pausable {
    
    uint256 public platformFee = 500; // 5%
    uint256 public constant MAX_FEE = 2000; // 20% max
    uint256 public constant MIN_DURATION = 3600; // 1 hour
    uint256 public constant MAX_DURATION = 2592000; // 30 days
    uint256 public constant MAX_TICKETS = 10000;
    uint256 public constant RATE_LIMIT = 10; // 10 seconds
    
    struct Raffle {
        address nftContract;
        uint256 tokenId;
        address creator;
        uint256 ticketPrice;
        uint256 maxTickets;
        uint256 ticketsSold;
        uint256 endTime;
        address winner;
        bool completed;
        bool exists;
    }
    
    // Events
    event RaffleCreated(
        uint256 indexed raffleId,
        address indexed creator,
        address indexed nftContract,
        uint256 tokenId,
        uint256 ticketPrice,
        uint256 maxTickets
    );
    
    event TicketsPurchased(
        uint256 indexed raffleId,
        address indexed buyer,
        uint256 quantity,
        uint256 totalSpent
    );
    
    event WinnerSelected(
        uint256 indexed raffleId,
        address indexed winner,
        uint256 winningTicket
    );
    
    event RaffleCompleted(
        uint256 indexed raffleId,
        address indexed winner,
        uint256 totalSales
    );
    
    // Storage
    mapping(uint256 => Raffle) public raffles;
    mapping(uint256 => mapping(address => uint256)) public ticketsPurchased;
    mapping(uint256 => mapping(uint256 => address)) public ticketToOwner;
    mapping(uint256 => uint256) public totalTickets;
    mapping(address => uint256) public lastRaffleTime;
    mapping(address => uint256[]) public creatorRaffles;
    
    uint256 public raffleCounter;
    
    constructor() {}
    
    function createRaffle(
        address nftContract,
        uint256 tokenId,
        uint256 ticketPrice,
        uint256 maxTickets,
        uint256 duration
    ) external nonReentrant whenNotPaused {
        // Validation
        require(nftContract != address(0), "Invalid NFT contract");
        require(ticketPrice > 0, "Invalid ticket price");
        require(maxTickets > 0 && maxTickets <= MAX_TICKETS, "Invalid ticket count");
        require(duration >= MIN_DURATION && duration <= MAX_DURATION, "Invalid duration");
        
        // Rate limiting
        require(
            block.timestamp >= lastRaffleTime[msg.sender] + RATE_LIMIT,
            "Rate limit exceeded"
        );
        lastRaffleTime[msg.sender] = block.timestamp;
        
        // Verify NFT ownership
        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == msg.sender, "Not NFT owner");
        require(
            nft.isApprovedForAll(msg.sender, address(this)) || 
            nft.getApproved(tokenId) == address(this),
            "NFT not approved"
        );
        
        // Transfer NFT to this contract
        nft.transferFrom(msg.sender, address(this), tokenId);
        
        // Create raffle
        raffles[raffleCounter] = Raffle({
            nftContract: nftContract,
            tokenId: tokenId,
            creator: msg.sender,
            ticketPrice: ticketPrice,
            maxTickets: maxTickets,
            ticketsSold: 0,
            endTime: block.timestamp + duration,
            winner: address(0),
            completed: false,
            exists: true
        });
        
        creatorRaffles[msg.sender].push(raffleCounter);
        
        emit RaffleCreated(
            raffleCounter,
            msg.sender,
            nftContract,
            tokenId,
            ticketPrice,
            maxTickets
        );
        
        raffleCounter++;
    }
    
    function buyTickets(uint256 raffleId, uint256 quantity) external payable nonReentrant {
        Raffle storage raffle = raffles[raffleId];
        require(raffle.exists, "Raffle does not exist");
        require(!raffle.completed, "Raffle completed");
        require(block.timestamp < raffle.endTime, "Raffle expired");
        require(raffle.ticketsSold < raffle.maxTickets, "Sold out");
        require(msg.sender != raffle.creator, "Creator cannot buy");
        require(quantity > 0 && quantity <= 100, "Invalid quantity");
        require(raffle.ticketsSold + quantity <= raffle.maxTickets, "Not enough tickets");
        require(msg.value == raffle.ticketPrice * quantity, "Wrong payment");
        
        // Update ticket counts
        ticketsPurchased[raffleId][msg.sender] += quantity;
        raffle.ticketsSold += quantity;
        
        // Assign tickets
        uint256 startTicket = totalTickets[raffleId];
        for(uint256 i = 0; i < quantity; i++) {
            ticketToOwner[raffleId][startTicket + i] = msg.sender;
        }
        totalTickets[raffleId] += quantity;
        
        emit TicketsPurchased(raffleId, msg.sender, quantity, msg.value);
        
        // Auto-complete if sold out
        if(raffle.ticketsSold >= raffle.maxTickets) {
            _selectWinner(raffleId);
        }
    }
    
    function selectWinner(uint256 raffleId) external nonReentrant {
        Raffle storage raffle = raffles[raffleId];
        require(raffle.exists, "Raffle does not exist");
        require(!raffle.completed, "Already completed");
        require(block.timestamp >= raffle.endTime, "Raffle still active");
        require(totalTickets[raffleId] > 0, "No participants");
        
        _selectWinner(raffleId);
    }
    
    function _selectWinner(uint256 raffleId) internal {
        Raffle storage raffle = raffles[raffleId];
        
        // Simple randomness (can be improved)
        uint256 randomSeed = uint256(keccak256(abi.encodePacked(
            block.prevrandao,
            block.timestamp,
            raffleId,
            totalTickets[raffleId]
        )));
        
        uint256 winningTicket = randomSeed % totalTickets[raffleId];
        raffle.winner = ticketToOwner[raffleId][winningTicket];
        raffle.completed = true;
        
        emit WinnerSelected(raffleId, raffle.winner, winningTicket);
        
        _distributeRewards(raffleId);
    }
    
    function _distributeRewards(uint256 raffleId) internal {
        Raffle storage raffle = raffles[raffleId];
        uint256 totalSales = raffle.ticketsSold * raffle.ticketPrice;
        uint256 platformFeeAmount = (totalSales * platformFee) / 10000;
        uint256 creatorAmount = totalSales - platformFeeAmount;
        
        // Transfer NFT to winner
        IERC721(raffle.nftContract).transferFrom(address(this), raffle.winner, raffle.tokenId);
        
        // Transfer ETH to creator
        if(creatorAmount > 0) {
            (bool success, ) = payable(raffle.creator).call{value: creatorAmount}("");
            require(success, "Creator transfer failed");
        }
        
        // Transfer platform fee to owner
        if(platformFeeAmount > 0) {
            (bool success, ) = payable(owner()).call{value: platformFeeAmount}("");
            require(success, "Fee transfer failed");
        }
        
        emit RaffleCompleted(raffleId, raffle.winner, totalSales);
    }
    
    // View functions
    function getRaffle(uint256 raffleId) external view returns (Raffle memory) {
        return raffles[raffleId];
    }
    
    function getRaffleContract(uint256 raffleId) external view returns (address) {
        // Return this contract address for compatibility
        return address(this);
    }
    
    function isValidRaffle(address raffleContract) external view returns (bool) {
        // Always return true for this contract
        return raffleContract == address(this);
    }
    
    function getCreatorRaffles(address creator) external view returns (uint256[] memory) {
        return creatorRaffles[creator];
    }
    
    function isActive(uint256 raffleId) external view returns (bool) {
        Raffle storage raffle = raffles[raffleId];
        return raffle.exists && 
               !raffle.completed && 
               block.timestamp < raffle.endTime && 
               raffle.ticketsSold < raffle.maxTickets;
    }
    
    // Admin functions
    function updatePlatformFee(uint256 _fee) external onlyOwner {
        require(_fee <= MAX_FEE, "Fee too high");
        platformFee = _fee;
    }
    
    function emergencyPause() external onlyOwner {
        _pause();
    }
    
    function emergencyUnpause() external onlyOwner {
        _unpause();
    }
    
    function emergencyWithdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
}