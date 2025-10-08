import {
    ethers,
    keccak256
} from "../libs/ethers.min.js";
import {
    loadHeader,
} from "../../utils/commonFunctions.js";
import { DOUBLE_HASH_TASK_CONTRACT_ADDRESS } from "../../utils/constants.js";

// Page elements
const submissionsContainer = document.getElementById("submissions-container");
const itemTemplate = document.getElementById("submission-item-template");
const totalSubmissionsCount = document.getElementById("submissions-count");
const submitTaskButton = document.getElementById("submit-task-button");
const viewTaskButton = document.getElementById("view-task-button");
const taskId = document.getElementById("task-id");

// Load the header button navigation functionality
loadHeader();

// Get double hash task contract
const doubleHashTaskContractAddress = DOUBLE_HASH_TASK_CONTRACT_ADDRESS;
const provider = new ethers.BrowserProvider(window.ethereum);
const doubleHashTaskAbi = await fetch('./data/abi/doubleHashTaskAbi.json');
const doubleHashTaskJson = await doubleHashTaskAbi.json();
const doubleHashTaskContract = new ethers.Contract(
    doubleHashTaskContractAddress,
    doubleHashTaskJson.abi,
    provider
);

// Initialize variables
const MINIMUM_BLOCK_INDEX = 1;
let submissionsCountValue;
let isTaskComplete;
let doubleHashTaskIndex;
let secondResponseWindowValue;

// If search parameter in URL, search using that value
const url = new URL(window.location.href);
const params = Object.fromEntries(url.searchParams.entries());
doubleHashTaskIndex = Number(params.index);
if (!Number.isNaN(doubleHashTaskIndex)) {
    taskId.textContent = `Task ID: dh-${doubleHashTaskIndex}`;
}

// Redirects to the double hash task page
viewTaskButton.addEventListener("click", () => {
    window.location.href = `pages/doubleHashTask/doubleHashTask.html?id=dh-`
        + `${doubleHashTaskIndex}`;
});

// Redirects to add requirement page
submitTaskButton.addEventListener("click", () => {
    window.location.href = `pages/doubleHashTask/submitDoubleHashTask.html?`
        + `index=${doubleHashTaskIndex}`;
});

// Asynchronously query the task second response window value
getSecondResponseWindowValue();

// Updates the double hash task responses count, and update the UI if available
doubleHashTaskContract.getDoubleHashTaskResponseCount(doubleHashTaskIndex)
    .then((s) => {
        submissionsCountValue = Number(s);
        updateSubmissionCount();
    });

// Updates the double hash task completion, and update the UI if available
doubleHashTaskContract.getDoubleHashTaskComplete(doubleHashTaskIndex)
    .then((c) => {
        isTaskComplete = c;
        updateSubmissionCount();
    });

/**
 * @typedef {Object} Submission
 * @property {Number} index Submission index
 * @property {Boolean} isFirstHash Whether the this is the first hash submission
 * @property {?String} firstHash Hash key hash
 * @property {?String} hashKey Task hash key
 * @property {String} workerAddress Worker submission address
 * @property {Date} windowStartTime UTC time of second submission window start
 * @property {?Date} submissionTime UTC time of hash submission
 * @property {Date} windowEndTime UTC time of second submission window end
 * @property {?(
 * 'Completed'
 * | 'Waiting For Response Window'
 * | 'Waiting For Response'
 * | 'Response Window Passed'
 * | 'Task Already Complete'
 * )} submissionStatus Submission state description
 */

/**
 * @typedef {Object} SearchSettings
 * @property {Number} blockIndex Next search block index in the blockchain
 * @property {Number} eventIndex Next search event index in the block
 * @property {Number} minimumBlockIndex Minimum blockchain block index in search
 * @property {Number} completionIndex Index of the task hash key completion
 * response
 */

/**
 * Get the first hash response data and confirmation response data if any from
 * direct queries to the smart contract, afterwards begin the extended data
 * search by getting data from the smart contract events
 */
async function searchBasic() {

    // Task first has and hash key responses ordered starting from most recent
    let results = [];

    // Get the confirmation hash key response if any
    let firstSubmissionsCount = submissionsCountValue;
    if (isTaskComplete) {
        firstSubmissionsCount--;
        results.push({
            isFirstHash: false,
            submissionStatus: "Completed"
        });
    }

    // Get the first hash responses data in descending index
    for (let i = firstSubmissionsCount - 1; i >= 0; i--) {
        const submissionWorkerAddress = await doubleHashTaskContract
            .getDoubleHashTaskResponseWorkerAddress(doubleHashTaskIndex, i);
        const submissionWindowStart = Number(
            await doubleHashTaskContract
                .getDoubleHashTaskResponseWindowStart(doubleHashTaskIndex, i)
        );
        const submissionWindowEnd = Number(
            submissionWindowStart + await getSecondResponseWindowValue()
        );
        results.push({
            index: i,
            isFirstHash: true,
            workerAddress: submissionWorkerAddress,
            windowStartTime: new Date(submissionWindowStart * 1000),
            windowEndTime: new Date(submissionWindowEnd * 1000)
        });
    }

    // Updates the retrieved items onto the page
    updatePageResults(results);

    // Update the search items with more data from events
    searchExtended();
}

/**
 * Iterate through double hash task event data in the blockchain to get more
 * specific response data, then update the UI
 */
async function searchExtended() {

    // Array of comprehensive response data gathered from events
    let results = [];

    // Initialize the search settings for the response search
    let searchSettings = {};

    // Continue searching response data until all response data found, search
    // starting from the most recent
    let allSubmissionsFound = false;
    while (!allSubmissionsFound) {

        // Get the next response for this task
        let searchResult = await searchNext(searchSettings);

        // If no submission is returned, then searching is complete
        if (searchResult.submission === null) {
            allSubmissionsFound = true;
            break;
        }

        // Set the indices of the results starting with the completion response
        // if any, then order by most recent
        let resultIndex;
        if (searchResult.submission.isFirstHash) {
            resultIndex
                = submissionsCountValue - searchResult.submission.index - 1;
        } else {
            resultIndex = 0;
        }
        results[resultIndex] = searchResult.submission;

        // If the first ever response has been retrieved, then searching is
        // complete
        if (searchResult.submission.index === 0
            && searchResult.submission.isFirstHash
        ) {
            break;
        }

        // Update the search settings for the next iteration
        searchSettings = searchResult.searchSettings;
    }

    // Updates the retrieved items onto the page
    updatePageResults(results);
}

/**
 * Updates the submissions list in the page
 * @param {Array<Submission>} results Array of submission data
 */
function updatePageResults(results) {

    // Reset the submission items container then iteratively add each item
    submissionsContainer.textContent = "";
    results.forEach((searchResult, i) => {

        // Create submission item with retrieved data
        const searchItem = itemTemplate.content.cloneNode(true);
        searchItem.querySelector('#submission-index').textContent
            = `${searchResult.index ?? "-"}`;
        searchItem.querySelector('#second-hash').textContent
            = `Hash Key: ${searchResult.isFirstHash ?
                "X"
                : searchResult.hashKey ?? "-"
            }`;
        searchItem.querySelector('#first-hash').textContent
            = `First Hash: ${searchResult.firstHash ?? "-"}`;
        searchItem.querySelector('#worker-address').textContent
            = `Worker Address: ${searchResult.workerAddress ?? "-"}`;
        searchItem.querySelector('#submission-window-start').textContent
            = `Window Start Time (UTC): ${searchResult
                .windowStartTime?.toUTCString() ?? "-"
            }`;
        searchItem.querySelector('#submission-time').textContent
            = `Submission Time (UTC): ${searchResult.submissionTime ?
                searchResult.submissionTime?.toUTCString() ?? "-"
                : "-"
            }`;
        searchItem.querySelector('#submission-window-end').textContent
            = `Window End Time (UTC): ${searchResult
                .windowEndTime?.toUTCString() ?? "-"
            }`;
        searchItem.querySelector('#submission-status').textContent
            = `Submission Status: ${searchResult.submissionStatus ?? "-"}`;
        submissionsContainer.appendChild(searchItem);
    });

    // If there are no matching items found, then display message
    if (results.length === 0) {
        submissionsContainer.textContent = "No submissions yet";
    }
}

/**
 * Searches for the next submission response event and its associated data
 * @param {SearchSettings} searchSettings Settings used to initialize search
 * starting from a specific point in the blockchain
 * @returns {Object} Submission found in search by given search settings and
 * search settings for next search indices
 * @returns {SearchSettings} return.searchSettings Search settings for next
 * search indices
 * @returns {?Submission} return.submission Submission found in search by given
 * search settings
 */
async function searchNext(searchSettings) {

    // Search settings variables
    let blockIndex;
    let eventIndex;
    let minimumBlockIndex;
    let completionIndex;

    // Initialize search settings or use given cached values
    if ("blockIndex" in searchSettings) {
        blockIndex = searchSettings.blockIndex;
    } else {
        blockIndex = await provider.getBlockNumber();
    }
    if ("eventIndex" in searchSettings) {
        eventIndex = searchSettings.eventIndex;
    } else {
        eventIndex = -1;
    }
    if ("minimumBlockIndex" in searchSettings) {
        minimumBlockIndex = searchSettings.minimumBlockIndex;
    } else {
        minimumBlockIndex = MINIMUM_BLOCK_INDEX;
    }
    if ("completionIndex" in searchSettings) {
        completionIndex = searchSettings.completionIndex;
    } else {
        completionIndex = -1;
    }

    // Get the event filters for the two hash submission event types
    const firstHashFilter = await doubleHashTaskContract.filters
        .DoubleTaskSubmit()
        .getTopicFilter();
    const hashKeyFilter = await doubleHashTaskContract.filters
        .DoubleTaskComplete()
        .getTopicFilter();
    const eventsFilter = [
        firstHashFilter.concat(hashKeyFilter)
    ];

    // Iterate through event and block indices until the minimum block index is
    // searched through
    while (blockIndex >= MINIMUM_BLOCK_INDEX) {

        // Query for the events in a specific block
        let events = await doubleHashTaskContract.queryFilter(
            eventsFilter,
            blockIndex,
            blockIndex
        );

        // Initialize current event search
        let eventFound = false;
        let emittedData;
        let eventData;
        let nextSearchSettings = {
            minimumBlockIndex: minimumBlockIndex
        };
        if (completionIndex !== -1) {
            nextSearchSettings.completionIndex = completionIndex;
        }

        // If there are no events found in the block, then continue to the next
        // event and block search indices
        if (events.length === 0) {
            const nextSearchIndices
                = await getEventAndBlockIndices(eventIndex, blockIndex);
            eventIndex
                = nextSearchIndices.eventIndex;
            blockIndex
                = nextSearchIndices.blockIndex;
            continue;
        }

        // If no event index specified, then start from the last event
        if (eventIndex === -1) {
            eventIndex = events.length - 1;
        }

        // Data emitted from the event
        emittedData = events[eventIndex].args;

        // If the event doesn't match the desired task index, then continue
        // to the next event and block search indices
        if (Number(emittedData[0]) !== doubleHashTaskIndex) {
            const nextSearchIndices
                = getEventAndBlockIndices(eventIndex, blockIndex);
            eventIndex
                = nextSearchIndices.eventIndex;
            blockIndex
                = nextSearchIndices.blockIndex;
            continue;
        }

        // Get timestamp data from the blockchain
        const windowStartNumber = Number(
            await doubleHashTaskContract
                .getDoubleHashTaskResponseWindowStart(
                    doubleHashTaskIndex,
                    emittedData[1]
                )
        ) * 1000;
        const windowLengthNumber = Number(
            await doubleHashTaskContract
                .getDoubleHashTaskSecondResponseWindow(
                    doubleHashTaskIndex
                )
        ) * 1000;
        const windowEndNumber = windowStartNumber + windowLengthNumber;
        const blockTimestampNumber = Number(
            (await provider.getBlock(blockIndex))
                .timestamp
        ) * 1000;

        // Get the data depending on the event type being either first hash
        // submission response or hask key confirmation response
        if (events[eventIndex].fragment.name === "DoubleTaskSubmit") {

            // Set the response submission status based on the task completion
            // and response window timing
            let submissionStatus;
            if (isTaskComplete) {
                if (completionIndex === Number(emittedData[1])) {
                    submissionStatus = "Completed";
                } else {
                    submissionStatus = "Task Already Complete";
                }
            } else {
                if (new Date() <= new Date(windowStartNumber)) {
                    submissionStatus = "Waiting For Response Window";
                } else if (new Date() > new Date(windowEndNumber)) {
                    submissionStatus = "Response Window Passed";
                } else {
                    submissionStatus = "Waiting For Response";
                }
            }

            // Set the first hash submission data
            eventData = {
                index: Number(emittedData[1]),
                isFirstHash: true,
                firstHash: emittedData[2],
                workerAddress: emittedData[3],
                windowStartTime: new Date(windowStartNumber),
                submissionTime: new Date(blockTimestampNumber),
                windowEndTime: new Date(windowEndNumber),
                submissionStatus: submissionStatus,
            };
            eventFound = true;
        } else if (events[eventIndex].fragment.name === "DoubleTaskComplete") {

            // Set the hash key submission data
            eventData = {
                index: Number(emittedData[1]),
                isFirstHash: false,
                firstHash: keccak256(emittedData[2]),
                hashKey: emittedData[2],
                workerAddress: emittedData[3],
                windowStartTime: new Date(windowStartNumber),
                submissionTime: new Date(blockTimestampNumber),
                windowEndTime: new Date(windowEndNumber),
                submissionStatus: "Completed",
            };
            eventFound = true;

            // Cache the response index of the hash key completion
            nextSearchSettings.completionIndex = Number(emittedData[1]);
        }

        // Get the next event and block search indices
        const nextSearchIndices
            = await getEventAndBlockIndices(eventIndex, blockIndex);
        nextSearchSettings.eventIndex = nextSearchIndices.eventIndex;
        nextSearchSettings.blockIndex = nextSearchIndices.blockIndex;

        // If an event found for this task index, then return that event data
        // and the next search settings, otherwise update the event and block
        // search indices variables and continue searching through events
        if (eventFound) {
            return {
                submission: eventData,
                searchSettings: nextSearchSettings
            }
        } else {
            eventIndex = nextSearchSettings.eventIndex;
            blockIndex = nextSearchSettings.blockIndex;
        }
    }

    // If no item found, return null values
    return {
        submission: null,
        searchSettings: null
    };
}

/**
 * Retrieves the task second response window time from the smart contract, and
 * caches that data for later calls to this function
 * @returns {Number} Task second response window time in seconds
 */
async function getSecondResponseWindowValue() {
    if (secondResponseWindowValue !== undefined) {
        return secondResponseWindowValue;
    }
    return Number(
        await doubleHashTaskContract
            .getDoubleHashTaskSecondResponseWindow(doubleHashTaskIndex)
    );
}

/**
 * There should only be one final confirmation submission, the rest are first
 * hash submissions, so if the task is complete that one confirmation submission
 * should be added to the responses count, this is calculated when both the
 * isTaskComplete and submissionCountValue variables are retrieved
 */
function updateSubmissionCount() {
    if (isTaskComplete === undefined || submissionsCountValue === undefined) {
        return;
    }
    if (isTaskComplete) {
        submissionsCountValue++;
    }
    totalSubmissionsCount.textContent
        = `Submissions Count: ${submissionsCountValue}`;
    searchBasic();
}

/**
 * Gets the next event and block indices to search for given the current values,
 * while searching in descending block and event order, and if all events in
 * the double hash task contract have been searched, then return null
 * @param {Number} eventIndex Current event index
 * @param {Number} blockIndex Current block index
 * @returns {?Object} The next event to search for in the blockchain
 * @returns {Number} return.eventIndex The next event index to search for, is -1
 * for the last event in the block
 * @returns {Number} return.blockIndex The next block index to search within
 */
async function getEventAndBlockIndices(eventIndex, blockIndex) {
    let nextEventIndex = eventIndex;
    let nextBlockIndex = blockIndex;

    // If all events searched in a block, then search for the last event in the
    // previous double hash task interaction block, otherwise search the
    // previous event
    if (eventIndex === 0 || eventIndex === -1) {

        // Set event index to -1 for the last event in the block
        nextEventIndex = -1;
        const lastBlockIndex = Number(
            await doubleHashTaskContract.lastInteractionBlockIndex(
                { blockTag: blockIndex }
            )
        );

        // If all events of the contract have been searched, then return null
        if (lastBlockIndex < MINIMUM_BLOCK_INDEX) {
            return null;
        }

        // Update to at least a previous block
        if (blockIndex === lastBlockIndex) {
            nextBlockIndex--;
        } else {
            nextBlockIndex = lastBlockIndex;
        }
    } else {
        nextEventIndex--;
    }
    return {
        eventIndex: nextEventIndex,
        blockIndex: nextBlockIndex
    };
}