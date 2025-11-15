// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "./RaffleContractSecure.sol";

/**
 * @title RaffleFactorySecure - Security-Enhanced NFT Raffle Factory
 * @dev Factory contract with fixed reentrancy and security vulnerabilities
 */
contract RaffleFactorySecure is Ownable, ReentrancyGuard, Pausable {
    
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
    
    // State variables
    mapping(uint256 => address) public raffleContracts;
    mapping(address => bool) public validRaffles;
    uint256 public raffleCounter;
    address public immutable raffleTemplate;
    
    constructor() {
        raffleTemplate = address(new RaffleContractSecure());
    }
    
    /**
     * @dev Create raffle with reentrancy protection and proper state management
     */
    function createRaffle(
        address nftContract,
        uint256 tokenId,
        uint256 ticketPrice,
        uint256 maxTickets,
        uint256 durationBlocks  // Changed to blocks for security
    ) external nonReentrant whenNotPaused {
        require(nftContract != address(0), "Invalid NFT contract");
        require(ticketPrice > 0, "Invalid ticket price");
        require(maxTickets > 0 && maxTickets <= 10000, "Invalid ticket count");
        require(durationBlocks >= 240 && durationBlocks <= 172800, "Duration 240-172800 blocks"); // ~1h to 30d
        
        // Verify NFT ownership BEFORE any state changes
        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == msg.sender, "Not NFT owner");
        require(nft.getApproved(tokenId) == address(this) || 
                nft.isApprovedForAll(msg.sender, address(this)), "Not approved");
        
        // Clone template
        address raffleContract = Clones.clone(raffleTemplate);
        
        // UPDATE STATE BEFORE EXTERNAL CALLS (reentrancy fix)
        uint256 currentRaffleId = raffleCounter;
        raffleContracts[currentRaffleId] = raffleContract;
        validRaffles[raffleContract] = true;
        raffleCounter++;
        
        // External calls AFTER state updates
        nft.transferFrom(msg.sender, raffleContract, tokenId);
        
        // Initialize raffle
        RaffleContractSecure(raffleContract).initialize(
            nftContract,
            tokenId,
            msg.sender,
            ticketPrice,
            maxTickets,
            durationBlocks,
            platformFee
        );
        
        emit RaffleCreated(
            currentRaffleId,
            msg.sender,
            nftContract,
            tokenId,
            raffleContract,
            ticketPrice,
            maxTickets
        );
    }
    
    /**
     * @dev Batch create multiple raffles (gas optimized)
     */
    function createRaffleBatch(
        address[] calldata nftContracts,
        uint256[] calldata tokenIds,
        uint256[] calldata ticketPrices,
        uint256[] calldata maxTickets,
        uint256[] calldata durationBlocks
    ) external nonReentrant whenNotPaused {
        require(nftContracts.length == tokenIds.length, "Array length mismatch");
        require(nftContracts.length == ticketPrices.length, "Array length mismatch");
        require(nftContracts.length == maxTickets.length, "Array length mismatch");
        require(nftContracts.length == durationBlocks.length, "Array length mismatch");
        require(nftContracts.length <= 10, "Max 10 raffles per batch");
        
        for(uint256 i = 0; i < nftContracts.length; i++) {
            _createSingleRaffle(
                nftContracts[i],
                tokenIds[i],
                ticketPrices[i],
                maxTickets[i],
                durationBlocks[i]
            );
        }
    }
    
    /**
     * @dev Internal function for single raffle creation
     */
    function _createSingleRaffle(
        address nftContract,
        uint256 tokenId,
        uint256 ticketPrice,
        uint256 maxTickets,
        uint256 durationBlocks
    ) internal {
        require(nftContract != address(0), "Invalid NFT contract");
        require(ticketPrice > 0, "Invalid ticket price");
        require(maxTickets > 0 && maxTickets <= 10000, "Invalid ticket count");
        require(durationBlocks >= 240 && durationBlocks <= 172800, "Invalid duration");
        
        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == msg.sender, "Not NFT owner");
        
        address raffleContract = Clones.clone(raffleTemplate);
        
        // State updates first
        uint256 currentRaffleId = raffleCounter;
        raffleContracts[currentRaffleId] = raffleContract;
        validRaffles[raffleContract] = true;
        raffleCounter++;
        
        // External calls after state updates
        nft.transferFrom(msg.sender, raffleContract, tokenId);
        
        RaffleContractSecure(raffleContract).initialize(
            nftContract,
            tokenId,
            msg.sender,
            ticketPrice,
            maxTickets,
            durationBlocks,
            platformFee
        );
        
        emit RaffleCreated(
            currentRaffleId,
            msg.sender,
            nftContract,
            tokenId,
            raffleContract,
            ticketPrice,
            maxTickets
        );
    }
    
    /**
     * @dev View functions
     */
    function getRaffleContract(uint256 raffleId) external view returns (address) {
        return raffleContracts[raffleId];
    }
    
    function isValidRaffle(address raffleContract) external view returns (bool) {
        return validRaffles[raffleContract];
    }
    
    function getRaffleCount() external view returns (uint256) {
        return raffleCounter;
    }
    
    /**
     * @dev Admin functions with enhanced security
     */
    function updatePlatformFee(uint256 _fee) external onlyOwner {
        require(_fee <= MAX_FEE, "Fee too high");
        platformFee = _fee;
        emit FeeUpdated(_fee);
    }
    
    function emergencyPause() external onlyOwner {
        _pause();
    }
    
    function emergencyUnpause() external onlyOwner {
        _unpause();
    }
    
    function withdrawFees() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    function pauseRaffle(address raffleContract) external onlyOwner {
        require(validRaffles[raffleContract], "Invalid raffle");
        RaffleContractSecure(raffleContract).emergencyPause();
    }
    
    function unpauseRaffle(address raffleContract) external onlyOwner {
        require(validRaffles[raffleContract], "Invalid raffle");
        RaffleContractSecure(raffleContract).emergencyUnpause();
    }
    
    /**
     * @dev Handle raffle completion
     */
    function handleRaffleCompletion(uint256 raffleId, address winner) external {
        require(validRaffles[msg.sender], "Unauthorized");
        emit RaffleCompleted(raffleId, winner, msg.sender);
    }
    
    /**
     * @dev Secure fee collection
     */
    receive() external payable {
        require(validRaffles[msg.sender], "Unauthorized");
    }
    
    fallback() external payable {
        revert("Function not found");
    }
}