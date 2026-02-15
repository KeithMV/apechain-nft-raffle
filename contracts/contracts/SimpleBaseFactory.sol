// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SimpleBaseFactory - Minimal Base Factory for Testing
 * @dev Simplified factory to isolate the 0xe1f1d02e error
 */
contract SimpleBaseFactory is Ownable, ReentrancyGuard, Pausable {
    
    uint256 public platformFee = 500; // 5%
    uint256 public constant RATE_LIMIT = 10; // 10 seconds
    
    mapping(address => uint256) public lastRaffleTime;
    uint256 public raffleCounter;
    
    event RaffleCreated(uint256 indexed raffleId, address indexed creator);
    
    constructor() {}
    
    function createRaffle(
        address nftContract,
        uint256 tokenId,
        uint256 ticketPrice,
        uint256 maxTickets,
        uint256 duration
    ) external nonReentrant whenNotPaused {
        // Basic validation
        require(nftContract != address(0), "Invalid NFT contract");
        require(ticketPrice > 0, "Invalid ticket price");
        require(maxTickets > 0 && maxTickets <= 10000, "Invalid ticket count");
        require(duration >= 3600 && duration <= 2592000, "Invalid duration");
        
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
        
        // SIMPLIFIED: Just emit event, don't create contract yet
        emit RaffleCreated(raffleCounter, msg.sender);
        raffleCounter++;
        
        // If we get here, the issue is NOT in validation
        // The issue must be in contract creation
    }
}