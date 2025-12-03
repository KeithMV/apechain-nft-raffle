const { ethers } = require('ethers');
require('dotenv').config();

const RAFFLE_ADDRESSES = [
    '0xcB46a26776EBD84940242950a908c6bEd82793DC',
];

const RAFFLE_ABI = [
    'function getRaffleInfo() external view returns (tuple(address nftContract, uint256 tokenId, address creator, uint256 ticketPrice, uint256 maxTickets, uint256 ticketsSold, uint256 endTime, address winner, bool completed, uint256 platformFee))',
    'function getTotalTickets() external view returns (uint256)',
    'function isActive() external view returns (bool)',
    'function emergencySelectWinner() external',
    'function commitRandomness(bytes32 _commitHash) external',
    'function revealAndSelectWinner(uint256 _nonce) external',
    'function commitPhase() external view returns (bool)',
    'function revealDeadline() external view returns (uint256)',
    'function factory() external view returns (address)'
];

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(process.env.APECHAIN_RPC_URL);
    const signer = new ethers.Wallet(process.env.CREATOR_PRIVATE_KEY, provider);
    console.log('Processing raffles with account:', signer.address);

    for (let i = 0; i < RAFFLE_ADDRESSES.length; i++) {
        const raffleAddress = RAFFLE_ADDRESSES[i];
        console.log(`\nProcessing raffle ${i + 1}/${RAFFLE_ADDRESSES.length}: ${raffleAddress}`);
        
        try {
            const raffle = new ethers.Contract(raffleAddress, RAFFLE_ABI, signer);
            
            // Get raffle info
            const raffleInfo = await raffle.getRaffleInfo();
            const totalTickets = await raffle.getTotalTickets();
            const isActive = await raffle.isActive();
            const balance = await provider.getBalance(raffleAddress);
            
            console.log(`  Creator: ${raffleInfo.creator}`);
            console.log(`  Tickets sold: ${raffleInfo.ticketsSold}/${raffleInfo.maxTickets}`);
            console.log(`  Total tickets: ${totalTickets}`);
            console.log(`  Completed: ${raffleInfo.completed}`);
            console.log(`  Active: ${isActive}`);
            console.log(`  Balance: ${ethers.utils.formatEther(balance)} APE`);
            console.log(`  End time: ${new Date(raffleInfo.endTime * 1000)}`);
            
            // Check if raffle can be completed
            if (!raffleInfo.completed && totalTickets > 0) {
                const now = Math.floor(Date.now() / 1000);
                const canComplete = now >= raffleInfo.endTime || raffleInfo.ticketsSold >= raffleInfo.maxTickets;
                
                if (canComplete) {
                    console.log(`  ⚡ Raffle can be completed to release fees`);
                    
                    try {
                        // Check if we're in commit phase
                        const inCommitPhase = await raffle.commitPhase();
                        console.log(`  Commit phase: ${inCommitPhase}`);
                        
                        if (inCommitPhase) {
                            // Need to commit randomness first
                            const randomNonce = Math.floor(Math.random() * 1000000);
                            const commitHash = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(['uint256'], [randomNonce]));
                            
                            console.log(`  📝 Committing randomness...`);
                            const commitTx = await raffle.commitRandomness(commitHash);
                            await commitTx.wait();
                            console.log(`  ✅ Committed: ${commitTx.hash}`);
                            
                            // Wait a moment then reveal
                            console.log(`  🎲 Revealing and selecting winner...`);
                            const revealTx = await raffle.revealAndSelectWinner(randomNonce);
                            await revealTx.wait();
                            console.log(`  ✅ Winner selected: ${revealTx.hash}`);
                            
                        } else {
                            // Check if we can do emergency selection
                            try {
                                const revealDeadline = await raffle.revealDeadline();
                                if (now > revealDeadline) {
                                    console.log(`  🚨 Using emergency selection...`);
                                    const emergencyTx = await raffle.emergencySelectWinner();
                                    await emergencyTx.wait();
                                    console.log(`  ✅ Emergency winner selected: ${emergencyTx.hash}`);
                                } else {
                                    console.log(`  ⏳ Waiting for reveal deadline: ${new Date(revealDeadline * 1000)}`);
                                }
                            } catch (error) {
                                console.log(`  ❌ Emergency selection failed: ${error.message.split('\n')[0]}`);
                            }
                        }
                        
                    } catch (error) {
                        console.log(`  ❌ Completion failed: ${error.message.split('\n')[0]}`);
                    }
                } else {
                    console.log(`  ⏳ Raffle still active, cannot complete yet`);
                }
            } else if (raffleInfo.completed) {
                console.log(`  ✅ Raffle already completed, fees should be distributed`);
            } else {
                console.log(`  ❌ No tickets sold, nothing to recover`);
            }
            
        } catch (error) {
            console.log(`  ❌ Error processing raffle: ${error.message.split('\n')[0]}`);
        }
    }
    
    console.log(`\n💰 Check your wallet balance for recovered fees!`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });