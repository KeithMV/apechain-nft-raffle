const { ethers } = require('hardhat');

async function testRaffleFactory() {
  console.log('🔍 Testing new RaffleFactory contract...');
  
  const factoryAddress = '0x05139110Db8FF9cF82A836Af95eff4530011c705';
  
  try {
    // Get the factory contract
    const RaffleFactory = await ethers.getContractFactory('RaffleFactory');
    const factory = RaffleFactory.attach(factoryAddress);
    
    console.log('📋 Factory Address:', factoryAddress);
    
    // Check basic contract state
    const raffleCounter = await factory.raffleCounter();
    console.log('🎯 Current Raffle Counter:', raffleCounter.toString());
    
    const platformFee = await factory.platformFee();
    console.log('💰 Platform Fee:', platformFee.toString(), 'basis points');
    
    const isPaused = await factory.paused();
    console.log('⏸️ Is Paused:', isPaused);
    
    // Check if we can read the template address
    try {
      const templateAddress = await factory.raffleTemplate();
      console.log('📄 Template Address:', templateAddress);
    } catch (error) {
      console.log('⚠️ Could not read template address:', error.message);
    }
    
    console.log('✅ Factory contract is accessible and functional');
    
  } catch (error) {
    console.error('❌ Error testing factory:', error.message);
  }
}

testRaffleFactory()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });