/**
 * ApeChain Raffles - Platform Metrics Analysis
 * Extracts key data for ApeCoin DAO Grant Proposal
 */

const { ethers } = require('hardhat');

// Contract addresses from your deployment
const FACTORY_V4_ADDRESS = "0x1627E7e63b63878E61f91D336385a59B1747934a"; // V4 factory
const FACTORY_V3_ADDRESS = "0x1dC9F6Cc2e53558a940a7Cd87d6e5fbE2A8635ff"; // V3 factory

async function analyzeplatformMetrics() {
    console.log("🔍 Analyzing ApeChain Raffles Platform Metrics...\n");

    try {
        // Connect to ApeChain
        const provider = new ethers.providers.JsonRpcProvider("https://apechain.calderachain.xyz/http");
        
        // Get factory contract
        const factoryABI = [
            "function raffleCounter() view returns (uint256)",
            "function getRaffleContract(uint256) view returns (address)",
            "function platformFee() view returns (uint256)",
            "event RaffleCreated(uint256 indexed raffleId, address indexed creator, address raffleContract)"
        ];
        
        const factory = new ethers.Contract(FACTORY_V4_ADDRESS, factoryABI, provider);
        
        // 1. Get total raffles created
        const totalRaffles = await factory.raffleCounter();
        console.log(`📊 Total Raffles Created: ${totalRaffles}`);
        
        // 2. Get platform fee percentage
        const platformFee = await factory.platformFee();
        console.log(`💰 Platform Fee: ${platformFee / 100}%`);
        
        // 3. Analyze raffle creation events
        const creationFilter = factory.filters.RaffleCreated();
        const creationEvents = await factory.queryFilter(creationFilter, 0, 'latest');
        
        console.log(`📈 Raffle Creation Events: ${creationEvents.length}`);
        
        // 4. Analyze individual raffles
        let totalVolume = ethers.BigNumber.from(0);
        let totalFees = ethers.BigNumber.from(0);
        let activeRaffles = 0;
        let completedRaffles = 0;
        let uniqueCreators = new Set();
        
        const raffleABI = [
            "function ticketPrice() view returns (uint256)",
            "function maxTickets() view returns (uint256)",
            "function ticketsSold() view returns (uint256)",
            "function endTime() view returns (uint256)",
            "function winner() view returns (address)",
            "function creator() view returns (address)",
            "function isActive() view returns (bool)"
        ];
        
        console.log("\n🔍 Analyzing individual raffles...");
        
        for (let i = 1; i <= Math.min(totalRaffles, 20); i++) { // Analyze first 20 for speed
            try {
                const raffleAddress = await factory.getRaffleContract(i);
                const raffle = new ethers.Contract(raffleAddress, raffleABI, provider);
                
                const [ticketPrice, maxTickets, ticketsSold, endTime, winner, creator, isActive] = await Promise.all([
                    raffle.ticketPrice(),
                    raffle.maxTickets(),
                    raffle.ticketsSold(),
                    raffle.endTime(),
                    raffle.winner(),
                    raffle.creator(),
                    raffle.isActive()
                ]);
                
                // Calculate raffle volume
                const raffleVolume = ticketPrice.mul(ticketsSold);
                totalVolume = totalVolume.add(raffleVolume);
                
                // Calculate platform fees (assuming 10% default)
                const raffleFees = raffleVolume.mul(platformFee).div(10000);
                totalFees = totalFees.add(raffleFees);
                
                // Track unique creators
                uniqueCreators.add(creator.toLowerCase());
                
                // Count active vs completed
                if (isActive) {
                    activeRaffles++;
                } else {
                    completedRaffles++;
                }
                
                console.log(`  Raffle ${i}: ${ethers.utils.formatEther(raffleVolume)} APE volume, ${ticketsSold}/${maxTickets} tickets`);
                
            } catch (error) {
                console.log(`  Raffle ${i}: Error analyzing - ${error.message}`);
            }
        }
        
        // 5. Calculate key metrics
        const avgRaffleValue = totalRaffles > 0 ? totalVolume.div(totalRaffles) : ethers.BigNumber.from(0);
        const successRate = totalRaffles > 0 ? (completedRaffles / totalRaffles * 100).toFixed(1) : 0;
        
        // 6. Output summary
        console.log("\n" + "=".repeat(50));
        console.log("📊 PLATFORM METRICS SUMMARY");
        console.log("=".repeat(50));
        console.log(`Total Raffles Created: ${totalRaffles}`);
        console.log(`Active Raffles: ${activeRaffles}`);
        console.log(`Completed Raffles: ${completedRaffles}`);
        console.log(`Success Rate: ${successRate}%`);
        console.log(`Unique Creators: ${uniqueCreators.size}`);
        console.log(`Total Volume: ${ethers.utils.formatEther(totalVolume)} APE`);
        console.log(`Platform Fees Collected: ${ethers.utils.formatEther(totalFees)} APE`);
        console.log(`Average Raffle Value: ${ethers.utils.formatEther(avgRaffleValue)} APE`);
        console.log(`Platform Fee Rate: ${platformFee / 100}%`);
        
        // 7. Generate grant proposal data
        console.log("\n" + "=".repeat(50));
        console.log("📋 GRANT PROPOSAL DATA");
        console.log("=".repeat(50));
        
        const proposalData = {
            totalRaffles: totalRaffles.toString(),
            activeRaffles,
            completedRaffles,
            successRate: `${successRate}%`,
            uniqueCreators: uniqueCreators.size,
            totalVolumeAPE: ethers.utils.formatEther(totalVolume),
            platformFeesAPE: ethers.utils.formatEther(totalFees),
            avgRaffleValueAPE: ethers.utils.formatEther(avgRaffleValue),
            platformFeeRate: `${platformFee / 100}%`
        };
        
        console.log(JSON.stringify(proposalData, null, 2));
        
        // 8. Save to file
        const fs = require('fs');
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `platform-metrics-${timestamp}.json`;
        
        fs.writeFileSync(filename, JSON.stringify({
            timestamp: new Date().toISOString(),
            metrics: proposalData,
            rawData: {
                totalVolume: totalVolume.toString(),
                totalFees: totalFees.toString(),
                creationEvents: creationEvents.length
            }
        }, null, 2));
        
        console.log(`\n💾 Data saved to: ${filename}`);
        console.log("\n✅ Analysis complete! Use this data for your grant proposal.");
        
    } catch (error) {
        console.error("❌ Error analyzing metrics:", error.message);
        console.log("\n🔧 Troubleshooting:");
        console.log("1. Check contract addresses are correct");
        console.log("2. Verify ApeChain RPC is accessible");
        console.log("3. Ensure contract ABIs match deployed contracts");
    }
}

// Run the analysis
if (require.main === module) {
    analyzeplatformMetrics()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = { analyzeplatformMetrics };