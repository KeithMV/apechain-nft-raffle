const { ethers } = require('hardhat');

async function main() {
  console.log('🔍 Verifying New Base Factory Deployment...\n');

  const newFactoryAddress = '0x9fBce62D6a30c278f2dD7224dc98b0cA634dFCf0';
  const provider = new ethers.providers.JsonRpcProvider('https://mainnet.base.org');
  
  console.log('📍 Factory Address:', newFactoryAddress);
  
  // Check if contract exists
  const code = await provider.getCode(newFactoryAddress);
  console.log('📄 Contract Code Length:', code.length);
  console.log('📄 Contract Deployed:', code !== '0x' ? '✅ YES' : '❌ NO');
  
  if (code === '0x') {
    console.log('❌ Contract not deployed! Need to redeploy.');
    return;
  }
  
  // Check contract functions
  const factoryABI = [
    'function raffleCounter() external view returns (uint256)',
    'function platformFee() external view returns (uint256)',
    'function paused() external view returns (bool)',
    'function owner() external view returns (address)',
    'function RATE_LIMIT() external view returns (uint256)'
  ];
  
  const factory = new ethers.Contract(newFactoryAddress, factoryABI, provider);
  
  console.log('\n🏭 Contract State:');
  try {
    console.log('- Raffle Counter:', (await factory.raffleCounter()).toString());
    console.log('- Platform Fee:', (await factory.platformFee()).toString());
    console.log('- Paused:', await factory.paused());
    console.log('- Owner:', await factory.owner());
    console.log('- Rate Limit:', (await factory.RATE_LIMIT()).toString());
    console.log('✅ Contract functions working');
  } catch (error) {
    console.log('❌ Contract function error:', error.message);
  }
  
  // The issue might be that we deployed the wrong contract
  // Let's check what contract was actually deployed
  console.log('\n🔍 Checking Contract Type:');
  
  // Try to call a function that only exists in RaffleFactoryBaseV3
  try {
    const createRaffleABI = [
      'function createRaffle(address nftContract, uint256 tokenId, uint256 ticketPrice, uint256 maxTickets, uint256 duration) external'
    ];
    
    const factoryWithCreate = new ethers.Contract(newFactoryAddress, createRaffleABI, provider);
    
    // This should not revert if the contract is correct
    const userAddress = '0x1Dfb09d1969A11AF5196629c2E6B220898Ab538e';
    const nftContract = '0x3f58c6eb6a3f58cf137ac093856f0b6e83727260';
    const tokenId = '1064';
    const ticketPrice = ethers.utils.parseEther('0.1');
    const maxTickets = 100;
    const duration = 86400;
    
    console.log('Testing createRaffle function signature...');
    
    const result = await provider.call({
      to: newFactoryAddress,
      data: factoryWithCreate.interface.encodeFunctionData('createRaffle', [
        nftContract, tokenId, ticketPrice, maxTickets, duration
      ]),
      from: userAddress
    });
    
    console.log('Static call result:', result);
    
    if (result === '0xe1f1d02e') {
      console.log('❌ Still getting the same error!');
      console.log('This suggests the issue is NOT with cloning.');
      console.log('The error might be:');
      console.log('1. NFT contract validation failing');
      console.log('2. Parameter validation failing');
      console.log('3. Some other contract logic issue');
    }
    
  } catch (error) {
    console.log('❌ Function call error:', error.message);
  }
  
  console.log('\n💡 Next Steps:');
  console.log('1. The new factory is deployed correctly');
  console.log('2. But still getting 0xe1f1d02e error');
  console.log('3. This suggests the issue is NOT template cloning');
  console.log('4. Need to investigate what 0xe1f1d02e actually means');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });