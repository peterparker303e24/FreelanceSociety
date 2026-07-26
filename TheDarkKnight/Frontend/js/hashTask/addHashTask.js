import { ethers, keccak256 } from "../libs/ethers.min.js";
import "../libs/jszip.min.js";
import {
    prefixHexBytes,
    replaceClass,
    addClass,
    removeClass,
    updateInputNumberToGroupedDigits,
    searchByIndexVersion,
    urlNoTrailingSlash,
    getEthDisplayType,
    formatInConfiguredValue,
    convertToWei,
    getDecimalEtherFormat,
    convertTab,
    formatFileStructure,
    overrideInputToIntegerRange,
    stringToHex
} from "../../utils/commonFunctions.js";
import {
    HASH_TASK_CONTRACT_ADDRESS,
    SINGLE_HASH_REQUIREMENT_HASH,
    THE_LIST_CONTRACT_ADDRESS,
    USERS_CONTRACT_ADDRESS
} from "../../utils/constants.js";

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
const basicDisplayTab = document.querySelector('.basic-display-tab');
const directDisplayTab = document.querySelector('.direct-display-tab');
const basicDisplaySection = document.querySelector('.basic-display');
const directDisplaySection = document.querySelector('.direct-display');
const ethTypeSelect = document.querySelector('.direct-display__eth-type-select');
const ethNumber = document.querySelector('.direct-display__eth-number');
const instructionsInput = document.querySelector('.direct-display__instructions-input');
const uploadFilesInput = document.querySelector('.direct-display__upload-files-input');
const uploadFilesButton = document.querySelector('.direct-display__upload-files-button');
const uploadFolderInput = document.querySelector('.direct-display__upload-folder-input');
const uploadFolderButton = document.querySelector('.direct-display__upload-folder-button');
const clearUploadsButton = document.querySelector('.direct-display__clear-uploads-button');
const uploadFileTreeSection = document.querySelector('.direct-display__upload-file-tree-section');
const uploadFileTreeInput = document.querySelector('.direct-display__upload-file-tree-input');
const uploadFileError = document.querySelector('.direct-display__upload-file-error');
const textKey = document.querySelector('.direct-display__text-key');
const solutionExplanation = document.querySelector('.direct-display__solution-explanation');
const setDeadlineSection = document.querySelector('.set-deadline-section');
const optionalSettingsFoldButton = document.querySelector('.direct-display__optional-settings__fold-button');
const optionalSettingsContent = document.querySelector('.direct-display__optional-settings__content');
const optionalSettingsDifficulty = document.querySelector('.direct-display__optional-settings__difficulty-input');
const optionalSettingsKeyReveal = document.querySelector('.direct-display__optional-settings__key-reveal-input');
const downloadButton = document.querySelector('.direct-display__download-button');
const downloadError = document.querySelector('.direct-display__download-error');
const editTaskHash = document.querySelector('.direct-display__edit-task-hash');
const displayTaskHash = document.querySelector('.direct-display__task-hash');
const displayTaskHashInput = document.querySelector('.direct-display__task-hash-input');
const displayTaskHashKeyInputContainer = document.querySelector('.direct-display__task-hash-value-container');
const displayTaskHashValueInput = document.querySelector('.direct-display__task-hash-value-input');
const taskHostSection = document.querySelector('.task-host-section');
const directCheckbox = document.querySelector('.direct-display__submit__checkbox');
const addTask = document.querySelector('.direct-display__submit__add-task');
const addTaskError = document.querySelector('.direct-display__submit__add-task-error');

// Gets the URL parameters
const url = new URL(window.location.href);
const params = Object.fromEntries(url.searchParams.entries());

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
let tabSection;
let ethDisplayType;
let weiValue = 0n;
const uploads = new Map();
let deadlineDateTime = null;
let optionalFoldOpen = false;
let difficultyValue = 15;
let keyRevealValue = true;
let downloadedTaskHash;
let directCheckboxChecked = false;
let taskUploadChecksPassed = false;
let isShowingTaskHashEdit = false;
let solutionFileHashValue = null;

// Configure the tab section
if (typeof (params.display) === "string") {
    const display = params.display;
    if (display === "basic") {
        tabSection === "basic";
    } else if (display === "direct") {
        tabSection = "direct";
    }
}
if (tabSection === "basic") {
    selectBasicDisplay();
} else {
    selectDirectDisplay();
}

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

// Tabs
basicDisplayTab.addEventListener("click", selectBasicDisplay);
directDisplayTab.addEventListener("click", selectDirectDisplay);

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
        window.location.pathname = "./pages/viewTasks.html";
    });
});

// Activates the zip file upload anchor
fileUpload.addEventListener('click', function () {
    zipInput.click();
});

// Prompts user to upload a zip file
zipInput.addEventListener('change', zipInputUpload);

// Initialize Ether unit selector, update the selection, update input on change,
// and maintain Ether value
ethDisplayType = getEthDisplayType();
ethTypeSelect.value = ethDisplayType;
ethTypeSelect.addEventListener('change', (event) => {
    const ethNumberNoWhitespace = ethNumber.value.replace(/\s+/g, '');
    weiValue = convertToWei(ethNumberNoWhitespace, ethDisplayType);
    const index = event.target.selectedIndex;
    const option = event.target.options[index];
    ethDisplayType = option.value;
    updateEthTypeInput(ethDisplayType);
});

// Initialize Ether input and format it on any change based on the unit type
ethNumber.value = "";
ethNumber.addEventListener("input", () => {
    let ethNumberNoWhitespace;
    switch (ethDisplayType) {
        case "eth":
            const { inputString, cursorIndex } = getDecimalEtherFormat(
                ethNumber.value, ethNumber.selectionStart
            );
            ethNumber.value = inputString;
            ethNumber.selectionStart = cursorIndex;
            ethNumber.selectionEnd = cursorIndex;
            ethNumberNoWhitespace = ethNumber.value.replace(/\s+/g, '');
            weiValue = convertToWei(ethNumberNoWhitespace, "eth");
            break;
        case "wei":
            updateInputNumberToGroupedDigits(ethNumber);
            ethNumberNoWhitespace = ethNumber.value.replace(/\s+/g, '');
            weiValue = convertToWei(ethNumberNoWhitespace, "wei");
            break;
    }
});

// Convert tab characters within the textarea to tab characters
instructionsInput.addEventListener("keydown", (event) => {
    convertTab(instructionsInput, event, false);
    updateAddTask();
});

// Uploading files or folders to the uploads section saves the files and updates
// the file tree
uploadFilesButton.addEventListener("click", () => {
    uploadFilesInput.click();
});
uploadFilesInput.addEventListener("change", (event) => {
    uploadFileError.textContent = "";
    addClass(uploadFileError, "hide");
    removeClass(uploadFileTreeSection, "hide");
    try {
        for (const file of event.target.files) {
            addFile(file, file.name);
        }
        uploadFilesInput.value = "";
    } catch (error) {
        removeClass(uploadFileError, "hide");
        uploadFileError.textContent
            = `[X] ERROR: File upload failure - ${error}`;
    }
});
uploadFolderButton.addEventListener("click", () => {
    uploadFolderInput.click();
});
uploadFolderInput.addEventListener("change", (event) => {
    uploadFileError.textContent = "";
    addClass(uploadFileError, "hide");
    removeClass(uploadFileTreeSection, "hide");
    try {
        for (const file of event.target.files) {
            addFile(file, file.webkitRelativePath || file.name);
        }
        uploadFolderInput.value = "";
    } catch (error) {
        removeClass(uploadFileError, "hide");
        uploadFileError.textContent
            = `[X] ERROR: File upload failure - ${error}`;
    }
});

// Clear all files and update the file tree
clearUploadsButton.addEventListener("click", () => {
    uploads.clear();
    updateFileTree();
});

// Initialize the file tree input to empty
uploadFileTreeInput.value = "";

// Convert tab characters within the textarea to tab characters
textKey.addEventListener("keydown", (event) => {
    convertTab(textKey, event, false);
    updateAddTask();
});
solutionExplanation.addEventListener("keydown", (event) => {
    convertTab(solutionExplanation, event, false);
    updateAddTask();
});

// Set deadline section allows the user to input task deadline by timespan or
// date time, then when the deadline value is updated by the user the subscriber
// function updates the deadline value and updates the add task validation
setDeadlineSection
    .subscribeToDeadlineUpdate((dateTime) => {
        deadlineDateTime = dateTime;
        updateAddTask();
    });

// Allow the user to open the optional fold to edit the difficulty value and key
// reveal from the defaults
optionalSettingsFoldButton.addEventListener("click", () => {
    optionalFoldOpen = !optionalFoldOpen;
    if (optionalFoldOpen) {
        optionalSettingsFoldButton.textContent = "▼";
        removeClass(optionalSettingsContent, "hide");
    } else {
        optionalSettingsFoldButton.textContent = "▶";
        addClass(optionalSettingsContent, "hide");
    }
});

// Allow the user to change the difficulty value
optionalSettingsDifficulty.value = difficultyValue;
optionalSettingsDifficulty.addEventListener("input", () => {
    difficultyValue
        = overrideInputToIntegerRange(optionalSettingsDifficulty, 0, 255);
    updateAddTask();
});

// Allow the user to toggle the key reveal
optionalSettingsKeyReveal.addEventListener("click", () => {
    keyRevealValue = !keyRevealValue;
    if (keyRevealValue) {
        optionalSettingsKeyReveal.textContent = "TRUE";
    } else {
        optionalSettingsKeyReveal.textContent = "FALSE";
    }
});

// Download task button
downloadButton.addEventListener("click", downloadTaskZipAndSetTaskHash);

// When the edit button is clicked, change the links button from readonly to
// write and update the input values to any existing data
editTaskHash.addEventListener("click", () => {
    isShowingTaskHashEdit = true;
    removeClass(displayTaskHashInput, "hide");
    removeClass(displayTaskHashKeyInputContainer, "hide");
    displayTaskHash.textContent = "Task.zip Hash:";
    displayTaskHashInput.value = prefixHexBytes(downloadedTaskHash) ?? "";
    displayTaskHashValueInput.value = prefixHexBytes(solutionFileHashValue) ?? "";
    updateDataHostSection();
});

// Update the task hash variable and update the hash for the hosting section
// if it is a valid hash
displayTaskHashInput.addEventListener("input", () => {
    downloadedTaskHash = displayTaskHashInput.value;
    downloadError.textContent = "";
    if (!(prefixHexBytes(downloadedTaskHash)?.length === 66)) {
        downloadError.textContent
            = "[X] ERROR: Invalid ZIP hash hex - Must be 32 byte hex";
    }
    updateDataHostSection();
});

// Update the task hash value and update the add task validation
displayTaskHashValueInput.value = "";
displayTaskHashValueInput.addEventListener("input", () => {
    solutionFileHashValue = displayTaskHashValueInput.value;
    downloadError.textContent = "";
    if (!(prefixHexBytes(solutionFileHashValue)?.length === 66)) {
        downloadError.textContent
            = "[X] ERROR: Invalid task hash key - Must be 32 byte hex";
    }
    updateAddTask();
});

// Data host section allows the user to view the task data and hosting locations
// as well as provide feedback on the user connection and hosting status, and
// when the hosting data has been found, the hash and add task validation is
// updated
taskHostSection
    .setFilePath("Tasks/HashTasks")
    .setFileName("Task.zip")
    .setProvider(provider)
    .subscribeToDataFound((data) => {
        fileCrossChecked = true;
        downloadedTaskHash = data.hash;
        updateAddTask();
    })
    .init();

// The user can check the ethics requirements confirmation checkbox
directCheckbox.addEventListener("click", () => {
    directCheckboxChecked = !directCheckboxChecked;
    directCheckbox.textContent = directCheckboxChecked ? "✓" : "";
    updateAddTask();
});

// Try to add the task with the provided data if all task validations pass
addTask.addEventListener("click", async () => {

    // Only add the task if the task data is correctly hosted and all task
    // parameters are validated
    updateAddTask();
    if (!taskUploadChecksPassed) {
        return;
    }

    // Add hash task to blockchain, display any transaction error
    let transactionResponse;
    try {

        // Load the user to verify the signer for the blockchain transaction
        await loadUser();

        // Create the transaction with the constructed task data
        const calculatedSecondsToDeadline = Math.floor(
            (deadlineDateTime.getTime() - (new Date()).getTime())
            / 1000
        );
        transactionResponse = await hashTaskSigner.addHashTask(
            prefixHexBytes(solutionFileHashValue),
            prefixHexBytes(downloadedTaskHash),
            calculatedSecondsToDeadline,
            difficultyValue,
            keyRevealValue,
            { value: BigInt(weiValue) }
        );
    } catch (error) {
        addTaskError.textContent = `[X] ERROR: Transaction failed - ${error}`;
        return;
    }

    // Return to view tasks page after transaction addition
    transactionResponse.wait().then(async () => {
        window.location.pathname = "./pages/viewTasks.html";
    });
});

/**
 * Validate each necessary hash task upload requirement, display a descriptive
 * error if any checks fail, and enable/disable the add task button
 */
function updateAddTask() {

    // Reset task validation display and variable
    taskUploadChecksPassed = false;
    replaceClass(addTask, "payable-button", "inactive-payable-button");

    // Instructions should not be empty
    if (instructionsInput.value === "") {
        addTaskError.textContent
            = "[X] ERROR: Instructions should not be empty";
        return;
    }

    // Text key solution should not be empty
    if (textKey.value === "") {
        addTaskError.textContent
            = "[X] ERROR: Text key solution should not be empty";
        return;
    }

    // Solution explanation should not be empty
    if (solutionExplanation.value === "") {
        addTaskError.textContent
            = "[X] ERROR: Solution explanation should not be empty";
        return;
    }

    // Solution hash key should be defined
    if (solutionFileHashValue === null) {
        addTaskError.textContent
            = "[X] ERROR: Solution hash value should be defined";
        return;
    }

    // Deadline should be valid and in future
    const deadlineError = setDeadlineSection.getDeadlineError();
    switch (deadlineError) {
        case "NONE":
            break;
        case "PAST":
            addTaskError.textContent
                = "[X] ERROR: Deadline must be in the future";
            return;
        case "INVALID":
        default:
            addTaskError.textContent
                = "[X] ERROR: Invalid deadline input";
            return;
    }

    // Task difficulty value should be defined
    if (difficultyValue === null) {
        addTaskError.textContent = "[X] ERROR: Task difficulty value should be "
            + "defined";
        return;
    }

    // Task hash should be defined
    if (downloadedTaskHash === undefined) {
        addTaskError.textContent = "[X] ERROR: Task hash should be set "
            + "(download Task.zip to automatically set task hash)";
        return;
    }

    // Task should be hosted
    if (!fileCrossChecked) {
        addTaskError.textContent = "[X] ERROR: Task should be hosted at user "
            + "defined location (Fetch Status to validate file hosting)";
        return;
    }

    // Ethics requirements checked
    if (!directCheckboxChecked) {
        addTaskError.textContent
            = "[X] ERROR: Ethics requirements should be checked";
        return;
    }

    replaceClass(addTask, "inactive-payable-button", "payable-button");
    addTaskError.textContent = "";
    taskUploadChecksPassed = true;
}

/**
 * Constructs the Task.zip file using the user input data
 */
async function downloadTaskZipAndSetTaskHash() {

    // Fetch single hash and add to Requirements folder
    const requirementResponse = await fetch(`./data/localData/TheList/`
        + `${SINGLE_HASH_REQUIREMENT_HASH.substring(2)}/Requirement.zip`);
    if (!requirementResponse.ok) {
        downloadError.textContent
            = "[X] ERROR: Failed to fetch Requirement.zip";
        return;
    }
    const requirementZipBytes = await requirementResponse.arrayBuffer();
    const requirementBytes = new Uint8Array(requirementZipBytes);
    const requirementHash = keccak256(requirementBytes);
    if (prefixHexBytes(requirementHash)
        !== prefixHexBytes(SINGLE_HASH_REQUIREMENT_HASH)
    ) {
        downloadError.textContent
            = "[X] ERROR: Retrieved Requirement.zip hash invalid";
        return;
    }

    // Creates a new ZIP file for the Task.zip construction
    const zip = new JSZip();

    // Adds the Hash Task requirement ZIP file
    zip.file('Task/Requirements/Requirement1-1.zip', requirementZipBytes);

    // Create specifications.json
    zip.file("Task/specifications.json", [
        `[`,
        `   {`,
        `       "taskIndex": 0,`,
        `       "requirementIndex": 1,`,
        `       "specifications": {`,
        `           "instructions": "${instructionsInput.value}",`,
        `           "encryptedSolution": "solution.enc",`,
        `           "decryptedSolution": "solution.txt"`,
        `       }`,
        `   }`,
        `]`,
    ].join("\n"));

    // Get the task solution user input and generate the task hash key
    const solutionFileExplanation = solutionExplanation.value;
    const solutionFileTextKey = textKey.value;
    const solutionFileKey = stringToHex(solutionFileTextKey);
    const solutionFileHashKey = keccak256(solutionFileKey);
    
    // Update the task hash value display and variable
    solutionFileHashValue = keccak256(solutionFileHashKey);
    displayTaskHashValueInput.value = solutionFileHashValue;

    // Create the solution text file
    const solutionFileText = [
        `${solutionFileExplanation}`,
        ``,
        `"${solutionFileTextKey}" encoded into UTF-8 bytes is `
            + `${solutionFileKey}.`,
        ``,
        `_bytes1: ${solutionFileKey}`,
        `_bytes2: ${solutionFileHashKey}`,
        `_bytes3: ${solutionFileHashValue}`,
    ].join("\n");

    // Encrypt the solution text file using the task hash key
    const encryptedSolution = await encryptTextWithPassword(
        solutionFileText,
        solutionFileHashKey.substring(2)
    );
    zip.file("Task/solution.enc", encryptedSolution, { binary: true });

    // Add additional files
    for (const [name, bytes] of uploads) {
        zip.file(`Task/${name}`, bytes);
    }

    // Zip the file
    const outBlob = await zip.generateAsync({ type: 'blob' });
    const blobBuffer = await outBlob.arrayBuffer();
    const blobBytes = new Uint8Array(blobBuffer);

    // Update the task hash variable and display
    downloadedTaskHash = keccak256(blobBytes);
    if (!isShowingTaskHashEdit) {
        displayTaskHash.textContent = `Task.zip Hash: ${downloadedTaskHash}`;
    }
    displayTaskHashInput.value = downloadedTaskHash;
    taskHostSection.setFileHash(downloadedTaskHash);

    // Download ZIP file
    const a = document.createElement('a');
    a.href = URL.createObjectURL(outBlob);
    a.download = 'Task.zip';
    document.body.appendChild(a);
    a.click();
    a.remove();
    
    // Update the add task validation
    updateAddTask();
}

/**
 * Encrypts the given plain text contents with the given password to encrypted
 * byte data.
 * The encryption is equivalent to using OpenSSL AES-256-cbc encryption with the
 * password
 * @param {String} textContent Plain text contents
 * @param {String} password Password string to encrypt the text contents
 * @param {Uint8Array<ArrayBuffer> | null} salt Encryption salt value
 * @returns {Uint8Array<ArrayBuffer>} Encrypted byte data
 */
async function encryptTextWithPassword(
    textContent,
    password,
    salt = crypto.getRandomValues(new Uint8Array(8))
) {

    // Encode the input data into bytes
    const encoder = new TextEncoder();
    const plaintextBytes = encoder.encode(textContent);
    const passwordBytes = encoder.encode(password);

    // Generate the hash1 data and key
    const hash1Data = new Uint8Array(passwordBytes.length + salt.length);
    hash1Data.set(passwordBytes);
    hash1Data.set(salt, passwordBytes.length);
    const hash1 = await crypto.subtle.digest("SHA-256", hash1Data);
    const key = new Uint8Array(hash1).slice(0, 32);

    // Hash and concat the hash1, passwordBytes, and salt
    const hash2Data = new Uint8Array(32 + passwordBytes.length + salt.length);
    hash2Data.set(new Uint8Array(hash1));
    hash2Data.set(passwordBytes, 32);
    hash2Data.set(salt, 32 + passwordBytes.length);
    const hash2 = await crypto.subtle.digest("SHA-256", hash2Data);
    
    // Generate the crypto key
    const iv = new Uint8Array(hash2).slice(0, 16);
    const cryptoKey = await crypto.subtle.importKey(
        "raw",
        key,
        { name: "AES-CBC" },
        false,
        ["encrypt"]
    );

    // Encrypt the ciphertext
    const ciphertext = new Uint8Array(
        await crypto.subtle.encrypt(
            { name: "AES-CBC", iv },
            cryptoKey,
            plaintextBytes
        )
    );

    // Concat the salt header, salt, and ciphertext
    const saltedHeader = encoder.encode("Salted__");
    const out = new Uint8Array(8 + 8 + ciphertext.length);
    out.set(saltedHeader, 0);
    out.set(salt, 8);
    out.set(ciphertext, 16);

    // Return the encrypted data bytes
    return out;
}

/**
 * Adds the file to the uploads and updates the file tree if the file does not
 * exist yet
 * @param {File} file File data
 * @param {String} relativePath Relative path, file name, and extension
 */
function addFile(file, relativePath) {
    if (!uploads.has(relativePath)) {
        uploads.set(relativePath, file);
        updateFileTree();
    }
}

/**
 * Formats the file paths to a file tree text structure
 */
function updateFileTree() {
    const pathsArray = Array.from(uploads.keys());
    const uploadsFileTree = formatFileStructure(pathsArray);
    uploadFileTreeInput.value = uploadsFileTree;
}

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
 * @param {String} zipHash Keccak256 hash of the Task.zip file to match
 */
async function tryMatchFile(zipHash) {

    // Load user links
    await loadUser();
    const usersLinks = await usersContract.links(address);
    const linksSplit = usersLinks.split(",");
    let downloadUrls = [];
    for (let i = 0; i < linksSplit.length; i++) {
        try {
            const nextUrl = urlNoTrailingSlash(new URL(linksSplit[i]));
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

/**
 * Select the basic display tab and hide the direct display section
 */
function selectBasicDisplay() {
    addClass(basicDisplayTab, "tab-selected");
    removeClass(basicDisplaySection, "hide");
    removeClass(directDisplayTab, "tab-selected");
    addClass(directDisplaySection, "hide");
}
/**
 * Select the direct display tab and hide the basic display section
 */
function selectDirectDisplay() {
    addClass(directDisplayTab, "tab-selected");
    removeClass(directDisplaySection, "hide");
    removeClass(basicDisplayTab, "tab-selected");
    addClass(basicDisplaySection, "hide");
}

/**
 * Format the ETH input into the selected ETH display type
 */
function updateEthTypeInput() {
    ethNumber.value = formatInConfiguredValue(weiValue, ethDisplayType);
}

/**
 * If the task submission hash value is valid then the submission host section
 * is updated, and the add submission button is updated
 */
function updateDataHostSection() {
    fileCrossChecked = false;
    if (downloadedTaskHash !== undefined
        && prefixHexBytes(downloadedTaskHash)?.length === 66
    ) {
        taskHostSection.setFileHash(downloadedTaskHash);
    }
    updateAddHashButton();
}