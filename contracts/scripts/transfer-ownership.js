const { ethers } = require("hardhat");

async function main() {
  console.log("🔄 FACTORY OWNERSHIP TRANSFER");
  console.log("=".repeat(50));
  
  // Addresses
  const FACTORY_ADDRESS = "0x0D0cd14b36B5FBb10F274cd3EC2FA3bBa79FC900"; // Current factory
  const CURRENT_OWNER = "0xEd742234f5F28A01832fdc4d84e4E2b601De68Ee";   // Your current wallet
  const NEW_OWNER = "0x4dF4e9aeb0d58AbE64E7FbC0160119304e9764E4";      // Your target wallet
  
  console.log(`Factory Contract: ${FACTORY_ADDRESS}`);
  console.log(`Current Owner: ${CURRENT_OWNER}`);
  console.log(`New Owner: ${NEW_OWNER}`);
  
  try {
    // Get signer (must be current owner)
    const [signer] = await ethers.getSigners();
    console.log(`\nSigner Address: ${signer.address}`);
    
    // Verify signer is current owner
    if (signer.address.toLowerCase() !== CURRENT_OWNER.toLowerCase()) {
      console.log("❌ ERROR: Signer must be current owner");
      console.log(`Expected: ${CURRENT_OWNER}`);
      console.log(`Got: ${signer.address}`);
      return;
    }
    
    // Connect to factory contract
    const factory = new ethers.Contract(
      FACTORY_ADDRESS,
      [
        "function owner() view returns (address)",
        "function transferOwnership(address newOwner) external",
        "function platformFee() view returns (uint256)",
        "function raffleCounter() view returns (uint256)"
      ],
      signer
    );
    
    // Pre-transfer verification
    console.log("\n📋 PRE-TRANSFER STATE");
    console.log("-".repeat(30));
    
    const currentOwner = await factory.owner();
    const platformFee = await factory.platformFee();
    const raffleCounter = await factory.raffleCounter();
    
    console.log(`Current Owner: ${currentOwner}`);
    console.log(`Platform Fee: ${platformFee.toString() / 100}%`);
    console.log(`Total Raffles: ${raffleCounter.toString()}`);
    
    // Verify current owner matches expected
    if (currentOwner.toLowerCase() !== CURRENT_OWNER.toLowerCase()) {
      console.log("❌ ERROR: Current owner mismatch");
      console.log(`Expected: ${CURRENT_OWNER}`);
      console.log(`Actual: ${currentOwner}`);
      return;
    }
    
    // Check balances
    const provider = signer.provider;
    const currentOwnerBalance = await provider.getBalance(CURRENT_OWNER);
    const newOwnerBalance = await provider.getBalance(NEW_OWNER);
    
    console.log(`\nCurrent Owner Balance: ${ethers.utils.formatEther(currentOwnerBalance)} APE`);
    console.log(`New Owner Balance: ${ethers.utils.formatEther(newOwnerBalance)} APE`);
    
    // Confirm transfer
    console.log("\n⚠️  OWNERSHIP TRANSFER CONFIRMATION");
    console.log("-".repeat(40));
    console.log("This will transfer factory ownership:");
    console.log(`FROM: ${CURRENT_OWNER}`);
    console.log(`TO:   ${NEW_OWNER}`);
    console.log("\nAll future platform fees will go to the new owner.");
    console.log("This action is IRREVERSIBLE from this wallet.");
    
    // Execute transfer
    console.log("\n🚀 EXECUTING OWNERSHIP TRANSFER...");
    
    const tx = await factory.transferOwnership(NEW_OWNER);
    console.log(`Transaction Hash: ${tx.hash}`);
    console.log("Waiting for confirmation...");
    
    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
    console.log(`Gas Used: ${receipt.gasUsed.toString()}`);
    
    // Post-transfer verification
    console.log("\n📋 POST-TRANSFER STATE");
    console.log("-".repeat(30));
    
    const newCurrentOwner = await factory.owner();
    const newCurrentOwnerBalance = await provider.getBalance(NEW_OWNER);
    
    console.log(`New Owner: ${newCurrentOwner}`);
    console.log(`New Owner Balance: ${ethers.utils.formatEther(newCurrentOwnerBalance)} APE`);
    
    // Verify transfer success
    if (newCurrentOwner.toLowerCase() === NEW_OWNER.toLowerCase()) {
      console.log("\n🎉 OWNERSHIP TRANSFER SUCCESSFUL!");
      console.log("✅ Factory ownership has been transferred");
      console.log("✅ All future platform fees will go to new owner");
      console.log("✅ No frontend changes needed");
      console.log("✅ Platform continues operating normally");
      
      console.log("\n📊 SUMMARY");
      console.log(`Factory: ${FACTORY_ADDRESS}`);
      console.log(`Old Owner: ${CURRENT_OWNER}`);
      console.log(`New Owner: ${NEW_OWNER}`);
      console.log(`Platform Fee: ${platformFee.toString() / 100}%`);
      console.log(`Total Raffles: ${raffleCounter.toString()}`);
      
    } else {
      console.log("\n❌ TRANSFER FAILED");
      console.log(`Expected new owner: ${NEW_OWNER}`);
      console.log(`Actual owner: ${newCurrentOwner}`);
    }
    
  } catch (error) {
    console.error("\n❌ TRANSFER FAILED:", error.message);
    
    if (error.message.includes("Only owner")) {
      console.log("\n💡 This error means you're not the current owner.");
      console.log("Make sure you're using the correct wallet.");
    }
    
    if (error.message.includes("insufficient funds")) {
      console.log("\n💡 Insufficient gas funds.");
      console.log("Add some APE to your wallet for gas fees.");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });