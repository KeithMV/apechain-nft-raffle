/**
 * FORM PARAMETER VALIDATOR
 * Copy and paste this into browser console to check your raffle creation parameters
 */

function validateRaffleParameters() {
  console.log('🔍 VALIDATING RAFFLE PARAMETERS');
  console.log('================================');
  
  // Get form values from your page (adjust selectors if needed)
  const getFormValue = (selector) => {
    const element = document.querySelector(selector);
    return element ? element.value : null;
  };
  
  // Try to find form inputs (common selectors)
  const nftContract = getFormValue('input[placeholder*="NFT Contract"]') || 
                     getFormValue('input[name="nftContract"]') ||
                     '0x87Aaf35253D16895111f4Bc0AD6BddE5Be0554b7'; // Your known NFT
  
  const tokenId = getFormValue('input[placeholder*="Token ID"]') || 
                 getFormValue('input[name="tokenId"]') ||
                 '625'; // Your known token
  
  const ticketPrice = getFormValue('input[placeholder*="Ticket Price"]') || 
                     getFormValue('input[name="ticketPrice"]') ||
                     '0.001'; // Default test value
  
  const maxTickets = getFormValue('input[placeholder*="Max Tickets"]') || 
                    getFormValue('input[name="maxTickets"]') ||
                    '10'; // Default test value
  
  const duration = getFormValue('input[placeholder*="Duration"]') || 
                  getFormValue('input[name="duration"]') ||
                  '24'; // Default 24 hours
  
  console.log('📋 FORM VALUES:');
  console.log('NFT Contract:', nftContract);
  console.log('Token ID:', tokenId);
  console.log('Ticket Price:', ticketPrice);
  console.log('Max Tickets:', maxTickets);
  console.log('Duration (hours):', duration);
  
  // Validate each parameter according to your contract requirements
  console.log('\\n🔍 PARAMETER VALIDATION:');
  
  // 1. NFT Contract Address
  const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(nftContract);
  console.log('1. NFT Contract Address:', isValidAddress ? '✅ VALID' : '❌ INVALID');
  if (!isValidAddress) {
    console.log('   Error: Must be 42-character hex address starting with 0x');
  }
  
  // 2. Token ID
  const tokenIdNum = parseInt(tokenId);
  const isValidTokenId = !isNaN(tokenIdNum) && tokenIdNum >= 0;
  console.log('2. Token ID:', isValidTokenId ? '✅ VALID' : '❌ INVALID');
  if (!isValidTokenId) {
    console.log('   Error: Must be a positive number');
  }
  
  // 3. Ticket Price
  const ticketPriceNum = parseFloat(ticketPrice);
  const isValidTicketPrice = !isNaN(ticketPriceNum) && ticketPriceNum > 0;
  console.log('3. Ticket Price:', isValidTicketPrice ? '✅ VALID' : '❌ INVALID');
  if (!isValidTicketPrice) {
    console.log('   Error: Must be greater than 0');
  }
  
  // 4. Max Tickets
  const maxTicketsNum = parseInt(maxTickets);
  const isValidMaxTickets = !isNaN(maxTicketsNum) && maxTicketsNum > 0 && maxTicketsNum <= 10000;
  console.log('4. Max Tickets:', isValidMaxTickets ? '✅ VALID' : '❌ INVALID');
  if (!isValidMaxTickets) {
    console.log('   Error: Must be between 1 and 10,000');
  }
  
  // 5. Duration (convert to seconds for contract)
  const durationHours = parseInt(duration);
  const durationSeconds = durationHours * 3600;
  const isValidDuration = !isNaN(durationHours) && durationSeconds >= 3600 && durationSeconds <= 2592000;
  console.log('5. Duration:', isValidDuration ? '✅ VALID' : '❌ INVALID');
  console.log('   Hours:', durationHours, '| Seconds:', durationSeconds);
  if (!isValidDuration) {
    console.log('   Error: Must be between 1 hour (3600s) and 30 days (2592000s)');
    console.log('   Current:', durationSeconds, 'seconds');
  }
  
  // Summary
  console.log('\\n📊 VALIDATION SUMMARY:');
  const allValid = isValidAddress && isValidTokenId && isValidTicketPrice && isValidMaxTickets && isValidDuration;
  console.log('All parameters valid:', allValid ? '✅ YES' : '❌ NO');
  
  if (allValid) {
    console.log('\\n🎯 PARAMETERS READY FOR CONTRACT:');
    console.log('nftContract:', nftContract);
    console.log('tokenId:', tokenIdNum);
    console.log('ticketPrice:', ticketPriceNum, 'POL');
    console.log('maxTickets:', maxTicketsNum);
    console.log('duration:', durationSeconds, 'seconds');
    
    // Show what the contract call would look like
    console.log('\\n🔧 CONTRACT CALL PREVIEW:');
    console.log('createRaffle(');
    console.log('  nftContract:', nftContract);
    console.log('  tokenId:', tokenIdNum);
    console.log('  ticketPrice:', (ticketPriceNum * 1e18).toString(), '// Wei');
    console.log('  maxTickets:', maxTicketsNum);
    console.log('  duration:', durationSeconds);
    console.log(')');
  }
  
  return {
    nftContract,
    tokenId: tokenIdNum,
    ticketPrice: ticketPriceNum,
    maxTickets: maxTicketsNum,
    duration: durationSeconds,
    allValid
  };
}

// Run the validation
const params = validateRaffleParameters();