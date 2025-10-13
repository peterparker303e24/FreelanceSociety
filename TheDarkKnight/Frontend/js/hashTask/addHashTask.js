import { ethers, keccak256 } from "../libs/ethers.min.js";
import "../libs/jszip.min.js";
import {
    loadHeader,
    prefixHexBytes,
    replaceClass,
    updateInputNumberToGroupedDigits,
    searchByIndexVersion
} from "../../utils/commonFunctions.js";
import { HASH_TASK_CONTRACT_ADDRESS, THE_LIST_CONTRACT_ADDRESS, USERS_CONTRACT_ADDRESS } from "../../utils/constants.js";

// Page elements
const hashValueInput = document.getElementById("hash-value-input");
const taskHashInput = document.getElementById("task-hash-input");
const deadlineInput = document.getElementById("deadline-input");
const keyRevealButton = document.getElementById("key-reveal-button");
const difficultyInput = document.getElementById("difficulty-input");
const rewardInput = document.getElementById("reward-input");
const checkbox = document.getElementById("checkbox");
const addHashTaskButton = document.getElementById("add-task-button");
const errorText = document.getElementById("error");
const fileUpload = document.getElementById('upload-file-button');
const zipInput = document.getElementById('file-input');
const fileName = document.getElementById('file-name');
const fileError = document.getElementById('file-error');

// Load the header button navigation functionality
loadHeader();

// Hash task addition variables
let file;
let fileBytes;
let address;
let signer;
let fileCrossChecked;
let hashTaskSigner;
let hashValue;
let taskHash;
let secondsToDeadline;
let isKeyRevealOn = true;
let difficulty;
let reward;
let isEthicsChecked = false;
let checksPassed = false;

// Get The List and users contracts from provider
const usersContractAddress = USERS_CONTRACT_ADDRESS;
const theListContractAddress = THE_LIST_CONTRACT_ADDRESS;
const hashTaskContractAddress = HASH_TASK_CONTRACT_ADDRESS;
const provider = new ethers.BrowserProvider(window.ethereum);
const usersAbi = await fetch('./data/abi/usersAbi.json');
const theListAbi = await fetch('./data/abi/theListAbi.json');
const hashTaskAbi = await fetch('./data/abi/hashTaskAbi.json');
const usersJson = await usersAbi.json();
const theListJson = await theListAbi.json();
const hashTaskJson = await hashTaskAbi.json();
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

// Update any existing input variables
updateAddHashButton();

// Validate hash value from input and update variables
hashValueInput.addEventListener("input", updateAddHashButton);

// Validate task hash from input and update variables
taskHashInput.addEventListener("input", updateAddHashButton);

// Validates deadline numerical input and update variables
deadlineInput.addEventListener("input", () => {

    // Parse only numerical characters
    updateInputNumberToGroupedDigits(deadlineInput);
    updateAddHashButton();
});

// Updates checkbox check mark variable and display
keyRevealButton.addEventListener("click", () => {
    if (isKeyRevealOn) {
        keyRevealButton.textContent = "OFF";
    } else {
        keyRevealButton.textContent = "ON";
    }
    isKeyRevealOn = !isKeyRevealOn;
});

// Validates difficulty numerical input and update variables
difficultyInput.addEventListener("input", () => {
    updateInputNumberToGroupedDigits(difficultyInput);
    updateAddHashButton();
});

// Validates reward numerical input and update variables
rewardInput.addEventListener("input", () => {
    updateInputNumberToGroupedDigits(rewardInput);
    updateAddHashButton();
});

// Updates checkbox check mark variable and display
checkbox.addEventListener("click", () => {
    if (isEthicsChecked) {
        checkbox.textContent = "";
    } else {
        checkbox.textContent = "✓";
    }
    isEthicsChecked = !isEthicsChecked;
    updateAddHashButton();
});

// Adds the hash task if the data is valid and correctly hosted
addHashTaskButton.addEventListener("click", async () => {

    // Only add the requirement if the data is correctly hosted and hash task
    // parameters are valid
    updateAddHashButton();
    if (!checksPassed) {
        return;
    }

    // Add hash task to blockchain, display any transaction error
    let transactionResponse;
    try {
        transactionResponse = await hashTaskSigner.addHashTask(
            prefixHexBytes(hashValue),
            prefixHexBytes(taskHash),
            secondsToDeadline,
            difficulty,
            isKeyRevealOn,
            { value: reward }
        );
    } catch (error) {
        errorText.textContent = `[X] ERROR: Transaction failed - ${error}`;
        return;
    }

    // Return to requirements page after transaction addition
    transactionResponse.wait().then(async () => {
        window.location.pathname = "/pages/viewTasks.html";
    });
});

// Activates the zip file upload anchor
fileUpload.addEventListener('click', function () {
    zipInput.click();
});

// Prompts user to upload a zip file
zipInput.addEventListener('change', zipInputUpload);

/**
 * Read the user zip file upload, display file name and hash, and validate the
 * user is correctly hosting the file
 * @param {Event} event Zip file upload event
 */
async function zipInputUpload(event) {

    // Requirement cross checked variable and error text are reset
    fileCrossChecked = false;
    errorText.textContent = "";

    // Validates zip file upload
    const inputFile = event.target.files[0];
    if (inputFile.type !== 'application/zip') {
        fileError.textContent = "[X] ERROR: File uploaded is not a zip file";
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
        taskHashInput.value = fileHash;
        await tryMatchFile(fileHash);
    };

    // Display error if problem reading zip file
    reader.onerror = function () {
        fileError.textContent = "[X] ERROR: Problem reading zip file";
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
    hashTaskSigner = new ethers.Contract(
        hashTaskContractAddress,
        hashTaskJson.abi,
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
        fileError.textContent = "[X] ERROR: No link found for current user";
        return;
    }

    // Search for data through all user URL links
    let dataEndpoints = [];
    for (let i = 0; i < downloadUrls.length; i++) {

        // Expected Task.zip data endpoint
        dataEndpoints.push(
            `${downloadUrls[i]}/Tasks/HashTasks/`
            + `${zipHash.substring(2)}/Task.zip`
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

        // Validate the task file hosting and format, and update file
        if (downloadHash === zipHash) {
            const taskValid = await validateTaskFile(arrayBuffer);
            if (!taskValid) {
                return;
            }
            fileCrossChecked = true;
            updateAddHashButton();
            return;
        }
    }

    // Display requirement host error
    errorText.textContent = `[X] ERROR: Requirement.zip file not found at any user `
        + `endpoint: ${dataEndpoints}`;
}

/**
 * Determines whether the given Task.zip file follows the expected format
 * @param {ArrayBuffer} arrayBuffer zip file array buffer contents
 * @returns {Boolean} Whether the given task follows the expected format
 */
async function validateTaskFile(arrayBuffer) {

    // Zip file variables
    let zipFileContents = [];
    let outerFolderName;
    let zipContents;

    // Get each piece of content in zip file, get the root directory name, and
    // display message on any error
    try {
        zipContents = await JSZip.loadAsync(arrayBuffer);
        zipContents.forEach((relativePath, zipEntry) => {
            if (!zipEntry.dir) {
                zipFileContents.push(relativePath);
            } else {
                outerFolderName = relativePath.substring(
                    0,
                    relativePath.indexOf("/")
                );
            }
        });
    } catch (error) {
        fileError.textContent = `Error parsing .zip file`;
        return false;
    }

    // Validate specifications.json structure
    if (!zipFileContents.includes(`${outerFolderName}/specifications.json`)) {
        fileError.textContent
            = `[X] ERROR: Missing specifications.json file in root directory`;
        return false;
    }

    // Task requirements variables
    let requirementsIds = new Set();
    let requirementsHashes = {};

    // Retrieve all requirements in specifications.json and display message on
    // any error
    try {

        // Get the specifications array form specifications.json file
        const specificationsFile
            = zipContents.file(`${outerFolderName}/specifications.json`);
        const content = await specificationsFile.async("string");
        const specificationsJson = JSON.parse(content);

        // Add each unique requirement ID from specifications array
        for (let i = 0; i < specificationsJson.length; i++) {

            // Get requirement index and version index
            let requirementIndex = specificationsJson[i]
                .requirementIndex;
            const requirementVersionIndex = specificationsJson[i]
                .requirementVersionIndex;

            // Get requirement data from ID and validate
            const requirementData = await searchByIndexVersion(
                provider,
                theListContract,
                {},
                requirementIndex,
                requirementVersionIndex
            );
            if (requirementData === null) {
                fileError.textContent
                    = `[X] ERROR: Invalid specification requirement`;
                return false;
            }

            // Add unique requirement ID and hash
            requirementsIds
                .add(`${requirementIndex}-${requirementVersionIndex}`);
            requirementsHashes[`${requirementIndex}-${requirementVersionIndex}`]
                = requirementData.hash;
        }
    } catch (error) {
        fileError.textContent = `Error parsing specifications.json file`;
        return false;
    }

    // Convert requirement IDs to array
    const idArray = [...requirementsIds];

    // Validate each requirement ID file exists in the Requirements folder in
    // the task using its hash
    for (let i = 0; i < idArray.length; i++) {

        // Get requirement file path and validate it exists
        const filePath
            = `${outerFolderName}/Requirements/Requirement${idArray[i]}.zip`;
        if (!zipFileContents.includes(filePath)) {
            fileError.textContent
                = `[X] ERROR: Missing file ${filePath}`;
            return false;
        }
        const requirementFile = zipContents.file(filePath);

        // Validate the requirement hash matches expected
        const arrayBuffer = await requirementFile.async("arraybuffer");
        const requirementFileBytes = new Uint8Array(arrayBuffer);
        const fileHash = keccak256(requirementFileBytes).toString('hex');
        if (fileHash !== requirementsHashes[idArray[i]]) {
            fileError.textContent = `[X] ERROR: Requirement${idArray[i]} `
                + `hash does not match expected`;
            return false;
        }
    }

    // If all checks are passed, then the requirement specifications are valid
    return true;
}

/**
 * Update task parameter variables, validate all task parameters and update
 * checksPassed correspondingly, and update add task button by whether the
 * checks pass
 */
function updateAddHashButton() {

    // Update variable values from input fields
    hashValue = hashValueInput.value;
    taskHash = taskHashInput.value;
    secondsToDeadline = deadlineInput.value.replace(/\s/g, "");
    difficulty = difficultyInput.value;
    reward = rewardInput.value.replace(/\s/g, "");

    // Checks for validity of each task parameter
    const validHashValue = prefixHexBytes(hashValue) !== null
        && prefixHexBytes(hashValue).length === 66;
    const validTaskHash = prefixHexBytes(taskHash) !== null
        && prefixHexBytes(taskHash).length === 66;
    const validSecondsToDeadline = secondsToDeadline !== undefined
        && Number(secondsToDeadline) !== NaN
        && Number(secondsToDeadline) > 0;
    const validDifficulty = difficulty !== undefined
        && Number(difficulty) !== NaN
        && Number(difficulty) >= 0;
    const validReward = reward !== undefined
        && Number(reward) !== NaN
        && Number(reward) >= 0;

    // Display invalid variable message if any, otherwise update checksPassed
    // variable to true
    checksPassed = false;
    errorText.textContent = ``;
    if (!fileCrossChecked) {
        errorText.textContent = `Task.zip file not correctly hosted or validated`;
    } else if (!validHashValue) {
        errorText.textContent = `Invalid 32 bytes hash value`;
    } else if (!validTaskHash) {
        errorText.textContent = `Invalid 32 bytes task hash`;
    } else if (!validSecondsToDeadline) {
        errorText.textContent
            = `Invalid seconds to deadline, must be positive number`;
    } else if (!validDifficulty) {
        errorText.textContent
            = `Invalid difficulty, must be non-negative number`;
    } else if (!validReward) {
        errorText.textContent = `Invalid reward, must be non-negative number`;
    } else if (!isEthicsChecked) {
        errorText.textContent = `Ethics requirements statement not checked`;
    } else {
        checksPassed = true;
    }

    // Update add task button by whether the checks pass
    if (checksPassed) {
        replaceClass(
            addHashTaskButton,
            "inactive-payable-button",
            "payable-button"
        );
    } else {
        replaceClass(
            addHashTaskButton,
            "payable-button",
            "inactive-payable-button"
        );
    }
}
