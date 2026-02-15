// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title MinimalTestFactory - Isolate the exact failure point
 */
contract MinimalTestFactory {
    
    event TestResult(string step, bool success);
    
    function testCreateRaffle(
        address nftContract,
        uint256 tokenId,
        uint256 ticketPrice,
        uint256 maxTickets,
        uint256 duration
    ) external {
        // Step 1: Basic validation
        require(nftContract != address(0), "Invalid NFT contract");
        emit TestResult("validation", true);
        
        // Step 2: NFT contract interaction
        IERC721 nft = IERC721(nftContract);
        
        // Step 3: Check ownership
        address owner = nft.ownerOf(tokenId);
        require(owner == msg.sender, "Not NFT owner");
        emit TestResult("ownership", true);
        
        // Step 4: Check approval
        bool isApproved = nft.isApprovedForAll(msg.sender, address(this)) || 
                         nft.getApproved(tokenId) == address(this);
        require(isApproved, "NFT not approved");
        emit TestResult("approval", true);
        
        // Step 5: Try NFT transfer (this might be the issue)
        nft.transferFrom(msg.sender, address(this), tokenId);
        emit TestResult("transfer", true);
        
        // If we get here, the issue is not in basic operations
        emit TestResult("complete", true);
    }
    
    // Simple function to test if contract works at all
    function simpleTest() external pure returns (string memory) {
        return "Contract works";
    }
}