import { ethers } from "../libs/ethers.min.js";
import * as JSZip from "../libs/jszip.min.js";
import {
    loadHeader,
    debounce,
    convertTab,
    replaceClass
} from "../../utils/commonFunctions.js";
import { THE_LIST_CONTRACT_ADDRESS, USERS_CONTRACT_ADDRESS } from "../../utils/constants.js";

// Page elements
const ethicsRequirementsVersionText
    = document.getElementById("ethics-requirements-versions");
const ethicsRequirementsProposalsText
    = document.getElementById("ethics-requirements-proposals");
const errorText = document.getElementById("error");
const addRequirementButton = document.getElementById("add-button");
const textArea = document.getElementById("write-condition");
const writeError = document.getElementById("write-error");

// Load the header button navigation functionality
loadHeader();

// Update ethics requirements proposal
let validWrittenEthicsRequirements = false;
let ethicsVersions;
let ethicsProposals;
let ethicsRequirementsArray;

// Get users and The List contracts
const usersContractAddress = USERS_CONTRACT_ADDRESS;
const theListContractAddress = THE_LIST_CONTRACT_ADDRESS;
const provider = new ethers.BrowserProvider(window.ethereum);
const usersAbi = await fetch('./data/abi/usersAbi.json');
const theListAbi = await fetch('./data/abi/theListAbi.json');
const usersJson = await usersAbi.json();
const theListJson = await theListAbi.json();
const usersContract = new ethers.Contract(
    usersContractAddress,
    usersJson.abi,
    provider
);
const theListContract = new ethers.Contract(
    theListContractAddress,
    theListJson.abi,
    provider
);

// Update initial requirement validity
checkRequirementValidity();

// Get the ethics requirements version and update the display
theListContract.ethicsVersion().then((v) => {
    ethicsVersions = v;
    ethicsRequirementsVersionText.textContent
        = `Ethics Requirements Version: ${ethicsVersions}`;
});

// Get the ethics requirements version and update the display
theListContract.ethicsProposalsCount().then((p) => {
    ethicsProposals = p;
    ethicsRequirementsProposalsText.textContent
        = `Ethics Requirements Proposals: ${ethicsProposals}`;
});

// Adds the ethics requirements proposal if the input is valid, then redirects
// to view requirement proposals after transaction
addRequirementButton.addEventListener("click", async () => {

    // Only add proposal if valid
    if (!validWrittenEthicsRequirements) {
        return;
    }

    // Get user signature for add ethics requirements proposal transaction
    try {
        await provider.send("eth_requestAccounts", []);
    } catch {
        errorText.textContent = "[X] ERROR: No wallet found";
        return;
    }
    const signer = await provider.getSigner();
    const address = signer.address;
    const signerTheListContract = new ethers.Contract(
        theListContractAddress,
        theListJson.abi,
        signer
    );

    // Validate user is activated
    const userActivated = await usersContract.activeUsers(address);
    if (!userActivated) {
        errorText.textContent = "[X] ERROR: User inactivated";
        return;
    }

    // Process transaction to the blockchain and redirect to view ethics
    // requirements proposals following transaction
    const transactionResponse
        = await signerTheListContract.updateEthicsRequirements(
            ethicsRequirementsArray
        );
    transactionResponse.wait().then(async () => {
        window.location.pathname
            = "/pages/ethicsRequirements/viewEthicsRequirementsProposals.html";
    });
});

// Example ethics requirements placeholder text
textArea.placeholder = ``
    + `[\n`
    + `    "Task or submission does not produce content of excessive harm of living beings.",\n`
    + `    "Task or submission does not produce content of weapons of which the prominent purpose is to harm.",\n`
    + `    "Task or submission does not produce content of any non-consentual nudity or sexual acts.",\n`
    + `    "Task or submission does not produce content of an individuals information for which there is a reasonable expectation of privacy."\n`
    + `]`;

// Validates the ethics requirements format of the text
textArea.addEventListener("input", debounce(checkRequirementValidity, 200));

// Converts tab to 4 spaces in the text area
textArea.addEventListener("keydown", (event) => convertTab(textArea, event));

/**
 * Validate the format of the text input of the ethics requirements and update
 * display accordingly
 */
function checkRequirementValidity() {

    // Reset 
    validWrittenEthicsRequirements = false;
    let writtenJson;
    writeError.textContent = `---`;
    replaceClass(
        addRequirementButton,
        "payable-button",
        "inactive-payable-button"
    );

    // Try to parse ethics requirements string array
    try {

        // Get string data from the text area input
        writtenJson = JSON.parse(textArea.value);

        // Validate text input is an array
        if (writtenJson === null || !Array.isArray(writtenJson)) {
            writeError.textContent = `[X] ERROR: Input is not an array`;
            return;
        }

        // Validate each array element is a string
        for (let i = 0; i < writtenJson.length; i++) {
            if (typeof writtenJson[i] !== "string") {
                writeError.textContent
                    = `[X] ERROR: All elements of array must be of type string`;
                return;
            }
        }
    } catch (error) {

        // Display error if problem parsing user input
        writeError.textContent = `[X] ERROR: Invalid input`;
        return;
    }

    // Format or ethics requirements is valid so update variables and display
    validWrittenEthicsRequirements = true;
    ethicsRequirementsArray = writtenJson;
    replaceClass(
        addRequirementButton,
        "inactive-payable-button",
        "payable-button"
    );
}
