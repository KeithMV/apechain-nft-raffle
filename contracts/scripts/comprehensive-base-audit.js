const { ethers } = require("hardhat");

async function main() {
  console.log("\n🔍 COMPREHENSIVE BASE CONFIGURATION AUDIT\n");

  const factoryAddress = "0xeBB962e8949e67301B4d2c4727EBC689E22516f8";
  const nftContract = "0x3f58c6eb6a3f58cf137ac093856f0b6e83727260";
  const tokenId = 1064;
  const userAddress = "0x1Dfb09d1969A11AF5196629c2E6B220898Ab538e";
  
  console.log("📍 Configuration:");
  console.log("Factory Address:", factoryAddress);
  console.log("NFT Contract:", nftContract);
  console.log("Token ID:", tokenId);
  console.log("User Address:", userAddress);
  console.log("Network: Base Mainnet (8453)");

  try {
    // 1. Check factory contract exists and is correct type
    console.log("\n1️⃣ FACTORY CONTRACT VERIFICATION");
    const factoryCode = await ethers.provider.getCode(factoryAddress);
    console.log("✅ Factory has code:", factoryCode !== "0x");
    console.log("📏 Code length:", factoryCode.length);

    // Try to attach as RaffleFactoryBaseV3
    const RaffleFactory = await ethers.getContractFactory("RaffleFactoryBaseV3");
    const factory = RaffleFactory.attach(factoryAddress);

    // Check basic factory functions
    try {
      const owner = await factory.owner();
      console.log("👤 Factory Owner:", owner);
    } catch (error) {
      console.log("❌ Owner call failed:", error.message);
    }

    try {
      const paused = await factory.paused();
      console.log("⏸️  Factory Paused:", paused);
    } catch (error) {
      console.log("❌ Paused call failed:", error.message);
    }

    try {
      const platformFee = await factory.platformFee();
      console.log("💰 Platform Fee:", platformFee.toString(), "basis points");
    } catch (error) {
      console.log("❌ Platform fee call failed:", error.message);
    }

    try {
      const rateLimit = await factory.RATE_LIMIT();
      console.log("⏱️  Rate Limit:", rateLimit.toString(), "seconds");
    } catch (error) {
      console.log("❌ Rate limit call failed:", error.message);
    }

    try {
      const counter = await factory.raffleCounter();
      console.log("🔢 Raffle Counter:", counter.toString());
    } catch (error) {
      console.log("❌ Counter call failed:", error.message);
    }

    // 2. Check NFT contract and ownership
    console.log("\n2️⃣ NFT CONTRACT VERIFICATION");
    const nftCode = await ethers.provider.getCode(nftContract);
    console.log("✅ NFT contract has code:", nftCode !== "0x");

    try {
      const nft = await ethers.getContractAt("IERC721", nftContract);
      
      const owner = await nft.ownerOf(tokenId);
      console.log("👤 NFT Owner:", owner);
      console.log("✅ User owns NFT:", owner.toLowerCase() === userAddress.toLowerCase());
      
      const approved = await nft.getApproved(tokenId);
      console.log("🔓 Approved Address:", approved);
      console.log("✅ Factory approved for token:", approved.toLowerCase() === factoryAddress.toLowerCase());
      
      const approvedForAll = await nft.isApprovedForAll(userAddress, factoryAddress);
      console.log("🔓 Approved for all:", approvedForAll);
      
      console.log("✅ NFT approval OK:", approved.toLowerCase() === factoryAddress.toLowerCase() || approvedForAll);
      
    } catch (error) {
      console.log("❌ NFT check failed:", error.message);
    }

    // 3. Check rate limiting
    console.log("\n3️⃣ RATE LIMITING CHECK");
    try {
      const lastRaffleTime = await factory.lastRaffleTime(userAddress);
      console.log("🕐 Last Raffle Time:", lastRaffleTime.toString());
      
      const currentTime = Math.floor(Date.now() / 1000);
      const timeSinceLastRaffle = currentTime - lastRaffleTime.toNumber();
      console.log("⏰ Time Since Last Raffle:", timeSinceLastRaffle, "seconds");
      
      const rateLimit = await factory.RATE_LIMIT();
      console.log("✅ Rate limit OK:", timeSinceLastRaffle >= rateLimit.toNumber());
      
    } catch (error) {
      console.log("❌ Rate limit check failed:", error.message);
    }

    // 4. Check blacklist status
    console.log("\n4️⃣ BLACKLIST CHECK");
    try {
      const blacklisted = await factory.blacklistedNFTs(nftContract);
      console.log("🚫 NFT Contract Blacklisted:", blacklisted);
    } catch (error) {
      console.log("❌ Blacklist check failed:", error.message);
    }

    // 5. Test gas estimation
    console.log("\n5️⃣ GAS ESTIMATION TEST");
    try {
      const gasEstimate = await factory.estimateGas.createRaffle(
        nftContract,
        tokenId,
        "1000000000000000", // 0.001 ETH
        100,
        3600,
        { from: userAddress }
      );
      console.log("✅ Gas estimate:", gasEstimate.toString());
    } catch (error) {
      console.log("❌ Gas estimation failed:", error.message);
      if (error.reason) {
        console.log("🔍 Revert reason:", error.reason);
      }
      if (error.data) {
        console.log("🔍 Error data:", error.data);
      }
    }

    // 6. Check contract constants
    console.log("\n6️⃣ CONTRACT CONSTANTS");
    try {
      const minDuration = await factory.MIN_DURATION();
      const maxDuration = await factory.MAX_DURATION();
      const maxTickets = await factory.MAX_TICKETS();
      const maxFee = await factory.MAX_FEE();
      
      console.log("⏱️  Min Duration:", minDuration.toString(), "seconds");
      console.log("⏱️  Max Duration:", maxDuration.toString(), "seconds");
      console.log("🎫 Max Tickets:", maxTickets.toString());
      console.log("💰 Max Fee:", maxFee.toString(), "basis points");
      
      // Validate our parameters
      const ticketPrice = "1000000000000000"; // 0.001 ETH
      const maxTicketsParam = 100;
      const duration = 3600; // 1 hour
      
      console.log("\n📋 Parameter Validation:");
      console.log("✅ Ticket price > 0:", ticketPrice > 0);
      console.log("✅ Max tickets valid:", maxTicketsParam > 0 && maxTicketsParam <= maxTickets.toNumber());
      console.log("✅ Duration valid:", duration >= minDuration.toNumber() && duration <= maxDuration.toNumber());
      
    } catch (error) {
      console.log("❌ Constants check failed:", error.message);
    }

    // 7. Check if we can create RaffleContractSecureV3
    console.log("\n7️⃣ RAFFLE CONTRACT CREATION TEST");
    try {
      const RaffleContract = await ethers.getContractFactory("RaffleContractSecureV3");
      console.log("✅ RaffleContractSecureV3 factory available");
      
      // Test deployment (this will cost gas but helps debug)
      console.log("🧪 Testing contract creation...");
      const testRaffle = await RaffleContract.deploy();
      await testRaffle.deployed();
      console.log("✅ RaffleContractSecureV3 can be created at:", testRaffle.address);
      
    } catch (error) {
      console.log("❌ Raffle contract creation failed:", error.message);
    }

  } catch (error) {
    console.log("❌ Audit failed:", error.message);
  }

  console.log("\n🏁 AUDIT COMPLETE");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });