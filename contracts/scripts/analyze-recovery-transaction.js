const { ethers } = require('ethers');
require('dotenv').config();

const TX_HASH = '0xb6e6ca7c2c5958b86c585e1d6bbd55f0e370c4173127675bf1df3b61eb7cf36d';

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(process.env.APECHAIN_RPC_URL);
    
    console.log('Analyzing transaction:', TX_HASH);
    
    const tx = await provider.getTransaction(TX_HASH);
    const receipt = await provider.getTransactionReceipt(TX_HASH);
    
    console.log('\n=== TRANSACTION DETAILS ===');
    console.log('From:', tx.from);
    console.log('To:', tx.to);
    console.log('Value:', ethers.utils.formatEther(tx.value), 'APE');
    console.log('Gas used:', receipt.gasUsed.toString());
    console.log('Status:', receipt.status === 1 ? 'Success' : 'Failed');
    
    console.log('\n=== EVENTS/LOGS ===');
    for (let i = 0; i < receipt.logs.length; i++) {
        const log = receipt.logs[i];
        console.log(`Log ${i + 1}:`);
        console.log('  Address:', log.address);
        console.log('  Topics:', log.topics);
        console.log('  Data:', log.data);
        
        // Try to decode common events
        if (log.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef') {
            // Transfer event
            const from = '0x' + log.topics[1].slice(26);
            const to = '0x' + log.topics[2].slice(26);
            const amount = ethers.BigNumber.from(log.data);
            console.log(`  -> Transfer: ${ethers.utils.formatEther(amount)} APE from ${from} to ${to}`);
        }
    }
    
    // Check balance changes
    console.log('\n=== BALANCE ANALYSIS ===');
    const raffle = '0xcB46a26776EBD84940242950a908c6bEd82793DC';
    const factory = '0x0D0cd14b36B5FBb10F274cd3EC2FA3bBa79FC900';
    const wallet1 = '0xEd742234f5F28A01832fdc4d84e4E2b601De68Ee';
    const wallet2 = '0x4dF4e9aeb0d58AbE64E7FbC0160119304e9764E4';
    
    const raffleBalance = await provider.getBalance(raffle);
    const factoryBalance = await provider.getBalance(factory);
    const wallet1Balance = await provider.getBalance(wallet1);
    const wallet2Balance = await provider.getBalance(wallet2);
    
    console.log('Raffle balance:', ethers.utils.formatEther(raffleBalance), 'APE');
    console.log('Factory balance:', ethers.utils.formatEther(factoryBalance), 'APE');
    console.log('Wallet1 balance:', ethers.utils.formatEther(wallet1Balance), 'APE');
    console.log('Wallet2 balance:', ethers.utils.formatEther(wallet2Balance), 'APE');
}

main().catch(console.error);