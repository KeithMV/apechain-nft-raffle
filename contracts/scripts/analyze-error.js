const { ethers } = require("hardhat");

async function main() {
  console.log("\n🔍 Isolating the 0xe1f1d02e Error...\n");

  // The error signature 0xe1f1d02e as a 4-byte selector
  const errorSig = "0xe1f1d02e";
  
  console.log("Error signature:", errorSig);
  console.log("As decimal:", parseInt(errorSig, 16));
  
  // Common Solidity error patterns that could match
  const commonErrors = [
    "InsufficientBalance()",
    "TransferFailed()",
    "InvalidAmount()",
    "ContractPaused()",
    "RateLimitExceeded()",
    "InvalidNFT()",
    "NotAuthorized()",
    "TemplateError()",
    "InitializationFailed()",
    "CloneFailed()"
  ];
  
  console.log("\n🔍 Checking error signatures:");
  for (const error of commonErrors) {
    const sig = ethers.utils.id(error).slice(0, 10);
    console.log(`${error}: ${sig}`);
    if (sig === errorSig) {
      console.log(`✅ MATCH FOUND: ${error}`);
    }
  }
  
  // The issue might be in the template contract creation
  console.log("\n💡 Analysis:");
  console.log("The 0xe1f1d02e error occurs during createRaffle call");
  console.log("This suggests the template contract creation is failing");
  console.log("Possible causes:");
  console.log("1. Template contract constructor failing");
  console.log("2. Clone/proxy creation failing");
  console.log("3. Base network gas limit differences");
  console.log("4. EIP-1559 gas pricing issues");
  
  console.log("\n🔧 Recommended solution:");
  console.log("Deploy a simple V3 factory (no template cloning)");
  console.log("This will bypass the template creation issue");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });