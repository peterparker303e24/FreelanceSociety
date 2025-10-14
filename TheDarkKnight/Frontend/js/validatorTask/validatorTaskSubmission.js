import { ethers, keccak256 } from "../libs/ethers.min.js";
import "../libs/jszip.min.js";
import {
    loadHeader,
    prefixHexBytes,
    removeClass,
    addClass,
    replaceClass,
    formatFileStructure,
    formatTaskJson,
    continueSearch,
    formatWei,
    getRequirementVersionData,
    getValidatorSubmissionStatus,
    parseUserData
} from "../../utils/commonFunctions.js";
import {
    THE_LIST_CONTRACT_ADDRESS,
    USERS_CONTRACT_ADDRESS,
    VALIDATOR_TASK_CONTRACT_ADDRESS,
    THE_LIST_CONTRACT_MINIMUM_BLOCK
} from "../../utils/constants.js";

// Page elements
const taskId = document.getElementById("task-id");
const submissionId = document.getElementById("submission-id");
const submissionHash = document.getElementById("submission-hash");
const workerAddress = document.getElementById("worker-address");
const reward = document.getElementById("task-reward");
const validationStartTime = document.getElementById("validation-start-time");
const currentTime = document.getElementById("current-time");
const validationEndTime = document.getElementById("validation-end-time");
const completed = document.getElementById("task-completed");
const taskDefaulted = document.getElementById("task-defaulted");
const submissionStatus = document.getElementById("submission-status");
const submissionsCount = document.getElementById("submissions-count");
const evaluatedSubmissionsCount
    = document.getElementById("evaluated-submissions-count");
const requirementsCount = document.getElementById("requirements-count");
const validatorComission = document.getElementById("validator-comission");
const validators = document.getElementById("validators");
const discoverSection = document.getElementById("discover-section");
const autoDiscoverButton = document.getElementById("auto-discover-button");
const autoDownloadError = document.getElementById("auto-download-error");
const autoDiscoverSection = document.getElementById("auto-section");
const manualDiscoverButton = document.getElementById("manual-discover-button");
const manualSection = document.getElementById("manual-section");
const userSearch = document.getElementById("user-search-box");
const manualSearchError = document.getElementById("manual-search-error");
const tryDownloadButton = document.getElementById("try-download-button");
const skipAddressButton = document.getElementById("skip-address-button");
const skipLinkButton = document.getElementById("skip-link-button");
const taskJsonArea = document.getElementById("task-json");
const saveLocallyButton = document.getElementById("save-locally-button");
const downloadTaskAnchor = document.getElementById("download-task-anchor");
const uploadLocallyButton = document.getElementById("upload-locally-button");
const uploadErrorText = document.getElementById("upload-locally-error");
const zipInput = document.getElementById("file-input");
const evaluationSection = document.getElementById("evaluation-section");
const withdrawlsRow = document.getElementById("withdrawls-row");
const viewTaskButton = document.getElementById("view-validator-task-button");
const viewTaskSubmissions
    = document.getElementById("view-task-submissions-button");
const viewValidatorTasksButton
    = document.getElementById("view-validator-tasks-button");
const addValidatorTaskButton
    = document.getElementById("add-validator-task-button");
const taskFileTreeArea
    = document.getElementById("task-file-tree");
const requirementTemplate = document.getElementById("requirement-template");
const requirementsContainer = document.getElementById("requirements-container");
const ethicsRequirementsCheck
    = document.getElementById("ethics-requirements-checkbox");
const submitEvaluationButton
    = document.getElementById("submit-submission-evaluation-button");
const submitEvaluationError
    = document.getElementById("submit-evaluation-error");
const downloadSubmissionButton
    = document.getElementById("download-from-worker-button");
const downloadSubmissionError
    = document.getElementById("download-from-worker-error");
const downloadSubmissionAnchor
    = document.getElementById("download-submission-anchor");
const withdrawSubmissionComplete
    = document.getElementById("withdraw-submission-completion-button");
const withdrawSubmissionUnevaluated
    = document.getElementById("withdraw-submission-unevaluated-button");
const withdrawSubmissionCompleteError
    = document.getElementById("withdraw-submission-completion-error");
const withdrawSubmissionUnevaluatedError
    = document.getElementById("withdraw-submission-unevaluated-error");
const submissionWithdrawn
    = document.getElementById("submission-withdrawn");

// Load the header button navigation functionality
loadHeader();

// Users, hash task, and The List contract addresses on the blockchain
const usersContractAddress = USERS_CONTRACT_ADDRESS;
const validatorTaskContractAddress = VALIDATOR_TASK_CONTRACT_ADDRESS;
const theListContractAddress = THE_LIST_CONTRACT_ADDRESS;

// Gets provider's access to contracts
const usersAbi = await fetch('./data/abi/usersAbi.json');
const validatorTaskAbi = await fetch('./data/abi/validatorTaskAbi.json');
const theListAbi = await fetch('./data/abi/theListAbi.json');
const usersJson = await usersAbi.json();
const validatorTaskJson = await validatorTaskAbi.json();
const theListJson = await theListAbi.json();
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
const theListContract = new ethers.Contract(
    theListContractAddress,
    theListJson.abi,
    provider
);

// Gets the URL parameters
const url = new URL(window.location.href);
const params = Object.fromEntries(url.searchParams.entries());

// Parses the submission ID from the url, and if it is invalid but has a valid
// task ID then redirects to that task's submissions, otherwise redirects to
// view validator tasks
let validSubmissionId = false;
let validTaskId = false;
let validatorTaskIndex;
let validatorSubmissionIndex;
if (typeof (params.id) === "string") {
    const urlId = params.id;
    const taskIdSplit = urlId.indexOf("-");
    if (taskIdSplit > 0) {
        const taskType = urlId.substring(0, taskIdSplit);
        if (taskType === "v" && urlId.length > taskIdSplit + 1) {
            const indicesIdSplit = urlId.substring(taskIdSplit + 1);
            const submissionIdSplit = indicesIdSplit.indexOf("-");
            if (submissionIdSplit > 0) {
                const taskIndexString = Number(
                    indicesIdSplit.substring(0, submissionIdSplit)
                );
                const submissionIndexString = Number(
                    indicesIdSplit.substring(submissionIdSplit + 1)
                );
                if (taskIndexString !== NaN
                    && taskIndexString >= 0
                ) {
                    validatorTaskIndex = taskIndexString;
                    validTaskId = true;
                    if (submissionIndexString !== NaN
                        && submissionIndexString >= 0
                    ) {
                        validatorSubmissionIndex = submissionIndexString;
                        validSubmissionId = true;
                    }
                }

            }
        }
    }
}
if (!validSubmissionId) {
    if (validTaskId) {
        window.location.href = `pages/validatorTask/`
            + `viewValidatorTaskSubmissions.html?id=v-${validatorTaskIndex}`;
    } else {
        window.location.href = "pages/viewTasks.html?search=v";
    }
}

// Page interaction variables
let localZipFile;
let outerFolderName;
let saveLocallyButtonUnlocked = false;
let autoSearchCriteria;
let autoUserLinks;
let autoUserData;
let autoUserAddress;
let autoUserLinksIndex;
let canSkipLink;
let canSkipAddress;
let isTaskComplete;
let taskDefaultedValue;
let signer;
let validatorTaskSigner;
let userAddress;
let validatorTaskHashValue;
let submissionsCountValue;
let evaluatedSubmissionsCountValue;
let requirementsCountValue;
let validatorComissionValue;
let validatorsValue;
let workerAddressValue;
let submissionHashValue;
let validationStartTimeValue;
let validationEndTimeValue;
let submissionStatusValue;
let showingWithdrawlsRow = false;
let showingEvaluationSection = false;
let ethicsRequirementsChecked = false;
let userInValidatorsIndex;
let requirementChecks;
let submissionWithdrawnValue;
let submissionCompletionIndex;
const emptyHash
    = "0x0000000000000000000000000000000000000000000000000000000000000000";
const emptyAddress
    = "0x0000000000000000000000000000000000000000";
const validatorTaskIndexValue = Number(validatorTaskIndex);
const submissionIndexValue = Number(validatorSubmissionIndex);

// Updates the text of the task ID
taskId.textContent = `Task ID: v-${validatorTaskIndex}`;

// Updates the text of the submission ID
submissionId.textContent
    = `Submission ID: v-${validatorTaskIndex}-${validatorSubmissionIndex}`;

// Update hash task and submission variables with data retrieved from the
// blockchain
validatorTaskContract
    .getTaskHash(validatorTaskIndexValue)
    .then(h => {
        validatorTaskHashValue = h;
        updateSections();
    });
validatorTaskContract
    .getContributionTotalWei(validatorTaskIndexValue)
    .then(w => {
        reward.textContent
            = `Reward (Wei): ${formatWei(w)}`;
        updateSections();
    });
validatorTaskContract
    .getTaskComplete(validatorTaskIndexValue)
    .then(c => {
        isTaskComplete = c;
        completed.textContent = `Completed: ${isTaskComplete ? "TRUE" : "FALSE"}`;

        // Update submission status if all dependent data collected
        updateSubmissionStatus();
        updateSections();
    });
validatorTaskContract
    .taskDefaulted(validatorTaskIndexValue)
    .then(d => {
        taskDefaultedValue = d;
        taskDefaulted.textContent
            = `Task Defaulted: ${taskDefaultedValue ? "TRUE" : "FALSE"}`;

        // Update submission status if all dependent data collected
        updateSubmissionStatus();
        updateSections();
    });
validatorTaskContract
    .getSubmissionsCount(validatorTaskIndexValue)
    .then(s => {
        submissionsCountValue = Number(s);
        submissionsCount.textContent
            = `Submissions Count: ${submissionsCountValue}`;
        updateSections();
    });
validatorTaskContract
    .getEvaluatedSubmissionsCount(validatorTaskIndexValue)
    .then(e => {
        evaluatedSubmissionsCountValue = Number(e);
        evaluatedSubmissionsCount.textContent
            = `Evaluated Submissions Count: ${evaluatedSubmissionsCountValue}`;
        updateSubmissionStatus();
        updateSections();
    });
validatorTaskContract
    .getRequirementsCount(validatorTaskIndexValue)
    .then(r => {
        requirementsCountValue = Number(r);
        requirementsCount.textContent
            = `Requirements Count: ${requirementsCountValue}`;
        updateSections();
    });
validatorTaskContract
    .getValidatorComission(validatorTaskIndexValue)
    .then(c => {
        validatorComissionValue = c;
        validatorComission.textContent = `Validator Comission (Wei): `
            + `${formatWei(validatorComissionValue)}`;
    });
validatorTaskContract
    .getValidators(validatorTaskIndexValue)
    .then(v => {
        validatorsValue = v;
        let validatorsListString = "";
        for (let i = 0; i < validatorsValue.length; i++) {
            validatorsListString += `${validatorsValue[i]}\r\n`;
        }
        validators.textContent = `Validators:\r\n${validatorsListString}`;
        updateSections();
    });
validatorTaskContract
    .getSubmissionWorkerAddress(
        validatorTaskIndexValue,
        submissionIndexValue
    ).then(w => {
        workerAddressValue = w;
        workerAddress.textContent = `Worker Address:\r\n${workerAddressValue}`;
        updateSections();
    });
validatorTaskContract
    .getSubmissionHash(
        validatorTaskIndexValue,
        submissionIndexValue
    ).then(s => {
        submissionHashValue = s;
        submissionHash.textContent = `Submission Hash:\r\n${submissionHashValue}`;
    });
validatorTaskContract
    .getSubmissionValidationStart(
        validatorTaskIndexValue,
        submissionIndexValue
    ).then(async (v) => {
        validationStartTimeValue = Number(v);
        validationStartTime.textContent = `Validation Start Time (UTC): `
            + `${new Date(
                Number(validationStartTimeValue) * 1000
            ).toUTCString()}`;

        // Update submission status if all dependent data collected
        updateSubmissionStatus();
        updateSections();
    });
validatorTaskContract
    .getSubmissionValidationEnd(
        validatorTaskIndexValue,
        submissionIndexValue
    ).then(v => {
        validationEndTimeValue = Number(v);
        validationEndTime.textContent = `Validation End Time (UTC): `
            + `${new Date(
                validationEndTimeValue * 1000
            ).toUTCString()}`;

        // Update submission status if all dependent data collected
        updateSubmissionStatus();
        updateSections();
    });
validatorTaskContract
    .getSubmissionWithdrawn(
        validatorTaskIndexValue,
        submissionIndexValue
    ).then(w => {
        submissionWithdrawnValue = w;
        submissionWithdrawn.textContent = `Submission Withdrawn: `
            + `${submissionWithdrawnValue ? "TRUE" : "FALSE"}`;
        updateSections();
    });
validatorTaskContract
    .getCompletionSubmissionIndex(
        validatorTaskIndexValue
    ).then(c => {
        submissionCompletionIndex = Number(c);
        updateSections();
    });

// Displays a counting timer that updates every second
currentTime.textContent = `Current Time (UTC): ${new Date().toUTCString()}`;
setInterval(() => {
    currentTime.textContent = `Current Time (UTC): ${new Date().toUTCString()}`;
}, 1_000);

// Withdraw task completion by either evaluation accepted or task defaulted,
// and makes the transaction to the blockchain then reloads
withdrawSubmissionComplete.addEventListener("click", async () => {
    if (!showingWithdrawlsRow) {
        return;
    }

    // If the user cannot withdraw this submission, then do not submit the
    // transaction to the blockchain
    if (!canWithdrawCompletion()) {
        return;
    }

    // Get the user signer for the validator contract
    getValidatorTaskSigner(withdrawSubmissionCompleteError);

    // Create the submission completion withdraw transaction
    let transactionResponse;
    try {
        transactionResponse = await validatorTaskSigner
            .withdrawSubmissionCompletion(
                validatorTaskIndexValue,
                submissionIndexValue
            );
    } catch (error) {
        withdrawSubmissionCompleteError.textContent
            = `[X] ERROR: Transaction failed - ${error}`;
        return;
    }

    // Refresh the page when the transaction goes through
    transactionResponse.wait().then(async () => {
        window.location.reload();
    });
});

// Withdraw task completion by either evaluation accepted or task defaulted,
// and makes the transaction to the blockchain then reloads
withdrawSubmissionUnevaluated.addEventListener("click", async () => {
    if (!showingWithdrawlsRow) {
        return;
    }

    // If the user cannot withdraw this submission, then do not submit the
    // transaction to the blockchain
    if (!canWithdrawUnevaluated()) {
        return;
    }

    // Get the user signer for the validator contract
    getValidatorTaskSigner(withdrawSubmissionUnevaluatedError);

    // Create the submission incomplete unevaluated withdraw transaction
    console.log(validatorTaskIndexValue);
    console.log(submissionIndexValue);
    let transactionResponse;
    try {
        transactionResponse = await validatorTaskSigner
            .withdrawSubmissionUnevaluated(
                validatorTaskIndexValue,
                submissionIndexValue
            );
    } catch (error) {
        withdrawSubmissionUnevaluatedError.textContent
            = `[X] ERROR: Transaction failed - ${error}`;
        return;
    }

    // Refresh the page when the transaction goes through
    transactionResponse.wait().then(async () => {
        window.location.reload();
    });
});

// Tries to download the worker submission zip file from any of the worker links
// and verifies the data with the expected hash, and if the data is not found
// in any of the worker links, then an error is displayed
downloadSubmissionButton.addEventListener("click", async () => {

    // Validate dependent variables have been retirieved
    if (submissionHashValue === undefined
        || workerAddressValue === undefined
    ) {
        return;
    }

    // Get the links array from the worker
    const workerLinksString = await usersContract.links(workerAddressValue);
    const workerLinks = workerLinksString.split(",");

    // Try to download the submission from each of the worker links
    for (let i = 0; i < workerLinks.length; i++) {

        // Try to retrieve the data from the current worker link
        let response;
        try {
            response = await fetch(
                `${workerLinks[i]}/Submissions/ValidatorSubmissions/`
                + `${submissionHashValue.substring(2)}/Submission.zip`
            );
        } catch {
            continue;
        }

        // Validate correct link response
        if (!response.ok) {
            continue;
        }

        // Validate submission data hash
        const arrayBuffer = await response.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const downloadHash = keccak256(uint8Array).toString('hex');
        if (downloadHash !== submissionHashValue) {
            continue;
        }

        // The data matches the expected, so convert the array buffer to a blob,
        // and download the blob to the submission zip file
        const blob = new Blob(
            [arrayBuffer],
            {
                type: response.headers.get('Content-Type')
                    || 'application/octet-stream'
            }
        );
        const url = URL.createObjectURL(blob);
        downloadSubmissionAnchor.href = url;
        downloadSubmissionAnchor.download
            = `Submission.zip`;
        downloadSubmissionAnchor.click();
        URL.revokeObjectURL(downloadSubmissionAnchor.href);

        // The data has been successfully retrieved and downloaded, so the
        // function terminates
        return;
    }

    // If all links fail to retrieve the data with the expected data hash, then
    // an error is displayed to the user
    downloadSubmissionError.textContent = `[X] ERROR: Download failed from `
        + `endpoint: "/Submissions/ValidatorSubmissions/`
        + `${submissionHashValue.substring(2)}/Submission.zip" for all worker `
        + `links: ${workerLinks}\r\n\r\nTry again in a moment`;
});

// Updates the ethics requirements checkbox and UI, and updates the submit
// evaluation text
ethicsRequirementsCheck.addEventListener("click", () => {
    ethicsRequirementsChecked = !ethicsRequirementsChecked;
    if (ethicsRequirementsChecked) {
        ethicsRequirementsCheck.textContent = "✓";
    } else {
        ethicsRequirementsCheck.textContent = "";
    }

    // Update the submit evaluation button accept/reject text
    updateEvaluationButtonText();
});

// Validate the user is able to submit the evaluation for the submission, then
// submit the evaluation to the blockchain
submitEvaluationButton.addEventListener("click", async () => {

    // Validate the user can submit an evaluation and update the UI
    const userCanSubmit = canSubmitEvaluation();
    if (!userCanSubmit) {
        return;
    }

    // Configure the boolean unmet requirements array based on the checked
    // requirements and ethics requirements check into an array of uint256
    // chunks
    let evaluationChecks = [ethicsRequirementsChecked, ...requirementChecks];

    // A binary 1 indicates an unmet requirement, so invert the evaluation check
    evaluationChecks = evaluationChecks.map(check => !check);

    // Get the extra bits for the array length to be a multiple of 256 and fill
    // in the extra bits with 0
    const extraBits = 255 - ((evaluationChecks.length - 1) % 256);
    const bufferFillArray = new Array(extraBits).fill(false);
    evaluationChecks = [...bufferFillArray, ...evaluationChecks];

    // Convert from an array of booleans to uint256 big int chunks where each
    // bit represents an unmet requirement (aside from any preceding buffer
    // bits)
    let uint256Array = []
    for (let i = 0; i < requirementsCountValue + 1; i += 256) {
        let uint256Item = 0n;
        for (let bit = 0; bit < 256; bit++) {
            if (evaluationChecks[i + bit]) {
                uint256Item |= 1n << BigInt(255 - bit);
            }
        }
        uint256Array.push(uint256Item);
    }

    // Get the user signer for the validator contract
    getValidatorTaskSigner(submitEvaluationError);

    // Create the evaluation transaction
    let transactionResponse;
    try {
        transactionResponse = await validatorTaskSigner
            .evaluateTask(
                validatorTaskIndexValue,
                submissionIndexValue,
                userInValidatorsIndex,
                uint256Array
            );
    } catch (error) {
        submitEvaluationError.textContent
            = `[X] ERROR: Transaction failed - ${error}`;
        return;
    }

    // Refresh the page when the transaction goes through
    transactionResponse.wait().then(async () => {
        window.location.reload();
    });
});

// Toggles to the manual search data view
manualDiscoverButton.addEventListener("click", () => {
    removeClass(manualSection, "hide");
    addClass(autoDiscoverSection, "hide");
});

// Toggles to the auto search data view
autoDiscoverButton.addEventListener("click", () => {

    // Task can only be discovered if the task hash is known
    if (validatorTaskHashValue === undefined) {
        return;
    }

    replaceClass(tryDownloadButton, "inactive-border-button", "border-button");
    removeClass(autoDiscoverSection, "hide");
    addClass(manualSection, "hide");

    // Automatically search for task data
    continueSearch(
        {},
        usersContract,
        skipLinkButton,
        skipAddressButton,
        tryDownloadButton,
        (userLinks) => `${userLinks[0]}/Tasks/ValidatorTasks/`
            + `${validatorTaskHashValue.substring(2)}/Task.zip`

    ).then((linkSearchData) => {
        autoUserAddress = linkSearchData.autoUserAddress;
        autoUserData = linkSearchData.autoUserData;
        autoUserLinks = linkSearchData.autoUserLinks;
        autoUserLinksIndex = linkSearchData.autoUserLinksIndex;
        canSkipAddress = linkSearchData.canSkipAddress;
        canSkipLink = linkSearchData.canSkipLink;
        autoSearchCriteria = linkSearchData.autoSearchCriteria;
    });
});

// Displays zip input custom button, then clicks hidden zip input button
uploadLocallyButton.addEventListener("click", () => {

    // Only upload if data has not yet been retrieved
    if (!saveLocallyButtonUnlocked) {
        zipInput.click();
    }
});

// Redirects to view proposal page using the task index of this page
viewTaskButton.addEventListener("click", () => {
    window.location.href = `pages/validatorTask/validatorTask.html?`
        + `id=v-${validatorTaskIndex}`;
});

// Redirects to view task submissions page using the task index of this page
viewTaskSubmissions.addEventListener("click", () => {
    window.location.href = `pages/validatorTask/viewValidatorTaskSubmissions`
        + `.html?index=${validatorTaskIndex}`;
});

// Redirects to view tasks page using the task index of this page
viewValidatorTasksButton.addEventListener("click", () => {
    window.location.href = `pages/viewTasks.html?search=v`;
});

// Redirects to the add task proposal page using the task index of
// this page
addValidatorTaskButton.addEventListener("click", () => {
    window.location.href = `pages/validatorTask/addValidatorTask.html?index=`
        + `${validatorTaskIndex}`;
});

// Prompts user for upload of task zip, and displays task if valid
zipInput.addEventListener("change", zipInputClicked);

// After any change in the user search textbox, the user is searched for and if
// the user exists, then the data is searched through their links
userSearch.addEventListener("input", searchUser);

// When the button is clicked, the data tries to download from the displayed
// user/website
tryDownloadButton.addEventListener("click", tryDownload);

// Continue to search for the task data through other users if any users
// are left
skipAddressButton.addEventListener("click", () => {
    if (canSkipAddress) {
        continueSearch(
            autoSearchCriteria,
            usersContract,
            skipLinkButton,
            skipAddressButton,
            tryDownloadButton,
            (userLinks) => `${userLinks[0]}/Tasks/ValidatorTasks/`
                + `${validatorTaskHashValue.substring(2)}/Task.zip`
        ).then((linkSearchData) => {
            autoUserAddress = linkSearchData.autoUserAddress;
            autoUserData = linkSearchData.autoUserData;
            autoUserLinks = linkSearchData.autoUserLinks;
            autoUserLinksIndex = linkSearchData.autoUserLinksIndex;
            canSkipAddress = linkSearchData.canSkipAddress;
            canSkipLink = linkSearchData.canSkipLink;
            autoSearchCriteria = linkSearchData.autoSearchCriteria;
        });
    }
});

// Continue to search for the task data through other user links if the
// user has any links left
skipLinkButton.addEventListener("click", skipLink);

/**
 * @typedef {Object} SearchCriteria Search data for getting users links and data
 * @property {Number} searchBlock Blockchain block index to search
 * @property {Number} eventIndex Event within block to search
 */

/**
 * Validates the zip input of the user matches the expected task hash, and
 * if so the specifications.json data tries to be extracted
 * @param {Event} event Zip input button click event
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
        if (fileHash != validatorTaskHashValue) {
            uploadErrorText.textContent = "[X] ERROR: Uploaded .zip file hash "
                + "does not match task hash";
        } else {

            // Parses data from zip file
            dataHashMatchFound(inputFile);
        }
    };

    // Display error if problem reading zip file
    reader.onerror = function () {
        uploadErrorText.textContent = "[X] ERROR: Problem reading .zip file";
    };
}

/**
 * Searches the user from the user address textbox for task data from
 * their links
 */
async function searchUser() {

    // Task can only be retrived if the task hash is known
    if (validatorTaskHashValue === undefined) {
        return;
    }

    // Formats the hex bytes
    const userSearchValue = prefixHexBytes(userSearch.value);

    // Validate user address
    if (userSearchValue === null || userSearchValue.length !== 42) {
        return;
    }

    // Get each link from the comma separated list of user
    const userLinks = await usersContract.links(userSearchValue);
    const userLinksArray = userLinks.split(",");

    // Search each link as URL to find data matching task hash
    for (let i = 0; i < userLinksArray.length; i++) {

        // Try to read the link as a URL and upon failure continue to next link
        let userUrl = null;
        try {
            userUrl = new URL(userLinksArray[i]);
        } catch (_) {
            continue;
        }

        // Retrieve data from link
        const response = await fetch(`${userUrl}/Tasks/ValidatorTasks/`
            + `${validatorTaskHashValue.substring(2)}/Task.zip`
        );
        if (!response.ok) {
            continue;
        }
        const arrayBuffer = await response.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        // Validate the data hash matches task hash
        const downloadHash = keccak256(uint8Array).toString('hex');
        if (downloadHash !== validatorTaskHashValue) {
            manualSearchError.textContent = `Incorrect data hash from,`
                + `\r\nUser: ${userSearchValue}`
                + `\r\nAt address: ${userUrl}/Tasks/ValidatorTasks/`
                + `${validatorTaskHashValue.substring(2)}/Task.zip`;
            continue;
        }

        // Data found so reset manual search error and parse file
        manualSearchError.textContent = "";
        dataHashMatchFound(arrayBuffer);
        return;
    }

    // Display error if data not found from user
    manualSearchError.textContent = `[X] ERROR: Task data not found from `
        + `user: ${userSearchValue}`;
}

/**
 * Tries to download task data from the current user link
 */
async function tryDownload() {

    // If the end of available users reached, no user can be searched
    if (!canSkipAddress && !canSkipLink) {
        return;
    }

    // Download data from current user link
    const userUrl = autoUserLinks[autoUserLinksIndex];
    const response = await fetch(
        `${userUrl}/Tasks/ValidatorTasks/${validatorTaskHashValue.substring(2)}`
        + `/Task.zip`
    );

    // Validate correct link response
    if (!response.ok) {
        autoDownloadError.textContent = `Download failed from ${userUrl}`
            + `/Tasks/ValidatorTasks/${validatorTaskHashValue.substring(2)}/`
            + `Task.zip`;
        return;
    }

    // Validate task data hash
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const downloadHash = keccak256(uint8Array).toString('hex');
    if (downloadHash === validatorTaskHashValue) {

        // Parse file
        dataHashMatchFound(arrayBuffer);
    } else {
        autoDownloadError.textContent = `Incorrect data hash from ${userUrl}`
            + `/Tasks/ValidatorTasks/${validatorTaskHashValue.substring(2)}/`
            + `Task.zip`;
    }
}

/**
 * Updates download from link button with next user link and inactivates next
 * link button if user has no more links
 */
function skipLink() {

    // Validate user has another link
    if (!canSkipLink) {
        return;
    }

    // Increment link index and reset link skip variable
    autoUserLinksIndex++;
    canSkipLink = false;

    // If at final link, update visuals and link skip variable
    if (autoUserLinks.length === autoUserLinksIndex + 1) {
        replaceClass(skipLinkButton, "border-button", "inactive-border-button");
        canSkipLink = false;
    }

    // Update download from link button
    tryDownloadButton.textContent = `Try download from: `
        + `${parseUserData(autoUserData).data}\r\nAddress: `
        + `${autoUserAddress}\r\nLink: ${autoUserLinks[autoUserLinksIndex]}`
        + `/Tasks/ValidatorTasks/${validatorTaskHashValue.substring(2)}`
        + `/Task.zip`;
}

/**
 * Visually updates the save task data button and creates download
 * functionality when save button is clicked
 */
function unlockSaveTaskLocally() {

    // If the save button is already unlocked, no need to unlock again
    if (saveLocallyButtonUnlocked) {
        return;
    }

    // Update the save button visual to interactable
    replaceClass(saveLocallyButton, "inactive-border-button", "border-button");

    // Downloads the task data on button click
    saveLocallyButton.addEventListener("click", () => {
        const blob = new Blob([localZipFile], { type: 'application/zip' });
        const url = URL.createObjectURL(blob);
        downloadTaskAnchor.href = url;
        downloadTaskAnchor.download
            = `Task-v-${validatorTaskIndex}.zip`;
        downloadTaskAnchor.click();
    });

    // Save button is now unlocked
    saveLocallyButtonUnlocked = true;
}

/**
 * Displays the zip file contents in the file tree
 * @param {File} zipFile Zip file with matching task hash
 */
async function dataHashMatchFound(zipFile) {

    // Update zip file variable
    localZipFile = zipFile;

    // Unlock the save file button and lock the upload file button
    unlockSaveTaskLocally();
    replaceClass(
        uploadLocallyButton,
        "border-button",
        "inactive-border-button"
    );

    // Remove discover data section
    addClass(discoverSection, "hide");

    // Zip file data variables
    let zipFileContents = [];
    let zipContents;

    // Extract each of the files in the zip, and upon error display error
    // message
    try {
        zipContents = await JSZip.loadAsync(localZipFile);
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
        taskFileTreeArea.textContent = `Error parsing .zip file - ${error}`;
        return;
    }

    // Set zip file tree structure
    taskFileTreeArea.textContent = formatFileStructure(zipFileContents);

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
            = `[X] ERROR: Problem parsing specifications.json - ${error}`;
        return;
    }

    // Task content header
    taskJsonArea.textContent = "";
    const taskRequirementsHeader = document.createElement("h1");
    taskRequirementsHeader.textContent = "Task Requirements";
    taskJsonArea.appendChild(taskRequirementsHeader);

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

            // If the parsing results in an error, then display a warning for
            // the requirement
            formatTaskJson(
                null,
                null
            );
        }
    }
}

/**
 * Get the validator task contract signer if not already cached, and output any
 * error to the given error element
 * @param {Element} errorElement Error element to output possible error
 */
async function getValidatorTaskSigner(errorElement) {

    // Get the signer if not already cached
    if (signer === undefined) {
        try {
            signer = await provider.getSigner();
        } catch (error) {
            errorElement.textContent = `[X] ERROR: Get signer failed - ${error}`;
            return;
        }
    }

    // Get the hash task contract signer if not already cached
    if (validatorTaskSigner === undefined) {
        validatorTaskSigner = new ethers.Contract(
            validatorTaskContractAddress,
            validatorTaskJson.abi,
            signer
        );
    }
}

/**
 * If the user is a worker or validator for this task submission, then display
 * the corresponding sections to enable contract interaction
 */
async function updateSections() {

    // Only evaluate when all dependent data has been retireved
    if (workerAddressValue === undefined
        || validatorsValue === undefined
        || requirementsCountValue === undefined
        || submissionWithdrawnValue === undefined
        || taskDefaultedValue === undefined
        || isTaskComplete === undefined
        || validationStartTimeValue === undefined
        || validationEndTimeValue === undefined
        || evaluatedSubmissionsCountValue === undefined
        || submissionCompletionIndex === undefined
    ) {
        return;
    }

    // Get the user address if it has not already been retrieved
    if (userAddress === undefined) {

        // Load user wallet
        try {
            await provider.send("eth_requestAccounts", []);
        } catch {
            errorText.textContent = "[X] ERROR: no wallet found";
            return;
        }

        // Get user signer for address
        signer = await provider.getSigner();
        userAddress = signer.address;
    }

    // Show the withdrawls row if the user is the worker for this submission
    if (workerAddressValue === userAddress) {
        showingWithdrawlsRow = true;
        removeClass(withdrawlsRow, "hide");
        canWithdrawCompletion();
        canWithdrawUnevaluated();
    }

    // Show the evaluation section if the user is a validator in the list of
    // validators for the task
    let userInValidators = false;
    for (let i = 0; i < validatorsValue.length; i++) {
        if (validatorsValue[i] === userAddress) {
            userInValidators = true;
            userInValidatorsIndex = i;
            break;
        }
    }

    // Do not show section if user is not in list of validators for the task
    if (!userInValidators) {
        return;
    }

    // Add each requirement row for the validator to evaluate
    requirementChecks = new Array(requirementsCountValue).fill(false);
    for (let i = 0; i < requirementsCountValue; i++) {
        const templateClone
            = requirementTemplate.content.cloneNode(true);
        const checkboxClone = templateClone.querySelector("#checkbox");
        checkboxClone.addEventListener("click", () => {
            requirementChecks[i] = !requirementChecks[i];
            if (requirementChecks[i]) {
                checkboxClone.textContent = "✓";
            } else {
                checkboxClone.textContent = "";
            }

            // Update the submit evaluation button accept/reject text
            updateEvaluationButtonText();
        });
        templateClone.querySelector("#requirement-text").textContent
            = `Requirement ${i + 1}`;
        requirementsContainer.appendChild(templateClone);
    }

    // Show the section and update the section display variable
    showingEvaluationSection = true;
    removeClass(evaluationSection, "hide");

    // Update the user submission
    canSubmitEvaluation();
}

/**
 * Sets the submission status variable and UI with descriptions of the possible
 * submission states that are dependent on other evaluated tasks and the
 * submission evaluation time window
 */
function updateSubmissionStatus() {

    // Only evaluate when all dependent data has been retireved
    if (evaluatedSubmissionsCountValue === undefined
        || isTaskComplete === undefined
        || taskDefaultedValue === undefined
        || validationStartTimeValue === undefined
        || validationEndTimeValue === undefined
        || requirementsCountValue === undefined
    ) {
        return;
    }

    // Descriptions of the possible submission states that are dependent on
    // other evaluated tasks and the submission evaluation time window
    submissionStatusValue = getValidatorSubmissionStatus(
        isTaskComplete,
        taskDefaultedValue,
        submissionIndexValue,
        evaluatedSubmissionsCountValue,
        new Date(validationStartTimeValue * 1000),
        new Date(validationEndTimeValue * 1000)
    );

    // Update the UI with the submission status
    submissionStatus.textContent = `Submission Status: ${submissionStatusValue}`;

    // Update the submit evaluation button UI
    canSubmitEvaluation();
}

/**
 * Update the submit evaluation button UI and error/warning text, and determine
 * if the user is able to submit an valid evaluation for the current task
 * submission
 * @returns {Boolean} Whether the user is able to submit a valid evaluation for
 * the current task submission
 */
function canSubmitEvaluation() {

    // Initialize the button to be inactive
    replaceClass(
        submitEvaluationButton,
        "payable-button",
        "inactive-payable-button"
    );
    submitEvaluationButton.textContent = "Submit Evaluation";

    // Validate the user is a validator and the evaluation section is showing
    if (!showingEvaluationSection) {
        return false;
    }

    // Validate dependent variables
    if (validationStartTimeValue === undefined
        || validationEndTimeValue === undefined
        || taskDefaultedValue === undefined
        || isTaskComplete === undefined
        || evaluatedSubmissionsCountValue === undefined
        || requirementsCountValue === undefined
    ) {
        return false;
    }

    // Validate the submission can be evaluated
    submitEvaluationError.textContent = "";
    if (new Date() <= new Date(validationStartTimeValue * 1000)) {
        submitEvaluationError.textContent
            = "(!) Waiting for submission evaluation timespan";
        return false;
    }
    if (new Date() > new Date(validationEndTimeValue * 1000)) {
        submitEvaluationError.textContent
            = "[X] ERROR: Submission evaluation timespan has passed";
        return false;
    }
    if (taskDefaultedValue) {
        submitEvaluationError.textContent
            = "[X] ERROR: Task has defaulted, evaluation not available";
        return false;
    }
    if (isTaskComplete) {
        submitEvaluationError.textContent = "[X] ERROR: Task has already been "
            + "completed, evaluation not available";
        return false;
    }
    if (evaluatedSubmissionsCountValue > submissionIndexValue) {
        submitEvaluationError.textContent
            = "[X] ERROR: Submission has already been evaluated";
        return false;
    }

    // Update the button to be active
    replaceClass(
        submitEvaluationButton,
        "inactive-payable-button",
        "payable-button"
    );

    // Update the submit evaluation button accept/reject text
    updateEvaluationButtonText();
    return true;
}

/**
 * Update the withdraw submission completion button UI and error/warning text,
 * and determine if the user is able to withdraw the current submission
 * @returns {Boolean} Whether the user is able to withdraw the current task
 * submission
 */
function canWithdrawCompletion() {

    // Initialize the button to be inactive
    replaceClass(
        withdrawSubmissionComplete,
        "payable-button",
        "inactive-payable-button"
    );

    // Validate all dependent variables have been retrieved
    if (workerAddressValue === undefined
        || submissionWithdrawnValue === undefined
        || taskDefaultedValue === undefined
        || isTaskComplete === undefined
        || submissionCompletionIndex === undefined
        || evaluatedSubmissionsCountValue === undefined
    ) {
        return false;
    }

    // Validate the user can withdraw the submission reward
    if (submissionWithdrawnValue) {
        withdrawSubmissionCompleteError.textContent
            = "(!) Submission already withdrawn";
        return false;
    }
    if (!isTaskComplete && !taskDefaultedValue) {
        withdrawSubmissionCompleteError.textContent
            = "(!) Submission not complete";
        return false;
    }
    if (workerAddressValue !== userAddress) {
        withdrawSubmissionCompleteError.textContent
            = "(!) User does not match worker address";
        return false;
    }
    if (isTaskComplete
        && submissionCompletionIndex < submissionIndexValue
    ) {
        withdrawSubmissionCompleteError.textContent
            = "(!) Submission incomplete unevaluated";
        return false;
    } else if (isTaskComplete
        && submissionCompletionIndex > submissionIndexValue
    ) {
        withdrawSubmissionCompleteError.textContent
            = "(!) Submission rejected";
        return false;
    } else if (taskDefaultedValue
        && evaluatedSubmissionsCountValue > submissionIndexValue
    ) {
        withdrawSubmissionCompleteError.textContent
            = "(!) Submission rejected";
        return false;
    } else if (taskDefaultedValue
        && evaluatedSubmissionsCountValue > submissionIndexValue
    ) {
        withdrawSubmissionCompleteError.textContent
            = "(!) Submission incomplete unevaluated";
        return false;
    }

    // Update the button to be active
    replaceClass(
        withdrawSubmissionComplete,
        "inactive-payable-button",
        "payable-button"
    );
    withdrawSubmissionCompleteError.textContent = "";
    return true;
}

/**
 * Update the withdraw submission unevaluated button UI and error/warning text,
 * and determine if the user is able to withdraw the current submission
 * @returns {Boolean} Whether the user is able to withdraw the current task
 * submission validator comission
 */
function canWithdrawUnevaluated() {

    // Initialize the button to be inactive
    replaceClass(
        withdrawSubmissionUnevaluated,
        "payable-button",
        "inactive-payable-button"
    );

    // Validate all dependent variables have been retrieved
    if (workerAddressValue === undefined
        || submissionWithdrawnValue === undefined
        || taskDefaultedValue === undefined
        || isTaskComplete === undefined
        || submissionCompletionIndex === undefined
    ) {
        return false;
    }

    // Validate the user can withdraw the submission reward
    if (submissionWithdrawnValue) {
        withdrawSubmissionUnevaluatedError.textContent
            = "(!) Submission already withdrawn";
        return false;
    }
    if (!isTaskComplete && !taskDefaultedValue) {
        withdrawSubmissionUnevaluatedError.textContent
            = "(!) Submission not unevaluated";
        return false;
    }
    if (workerAddressValue !== userAddress) {
        withdrawSubmissionUnevaluatedError.textContent
            = "(!) User does not match worker address";
        return false;
    }
    if (isTaskComplete
        && submissionCompletionIndex === submissionIndexValue
    ) {
        withdrawSubmissionUnevaluatedError.textContent
            = `(!) Use "Withdraw Submission Completion" button`;
        return false;
    } else if (isTaskComplete
        && submissionCompletionIndex > submissionIndexValue
    ) {
        withdrawSubmissionUnevaluatedError.textContent
            = "(!) Submission rejected";
        return false;
    } else if (taskDefaultedValue
        && evaluatedSubmissionsCountValue === submissionIndexValue
    ) {
        withdrawSubmissionUnevaluatedError.textContent
            = `(!) Use "Withdraw Submission Completion" button`;
        return false;
    } else if (taskDefaultedValue
        && evaluatedSubmissionsCountValue > submissionIndexValue
    ) {
        withdrawSubmissionUnevaluatedError.textContent
            = "(!) Submission rejected";
        return false;
    }

    // Update the button to be active
    replaceClass(
        withdrawSubmissionUnevaluated,
        "inactive-payable-button",
        "payable-button"
    );
    withdrawSubmissionUnevaluatedError.textContent = "";
    return true;
}

/**
 * Update the text of the submit evaluation button the accepted or rejected
 * depending on whether all requirements are checked or not
 */
function updateEvaluationButtonText() {
    if (ethicsRequirementsChecked
        && requirementChecks.reduce((acc, curr) => acc && curr, true)
    ) {
        submitEvaluationButton.textContent = "Submit Evaluation: ACCEPTED";
    } else {
        submitEvaluationButton.textContent = "Submit Evaluation: REJECTED";
    }
}
