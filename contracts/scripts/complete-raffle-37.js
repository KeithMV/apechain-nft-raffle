const { ethers } = require("hardhat");

async function main() {
    console.log("🎯 COMPLETING RAFFLE #37\n");
    
    const raffleAddress = "0x000C2162739C15EDA95F06985C02AaE113147100";
    
    console.log("Raffle Address:", raffleAddress);
    
    // Get raffle contract
    const RaffleContract = await ethers.getContractFactory("RaffleContractSecureV2");
    const raffle = RaffleContract.attach(raffleAddress);
    
    // Check current status
    const raffleInfo = await raffle.getRaffleInfo();
    const totalTickets = await raffle.getTotalTickets();
    
    console.log("\n📋 CURRENT STATUS:");
    console.log("Creator:", raffleInfo.creator);
    console.log("Tickets Sold:", raffleInfo.ticketsSold.toString());
    console.log("Total Tickets:", totalTickets.toString());
    console.log("Completed:", raffleInfo.completed);
    console.log("Ticket Price:", ethers.utils.formatEther(raffleInfo.ticketPrice), "APE");
    
    if (raffleInfo.completed) {
        console.log("✅ Raffle already completed!");
        return;
    }
    
    if (totalTickets.eq(0)) {
        console.log("❌ No tickets sold - cannot complete");
        return;
    }
    
    // Calculate expected payments
    const totalSales = raffleInfo.ticketsSold.mul(raffleInfo.ticketPrice);
    const platformFeeAmount = totalSales.mul(raffleInfo.platformFee).div(10000);
    const creatorAmount = totalSales.sub(platformFeeAmount);
    
    console.log("\n💰 EXPECTED PAYMENTS:");
    console.log("Total Sales:", ethers.utils.formatEther(totalSales), "APE");
    console.log("Creator Gets:", ethers.utils.formatEther(creatorAmount), "APE");
    console.log("Platform Fee:", ethers.utils.formatEther(platformFeeAmount), "APE");
    
    // Check who bought the ticket
    const ticketOwner = await raffle.ticketToOwner(0);
    console.log("Ticket Owner (Winner):", ticketOwner);
    
    console.log("\n🔧 COMPLETING RAFFLE...");
    
    try {
        // Use emergency selection since raffle is expired
        const tx = await raffle.emergencySelectWinner();
        console.log("Transaction sent:", tx.hash);
        
        const receipt = await tx.wait();
        console.log("✅ Transaction confirmed!");
        console.log("Gas used:", receipt.gasUsed.toString());
        
        // Verify completion
        const updatedInfo = await raffle.getRaffleInfo();
        console.log("\n✅ COMPLETION VERIFIED:");
        console.log("Winner:", updatedInfo.winner);
        console.log("Completed:", updatedInfo.completed);
        
        console.log("\n💰 PAYMENTS PROCESSED:");
        console.log("- NFT transferred to winner");
        console.log("- Creator received", ethers.utils.formatEther(creatorAmount), "APE");
        console.log("- Platform fee", ethers.utils.formatEther(platformFeeAmount), "APE sent to factory");
        
    } catch (error) {
        console.log("❌ Error completing raffle:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });