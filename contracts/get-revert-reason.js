const { ethers } = require("hardhat");

async function getDetailedRevertReason() {
    console.log("🔍 GETTING DETAILED REVERT REASON");
    console.log("=".repeat(50));
    
    const factoryAddress = "0xC9Bd344f5E31481F202E400C33210Bd1AB542b42";
    const nftContract = "0x87Aaf35253D16895111f4Bc0AD6BddE5Be0554b7";
    const tokenId = 625;
    const userAddress = "0xa225CFb920fac5fA9f16C935f3CE985cE8490f76";
    const ticketPrice = ethers.utils.parseEther("0.1");
    const maxTickets = 100;
    const duration = 86400;
    
    try {
        console.log("Attempting to call createRaffle with detailed error capture...");
        
        const factoryABI = [
            "function createRaffle(address nftContract, uint256 tokenId, uint256 ticketPrice, uint256 maxTickets, uint256 duration)"
        ];
        
        const factory = new ethers.Contract(factoryAddress, factoryABI, ethers.provider);
        
        // Try to call the function and catch the detailed error
        try {
            const result = await factory.callStatic.createRaffle(
                nftContract,
                tokenId,
                ticketPrice,
                maxTickets,
                duration,
                { from: userAddress }
            );
            
            console.log("✅ Static call succeeded:", result);
            console.log("🤔 This means the transaction should work...");
            
        } catch (staticError) {
            console.log("❌ Static call failed with detailed error:");
            console.log("Error message:", staticError.message);
            console.log("Error code:", staticError.code);
            console.log("Error reason:", staticError.reason);
            
            // Try to extract more details
            if (staticError.error) {
                console.log("Nested error:", staticError.error);
            }
            
            if (staticError.transaction) {
                console.log("Transaction details:", staticError.transaction);
            }
            
            // Check if it's a specific revert reason
            if (staticError.message.includes("revert")) {
                const revertMatch = staticError.message.match(/revert (.+)/);
                if (revertMatch) {
                    console.log("🎯 REVERT REASON:", revertMatch[1]);
                }
            }
            
            // Try to decode the error data if available
            if (staticError.data) {
                console.log("Error data:", staticError.data);
                
                // Common error signatures
                const errorSignatures = {
                    "0x08c379a0": "Error(string)", // Standard revert with message
                    "0x4e487b71": "Panic(uint256)", // Panic errors
                };
                
                const errorSig = staticError.data.slice(0, 10);
                if (errorSignatures[errorSig]) {
                    console.log("Error type:", errorSignatures[errorSig]);
                    
                    if (errorSig === "0x08c379a0") {
                        // Decode string error message
                        try {
                            const decoded = ethers.utils.defaultAbiCoder.decode(
                                ["string"],
                                "0x" + staticError.data.slice(10)
                            );
                            console.log("🎯 DECODED ERROR MESSAGE:", decoded[0]);
                        } catch (decodeError) {
                            console.log("Could not decode error message");
                        }
                    }
                }
            }
        }
        
        // Also try with estimate gas to see if that gives us more info
        console.log("\n🔍 Trying gas estimation...");
        try {
            const gasEstimate = await factory.estimateGas.createRaffle(
                nftContract,
                tokenId,
                ticketPrice,
                maxTickets,
                duration,
                { from: userAddress }
            );
            
            console.log("✅ Gas estimation succeeded:", gasEstimate.toString());
            
        } catch (gasError) {
            console.log("❌ Gas estimation failed:", gasError.message);
        }
        
    } catch (error) {
        console.error("❌ Detailed revert test failed:", error.message);
    }
}

getDetailedRevertReason()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });