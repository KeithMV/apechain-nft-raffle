// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title TestRaffleSystem - Debug version without NFT transfer
 */
contract TestRaffleSystem {
    
    uint256 public constant PLATFORM_FEE = 500;
    uint256 public constant RATE_LIMIT = 10;
    uint256 public constant MIN_DURATION = 3600;
    uint256 public constant MAX_DURATION = 2592000;
    uint16 public constant MAX_TICKETS = 10000;
    uint256 public constant MAX_RAFFLE_VALUE = 10 ether;
    
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status = _NOT_ENTERED;
    
    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }
    
    address public owner;
    bool public emergencyPaused;
    mapping(address => uint256) public lastRaffleTime;
    uint256 public raffleCounter;
    
    modifier whenNotPaused() {
        require(!emergencyPaused, "Emergency paused");
        _;
    }
    
    modifier valueLimited(uint256 value) {
        require(value <= MAX_RAFFLE_VALUE, "Value too high");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    function createRaffle(
        address nftContract,
        uint32 tokenId,
        uint96 ticketPrice,
        uint16 maxTickets,
        uint24 duration
    ) external nonReentrant whenNotPaused valueLimited(uint256(ticketPrice) * maxTickets) {
        // Basic validation only - NO NFT INTERACTION
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
        
        // Just increment counter - NO NFT TRANSFER
        raffleCounter++;
        
        // Emit event to confirm it worked
        emit TestRaffleCreated(raffleCounter - 1, msg.sender, nftContract, tokenId);
    }
    
    event TestRaffleCreated(uint256 indexed raffleId, address indexed creator, address indexed nftContract, uint32 tokenId);
    
    function platformFee() external pure returns (uint256) {
        return PLATFORM_FEE;
    }
}