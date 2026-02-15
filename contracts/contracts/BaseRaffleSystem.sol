// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title BaseRaffleSystem - L2-Optimized Raffle Platform
 * @dev Built specifically for Base network with custom security patterns
 */
contract BaseRaffleSystem {
    
    // ============ CONSTANTS ============
    uint256 public constant PLATFORM_FEE = 500; // 5% in basis points
    uint256 public constant MAX_FEE = 2000; // 20% max
    uint256 public constant RATE_LIMIT = 10; // 10 seconds
    uint256 public constant MIN_DURATION = 3600; // 1 hour
    uint256 public constant MAX_DURATION = 2592000; // 30 days
    uint16 public constant MAX_TICKETS = 10000;
    uint256 public constant MAX_RAFFLE_VALUE = 10 ether; // Risk limit
    
    // ============ CUSTOM SECURITY ============
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status = _NOT_ENTERED;
    
    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }
    
    // ============ ACCESS CONTROL ============
    address public owner;
    mapping(address => bool) public operators;
    bool public emergencyPaused;
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier onlyOperator() {
        require(operators[msg.sender] || msg.sender == owner, "Not operator");
        _;
    }
    
    modifier whenNotPaused() {
        require(!emergencyPaused, "Emergency paused");
        _;
    }
    
    modifier valueLimited(uint256 value) {
        require(value <= MAX_RAFFLE_VALUE, "Value too high");
        _;
    }
    
    // ============ OPTIMIZED STORAGE ============
    struct Raffle {
        address creator;        // 20 bytes
        address nftContract;    // 20 bytes
        uint96 ticketPrice;     // 12 bytes (enough for ETH amounts)
        uint32 endTime;         // 4 bytes (timestamps until 2106)
        uint32 tokenId;         // 4 bytes (most NFTs)
        uint16 maxTickets;      // 2 bytes (up to 65k tickets)
        uint16 ticketsSold;     // 2 bytes
        bool completed;         // 1 byte
        bool exists;            // 1 byte
        address winner;         // 20 bytes (separate slot)
    }
    
    // ============ STATE VARIABLES ============
    mapping(uint256 => Raffle) public raffles;
    mapping(uint256 => mapping(uint256 => address)) public ticketOwners;
    mapping(uint256 => mapping(address => uint16)) public userTickets;
    mapping(address => uint256) public lastRaffleTime;
    mapping(address => uint256[]) public creatorRaffles;
    
    uint256 public raffleCounter;
    uint256 public totalFeesCollected;
    
    // ============ EVENTS ============
    event RaffleCreated(
        uint256 indexed raffleId,
        address indexed creator,
        address indexed nftContract,
        uint32 tokenId,
        uint96 ticketPrice,
        uint16 maxTickets,
        uint32 endTime
    );
    
    event TicketsPurchased(
        uint256 indexed raffleId,
        address indexed buyer,
        uint16 quantity,
        uint16 startTicket,
        uint256 totalCost
    );
    
    event WinnerSelected(
        uint256 indexed raffleId,
        address indexed winner,
        uint16 winningTicket,
        uint256 prizeAmount
    );
    
    event RaffleCompleted(
        uint256 indexed raffleId,
        address indexed winner,
        uint256 totalSales,
        uint256 platformFee
    );
    
    event EmergencyAction(string action, address indexed admin);
    
    // ============ CONSTRUCTOR ============
    constructor() {
        owner = msg.sender;
        operators[msg.sender] = true;
    }
    
    // ============ CORE FUNCTIONS ============
    
    function createRaffle(
        address nftContract,
        uint32 tokenId,
        uint96 ticketPrice,
        uint16 maxTickets,
        uint24 duration
    ) external nonReentrant whenNotPaused valueLimited(uint256(ticketPrice) * maxTickets) {
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
        uint32 endTime = uint32(block.timestamp + duration);
        raffles[raffleCounter] = Raffle({
            creator: msg.sender,
            nftContract: nftContract,
            ticketPrice: ticketPrice,
            endTime: endTime,
            tokenId: tokenId,
            maxTickets: maxTickets,
            ticketsSold: 0,
            completed: false,
            exists: true,
            winner: address(0)
        });
        
        creatorRaffles[msg.sender].push(raffleCounter);
        
        emit RaffleCreated(
            raffleCounter,
            msg.sender,
            nftContract,
            tokenId,
            ticketPrice,
            maxTickets,
            endTime
        );
        
        raffleCounter++;
    }
    
    function buyTickets(
        uint256 raffleId,
        uint16 quantity
    ) external payable nonReentrant whenNotPaused {
        Raffle storage raffle = raffles[raffleId];
        require(raffle.exists, "Raffle does not exist");
        require(!raffle.completed, "Raffle completed");
        require(block.timestamp < raffle.endTime, "Raffle expired");
        require(raffle.ticketsSold < raffle.maxTickets, "Sold out");
        require(msg.sender != raffle.creator, "Creator cannot buy");
        require(quantity > 0 && quantity <= 100, "Invalid quantity");
        require(raffle.ticketsSold + quantity <= raffle.maxTickets, "Not enough tickets");
        
        uint256 totalCost = uint256(raffle.ticketPrice) * quantity;
        require(msg.value == totalCost, "Incorrect payment");
        
        // Assign tickets
        uint16 startTicket = raffle.ticketsSold;
        for (uint16 i = 0; i < quantity; i++) {
            ticketOwners[raffleId][startTicket + i] = msg.sender;
        }
        
        userTickets[raffleId][msg.sender] += quantity;
        raffle.ticketsSold += quantity;
        
        emit TicketsPurchased(raffleId, msg.sender, quantity, startTicket, totalCost);
        
        // Auto-complete if sold out
        if (raffle.ticketsSold >= raffle.maxTickets) {
            _selectWinner(raffleId);
        }
    }
    
    function selectWinner(uint256 raffleId) external nonReentrant {
        Raffle storage raffle = raffles[raffleId];
        require(raffle.exists, "Raffle does not exist");
        require(!raffle.completed, "Already completed");
        require(block.timestamp >= raffle.endTime, "Raffle still active");
        require(raffle.ticketsSold > 0, "No participants");
        
        _selectWinner(raffleId);
    }
    
    function _selectWinner(uint256 raffleId) internal {
        Raffle storage raffle = raffles[raffleId];
        
        // Generate randomness
        uint256 randomSeed = uint256(keccak256(abi.encodePacked(
            block.prevrandao,
            block.timestamp,
            raffleId,
            raffle.ticketsSold,
            address(this).balance
        )));
        
        uint16 winningTicket = uint16(randomSeed % raffle.ticketsSold);
        address winner = ticketOwners[raffleId][winningTicket];
        
        raffle.winner = winner;
        raffle.completed = true;
        
        // Calculate amounts
        uint256 totalSales = uint256(raffle.ticketPrice) * raffle.ticketsSold;
        uint256 platformFeeAmount = (totalSales * PLATFORM_FEE) / 10000;
        uint256 creatorAmount = totalSales - platformFeeAmount;
        
        // Transfer NFT to winner
        IERC721(raffle.nftContract).transferFrom(address(this), winner, raffle.tokenId);
        
        // Transfer ETH to creator
        if (creatorAmount > 0) {
            (bool success, ) = payable(raffle.creator).call{value: creatorAmount}("");
            require(success, "Creator transfer failed");
        }
        
        // Track platform fees
        totalFeesCollected += platformFeeAmount;
        
        emit WinnerSelected(raffleId, winner, winningTicket, creatorAmount);
        emit RaffleCompleted(raffleId, winner, totalSales, platformFeeAmount);
    }
    
    // ============ VIEW FUNCTIONS ============
    
    function getRaffle(uint256 raffleId) external view returns (Raffle memory) {
        return raffles[raffleId];
    }
    
    function getRaffleContract(uint256 raffleId) external view returns (address) {
        require(raffles[raffleId].exists, "Raffle does not exist");
        return address(this);
    }
    
    function isValidRaffle(address raffleContract) external view returns (bool) {
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
    
    function getUserTickets(uint256 raffleId, address user) external view returns (uint16) {
        return userTickets[raffleId][user];
    }
    
    function platformFee() external pure returns (uint256) {
        return PLATFORM_FEE;
    }
    
    // ============ ADMIN FUNCTIONS ============
    
    function setOperator(address operator, bool status) external onlyOwner {
        operators[operator] = status;
    }
    
    function emergencyPause() external onlyOperator {
        emergencyPaused = true;
        emit EmergencyAction("PAUSED", msg.sender);
    }
    
    function emergencyUnpause() external onlyOwner {
        emergencyPaused = false;
        emit EmergencyAction("UNPAUSED", msg.sender);
    }
    
    function withdrawFees() external onlyOwner nonReentrant {
        uint256 amount = address(this).balance;
        require(amount > 0, "No fees to withdraw");
        
        (bool success, ) = payable(owner).call{value: amount}("");
        require(success, "Withdrawal failed");
        
        emit EmergencyAction("FEES_WITHDRAWN", msg.sender);
    }
    
    function emergencyRescueNFT(
        address nftContract,
        uint256 tokenId,
        address to
    ) external onlyOwner {
        IERC721(nftContract).transferFrom(address(this), to, tokenId);
        emit EmergencyAction("NFT_RESCUED", msg.sender);
    }
    
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid new owner");
        owner = newOwner;
        operators[newOwner] = true;
        emit EmergencyAction("OWNERSHIP_TRANSFERRED", newOwner);
    }
    
    // ============ RECEIVE FUNCTION ============
    receive() external payable {
        // Accept ETH for fees
    }
}