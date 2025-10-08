import {
    ethers
} from "./libs/ethers.min.js";
import {
    formatBlockTimestamp,
    formatWei,
    loadHeader,
    prefixHexBytes
} from "../utils/commonFunctions.js";
import { DOUBLE_HASH_TASK_CONTRACT_ADDRESS, HASH_TASK_CONTRACT_ADDRESS, VALIDATOR_TASK_CONTRACT_ADDRESS } from "../utils/constants.js";

// Page elements
const previousButton = document.getElementById("previous-button");
const nextButton = document.getElementById("next-button");
const searchHeader = document.getElementById("search-header");
const searchButton = document.getElementById("search-button");
const searchInput = document.getElementById("search-input");
const requirementsContainer
    = document.getElementById("requirements-rows-container");
const itemTemplate
    = document.getElementById("item-template");
const foldTasksButton = document.getElementById("fold-tasks-button");
const totalTasksCount = document.getElementById("total-tasks-count");
const tasksPanel = document.getElementById("tasks-panel");
const addHashTaskButton = document.getElementById("add-hash-task-button");
const hashTasksCount = document.getElementById("hash-task-count");
const addDoubleHashTaskButton
    = document.getElementById("add-double-hash-task-button");
const doubleHashTasksCount = document.getElementById("double-hash-task-count");
const addValidatorTaskButton
    = document.getElementById("add-validator-task-button");
const validatorTasksCount = document.getElementById("validator-task-count");
const checkbox = document.getElementById("checkbox");

// Load the header button navigation functionality
loadHeader();

// Get hash task, double hash task, and validator task contracts
const hashTaskContractAddress = HASH_TASK_CONTRACT_ADDRESS;
const provider = new ethers.BrowserProvider(window.ethereum);
const hashTaskAbi = await fetch('./data/abi/hashTaskAbi.json');
const hashTaskJson = await hashTaskAbi.json();
const hashTaskContract = new ethers.Contract(
    hashTaskContractAddress,
    hashTaskJson.abi,
    provider
);
const doubleHashTaskContractAddress = DOUBLE_HASH_TASK_CONTRACT_ADDRESS;
const doubleHashTaskAbi = await fetch('./data/abi/doubleHashTaskAbi.json');
const doubleHashTaskJson = await doubleHashTaskAbi.json();
const doubleHashTaskContract = new ethers.Contract(
    doubleHashTaskContractAddress,
    doubleHashTaskJson.abi,
    provider
);
const validatorTaskContractAddress = VALIDATOR_TASK_CONTRACT_ADDRESS;
const validatorTaskAbi = await fetch('./data/abi/validatorTaskAbi.json');
const validatorTaskJson = await validatorTaskAbi.json();
const validatorTaskContract = new ethers.Contract(
    validatorTaskContractAddress,
    validatorTaskJson.abi,
    provider
);

// Initialize search variables
const taskCycle = ['h', 'dh', 'v'];
let pageItems = { items: [], nextPageSettings: [] };
let currentPage = 0;
let maxSearchItems = null;
let searchingPage = false;
let tasksFolded = false;
let hashTasksCountValue;
let doubleHashTasksCountValue;
let validatorTasksCountValue;
let totalTasksCountValue;
let isHideCompletedTasksChecked = false;

// If search parameter in URL, search using that value
const url = new URL(window.location.href);
const params = Object.fromEntries(url.searchParams.entries());
const pageSearch = params.search;
if (pageSearch !== undefined) {
    searchInput.value = pageSearch;
    executeSearch();
}

// Redirects to add requirement page
addHashTaskButton.addEventListener("click", () => {
    window.location.href = 'pages/hashTask/addHashTask.html';
});

// Redirects to add requirement page
addDoubleHashTaskButton.addEventListener("click", () => {
    window.location.href = 'pages/doubleHashTask/addDoubleHashTask.html';
});

// Redirects to add requirement page
addValidatorTaskButton.addEventListener("click", () => {
    window.location.href = 'pages/validatorTask/addValidatorTask.html';
});

// Toggles between revealing and hiding tasks fold
foldTasksButton.addEventListener("click", () => {
    if (tasksFolded) {
        tasksPanel.style.display = "none";
        foldTasksButton.textContent = "▶";
    } else {
        tasksPanel.style.display = "grid";
        foldTasksButton.textContent = "▼";
    }
    tasksFolded = !tasksFolded;
});

// Updates checkbox check mark variable and display, then re-executes the search
checkbox.addEventListener("click", () => {
    if (isHideCompletedTasksChecked) {
        checkbox.textContent = "";
    } else {
        checkbox.textContent = "✓";
    }
    isHideCompletedTasksChecked = !isHideCompletedTasksChecked;
    executeSearch();
});

// Updates the hash tasks count
hashTaskContract.tasksCount().then((n) => {
    hashTasksCountValue = n;
    hashTasksCount.textContent = `Hash Tasks Count: \
        ${hashTasksCountValue}`;
    updateTotalTaskCount();
});

// Updates the hash tasks count
doubleHashTaskContract.tasksCount().then((n) => {
    doubleHashTasksCountValue = n;
    doubleHashTasksCount.textContent = `Double Hash Tasks Count: \
        ${doubleHashTasksCountValue}`;
    updateTotalTaskCount();
});

// Updates the hash tasks count
validatorTaskContract.tasksCount().then((n) => {
    validatorTasksCountValue = n;
    validatorTasksCount.textContent = `Validator Tasks Count: \
        ${validatorTasksCountValue}`;
    updateTotalTaskCount();
});

// If the search button is clicked or enter button pressed, then execute the
// search using the information in the search textbox
searchButton.addEventListener("click", executeSearch);
searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        executeSearch();
    }
});

// Go to the next 10 elements in the search
nextButton.addEventListener("click", async () => {

    // Return if already searching
    if (searchingPage || pageItems.items.length === 0) {
        return;
    }
    searchingPage = true;

    // Only search for next page if not in the last page, otherwise end search
    if (maxSearchItems == null || (currentPage + 1) * 10 < maxSearchItems) {
        currentPage++;
        await search(
            pageItems.nextPageSettings[currentPage - 1],
            currentPage,
            pageItems
        );
    } else {
        searchingPage = false;
        return;
    }

    // Number of items in the page
    updatePageItemCount();

    // End search
    searchingPage = false;
});

// Go to previous search page
previousButton.addEventListener("click", async () => {

    // Only go to previous page if not already searching and not on the first
    // page
    if (searchingPage || currentPage <= 0) {
        return;
    }
    searchingPage = true;

    // Search the previous page which should be cached
    currentPage--;
    await search({}, currentPage, pageItems);

    // Number of items on the page
    updatePageItemCount();

    // End search
    searchingPage = false;
});

/**
 * @typedef {Object} SearchSettings
 * @property {?Array<Number>} numberTasksValues Total number of each
 * corresponding task type
 * @property {?('index' | 'hex' | 'recent')} inputType Detected type of search
 * for requirement by either index, hex, or recent
 * @property {?Array<String>} taskCycle Types of tasks to cycle through
 * @property {?Number} taskCycleIndex Current task type index of
 * taskCycle array
 * @property {?Array<Number>} taskIndices Number of tasks left to search for
 * each corresponding task type index
 */

/**
 * @typedef {Object} Task
 * @property {String} managerAddress Address of the task manager
 * @property {String} taskHash Hash of the task
 * @property {?('h' | 'dh' | 'v')} typeId Type of task identifier
 * @property {?('h' | 'dh' | 'v')} typeIndex Index of task type in ordered task
 * list
 * @property {BigInt} reward Task completion reward
 * @property {BigInt} deadline Task deadline in seconds since epoch
 * @property {Boolean} taskComplete Whether the task has been completed
 * @property {Number} index Index of task for a fixed task type
 */

/**
 * Gets at most 10 of the next page of tsak items given the search settings
 * @param {SearchSettings} searchSettings Settings used to initialize search
 * starting from a specific point in the blockchain
 * @param {number} searchPage Search page index
 * @param {Object} searchItems Task search items list and next page
 * search settings for search pages
 * @param {Array<Object>} searchItems.items List of 10 task search items
 * @param {Array<Object>} searchItems.nextPageSettings List of search settings
 * on a given page as a starting search point for the next page
 */
async function search(searchSettings, searchPage, searchItems) {

    // If search string empty, then search recent, otherwise search text value
    const searchText = searchInput.value;
    if (searchText === "") {
        requirementsContainer.textContent = `Searching recent`;
    } else {
        requirementsContainer.textContent = `Searching "${searchText}"`;
    }

    // Array of up to 10 requirement items
    const searchPageData = await searchPageResults(
        searchText,
        searchPage,
        searchItems,
        searchSettings
    );
    let results = searchPageData.results;
    searchSettings = searchPageData.searchSettings;

    // Cache search data and for next page search settings
    pageItems.nextPageSettings[searchPage] = searchSettings;

    // Cache search page items
    pageItems.items[searchPage] = results;

    // Updates the retrieved items onto the page
    updatePageResults(results);
}

/**
 * Gets the tasks data results for the given page using possible caching with
 * the search items
 * @param {Number} searchPage Page index for search
 * @param {Object} searchItems Task search items list and next page search
 * settings for search pages
 * @param {Array<Object>} searchItems.items List of 10 task search items
 * @param {Array<Object>} searchItems.nextPageSettings List of search settings
 * @param {SearchSettings} searchSettings Search settings of next page where
 * previous page left off
 * @returns {Array<Requirement>} return.results Array of maximum first 10
 * tasks found in the page search
 * @returns {SearchSettings} return.searchSettings Search settings of next page
 * where previous page left off
 */
async function searchPageResults(
    searchText,
    searchPage,
    searchItems,
    searchSettings
) {

    // Task data objects list
    let results = [];

    // If search page is cached, then use the cache value, otherwise search
    // the blockchain
    if (searchPage in searchItems.items) {
        results = searchItems.items[searchPage];
        searchSettings = searchItems.nextPageSettings[searchPage]
    } else {

        // Iterate 10 items or until everything searched
        for (let i = 0; i < 10; i++) {

            // Search next task item for result
            const result = await searchNext(searchText, searchSettings);

            // If a complete task is skipped and there are no more tasks of that
            // type, then cycle to the next available task
            if (result !== null
                && result.task === undefined
                && result.inputType === "recent"
                && !result.taskIndices.every(element => element === -1)
            ) {

                // Cycle through all task types and break when a task type has
                // tasks available
                searchSettings.typeIndex = cycleTaskIndex(
                    searchSettings.typeIndex,
                    searchSettings.taskIndices
                );
                i--;
                continue;
            }

            // If result is null, then done searching page and update end of
            // search values
            if (result === null || result.task === undefined) {
                searchSettings = null;
                maxSearchItems = currentPage * 10 + i;
                break;
            }

            // Add task if it should not be skipped
            const skipTask =
                (
                    result.task.taskComplete
                    || pastDeadline(result.task.deadline)
                )
                && isHideCompletedTasksChecked;
            if (!skipTask) {
                results.push(result.task);
            } else {

                // Decrement page item index so full 10 items can be displayed
                i--;
            }

            // If an invalid task id input is given, then end search
            if ("isValidTaskId" in result && result.isValidTaskId) {
                searchSettings = null;
                maxSearchItems = currentPage * 10 + i + 1;
                break;
            }

            // Initialize search settings with task result data
            searchSettings = {
                numberTasksValues: result.numberTasksValues,
                taskIndices: result.taskIndices,
                inputType: result.inputType,
                typeIndex: result.typeIndex
            };

            // If there are no tasks left of any size, then finish search
            if (result.taskIndices.every(element => element === -1)) {
                searchSettings = null;
                maxSearchItems = currentPage * 10 + i;
                break;
            }

            // If a task has not been skipped and the input type is recent or
            // hex, then cycle to the next available task type
            let taskCycleIndex = result.typeIndex;
            if (!skipTask
                && (result.inputType === "recent" || result.inputType === "hex")
            ) {

                // Cycle through all task types and break when a task type has
                // tasks available
                taskCycleIndex = cycleTaskIndex(
                    taskCycleIndex,
                    result.taskIndices
                );
            }
            if (result.inputType !== "index") {
                searchSettings.typeIndex = taskCycleIndex;
            }

            // Update search settings with data from result
            searchSettings.taskIndices[result.typeIndex]--;
        }
    }

    // Return requirement data after finding 10 items or finished searching
    return {
        results: results,
        searchSettings: searchSettings
    };
}

/**
 * Updates the requirements list in the page
 * @param {Array<Task>} results Array of task data
 */
function updatePageResults(results) {

    // Reset the requirements items container then iteratively add each item
    requirementsContainer.textContent = "";
    results.forEach((searchResult, i) => {

        // Create requirement item with retrieved data
        const searchItem = itemTemplate.content.cloneNode(true);
        searchItem.querySelector('#task-id').textContent
            = `${searchResult.typeId}-${searchResult.index}`;
        searchItem.querySelector('#item-hash').textContent
            = `Hash: ${searchResult.taskHash}`;
        searchItem.querySelector('#manager-hex').textContent
            = `Manager Address: ${searchResult.managerAddress}`;
        searchItem.querySelector('#reward').textContent
            = `Reward: ${formatWei(searchResult.reward)} (Wei)`;
        searchItem.querySelector('#deadline').textContent
            = `Deadline (UTC): ${formatBlockTimestamp(searchResult.deadline)}`;
        searchItem.querySelector('#completed').textContent = `Task Complete: `
            + `${searchResult.taskComplete.toString().toUpperCase()}`;
        searchItem.querySelector('#view-button').id
            = `view-button-${i}`;
        searchItem.querySelector(`#view-button-${i}`)
            .addEventListener("click", () => {
                let taskRedirectPage;
                if (searchResult.typeId === "h") {
                    taskRedirectPage = "hashTask/hashTask";
                } else if (searchResult.typeId === "dh") {
                    taskRedirectPage = "doubleHashTask/doubleHashTask";
                } else if (searchResult.typeId === "v") {
                    taskRedirectPage = "validatorTask/validatorTask";
                }
                window.location.href = `pages/${taskRedirectPage}.html?id=`
                    + `${searchResult.typeId}-${searchResult.index}`;
            });
        requirementsContainer.appendChild(searchItem);
    });

    // If there are no matching items found, then display message
    if (results.length === 0) {
        requirementsContainer.textContent = "No results match search criteria";
    }
}

/**
 * Searches for the next search input matching task starting from the given
 * search settings point
 * @param {String} searchInput Search input text
 * @param {SearchSettings} searchSettings Settings used to initialize search
 * starting from a specific point in the blockchain
 * @returns {?Task} Task found in search by given search text
 */
async function searchNext(searchInput, searchSettings) {

    // Whether search input format follows valid search types
    let isValidTypeId;
    let isValidTaskId;
    let isValidHex;
    let isValidRecent;

    // Search settings variables
    let numberTasksValues;
    let taskIndices;
    let searchHex;
    let typeIndex;

    // Get the indices of each task type if cached
    if ("taskIndices" in searchSettings) {
        taskIndices = searchSettings.taskIndices;
    }

    // Get number of tasks if not already cached
    if ("numberTasksValues" in searchSettings) {
        numberTasksValues = searchSettings.numberTasksValues;
    } else {
        numberTasksValues = [
            Number(await hashTaskContract.tasksCount()),
            Number(await doubleHashTaskContract.tasksCount()),
            Number(await validatorTaskContract.tasksCount())
        ];
    }

    // Obtain the search validation of the parsed search text and corresponding
    // possible typeId, taskId, and hex data
    const searchValidationData = await getValidSearchTypes(
        searchInput,
        searchSettings,
        numberTasksValues
    );

    // Update variables with the retrieved data
    isValidTypeId = searchValidationData.isValidTypeId;
    isValidTaskId = searchValidationData.isValidTaskId;
    isValidHex = searchValidationData.isValidHex;
    isValidRecent = searchValidationData.isValidRecent;
    typeIndex = searchValidationData.typeIndex;
    taskIndices = searchValidationData.taskIndices;
    if (isValidHex) {
        searchHex = searchValidationData.searchHex;
    }

    // If is valid search by index or version index, then get specific
    // requirement item, otherwise search by index if valid hex
    if (isValidTypeId || isValidTaskId || isValidRecent) {

        // Search a specific requirement version
        return await searchByIndexVersion(
            isValidRecent,
            isValidTaskId,
            taskIndices,
            numberTasksValues,
            typeIndex
        );
    } else if (isValidHex) {

        // Search a requirement by hex value
        return await searchByHex(
            searchHex,
            taskIndices,
            numberTasksValues,
            typeIndex
        );
    }

    // If no item found, return null
    return null;
}

/**
 * Given the search input and search data, determine the parsed search type, and
 * corresponding values
 * @param {String} searchInput Text input to search
 * @param {SearchSettings} searchSettings Settings used to initialize search
 * starting from a specific point in the blockchain
 * @param {Number} numberTasksValues Total number of each type of task
 * @returns {?Object} Valid types and possible corresponding values
 * @returns {boolean} return.isValidTypeId Search input parses to a valid type
 * @returns {boolean} return.isValidTaskId Whether search input parses to a
 * valid task ID
 * @returns {boolean} return.isValidHex Search input parses to a valid hex
 * @returns {boolean} return.isValidRecent Search input is empty to search for
 * recent
 * @returns {?String} return.typeId Search task type if valid
 * @returns {?Number} return.taskIndices Search task indices for each task type
 * if valid
 * @returns {?Number} return.numberTasksValues Total number of each type of task
 * @returns {?String} return.searchHex Search hex if valid
 */
async function getValidSearchTypes(
    searchInput,
    searchSettings,
    numberTasksValues
) {

    // Search text valid types
    let isValidTypeId = false;
    let isValidTaskId = false;
    let isValidHex = false;
    let isValidRecent = false;

    // Values parsed from type
    let typeIndex = null;
    let taskIndices = [null, null, null];
    let searchHex = null;

    // Get the search type of index, hex, or recent if not cached
    if (!("inputType" in searchSettings)) {

        // If search text is empty then search recent, otherwise parse search
        // input type
        if (searchInput === "") {
            isValidRecent = true;
            isValidTypeId = false;
            taskIndices = numberTasksValues.map(i => i - 1);
            typeIndex = 0;
        } else {

            // Determine if search input is a valid task type
            isValidTypeId = searchInput === "h"
                || searchInput === "dh"
                || searchInput === "v";

            // Determine if search input is valid task ID
            isValidTaskId = searchInput.includes("-");

            // Get task type and/or index from task ID
            if (isValidTaskId) {

                // Get the task type and index from the task ID
                typeIndex = taskCycle.indexOf(
                    searchInput.substring(0, searchInput.indexOf("-"))
                );
                taskIndices[typeIndex] = Number(
                    searchInput.substring(searchInput.indexOf("-") + 1)
                );
            } else if (isValidTypeId) {

                // Get the task type index from the task ID
                typeIndex = taskCycle.indexOf(searchInput);
            }

            // Validate task index bounds
            isValidTaskId = isValidTaskId
                && Number.isInteger(taskIndices[typeIndex])
                && 0 <= taskIndices[typeIndex]
                && taskIndices[typeIndex] < numberTasksValues[typeIndex];

            // Determine if search input is valid hex, and extract raw hex
            // characters if true
            isValidHex = prefixHexBytes(searchInput) !== null
                && prefixHexBytes(searchInput).length <= 66;
            if (isValidHex) {
                searchHex = prefixHexBytes(searchInput).substring(2);
                typeIndex = 0;
            }

            // Initialize task indices if not already initialized
            if (isValidTypeId) {
                taskIndices[typeIndex] = numberTasksValues[typeIndex] - 1;
            } else if (isValidHex) {
                taskIndices = numberTasksValues.map(i => i - 1);
            }
        }
    } else if (searchSettings.inputType === "index") {

        // If index search type is cached, set search text only to valid index
        isValidTypeId = true;
        isValidHex = false;
        isValidRecent = false;
        taskIndices = searchSettings.taskIndices;
        typeIndex = searchSettings.typeIndex;
    } else if (searchSettings.inputType === "hex") {

        // If hex search type is cached, set search text to only valid hex
        isValidTypeId = false;
        isValidHex = true;
        isValidRecent = false;
        taskIndices = searchSettings.taskIndices;
        typeIndex = searchSettings.typeIndex;

        // Clean the "0x" from the search input
        searchHex = prefixHexBytes(searchInput).substring(2);
    } else if (searchSettings.inputType === "recent") {

        // If recent type is cached set is recent flag to true
        isValidTypeId = false;
        isValidHex = false;
        isValidRecent = true;
        taskIndices = searchSettings.taskIndices;
        typeIndex = searchSettings.typeIndex;

        // Validate there exists tasks to search for recent
        if (taskIndices.every(element => element === -1)) {
            isValidRecent = false;
        }
    }

    // Return search input validations and possible corresponding values
    return {
        isValidTypeId: isValidTypeId,
        isValidTaskId: isValidTaskId,
        isValidHex: isValidHex,
        isValidRecent: isValidRecent,
        taskIndices: taskIndices,
        typeIndex: typeIndex,
        searchHex: searchHex,
        numberTasksValues: numberTasksValues
    }
}

/**
 * Searches for the given requirement index and version, and if no version is
 * given, then the most recent version is used
 * @param {Boolean} isValidRecent Whether the search is for recent requirements
 * @param {SearchSettings} searchSettings Settings used to initialize search
 * starting from a specific point in the blockchain
 * @param {Number} numberRequirementsValue Total number of requirements
 * @param {Number} index Requirement index
 * @param {Number} indexVersions Number of versions of given requirement
 * @param {?Number} version Specific requirement version for search
 * @param {?Number} isValidIndexVersion Whether search input parses to
 * a valid index version
 * @returns {?Object} Requirement and cache data
 * @returns {?Requirement} return.requirement Requirement data that matches the
 * search index and version
 * @returns {Number} return.versionBlock Blockchain block where given version
 * was found
 * @returns {Number} return.numberRequirementsValue Total number of requirements
 * @returns {Number} return.indexVersions Total number of versions for the given
 * requirement
 * @returns {Number} return.isValidVersionIndex Whether the given search input
 * follows a valid requirement index and version 
 * @returns {'recent' | 'index'} return.inputType Search input type
 */
async function searchByIndexVersion(
    isValidRecent,
    isValidTaskId,
    taskIndices,
    numberTasksValues,
    typeIndex
) {

    // Task variables
    let managerAddress;
    let taskHash;
    let reward;
    let deadline;
    let taskComplete;
    let index = taskIndices[typeIndex];

    // Whether searching by recent
    let inputType;
    if (isValidRecent) {
        inputType = "recent";
    } else {
        inputType = "index";
    }

    // Validate search index, and if out of bounds return null
    if (index < 0 || numberTasksValues[typeIndex] <= index) {
        return {
            numberTasksValues: numberTasksValues,
            taskIndices: taskIndices,
            inputType: inputType,
            typeIndex: typeIndex,
            isValidTaskId: isValidTaskId
        };
    }

    // Get task data from the blockchain
    if (taskCycle[typeIndex] === "h") {
        managerAddress
            = await hashTaskContract.getHashTaskManagerAddress(index);
        taskHash = await hashTaskContract.getHashTaskTaskHash(index);
        reward = await hashTaskContract.getHashTaskTotalWei(index);
        deadline = await hashTaskContract.getHashTaskDeadline(index);
        taskComplete = await hashTaskContract.getHashTaskComplete(index);
    } else if (taskCycle[typeIndex] === "dh") {
        managerAddress = await doubleHashTaskContract
            .getDoubleHashTaskManagerAddress(index);
        taskHash = await doubleHashTaskContract
            .getDoubleHashTaskTaskHash(index);
        reward = await doubleHashTaskContract
            .getDoubleHashTaskTotalWei(index);
        deadline = await doubleHashTaskContract
            .getDoubleHashTaskDeadline(index);
        taskComplete = await doubleHashTaskContract
            .getDoubleHashTaskComplete(index);
    } else if (taskCycle[typeIndex] === "v") {
        managerAddress = await validatorTaskContract.getManagerAddress(index);
        taskHash = await validatorTaskContract.getTaskHash(index);
        reward = await validatorTaskContract.getContributionTotalWei(index);
        deadline = await validatorTaskContract.getDeadline(index);
        taskComplete = await validatorTaskContract.getTaskComplete(index)
            || await validatorTaskContract.taskDefaulted(index);
    } else {
        return null;
    }

    // Return the retrieved information
    return {
        task: {
            managerAddress: managerAddress,
            taskHash: taskHash,
            reward: reward,
            typeId: taskCycle[typeIndex],
            deadline: deadline,
            taskComplete: taskComplete,
            index: index,
        },
        numberTasksValues: numberTasksValues,
        taskIndices: taskIndices,
        inputType: inputType,
        typeIndex: typeIndex,
        isValidTaskId: isValidTaskId
    };
}

/**
 * Sequentially searches for requirements with matching given search hex
 * @param {String} searchHex Hex search input string
 * @param {SearchSettings} searchSettings Settings used to initialize search
 * starting from a specific point in the blockchain
 * @param {Number} numberRequirementsValue Total number of requirements
 * @returns {?Object} Requirement and cache data
 * @returns {?Requirement} return.requirement Requirement data that matches the
 * search hex
 * @returns {Number} return.numberRequirementsValue Total number of requirements
 * @returns {inputType} return.inputType Search input type of "hex"
 */
async function searchByHex(
    searchHex,
    taskIndices,
    numberTasksValues,
    typeIndex
) {

    // Begin by searching by the most updated version of each requirement
    while (!taskIndices.every(i => i === -1)) {
        while (taskIndices[typeIndex] !== -1) {
            let index = taskIndices[typeIndex];
            let managerAddress = "";
            let taskHash = "";
            let reward;
            let deadline;
            let taskComplete

            switch (typeIndex) {

                // Hash task
                case 0:
                    managerAddress = await hashTaskContract
                        .getHashTaskManagerAddress(index);
                    taskHash = await hashTaskContract
                        .getHashTaskTaskHash(index);
                    break;

                // Double hash task
                case 1:
                    managerAddress = await doubleHashTaskContract
                        .getDoubleHashTaskManagerAddress(index);
                    taskHash = await doubleHashTaskContract
                        .getDoubleHashTaskTaskHash(index);
                    break;

                // Validator task
                case 2:
                    managerAddress = await validatorTaskContract
                        .getManagerAddress(index);
                    taskHash = await validatorTaskContract
                        .getTaskHash(index);
                    break;
            }
            if (taskHash.includes(searchHex)
                || managerAddress.includes(searchHex)
            ) {

                switch (typeIndex) {

                    // Hash task
                    case 0:
                        reward = await hashTaskContract
                            .getHashTaskTotalWei(index);
                        deadline = await hashTaskContract
                            .getHashTaskDeadline(index);
                        taskComplete = await hashTaskContract
                            .getHashTaskComplete(index);
                        break;

                    // Double hash task
                    case 1:
                        reward = await doubleHashTaskContract
                            .getDoubleHashTaskTotalWei(index);
                        deadline = await doubleHashTaskContract
                            .getDoubleHashTaskDeadline(index);
                        taskComplete = await doubleHashTaskContract
                            .getDoubleHashTaskComplete(index);
                        break;

                    // Validator task
                    case 2:
                        reward = await validatorTaskContract
                            .getContributionTotalWei(index);
                        deadline = await validatorTaskContract
                            .getDeadline(index);
                        taskComplete = await validatorTaskContract
                            .getTaskComplete(index)
                            || await validatorTaskContract
                                .taskDefaulted(index);
                        break;
                }

                // Return task and search settings data
                return {
                    task: {
                        managerAddress: managerAddress,
                        taskHash: taskHash,
                        reward: reward,
                        typeId: taskCycle[typeIndex],
                        deadline: deadline,
                        taskComplete: taskComplete,
                        index: index,
                    },
                    numberTasksValues: numberTasksValues,
                    taskIndices: taskIndices,
                    inputType: "hex",
                    typeIndex: typeIndex
                };
            }

            // Decrement the task index
            taskIndices[typeIndex] = taskIndices[typeIndex] - 1;
        }

        // Cycle the task type
        typeIndex = (typeIndex + 1) % taskCycle.length;
    }

    // If problem encountered return null
    return null;
}

/**
 * Resets search data, creates a new search, and visually updates search data
 */
async function executeSearch() {

    // Reset search page data
    pageItems = { items: [], nextPageSettings: [] };
    currentPage = 0;
    maxSearchItems = null;

    // Apply new search
    await search({}, currentPage, pageItems);

    // Update search page visuals
    if (currentPage in pageItems.items
        && pageItems.items[currentPage].length > 0
    ) {
        updatePageItemCount();
    }
}

/**
 * If all task count values are found, then the total number of tasks display is
 * updated and search is executed
 */
function updateTotalTaskCount() {
    if (hashTasksCountValue !== undefined &&
        doubleHashTasksCountValue !== undefined &&
        validatorTasksCountValue !== undefined
    ) {
        totalTasksCountValue = hashTasksCountValue
            + doubleHashTasksCountValue + validatorTasksCountValue;
        totalTasksCount.textContent = `Total Tasks Count: `
            + `${totalTasksCountValue}`;
        if (pageSearch === undefined) {
            executeSearch();
        }
    }
}

/**
 * Updates the item display count for the current page
 */
function updatePageItemCount() {
    const pageItemsRemainder
        = ((pageItems.items[currentPage].length - 1) % 10) + 1;
    searchHeader.textContent = `Results ${currentPage * 10 + 1} - `
        + `${currentPage * 10 + pageItemsRemainder}:`;
}

/**
 * Cycle through all task types and break when a task type has tasks available
 * @param {Number} startTypeIndex Index in task cycle to begin
 * @param {Array<Number>} taskIndices Number of tasks available for each task
 * index
 * @returns {Number} Next index with available tasks
 */
function cycleTaskIndex(startTypeIndex, taskIndices) {
    let taskCycleIndex = startTypeIndex;
    const cycleSize = taskCycle.length;
    for (let i = 0; i < cycleSize; i++) {
        taskCycleIndex = (taskCycleIndex + 1) % cycleSize;
        if (taskIndices[taskCycleIndex] !== -1) {
            break;
        }
    }
    return taskCycleIndex;
}

/**
 * Whether the given task deadline is in the past
 * @param {BigInt} deadline Task deadline in seconds since epoch in UTC
 * @returns {Boolean} Whether the deadline is in the past
 */
function pastDeadline(deadline) {
    return deadline < BigInt(Math.floor(new Date().getTime() / 1000));
}
