const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 Debugging Failed Transaction...\n");
    
    const [deployer] = await ethers.getSigners();
    console.log("Testing with account:", deployer.address);
    
    const factoryAddress = "0x5854AF7c836275c55469350a114F62a1609c4A42";
    const nftContract = "0x87aaf35253d16895111f4bc0ad6bdde5be0554b7";
    const tokenId = 625;
    const ticketPrice = ethers.utils.parseEther("0.1"); // 100000000000000000
    const maxTickets = 100;
    const duration = 86400; // 24 hours
    
    console.log("Transaction Parameters:");
    console.log("- NFT Contract:", nftContract);
    console.log("- Token ID:", tokenId);
    console.log("- Ticket Price:", ethers.utils.formatEther(ticketPrice), "MATIC");
    console.log("- Max Tickets:", maxTickets);
    console.log("- Duration:", duration, "seconds");
    
    try {
        const factory = await ethers.getContractAt("RaffleFactorySecureV4", factoryAddress);
        
        // Check factory status
        console.log("\n=== FACTORY STATUS ===");
        const isPaused = await factory.paused();
        const rateLimit = await factory.RATE_LIMIT();
        const lastRaffleTime = await factory.lastRaffleTime(deployer.address);
        const currentTime = Math.floor(Date.now() / 1000);
        const timeSinceLastRaffle = currentTime - lastRaffleTime.toNumber();
        
        console.log("Factory Paused:", isPaused);
        console.log("Rate Limit:", rateLimit.toString(), "seconds");
        console.log("Last Raffle Time:", lastRaffleTime.toString());
        console.log("Time Since Last:", timeSinceLastRaffle, "seconds");
        console.log("Can Create:", timeSinceLastRaffle >= rateLimit.toNumber());
        
        // Check NFT contract
        console.log("\n=== NFT CONTRACT CHECKS ===");
        try {
            const nft = await ethers.getContractAt("IERC721", nftContract);
            const owner = await nft.ownerOf(tokenId);
            const isApproved = await nft.isApprovedForAll(deployer.address, factoryAddress);
            const specificApproval = await nft.getApproved(tokenId);
            
            console.log("NFT Owner:", owner);
            console.log("User Address:", deployer.address);
            console.log("Owns NFT:", owner.toLowerCase() === deployer.address.toLowerCase());
            console.log("Approved for All:", isApproved);
            console.log("Specific Approval:", specificApproval);
            console.log("Has Approval:", isApproved || specificApproval.toLowerCase() === factoryAddress.toLowerCase());
        } catch (error) {
            console.log("❌ NFT Contract Error:", error.message);
        }
        
        // Check blacklist
        console.log("\n=== BLACKLIST CHECK ===");
        const isBlacklisted = await factory.blacklistedNFTs(nftContract);
        console.log("NFT Blacklisted:", isBlacklisted);
        
        // Try static call first
        console.log("\n=== STATIC CALL TEST ===");
        try {
            await factory.callStatic.createRaffle(
                nftContract,
                tokenId,
                ticketPrice,
                maxTickets,
                duration
            );
            console.log("✅ Static call succeeded");
        } catch (error) {
            console.log("❌ Static call failed:", error.message);
            if (error.reason) console.log("Reason:", error.reason);
        }
        
    } catch (error) {
        console.log("❌ Factory connection failed:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Debug failed:", error);
        process.exit(1);
    });