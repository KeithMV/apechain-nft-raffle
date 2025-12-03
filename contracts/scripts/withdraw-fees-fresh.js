const { ethers } = require('ethers');
require('dotenv').config();

const FACTORY_ADDRESS = '0x0D0cd14b36B5FBb10F274cd3EC2FA3bBa79FC900';

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(process.env.APECHAIN_RPC_URL);
    const signer = new ethers.Wallet(process.env.CREATOR_PRIVATE_KEY, provider);
    
    console.log('Using wallet:', signer.address);
    
    const factoryABI = ['function withdrawFees() external'];
    const factory = new ethers.Contract(FACTORY_ADDRESS, factoryABI, signer);
    
    const balance = await provider.getBalance(FACTORY_ADDRESS);
    console.log('Factory balance:', ethers.utils.formatEther(balance), 'APE');
    
    console.log('💰 Withdrawing fees...');
    const tx = await factory.withdrawFees();
    await tx.wait();
    
    console.log('✅ Fees withdrawn! Transaction:', tx.hash);
}

main().catch(console.error);