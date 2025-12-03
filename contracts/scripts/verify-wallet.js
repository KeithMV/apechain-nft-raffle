const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
    const wallet = new ethers.Wallet(process.env.CREATOR_PRIVATE_KEY);
    console.log('Private key corresponds to wallet:', wallet.address);
}

main().catch(console.error);