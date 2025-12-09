// Gas Estimation Recovery Tracker
// Run this in browser console to monitor when gas estimation returns to normal

let gasTracker = {
  startTime: null,
  lastRaffleTime: null,
  checkInterval: null,
  
  start() {
    this.startTime = Date.now();
    this.lastRaffleTime = Date.now();
    console.log('🔍 Gas Estimation Tracker Started');
    console.log('⏰ Last raffle created at:', new Date().toLocaleTimeString());
    
    // Check every 30 seconds
    this.checkInterval = setInterval(() => {
      this.checkGasEstimation();
    }, 30000);
    
    // Also check immediately
    setTimeout(() => this.checkGasEstimation(), 5000);
  },
  
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    console.log('⏹️ Gas Estimation Tracker Stopped');
  },
  
  async checkGasEstimation() {
    const now = Date.now();
    const minutesSinceLastRaffle = Math.floor((now - this.lastRaffleTime) / 60000);
    
    try {
      // Test gas estimation with same createRaffle call
      const response = await fetch('https://apechain.calderachain.xyz/http', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_estimateGas',
          params: [{
            from: '0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5e',
            to: '0x1dC9F6Cc2e53558a940a7Cd87d6e5fbE2A8635ff',
            data: '0x4b8bcb940000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000038d7ea4c68000000000000000000000000000000000000000000000000000000000000000012c00000000000000000000000000000000000000000000000000000000000000000a5465737420526166666c650000000000000000000000000000000000000000'
          }]
        })
      });
      
      const result = await response.json();
      const gasHex = result.result;
      
      if (gasHex && gasHex !== 'undefined') {
        const gasDecimal = parseInt(gasHex, 16);
        const costUSD = (gasDecimal * 25000000000 / 1e18) * 3000;
        
        if (costUSD < 1) { // Normal gas cost
          console.log(`✅ GAS ESTIMATION RECOVERED! After ${minutesSinceLastRaffle} minutes`);
          console.log(`💰 Normal gas cost: $${costUSD.toFixed(6)}`);
          console.log(`⏱️ Recovery time: ${minutesSinceLastRaffle} minutes since last raffle`);
          this.stop();
          return;
        } else {
          console.log(`⚠️ Still high gas: $${costUSD.toFixed(2)} (${minutesSinceLastRaffle}min since last raffle)`);
        }
      } else {
        console.log(`❌ RPC still failing (${minutesSinceLastRaffle}min since last raffle)`);
      }
    } catch (error) {
      console.log(`🔴 Error checking gas: ${error.message} (${minutesSinceLastRaffle}min)`);
    }
  },
  
  // Call this after creating a raffle
  raffleCreated() {
    this.lastRaffleTime = Date.now();
    console.log('🎯 New raffle created, resetting timer');
  }
};

// Auto-start tracking
gasTracker.start();

console.log(`
🔍 Gas Estimation Recovery Tracker Active

Usage:
- gasTracker.raffleCreated() - Call after creating a raffle
- gasTracker.stop() - Stop monitoring
- gasTracker.start() - Resume monitoring

This will check every 30 seconds until gas estimation returns to normal.
`);

// Export for global access
window.gasTracker = gasTracker;