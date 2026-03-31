require("@nomiclabs/hardhat-ethers");
require("dotenv").config();

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.19",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      },
      {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      }
    ]
  },
  networks: {
    apechain: {
      url: "https://apechain.calderachain.xyz/http",
      accounts: process.env.CREATOR_PRIVATE_KEY && process.env.CREATOR_PRIVATE_KEY !== 'your_private_key_here_without_0x' 
        ? [`0x${process.env.CREATOR_PRIVATE_KEY}`] 
        : ["0x1234567890123456789012345678901234567890123456789012345678901234"]
    },
    polygon: {
      url: process.env.POLYGON_RPC_URL || "https://polygon-rpc.com",
      accounts: process.env.OWNER_PRIVATE_KEY && process.env.OWNER_PRIVATE_KEY !== 'your_private_key_here' 
        ? [process.env.OWNER_PRIVATE_KEY] 
        : ["0x1234567890123456789012345678901234567890123456789012345678901234"],
      chainId: 137,
      timeout: 180000,
      gas: 8000000,
      gasPrice: 200000000000, // 200 gwei
      gasMultiplier: 1.5
    },
  }
};