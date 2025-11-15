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
    base: {
      url: "https://mainnet.base.org",
      accounts: process.env.DEPLOYER_PRIVATE_KEY && process.env.DEPLOYER_PRIVATE_KEY !== 'your_private_key_here' 
        ? [process.env.DEPLOYER_PRIVATE_KEY] 
        : ["0x1234567890123456789012345678901234567890123456789012345678901234"],
      chainId: 8453,
      gasPrice: 1000000000 // 1 gwei
    },
    "base-sepolia": {
      url: "https://sepolia.base.org",
      accounts: process.env.DEPLOYER_PRIVATE_KEY && process.env.DEPLOYER_PRIVATE_KEY !== 'your_private_key_here' 
        ? [process.env.DEPLOYER_PRIVATE_KEY] 
        : ["0x1234567890123456789012345678901234567890123456789012345678901234"],
      chainId: 84532,
      gasPrice: 1000000000 // 1 gwei
    }
  }
};