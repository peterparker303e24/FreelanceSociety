import { ethers, keccak256 } from "../libs/ethers.min.js";
import * as JSZip from "../libs/jszip.min.js";
import {
    formatWei,
    loadHeader,
    prefixHexBytes,
    replaceClass,
    updateInputNumberToGroupedDigits
} from "../../utils/commonFunctions.js";
import { HASH_TASK_CONTRACT_ADDRESS } from "../../utils/constants.js";

// Page elements
const hashTaskId = document.getElementById("hash-task-id");
const hashKeyInput = document.getElementById("hash-key-input");
const hashResult = document.getElementById("hash-result");
const expectedHash = document.getElementById("expected-hash");
const nonce = document.getElementById("nonce-input");
const generateNonceButton = document.getElementById("generate-nonce-button");
const nonceGenerationEstimation
    = document.getElementById("nonce-generation-estimation");
const workerAddressText = document.getElementById("address");
const difficulty = document.getElementById("difficulty");
const expectedDifficulty = document.getElementById("expected-difficulty");
const taskComplete = document.getElementById("task-complete");
const deadline = document.getElementById("deadline");
const reward = document.getElementById("reward");
const submitButton = document.getElementById("submit-task-button");
const errorText = document.getElementById("error");

// Page interaction variables
let nonceValue = Number(nonce.value.replace(/\s/g, ""));
let validSubmit;
let workerAddressValue;
let hashKeyValue;
let hashResultValue;
let expectedHashValue;
let difficultyValue;
let expectedDifficultyValue;
let taskCompleteValue;
let deadlineValue;
let rewardValue;
let generationStartTime;
let isGenerating = false;
let generatedNoncesCount = 0;
let generationUpdateIntervalId;
let generationIntervalId;
let generatedNonce;

// Load the header button navigation functionality
loadHeader();

// Get The List and users contracts from provider
const hashTaskContractAddress = HASH_TASK_CONTRACT_ADDRESS;
const provider = new ethers.BrowserProvider(window.ethereum);
const hashTaskAbi = await fetch('./data/abi/hashTaskAbi.json');
const hashTaskJson = await hashTaskAbi.json();
const hashTaskContract = new ethers.Contract(
    hashTaskContractAddress,
    hashTaskJson.abi,
    provider
);

// Gets the task index from the URL
const url = new URL(window.location.href);
const params = Object.fromEntries(url.searchParams.entries());
const hashTaskIndex = Number(params.index);
hashTaskId.textContent = `h-${hashTaskIndex}`;
nonce.value = "";

// Automatically load user
try {
    await provider.send("eth_requestAccounts", []);
} catch {
    errorText.textContent = "[X] ERROR: No wallet found";
}

// Display user address, and update it if account changed
if (window.ethereum && window.ethereum.selectedAddress) {
    window.ethereum.on('accountsChanged', () => {
        workerAddressValue = window.ethereum.selectedAddress;
        workerAddressText.textContent = workerAddressValue;
    });
    workerAddressValue = window.ethereum.selectedAddress;
    workerAddressText.textContent = workerAddressValue;
}

// Gets the task preimage hash and updates the UI
hashTaskContract.getHashTaskHash(hashTaskIndex).then((h) => {
    expectedHashValue = h;
    expectedHash.textContent = expectedHashValue;
    updateIfLoaded();
});

// Gets the task difficulty and updates the UI
hashTaskContract.getHashTaskDifficulty(hashTaskIndex).then((d) => {
    if (d === 0n) {
        expectedDifficultyValue = "0x" + "f".repeat(64);
        expectedDifficulty.textContent = "N/A";
    } else {
        expectedDifficultyValue = "0x"
            + (2n ** (256n - d)).toString(16).padStart(64, "0");
        expectedDifficulty.textContent = expectedDifficultyValue.substring(2);
    }
    updateIfLoaded();
});

// Gets whether the task is already complete and updates the UI
hashTaskContract.getHashTaskComplete(hashTaskIndex).then((c) => {
    taskCompleteValue = c;
    taskComplete.textContent = taskCompleteValue.toString().toUpperCase();
    updateIfLoaded();
});

// Gets the task deadline and updates the UI
hashTaskContract.getHashTaskDeadline(hashTaskIndex).then((d) => {
    deadlineValue = new Date(Number(d) * 1000);
    deadline.textContent = deadlineValue.toUTCString();
    updateIfLoaded();
});

// Gets the task reward and updates the UI
hashTaskContract.getHashTaskTotalWei(hashTaskIndex).then((r) => {
    rewardValue = r;
    reward.textContent = formatWei(rewardValue);
    updateIfLoaded();
});

// Update the hashing calculations and UI when the hash key input changes
hashKeyInput.addEventListener("input", () => {
    updateWorkerHash();
});

// Update the hashing calculations and UI when the nonce input changes
nonce.addEventListener("input", () => {
    updateInputNumberToGroupedDigits(nonce);
    nonceValue = Number(nonce.value.replace(/\s/g, ""));
    updateWorkerHash();
});

// Try to begin nonce generation to find a nonce that produces an acceptable
// difficulty value
generateNonceButton.addEventListener("click", tryInitiateNonceGeneration);

// Submit the completed hash task transaction, and refresh the page on success
submitButton.addEventListener("click", submitHashTask);

/**
 * Try to begin the nonce generation if all dependent data of the task has been
 * loaded and the hash key is correct
 */
function tryInitiateNonceGeneration() {

    // Validate the nonce generation should be started
    if (hashKeyValue === undefined
        || expectedHashValue === undefined
        || hashResultValue === undefined
        || expectedDifficultyValue === undefined
        || workerAddressValue === undefined
    ) {
        return;
    }
    if (expectedDifficultyValue === "0x" + "f".repeat(64)) {
        nonce.value = "0";
        return;
    }
    if (hashResultValue !== expectedHashValue) {
        nonceGenerationEstimation.textContent
            = "Obtain hash key before generating nonce";
        return;
    }

    // Clear any existing nonce generation processes
    if (generationIntervalId !== undefined) {
        clearInterval(generationIntervalId);
    }
    if (generationUpdateIntervalId !== undefined) {
        clearInterval(generationUpdateIntervalId);
    }

    // Initialize generation values, update display, and begin search generation
    generatedNoncesCount = 0;
    generationStartTime = Date.now();
    isGenerating = true;
    generatedNonce = Math.floor(9000000000 * Math.random()) + 1000000000;
    nonce.value = generatedNonce;
    generationIntervalId = setInterval(updateNonceGenerationDisplay, 500);
    generationUpdateIntervalId = setInterval(checkNewNonceGeneration, 0);
}

/**
 * Update the estimated average generation time display using the hours,
 * minutes, and seconds time formatting
 */
function updateNonceGenerationDisplay() {
    nonce.value = generatedNonce;

    // Calculate the nonce generations per second and the expected value of
    // nonce generations for the difficulty to find the average expected
    // generation time
    const secondsPerNonceGeneration
        = (Date.now() - generationStartTime) / generatedNoncesCount / 1000;
    const expectedDifficultyBinaryNumber
        = BigInt(expectedDifficultyValue).toString(2);
    const expectedAverageNonceGenerations
        = Math.pow(
            2,
            256 - expectedDifficultyBinaryNumber.length
        );
    const secondsForExpectedNonceGeneration = Math.floor(
        secondsPerNonceGeneration * expectedAverageNonceGenerations
    );

    // Display the expected generation time with format hours, minutes, seconds
    nonceGenerationEstimation.textContent = `Estimated generation time: `
        + `${formatTimeHoursMinutesSeconds(secondsForExpectedNonceGeneration)}`;
}

/**
 * Check if the current nonce generation value provides a difficulty value that
 * satisfies the expected difficulty, and if so stops the generation, otherwise
 * increment the nonce for the next generation step
 */
function checkNewNonceGeneration() {

    // Get the expected difficulty value and current difficulty value based on
    // the dependent data and nonce
    const generatedDifficulty = getDifficultyValue(
        hashKeyValue,
        workerAddressValue,
        generatedNonce
    );
    const generatedDifficultyNumber = BigInt(generatedDifficulty);
    const expectedDifficultyNumber = BigInt(expectedDifficultyValue);

    // If the generated difficulty value meets the difficulty requirement, then
    // stop the generation process and update the display
    if (generatedDifficultyNumber < expectedDifficultyNumber) {
        clearInterval(generationIntervalId);
        clearInterval(generationUpdateIntervalId);
        nonceValue = generatedNonce;
        nonce.value = generatedNonce;
        updateWorkerHash();
        nonceGenerationEstimation.textContent = `Nonce found`;
        return;
    }

    // Increment the nonce generation
    generatedNoncesCount++;
    generatedNonce++;
}


/**
 * Validate the hash key and nonce, get the user signer for the hash task
 * contract, submit the transaction, then refresh the page
 */
async function submitHashTask() {

    // Only submit the task if the transaction will succeed
    if (!validSubmit) {
        return;
    }

    // Get the user hash task contract signer
    let signer;
    try {
        signer = await provider.getSigner();
    } catch (error) {
        errorText.textContent = `[X] ERROR: Get signer failed - ${error}`;
        return;
    }
    let hashTaskSigner = new ethers.Contract(
        hashTaskContractAddress,
        hashTaskJson.abi,
        signer
    );

    // Submit the transaction and display message on error
    let transactionResponse;
    try {
        transactionResponse = await hashTaskSigner.submitHashTask(
            hashTaskIndex,
            hashKeyValue,
            BigInt(nonceValue)
        );
    } catch (error) {
        errorText.textContent
            = `[X] ERROR: Transaction failed - ${error}`;
        return;
    }

    // Refresh the page when the transaction goes through
    transactionResponse.wait().then(async () => {
        window.location.reload();
    });
}

/**
 * Update the submit task button visuals based on whether the user input is
 * valid
 */
function updateSubmitButton() {
    if (validSubmit) {
        replaceClass(submitButton, "inactive-payable-button", "payable-button");
    } else {
        replaceClass(submitButton, "payable-button", "inactive-payable-button");
    }
}

/**
 * Update the UI if all the hash task data has loaded
 */
function updateIfLoaded() {
    if (expectedHashValue !== undefined
        && expectedDifficultyValue !== undefined
        && taskCompleteValue !== undefined
        && deadlineValue !== undefined
        && rewardValue !== undefined
    ) {
        updateWorkerHash();
    }
}

/**
 * Update the derived data from the hash key user input, and display a warning
 * message if the input is not valid for the hash task submission
 */
function updateWorkerHash() {

    // Initialize submit button to invalid
    validSubmit = false;
    updateSubmitButton();

    // Format the hash key from the user input
    hashKeyValue = prefixHexBytes(hashKeyInput.value);

    // Validate the user input hash key, and update error message if invalid
    if (hashKeyValue === null || hashKeyValue.length !== 66) {
        hashResultValue = null;
        hashResult.textContent = "-";
        difficulty.textContent = "-";
        errorText.textContent = "(!) Enter a 256 byte hex string hash key input";
        if (hashResultValue === expectedHashValue) {
            nonceGenerationEstimation.textContent
                = "Estimated generation time: -";
        } else {
            nonceGenerationEstimation.textContent
                = "Obtain hash key before generating nonce"
        }
        return;
    }

    // Derive the difficulty hash value from the hash key, user address, and
    // nonce
    hashResultValue = keccak256(hashKeyValue);
    hashResult.textContent = hashResultValue;
    difficultyValue = getDifficultyValue(
        hashKeyValue,
        workerAddressValue,
        nonceValue
    );
    difficulty.textContent = difficultyValue.substring(2);

    // Validate the hash key and difficulty match the expected, the task is not
    // already complete, and the deadline has not already passed
    if (hashResultValue !== expectedHashValue) {
        errorText.textContent
            = "(!) Hash key does not match expected hash value";
        return;
    }
    nonceGenerationEstimation.textContent = "Estimated generation time: -";
    if (difficultyValue.substring(2) >= expectedDifficultyValue.substring(2)) {
        errorText.textContent
            = "(!) Difficulty is not less than expected task difficulty";
        return;
    }
    if (taskCompleteValue) {
        errorText.textContent
            = "(!) Task has already been complete";
        return;
    }
    if (deadlineValue < new Date().toUTCString()) {
        errorText.textContent
            = "(!) Task deadline has already passed";
        return;
    }

    // The submission is validated and the UI is updated
    validSubmit = true;
    errorText.textContent = "";
    updateSubmitButton();
}

/**
 * Get the difficulty value of the given data using the hash task calculation 
 * @param {String} hashKey Key of the hash task
 * @param {String} workerAddress Address of the current user with the "0x"
 * prefix
 * @param {Number} nonceNumber Nonce number
 * @returns {String} The calculated difficulty value, as hex data with "0x"
 * prefix, of the resulting keccak256 hash using the given data
 */
function getDifficultyValue(hashKey, workerAddress, nonceNumber) {
    keccak256(hashKey);
    hashResult.textContent = hashResultValue;
    const combinedBytes =
        prefixHexBytes(hashKey)
        + "0".repeat(24)
        + workerAddress.substring(2);
    const combinedHash = keccak256(combinedBytes);
    const nonceBytes = nonceNumber.toString(16).padStart(64, "0");
    return keccak256(combinedHash + nonceBytes);
}

/**
 * Gets the hours, minutes, and seconds based on the given number of seconds
 * @param {Number} seconds Number of seconds to display
 * @returns {String} Time duration in the form hours, minutes, seconds
 */
function formatTimeHoursMinutesSeconds(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours} hours, ${minutes} minutes, ${seconds} seconds`;
}
