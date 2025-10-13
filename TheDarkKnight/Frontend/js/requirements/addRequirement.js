import { ethers, keccak256 } from "../libs/ethers.min.js";
import "../libs/jszip.min.js";
import {
    loadHeader,
    prefixHexBytes,
    debounce,
    replaceClass,
    requirementPlaceholder,
    convertTab,
    downloadZip
} from "../../utils/commonFunctions.js";
import { THE_LIST_CONTRACT_ADDRESS, USERS_CONTRACT_ADDRESS } from "../../utils/constants.js";

// Page elements
const usersContractAddress = USERS_CONTRACT_ADDRESS;
const theListContractAddress = THE_LIST_CONTRACT_ADDRESS;
const addRequirementButton = document.getElementById("add-button");
const errorText = document.getElementById("error");
const textArea = document.getElementById("write-condition");
const downloadWrittenButton
    = document.getElementById("download-written-button");
const downloadAnchor = document.getElementById("download-anchor");
const writeError = document.getElementById("write-error");
const fileUpload = document.getElementById('upload-file-button');
const zipInput = document.getElementById('file-input');
const fileName = document.getElementById('file-name');

// Load the header button navigation functionality
loadHeader();

// Requirement addition variables
let file;
let fileBytes;
let address;
let signer;
let signerTheListContract;
let requirementZipHash;
let requirementCrossChecked;
let validWrittenCondition = false;

// Get The List and users contracts from provider
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

// Checks text area requirement validity
checkRequirementValidity();

// Adds the requirement to The List if the data is correctly hosted
addRequirementButton.addEventListener("click", async () => {

    // Only add the requirement if the data is correctly hosted
    if (!requirementCrossChecked) {
        return;
    }

    // Add the requirement to The List contract using the requirement hash
    const requirementHashBytes = ethers.getBytes(
        prefixHexBytes(requirementZipHash)
    );
    const transactionResponse = await signerTheListContract.addRequirement(
        requirementHashBytes
    );

    // Return to requirements page after transaction addition
    transactionResponse.wait().then(async () => {
        window.location.pathname = "/pages/requirements/viewRequirements.html";
    });
});

// Activates the zip file upload anchor
fileUpload.addEventListener('click', function () {
    zipInput.click();
});

// Prompts user to upload a zip file
zipInput.addEventListener('change', zipInputUpload);

// Example requirement format text
textArea.placeholder = requirementPlaceholder;

// Converts tab to 4 spaces in the text area
textArea.addEventListener("keydown", (event) => convertTab(textArea, event));

// Validates the requirement format of the text
textArea.addEventListener("input", debounce(checkRequirementValidity, 200));

// Downloads the text area requirement to a zip file
downloadWrittenButton.addEventListener("click", () => {
    if (validWrittenCondition) {
        downloadZip(textArea.value, downloadAnchor);
    }
});

/**
 * Read the user zip file upload, display file name and hash, and validate the
 * user is correctly hosting the requirement file
 * @param {Event} event Zip file upload event
 */
async function zipInputUpload(event) {

    // Requirement cross checked variable and error text are reset
    requirementCrossChecked = false;
    errorText.textContent = "";

    // Validates zip file upload
    const inputFile = event.target.files[0];
    if (inputFile.type !== 'application/zip') {
        errorText.textContent = "[X] ERROR: File uploaded is not a zip file";
        return;
    }

    // Save zip file
    file = inputFile;

    // Read bytes of zip folder
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);

    // Display zip file name and hash, and try to validate the file is correctly
    // hosted by the user
    reader.onload = async function (event) {
        const arrayBuffer = event.target.result;
        fileBytes = new Uint8Array(arrayBuffer);
        const fileHash = keccak256(fileBytes).toString('hex');
        fileName.textContent = `Name: ${file.name}\nKeccak256 Hash: ${fileHash}`;
        await tryMatchFile(fileHash);
    };

    // Display error if problem reading zip file
    reader.onerror = function () {
        errorText.textContent = "[X] ERROR: Problem reading zip file";
    };
}

/**
 * Loads the user and validates the user has an active account
 */
async function loadUser() {

    // Load user wallet
    try {
        await provider.send("eth_requestAccounts", []);
    } catch {
        errorText.textContent = "[X] ERROR: no wallet found";
        return;
    }

    // Get user signer for blockchain transactions
    signer = await provider.getSigner();
    address = signer.address;
    signerTheListContract = new ethers.Contract(
        theListContractAddress,
        theListJson.abi,
        signer
    );

    // Validate the user is activated
    const userActivated = await usersContract.activeUsers(address);
    if (!userActivated) {
        errorText.textContent = "[X] ERROR: User inactivated";
        return;
    }
}

/**
 * Validates the current user correctly hosts the requirement zip file at one of
 * their links endpoints'
 * @param {String} zipHash 
 */
async function tryMatchFile(zipHash) {

    // Load user links
    await loadUser();
    const usersLinks = await usersContract.links(address);
    const linksSplit = usersLinks.split(",");
    let downloadUrls = [];
    for (let i = 0; i < linksSplit.length; i++) {
        try {
            const nextUrl = new URL(linksSplit[i]);
            downloadUrls.push(nextUrl);
        } catch (error) {
            continue;
        }
    }

    // If no valid links, then display error
    if (downloadUrls.length === 0) {
        errorText.textContent = "[X] ERROR: No link found for current user";
        return;
    }

    // Search for data through all user URL links
    let dataEndpoints = [];
    for (let i = 0; i < downloadUrls.length; i++) {

        // Expected Requirement.zip data endpoint
        dataEndpoints.push(
            `${downloadUrls[i]}/TheList/${zipHash.substring(2)}/Requirement.zip`
        );

        // Check whether requirement is correctly hosted at the endpoint
        const response = await fetch(dataEndpoints[i]);
        if (!response.ok) {
            continue;
        }

        // Download from the link and if the Requirement.zip file is found,
        // then validate the add requirement button functionality
        const arrayBuffer = await response.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const downloadHash = keccak256(uint8Array).toString('hex');

        if (downloadHash === zipHash) {
            requirementZipHash = downloadHash;
            requirementCrossChecked = true;
            replaceClass(
                addRequirementButton,
                "inactive-payable-button",
                "payable-button"
            );
            return;
        }
    }

    // Display requirement host error
    errorText.textContent = `[X] ERROR: Requirement.zip file not found at any `
        + `user endpoint: ${dataEndpoints}`;
}

/**
 * Checks the validity of the text area Requirement.json format
 */
function checkRequirementValidity() {

    // Reset variables
    validWrittenCondition = false;
    writeError.textContent = ``;
    replaceClass(
        downloadWrittenButton,
        "border-button",
        "inactive-border-button"
    );

    // Tries to parse the Requirement.json and upon any failure, displays an
    // error message
    try {

        // Parse the text area as a json object
        let writtenJson = JSON.parse(textArea.value);

        // Validate json text is a single object
        if (typeof writtenJson !== 'object' || writtenJson === null) {
            writeError.textContent = `(!) json must be an object`;
            return;
        }

        // Validate the necessary condition property for the requirement
        if (!("condition" in writtenJson)) {
            writeError.textContent
                = `(!) json must have array attribute "condition"`;
            return;
        }

        // Validate the condition is an array of strings
        if (!Array.isArray(writtenJson.condition)) {
            writeError.textContent
                = `(!) "condition" attribute must be an array`;
            return;
        }
        for (let i = 0; i < writtenJson.condition.length; i++) {
            if (typeof writtenJson.condition[i] !== "string") {
                writeError.textContent = `(!) json attribute "condition" `
                    + `must be an array of all strings`;
                return;
            }
        }

        // Validate the necessary labeled variables property for the requirement
        if (!("labeledVariables" in writtenJson)) {
            writeError.textContent
                = `(!) json must have array attribute "labeledVariables"`;
            return;
        }

        // Validate the labeled variables is an array of strings
        if (!Array.isArray(writtenJson.labeledVariables)) {
            writeError.textContent
                = `(!) "labeledVariables" attribute must be an array`;
            return;
        }
        for (let i = 0; i < writtenJson.labeledVariables.length; i++) {
            if (typeof writtenJson.labeledVariables[i] !== "string") {
                writeError.textContent = `(!) json attribute `
                    + `"labeledVariables" must be an array of all strings`;
                return;
            }
        }

        // Requirement checks passed, so set valid requirement to true and
        // activate the download button
        validWrittenCondition = true;
        replaceClass(
            downloadWrittenButton,
            "inactive-border-button",
            "border-button"
        )
    } catch (error) {
        writeError.textContent = `(!) Invalid json`;
    }
}
