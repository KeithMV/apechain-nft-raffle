const { ethers } = require("hardhat");

async function main() {
  console.log("\n🔍 COMPREHENSIVE BASE RAFFLE DEBUG\n");

  const factoryAddress = "0xeBB962e8949e67301B4d2c4727EBC689E22516f8";
  const nftContract = "0x3f58c6eb6a3f58cf137ac093856f0b6e83727260";
  const tokenId = 1064;
  const userAddress = "0x1Dfb09d1969A11AF5196629c2E6B220898Ab538e";
  
  console.log("📍 Testing Configuration:");
  console.log("Factory:", factoryAddress);
  console.log("NFT:", nftContract);
  console.log("Token ID:", tokenId);
  console.log("User:", userAddress);

  try {
    // 1. Check if we can impersonate the user
    console.log("\n1️⃣ IMPERSONATING USER FOR TESTING");
    await ethers.provider.send("hardhat_impersonateAccount", [userAddress]);
    const userSigner = await ethers.getSigner(userAddress);
    console.log("✅ Impersonating user:", userSigner.address);

    // 2. Check user's ETH balance
    const balance = await userSigner.getBalance();
    console.log("💰 User ETH Balance:", ethers.utils.formatEther(balance));

    // 3. Check NFT ownership and approval
    console.log("\n2️⃣ NFT VERIFICATION");
    const nft = await ethers.getContractAt("IERC721", nftContract);
    
    const owner = await nft.ownerOf(tokenId);
    console.log("👤 NFT Owner:", owner);
    console.log("✅ User owns NFT:", owner.toLowerCase() === userAddress.toLowerCase());
    
    const approved = await nft.getApproved(tokenId);
    console.log("🔓 Approved Address:", approved);
    console.log("✅ Factory approved for token:", approved.toLowerCase() === factoryAddress.toLowerCase());
    
    const approvedForAll = await nft.isApprovedForAll(userAddress, factoryAddress);
    console.log("🔓 Approved for all:", approvedForAll);
    
    const hasApproval = approved.toLowerCase() === factoryAddress.toLowerCase() || approvedForAll;
    console.log("✅ Has approval:", hasApproval);

    // 4. If no approval, set it
    if (!hasApproval) {
      console.log("\n🔧 SETTING APPROVAL");
      const approveTx = await nft.connect(userSigner).setApprovalForAll(factoryAddress, true);
      await approveTx.wait();
      console.log("✅ Approval set");
    }

    // 5. Check factory state
    console.log("\n3️⃣ FACTORY STATE CHECK");
    const RaffleFactory = await ethers.getContractFactory("RaffleFactoryBaseV3");
    const factory = RaffleFactory.attach(factoryAddress);
    
    const paused = await factory.paused();
    console.log("⏸️  Factory Paused:", paused);
    
    const lastRaffleTime = await factory.lastRaffleTime(userAddress);
    console.log("🕐 Last Raffle Time:", lastRaffleTime.toString());
    
    const rateLimit = await factory.RATE_LIMIT();
    const currentTime = Math.floor(Date.now() / 1000);
    const timeSinceLastRaffle = currentTime - lastRaffleTime.toNumber();
    console.log("⏰ Time Since Last Raffle:", timeSinceLastRaffle, "seconds");
    console.log("✅ Rate limit OK:", timeSinceLastRaffle >= rateLimit.toNumber());

    // 6. Try the actual transaction
    console.log("\n4️⃣ ATTEMPTING RAFFLE CREATION");
    try {
      const tx = await factory.connect(userSigner).createRaffle(
        nftContract,
        tokenId,
        "1000000000000000", // 0.001 ETH
        100,
        3600,
        {
          gasLimit: 2000000 // High gas limit
        }
      );
      
      console.log("✅ Transaction sent:", tx.hash);
      const receipt = await tx.wait();
      console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
      console.log("🎉 RAFFLE CREATED SUCCESSFULLY!");
      
    } catch (error) {
      console.log("❌ Transaction failed:");
      console.log("Error message:", error.message);
      
      if (error.reason) {
        console.log("Revert reason:", error.reason);
      }
      
      // Try to decode the error
      if (error.data) {
        console.log("Error data:", error.data);
        
        // Common error signatures
        const errorSignatures = {
          "0x08c379a0": "Error(string)", // Standard revert
          "0x4e487b71": "Panic(uint256)", // Panic
        };
        
        const sig = error.data.slice(0, 10);
        if (errorSignatures[sig]) {
          console.log("Error type:", errorSignatures[sig]);
          
          if (sig === "0x08c379a0") {
            try {
              const decoded = ethers.utils.defaultAbiCoder.decode(["string"], "0x" + error.data.slice(10));
              console.log("Decoded message:", decoded[0]);
            } catch (e) {
              console.log("Could not decode error message");
            }
          }
        }
      }
    }

    // 7. Stop impersonation
    await ethers.provider.send("hardhat_stopImpersonatingAccount", [userAddress]);

  } catch (error) {
    console.log("❌ Debug failed:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });