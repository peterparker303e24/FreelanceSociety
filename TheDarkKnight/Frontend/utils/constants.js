import { getCookie } from "./commonFunctions.js"; 

// Task short names
export const TASK_SHORT_NAMES = ["h", "dh", "v"];

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

if (getCookie("isLocalBlockchain") === "true") {

    // Localhost contract addresses
    usersContractAddress
        = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    theListContractAddress
        = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
    hashTaskContractAddress
        = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
    doubleHashTaskContractAddress
        = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
    validatorTaskContractAddress
        = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";

    // Localhost contract creation block indices
    usersContractMinimumBlock = 0;
    theListContractMinimumBlock = 0;
    hashTaskContractMinimumBlock = 0;
    doubleHashTaskContractMinimumBlock = 0;
    validatorTaskContractMinimumBlock = 0;
} else {

    // Sepolia contract addresses
    usersContractAddress
        = "0x95317F9EE94C3F35554c2b89971eb7b9052Deb9f";
    theListContractAddress
        = "0x7AA6FaB644B90b387a82269A6F3747b191aa29b0";
    hashTaskContractAddress
        = "0xB4446ECC7D05a074ec5F8f3c17983787DDA5323D";
    doubleHashTaskContractAddress
        = "0x75d03c100dB5160B0876DB4480954b9eE985eB06";
    validatorTaskContractAddress
        = "0x3C54aB5b0be84f0bbf17F834810Cb8Aafcf2bcc5";

    // Sepolia contract creation block indices
    usersContractMinimumBlock = 9192512;
    theListContractMinimumBlock = 9192513;
    hashTaskContractMinimumBlock = 9192514;
    doubleHashTaskContractMinimumBlock = 9192515;
    validatorTaskContractMinimumBlock = 9192516;
}

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
