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
      url: "https://polygon-mainnet.infura.io/v3/2275e07415e7485ba5b202bfd13eaed3",
      accounts: process.env.OWNER_PRIVATE_KEY && process.env.OWNER_PRIVATE_KEY !== 'your_private_key_here' 
        ? [process.env.OWNER_PRIVATE_KEY] 
        : ["0x1234567890123456789012345678901234567890123456789012345678901234"],
      chainId: 137,
      timeout: 120000,
      gas: "auto",
      gasPrice: 50000000000,
      gasMultiplier: 1.2
    },
  }
};