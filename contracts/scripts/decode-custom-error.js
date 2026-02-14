const { ethers } = require('hardhat');

async function main() {
  console.log('🔍 Decoding Custom Error 0xe1f1d02e...\n');

  const errorSignature = '0xe1f1d02e';
  
  // Common custom error patterns in Solidity
  const commonErrors = [
    'RateLimitExceeded()',
    'NotOwner()',
    'NotApproved()',
    'InvalidNFT()',
    'Paused()',
    'InsufficientFunds()',
    'TransferFailed()',
    'AlreadyExists()',
    'NotFound()',
    'Unauthorized()'
  ];

  console.log('🔍 Checking common error patterns:');
  for (const error of commonErrors) {
    const selector = ethers.utils.id(error).slice(0, 10);
    console.log(`${error}: ${selector}`);
    
    if (selector === errorSignature) {
      console.log(`🎯 MATCH FOUND: ${error}`);
      return;
    }
  }

  console.log('\n❌ No match found in common patterns');
  console.log('This suggests the error is from a dependency or custom implementation');

  // Let's check if it's related to OpenZeppelin or other common libraries
  const ozErrors = [
    'OwnableUnauthorizedAccount(address)',
    'ReentrancyGuardReentrantCall()',
    'EnforcedPause()',
    'ExpectedPause()',
    'ERC721NonexistentToken(uint256)',
    'ERC721IncorrectOwner(address,uint256,address)',
    'ERC721InsufficientApproval(address,uint256)'
  ];

  console.log('\n🔍 Checking OpenZeppelin error patterns:');
  for (const error of ozErrors) {
    const selector = ethers.utils.id(error).slice(0, 10);
    console.log(`${error}: ${selector}`);
    
    if (selector === errorSignature) {
      console.log(`🎯 MATCH FOUND: ${error}`);
      return;
    }
  }

  console.log('\n🔍 Manual Analysis:');
  console.log('Error signature:', errorSignature);
  console.log('As decimal:', parseInt(errorSignature, 16));
  console.log('As bytes:', Buffer.from(errorSignature.slice(2), 'hex'));

  // The error might be from the raffle template contract
  console.log('\n💡 Likely causes on Base vs ApeChain:');
  console.log('1. Template contract differences');
  console.log('2. Gas limit differences between networks');
  console.log('3. Block gas limit enforcement');
  console.log('4. EIP-1559 gas pricing differences');
  console.log('5. Contract initialization differences');

  console.log('\n🔧 Recommended fixes:');
  console.log('1. Deploy new V4 factory with updated template');
  console.log('2. Check template contract compatibility');
  console.log('3. Add manual gas limit to frontend');
  console.log('4. Update contract with better error messages');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });