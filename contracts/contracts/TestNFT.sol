// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/**
 * @title TestNFT - Simple NFT for testing
 */
contract TestNFT is ERC721 {
    constructor() ERC721("Test NFT", "TEST") {}
    
    function mint(address to, uint256 tokenId) external {
        _mint(to, tokenId);
    }
}