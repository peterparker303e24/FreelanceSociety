import { ethers, keccak256 } from "../libs/ethers.min.js";
import "../libs/jszip.min.js";
import {
    replaceClass,
    formatWei,
    formatBlockTimestamp,
    removeClass,
    prefixHexBytes,
    urlNoTrailingSlash
} from "../../utils/commonFunctions.js";
import {
    USERS_CONTRACT_ADDRESS,
    VALIDATOR_TASK_CONTRACT_ADDRESS
} from "../../utils/constants.js";

// Page elements
const taskId = document.getElementById("task-id");
const reward = document.getElementById("reward");
const validatorComission = document.getElementById("validator-comission");
const completed = document.getElementById("completed");
const taskDefaulted = document.getElementById("task-defaulted");
const deadline = document.getElementById("deadline");
const nextSlotTime = document.getElementById("next-slot-time");
const submissionsCount = document.getElementById("submissions-count");
const evaluatedSubmissionsCount
    = document.getElementById("evaluated-submissions-count");
const viewSubmissionsButton
    = document.getElementById("view-submissions-button");
const uploadLocallyButton = document.getElementById("upload-file-button");
const editZipHashButton = document.getElementById("edit-zip-hash-button");
const zipHashText = document.getElementById("zip-hash-text");
const zipHashInput = document.getElementById("zip-hash-input");
const zipHashError = document.getElementById("zip-hash-error");
const zipInput = document.getElementById("file-input");
const uploadErrorText = document.getElementById("file-error");
const submissionHostSection
    = document.querySelector('.submission-host-section');
const ethicsRequirementsCheckbox = document.getElementById("checkbox");
const addTaskSubmissionButton
    = document.getElementById("add-task-submission-button");
const addTaskError
    = document.getElementById("add-task-error");

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
    window.location.href = "./pages/viewTasks.html?search=v";
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
let userLinks;
let useZipHashInput = false;
const validatorTaskIndexValue = Number(validatorTaskIndex);

// Updates the text of the task ID
taskId.textContent = `Task ID: v-${validatorTaskIndex}`;

// Load the user
loadUser();

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
        completed.textContent
            = `Task Completed: ${isTaskComplete ? "TRUE" : "FALSE"}`;

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
    window.location.href = `./pages/validatorTask/viewValidatorTaskSubmissions`
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

    // Add task submission to blockchain, display any transaction error
    let transactionResponse;
    try {
        transactionResponse = await validatorTaskSigner.submitTask(
            validatorTaskIndex,
            prefixHexBytes(taskSubmissionHashValue),
            { value: validatorComissionValue }
        );
    } catch (error) {
        addTaskError.textContent = `[X] ERROR: Transaction failed - ${error}`;
        return;
    }

    // Reload the page after transaction
    transactionResponse.wait().then(async () => {
        window.location.href = `./pages/validatorTask/`
            + `viewValidatorTaskSubmissions.html?index=${validatorTaskIndex}`;
    });
});

// Prompts user for upload of task zip, and displays task if valid
zipInput.addEventListener("change", zipInputClicked);

// Update the task submission hash value to the user input override
zipHashInput.addEventListener("input", () => {
    taskSubmissionHashValue = zipHashInput.value;
    fileCrossChecked = false;
    zipHashError.textContent = "";
    if (!(prefixHexBytes(taskSubmissionHashValue)?.length === 66)) {
        zipHashError.textContent
            = "[X] ERROR: Invalid ZIP hash hex - Must be 32 byte hex";
    }
    updateDataHostSection();
});

// When edit button clicked change links button from readonly to write
editZipHashButton.addEventListener("click", () => {
    useZipHashInput = true;
    removeClass(zipHashInput, "hide");
    zipHashText.textContent = "Submission.zip Hash:";
    zipHashInput.value = prefixHexBytes(taskSubmissionHashValue) ?? "";
    updateDataHostSection();
});

// Reusable file hosting component to retrieve and validate user submission data
submissionHostSection
    .setFilePath("Submissions/ValidatorSubmissions")
    .setFileName("Submission.zip")
    .setProvider(provider)
    .subscribeToDataFound((data) => {
        taskSubmissionHashValue = data.hash;
        fileCrossChecked = true;
        updateCanAddTaskButton();
    })
    .init();

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
        zipHashError.textContent = "";
        const arrayBuffer = event.target.result;
        const fileBytes = new Uint8Array(arrayBuffer);

        // Validate task hash matches expected
        const fileHash = keccak256(fileBytes).toString('hex');
        taskSubmissionHashValue = prefixHexBytes(fileHash).substring(2);
        if (!useZipHashInput) {
            zipHashText.textContent = `Submission.zip Hash: `
                + `${prefixHexBytes(taskSubmissionHashValue)}`;
        }
        zipHashInput.value = prefixHexBytes(taskSubmissionHashValue);
        updateDataHostSection();
    };

    // Display error if problem reading zip file
    reader.onerror = function () {
        uploadErrorText.textContent = "[X] ERROR: Problem reading .zip file";
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
        updateDataHostSection();
    } else {

        // Load user links data into page
        usersContract.links(userAddress).then((links) => {
            const linksElements = links.split(",");
            userLinks = [];
            for (let link of linksElements) {
                let validUrl;
                try {
                    new URL(link);
                    validUrl = true;
                } catch {
                    validUrl = false;
                }
                if (validUrl) {
                    userLinks.push(urlNoTrailingSlash(link));
                }
            }
            updateDataHostSection();
        });
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
            += "[X] ERROR: Submission.zip file not correctly hosted\n";
    }
    if (isBeforeDeadline !== undefined && !isBeforeDeadline) {
        addTaskError.textContent
            += "[X] ERROR: Deadline has passed\n";
        return;
    }
    if (isTaskComplete !== undefined && isTaskComplete) {
        addTaskError.textContent
            += "[X] ERROR: Task already complete\n";
        return;
    }
    if (taskDefaultedValue !== undefined && taskDefaultedValue) {
        addTaskError.textContent
            += "[X] ERROR: Task already complete by default\n";
        return;
    }
    if (!isEthicsRequirementsChecked) {
        addTaskError.textContent
            += "[X] ERROR: Ethics requirements not checked\n";
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

/**
 * If the task submission hash value is valid then the submission host section
 * is updated, and the add submission button is updated
 */
function updateDataHostSection() {
    fileCrossChecked = false;
    if (taskSubmissionHashValue !== undefined
        && prefixHexBytes(taskSubmissionHashValue)?.length === 66
    ) {
        submissionHostSection.setFileHash(taskSubmissionHashValue);
    }
    updateCanAddTaskButton();
}