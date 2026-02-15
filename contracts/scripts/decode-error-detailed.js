const { ethers } = require('hardhat');

async function main() {
  console.log('🔍 Decoding Error 0xe1f1d02e...\n');

  const errorSignature = '0xe1f1d02e';
  
  // Common Solidity errors and their signatures
  const commonErrors = [
    'NotOwner()',
    'NotApproved()',
    'InvalidNFT()',
    'Paused()',
    'InsufficientFunds()',
    'TransferFailed()',
    'AlreadyExists()',
    'NotFound()',
    'Unauthorized()',
    'RateLimitExceeded()',
    'InvalidTicketPrice()',
    'InvalidMaxTickets()',
    'InvalidDuration()',
    'NFTNotApproved()',
    'NotNFTOwner()',
    'ContractPaused()',
    'BlacklistedNFT()',
    'InvalidContract()',
    'ZeroAddress()',
    'InvalidAmount()',
    'InvalidTokenId()',
    'DurationTooShort()',
    'DurationTooLong()',
    'TooManyTickets()',
    'PriceTooLow()',
    'FeeTooHigh()',
    'MaxTicketsExceeded()',
    'MinDurationNotMet()',
    'MaxDurationExceeded()',
    'InvalidTicketCount()',
    'InvalidPayment()',
    'CreatorCannotBuy()',
    'NotEnoughTickets()',
    'WrongPayment()',
    'SoldOut()',
    'RaffleExpired()',
    'RaffleCompleted()',
    'AlreadyCompleted()',
    'NoParticipants()',
    'InvalidReveal()',
    'CommitPhaseEnded()',
    'StillInCommitPhase()',
    'RevealPeriodActive()',
    'RandomSeedNotSet()',
    'WithdrawalFailed()',
    'OnlyFactory()',
    'OnlyCreator()',
    'TicketsAlreadySold()',
    'InvalidNFTContract()',
    'NFTContractBlacklisted()',
    'RaffleStillActive()',
    'InvalidQuantity()',
    'MaxTicketsPerRaffle()',
    'MinTicketsRequired()',
    'MinDurationRequired()',
    'MaxFeeExceeded()'
  ];

  console.log('🔍 Checking error signatures:');
  let found = false;
  
  for (const error of commonErrors) {
    const selector = ethers.utils.id(error).slice(0, 10);
    if (selector === errorSignature) {
      console.log(`🎯 MATCH FOUND: ${error}`);
      console.log(`Selector: ${selector}`);
      found = true;
      break;
    }
  }
  
  if (!found) {
    console.log('❌ Error not found in common patterns');
    console.log('Let me check our specific contract errors...');
    
    // Check specific errors from our contracts
    const contractErrors = [
      'Invalid NFT contract',
      'NFT contract blacklisted', 
      'Invalid ticket price',
      'Invalid ticket count',
      'Invalid duration',
      'Rate limit exceeded',
      'Not NFT owner',
      'NFT not approved',
      'Only factory',
      'Only creator',
      'Contract paused',
      'Raffle completed',
      'Raffle expired',
      'Sold out',
      'Invalid quantity',
      'Not enough tickets',
      'Wrong payment',
      'Creator cannot buy own raffle',
      'Tickets already sold',
      'No participants',
      'Invalid reveal',
      'Commit phase ended',
      'Still in commit phase',
      'Reveal period active',
      'Random seed not set',
      'Withdrawal failed',
      'Fee too high',
      'Max 10000 tickets per raffle',
      'Min 1 ticket required',
      'Min 1 hour duration',
      'Max 20% fee'
    ];
    
    // Convert require messages to error selectors
    for (const errorMsg of contractErrors) {
      // Solidity require statements create Error(string) which has selector 0x08c379a0
      // But custom errors have different selectors
      const errorHash = ethers.utils.id(`Error(string)`);
      console.log(`"${errorMsg}": ${errorHash.slice(0, 10)}`);
    }
  }
  
  console.log('\n💡 Manual Analysis:');
  console.log('Error signature:', errorSignature);
  console.log('As decimal:', parseInt(errorSignature, 16));
  
  // Let's try to understand what this specific error means
  console.log('\n🔍 Investigating 0xe1f1d02e:');
  console.log('This error is consistently appearing on Base network');
  console.log('Even with the new direct-creation factory');
  console.log('This suggests it might be:');
  console.log('1. A Base network specific validation');
  console.log('2. An EVM difference in how contracts execute');
  console.log('3. A gas-related issue during execution');
  console.log('4. A specific validation in our contract logic');
  
  console.log('\n🔧 Debugging Strategy:');
  console.log('1. Try with different parameters');
  console.log('2. Test with a different NFT contract');
  console.log('3. Check if it\'s a gas limit issue');
  console.log('4. Compare exact same call on ApeChain vs Base');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });