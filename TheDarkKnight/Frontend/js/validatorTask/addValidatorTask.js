import { ethers, keccak256 } from "../libs/ethers.min.js";
import "../libs/jszip.min.js";
import {
    loadHeader,
    prefixHexBytes,
    replaceClass,
    updateInputNumberToGroupedDigits,
    searchByIndexVersion,
    formatTaskJson,
    formatWei,
    getRequirementVersionData,
    addClass
} from "../../utils/commonFunctions.js";
import {
    THE_LIST_CONTRACT_ADDRESS,
    USERS_CONTRACT_ADDRESS,
    VALIDATOR_TASK_CONTRACT_ADDRESS,
    THE_LIST_CONTRACT_MINIMUM_BLOCK
} from "../../utils/constants.js";

// Page elements
const specificationsCount
    = document.getElementById("specifications-count-input");
const taskHash = document.getElementById("task-hash-input");
const blockScheduleButton = document.getElementById("block-schedule-button");
const deadlineInput = document.getElementById("deadline-input");
const validationTime = document.getElementById("validation-time-input");
const validationDelay = document.getElementById("delay-input");
const validatorAddresses = document.getElementById("validator-addresses-input");
const validatorComission = document.getElementById("comission-input");
const rewardInput = document.getElementById("reward-input");
const checkbox = document.getElementById("checkbox");
const addValidatorTaskButton = document.getElementById("add-task-button");
const errorText = document.getElementById("error");
const fileUpload = document.getElementById('upload-file-button');
const zipInput = document.getElementById('file-input');
const fileName = document.getElementById('file-name');
const fileError = document.getElementById('file-error');
const taskJsonArea = document.getElementById("task-json");
const structureInstructions = document.getElementById("structure-instructions");

// Load the header button navigation functionality
loadHeader();

// Hash task addition variables
let file;
let fileBytes;
let address;
let signer;
let fileCrossChecked;
let validatorTaskSigner;
let taskHashValue;
let specificationsCountValue;
let secondsToDeadline;
let isBlockSchedule = true;
let validationTimeValue;
let delayValue;
let validatorAddressesValues;
let comissionValue;
let difficulty;
let reward;
let isEthicsChecked = false;
let checksPassed = false;

// Get The List and users contracts from provider
const usersContractAddress = USERS_CONTRACT_ADDRESS;
const theListContractAddress = THE_LIST_CONTRACT_ADDRESS;
const validatorTaskContractAddress = VALIDATOR_TASK_CONTRACT_ADDRESS;
const provider = new ethers.BrowserProvider(window.ethereum);
const usersAbi = await fetch('./data/abi/usersAbi.json');
const theListAbi = await fetch('./data/abi/theListAbi.json');
const validatorTaskAbi = await fetch('./data/abi/validatorTaskAbi.json');
const usersJson = await usersAbi.json();
const theListJson = await theListAbi.json();
const validatorTaskJson = await validatorTaskAbi.json();
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
taskHash.addEventListener("input", updateAddHashButton);

// Validates requirements count numerical input and update variables
specificationsCount.addEventListener("input", () => {

    // Parse only numerical characters
    updateInputNumberToGroupedDigits(specificationsCount);
    updateAddHashButton();
});

// Validates deadline numerical input and update variables
deadlineInput.addEventListener("input", () => {

    // Parse only numerical characters
    updateInputNumberToGroupedDigits(deadlineInput);
    updateAddHashButton();
});

// Updates checkbox check mark variable and display
blockScheduleButton.addEventListener("click", () => {
    if (isBlockSchedule) {
        blockScheduleButton.textContent = "OFF";
    } else {
        blockScheduleButton.textContent = "ON";
    }
    isBlockSchedule = !isBlockSchedule;
});

// Validates deadline numerical input and update variables
validationTime.addEventListener("input", () => {

    // Parse only numerical characters
    updateInputNumberToGroupedDigits(validationTime);
    updateAddHashButton();
});

// Validates deadline numerical input and update variables
validationDelay.addEventListener("input", () => {

    // Parse only numerical characters
    updateInputNumberToGroupedDigits(validationDelay);
    updateAddHashButton();
});

// Format comma separated validator addresses into new lines in the text area,
// then updates the variables
validatorAddresses.addEventListener("input", () => {
    let modifiedText = validatorAddresses.value.replace(/\s+/g, '');
    modifiedText = modifiedText.replace(/,(\s*\S)/g, ',\n$1');
    if (modifiedText !== validatorAddresses.value) {
        validatorAddresses.value = modifiedText;
    }
    updateAddHashButton();
});

// Validates deadline numerical input and update variables
validatorComission.addEventListener("input", () => {

    // Parse only numerical characters
    updateInputNumberToGroupedDigits(validatorComission);
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
addValidatorTaskButton.addEventListener("click", async () => {

    // Only add the requirement if the data is correctly hosted and hash task
    // parameters are valid
    updateAddHashButton();
    if (!checksPassed) {
        return;
    }

    // Add hash task to blockchain, display any transaction error
    let transactionResponse;
    try {
        transactionResponse = await validatorTaskSigner.addTask(
            prefixHexBytes(taskHashValue),
            specificationsCountValue,
            secondsToDeadline,
            isBlockSchedule,
            delayValue,
            validationTimeValue,
            validatorAddressesValues,
            comissionValue,
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
        taskHash.value = fileHash;
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
    validatorTaskSigner = new ethers.Contract(
        validatorTaskContractAddress,
        validatorTaskJson.abi,
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
            `${downloadUrls[i]}/Tasks/ValidatorTasks/`
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
    errorText.textContent = `[X] ERROR: Requirement.zip file not found at any `
        + `user endpoint: ${dataEndpoints}`;
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
    let validRequirements = true;

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

    // If specifications file found and parsed, then hide structure instructions
    addClass(structureInstructions, "hide");

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
            fileError.textContent = `Error: Requirement${idArray[i]} `
                + `hash does not match expected`;
            return false;
        }
    }

    // Parse specifications json data for display
    const specificationsJson
        = zipContents.file(`${outerFolderName}/specifications.json`);
    if (!specificationsJson) {
        taskJsonArea.textContent
            = `[X] ERROR: specifications.json not found under directory path`;
        return;
    }
    let jsonObject;
    try {
        const content = await specificationsJson.async("string");
        jsonObject = JSON.parse(content);
    } catch (error) {
        taskJsonArea.textContent
            = `[X] ERROR: Problem parsing specifications.json`;
        return;
    }

    // Task content header
    taskJsonArea.textContent = "<h1>Task Requirements</h1>";

    // Iterate over each requirement listed in the specifications, and for each
    // one parse the corresponding requirement in the requirements folder to
    // display in the requirement fold using the specifications data
    for (let i = 0; i < jsonObject.length; i++) {

        // Displays the requirement with a warning if error parsing, otherwise
        // the requirement is displayed with the specifications inserted
        try {

            // Gets the contents of the corresponding requirement listed in the
            // specification
            const requirementIndex = jsonObject[i].requirementIndex;
            const requirementVersionIndex
                = jsonObject[i].requirementVersionIndex;
            const requirementZip = zipContents.file(
                `${outerFolderName}/Requirements/Requirement${requirementIndex}`
                + `-${requirementVersionIndex}.zip`
            );
            const requirementArrayBuffer
                = await requirementZip.async("arraybuffer");

            // Validate the requirement hash matches the expected in The List
            const requirementFileBytes = new Uint8Array(requirementArrayBuffer);
            const requirementData = await getRequirementVersionData(
                provider,
                theListContract,
                requirementIndex,
                requirementVersionIndex,
                THE_LIST_CONTRACT_MINIMUM_BLOCK
            );
            let requirementJson;
            const taskRequirementHash
                = keccak256(requirementFileBytes).toString("hex");
            const theListRequirementHash = requirementData.versionHash;

            // If the requirement hash is as expected, then integrate the task
            // specifications into the requirement content, otherwise display a
            // warning
            if (taskRequirementHash === theListRequirementHash) {
                const requirementContents
                    = await JSZip.loadAsync(requirementArrayBuffer);

                // Gets the requirement json object from the requirements.json
                // file
                let requirementOuterFolderName;
                requirementContents.forEach((relativePath, zipEntry) => {
                    if (zipEntry.dir) {
                        requirementOuterFolderName = relativePath.substring(
                            0,
                            relativePath.indexOf("/")
                        );
                    }
                });
                const requirementJsonFile = requirementContents.file(
                    `${requirementOuterFolderName}/requirement.json`
                );
                const requirementFile
                    = await requirementJsonFile.async("string");
                requirementJson = JSON.parse(requirementFile);
            } else {
                requirementJson = null;
            }

            // Formats the specification contents with the requirement
            formatTaskJson(
                jsonObject[i],
                requirementJson
            );
        } catch (error) {

            console.log(error);
            // If the parsing results in an error, then display a warning for
            // the requirement
            formatTaskJson(
                null,
                null
            );
            validRequirements = false;
        }
    }

    // If all checks are passed, then the requirement specifications are valid
    return validRequirements;
}

/**
 * Update task parameter variables, validate all task parameters and update
 * checksPassed correspondingly, and update add task button by whether the
 * checks pass
 */
function updateAddHashButton() {

    // Update variable values from input fields
    taskHashValue = taskHash.value;
    specificationsCountValue = specificationsCount.value.replace(/\s+/g, '');
    secondsToDeadline = deadlineInput.value.replace(/\s+/g, '');
    validationTimeValue = validationTime.value.replace(/\s+/g, '');
    delayValue = validationDelay.value.replace(/\s+/g, '');
    validatorAddressesValues = validatorAddresses.value
        .split(',')
        .map(s => s.trim())
        .filter(s => s !== "")
        .map(s => prefixHexBytes(s));
    comissionValue = validatorComission.value.replace(/\s+/g, '');
    reward = rewardInput.value.replace(/\s+/g, '');

    // Checks for validity of each task parameter
    const validTaskHash = prefixHexBytes(taskHashValue) !== null
        && prefixHexBytes(taskHashValue).length === 66;
    const validSpecificationsCount = specificationsCountValue !== undefined
        && Number(specificationsCountValue) !== NaN
        && Number(specificationsCountValue) > 0;
    const validSecondsToDeadline = secondsToDeadline !== undefined
        && Number(secondsToDeadline) !== NaN
        && Number(secondsToDeadline) > 0;
    const validValidationTime = validationTimeValue !== undefined
        && Number(validationTimeValue) !== NaN
        && Number(validationTimeValue) > 0;
    const validDelay = delayValue !== undefined
        && Number(delayValue) !== NaN
        && Number(delayValue) >= 0;
    let validAddresses = validatorAddressesValues.length > 0;
    for (let i = 0; i < validatorAddressesValues.length; i++) {
        validAddresses = validAddresses
            && prefixHexBytes(validatorAddressesValues[i]) !== null
            && prefixHexBytes(validatorAddressesValues[i]).length === 42;
    }
    const validComission = comissionValue !== undefined
        && Number(comissionValue) !== NaN
        && Number(comissionValue) >= 0;
    const validReward = reward !== undefined
        && Number(reward) !== NaN
        && Number(reward) >= 0;

    // Display invalid variable message if any, otherwise update checksPassed
    // variable to true
    checksPassed = false;
    errorText.textContent = ``;
    if (!fileCrossChecked) {
        errorText.textContent = `Task.zip file not correctly hosted or validated`;
    } else if (!validTaskHash) {
        errorText.textContent = `Invalid 32 bytes task hash`;
    } else if (!validSpecificationsCount) {
        errorText.textContent
            = `Invalid specifications count, must be positive number`;
    } else if (!validSecondsToDeadline) {
        errorText.textContent
            = `Invalid seconds to deadline, must by positive number`;
    } else if (!validValidationTime) {
        errorText.textContent
            = `Invalid validation time, must be positive number`;
    } else if (!validDelay) {
        errorText.textContent =
            `Invalid validation delay, must be non-negative number`;
    } else if (!validAddresses) {
        errorText.textContent = `Invalid list of validators, must be comma `
            + `separated 20 byte hex strings with at least 1 validator`;
    } else if (!validComission) {
        errorText.textContent
            = `Invalid validator comission, must be non-negative number`;
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
            addValidatorTaskButton,
            "inactive-payable-button",
            "payable-button"
        );
    } else {
        replaceClass(
            addValidatorTaskButton,
            "payable-button",
            "inactive-payable-button"
        );
    }
}
