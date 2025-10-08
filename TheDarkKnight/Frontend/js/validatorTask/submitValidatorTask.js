import { ethers, keccak256 } from "../libs/ethers.min.js";
import * as JSZip from "../libs/jszip.min.js";
import {
    loadHeader,
    replaceClass,
    formatWei,
    formatBlockTimestamp,
    removeClass
} from "../../utils/commonFunctions.js";
import { USERS_CONTRACT_ADDRESS, VALIDATOR_TASK_CONTRACT_ADDRESS } from "../../utils/constants.js";

// Page elements
const taskId = document.getElementById("task-id");
const reward = document.getElementById("reward");
const deadline = document.getElementById("deadline");
const completed = document.getElementById("completed");
const taskDefaulted = document.getElementById("task-defaulted");
const submissionsCount = document.getElementById("submissions-count");
const evaluatedSubmissionsCount
    = document.getElementById("evaluated-submissions-count");
const nextSlotTime = document.getElementById("next-slot-time");
const validatorComission = document.getElementById("validator-comission");
const viewSubmissionsButton
    = document.getElementById("view-submissions-button");
const uploadLocallyButton = document.getElementById("upload-file-button");
const zipInput = document.getElementById("file-input");
const uploadErrorText = document.getElementById("file-error");
const uploadFileName = document.getElementById("file-name");
const submissionHashRow = document.getElementById("submission-hash-row");
const submissionHashInput = document.getElementById("submission-hash-input");
const addTaskSubmissionButton
    = document.getElementById("add-task-submission-button");
const addTaskError
    = document.getElementById("add-task-error");
const ethicsRequirementsCheckbox = document.getElementById("checkbox");

// Load the header button navigation functionality
loadHeader();

// Users, hash task, and The List contract addresses on the blockchain
const usersContractAddress = USERS_CONTRACT_ADDRESS;
const validatorTaskContractAddress = VALIDATOR_TASK_CONTRACT_ADDRESS;

// Gets provider's access to contracts
const usersAbi = await fetch('./data/abi/usersAbi.json');
const validatorTaskAbi = await fetch('./data/abi/validatorTaskAbi.json');
const usersJson = await usersAbi.json();
const validatorTaskJson = await validatorTaskAbi.json();
const provider = new ethers.BrowserProvider(window.ethereum);
const usersContract = new ethers.Contract(
    usersContractAddress,
    usersJson.abi,
    provider
);
const validatorTaskContract = new ethers.Contract(
    validatorTaskContractAddress,
    validatorTaskJson.abi,
    provider
);

// Gets the URL parameters
const url = new URL(window.location.href);
const params = Object.fromEntries(url.searchParams.entries());

// Set the task ID from the URL parameter, otherwise redirect to validator task
// search if url task id param invalid
const validatorTaskIndex = Number(params.index);
if (validatorTaskIndex !== NaN && validatorTaskIndex >= 0) {
    taskId.textContent = `v-${validatorTaskIndex}`;
} else {
    window.location.href = "pages/viewTasks.html?search=v";
}

// Page interaction variables
let isBeforeDeadline;
let isTaskComplete;
let taskDefaultedValue;
let signer;
let validatorTaskSigner;
let nextSlotTimeValue;
let userAddress;
let taskSubmissionHashValue;
let submissionsCountValue;
let evaluatedSubmissionsCountValue;
let validatorComissionValue;
let overrideAdd = false;
let isEthicsRequirementsChecked = false;
let fileCrossChecked = false;
let canAddSubmission = false;
const emptyAddress
    = "0x0000000000000000000000000000000000000000";
const validatorTaskIndexValue = Number(validatorTaskIndex);

// Updates the text of the task ID
taskId.textContent = `Task ID: v-${validatorTaskIndex}`;

// Update validator task variables with data retrieved from the blockchain
validatorTaskContract
    .getContributionTotalWei(validatorTaskIndexValue)
    .then(w => {
        reward.textContent
            = `Reward (Wei): ${formatWei(w)}`;
    });
validatorTaskContract
    .getDeadline(validatorTaskIndexValue)
    .then(d => {
        deadline.textContent
            = `Deadline (UTC): ${new Date(Number(d) * 1000).toUTCString()}`;
        isBeforeDeadline = Math.floor(Date.now() / 1000) <= Number(d);
    });
validatorTaskContract
    .getTaskComplete(validatorTaskIndexValue)
    .then(c => {
        isTaskComplete = c;
        completed.textContent = `Completed: ${isTaskComplete ? "TRUE" : "FALSE"}`;

        // Update whether the user can add the task submission based on
        // dependent variables
        updateCanAddTaskButton();
    });
validatorTaskContract
    .taskDefaulted(validatorTaskIndexValue)
    .then(d => {
        taskDefaultedValue = d;
        taskDefaulted.textContent
            = `Task Defaulted: ${taskDefaultedValue ? "TRUE" : "FALSE"}`;

        // Update whether the user can add the task submission based on
        // dependent variables
        updateCanAddTaskButton();
    });
validatorTaskContract
    .getSubmissionsCount(validatorTaskIndexValue)
    .then(s => {
        submissionsCountValue = Number(s);
        submissionsCount.textContent
            = `Submissions Count: ${submissionsCountValue}`;
    });
validatorTaskContract
    .getEvaluatedSubmissionsCount(validatorTaskIndexValue)
    .then(e => {
        evaluatedSubmissionsCountValue = Number(e);
        evaluatedSubmissionsCount.textContent
            = `Evaluated Submissions Count: ${evaluatedSubmissionsCountValue}`;

        // Update whether the user can add the task submission based on
        // dependent variables
        updateCanAddTaskButton();
    });
validatorTaskContract
    .getNextSlotTime(validatorTaskIndexValue)
    .then(n => {
        nextSlotTimeValue = Number(n);
        if (nextSlotTimeValue === 0
            || new Date(nextSlotTimeValue * 1000) < new Date()
        ) {
            nextSlotTime.textContent = `Next Slot Time (UTC): Now - `
                + `${new Date().toUTCString()}`;
        } else {
            nextSlotTime.textContent = `Next Slot Time (UTC): `
                + `${formatBlockTimestamp(nextSlotTimeValue)}`;
        }

        // Update whether the user can add the task submission based on
        // dependent variables
        updateCanAddTaskButton();
    });
validatorTaskContract
    .getValidatorComission(validatorTaskIndexValue)
    .then(c => {
        validatorComissionValue = c;
        validatorComission.textContent = `Validator Comission (Wei): `
            + `${formatWei(validatorComissionValue)}`;
    });

// Displays zip input custom button, then clicks hidden zip input button
ethicsRequirementsCheckbox.addEventListener("click", () => {
    isEthicsRequirementsChecked = !isEthicsRequirementsChecked;
    if (isEthicsRequirementsChecked) {
        ethicsRequirementsCheckbox.textContent = "✓";
    } else {
        ethicsRequirementsCheckbox.textContent = "";
    }
    updateCanAddTaskButton();
});

// Displays zip input custom button, then clicks hidden zip input button
viewSubmissionsButton.addEventListener("click", () => {
    window.location.href = `pages/validatorTask/viewValidatorTaskSubmissions`
        + `.html?index=${validatorTaskIndex}`;
});

// Displays zip input custom button, then clicks hidden zip input button
uploadLocallyButton.addEventListener("click", () => {
    zipInput.click();
});

// Add the task submission if all validation checks pass
addTaskSubmissionButton.addEventListener("click", async () => {

    // If the user cannot add the submission, or have not activated the
    // override, then ignore the click input
    if (!canAddSubmission && !overrideAdd && !isEthicsRequirementsChecked) {
        return;
    }

    // Load the user signer if not already loaded
    if (validatorTaskSigner === undefined) {
        await loadUser();
    }
    console.log("A");

    // Add task submission to blockchain, display any transaction error
    let transactionResponse;
    try {
        console.log("B");
        console.log(validatorTaskIndex);
        console.log(taskSubmissionHashValue);
        console.log(validatorComissionValue);
        transactionResponse = await validatorTaskSigner.submitTask(
            validatorTaskIndex,
            taskSubmissionHashValue,
            { value: validatorComissionValue }
        );
        console.log("C");
    } catch (error) {
        addTaskError.textContent = `[X] ERROR: Transaction failed - ${error}`;
        return;
    }
    console.log("D");

    // Reload the page after transaction
    transactionResponse.wait().then(async () => {
        window.location.reload();
    });
});

// Prompts user for upload of task zip, and displays task if valid
zipInput.addEventListener("change", zipInputClicked);

// Update the task submission hash value to the user input override
submissionHashInput.addEventListener("change", () => {
    taskSubmissionHashValue = submissionHashInput.value;
});

// Allow the user to override the 
document.addEventListener("keydown", (event) => {
    if (event.shiftKey && isEthicsRequirementsChecked) {
        overrideAdd = true;
        removeClass(submissionHashRow, "hide");
        taskSubmissionHashValue = submissionHashInput.value;
        replaceClass(
            addTaskSubmissionButton,
            "inactive-payable-button",
            "payable-button"
        );
    }
});

/**
 * Gets the ZIP file upload data and hash, then validates it matches the data
 * hosted by the user
 * @param {Event} event ZIP input button click event
 */
async function zipInputClicked(event) {

    // Reset error text
    uploadErrorText.textContent = "";

    // Validate the input is a .zip
    const inputFile = event.target.files[0];
    if (inputFile.type !== 'application/zip') {
        uploadErrorText.textContent = "[X] ERROR: File uploaded is not a zip "
            + "file";
        return;
    }

    // Read the zip file data
    const reader = new FileReader();
    reader.readAsArrayBuffer(inputFile);

    // On loading the zip data
    reader.onload = async function (event) {
        const arrayBuffer = event.target.result;
        const fileBytes = new Uint8Array(arrayBuffer);

        // Validate task hash matches expected
        const fileHash = keccak256(fileBytes).toString('hex');

        // Validate the file hash with the data matches the data hosted by the
        // user at at least one of their links
        await tryMatchFile(fileHash);
    };

    // Display error if problem reading zip file
    reader.onerror = function () {
        uploadErrorText.textContent = "[X] ERROR: Problem reading .zip file";
    };
}

/**
 * Validates the user hosts the file data at at least one of their links, then
 * enables the user to add the task submission
 * @param {String} zipHash Keccak256 hash of the ZIP file upload data
 */
async function tryMatchFile(zipHash) {

    // Load user links
    await loadUser();
    const usersLinks = await usersContract.links(userAddress);
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
        uploadErrorText.textContent = "[X] ERROR: No link found for current user";
        return;
    }

    // Search for data through all user URL links
    let dataEndpoints = [];
    for (let i = 0; i < downloadUrls.length; i++) {

        // Expected Submission.zip data endpoint
        dataEndpoints.push(
            `${downloadUrls[i]}/Submissions/ValidatorSubmissions/`
            + `${zipHash.substring(2)}/Submission.zip`
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

        // Validate the task file hosting and format, then enable the user to
        // add the task submission
        if (downloadHash === zipHash) {
            taskSubmissionHashValue = zipHash;
            fileCrossChecked = true;
            uploadFileName.textContent = `Name: Submission.zip\nHash: ${zipHash}`;
            updateCanAddTaskButton();
            return;
        }
    }
}

/**
 * Loads the user and validates the user has an active account
 */
async function loadUser() {

    // Load user wallet
    try {
        await provider.send("eth_requestAccounts", []);
    } catch {
        uploadErrorText.textContent = "[X] ERROR: no wallet found";
        return;
    }

    // Get user signer for blockchain transactions
    signer = await provider.getSigner();
    userAddress = signer.address;
    validatorTaskSigner = new ethers.Contract(
        validatorTaskContractAddress,
        validatorTaskJson.abi,
        signer
    );

    // Validate the user is activated
    const userActivated = await usersContract.activeUsers(userAddress);
    if (!userActivated) {
        uploadErrorText.textContent = "[X] ERROR: User inactivated";
        return;
    }
}

/**
 * Updates whether the user can add the task submission functionality and
 * visuals, and indicates any errors or warnings
 */
function updateCanAddTaskButton() {

    // Initialize error text to empty and add button to disabled 
    addTaskError.textContent = "";
    replaceClass(
        addTaskSubmissionButton,
        "payable-button",
        "inactive-payable-button"
    );

    // Check for each task submission hard validation, and display any
    // corresponding error message
    if (!fileCrossChecked) {
        addTaskError.textContent
            = "[X] ERROR: Task.zip file not correctly hosted";
        return;
    }
    if (isBeforeDeadline !== undefined && !isBeforeDeadline) {
        addTaskError.textContent
            = "[X] ERROR: Deadline has passed";
        return;
    }
    if (isTaskComplete !== undefined && isTaskComplete) {
        addTaskError.textContent
            = "[X] ERROR: Task already complete";
        return;
    }
    if (taskDefaultedValue !== undefined && taskDefaultedValue) {
        addTaskError.textContent
            = "[X] ERROR: Task already complete by default";
        return;
    }
    if (!isEthicsRequirementsChecked) {
        addTaskError.textContent = "[X] ERROR: Ethics requirements not checked";
        return;
    }

    // Enable the add task submission functionality and visuals
    canAddSubmission = true;
    replaceClass(
        addTaskSubmissionButton,
        "inactive-payable-button",
        "payable-button"
    );

    // Display a warning message to the user that task submissions waiting
    // evaluation have already been submitted
    if (evaluatedSubmissionsCountValue !== undefined
        && submissionsCountValue !== undefined
        && evaluatedSubmissionsCountValue < submissionsCountValue
    ) {
        addTaskError.textContent
            = "(!) Task submissions already exist waiting evaluation";
    }
}
