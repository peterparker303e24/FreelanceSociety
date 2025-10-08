import { ethers, keccak256 } from "../libs/ethers.min.js";
import * as JSZip from "../libs/jszip.min.js";
import {
    formatWei,
    loadHeader,
    prefixHexBytes,
    replaceClass
} from "../../utils/commonFunctions.js";
import { DOUBLE_HASH_TASK_CONTRACT_ADDRESS } from "../../utils/constants.js";

// Page elements
const doubleHashTaskId = document.getElementById("task-id");
const hashKeyInput = document.getElementById("hash-key-input");
const firstHashInput = document.getElementById("first-hash-input");
const secondHash = document.getElementById("second-hash");
const expectedHash = document.getElementById("expected-hash");
const secondResponseWindow = document.getElementById("second-response-window");
const delay = document.getElementById("delay");
const taskComplete = document.getElementById("task-complete");
const deadline = document.getElementById("deadline");
const reward = document.getElementById("reward");
const responseCount = document.getElementById("response-count");
const submitWindowStart = document.getElementById("submit-window-start");
const submitWindowEnd = document.getElementById("submit-window-end");
const currentTime = document.getElementById("current-time");
const viewSubmissionsButton = document.getElementById("view-submissions-button");
const submitFirstButton = document.getElementById("submit-first-button");
const submitSecondButton = document.getElementById("submit-second-button");
const firstErrorText = document.getElementById("first-error-text");
const secondErrorText = document.getElementById("second-error-text");
const errorText = document.getElementById("error");

// Page interaction variables
let validSubmitFirst;
let validSubmitSecond;
let workerAddressValue;
let hashKeyValue;
let firstHashValue;
let secondHashValue;
let expectedHashValue;
let secondResponseWindowValue;
let delayValue;
let taskCompleteValue;
let deadlineValue;
let rewardValue;
let submitWindowStartValue;
let submitWindowEndValue;
let responseCountValue;
let taskResponses;
let responseIndex;

// Load the header button navigation functionality
loadHeader();

// Get The List and users contracts from provider
const doubleHashTaskContractAddress = DOUBLE_HASH_TASK_CONTRACT_ADDRESS;
const provider = new ethers.BrowserProvider(window.ethereum);
const doubleHashTaskAbi = await fetch('./data/abi/doubleHashTaskAbi.json');
const doubleHashTaskJson = await doubleHashTaskAbi.json();
const doubleHashTaskContract = new ethers.Contract(
    doubleHashTaskContractAddress,
    doubleHashTaskJson.abi,
    provider
);

// Gets the task index from the URL
const url = new URL(window.location.href);
const params = Object.fromEntries(url.searchParams.entries());
const doubleHashTaskIndex = Number(params.index);
doubleHashTaskId.textContent = `dh-${doubleHashTaskIndex}`;

// Automatically load user
try {
    await provider.send("eth_requestAccounts", []);
} catch {
    errorText.textContent = "[X] ERROR: No wallet found";
}

// Gets the user address, and update it if account changed
if (window.ethereum && window.ethereum.selectedAddress) {
    window.ethereum.on('accountsChanged', () => {
        workerAddressValue = window.ethereum.selectedAddress;
    });
    workerAddressValue = window.ethereum.selectedAddress;
}

// Gets the task preimage hash and updates the UI
doubleHashTaskContract.getDoubleHashTaskHash(doubleHashTaskIndex).then((h) => {
    expectedHashValue = h;
    expectedHash.textContent = expectedHashValue;
    updateIfLoaded();
});

// Gets the task second response window and updates the UI
doubleHashTaskContract
    .getDoubleHashTaskDelay(doubleHashTaskIndex).then((d) => {
        delayValue = d;
        delay.textContent = delayValue;
        updateIfLoaded();
    });

// Gets whether the task is already complete and updates the UI
doubleHashTaskContract.getDoubleHashTaskComplete(doubleHashTaskIndex).then((c) => {
    taskCompleteValue = c;
    taskComplete.textContent = taskCompleteValue.toString().toUpperCase();
    updateIfLoaded();
});

// Gets the task deadline and updates the UI
doubleHashTaskContract.getDoubleHashTaskDeadline(doubleHashTaskIndex).then((d) => {
    deadlineValue = new Date(Number(d) * 1000);
    deadline.textContent = deadlineValue.toUTCString();
    updateIfLoaded();
});

// Gets the task reward and updates the UI
doubleHashTaskContract.getDoubleHashTaskTotalWei(doubleHashTaskIndex).then((r) => {
    rewardValue = r;
    reward.textContent = formatWei(rewardValue);
    updateIfLoaded();
});

// Gets the task responses data and updates the UI
doubleHashTaskContract
    .getDoubleHashTaskResponseCount(doubleHashTaskIndex).then(async (r) => {

        // Update the retrieved submission response count
        responseCountValue = Number(r);
        responseCount.textContent = responseCountValue;

        // Get the worker address and response window timing of each double hash
        // task response
        let responses = [];
        for (let i = 0; i < responseCountValue; i++) {
            const workerAddress = await doubleHashTaskContract
                .getDoubleHashTaskResponseWorkerAddress(doubleHashTaskIndex, i);
            const responseWindowStart = Number(await doubleHashTaskContract
                .getDoubleHashTaskResponseWindowStart(doubleHashTaskIndex, i));

            // Gets the task second response window, then calculates the window
            // start and end times, and updates the UI
            doubleHashTaskContract
                .getDoubleHashTaskSecondResponseWindow(doubleHashTaskIndex)
                .then((s) => {
                    secondResponseWindowValue = Number(s);
                    secondResponseWindow.textContent = secondResponseWindowValue;
                    responses.push({
                        workerAddress: workerAddress,
                        responseWindowStart: new Date(
                            responseWindowStart * 1000
                        ),
                        responseWindowEnd: new Date(
                            (
                                responseWindowStart + secondResponseWindowValue
                            ) * 1000
                        )
                    });
                    updateIfLoaded();
                });
        }

        // Update the task responses array with all response data and update the
        // UI
        taskResponses = responses;
        updateIfLoaded();
    });

// Update the hashing calculations and UI when the hash key input changes
hashKeyInput.addEventListener("input", () => {
    updateWorkerHash();
});

// Update the hashing calculations and UI when the hash key input changes
firstHashInput.addEventListener("input", () => {
    updateWorkerHash();
});

// Redirect the user to this double hash task submissions
viewSubmissionsButton.addEventListener("click", () => {
    window.location.href = `pages/doubleHashTask/viewDoubleHashTaskSubmissions`
        + `.html?index=${doubleHashTaskIndex}`;
});

// Submit the first hash double hash task transaction, and refresh the page on
// success
submitFirstButton.addEventListener("click", submitFirstHash);

// Submit the second hash double hash task transaction, and refresh the page on
// success
submitSecondButton.addEventListener("click", confirmDoubleHashTask);

// Displays a counting timer that updates every second
currentTime.textContent = new Date().toUTCString();
setInterval(() => {
    currentTime.textContent = new Date().toUTCString();
}, 1_000);

/**
 * Validate the first hash value, get the user signer for the double hash task
 * contract, submit the transaction, then refresh the page
 */
async function submitFirstHash() {

    // Only submit the task if the transaction will succeed
    if (!validSubmitFirst) {
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
    let doubleHashTaskSigner = new ethers.Contract(
        doubleHashTaskContractAddress,
        doubleHashTaskJson.abi,
        signer
    );

    // Submit the transaction and display message on error
    let transactionResponse;
    try {
        transactionResponse = await doubleHashTaskSigner.submitDoubleHashTask(
            doubleHashTaskIndex,
            firstHashValue
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
 * Validate the hash key value, get the user signer for the double hash task
 * contract, submit the confirm transaction, then refresh the page
 */
async function confirmDoubleHashTask() {

    // Only submit the task if the transaction will succeed
    if (!validSubmitSecond) {
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
    let doubleHashTaskSigner = new ethers.Contract(
        doubleHashTaskContractAddress,
        doubleHashTaskJson.abi,
        signer
    );

    // Submit the transaction and display message on error
    let transactionResponse;
    try {
        transactionResponse = await doubleHashTaskSigner.confirmDoubleHashTask(
            doubleHashTaskIndex,
            responseIndex,
            hashKeyValue
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
 * Update the first submit button visuals based on whether the user input
 * is valid
 */
function updateSubmitFirstButton() {
    if (validSubmitFirst) {
        replaceClass(
            submitFirstButton,
            "inactive-payable-button",
            "payable-button"
        );
    } else {
        replaceClass(
            submitFirstButton,
            "payable-button",
            "inactive-payable-button"
        );
    }
}

/**
 * Update the second submit button visuals based on whether the user input
 * is valid
 */
function updateSubmitSecondButton() {
    if (validSubmitSecond) {
        replaceClass(
            submitSecondButton,
            "inactive-payable-button",
            "payable-button"
        );
    } else {
        replaceClass(
            submitSecondButton,
            "payable-button",
            "inactive-payable-button"
        );
    }
}

/**
 * Update the UI if all the hash task data has loaded
 */
function updateIfLoaded() {
    if (expectedHashValue !== undefined
        && taskCompleteValue !== undefined
        && secondResponseWindowValue !== undefined
        && delayValue !== undefined
        && deadlineValue !== undefined
        && rewardValue !== undefined
        && responseCountValue !== undefined
        && taskResponses !== undefined
    ) {
        updateWorkerHash();
    }
}

/**
 * Update the derived data from the hash key user input, and display a warning
 * message if the input is not valid for the hash task submission
 */
function updateWorkerHash() {
    updateValidFirstHashSubmission();
    updateValidHashKeyConfirmation();
}

/**
 * Updates the first hash submission status based on the user input
 */
function updateValidFirstHashSubmission() {

    // Initialize as invalid first hash submission
    validSubmitFirst = false;
    updateSubmitFirstButton();

    // Format the hash key from the user input
    hashKeyValue = prefixHexBytes(hashKeyInput.value);
    if (hashKeyValue !== null && hashKeyValue.length === 66) {
        firstHashValue = keccak256(hashKeyValue);
        firstHashInput.value = firstHashValue;
    } else {
        firstHashValue = prefixHexBytes(firstHashInput.value);
    }

    // Validate the user input hash key, and update error message if invalid
    if (firstHashValue === null || firstHashValue.length !== 66) {
        secondHash.textContent = "-";
        firstErrorText.textContent
            = "(!) Enter a 256 byte hex string first hash input";
        return;
    }
    secondHashValue = keccak256(prefixHexBytes(firstHashValue));
    secondHash.textContent = secondHashValue;

    // Validate the hash key, the task is not already complete, the deadline has
    // not already passed, and display warning message if a first hash has
    // already been submitted by some user
    if (secondHashValue !== expectedHashValue) {
        firstErrorText.textContent
            = "(!) First hash result does not match expected hash value";
        return;
    }
    if (taskCompleteValue) {
        firstErrorText.textContent
            = "(!) Task has already been complete";
        return;
    }
    if (deadlineValue < new Date().toUTCString()) {
        firstErrorText.textContent
            = "(!) Task deadline has already passed";
        return;
    }
    if (responseCountValue > 0) {
        firstErrorText.textContent = "(!) Task already has at least 1 response, "
            + "this indicates it has already been solved, submit hash key "
            + "during submission window to complete task";
    }

    // Hide error unless warning message is already showing
    if (responseCountValue === 0) {
        firstErrorText.textContent = "";
    }

    // The first hash is valid and ready for submission
    validSubmitFirst = true;
    updateSubmitFirstButton();
}

/**
 * Updates the second hash submission status based on the user input
 */
function updateValidHashKeyConfirmation() {

    // Initialize submit button to invalid
    validSubmitSecond = false;
    updateSubmitSecondButton();

    // Display error message if essential data from the blockchain fails to load
    if (taskResponses === undefined) {
        errorText.textContent = "[X] ERROR: Task responses not retrieved";
        secondErrorText.textContent = "[X] ERROR: Task responses not retrieved, "
            + "response index and response window times are necessary to submit"
            + " hash key";
        validSubmitSecond = false;
        return;
    }
    if (workerAddressValue === undefined) {
        errorText.textContent = "[X] ERROR: User address not found";
        secondErrorText.textContent = "[X] ERROR: User address not found, user "
            + "address necessary for response index to submit hash key";
        validSubmitSecond = false;
        return;
    }

    // Gets the current user submission timespan window, or the future timespan
    // window if it is not currently available for second hash submission
    let responseWindowStart;
    let responseWindowEnd;
    for (let i = 0; i < taskResponses.length; i++) {
        if (workerAddressValue.toUpperCase()
            === taskResponses[i].workerAddress.toUpperCase()
        ) {

            // Overwrite with proirity time window that contains the current
            // time
            if (taskResponses[i].responseWindowStart <= new Date()
                && new Date() < taskResponses[i].responseWindowEnd
            ) {
                responseWindowStart = taskResponses[i].responseWindowStart;
                responseWindowEnd = taskResponses[i].responseWindowEnd;
                responseIndex = i;
            } else if (
                new Date() < taskResponses[i].responseWindowStart
                && responseWindowStart === undefined
                && responseWindowEnd === undefined
            ) {
                responseWindowStart = taskResponses[i].responseWindowStart;
                responseWindowEnd = taskResponses[i].responseWindowEnd;
                responseIndex = i;
            }
        }
    }

    // If the user has a current or upcoming submission window, then update the
    // UI with the submission timespan, otherwise alert the user to submit the
    // first hash beforehand
    if (responseWindowStart !== undefined && responseWindowEnd !== undefined) {
        submitWindowStartValue = responseWindowStart;
        submitWindowEndValue = responseWindowEnd;
        submitWindowStart.textContent = submitWindowStartValue.toUTCString();
        submitWindowEnd.textContent = submitWindowEndValue.toUTCString();
    } else {
        secondErrorText.textContent = "(!) Submit first hash result before "
            + "confirming with the hask key input";
        validSubmitSecond = false;
        return;
    }

    // The pre-pre-image of the hash value, this is the key which when submitted
    // and revealed solves the double hash task
    hashKeyValue = prefixHexBytes(hashKeyInput.value);

    // Validate the second hash key and the task is not already complete
    if (hashKeyValue === null || hashKeyValue.length !== 66) {
        secondErrorText.textContent = "(!) Enter a 256 byte hex string hash key "
            + "input";
        return;
    }
    if (keccak256(keccak256(hashKeyValue)) !== expectedHashValue) {
        secondErrorText.textContent = "(!) Hash key input second hash does not "
            + "match expected";
        return;
    }
    if (taskCompleteValue) {
        secondErrorText.textContent = "(!) Task has already been complete";
        return;
    }

    // The second hash is valid and ready for sonfirmation submission
    validSubmitSecond = true;
    secondErrorText.textContent = "";
    errorText.textContent = "";
    updateSubmitSecondButton();
}
