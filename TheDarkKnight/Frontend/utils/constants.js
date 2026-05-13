import { getCookie } from "./commonFunctions.js";

// Task short names
export const TASK_SHORT_NAMES = ["h", "dh", "v"];

export const ETH_DISPLAY_TYPES = [
    "eth",
    "wei"
];
export const ETH_DISPLAY_TYPES_TEXT = {
    "eth": "ETH",
    "wei": "Wei"
};

// Default blockchain network Ethereum data
export const USERS_CONTRACT_ADDRESS_DEFAULT
    = "0xc9D45163cEF5f6c9E97AbE57DcfdeF693585B056";
export const THE_LIST_CONTRACT_ADDRESS_DEFAULT
    = "0xea11585C6B8961CDe38a8edEE432328E69689B42";
export const HASH_TASK_CONTRACT_ADDRESS_DEFAULT
    = "0xDFd1bE7B2F8628F89288EF7d65A1a28588315F8D";
export const DOUBLE_HASH_TASK_CONTRACT_ADDRESS_DEFAULT
    = "0x96C397E47C672BAa7Ae13BAd34aDdfd18e895566";
export const VALIDATOR_TASK_CONTRACT_ADDRESS_DEFAULT
    = "0x76bc136117567f967816Bb4B1A7d77c325Fd19d0";

export const USERS_CONTRACT_MINIMUM_BLOCK_DEFAULT = 24438298;
export const THE_LIST_CONTRACT_MINIMUM_BLOCK_DEFAULT = 24438483;
export const HASH_TASK_CONTRACT_MINIMUM_BLOCK_DEFAULT = 24438558;
export const DOUBLE_HASH_TASK_CONTRACT_MINIMUM_BLOCK_DEFAULT = 24438579;
export const VALIDATOR_TASK_CONTRACT_MINIMUM_BLOCK_DEFAULT = 24438596;

export const CONTRACT_DATA_CHAIN_ID_DEFAULT = 1;
export const CHAIN_NAME_DEFAULT = "mainnet";

// Locahost blockchain network Hardhat data
export const USERS_CONTRACT_ADDRESS_LOCALHOST
    = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
export const THE_LIST_CONTRACT_ADDRESS_LOCALHOST
    = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
export const HASH_TASK_CONTRACT_ADDRESS_LOCALHOST
    = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
export const DOUBLE_HASH_TASK_CONTRACT_ADDRESS_LOCALHOST
    = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
export const VALIDATOR_TASK_CONTRACT_ADDRESS_LOCALHOST
    = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";

export const USERS_CONTRACT_MINIMUM_BLOCK_LOCALHOST = 0;
export const THE_LIST_CONTRACT_MINIMUM_BLOCK_LOCALHOST = 0;
export const HASH_TASK_CONTRACT_MINIMUM_BLOCK_LOCALHOST = 0;
export const DOUBLE_HASH_TASK_CONTRACT_MINIMUM_BLOCK_LOCALHOST = 0;
export const VALIDATOR_TASK_CONTRACT_MINIMUM_BLOCK_LOCALHOST = 0;

export const CONTRACT_DATA_CHAIN_ID_LOCALHOST = 1337;
export const CHAIN_NAME_LOCALHOST = "localhost hardhat node";

// Configured website blockchain data
let usersContractAddress;
let theListContractAddress;
let hashTaskContractAddress;
let doubleHashTaskContractAddress;
let validatorTaskContractAddress;

let usersContractMinimumBlock;
let theListContractMinimumBlock;
let hashTaskContractMinimumBlock;
let doubleHashTaskContractMinimumBlock;
let validatorTaskContractMinimumBlock;

let contractDataChainId;
let chainName;

// Try to get the blockchain data from the local storage, otherwise use default
// values
const throwDataError = () => {
    throw new Error("Invalid data");
};
try {
    const data = JSON.parse(localStorage.getItem("blockchainData"));

    // Contract addresses
    usersContractAddress
        = data.usersContractAddress ?? throwDataError();
    theListContractAddress
        = data.theListContractAddress ?? throwDataError();
    hashTaskContractAddress
        = data.hashTaskContractAddress ?? throwDataError();
    doubleHashTaskContractAddress
        = data.doubleHashTaskContractAddress ?? throwDataError();
    validatorTaskContractAddress
        = data.validatorTaskContractAddress ?? throwDataError;

    // Contract creation block indices
    usersContractMinimumBlock
        = Number(data.usersContractMinimumBlock) ?? throwDataError()
    theListContractMinimumBlock
        = Number(data.theListContractMinimumBlock) ?? throwDataError();
    hashTaskContractMinimumBlock
        = Number(data.hashTaskContractMinimumBlock) ?? throwDataError();
    doubleHashTaskContractMinimumBlock
        = Number(data.doubleHashTaskContractMinimumBlock)
            ?? throwDataError();
    validatorTaskContractMinimumBlock
        = Number(data.validatorTaskContractMinimumBlock)
            ?? throwDataError();

    // Chain ID and name for the corresponding contract blockchain data
    contractDataChainId
        = Number(data.contractDataChainId)
            ?? throwDataError();
    chainName = data.chainName ?? throwDataError();
} catch {

    // If using localhost server with Hardhat node the server will send file
    // responses with isLocalBlockchain cookie with value true. Otherwise,
    // use the default deployed network
    if (getCookie("isLocalBlockchain") === "true") {

        // Localhost contract addresses
        usersContractAddress
            = USERS_CONTRACT_ADDRESS_LOCALHOST;
        theListContractAddress
            = THE_LIST_CONTRACT_ADDRESS_LOCALHOST;
        hashTaskContractAddress
            = HASH_TASK_CONTRACT_ADDRESS_LOCALHOST;
        doubleHashTaskContractAddress
            = DOUBLE_HASH_TASK_CONTRACT_ADDRESS_LOCALHOST;
        validatorTaskContractAddress
            = VALIDATOR_TASK_CONTRACT_ADDRESS_LOCALHOST;

        // Localhost contract creation block indices
        usersContractMinimumBlock
            = USERS_CONTRACT_MINIMUM_BLOCK_LOCALHOST;
        theListContractMinimumBlock
            = THE_LIST_CONTRACT_MINIMUM_BLOCK_LOCALHOST;
        hashTaskContractMinimumBlock
            = HASH_TASK_CONTRACT_MINIMUM_BLOCK_LOCALHOST;
        doubleHashTaskContractMinimumBlock
            = DOUBLE_HASH_TASK_CONTRACT_MINIMUM_BLOCK_LOCALHOST;
        validatorTaskContractMinimumBlock
            = VALIDATOR_TASK_CONTRACT_MINIMUM_BLOCK_LOCALHOST;

        // Localhost harhat blockchain chain ID
        contractDataChainId = CONTRACT_DATA_CHAIN_ID_LOCALHOST;
        chainName = CHAIN_NAME_LOCALHOST;
    } else {

        // Ethereum mainnet contract addresses
        usersContractAddress
            = USERS_CONTRACT_ADDRESS_DEFAULT;
        theListContractAddress
            = THE_LIST_CONTRACT_ADDRESS_DEFAULT;
        hashTaskContractAddress
            = HASH_TASK_CONTRACT_ADDRESS_DEFAULT;
        doubleHashTaskContractAddress
            = DOUBLE_HASH_TASK_CONTRACT_ADDRESS_DEFAULT;
        validatorTaskContractAddress
            = VALIDATOR_TASK_CONTRACT_ADDRESS_DEFAULT;

        // Ethereum mainnet contract creation block indices
        usersContractMinimumBlock
            = USERS_CONTRACT_MINIMUM_BLOCK_DEFAULT;
        theListContractMinimumBlock
            = THE_LIST_CONTRACT_MINIMUM_BLOCK_DEFAULT;
        hashTaskContractMinimumBlock
            = HASH_TASK_CONTRACT_MINIMUM_BLOCK_DEFAULT;
        doubleHashTaskContractMinimumBlock
            = DOUBLE_HASH_TASK_CONTRACT_MINIMUM_BLOCK_DEFAULT;
        validatorTaskContractMinimumBlock
            = VALIDATOR_TASK_CONTRACT_MINIMUM_BLOCK_DEFAULT;

        // Ethereum mainnet blockchain chain ID
        contractDataChainId = CONTRACT_DATA_CHAIN_ID_DEFAULT;
        chainName = CHAIN_NAME_DEFAULT;
    }
}

// Save blockchain data to user local storage
localStorage.setItem("blockchainData", JSON.stringify({
    usersContractAddress: usersContractAddress,
    theListContractAddress: theListContractAddress,
    hashTaskContractAddress: hashTaskContractAddress,
    doubleHashTaskContractAddress: doubleHashTaskContractAddress,
    validatorTaskContractAddress: validatorTaskContractAddress,
    usersContractMinimumBlock: usersContractMinimumBlock,
    theListContractMinimumBlock: theListContractMinimumBlock,
    hashTaskContractMinimumBlock: hashTaskContractMinimumBlock,
    doubleHashTaskContractMinimumBlock: doubleHashTaskContractMinimumBlock,
    validatorTaskContractMinimumBlock: validatorTaskContractMinimumBlock,
    contractDataChainId: contractDataChainId,
    chainName: chainName
}));

// Contract addresses by blockchain environment
export const USERS_CONTRACT_ADDRESS
    = usersContractAddress;
export const THE_LIST_CONTRACT_ADDRESS
    = theListContractAddress;
export const HASH_TASK_CONTRACT_ADDRESS
    = hashTaskContractAddress;
export const DOUBLE_HASH_TASK_CONTRACT_ADDRESS
    = doubleHashTaskContractAddress;
export const VALIDATOR_TASK_CONTRACT_ADDRESS
    = validatorTaskContractAddress;

// Contract block indices by blockchain environment
export const USERS_CONTRACT_MINIMUM_BLOCK
    = usersContractMinimumBlock;
export const THE_LIST_CONTRACT_MINIMUM_BLOCK
    = theListContractMinimumBlock;
export const HASH_TASK_CONTRACT_MINIMUM_BLOCK
    = hashTaskContractMinimumBlock;
export const DOUBLE_HASH_TASK_CONTRACT_MINIMUM_BLOCK
    = doubleHashTaskContractMinimumBlock;
export const VALIDATOR_TASK_CONTRACT_MINIMUM_BLOCK
    = validatorTaskContractMinimumBlock;

// Chain ID and name by blockchain environment
export const CONTRACT_DATA_CHAIN_ID
    = contractDataChainId;
export const CHAIN_NAME
    = chainName;
