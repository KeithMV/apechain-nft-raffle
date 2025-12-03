const { ethers } = require("hardhat");

async function main() {
  const provider = new ethers.providers.JsonRpcProvider("https://apechain.calderachain.xyz/http");
  
  const TX_HASH = "0x0de1dcf7aab0c158f4255b170c6adeebe2a34f6767a2e29d3cf52c324f23e7e5";
  const EXPECTED_PLATFORM_WALLET = "0x4dF4e9aeb0d58AbE64E7FbC0160119304e9764E4";
  const OLD_PLATFORM_WALLET = "0xEd742234f5F28A01832fdc4d84e4E2b601De68Ee";
  
  console.log("🔍 ANALYZING TEST TRANSACTION");
  console.log("=".repeat(50));
  console.log(`Transaction: ${TX_HASH}`);
  console.log(`Expected Platform Wallet: ${EXPECTED_PLATFORM_WALLET}`);
  
  try {
    const tx = await provider.getTransaction(TX_HASH);
    const receipt = await provider.getTransactionReceipt(TX_HASH);
    
    console.log(`\n📋 TRANSACTION DETAILS`);
    console.log(`From: ${tx.from}`);
    console.log(`To: ${tx.to} (Raffle Contract)`);
    console.log(`Value: ${ethers.utils.formatEther(tx.value)} APE`);
    console.log(`Gas Used: ${receipt.gasUsed.toString()}`);
    console.log(`Status: ${receipt.status === 1 ? '✅ Success' : '❌ Failed'}`);
    console.log(`Block: ${receipt.blockNumber}`);
    
    if (receipt.status !== 1) {
      console.log("❌ Transaction failed - no fee analysis possible");
      return;
    }
    
    // Expected platform fee (10% of ticket price)
    const ticketPrice = tx.value;
    const expectedPlatformFee = ticketPrice.mul(10).div(100); // 10%
    
    console.log(`\n💰 EXPECTED FEES`);
    console.log(`Ticket Price: ${ethers.utils.formatEther(ticketPrice)} APE`);
    console.log(`Expected Platform Fee: ${ethers.utils.formatEther(expectedPlatformFee)} APE`);
    
    // Check balance changes for both wallets
    console.log(`\n🔍 BALANCE CHANGE ANALYSIS`);
    
    const blockNumber = receipt.blockNumber;
    
    // Check new platform wallet
    const newWalletBefore = await provider.getBalance(EXPECTED_PLATFORM_WALLET, blockNumber - 1);
    const newWalletAfter = await provider.getBalance(EXPECTED_PLATFORM_WALLET, blockNumber);
    const newWalletChange = newWalletAfter.sub(newWalletBefore);
    
    console.log(`New Platform Wallet (${EXPECTED_PLATFORM_WALLET}):`);
    console.log(`  Before: ${ethers.utils.formatEther(newWalletBefore)} APE`);
    console.log(`  After:  ${ethers.utils.formatEther(newWalletAfter)} APE`);
    console.log(`  Change: ${ethers.utils.formatEther(newWalletChange)} APE`);
    
    // Check old platform wallet
    const oldWalletBefore = await provider.getBalance(OLD_PLATFORM_WALLET, blockNumber - 1);
    const oldWalletAfter = await provider.getBalance(OLD_PLATFORM_WALLET, blockNumber);
    const oldWalletChange = oldWalletAfter.sub(oldWalletBefore);
    
    console.log(`\nOld Platform Wallet (${OLD_PLATFORM_WALLET}):`);
    console.log(`  Before: ${ethers.utils.formatEther(oldWalletBefore)} APE`);
    console.log(`  After:  ${ethers.utils.formatEther(oldWalletAfter)} APE`);
    console.log(`  Change: ${ethers.utils.formatEther(oldWalletChange)} APE`);
    
    // Analyze the results
    console.log(`\n📊 ANALYSIS RESULTS`);
    console.log("=".repeat(30));
    
    const tolerance = ethers.utils.parseEther("0.001"); // Small tolerance for gas
    
    if (newWalletChange.gte(expectedPlatformFee.sub(tolerance))) {
      console.log("🎉 SUCCESS! Platform fee went to NEW wallet");
      console.log(`✅ Fee received: ${ethers.utils.formatEther(newWalletChange)} APE`);
      console.log(`✅ Expected: ${ethers.utils.formatEther(expectedPlatformFee)} APE`);
      console.log("✅ Ownership transfer is working correctly!");
      
    } else if (oldWalletChange.gte(expectedPlatformFee.sub(tolerance))) {
      console.log("❌ PROBLEM: Platform fee went to OLD wallet");
      console.log(`❌ Fee received by old wallet: ${ethers.utils.formatEther(oldWalletChange)} APE`);
      console.log("❌ This raffle was created before ownership transfer");
      
    } else {
      console.log("❓ UNCLEAR: No significant balance change detected");
      console.log("🔍 Fee might be held in contract or sent elsewhere");
    }
    
    // Check transaction logs for more details
    console.log(`\n📋 TRANSACTION LOGS ANALYSIS`);
    console.log(`Total Logs: ${receipt.logs.length}`);
    
    let ticketsPurchasedFound = false;
    let platformFeeFound = false;
    
    for (let i = 0; i < receipt.logs.length; i++) {
      const log = receipt.logs[i];
      
      try {
        // Check for TicketsPurchased event
        if (log.topics[0] === ethers.utils.id("TicketsPurchased(address,uint256,uint256)")) {
          const buyer = ethers.utils.getAddress("0x" + log.topics[1].slice(26));
          const abiCoder = ethers.utils.defaultAbiCoder;
          const decoded = abiCoder.decode(["uint256", "uint256"], log.data);
          
          console.log(`\n🎫 TICKETS PURCHASED EVENT:`);
          console.log(`  Buyer: ${buyer}`);
          console.log(`  Quantity: ${decoded[0].toString()}`);
          console.log(`  Total Amount: ${ethers.utils.formatEther(decoded[1])} APE`);
          ticketsPurchasedFound = true;
        }
        
        // Check for platform fee transfer events
        if (log.topics[0] === ethers.utils.id("PlatformFeeTransferred(address,uint256)")) {
          const recipient = ethers.utils.getAddress("0x" + log.topics[1].slice(26));
          const amount = ethers.BigNumber.from(log.data);
          
          console.log(`\n💰 PLATFORM FEE TRANSFERRED EVENT:`);
          console.log(`  Recipient: ${recipient}`);
          console.log(`  Amount: ${ethers.utils.formatEther(amount)} APE`);
          
          if (recipient.toLowerCase() === EXPECTED_PLATFORM_WALLET.toLowerCase()) {
            console.log(`  ✅ Fee went to CORRECT wallet!`);
          } else {
            console.log(`  ❌ Fee went to WRONG wallet!`);
          }
          platformFeeFound = true;
        }
        
      } catch (e) {
        // Skip if can't decode
      }
    }
    
    if (!ticketsPurchasedFound) {
      console.log("\n⚠️  No TicketsPurchased event found");
    }
    
    if (!platformFeeFound) {
      console.log("\n⚠️  No PlatformFeeTransferred event found");
    }
    
    // Final verdict
    console.log(`\n🎯 FINAL VERDICT`);
    console.log("=".repeat(20));
    
    if (newWalletChange.gte(expectedPlatformFee.sub(tolerance))) {
      console.log("🎉 PLATFORM FEE COLLECTION IS WORKING!");
      console.log("✅ New raffles send fees to correct wallet");
      console.log("✅ Ownership transfer successful");
    } else {
      console.log("❌ Platform fee collection needs investigation");
      console.log("🔧 May need to check raffle contract implementation");
    }
    
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