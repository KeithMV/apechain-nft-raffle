const { ethers } = require('ethers');
require('dotenv').config();

const TX_HASH = '0xb6e6ca7c2c5958b86c585e1d6bbd55f0e370c4173127675bf1df3b61eb7cf36d';

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(process.env.APECHAIN_RPC_URL);
    
    const receipt = await provider.getTransactionReceipt(TX_HASH);
    
    console.log('=== TRANSACTION ANALYSIS ===');
    console.log('Transaction:', TX_HASH);
    console.log('Status:', receipt.status === 1 ? 'Success ✅' : 'Failed ❌');
    
    for (let i = 0; i < receipt.logs.length; i++) {
        const log = receipt.logs[i];
        console.log(`\nLog ${i + 1} (${log.address}):`);
        
        // NFT Transfer event
        if (log.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef') {
            const from = '0x' + log.topics[1].slice(26);
            const to = '0x' + log.topics[2].slice(26);
            const tokenId = ethers.BigNumber.from(log.topics[3]).toString();
            console.log(`  🎨 NFT Transfer: Token #${tokenId}`);
            console.log(`     From: ${from}`);
            console.log(`     To: ${to}`);
        }
        // Winner Selected event
        else if (log.topics[0] === '0x75060f9e79552df167b73353fee6237a75bb5ba8ea022f77224e32f152138bcb') {
            const winner = '0x' + log.topics[1].slice(26);
            console.log(`  🏆 Winner Selected: ${winner}`);
        }
        // Randomness Revealed
        else if (log.topics[0] === '0x88b70371ec8ef9b20ed8a97af482308c8e8f7587260d3bb895f0fbc5d1d77ff3') {
            console.log(`  🎲 Randomness Revealed`);
        }
        else {
            console.log(`  📝 Other event: ${log.topics[0]}`);
        }
    }
    
    // Check current balances
    console.log('\n=== CURRENT BALANCES ===');
    const addresses = {
        'Raffle Contract': '0xcB46a26776EBD84940242950a908c6bEd82793DC',
        'Factory Contract': '0x0D0cd14b36B5FBb10F274cd3EC2FA3bBa79FC900',
        'Your Wallet (Ed74)': '0xEd742234f5F28A01832fdc4d84e4E2b601De68Ee',
        'Factory Owner (4dF4)': '0x4dF4e9aeb0d58AbE64E7FbC0160119304e9764E4'
    };
    
    for (const [name, address] of Object.entries(addresses)) {
        const balance = await provider.getBalance(address);
        console.log(`${name}: ${ethers.utils.formatEther(balance)} APE`);
    }
}

main().catch(console.error);