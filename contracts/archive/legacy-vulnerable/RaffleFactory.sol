// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "./RaffleContract.sol";

/**
 * @title RaffleFactory - NFT Raffle Platform
 * @dev Factory contract for creating individual NFT raffles
 * Key Features:
 * - Factory pattern with template cloning for gas efficiency
 * - 10% platform fee on all ticket sales
 * - Automated raffle management
 * - Secure NFT escrow system
 */
contract RaffleFactory is Ownable, ReentrancyGuard, Pausable {
    
    // Platform fee (10% in basis points)
    uint256 public platformFee = 1000; // 10%
    uint256 public constant MAX_FEE = 2000; // 20% max
    
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
    
    // Mapping to track raffle contracts
    mapping(uint256 => address) public raffleContracts;
    mapping(address => bool) public validRaffles;
    
    // Raffle counter
    uint256 public raffleCounter;
    
    // Template contract for cloning
    address public immutable raffleTemplate;
    
    constructor() {
        // Deploy template contract for cloning
        raffleTemplate = address(new RaffleContract());
    }
    
    /**
     * @dev Create a new NFT raffle
     * @param nftContract Address of the NFT contract
     * @param tokenId ID of the NFT to raffle
     * @param ticketPrice Price per ticket in APE
     * @param maxTickets Maximum number of tickets
     * @param duration Duration of raffle in seconds
     */
    function createRaffle(
        address nftContract,
        uint256 tokenId,
        uint256 ticketPrice,
        uint256 maxTickets,
        uint256 duration
    ) external nonReentrant whenNotPaused {
        require(nftContract != address(0), "Invalid NFT contract");
        require(ticketPrice > 0, "Invalid ticket price");
        require(maxTickets > 0 && maxTickets <= 10000, "Invalid ticket count");
        require(duration >= 3600 && duration <= 2592000, "Duration 1h-30d"); // 1 hour to 30 days
        
        // Clone raffle template first
        address raffleContract = Clones.clone(raffleTemplate);
        
        // Transfer NFT first (will revert if not owner)
        IERC721 nft = IERC721(nftContract);
        nft.transferFrom(msg.sender, raffleContract, tokenId);
        
        // Initialize raffle after successful transfer
        RaffleContract(raffleContract).initialize(
            nftContract,
            tokenId,
            msg.sender,
            ticketPrice,
            maxTickets,
            duration,
            platformFee
        );
        
        // Store mapping
        raffleContracts[raffleCounter] = raffleContract;
        validRaffles[raffleContract] = true;
        
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
    
    /**
     * @dev Get raffle contract address by ID
     */
    function getRaffleContract(uint256 raffleId) external view returns (address) {
        return raffleContracts[raffleId];
    }
    
    /**
     * @dev Check if address is a valid raffle contract
     */
    function isValidRaffle(address raffleContract) external view returns (bool) {
        return validRaffles[raffleContract];
    }
    
    /**
     * @dev Update platform fee (owner only)
     */
    function updatePlatformFee(uint256 _fee) external onlyOwner {
        require(_fee <= MAX_FEE, "Fee too high");
        platformFee = _fee;
        emit FeeUpdated(_fee);
    }
    
    /**
     * @dev Emergency pause all operations (owner only)
     */
    function emergencyPause() external onlyOwner {
        _pause();
        emit EmergencyPause(msg.sender);
    }
    
    /**
     * @dev Resume operations after pause (owner only)
     */
    function emergencyUnpause() external onlyOwner {
        _unpause();
        emit EmergencyUnpause(msg.sender);
    }
    
    /**
     * @dev Withdraw collected fees (owner only)
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        payable(owner()).transfer(balance);
    }
    
    /**
     * @dev Emergency pause specific raffle (owner only)
     */
    function pauseRaffle(address raffleContract) external onlyOwner {
        require(validRaffles[raffleContract], "Invalid raffle");
        RaffleContract(raffleContract).emergencyPause();
    }
    
    /**
     * @dev Emergency unpause specific raffle (owner only)
     */
    function unpauseRaffle(address raffleContract) external onlyOwner {
        require(validRaffles[raffleContract], "Invalid raffle");
        RaffleContract(raffleContract).emergencyUnpause();
    }
    
    /**
     * @dev Handle raffle completion (called by raffle contracts)
     */
    function handleRaffleCompletion(uint256 raffleId, address winner) external {
        require(validRaffles[msg.sender], "Unauthorized");
        emit RaffleCompleted(raffleId, winner, msg.sender);
    }
    
    /**
     * @dev Receive platform fees from raffle contracts
     */
    receive() external payable {
        require(validRaffles[msg.sender], "Unauthorized");
    }
}