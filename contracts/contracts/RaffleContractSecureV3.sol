// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RaffleContractSecureV3 - Fixed Platform Fee Distribution
 * @dev Template contract with direct fee transfer to factory owner
 */
contract RaffleContractSecureV3 is ReentrancyGuard, Pausable, Initializable {
    
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
        uint256 platformFee;
    }
    
    RaffleInfo public raffle;
    address public factory;
    
    // Ticket tracking
    mapping(address => uint256) public ticketsPurchased;
    mapping(uint256 => address) public ticketToOwner;
    uint256 public totalTickets;
    
    // Enhanced commit-reveal randomness
    bytes32 public commitHash;
    uint256 public revealDeadline;
    bool public commitPhase = true;
    uint256 private randomSeed;
    bool private seedSet = false;
    
    // Multiple entropy sources for fallback
    mapping(address => uint256) private participantNonces;
    uint256 private blockHashEntropy;
    uint256 private participantCount;
    
    // Events
    event TicketsPurchased(address indexed buyer, uint256 quantity, uint256 totalSpent);
    event WinnerSelected(address indexed winner, uint256 winningTicket);
    event RaffleCompleted(address indexed winner, uint256 totalSales);
    event RaffleCancelled(uint256 indexed tokenId);
    event CommitSubmitted(bytes32 commitHash);
    event RandomnessRevealed(uint256 randomSeed);
    event EmergencyPaused(address indexed admin);
    event EmergencyUnpaused(address indexed admin);
    
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
    
    function initialize(
        address _nftContract,
        uint256 _tokenId,
        address _creator,
        uint256 _ticketPrice,
        uint256 _maxTickets,
        uint256 _duration,
        uint256 _platformFee
    ) external initializer {
        require(_maxTickets <= 10000, "Max 10000 tickets per raffle");
        require(_maxTickets >= 1, "Min 1 ticket required");
        require(_duration >= 3600, "Min 1 hour duration");
        require(_platformFee <= 2000, "Max 20% fee");
        
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
        
        // Initialize entropy collection
        blockHashEntropy = uint256(blockhash(block.number - 1));
    }
    
    function buyTickets(uint256 quantity) external payable nonReentrant raffleActive {
        require(msg.sender != raffle.creator, "Creator cannot buy own raffle");
        require(quantity > 0 && quantity <= 100, "Invalid quantity");
        require(raffle.ticketsSold + quantity <= raffle.maxTickets, "Not enough tickets");
        require(msg.value == raffle.ticketPrice * quantity, "Wrong payment");
        
        // Collect entropy from participant
        if (participantNonces[msg.sender] == 0) {
            participantCount++;
            participantNonces[msg.sender] = uint256(keccak256(abi.encodePacked(
                msg.sender,
                block.timestamp,
                block.prevrandao,
                participantCount
            )));
        }
        
        // Update ticket counts
        ticketsPurchased[msg.sender] += quantity;
        raffle.ticketsSold += quantity;
        
        // Assign tickets to buyer
        uint256 startTicket = totalTickets;
        for(uint256 i = 0; i < quantity; i++) {
            ticketToOwner[startTicket + i] = msg.sender;
        }
        totalTickets += quantity;
        
        emit TicketsPurchased(msg.sender, quantity, msg.value);
        
        // Auto-complete only if sold out, using secure randomness
        if(raffle.ticketsSold >= raffle.maxTickets) {
            _triggerSecureRandomness();
        }
    }
    
    function commitRandomness(bytes32 _commitHash) external {
        require(msg.sender == raffle.creator, "Only creator");
        require(commitPhase, "Commit phase ended");
        require(!raffle.completed, "Already completed");
        require(
            block.timestamp >= raffle.endTime || raffle.ticketsSold >= raffle.maxTickets,
            "Raffle still active"
        );
        require(totalTickets > 0, "No participants");
        
        commitHash = _commitHash;
        revealDeadline = block.timestamp + 1 hours;
        commitPhase = false;
        
        emit CommitSubmitted(_commitHash);
    }
    
    function revealAndSelectWinner(uint256 _nonce) external nonReentrant {
        require(!commitPhase, "Still in commit phase");
        require(!raffle.completed, "Already completed");
        require(totalTickets > 0, "No participants");
        require(keccak256(abi.encodePacked(_nonce)) == commitHash, "Invalid reveal");
        
        // Use revealed nonce as primary entropy
        randomSeed = _nonce;
        seedSet = true;
        _selectWinner();
    }
    
    function emergencySelectWinner() external nonReentrant {
        require(!commitPhase, "Still in commit phase");
        require(block.timestamp > revealDeadline, "Reveal period active");
        require(!raffle.completed, "Already completed");
        require(totalTickets > 0, "No participants");
        
        _triggerSecureRandomness();
    }
    
    function _triggerSecureRandomness() internal {
        if (!seedSet) {
            // Combine multiple entropy sources for secure fallback
            randomSeed = uint256(keccak256(abi.encodePacked(
                blockHashEntropy,
                block.prevrandao,
                block.timestamp,
                participantCount,
                totalTickets,
                address(this).balance
            )));
            
            // Add participant entropy
            for (uint256 i = 0; i < totalTickets && i < 10; i++) {
                address participant = ticketToOwner[i];
                if (participantNonces[participant] != 0) {
                    randomSeed = uint256(keccak256(abi.encodePacked(
                        randomSeed,
                        participantNonces[participant]
                    )));
                }
            }
            seedSet = true;
        }
        _selectWinner();
    }
    
    function _selectWinner() internal {
        require(seedSet, "Random seed not set");
        
        uint256 winningTicket = randomSeed % totalTickets;
        raffle.winner = ticketToOwner[winningTicket];
        raffle.completed = true;
        
        emit WinnerSelected(raffle.winner, winningTicket);
        emit RandomnessRevealed(randomSeed);
        
        _distributeRewards();
    }
    
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
        
        // FIXED: Transfer platform fee directly to factory owner instead of factory contract
        if(platformFeeAmount > 0) {
            address factoryOwner = Ownable(factory).owner();
            (bool success, ) = payable(factoryOwner).call{value: platformFeeAmount}("");
            require(success, "Fee transfer failed");
        }
        
        emit RaffleCompleted(raffle.winner, totalSales);
    }
    
    function emergencyPause() external onlyFactory {
        _pause();
        emit EmergencyPaused(msg.sender);
    }
    
    function emergencyUnpause() external onlyFactory {
        _unpause();
        emit EmergencyUnpaused(msg.sender);
    }
    
    function cancelRaffle() external nonReentrant {
        require(msg.sender == raffle.creator, "Only creator");
        require(raffle.ticketsSold == 0, "Tickets already sold");
        require(!raffle.completed, "Already completed");
        
        raffle.completed = true;
        
        // Return NFT to creator
        IERC721(raffle.nftContract).transferFrom(address(this), raffle.creator, raffle.tokenId);
        
        emit RaffleCancelled(raffle.tokenId);
    }
    
    function getRaffleInfo() external view returns (RaffleInfo memory) {
        return raffle;
    }
    
    function getTotalTickets() external view returns (uint256) {
        return totalTickets;
    }
    
    function isActive() external view returns (bool) {
        return !raffle.completed && 
               block.timestamp < raffle.endTime && 
               raffle.ticketsSold < raffle.maxTickets;
    }
}