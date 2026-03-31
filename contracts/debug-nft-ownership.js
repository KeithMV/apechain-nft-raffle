const { ethers } = require("hardhat");

async function debugNFTIssue() {
    console.log("🔍 DEBUGGING NFT APPROVAL ISSUE");
    console.log("=".repeat(50));
    
    const nftContract = "0x87Aaf35253D16895111f4Bc0AD6BddE5Be0554b7";
    const tokenId = 625;
    const factoryAddress = "0xC9Bd344f5E31481F202E400C33210Bd1AB542b42";
    const frontendWallet = "0xa225CFb920fac5fA9f16C935f3CE985cE8490f76";
    const deployerWallet = "0x4dF4e9aeb0d58AbE64E7FbC0160119304e9764E4";
    
    console.log("📍 Addresses:");
    console.log("NFT Contract:", nftContract);
    console.log("Token ID:", tokenId);
    console.log("Factory:", factoryAddress);
    console.log("Frontend Wallet:", frontendWallet);
    console.log("Deployer Wallet:", deployerWallet);
    console.log("");
    
    try {
        const nftABI = [
            "function ownerOf(uint256 tokenId) view returns (address)",
            "function getApproved(uint256 tokenId) view returns (address)",
            "function isApprovedForAll(address owner, address operator) view returns (bool)"
        ];
        
        const nft = new ethers.Contract(nftContract, nftABI, ethers.provider);
        
        // Check ownership
        console.log("🔍 Checking NFT ownership...");
        const owner = await nft.ownerOf(tokenId);
        console.log("✅ NFT Owner:", owner);
        console.log("Frontend wallet owns it:", owner.toLowerCase() === frontendWallet.toLowerCase());
        console.log("Deployer wallet owns it:", owner.toLowerCase() === deployerWallet.toLowerCase());
        console.log("");
        
        // Check approvals for frontend wallet
        console.log("🔍 Checking approvals for frontend wallet...");
        const specificApproval = await nft.getApproved(tokenId);
        const approvalForAll = await nft.isApprovedForAll(frontendWallet, factoryAddress);
        
        console.log("Specific approval:", specificApproval);
        console.log("Approved for all:", approvalForAll);
        console.log("Has any approval:", 
            specificApproval.toLowerCase() === factoryAddress.toLowerCase() || approvalForAll
        );
        console.log("");
        
        // Check approvals for deployer wallet
        console.log("🔍 Checking approvals for deployer wallet...");
        const deployerApprovalForAll = await nft.isApprovedForAll(deployerWallet, factoryAddress);
        console.log("Deployer approved for all:", deployerApprovalForAll);
        console.log("");
        
        // Recommendations
        console.log("💡 RECOMMENDATIONS:");
        if (owner.toLowerCase() === frontendWallet.toLowerCase()) {
            if (!approvalForAll && specificApproval.toLowerCase() !== factoryAddress.toLowerCase()) {
                console.log("❌ Frontend wallet owns NFT but needs approval");
                console.log("🔧 Solution: Approve the factory contract for this NFT");
            } else {
                console.log("✅ Frontend wallet owns NFT and has approval");
                console.log("🤔 Issue might be elsewhere - check contract state");
            }
        } else if (owner.toLowerCase() === deployerWallet.toLowerCase()) {
            console.log("❌ Deployer wallet owns NFT, but frontend wallet is trying to use it");
            console.log("🔧 Solution: Either:");
            console.log("   1. Switch to deployer wallet in frontend");
            console.log("   2. Transfer NFT to frontend wallet");
        } else {
            console.log("❌ Neither wallet owns this NFT!");
            console.log("🔧 Solution: Use an NFT that the frontend wallet actually owns");
        }
        
    } catch (error) {
        console.error("❌ Debug failed:", error.message);
    }
}

debugNFTIssue()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });