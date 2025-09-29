// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title RaffleContract - Individual NFT Raffle
 * @dev Template contract for individual raffles, cloned by factory
 */
contract RaffleContract is ReentrancyGuard {
    
    struct RaffleInfo {
        address nftContract;
        uint256 tokenId;
        address creator;
        uint256 ticketPrice;
        uint256 maxTickets;
        uint256 ticketsSold;
        uint256 endTime;
        address winner;
        bool completed;
        uint256 platformFee; // Basis points (1000 = 10%)
    }
    
    RaffleInfo public raffle;
    address public factory;
    
    // Ticket tracking
    mapping(address => uint256) public ticketsPurchased;
    address[] public participants;
    
    // Events
    event TicketsPurchased(address indexed buyer, uint256 quantity, uint256 totalSpent);
    event WinnerSelected(address indexed winner, uint256 randomSeed);
    event RaffleCompleted(address indexed winner, uint256 totalSales);
    
    // Modifiers
    modifier onlyFactory() {
        require(msg.sender == factory, "Only factory");
        _;
    }
    
    modifier raffleActive() {
        require(!raffle.completed, "Raffle completed");
        require(block.timestamp < raffle.endTime, "Raffle expired");
        require(raffle.ticketsSold < raffle.maxTickets, "Sold out");
        _;
    }
    
    /**
     * @dev Initialize raffle (called by factory)
     */
    function initialize(
        address _nftContract,
        uint256 _tokenId,
        address _creator,
        uint256 _ticketPrice,
        uint256 _maxTickets,
        uint256 _duration,
        uint256 _platformFee
    ) external {
        require(factory == address(0), "Already initialized");
        
        factory = msg.sender;
        raffle = RaffleInfo({
            nftContract: _nftContract,
            tokenId: _tokenId,
            creator: _creator,
            ticketPrice: _ticketPrice,
            maxTickets: _maxTickets,
            ticketsSold: 0,
            endTime: block.timestamp + _duration,
            winner: address(0),
            completed: false,
            platformFee: _platformFee
        });
    }
    
    /**
     * @dev Buy raffle tickets
     * @param quantity Number of tickets to purchase
     */
    function buyTickets(uint256 quantity) external payable nonReentrant raffleActive {
        require(quantity > 0, "Invalid quantity");
        require(quantity <= 50, "Max 50 tickets per tx"); // Prevent gas issues
        require(raffle.ticketsSold + quantity <= raffle.maxTickets, "Not enough tickets");
        require(msg.value == raffle.ticketPrice * quantity, "Wrong payment");
        
        // Update ticket counts
        ticketsPurchased[msg.sender] += quantity;
        raffle.ticketsSold += quantity;
        
        // Add to participants array for random selection
        for(uint256 i = 0; i < quantity; i++) {
            participants.push(msg.sender);
        }
        
        emit TicketsPurchased(msg.sender, quantity, msg.value);
        
        // Check if raffle is complete
        if(raffle.ticketsSold >= raffle.maxTickets) {
            _selectWinner();
        }
    }
    
    /**
     * @dev Select winner and complete raffle
     */
    function selectWinner() external nonReentrant {
        require(!raffle.completed, "Already completed");
        require(
            block.timestamp >= raffle.endTime || raffle.ticketsSold >= raffle.maxTickets,
            "Raffle still active"
        );
        require(participants.length > 0, "No participants");
        
        _selectWinner();
    }
    
    /**
     * @dev Internal function to select winner
     */
    function _selectWinner() internal {
        // Generate random number
        uint256 randomSeed = uint256(keccak256(
            abi.encodePacked(
                block.timestamp,
                block.prevrandao,
                participants.length,
                raffle.nftContract,
                raffle.tokenId
            )
        ));
        
        uint256 winnerIndex = randomSeed % participants.length;
        raffle.winner = participants[winnerIndex];
        raffle.completed = true;
        
        emit WinnerSelected(raffle.winner, randomSeed);
        
        _distributeRewards();
    }
    
    /**
     * @dev Distribute rewards after winner selection
     */
    function _distributeRewards() internal {
        uint256 totalSales = raffle.ticketsSold * raffle.ticketPrice;
        uint256 platformFeeAmount = (totalSales * raffle.platformFee) / 10000;
        uint256 creatorAmount = totalSales - platformFeeAmount;
        
        // Transfer NFT to winner
        IERC721(raffle.nftContract).transferFrom(address(this), raffle.winner, raffle.tokenId);
        
        // Transfer APE to creator
        if(creatorAmount > 0) {
            payable(raffle.creator).transfer(creatorAmount);
        }
        
        // Transfer platform fee to factory
        if(platformFeeAmount > 0) {
            payable(factory).transfer(platformFeeAmount);
        }
        
        emit RaffleCompleted(raffle.winner, totalSales);
    }
    
    /**
     * @dev Emergency cancel (only creator, only if no tickets sold)
     */
    function cancelRaffle() external nonReentrant {
        require(msg.sender == raffle.creator, "Only creator");
        require(raffle.ticketsSold == 0, "Tickets already sold");
        require(!raffle.completed, "Already completed");
        
        raffle.completed = true;
        
        // Return NFT to creator
        IERC721(raffle.nftContract).transferFrom(address(this), raffle.creator, raffle.tokenId);
    }
    
    /**
     * @dev Get raffle details
     */
    function getRaffleInfo() external view returns (RaffleInfo memory) {
        return raffle;
    }
    
    /**
     * @dev Get participant count
     */
    function getParticipantCount() external view returns (uint256) {
        return participants.length;
    }
    
    /**
     * @dev Check if raffle is active
     */
    function isActive() external view returns (bool) {
        return !raffle.completed && 
               block.timestamp < raffle.endTime && 
               raffle.ticketsSold < raffle.maxTickets;
    }
}