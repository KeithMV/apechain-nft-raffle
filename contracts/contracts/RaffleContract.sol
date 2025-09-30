// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";

/**
 * @title RaffleContract - Individual NFT Raffle
 * @dev Template contract for individual raffles, cloned by factory
 */
contract RaffleContract is ReentrancyGuard, Pausable, Initializable {
    
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
    mapping(uint256 => address) public ticketToOwner;
    uint256 public totalTickets;
    
    // Commit-reveal for randomness
    bytes32 public commitHash;
    uint256 public revealDeadline;
    bool public commitPhase = true;
    
    // Events
    event TicketsPurchased(address indexed buyer, uint256 quantity, uint256 totalSpent);
    event WinnerSelected(address indexed winner, uint256 winningTicket);
    event RaffleCompleted(address indexed winner, uint256 totalSales);
    event RaffleCancelled(uint256 indexed tokenId);
    event CommitSubmitted(bytes32 commitHash);
    event RandomnessRevealed(uint256 randomSeed);
    event EmergencyPaused(address indexed admin);
    event EmergencyUnpaused(address indexed admin);
    
    // Modifiers
    modifier onlyFactory() {
        require(msg.sender == factory, "Only factory");
        _;
    }
    
    modifier raffleActive() {
        require(!paused(), "Contract paused");
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
    ) external initializer {
        require(IERC721(_nftContract).ownerOf(_tokenId) == _creator, "Not NFT owner");
        require(_maxTickets <= 10000, "Max 10000 tickets per raffle");
        require(_maxTickets >= 1, "Min 1 ticket required");
        
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
     * @dev Buy raffle tickets with batch support
     * @param quantity Number of tickets to purchase
     */
    function buyTickets(uint256 quantity) external payable nonReentrant raffleActive {
        require(msg.sender != raffle.creator, "Creator cannot buy own raffle");
        require(quantity > 0, "Invalid quantity");
        require(quantity <= 100, "Max 100 tickets per tx"); // Increased for batch support
        require(raffle.ticketsSold + quantity <= raffle.maxTickets, "Not enough tickets");
        require(msg.value == raffle.ticketPrice * quantity, "Wrong payment");
        
        // Update ticket counts
        ticketsPurchased[msg.sender] += quantity;
        raffle.ticketsSold += quantity;
        
        // Assign tickets to buyer (gas-optimized batch assignment)
        uint256 startTicket = totalTickets;
        for(uint256 i = 0; i < quantity; i++) {
            ticketToOwner[startTicket + i] = msg.sender;
        }
        totalTickets += quantity;
        
        emit TicketsPurchased(msg.sender, quantity, msg.value);
        
        // Check if raffle is complete
        if(raffle.ticketsSold >= raffle.maxTickets) {
            // Auto-complete with simple randomness for immediate completion
            uint256 autoSeed = uint256(keccak256(abi.encodePacked(
                block.timestamp,
                block.prevrandao,
                totalTickets,
                msg.sender
            )));
            _selectWinner(autoSeed);
        }
    }
    
    /**
     * @dev Buy tickets in multiple batches automatically
     * @param totalQuantity Total tickets to purchase across batches
     */
    function buyTicketsBatch(uint256 totalQuantity) external payable nonReentrant raffleActive {
        require(msg.sender != raffle.creator, "Creator cannot buy own raffle");
        require(totalQuantity > 0, "Invalid quantity");
        require(totalQuantity <= 500, "Max 500 tickets per batch call");
        require(raffle.ticketsSold + totalQuantity <= raffle.maxTickets, "Not enough tickets");
        require(msg.value == raffle.ticketPrice * totalQuantity, "Wrong payment");
        
        uint256 remaining = totalQuantity;
        uint256 batchSize = 100; // Process in chunks of 100
        
        while(remaining > 0) {
            uint256 currentBatch = remaining > batchSize ? batchSize : remaining;
            
            // Update ticket counts
            ticketsPurchased[msg.sender] += currentBatch;
            raffle.ticketsSold += currentBatch;
            
            // Assign tickets to buyer
            uint256 startTicket = totalTickets;
            for(uint256 i = 0; i < currentBatch; i++) {
                ticketToOwner[startTicket + i] = msg.sender;
            }
            totalTickets += currentBatch;
            remaining -= currentBatch;
            
            emit TicketsPurchased(msg.sender, currentBatch, raffle.ticketPrice * currentBatch);
        }
        
        // Check if raffle is complete
        if(raffle.ticketsSold >= raffle.maxTickets) {
            uint256 autoSeed = uint256(keccak256(abi.encodePacked(
                block.timestamp,
                block.prevrandao,
                totalTickets,
                msg.sender
            )));
            _selectWinner(autoSeed);
        }
    }
    
    /**
     * @dev Commit random hash (creator only)
     */
    function commitRandomness(bytes32 _commitHash) external {
        require(msg.sender == raffle.creator, "Only creator");
        require(commitPhase, "Commit phase ended");
        require(!raffle.completed, "Already completed");
        require(
            block.timestamp >= raffle.endTime || raffle.ticketsSold >= raffle.maxTickets,
            "Raffle still active"
        );
        
        commitHash = _commitHash;
        revealDeadline = block.timestamp + 1 hours;
        commitPhase = false;
        
        emit CommitSubmitted(_commitHash);
    }
    
    /**
     * @dev Reveal randomness and select winner
     */
    function revealAndSelectWinner(uint256 _nonce) external nonReentrant {
        require(!commitPhase, "Still in commit phase");
        require(!raffle.completed, "Already completed");
        require(totalTickets > 0, "No participants");
        require(keccak256(abi.encodePacked(_nonce)) == commitHash, "Invalid reveal");
        
        _selectWinner(_nonce);
    }
    
    /**
     * @dev Emergency winner selection if reveal fails
     */
    function emergencySelectWinner() external nonReentrant {
        require(!commitPhase, "Still in commit phase");
        require(block.timestamp > revealDeadline, "Reveal period active");
        require(!raffle.completed, "Already completed");
        require(totalTickets > 0, "No participants");
        
        // Use block hash as fallback randomness
        uint256 fallbackSeed = uint256(blockhash(block.number - 1));
        _selectWinner(fallbackSeed);
    }
    
    /**
     * @dev Internal function to select winner
     */
    function _selectWinner(uint256 _seed) internal {
        uint256 winningTicket = _seed % totalTickets;
        raffle.winner = ticketToOwner[winningTicket];
        raffle.completed = true;
        
        emit WinnerSelected(raffle.winner, winningTicket);
        emit RandomnessRevealed(_seed);
        
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
            (bool success, ) = payable(raffle.creator).call{value: creatorAmount}("");
            require(success, "Creator transfer failed");
        }
        
        // Transfer platform fee to factory
        if(platformFeeAmount > 0) {
            (bool success, ) = payable(factory).call{value: platformFeeAmount}("");
            require(success, "Fee transfer failed");
        }
        
        emit RaffleCompleted(raffle.winner, totalSales);
    }
    
    /**
     * @dev Emergency pause (factory only)
     */
    function emergencyPause() external onlyFactory {
        _pause();
        emit EmergencyPaused(msg.sender);
    }
    
    /**
     * @dev Emergency unpause (factory only)
     */
    function emergencyUnpause() external onlyFactory {
        _unpause();
        emit EmergencyUnpaused(msg.sender);
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
        
        emit RaffleCancelled(raffle.tokenId);
    }
    
    /**
     * @dev Get raffle details
     */
    function getRaffleInfo() external view returns (RaffleInfo memory) {
        return raffle;
    }
    
    /**
     * @dev Get total tickets sold
     */
    function getTotalTickets() external view returns (uint256) {
        return totalTickets;
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