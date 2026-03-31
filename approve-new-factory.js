// COPY AND PASTE THIS INTO BROWSER CONSOLE ON YOUR FRONTEND

async function approveNewFactory() {
    console.log("🔧 APPROVING NEW V4 FACTORY");
    
    const nftContract = "0x87Aaf35253D16895111f4Bc0AD6BddE5Be0554b7";
    const newFactoryAddress = "0xC9Bd344f5E31481F202E400C33210Bd1AB542b42";
    
    console.log("NFT Contract:", nftContract);
    console.log("New Factory:", newFactoryAddress);
    
    try {
        // Approve the new factory for all NFTs
        const approveData = `0xa22cb465${newFactoryAddress.slice(2).padStart(64, '0')}${'1'.padStart(64, '0')}`;
        
        const tx = await window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [{
                from: window.ethereum.selectedAddress,
                to: nftContract,
                data: approveData
            }]
        });
        
        console.log("✅ Approval transaction sent:", tx);
        console.log("⏳ Wait for confirmation, then try creating raffle again");
        
    } catch (error) {
        console.error("❌ Approval failed:", error);
    }
}

// Run the function
approveNewFactory();