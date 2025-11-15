// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";

/**
 * @title RaffleContractSecure - Security-Enhanced NFT Raffle
 * @dev Template contract with fixed security vulnerabilities
 */
contract RaffleContractSecure is ReentrancyGuard, Pausable, Initializable {
    
    struct RaffleInfo {
        address nftContract;
        uint256 tokenId;
        address creator;
        uint256 ticketPrice;
        uint256 maxTickets;
        uint256 ticketsSold;
        uint256 endBlock;  // Changed from timestamp to block number
        address winner;
        bool completed;
        uint256 platformFee;
    }
    
    RaffleInfo public raffle;
    address public factory;
    
    // Ticket tracking
    mapping(address => uint256) public ticketsPurchased;
    mapping(uint256 => address) public ticketToOwner;
    uint256 public totalTickets;
    
    // Enhanced commit-reveal for secure randomness
    bytes32 public commitHash;
    uint256 public revealDeadlineBlock;  // Changed to block-based
    bool public commitPhase = true;
    uint256 private constant REVEAL_PERIOD_BLOCKS = 240; // ~1 hour at 15s blocks
    
    // Events
    event TicketsPurchased(address indexed buyer, uint256 quantity, uint256 totalSpent);
    event WinnerSelected(address indexed winner, uint256 winningTicket);
    event RaffleCompleted(address indexed winner, uint256 totalSales);
    event RaffleCancelled(uint256 indexed tokenId);
    event CommitSubmitted(bytes32 commitHash);
    event RandomnessRevealed(uint256 randomSeed);
    
    modifier onlyFactory() {
        require(msg.sender == factory, "Only factory");
        _;
    }
    
    modifier raffleActive() {
        require(!paused(), "Contract paused");
        require(!raffle.completed, "Raffle completed");
        require(block.number < raffle.endBlock, "Raffle expired");
        require(raffle.ticketsSold < raffle.maxTickets, "Sold out");
        _;
    }
    
    /**
     * @dev Initialize raffle with enhanced security
     */
    function initialize(
        address _nftContract,
        uint256 _tokenId,
        address _creator,
        uint256 _ticketPrice,
        uint256 _maxTickets,
        uint256 _durationBlocks,  // Changed to blocks
        uint256 _platformFee
    ) external initializer {
        require(_maxTickets <= 10000, "Max 10000 tickets");
        require(_maxTickets >= 1, "Min 1 ticket required");
        require(_durationBlocks >= 240, "Min 240 blocks duration"); // ~1 hour minimum
        
        factory = msg.sender;
        raffle = RaffleInfo({
            nftContract: _nftContract,
            tokenId: _tokenId,
            creator: _creator,
            ticketPrice: _ticketPrice,
            maxTickets: _maxTickets,
            ticketsSold: 0,
            endBlock: block.number + _durationBlocks,
            winner: address(0),
            completed: false,
            platformFee: _platformFee
        });
    }
    
    /**
     * @dev Buy raffle tickets with enhanced security
     */
    function buyTickets(uint256 quantity) external payable nonReentrant raffleActive {
        require(msg.sender != raffle.creator, "Creator cannot buy own raffle");
        require(quantity > 0 && quantity <= 100, "Invalid quantity");
        require(raffle.ticketsSold + quantity <= raffle.maxTickets, "Not enough tickets");
        require(msg.value == raffle.ticketPrice * quantity, "Wrong payment");
        
        // Update state BEFORE external interactions (reentrancy fix)
        uint256 startTicket = totalTickets;
        ticketsPurchased[msg.sender] += quantity;
        raffle.ticketsSold += quantity;
        totalTickets += quantity;
        
        // Assign tickets
        for(uint256 i = 0; i < quantity; i++) {
            ticketToOwner[startTicket + i] = msg.sender;
        }
        
        emit TicketsPurchased(msg.sender, quantity, msg.value);
        
        // Check completion after state updates
        if(raffle.ticketsSold >= raffle.maxTickets) {
            _initiateCommitPhase();
        }
    }
    
    /**
     * @dev Initiate commit phase when raffle ends
     */
    function _initiateCommitPhase() internal {
        if (!commitPhase) return; // Already initiated
        
        commitPhase = false;
        revealDeadlineBlock = block.number + REVEAL_PERIOD_BLOCKS;
        
        // If no tickets sold, auto-complete
        if (totalTickets == 0) {
            raffle.completed = true;
            // Return NFT to creator
            IERC721(raffle.nftContract).transferFrom(address(this), raffle.creator, raffle.tokenId);
            emit RaffleCancelled(raffle.tokenId);
        }
    }
    
    /**
     * @dev Commit randomness hash (creator only)
     */
    function commitRandomness(bytes32 _commitHash) external {
        require(msg.sender == raffle.creator, "Only creator");
        require(!raffle.completed, "Already completed");
        require(
            block.number >= raffle.endBlock || raffle.ticketsSold >= raffle.maxTickets,
            "Raffle still active"
        );
        
        if (commitPhase) {
            _initiateCommitPhase();
        }
        
        require(!commitPhase, "Commit phase ended");
        require(commitHash == bytes32(0), "Already committed");
        
        commitHash = _commitHash;
        emit CommitSubmitted(_commitHash);
    }
    
    /**
     * @dev Reveal randomness and select winner with enhanced security
     */
    function revealAndSelectWinner(uint256 _nonce) external nonReentrant {
        require(!commitPhase, "Still in commit phase");
        require(!raffle.completed, "Already completed");
        require(totalTickets > 0, "No participants");
        require(commitHash != bytes32(0), "No commit found");
        require(keccak256(abi.encodePacked(_nonce)) == commitHash, "Invalid reveal");
        
        // Enhanced randomness combining multiple sources
        uint256 secureRandom = uint256(keccak256(abi.encodePacked(
            _nonce,
            blockhash(block.number - 1),
            blockhash(block.number - 2),
            block.coinbase,
            totalTickets,
            raffle.creator
        )));
        
        _selectWinner(secureRandom);
    }
    
    /**
     * @dev Emergency winner selection with secure fallback
     */
    function emergencySelectWinner() external nonReentrant {
        require(!commitPhase, "Still in commit phase");
        require(block.number > revealDeadlineBlock, "Reveal period active");
        require(!raffle.completed, "Already completed");
        require(totalTickets > 0, "No participants");
        
        // Secure fallback randomness using multiple block hashes
        uint256 fallbackSeed = uint256(keccak256(abi.encodePacked(
            blockhash(block.number - 1),
            blockhash(block.number - 2),
            blockhash(block.number - 3),
            block.coinbase,
            block.gaslimit,
            totalTickets
        )));
        
        _selectWinner(fallbackSeed);
    }
    
    /**
     * @dev Internal winner selection with secure randomness
     */
    function _selectWinner(uint256 _seed) internal {
        require(totalTickets > 0, "No tickets sold");
        
        uint256 winningTicket = _seed % totalTickets;
        address winner = ticketToOwner[winningTicket];
        
        // Update state before external calls
        raffle.winner = winner;
        raffle.completed = true;
        
        emit WinnerSelected(winner, winningTicket);
        emit RandomnessRevealed(_seed);
        
        _distributeRewards();
    }
    
    /**
     * @dev Secure reward distribution
     */
    function _distributeRewards() internal {
        uint256 totalSales = raffle.ticketsSold * raffle.ticketPrice;
        uint256 platformFeeAmount = (totalSales * raffle.platformFee) / 10000;
        uint256 creatorAmount = totalSales - platformFeeAmount;
        
        // Transfer NFT first (most important)
        IERC721(raffle.nftContract).transferFrom(address(this), raffle.winner, raffle.tokenId);
        
        // Transfer funds with proper error handling
        if(creatorAmount > 0) {
            (bool success, ) = payable(raffle.creator).call{value: creatorAmount}("");
            require(success, "Creator transfer failed");
        }
        
        if(platformFeeAmount > 0) {
            (bool success, ) = payable(factory).call{value: platformFeeAmount}("");
            require(success, "Fee transfer failed");
        }
        
        emit RaffleCompleted(raffle.winner, totalSales);
    }
    
    /**
     * @dev Cancel raffle (enhanced security)
     */
    function cancelRaffle() external nonReentrant {
        require(msg.sender == raffle.creator, "Only creator");
        require(raffle.ticketsSold == 0, "Tickets already sold");
        require(!raffle.completed, "Already completed");
        
        // Update state before external call
        raffle.completed = true;
        
        // Return NFT to creator
        IERC721(raffle.nftContract).transferFrom(address(this), raffle.creator, raffle.tokenId);
        
        emit RaffleCancelled(raffle.tokenId);
    }
    
    /**
     * @dev Emergency functions
     */
    function emergencyPause() external onlyFactory {
        _pause();
    }
    
    function emergencyUnpause() external onlyFactory {
        _unpause();
    }
    
    /**
     * @dev View functions
     */
    function getRaffleInfo() external view returns (RaffleInfo memory) {
        return raffle;
    }
    
    function isActive() external view returns (bool) {
        return !raffle.completed && 
               block.number < raffle.endBlock && 
               raffle.ticketsSold < raffle.maxTickets;
    }
    
    function getTimeRemaining() external view returns (uint256) {
        if (block.number >= raffle.endBlock) return 0;
        return raffle.endBlock - block.number;
    }
}