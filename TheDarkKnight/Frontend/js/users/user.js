import { ethers, isAddress } from "../libs/ethers.min.js"
import * as JSZip from "../libs/jszip.min.js";
import {
    formatWei,
    getButtonRedirectFromEvent,
    isValidRequirement,
    isValidTask,
    loadHeader,
    parseUserData,
    removeClass
} from "../../utils/commonFunctions.js";
import { DOUBLE_HASH_TASK_CONTRACT_ADDRESS, HASH_TASK_CONTRACT_ADDRESS, THE_LIST_CONTRACT_ADDRESS, USERS_CONTRACT_ADDRESS, VALIDATOR_TASK_CONTRACT_ADDRESS } from "../../utils/constants.js";

// Page elements
const userAddress = document.getElementById("user-address");
const userName = document.getElementById("user-name");
const userLinks = document.getElementById("user-links");
const userLockoutCode = document.getElementById("user-lockout-code");
const userActivationStatus = document.getElementById("user-activation-status");
const searchButton = document.getElementById("search-button");
const searchInput = document.getElementById("search-input");
const previousButton = document.getElementById("previous-button");
const nextButton = document.getElementById("next-button");
const searchHeader = document.getElementById("search-header");
const checkbox = document.getElementById("checkbox");
const usersContainer
    = document.getElementById("user-interactions-rows-container");
const userItemTemplate
    = document.getElementById("user-interaction-item-template");
const noUserDataFoundText = document.getElementById("no-user-defined-data-found");
const minimumCommissionText = document.getElementById("minimum-commission");
const ethicsRequirementsStandardsText = document.getElementById("ethics-requirements-standards");
const workerTasksText = document.getElementById("worker-tasks");
const managerTasksText = document.getElementById("manager-tasks");
const validatorTasksText = document.getElementById("validator-tasks");
const validationRequirementWhitelistText = document.getElementById("validation-requirement-whitelist");
const availableValidationTimeText = document.getElementById("available-validation-time");
const userDataErrorText = document.getElementById("user-defined-data-error");

// Load the header button navigation functionality
loadHeader();

// Get all contracts
const usersContractAddress = USERS_CONTRACT_ADDRESS;
const provider = new ethers.BrowserProvider(window.ethereum);
const usersAbi = await fetch('./data/abi/usersAbi.json');
const usersJson = await usersAbi.json();
const usersContract
    = new ethers.Contract(usersContractAddress, usersJson.abi, provider);
const theListContractAddress = THE_LIST_CONTRACT_ADDRESS;
const theListAbi = await fetch('./data/abi/theListAbi.json');
const theListJson = await theListAbi.json();
const theListContract
    = new ethers.Contract(theListContractAddress, theListJson.abi, provider);
const hashTaskContractAddress = HASH_TASK_CONTRACT_ADDRESS;
const hashTaskAbi = await fetch('./data/abi/hashTaskAbi.json');
const hashTaskJson = await hashTaskAbi.json();
const hashTaskContract
    = new ethers.Contract(hashTaskContractAddress, hashTaskJson.abi, provider);
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
const minimumBlockNumber = 1;
const contractCycle = [
    'Users', 'TheList', 'HashTask', 'DoubleHashTask', 'ValidatorTask'
];
const contracts = [
    usersContract,
    theListContract,
    hashTaskContract,
    doubleHashTaskContract,
    validatorTaskContract
];
let pageItems = { items: [], nextPageSettings: [] };
let currentPage = 0;
let maxSearchItems = null;
let searchingPage = false;
let showOnlyUserInitiatedCalls = false;
let userLinksValue;
let userNameValue;
let userLockoutCodeValue;
let userActivationStatusValue;
let overrideCurrentUserFilter = false;

// If user address not in URL, redirect to 
const url = new URL(window.location.href);
const params = Object.fromEntries(url.searchParams.entries());
const userAddressValue = params.address;
if (params.search !== undefined) {
    searchInput.value = params.search;
}
if (userAddressValue == undefined || !isAddress(userAddressValue)) {
    window.location.href = 'pages/users/viewUsers.html';
} else {
    userAddress.textContent = `User Address:\r\n${userAddressValue}`;
    executeSearch();
}

// Update user variables with data retrieved from the blockchain
usersContract.usersData(userAddressValue).then((d) => {
    userNameValue = parseUserData(d).data;
    userName.textContent = `User Name: ${userNameValue}`;
});
usersContract.links(userAddressValue).then((l) => {
    userLinksValue = l;
    userLinks.textContent = `User Links: ${userLinksValue}`;
    tryLoadUserDefinedData(userLinksValue);
});
usersContract.lockoutCodes(userAddressValue).then((l) => {
    userLockoutCodeValue = l;
    userLockoutCode.textContent = `Lockout Code: ${userLockoutCodeValue}`;
});
usersContract.activationStatus(userAddressValue).then((a) => {
    userActivationStatusValue = getActivationStatusText(Number(a));
    userActivationStatus.textContent
        = `Activation Status: ${userActivationStatusValue}`;
});

// Toggle the button to show only calls initiated by the user
checkbox.addEventListener("click", () => {
    if (showOnlyUserInitiatedCalls) {
        checkbox.textContent = "";
    } else {
        checkbox.textContent = "✓";
    }
    showOnlyUserInitiatedCalls = !showOnlyUserInitiatedCalls;
    executeSearch();
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
 * @property {?Array<Number>} blockIndices Index of the block to search next in
 * the blockchain for the contract at the corresponding contract cycle index
 * @property {?Array<Number>} eventIndices Index of the event to search next in
 * the block for the contract at the corresponding contract cycle index
 * @property {?Number} contractCycleIndex Index in the contract cycle array to
 * search for the corresponding contract
 */

/**
 * @typedef {Object} UserInteraction
 * @property {
 * 'Users'
 * | 'TheList'
 * | 'HashTask'
 * | 'DoubleHashTask'
 * | 'ValidatorTask'
 * } contractType Contract name of the event
 * @property {String} initiatorAddress Address of the user that initiated the
 * contract call
 * @property {Number} blockIndex Block index of the emitted event
 * @property {String} blockTimestamp Block timestamp of the emitted event
 * @property {String} eventName Name of the emitted event
 * @property {Array<String>} eventParameterNames An array of the event parameter
 * names corresponding to the eventParameterValues
 * @property {Array<Object>} eventParameterValues An array of the event
 * parameter values emitted by the user interaction event corresponding to the
 * eventParameterNames
 */

/**
 * Gets at most 10 of the next page of requirement items given the search
 * settings
 * @param {SearchSettings} searchSettings Settings used to initialize search
 * starting from a specific point in the blockchain
 * @param {number} searchPage Search page index
 * @param {Object} searchItems Requirement search items list and next page
 * search settings for search pages
 * @param {Array<Object>} searchItems.items List of 10 user interaction search
 * items
 * @param {Array<Object>} searchItems.nextPageSettings List of search settings
 * on a given page as a starting search point for the next page
 */
async function search(searchSettings, searchPage, searchItems) {

    // Search by the recent user interactions with any search filters
    const searchText = searchInput.value;
    if (searchText === "") {
        usersContainer.textContent = `Searching recent`;
    } else {
        usersContainer.textContent = `Searching "${searchText}"`;
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
 * Gets the user interactions data results for the given page using possible
 * caching with the search items
 * @param {Number} searchPage Page index for search
 * @param {Object} searchItems User search items list and next page search
 * settings for search pages
 * @param {Array<Object>} searchItems.items List of 10 user interaction search
 * items
 * @param {Array<Object>} searchItems.nextPageSettings List of search settings
 * @param {SearchSettings} searchSettings Search settings of next page where
 * previous page left off
 * @returns {Array<UserInteraction>} return.results Array of maximum first 10
 * user interactions found in the page search
 * @returns {SearchSettings} return.searchSettings Search settings of next page
 * where previous page left off
 */
async function searchPageResults(
    searchText,
    searchPage,
    searchItems,
    searchSettings
) {

    // User data objects list
    let results = [];

    // If search page is cached, then use the cache value, otherwise search
    // the blockchain
    if (searchPage in searchItems.items) {
        results = searchItems.items[searchPage];
        searchSettings = searchItems.nextPageSettings[searchPage]
    } else {

        // Iterate 10 items or until everything searched
        for (let i = 0; i < 10; i++) {

            // Search next user item for result
            const result = await searchNext(searchText, searchSettings);

            // If result is null, then done searching page and update end of
            // search values
            if (result === null) {
                searchSettings = null;
                maxSearchItems = currentPage * 10 + i;
                break;
            }

            // Add result and initialize search settings for next item
            results.push(result.userInteraction);
            searchSettings = {
                blockIndices: result.blockIndices,
                eventIndices: result.eventIndices,
                contractCycleIndex: result.contractCycleIndex
            };
        }
    }

    // Return user data after finding 10 items or finished searching
    return {
        results: results,
        searchSettings: searchSettings
    };
}

/**
 * Updates the user interactions list on the page
 * @param {Array<UserInteraction>} results Array of user interaction data
 */
function updatePageResults(results) {

    // Reset the requirements items container then iteratively add each item
    usersContainer.textContent = "";
    results.forEach((searchResult, i) => {

        // Create user item with retrieved data
        const searchItem = userItemTemplate.content.cloneNode(true);
        searchItem.querySelector('#contract-type').textContent
            = `${searchResult.contractType}`;
        searchItem.querySelector('#event-data').textContent
            = `Contract Initiator Address: ${searchResult.initiatorAddress}\r\n`
            + `Block Index: ${searchResult.blockIndex}\r\n`
            + `Block Timestamp (UTC): ${new Date(
                Number(searchResult.blockTimestamp) * 1000
            ).toUTCString()}`
            + `\r\n\r\n${searchResult.eventName}\r\n${getEventDataString(
                searchResult.eventParameterNames,
                searchResult.eventParameterValues
            )}`;
        searchItem.querySelector('#view-button').textContent
            = `View Item`;
        searchItem.querySelector('#view-button').id = `view-button-${i}`;

        // Get the button link and button text
        const redirectButton = getButtonRedirectFromEvent(
            searchResult.contractType,
            searchResult.eventName,
            searchResult.eventParameterValues
        );

        // Set the button name and link
        if (redirectButton !== null) {
            removeClass(searchItem.querySelector(`#view-button-${i}`), "hide");
            searchItem.querySelector(`#view-button-${i}`).textContent
                = redirectButton.redirectText;
            searchItem.querySelector(`#view-button-${i}`)
                .addEventListener("click", () => {
                    window.location.href = redirectButton.redirectPath;
                });
        }
        usersContainer.appendChild(searchItem);
    });

    // If there are no matching items found, then display message
    if (results.length === 0) {
        usersContainer.textContent = "No results match search criteria";
    }
}

/**
 * Searches for the next search input matching user interaction starting from
 * the given search settings point
 * @param {string} searchInput Search input text
 * @param {SearchSettings} searchSettings Settings used to initialize search
 * starting from a specific point in the blockchain
 * @returns {?Object} User interaction and cache data
 * @returns {?UserInteraction} return.userInteraction User interaction data that
 * matches the search input
 * @returns {Array<Number>} return.blockIndices Block indices on the blockchain
 * of the next block search index of corresponding contract types
 * @returns {Array<Number>} return.eventIndices Event indices in the block of
 * the next block search index of corresponding contract types
 * @returns {Number} return.contractCycleIndex Index of the current contract
 * event in the cycle of contracts
 */
async function searchNext(searchInput, searchSettings) {

    // Search a user interaction from a point in the blockchain defined in the
    // search settings, while filtering using the given search input
    return await searchByMatch(
        searchSettings,
        searchInput
    );
}

/**
 * Sequentially searches for user interactions with matching given search input
 * @param {SearchSettings} searchSettings Settings used to initialize search
 * starting from a specific point in the blockchain
 * @param {String} searchInput Search input string
 * @returns {?Object} User interaction and cache data
 * @returns {?UserInteraction} return.userInteraction User interaction data that matches
 * the search input
 * @returns {Array<Number>} return.blockIndices Block indices on the blockchain
 * of the next block search index of corresponding contract types
 * @returns {Array<Number>} return.eventIndices Event indices in the block of
 * the next block search index of corresponding contract types
 * @returns {Number} return.contractCycleIndex Index of the current contract
 * event in the cycle of contracts
 */
async function searchByMatch(searchSettings, searchInput) {

    // Get max blockchain block index if not already cached
    let blockIndices;
    if ("blockIndices" in searchSettings) {
        blockIndices = searchSettings.blockIndices;
    } else {
        blockIndices = new Array(5).fill(
            Number(await provider.getBlockNumber())
        );
    }

    // Get the event index to search within a block
    let eventIndices;
    if ("eventIndices" in searchSettings) {
        eventIndices = searchSettings.eventIndices;
    } else {
        eventIndices = new Array(5).fill(-1);
    }

    // Get the event index to search within a block
    let contractCycleIndex;
    if ("contractCycleIndex" in searchSettings) {
        contractCycleIndex = searchSettings.contractCycleIndex;
    } else {
        contractCycleIndex = 0;
    }



    // Get a list of each of the search words and format them
    let words = searchInput
        .trim()
        .split(/\s+/)
        .map(word => word.toLowerCase());

    // Check override secret input
    if (words.length > 0 && words[0] === "overridecurrentuserfilter") {
        overrideCurrentUserFilter = true;
        words = words.slice(1);
    } else {
        overrideCurrentUserFilter = false;
    }

    while (blockIndices.some(blockIndex => blockIndex > minimumBlockNumber)) {

        // If the current contract-block search index is less than the minimum
        // search block index, then continue searching other contracts 
        if (blockIndices[contractCycleIndex] < minimumBlockNumber) {
            contractCycleIndex
                = blockIndices.indexOf(Math.max(...blockIndices));
            continue;
        }

        // Get all events in the index corresponding to the current contract
        let events = await contracts[contractCycleIndex].queryFilter(
            "*",
            blockIndices[contractCycleIndex],
            blockIndices[contractCycleIndex]
        );

        // If no events are found in this block, then iterate to next contract
        // search
        if (events.length === 0) {
            contractCycleIndex = await iterateEventSearch(
                null,
                blockIndices,
                eventIndices,
                contractCycleIndex,
                true
            );
            continue;
        }

        // If the given event index is -1, then start event search at the end of
        // the block
        if (eventIndices[contractCycleIndex] === -1) {
            eventIndices[contractCycleIndex] = events.length - 1;
        }

        // Iterate over the events from last event in the block to the first
        for (let i = eventIndices[contractCycleIndex]; i >= 0; i--) {

            // Get the event data
            const eventName = events[i].fragment.name;
            const parameterNames
                = events[i].fragment.inputs.map(input => input.name);
            const parameterValues = events[i].args;
            const initiator = (await provider.getTransaction(
                events[i].transactionHash
            )).from;

            // If the event was not emitted by the user address while the "show
            // only user initiated contract calls" is selected then skip event
            if (showOnlyUserInitiatedCalls && initiator !== userAddressValue) {
                continue;
            }

            // Only search this block event if it has the current user in the
            // initiator address, data, or data within an array
            const userAddressToLower = userAddressValue.toLowerCase();
            if (!initiator.toLowerCase().includes(userAddressToLower)
                && !parameterValues.some(
                    parameterValue =>
                        parameterValue
                            .toString()
                            .toLowerCase()
                            .includes(userAddressToLower)
                )
                && !parameterValues.some(
                    parameterValue => (
                        parameterValue.some !== undefined
                        && parameterValue.some(
                            arrayValue =>
                                arrayValue
                                    .toString()
                                    .toLowerCase()
                                    .includes(userAddressToLower)
                        )
                    )
                )
            ) {
                if (!overrideCurrentUserFilter) {
                    continue;
                }
            }

            // If the user has a search input, then filter the event by the
            // search parameter and event data
            if (searchInput !== "") {

                // Only include event if all words in the search input exist in
                // the event, where a word is text separated by a space
                let allWordsMatch = true;

                // Iterate over all words, standardize all words and data to
                // lowercase, and check that all words exist in either the the
                // event name, initiator address, contract name, parameter name,
                // parameter value, or data in an array
                for (let j = 0; j < words.length; j++) {
                    let word = words[j].toLowerCase();
                    if (eventName.toLowerCase().includes(word)
                        || initiator.toLowerCase().includes(word)
                        || contractCycle[contractCycleIndex]
                            .toLowerCase().includes(word)
                        || parameterNames.some(
                            parameterName => parameterName
                                .toLowerCase()
                                .includes(word)
                        )
                        || parameterValues.some(
                            parameterValue => parameterValue
                                .toString()
                                .includes(word)
                        )
                        || parameterValues.some(
                            parameterValue => (
                                parameterValue.some !== undefined
                                && parameterValue.some(
                                    arrayValue =>
                                        arrayValue
                                            .toString()
                                            .toLowerCase()
                                            .includes(userAddressToLower)
                                )
                            )
                        )
                    ) {
                        continue;
                    } else {
                        allWordsMatch = false;
                        break;
                    }
                }

                // If all words do not match, then skip the event
                if (!allWordsMatch) {
                    continue;
                }
            }

            // Get event data
            const eventBlockIndex = blockIndices[contractCycleIndex];
            const eventContractName = contractCycle[contractCycleIndex];
            const blockTimestamp
                = (await provider.getBlock('latest')).timestamp;

            // Update the block search settings to return for the next search
            // item 
            contractCycleIndex = await iterateEventSearch(
                events,
                blockIndices,
                eventIndices,
                contractCycleIndex,
                false
            );

            // Return the collected data
            return {
                userInteraction: {
                    contractType: eventContractName,
                    initiatorAddress: initiator,
                    blockIndex: eventBlockIndex,
                    blockTimestamp: blockTimestamp,
                    eventName: eventName,
                    eventParameterNames: parameterNames,
                    eventParameterValues: parameterValues,
                },
                blockIndices: blockIndices,
                eventIndices: eventIndices,
                contractCycleIndex: contractCycleIndex
            }
        }

        // Update the block search settings and search next contract block
        contractCycleIndex = await iterateEventSearch(
            events,
            blockIndices,
            eventIndices,
            contractCycleIndex,
            true
        );
    }

    // If there are no other events then return null
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
 * Updates the item display count for the current page
 */
function updatePageItemCount() {
    const pageItemsRemainder
        = ((pageItems.items[currentPage].length - 1) % 10) + 1;
    searchHeader.textContent = `Results ${currentPage * 10 + 1} - `
        + `${currentPage * 10 + pageItemsRemainder}:`;
}

/**
 * Returns the text of the activation status given the enum number
 * @param {0 | 1 | 2} enumValue User activation status enum number
 * @returns {?String} Activation status text
 */
function getActivationStatusText(enumValue) {
    if (enumValue === 0) {
        return "Unactivated";
    } else if (enumValue === 1) {
        return "Activated";
    } else if (enumValue === 2) {
        return "Deactivated";
    }
    return null;
}

/**
 * 
 * @param {Array<String>} eventParameterNames Contract event parameter names
 * @param {Array<Object>} eventParameterValues Contract event parameter
 * values
 * @returns {String} Stringified display of the contract event parameter
 * names and values
 */
function getEventDataString(eventParameterNames, eventParameterValues) {
    let stringBuilder = "";
    for (let i = 0; i < eventParameterNames.length; i++) {
        stringBuilder
            += `${eventParameterNames[i]}: ${eventParameterValues[i]}\r\n`
    }
    return stringBuilder;
}

/**
 * The iteration from the current contract-block search to the next contract
 * block search is transitioned, the current contract search event index and
 * block index are updated, and the new contractCycleIndex value is returned
 * @param {Array<Event>} events Currently searched array of events
 * @param {Array<Number>} blockIndices Current block search indices for each
 * contract
 * @param {Array<Number>} eventIndices Current event search indices for each
 * contract
 * @param {Number} contractCycleIndex Current value for the index of the
 * contractCycle array
 * @param {Boolean} resetEventIndex Whether to reset the event index to -1
 * @returns {Number} contractCycleIndex Updated value to use for the index
 * contractCycle array
 */
async function iterateEventSearch(
    events,
    blockIndices,
    eventIndices,
    contractCycleIndex,
    resetEventIndex
) {

    // If no events exist in the currently searched contract-block, then set the
    // block index for the current contract to use the last interaction block
    // index value at the current block
    if (events === null) {
        const currentBlock = blockIndices[contractCycleIndex];
        blockIndices[contractCycleIndex]
            = Number(
                await contracts[contractCycleIndex].lastInteractionBlockIndex(
                    { blockTag: blockIndices[contractCycleIndex] }
                )
            );

        // To prevent getting stuck on the same block, iterate to the previous
        // block index if needed, then reset the event index for the current
        // contract and update the next contract index to search
        if (blockIndices[contractCycleIndex] === currentBlock) {
            blockIndices[contractCycleIndex]--;
        }
        eventIndices[contractCycleIndex] = -1;
        contractCycleIndex
            = blockIndices.indexOf(Math.max(...blockIndices));
        return contractCycleIndex;
    } else {

        // If there are more contract events in the current block to be
        // searched, then go to the previous event in the same contract search,
        // otherwise update the contract block search to the last interaction
        // block index of the first contract event and cycle to the next
        // contract to search
        eventIndices[contractCycleIndex]--;
        if (eventIndices[contractCycleIndex] < 0) {
            eventIndices[contractCycleIndex] = -1;
            const firstEventValues = events[0].args;
            blockIndices[contractCycleIndex] = Number(
                firstEventValues[firstEventValues.length - 1]
            );
            contractCycleIndex
                = blockIndices.indexOf(Math.max(...blockIndices));
            return contractCycleIndex;
        }
    }

    // If the event index should be reset, then reset it and go to the next
    // contract to search
    if (resetEventIndex) {
        const firstEventValues = events[0].args;
        blockIndices[contractCycleIndex] = Number(
            firstEventValues[firstEventValues.length - 1]
        );
        eventIndices[contractCycleIndex] = -1;
        contractCycleIndex
            = blockIndices.indexOf(Math.max(...blockIndices));
    }
    return contractCycleIndex;
}

/**
 * Try to get user defined JSON file from any user links hosted by the user, and
 * if a file is found, then update the view with the data, otherwise display a
 * not found message
 * @param {Array<String>} userLinksValue Array of user links
 */
async function tryLoadUserDefinedData(userLinksValue) {
    const commaSplittedList = userLinksValue.split(",");
    let userDefinedDataJson;
    for (let i = 0; i < commaSplittedList.length; i++) {
        try {
            const userDefinedDataUrl = new URL(
                `${commaSplittedList[i]}/UserDefinedData.json`
            );
            const userDefinedDataResponse = await fetch(userDefinedDataUrl);
            userDefinedDataJson = await userDefinedDataResponse.json();
            break;
        } catch (e) { console.log(e); }
    }
    if (userDefinedDataJson !== undefined) {
        updateUserDefinedData(userDefinedDataJson);
    } else {
        userDataErrorText.textContent
            = "User data resource not found at any user links endpoints";
    }
}

/**
 * Update the view with formatted data retrieved from expected JSON keys:
 * minimumCommission, ethicsRequirementsStandards, workerTasks, managerTasks,
 * validatorTasks, validationRequirementsWhitelist, availableValidationTime
 * Display message if no data parsed
 * @param {Object} userDefinedDataJson Data retrieved from user defined data
 * with expected JSON keys: minimumCommission, ethicsRequirementsStandards,
 * workerTasks, managerTasks, validatorTasks, validationRequirementsWhitelist,
 * availableValidationTime
 */
function updateUserDefinedData(userDefinedDataJson) {

    // Keep track of whether any data has been successfully parsed
    let anyUserDefinedDataFound = false;

    // Format each JSON key data respective to its type and purpose
    if ("minimumCommission" in userDefinedDataJson) {
        const minimumCommissionValue = userDefinedDataJson.minimumCommission;
        if (Number.isInteger(minimumCommissionValue)
            && minimumCommissionValue >= 0
        ) {
            minimumCommissionText.textContent = `Minimum Commission: `
                + `${formatWei(minimumCommissionValue)} Wei`;
            removeClass(minimumCommissionText, "hide");
            anyUserDefinedDataFound = true;
        }
    }
    if ("ethicsRequirementsStandards" in userDefinedDataJson) {
        const standardsValue
            = userDefinedDataJson.ethicsRequirementsStandards;
        if (Array.isArray(standardsValue)
            && standardsValue.every(s => typeof s === "string")
        ) {
            const ethicsListString = standardsValue
                .reduce((acc, curr) => {
                    return acc + "\r\n" + curr;
                },
                    `Ethics Requirements Standards:`
                );
            ethicsRequirementsStandardsText.textContent = ethicsListString;
            removeClass(ethicsRequirementsStandardsText, "hide");
            anyUserDefinedDataFound = true;
        }
    }
    if ("workerTasks" in userDefinedDataJson) {
        const workerTasks = userDefinedDataJson.workerTasks;
        if (Array.isArray(workerTasks)
            && workerTasks.every(w => isValidTask(w))
        ) {
            const tasksListString = workerTasks
                .reduce((acc, curr) => {
                    return acc + "\r\n" + curr;
                },
                    `Worker Tasks (Unverified):`
                );
            workerTasksText.textContent = tasksListString;
            removeClass(workerTasksText, "hide");
            anyUserDefinedDataFound = true;
        }
    }
    if ("managerTasks" in userDefinedDataJson) {
        const managerTasks = userDefinedDataJson.managerTasks;
        if (Array.isArray(managerTasks)
            && managerTasks.every(m => isValidTask(m))
        ) {
            const tasksListString = managerTasks
                .reduce((acc, curr) => {
                    return acc + "\r\n" + curr;
                },
                    `Manager Tasks (Unverified):`
                );
            managerTasksText.textContent = tasksListString;
            removeClass(managerTasksText, "hide");
            anyUserDefinedDataFound = true;
        }
    }
    if ("validatorTasks" in userDefinedDataJson) {
        const validatorTasks = userDefinedDataJson.validatorTasks;
        if (Array.isArray(validatorTasks)
            && validatorTasks.every(v => isValidTask(v))
        ) {
            const tasksListString = validatorTasks
                .reduce((acc, curr) => {
                    return acc + "\r\n" + curr;
                },
                    `Validator Tasks (Unverified):`
                );
            validatorTasksText.textContent = tasksListString;
            removeClass(validatorTasksText, "hide");
            anyUserDefinedDataFound = true;
        }
    }
    if ("validationRequirementsWhitelist" in userDefinedDataJson) {
        const requirementsWhitelist
            = userDefinedDataJson.validationRequirementsWhitelist;
        if (requirementsWhitelist !== undefined) {
            let requirementsListString = "";
            if (requirementsWhitelist === null) {
                requirementsListString = "Validation Requirements Whitelist:"
                    + "\r\nAny requirement accepted";
            } else if (Array.isArray(requirementsWhitelist)
                && requirementsWhitelist.every(w => isValidRequirement(w))
            ) {
                requirementsListString = requirementsWhitelist
                    .reduce((acc, curr) => {
                        return acc + "\r\n" + curr;
                    },
                        "Validation Requirements Whitelist:"
                    );
            }
            validationRequirementWhitelistText.textContent
                = requirementsListString;
            removeClass(validationRequirementWhitelistText, "hide");
            anyUserDefinedDataFound = true;
        }
    }
    if ("availableValidationTime" in userDefinedDataJson) {
        const availableTime = userDefinedDataJson.availableValidationTime;
        availableValidationTimeText.textContent = `Available Validation Time:\r\n`
            + `${availableTime.replace(/\n/g, '\r\n')}`;
        removeClass(availableValidationTimeText, "hide");
        anyUserDefinedDataFound = true;
    }

    // If no data has been successfully parsed from the user defined data, then
    // display message
    if (!anyUserDefinedDataFound) {
        userDataErrorText.textContent
            = "No user defined data found at user links endpoint";
    }
}
