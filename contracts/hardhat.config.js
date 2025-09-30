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
      accounts: process.env.DEPLOYER_PRIVATE_KEY && process.env.DEPLOYER_PRIVATE_KEY !== 'your_private_key_here' 
        ? [process.env.DEPLOYER_PRIVATE_KEY] 
        : ["0x1234567890123456789012345678901234567890123456789012345678901234"]
    }
  }
};