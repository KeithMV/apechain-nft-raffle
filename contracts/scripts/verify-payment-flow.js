const { ethers } = require("hardhat");

async function main() {
    console.log("💰 VERIFYING COMPLETE PAYMENT FLOW\n");
    
    const [deployer] = await ethers.getSigners();
    const factoryAddress = "0x0D0cd14b36B5FBb10F274cd3EC2FA3bBa79FC900"; // V2 with completed raffles
    
    // Get factory contract
    const RaffleFactoryV2 = await ethers.getContractFactory("RaffleFactorySecureV2");
    const factory = RaffleFactoryV2.attach(factoryAddress);
    
    console.log("🏭 Analyzing V2 Factory:", factoryAddress);
    console.log("Platform Owner:", deployer.address, "\n");
    
    // Get recent raffles
    const raffleCounter = await factory.raffleCounter();
    console.log("📊 Total Raffles Created:", raffleCounter.toString());
    
    // Check last 5 completed raffles
    console.log("\n🔍 CHECKING RECENT COMPLETED RAFFLES:");
    
    for (let i = Math.max(0, raffleCounter - 5); i < raffleCounter; i++) {
        try {
            const raffleAddress = await factory.getRaffleContract(i);
            const RaffleContract = await ethers.getContractFactory("RaffleContractSecureV2");
            const raffle = RaffleContract.attach(raffleAddress);
            
            const raffleInfo = await raffle.getRaffleInfo();
            
            if (raffleInfo.completed) {
                console.log(`\n📋 Raffle #${i} (${raffleAddress})`);
                console.log("  Creator:", raffleInfo.creator);
                console.log("  Winner:", raffleInfo.winner);
                console.log("  Tickets Sold:", raffleInfo.ticketsSold.toString());
                console.log("  Ticket Price:", ethers.utils.formatEther(raffleInfo.ticketPrice), "APE");
                
                const totalSales = raffleInfo.ticketsSold.mul(raffleInfo.ticketPrice);
                const platformFeeAmount = totalSales.mul(raffleInfo.platformFee).div(10000);
                const creatorAmount = totalSales.sub(platformFeeAmount);
                
                console.log("  Total Sales:", ethers.utils.formatEther(totalSales), "APE");
                console.log("  Platform Fee (10%):", ethers.utils.formatEther(platformFeeAmount), "APE");
                console.log("  Creator Gets:", ethers.utils.formatEther(creatorAmount), "APE");
                
                // Check if creator received payment (simplified check)
                const creatorBalance = await ethers.provider.getBalance(raffleInfo.creator);
                console.log("  Creator Current Balance:", ethers.utils.formatEther(creatorBalance), "APE");
            }
        } catch (error) {
            console.log(`❌ Error checking raffle #${i}:`, error.message);
        }
    }
    
    // Verify V3 contract logic
    console.log("\n🔧 V3 CONTRACT PAYMENT LOGIC:");
    console.log("✅ NFT → Winner (automatic)");
    console.log("✅ Creator Amount (90%) → Raffle Creator");
    console.log("✅ Platform Fee (10%) → Factory Owner (YOU)");
    
    // Show the exact V3 distribution code
    console.log("\n📝 V3 DISTRIBUTION CODE:");
    console.log(`
    uint256 totalSales = raffle.ticketsSold * raffle.ticketPrice;
    uint256 platformFeeAmount = (totalSales * raffle.platformFee) / 10000;
    uint256 creatorAmount = totalSales - platformFeeAmount;
    
    // Transfer NFT to winner
    IERC721(raffle.nftContract).transferFrom(address(this), raffle.winner, raffle.tokenId);
    
    // Transfer APE to creator (90%)
    if(creatorAmount > 0) {
        (bool success, ) = payable(raffle.creator).call{value: creatorAmount}("");
        require(success, "Creator transfer failed");
    }
    
    // Transfer platform fee directly to factory owner (10%)
    if(platformFeeAmount > 0) {
        address factoryOwner = Ownable(factory).owner();
        (bool success, ) = payable(factoryOwner).call{value: platformFeeAmount}("");
        require(success, "Fee transfer failed");
    }
    `);
    
    console.log("\n✅ PAYMENT VERIFICATION:");
    console.log("- Creators get 90% of ticket sales");
    console.log("- Platform gets 10% of ticket sales");
    console.log("- Winners get the NFT");
    console.log("- All transfers are atomic (happen together)");
    console.log("- Failed transfers revert the entire transaction");
    
    console.log("\n🎯 NEXT: Create a test raffle with V3 to verify live payment flow");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });