const { ethers } = require('ethers');
require('dotenv').config();

const FACTORY_ADDRESS = '0x0D0cd14b36B5FBb10F274cd3EC2FA3bBa79FC900';

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(process.env.APECHAIN_RPC_URL);
    const signer = new ethers.Wallet(process.env.CREATOR_PRIVATE_KEY, provider);
    
    const factoryABI = [
        'function withdrawFees() external',
        'function owner() external view returns (address)'
    ];
    
    const factory = new ethers.Contract(FACTORY_ADDRESS, factoryABI, signer);
    
    // Check factory balance
    const balance = await provider.getBalance(FACTORY_ADDRESS);
    console.log('Factory balance:', ethers.utils.formatEther(balance), 'APE');
    
    // Check owner
    const owner = await factory.owner();
    console.log('Factory owner:', owner);
    console.log('Script wallet:', signer.address);
    

    
    if (owner.toLowerCase() !== signer.address.toLowerCase()) {
        console.log('❌ You are not the factory owner, cannot withdraw fees');
        return;
    }
    
    if (balance.eq(0)) {
        console.log('❌ No fees to withdraw');
        return;
    }
    
    console.log('💰 Withdrawing', ethers.utils.formatEther(balance), 'APE to your wallet...');
    
    const tx = await factory.withdrawFees();
    await tx.wait();
    
    console.log('✅ Fees withdrawn! Transaction:', tx.hash);
    console.log('💰 Check your wallet balance!');
}

main().catch(console.error);