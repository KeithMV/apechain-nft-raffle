const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 ANALYZING NEW RAFFLE TRANSACTION\n");
    
    const txHash = "0x39b281c3bfe13ed7575b72d33e430797fc36ac8d336b36911f142dcbe495a022";
    const raffleAddress = "0xB5A94f9b8d616c48Ee4C912653ca8175f275A7b9";
    
    console.log("Transaction Hash:", txHash);
    console.log("Raffle Address:", raffleAddress);
    
    // Get transaction details
    try {
        const tx = await ethers.provider.getTransaction(txHash);
        const receipt = await ethers.provider.getTransactionReceipt(txHash);
        
        console.log("\n📋 TRANSACTION DETAILS:");
        console.log("From:", tx.from);
        console.log("To:", tx.to);
        console.log("Gas Used:", receipt.gasUsed.toString());
        console.log("Status:", receipt.status === 1 ? "✅ Success" : "❌ Failed");
        
        // Check if this was a createRaffle transaction
        if (tx.to.toLowerCase() === "0x1dC9F6Cc2e53558a940a7Cd87d6e5fbE2A8635ff".toLowerCase()) {
            console.log("✅ This was a V3 Factory createRaffle transaction!");
        }
        
    } catch (error) {
        console.log("❌ Error getting transaction:", error.message);
    }
    
    // Analyze the raffle contract
    console.log("\n🎯 RAFFLE CONTRACT ANALYSIS:");
    console.log("Address:", raffleAddress);
    
    try {
        const RaffleContract = await ethers.getContractFactory("RaffleContractSecureV3");
        const raffle = RaffleContract.attach(raffleAddress);
        
        const raffleInfo = await raffle.getRaffleInfo();
        const totalTickets = await raffle.getTotalTickets();
        const balance = await ethers.provider.getBalance(raffleAddress);
        
        console.log("\n📊 RAFFLE STATUS:");
        console.log("Creator:", raffleInfo.creator);
        console.log("NFT Contract:", raffleInfo.nftContract);
        console.log("Token ID:", raffleInfo.tokenId.toString());
        console.log("Ticket Price:", ethers.utils.formatEther(raffleInfo.ticketPrice), "APE");
        console.log("Max Tickets:", raffleInfo.maxTickets.toString());
        console.log("Tickets Sold:", raffleInfo.ticketsSold.toString());
        console.log("Total Tickets:", totalTickets.toString());
        console.log("End Time:", new Date(raffleInfo.endTime * 1000).toLocaleString());
        console.log("Completed:", raffleInfo.completed);
        console.log("Current Balance:", ethers.utils.formatEther(balance), "APE");
        
        // Calculate time remaining
        const currentTime = Math.floor(Date.now() / 1000);
        const timeRemaining = raffleInfo.endTime - currentTime;
        
        if (timeRemaining > 0) {
            const minutes = Math.floor(timeRemaining / 60);
            const seconds = timeRemaining % 60;
            console.log("⏰ Time Remaining:", `${minutes}m ${seconds}s`);
        } else {
            console.log("⏰ Status: EXPIRED - Ready for completion");
        }
        
        // Calculate potential earnings
        const totalSales = raffleInfo.ticketsSold.mul(raffleInfo.ticketPrice);
        const platformFeeAmount = totalSales.mul(raffleInfo.platformFee).div(10000);
        const creatorAmount = totalSales.sub(platformFeeAmount);
        
        console.log("\n💰 FINANCIAL BREAKDOWN:");
        console.log("Total Sales:", ethers.utils.formatEther(totalSales), "APE");
        console.log("Creator Gets (90%):", ethers.utils.formatEther(creatorAmount), "APE");
        console.log("Platform Fee (10%):", ethers.utils.formatEther(platformFeeAmount), "APE");
        
        console.log("\n🎯 WHAT TO WATCH:");
        console.log("1. Monitor this address on ApeScan:", raffleAddress);
        console.log("2. Watch balance increase as tickets are purchased");
        console.log("3. When raffle completes, you'll see platform fee go directly to your wallet!");
        
        console.log("\n📱 APESCAN LINKS:");
        console.log("Raffle Contract:", `https://apescan.io/address/${raffleAddress}`);
        console.log("Your Wallet:", "https://apescan.io/address/0x4dF4e9aeb0d58AbE64E7FbC0160119304e9764E4");
        
    } catch (error) {
        console.log("❌ Error analyzing raffle:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });