// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title SimpleMonolithicFactory - Simplified version without complex modifiers
 */
contract SimpleMonolithicFactory {
    
    uint256 public platformFee = 500; // 5%
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
    
    mapping(uint256 => Raffle) public raffles;
    mapping(address => uint256) public lastRaffleTime;
    uint256 public raffleCounter;
    address public owner;
    
    event RaffleCreated(uint256 indexed raffleId, address indexed creator);
    
    constructor() {
        owner = msg.sender;
    }
    
    function createRaffle(
        address nftContract,
        uint256 tokenId,
        uint256 ticketPrice,
        uint256 maxTickets,
        uint256 duration
    ) external {
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
        
        // NFT validation
        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == msg.sender, "Not NFT owner");
        require(
            nft.isApprovedForAll(msg.sender, address(this)) || 
            nft.getApproved(tokenId) == address(this),
            "NFT not approved"
        );
        
        // Transfer NFT
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
        
        emit RaffleCreated(raffleCounter, msg.sender);
        raffleCounter++;
    }
    
    // Compatibility functions
    function getRaffleContract(uint256 raffleId) external view returns (address) {
        return address(this);
    }
    
    function isValidRaffle(address raffleContract) external view returns (bool) {
        return raffleContract == address(this);
    }
    
    function getCreatorRaffles(address creator) external view returns (uint256[] memory) {
        // Simplified - return empty array for now
        uint256[] memory empty;
        return empty;
    }
    
    function updatePlatformFee(uint256 _fee) external {
        require(msg.sender == owner, "Only owner");
        require(_fee <= 2000, "Fee too high");
        platformFee = _fee;
    }
}