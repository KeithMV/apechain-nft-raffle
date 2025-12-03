// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "./RaffleContractSecureV3.sol";

/**
 * @title RaffleFactorySecureV3 - Fixed Platform Fee Collection
 * @dev Factory contract with direct fee transfer to owner
 */
contract RaffleFactorySecureV3 is Ownable, ReentrancyGuard, Pausable {
    
    uint256 public platformFee = 1000; // 10%
    uint256 public constant MAX_FEE = 2000; // 20% max
    uint256 public constant MIN_DURATION = 3600; // 1 hour
    uint256 public constant MAX_DURATION = 2592000; // 30 days
    uint256 public constant MAX_TICKETS = 10000;
    
    // Events
    event RaffleCreated(
        uint256 indexed raffleId,
        address indexed creator,
        address indexed nftContract,
        uint256 tokenId,
        address raffleContract,
        uint256 ticketPrice,
        uint256 maxTickets
    );
    
    event RaffleCompleted(
        uint256 indexed raffleId,
        address indexed winner,
        address raffleContract
    );
    
    event FeeUpdated(uint256 newFee);
    event EmergencyPause(address indexed admin);
    event EmergencyUnpause(address indexed admin);
    
    // Enhanced tracking
    mapping(uint256 => address) public raffleContracts;
    mapping(address => bool) public validRaffles;
    mapping(address => uint256[]) public creatorRaffles;
    mapping(address => bool) public blacklistedNFTs;
    
    uint256 public raffleCounter;
    address public immutable raffleTemplate;
    
    // Rate limiting
    mapping(address => uint256) public lastRaffleTime;
    uint256 public constant RATE_LIMIT = 300; // 5 minutes between raffles
    
    constructor() {
        raffleTemplate = address(new RaffleContractSecureV3());
    }
    
    function createRaffle(
        address nftContract,
        uint256 tokenId,
        uint256 ticketPrice,
        uint256 maxTickets,
        uint256 duration
    ) external nonReentrant whenNotPaused {
        // Enhanced validation
        require(nftContract != address(0), "Invalid NFT contract");
        require(!blacklistedNFTs[nftContract], "NFT contract blacklisted");
        require(ticketPrice > 0, "Invalid ticket price");
        require(maxTickets > 0 && maxTickets <= MAX_TICKETS, "Invalid ticket count");
        require(duration >= MIN_DURATION && duration <= MAX_DURATION, "Invalid duration");
        
        // Rate limiting
        require(
            block.timestamp >= lastRaffleTime[msg.sender] + RATE_LIMIT,
            "Rate limit exceeded"
        );
        lastRaffleTime[msg.sender] = block.timestamp;
        
        // Verify NFT ownership before proceeding
        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == msg.sender, "Not NFT owner");
        require(
            nft.isApprovedForAll(msg.sender, address(this)) || 
            nft.getApproved(tokenId) == address(this),
            "NFT not approved"
        );
        
        // Clone raffle template
        address raffleContract = Clones.clone(raffleTemplate);
        
        // Transfer NFT to raffle contract
        nft.transferFrom(msg.sender, raffleContract, tokenId);
        
        // Initialize raffle
        RaffleContractSecureV3(raffleContract).initialize(
            nftContract,
            tokenId,
            msg.sender,
            ticketPrice,
            maxTickets,
            duration,
            platformFee
        );
        
        // Store mappings
        raffleContracts[raffleCounter] = raffleContract;
        validRaffles[raffleContract] = true;
        creatorRaffles[msg.sender].push(raffleCounter);
        
        emit RaffleCreated(
            raffleCounter,
            msg.sender,
            nftContract,
            tokenId,
            raffleContract,
            ticketPrice,
            maxTickets
        );
        
        raffleCounter++;
    }
    
    function getRaffleContract(uint256 raffleId) external view returns (address) {
        return raffleContracts[raffleId];
    }
    
    function isValidRaffle(address raffleContract) external view returns (bool) {
        return validRaffles[raffleContract];
    }
    
    function getCreatorRaffles(address creator) external view returns (uint256[] memory) {
        return creatorRaffles[creator];
    }
    
    function updatePlatformFee(uint256 _fee) external onlyOwner {
        require(_fee <= MAX_FEE, "Fee too high");
        platformFee = _fee;
        emit FeeUpdated(_fee);
    }
    
    function blacklistNFT(address nftContract, bool blacklisted) external onlyOwner {
        blacklistedNFTs[nftContract] = blacklisted;
    }
    
    function emergencyPause() external onlyOwner {
        _pause();
        emit EmergencyPause(msg.sender);
    }
    
    function emergencyUnpause() external onlyOwner {
        _unpause();
        emit EmergencyUnpause(msg.sender);
    }
    
    function pauseRaffle(address raffleContract) external onlyOwner {
        require(validRaffles[raffleContract], "Invalid raffle");
        RaffleContractSecureV3(raffleContract).emergencyPause();
    }
    
    function unpauseRaffle(address raffleContract) external onlyOwner {
        require(validRaffles[raffleContract], "Invalid raffle");
        RaffleContractSecureV3(raffleContract).emergencyUnpause();
    }
    
    function handleRaffleCompletion(uint256 raffleId, address winner) external {
        require(validRaffles[msg.sender], "Unauthorized");
        emit RaffleCompleted(raffleId, winner, msg.sender);
    }
    
    // NOTE: No withdrawFees() function needed - fees go directly to owner
    // Emergency withdrawal only for any accidentally sent funds
    function emergencyWithdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    receive() external payable {
        // Only accept payments from valid raffles (shouldn't happen with V3)
        require(validRaffles[msg.sender], "Unauthorized");
    }
}