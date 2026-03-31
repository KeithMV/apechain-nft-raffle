const { ethers } = require("hardhat");

async function debugAllRevertReasons() {
    console.log("🔍 COMPREHENSIVE REVERT DEBUGGING");
    console.log("=".repeat(60));
    
    const factoryAddress = "0xC9Bd344f5E31481F202E400C33210Bd1AB542b42";
    const nftContract = "0x87Aaf35253D16895111f4Bc0AD6BddE5Be0554b7";
    const tokenId = 625;
    const userAddress = "0xa225CFb920fac5fA9f16C935f3CE985cE8490f76";
    const ticketPrice = ethers.utils.parseEther("0.1");
    const maxTickets = 100;
    const duration = 86400; // 24 hours
    
    console.log("📍 Parameters:");
    console.log("Factory:", factoryAddress);
    console.log("NFT Contract:", nftContract);
    console.log("Token ID:", tokenId);
    console.log("User:", userAddress);
    console.log("Ticket Price:", ethers.utils.formatEther(ticketPrice), "MATIC");
    console.log("Max Tickets:", maxTickets);
    console.log("Duration:", duration, "seconds");
    console.log("");
    
    try {
        const factoryABI = [
            "function paused() view returns (bool)",
            "function blacklistedNFTs(address) view returns (bool)",
            "function lastRaffleTime(address) view returns (uint256)",
            "function RATE_LIMIT() view returns (uint256)",
            "function MIN_DURATION() view returns (uint256)",
            "function MAX_DURATION() view returns (uint256)",
            "function MAX_TICKETS() view returns (uint256)"
        ];
        
        const nftABI = [
            "function ownerOf(uint256 tokenId) view returns (address)",
            "function getApproved(uint256 tokenId) view returns (address)",
            "function isApprovedForAll(address owner, address operator) view returns (bool)"
        ];
        
        const factory = new ethers.Contract(factoryAddress, factoryABI, ethers.provider);
        const nft = new ethers.Contract(nftContract, nftABI, ethers.provider);
        
        console.log("🔍 CHECK 1: Factory Status");
        const isPaused = await factory.paused();
        console.log("Factory paused:", isPaused ? "❌ YES (PROBLEM!)" : "✅ NO");
        
        console.log("\n🔍 CHECK 2: NFT Blacklist");
        const isBlacklisted = await factory.blacklistedNFTs(nftContract);
        console.log("NFT blacklisted:", isBlacklisted ? "❌ YES (PROBLEM!)" : "✅ NO");
        
        console.log("\n🔍 CHECK 3: Parameter Validation");
        const minDuration = await factory.MIN_DURATION();
        const maxDuration = await factory.MAX_DURATION();
        const maxTicketsLimit = await factory.MAX_TICKETS();
        
        console.log("Min duration:", minDuration.toString(), "seconds (", minDuration.toNumber() / 3600, "hours)");
        console.log("Max duration:", maxDuration.toString(), "seconds (", maxDuration.toNumber() / 86400, "days)");
        console.log("Max tickets limit:", maxTicketsLimit.toString());
        
        console.log("Duration valid:", duration >= minDuration && duration <= maxDuration ? "✅ YES" : "❌ NO (PROBLEM!)");
        console.log("Tickets valid:", maxTickets > 0 && maxTickets <= maxTicketsLimit ? "✅ YES" : "❌ NO (PROBLEM!)");
        console.log("Price valid:", ticketPrice.gt(0) ? "✅ YES" : "❌ NO (PROBLEM!)");
        
        console.log("\n🔍 CHECK 4: Rate Limiting");
        const lastRaffleTime = await factory.lastRaffleTime(userAddress);
        const rateLimit = await factory.RATE_LIMIT();
        const currentTime = Math.floor(Date.now() / 1000);
        const timeSinceLastRaffle = currentTime - lastRaffleTime.toNumber();
        
        console.log("Last raffle time:", lastRaffleTime.toString());
        console.log("Rate limit:", rateLimit.toString(), "seconds");
        console.log("Current time:", currentTime);
        console.log("Time since last:", timeSinceLastRaffle, "seconds");
        console.log("Rate limit passed:", timeSinceLastRaffle >= rateLimit ? "✅ YES" : "❌ NO (PROBLEM!)");
        
        console.log("\n🔍 CHECK 5: NFT Ownership & Approval");
        const owner = await nft.ownerOf(tokenId);
        const specificApproval = await nft.getApproved(tokenId);
        const approvalForAll = await nft.isApprovedForAll(userAddress, factoryAddress);
        
        console.log("NFT owner:", owner);
        console.log("User address:", userAddress);
        console.log("Owns NFT:", owner.toLowerCase() === userAddress.toLowerCase() ? "✅ YES" : "❌ NO (PROBLEM!)");
        console.log("Specific approval:", specificApproval);
        console.log("Approval for all:", approvalForAll ? "✅ YES" : "❌ NO");
        console.log("Has approval:", (approvalForAll || specificApproval.toLowerCase() === factoryAddress.toLowerCase()) ? "✅ YES" : "❌ NO (PROBLEM!)");
        
        console.log("\n🔍 CHECK 6: Contract Address Validation");
        console.log("NFT contract is zero address:", nftContract === "0x0000000000000000000000000000000000000000" ? "❌ YES (PROBLEM!)" : "✅ NO");
        
        console.log("\n📊 SUMMARY:");
        const checks = [
            { name: "Factory not paused", pass: !isPaused },
            { name: "NFT not blacklisted", pass: !isBlacklisted },
            { name: "Duration valid", pass: duration >= minDuration && duration <= maxDuration },
            { name: "Tickets valid", pass: maxTickets > 0 && maxTickets <= maxTicketsLimit },
            { name: "Price valid", pass: ticketPrice.gt(0) },
            { name: "Rate limit passed", pass: timeSinceLastRaffle >= rateLimit },
            { name: "User owns NFT", pass: owner.toLowerCase() === userAddress.toLowerCase() },
            { name: "NFT approved", pass: approvalForAll || specificApproval.toLowerCase() === factoryAddress.toLowerCase() },
            { name: "Valid NFT contract", pass: nftContract !== "0x0000000000000000000000000000000000000000" }
        ];
        
        const failedChecks = checks.filter(check => !check.pass);
        
        if (failedChecks.length === 0) {
            console.log("🎉 ALL CHECKS PASSED! The issue might be elsewhere.");
            console.log("💡 Possible causes:");
            console.log("   - Gas estimation issue");
            console.log("   - Network congestion");
            console.log("   - Contract internal error");
        } else {
            console.log("❌ FAILED CHECKS:");
            failedChecks.forEach(check => {
                console.log(`   - ${check.name}`);
            });
        }
        
    } catch (error) {
        console.error("❌ Debug failed:", error.message);
    }
}

debugAllRevertReasons()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });