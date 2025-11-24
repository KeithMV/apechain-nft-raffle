const { ethers } = require("hardhat");

async function main() {
  console.log("🔧 Updating platform fee to 5%...\n");
  
  const [deployer] = await ethers.getSigners();
  console.log("Updating with account:", deployer.address);
  console.log("Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "APE\n");
  
  // Current production factory address
  const FACTORY_ADDRESS = "0x0D0cd14b36B5FBb10F274cd3EC2FA3bBa79FC900";
  
  // Get factory contract
  const RaffleFactorySecure = await ethers.getContractFactory("RaffleFactorySecure");
  const factory = RaffleFactorySecure.attach(FACTORY_ADDRESS);
  
  // Check current fee
  const currentFee = await factory.platformFee();
  console.log("Current platform fee:", currentFee.toString(), "basis points");
  console.log("Current percentage:", (currentFee / 100).toString() + "%");
  
  // Update to 5% (500 basis points)
  const newFee = 500;
  console.log("\n🔄 Updating platform fee to", newFee, "basis points (5%)...");
  
  const tx = await factory.updatePlatformFee(newFee);
  console.log("Transaction hash:", tx.hash);
  
  // Wait for confirmation
  const receipt = await tx.wait();
  console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
  
  // Verify update
  const updatedFee = await factory.platformFee();
  console.log("\n✅ Platform fee updated successfully!");
  console.log("New platform fee:", updatedFee.toString(), "basis points");
  console.log("New percentage:", (updatedFee / 100).toString() + "%");
  
  console.log("\n🎉 Platform fee reduction complete!");
  console.log("Users will now pay only 5% platform fee instead of 10%");
}

main()
  .then(() => {
    console.log("\n✅ Fee update completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Fee update failed:", error);
    process.exit(1);
  });