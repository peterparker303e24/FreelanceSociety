import { ethers, keccak256 } from "../libs/ethers.min.js";
import * as JSZip from "../libs/jszip.min.js";
import {
    loadHeader,
    prefixHexBytes,
    removeClass,
    debounce,
    replaceClass,
    requirementPlaceholder,
    convertTab,
    downloadZip
} from "../../utils/commonFunctions.js";
import { THE_LIST_CONTRACT_ADDRESS, USERS_CONTRACT_ADDRESS } from "../../utils/constants.js";

// Page elements
const requirementIdText = document.getElementById("requirement-id");
const requirementVersionsTextFixed
    = document.getElementById("requirement-versions-fixed");
const requirementProposalsTextFixed
    = document.getElementById("requirement-proposals-fixed");
const requirementVersionsTextDynamic
    = document.getElementById("requirement-versions-dynamic");
const requirementProposalsTextDynamic
    = document.getElementById("requirement-proposals-dynamic");
const requirementsNumber = document.getElementById("requirements-number");
const requirementIndexText = document.getElementById("requirement-index-text");
const requirementIndexInput
    = document.getElementById("requirement-index-input");
const addProposalButton = document.getElementById("add-button");
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

// Get requirement index of proposals if fixed requirement
const url = new URL(window.location.href);
const params = Object.fromEntries(url.searchParams.entries());
let requirementIndex = params.index;
const fixedRequirement = requirementIndex !== undefined;
if (fixedRequirement) {
    requirementIndex = Number(requirementIndex);
}

// Requirement proposal variables
let file;
let fileHash;
let address;
let signer;
let signerTheListContract;
let requirementZipHash;
let requirementCrossChecked;
let validWrittenCondition = false;
let requirementsNumberValue;

// Get The List and users contracts from provider
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

// Checks text area requirement validity
checkRequirementValidity();

// If there is a requirement index specified in the url, fix that requirement,
// otherwise allow the user to input the requirement index
if (fixedRequirement) {

    // Change the page to display fixed requirement UI
    removeClass(requirementIdText, "hide");
    removeClass(requirementProposalsTextFixed, "hide");
    removeClass(requirementVersionsTextFixed, "hide");

    // Get the requirement versions and number of proposals, and updates the
    // display
    requirementIdText.textContent = `Requirement Index: ${requirementIndex}`;
    theListContract.getRequirementVersion(requirementIndex).then((versions) => {
        requirementVersionsTextFixed.textContent
            = `Requirement Versions: ${versions}`;
    });
    theListContract.getRequirementProposals(requirementIndex)
        .then((proposals) => {
            requirementProposalsTextFixed.textContent
                = `Requirement Proposals: ${proposals}`;
        });
    theListContract.requirementCount().then((n) => {
        requirementsNumberValue = Number(n);
    });
} else {

    // Change the page to display the dynamic requirement UI
    removeClass(requirementIndexInput, "hide");
    removeClass(requirementIndexText, "hide");
    removeClass(requirementProposalsTextDynamic, "hide");
    removeClass(requirementVersionsTextDynamic, "hide");
    removeClass(requirementsNumber, "hide");

    // Get the total number of requirements, and updates the display
    theListContract.requirementCount().then((n) => {
        requirementsNumberValue = Number(n);
        requirementsNumber.textContent
            = `Requirements Count: ${requirementsNumberValue}`;
        updateRequirementInput();
    });
}

// Adds the requirement proposal if the data is correctly hosted
addProposalButton.addEventListener("click", async () => {

    // Only add the requirement if the data is correctly hosted and the
    // requirement is valid
    if (!requirementCrossChecked
        || requirementIndex === undefined
        || requirementsNumberValue === undefined
        || requirementIndex >= requirementsNumberValue
    ) {
        return;
    }

    // Add the requirement proposal to The List contract using the requirement
    // hash
    const requirementHashBytes = ethers.getBytes(
        prefixHexBytes(requirementZipHash)
    );
    const transactionResponse = await signerTheListContract.updateRequirement(
        requirementIndex,
        requirementHashBytes
    );

    // Return to proposals page after transaction addition
    transactionResponse.wait().then(async () => {
        window.location.href
            = `/pages/requirements/viewProposals.html?index=${requirementIndex}`;
    });
});

// Activates the zip file upload anchor
fileUpload.addEventListener('click', function () {
    zipInput.click();
});

// Prompts user to upload a zip file
zipInput.addEventListener('change', zipInputUpload);

// Downloads the text area requirement to a zip file
downloadWrittenButton.addEventListener("click", () => {
    if (validWrittenCondition) {
        downloadZip(textArea.value, downloadAnchor);
    }
});

// Example requirement format text
textArea.placeholder = requirementPlaceholder;

// Converts tab to 4 spaces in the text area
textArea.addEventListener("keydown", (event) => convertTab(textArea, event));

// Validates the requirement format of the text
textArea.addEventListener("input", debounce(checkRequirementValidity, 200));

// Validates the requirement index input and updates the versions and proposals
// variables and display
requirementIndexInput.addEventListener("input", updateRequirementInput);

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
        const fileBytes = new Uint8Array(arrayBuffer);
        fileHash = keccak256(fileBytes).toString('hex');
        fileName.textContent = `Name: ${file.name}\nKeccak256 Hash: ${fileHash}`;
        await tryMatchFile(fileHash);
    };

    // Display error if problem reading zip file
    reader.onerror = function () {
        errorText.textContent = "[X] ERROR: Problem reading zip file";
    };
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

        // Download from the link and if the Requirement.zip file is found, and
        // the requirement index if valid then validate the add requirement
        // button functionality
        const arrayBuffer = await response.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const downloadHash = keccak256(uint8Array).toString('hex');
        if (downloadHash === zipHash) {
            requirementZipHash = downloadHash;
            requirementCrossChecked = true;
            if (requirementIndex === undefined
                || requirementsNumberValue === undefined
                || requirementIndex >= requirementsNumberValue
            ) {
                errorText.textContent = "[X] ERROR: Invalid requirement index";
                return;
            }
            replaceClass(
                addProposalButton,
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

/**
 * Validates the user requirement input, retrieves the requirement versions and
 * proposals, and updates the display
 */
async function updateRequirementInput() {

    // Only accepts numerical characters
    let userIndex = requirementIndexInput.value.replace(/[^0-9]/g, '');

    // Deletes any preceding 0s
    if (userIndex.length > 1) {
        userIndex = userIndex.replace(/^0+/, '');
    }

    // Updates the requirement index value and display
    userIndex = Number(userIndex);
    requirementIndexInput.value = userIndex;
    requirementIndex = userIndex;

    // If number of requirements has not yet been retrieved, then end the
    // function early
    if (!requirementsNumberValue) {
        return;
    }

    // If the requirement index is valid, then retrieve the versions and
    // proposals data of that requirement, otherwise insert default character
    if (userIndex < requirementsNumberValue) {
        theListContract.getRequirementVersion(requirementIndex)
            .then((versions) => {
                requirementVersionsTextDynamic.textContent
                    = `Requirement Versions: ${versions}`;
            });
        theListContract.getRequirementProposals(requirementIndex)
            .then((proposals) => {
                requirementProposalsTextDynamic.textContent
                    = `Requirement Proposals: ${proposals}`;
            });

        if (requirementCrossChecked) {
            replaceClass(
                addProposalButton,
                "inactive-payable-button",
                "payable-button"
            );
        }
        errorText.textContent = "";
    } else {
        requirementVersionsTextDynamic.textContent = `Requirement Versions: -`;
        requirementProposalsTextDynamic.textContent = `Requirement Proposals: -`;
        replaceClass(
            addProposalButton,
            "payable-button",
            "inactive-payable-button"
        );
        errorText.textContent = "[X] ERROR: Invalid requirement index";
    }
}
