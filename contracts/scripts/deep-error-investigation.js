const { ethers } = require('hardhat');

async function main() {
  console.log('🔍 Deep Investigation of 0xe1f1d02e Error...\n');

  // The exact error from frontend logs
  const errorSignature = '0xe1f1d02e';
  
  console.log('Error Signature:', errorSignature);
  console.log('Error as bytes:', ethers.utils.arrayify(errorSignature));
  
  // Let's check if this matches any known Solidity errors
  const commonErrors = {
    '0x08c379a0': 'Error(string)',
    '0x4e487b71': 'Panic(uint256)', 
    '0xe1f1d02e': 'Unknown custom error'
  };
  
  console.log('Known error types:', commonErrors);
  
  // Let's try to call the actual contract with the exact same parameters
  const factoryAddress = '0xaD3B887a57a9e3a3103De2a372BC3834A7C5023c';
  const nftContract = '0x3f58c6eb6a3f58cf137ac093856f0b6e83727260';
  const tokenId = '1064';
  const userAddress = '0x1Dfb09d1969A11AF5196629c2E6B220898Ab538e';
  
  console.log('\n🧪 Testing with exact frontend parameters...');
  
  const factoryABI = [
    'function createRaffle(address nftContract, uint256 tokenId, uint256 ticketPrice, uint256 maxTickets, uint256 duration) external',
    'function lastRaffleTime(address) external view returns (uint256)',
    'function platformFee() external view returns (uint256)',
    'function paused() external view returns (bool)'
  ];
  
  const factory = new ethers.Contract(factoryAddress, factoryABI, ethers.provider);
  
  // Check current state
  console.log('Current contract state:');
  const lastTime = await factory.lastRaffleTime(userAddress);
  const isPaused = await factory.paused();
  const platformFee = await factory.platformFee();
  
  console.log('Last raffle time:', lastTime.toString());
  console.log('Is paused:', isPaused);
  console.log('Platform fee:', platformFee.toString());
  
  // Try the exact call that's failing
  try {
    console.log('\n🎯 Attempting exact createRaffle call...');
    
    // Use a signer to simulate the actual call
    const provider = ethers.provider;
    const result = await provider.call({
      to: factoryAddress,
      data: factory.interface.encodeFunctionData('createRaffle', [
        nftContract,
        tokenId,
        ethers.utils.parseEther('0.001'),
        10,
        3600
      ]),
      from: userAddress
    });
    
    console.log('Call succeeded:', result);
    
  } catch (error) {
    console.log('❌ Call failed with error:');
    console.log('Error data:', error.data);
    console.log('Error message:', error.message);
    
    if (error.data === errorSignature) {
      console.log('🎯 EXACT MATCH! This is the same error from frontend');
      
      // Let's try to decode what this error means
      // Check if it's a custom error from the contract
      console.log('\n🔍 Analyzing error signature...');
      
      // Convert to function selector format
      const selector = errorSignature.slice(2); // Remove 0x
      console.log('Function selector:', selector);
      
      // This might be a custom error. Let's check the contract source
      console.log('This appears to be a custom error not in the ABI');
      console.log('Possible causes:');
      console.log('1. Contract has custom errors not in our ABI');
      console.log('2. Contract was upgraded/changed');
      console.log('3. Wrong contract version deployed');
    }
  }
  
  // Let's also check if the contract bytecode matches what we expect
  console.log('\n🔍 Contract verification...');
  const code = await ethers.provider.getCode(factoryAddress);
  console.log('Contract has code:', code.length > 2);
  console.log('Code length:', code.length);
  
  // Check if this is actually a V4 contract by looking for V4-specific functions
  const v4Functions = [
    'lastRaffleTime(address)',
    'RATE_LIMIT()'
  ];
  
  for (const func of v4Functions) {
    try {
      const selector = ethers.utils.id(func).slice(0, 10);
      console.log(`Function ${func} selector:`, selector);
      
      // Check if this selector exists in the bytecode
      if (code.includes(selector.slice(2))) {
        console.log(`✅ ${func} found in contract`);
      } else {
        console.log(`❌ ${func} NOT found in contract`);
      }
    } catch (e) {
      console.log(`Error checking ${func}:`, e.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });