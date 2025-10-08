require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const { API_URL, PRIVATE_KEY } = process.env;

module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 100,
      },
      viaIR: true,
    }
  },
  defaultNetwork: "localhost", 
  networks: {
    hardhat: {
      chainId: 1337
    },

    // To deploy contracts to the Sepolia blockchain:
    // 1. Uncomment the lines below.
    // 2. Change the "defaultNetwork" value above from "localhost" to "sepolia".    // 3. Obtain a URL endpoint to the Sepolia blockchain and input it to the API_URL value in the .env file.
    // 4. With caution, input your Sepolia account private key into the PRIVATE_KEY value in the .env file.
    // 5. Edit the "gasPrice" below to an appropriate value based on the network gas price demand.
    // 6. Run the command "npx hardhat run scripts/deploy.js --network sepolia" to deploy the contracts to the Sepolia blockchain.
    // 7. View the contract addresses in the output to search on the Sepolia blockchain with Sepolia EtherScan.
    // sepolia: {
    //   url: API_URL,
    //   accounts: [PRIVATE_KEY],
    //   gasPrice: 100_000_000
    // }
  }
};
