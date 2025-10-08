import {
    ethers
} from "../libs/ethers.min.js";
import {
    getValidatorSubmissionStatus,
    loadHeader
} from "../../utils/commonFunctions.js";
import { VALIDATOR_TASK_CONTRACT_ADDRESS } from "../../utils/constants.js";

// Page elements
const submissionsContainer
    = document.getElementById("validator-task-submission-rows-container");
const itemTemplate
    = document.getElementById("validator-task-submission-template");
const submissionsCount = document.getElementById("submissions-count");
const evaluatedSubmissionsCount
    = document.getElementById("evaluated-submissions-count");
const taskComplete = document.getElementById("task-complete");
const taskDefaulted = document.getElementById("task-defaulted");
const submitTaskButton = document.getElementById("add-task-submission-button");
const viewTaskButton = document.getElementById("view-task-button");
const taskId = document.getElementById("task-id");

// Load the header button navigation functionality
loadHeader();

// Validator task contract address on the blockchain
const validatorTaskContractAddress = VALIDATOR_TASK_CONTRACT_ADDRESS;

// Gets provider's access to contracts
const validatorTaskAbi = await fetch('./data/abi/validatorTaskAbi.json');
const validatorTaskJson = await validatorTaskAbi.json();
const provider = new ethers.BrowserProvider(window.ethereum);
const validatorTaskContract = new ethers.Contract(
    validatorTaskContractAddress,
    validatorTaskJson.abi,
    provider
);

// Initialize variables
let submissionsCountValue;
let isTaskComplete;
let isTaskDefaulted;
let evaluatedSubmissionsCountValue;
let validatorTaskIndex;

// If search parameter in URL, search using that value
const url = new URL(window.location.href);
const params = Object.fromEntries(url.searchParams.entries());
validatorTaskIndex = Number(params.index);
if (!Number.isNaN(validatorTaskIndex)) {
    taskId.textContent = `Task ID: v-${validatorTaskIndex}`;
}

// Redirects to submit validator task page
submitTaskButton.addEventListener("click", () => {
    window.location.href = `pages/validatorTask/submitValidatorTask.html?`
        + `index=${validatorTaskIndex}`;
});

// Redirects to validator task page
viewTaskButton.addEventListener("click", () => {
    window.location.href = `pages/validatorTask/validatorTask.html?`
        + `id=v-${validatorTaskIndex}`;
});

// Update hash task and submission variables with data retrieved from the
// blockchain
validatorTaskContract.getTaskComplete(validatorTaskIndex)
    .then((c) => {
        isTaskComplete = c;
        taskComplete.textContent
            = `Task Complete: ${isTaskComplete ? "TRUE" : "FALSE"}`;
        updateSubmissionData();
    });
validatorTaskContract.taskDefaulted(validatorTaskIndex)
    .then((d) => {
        isTaskDefaulted = d;
        taskDefaulted.textContent
            = `Task Defaulted: ${isTaskDefaulted ? "TRUE" : "FALSE"}`;
        updateSubmissionData();
    });
validatorTaskContract.getSubmissionsCount(validatorTaskIndex)
    .then((s) => {
        submissionsCountValue = Number(s);
        submissionsCount.textContent
            = `Submissions Count: ${submissionsCountValue}`;
        updateSubmissionData();
    });
validatorTaskContract.getEvaluatedSubmissionsCount(validatorTaskIndex)
    .then((e) => {
        evaluatedSubmissionsCountValue = Number(e);
        evaluatedSubmissionsCount.textContent
            = `Evaluated Submissions Count: ${evaluatedSubmissionsCountValue}`;
        updateSubmissionData();
    });

/**
 * @typedef {Object} Submission
 * @property {Number} index Submission index
 * @property {String} submissionHash Submission hash
 * @property {String} workerAddress Worker submission address
 * @property {Date} evaluationStartTime UTC time of evaluation window start time
 * @property {Date} evaluationEndTime UTC time of evaluation window end time
 * @property {
 * 'Completed'
 * | 'Completed Defaulted'
 * | 'Rejected'
 * | 'Incomplete Unevaluated'
 * | 'Waiting Evaluation'
 * | 'Waiting For Evaluation Timespan'
 * | 'Waiting For Previous Submission Evaluation'
 * | 'Unexpected Data'
 * } submissionStatus Submission status state
 */

/**
 * If all dependent data for the function has been retrieved, then iterate over
 * all validator task submissions in the task and retrieve the data from the
 * blockchain, then update the UI
 */
async function updateSubmissionData() {

    // Validate all dependent task data has been retrieved
    if (isTaskComplete === undefined
        || isTaskDefaulted === undefined
        || submissionsCountValue === undefined
        || evaluatedSubmissionsCountValue === undefined
    ) {
        return;
    }

    // Display text for the start of the search
    submissionsContainer.textContent = "Loading validator task submissions...";

    // Iterate over all task submissions in reverse order to display the most
    // recent submissions on top, and retrieve validator task submission data in
    // each iteration
    let submissions = [];
    for (let i = submissionsCountValue - 1; i >= 0; i--) {
        let submission = {};
        submission.index = i;

        // Retrieve submission data from the blockchain, 
        submission.submissionHash = await validatorTaskContract
            .getSubmissionHash(validatorTaskIndex, i);
        submission.workerAddress = await validatorTaskContract
            .getSubmissionWorkerAddress(validatorTaskIndex, i);
        submission.evaluationStartTime = Number(
            await validatorTaskContract.getSubmissionValidationStart(
                validatorTaskIndex,
                i
            )
        );
        submission.evaluationEndTime = Number(
            await validatorTaskContract.getSubmissionValidationEnd(
                validatorTaskIndex,
                i
            )
        );

        // Gets a description of the submission evaluation status
        submission.submissionStatus = getValidatorSubmissionStatus(
            isTaskComplete,
            isTaskDefaulted,
            i,
            evaluatedSubmissionsCountValue,
            new Date(submission.evaluationStartTime * 1000),
            new Date(submission.evaluationEndTime * 1000)
        );

        // Add the submission data to the list of all submissions
        submissions.push(submission);
    }

    // Update the UI with the retrieved submission data
    updatePageResults(submissions);
}

/**
 * Updates the submissions list in the page
 * @param {Array<Submission>} results Array of submission data
 */
function updatePageResults(results) {

    // Reset the submission items container then iteratively add each item
    submissionsContainer.textContent = "";
    results.forEach((submissionItem, i) => {

        // Create submission item with retrieved data
        const searchItem = itemTemplate.content.cloneNode(true);
        searchItem.querySelector('#validator-task-submission-index').textContent
            = `v-${validatorTaskIndex}-${submissionItem.index}`;
        searchItem.querySelector('#worker-address').textContent
            = `Worker Address: ${submissionItem.workerAddress}`;
        searchItem.querySelector('#submission-hash').textContent
            = `Submission Hash: ${submissionItem.submissionHash}`;
        searchItem.querySelector('#evaluation-start-time').textContent
            = `Validation Start Time (UTC): `
            + `${new Date(submissionItem.evaluationStartTime * 1000)
                .toUTCString()
            }`;
        searchItem.querySelector('#evaluation-end-time').textContent
            = `Validation End Time (UTC): `
            + `${new Date(submissionItem.evaluationEndTime * 1000)
                .toUTCString()
            }`;
        searchItem.querySelector('#submission-status').textContent
            = `Submission Status: ${submissionItem.submissionStatus}`;
        searchItem.querySelector('#view-button')
            .addEventListener("click", () => {
                window.location.href = `pages/validatorTask/validator`
                    + `TaskSubmission.html?id=v-${validatorTaskIndex}-`
                    + `${submissionItem.index}`;
            });
        submissionsContainer.appendChild(searchItem);
    });

    // If there are no matching items found, then display message
    if (results.length === 0) {
        submissionsContainer.textContent = "No submissions yet";
    }
}