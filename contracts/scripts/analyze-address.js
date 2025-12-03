const { ethers } = require("hardhat");

async function main() {
  const provider = new ethers.providers.JsonRpcProvider("https://apechain.calderachain.xyz/http");
  
  const ADDRESS = "0x0D0cd14b36B5FBb10F274cd3EC2FA3bBa79FC900";
  
  console.log("🔍 ADDRESS ANALYSIS");
  console.log("=".repeat(50));
  console.log(`Address: ${ADDRESS}`);
  
  try {
    // Check if it has code (is a contract)
    const code = await provider.getCode(ADDRESS);
    const balance = await provider.getBalance(ADDRESS);
    
    console.log(`Balance: ${ethers.utils.formatEther(balance)} APE`);
    
    if (code === "0x") {
      console.log("Type: Externally Owned Account (EOA/Wallet)");
      return;
    }
    
    console.log("Type: Smart Contract");
    
    // Try different contract interfaces to identify what it is
    
    // Check if it's a raffle contract
    try {
      const raffle = new ethers.Contract(
        ADDRESS,
        [
          "function getRaffleInfo() view returns (tuple(address nftContract, uint256 tokenId, address creator, uint256 ticketPrice, uint256 maxTickets, uint256 ticketsSold, uint256 endTime, address winner, bool completed, uint256 platformFee))"
        ],
        provider
      );
      
      const raffleInfo = await raffle.getRaffleInfo();
      
      console.log("\n✅ This is a RAFFLE CONTRACT");
      console.log(`Creator: ${raffleInfo.creator}`);
      console.log(`NFT Contract: ${raffleInfo.nftContract}`);
      console.log(`Token ID: ${raffleInfo.tokenId.toString()}`);
      console.log(`Ticket Price: ${ethers.utils.formatEther(raffleInfo.ticketPrice)} APE`);
      console.log(`Max Tickets: ${raffleInfo.maxTickets.toString()}`);
      console.log(`Tickets Sold: ${raffleInfo.ticketsSold.toString()}`);
      console.log(`End Time: ${new Date(Number(raffleInfo.endTime) * 1000).toLocaleString()}`);
      console.log(`Winner: ${raffleInfo.winner}`);
      console.log(`Completed: ${raffleInfo.completed}`);
      console.log(`Platform Fee: ${raffleInfo.platformFee.toString() / 100}%`);
      
      return;
    } catch (e) {
      // Not a raffle contract
    }
    
    // Check if it's a factory contract
    try {
      const factory = new ethers.Contract(
        ADDRESS,
        [
          "function owner() view returns (address)",
          "function platformFee() view returns (uint256)",
          "function raffleCounter() view returns (uint256)"
        ],
        provider
      );
      
      const owner = await factory.owner();
      const platformFee = await factory.platformFee();
      const raffleCounter = await factory.raffleCounter();
      
      console.log("\n✅ This is a FACTORY CONTRACT");
      console.log(`Owner: ${owner}`);
      console.log(`Platform Fee: ${platformFee.toString() / 100}%`);
      console.log(`Raffles Created: ${raffleCounter.toString()}`);
      
      return;
    } catch (e) {
      // Not a factory contract
    }
    
    // Check if it's an NFT contract
    try {
      const nft = new ethers.Contract(
        ADDRESS,
        [
          "function name() view returns (string)",
          "function symbol() view returns (string)",
          "function totalSupply() view returns (uint256)"
        ],
        provider
      );
      
      const name = await nft.name();
      const symbol = await nft.symbol();
      
      console.log("\n✅ This is an NFT CONTRACT");
      console.log(`Name: ${name}`);
      console.log(`Symbol: ${symbol}`);
      
      try {
        const totalSupply = await nft.totalSupply();
        console.log(`Total Supply: ${totalSupply.toString()}`);
      } catch (e) {
        // Some NFTs don't have totalSupply
      }
      
      return;
    } catch (e) {
      // Not an NFT contract
    }
    
    console.log("\n❓ Unknown contract type");
    console.log("This contract doesn't match known interfaces (Raffle, Factory, or NFT)");
    
  } catch (error) {
    console.error("❌ Analysis failed:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });