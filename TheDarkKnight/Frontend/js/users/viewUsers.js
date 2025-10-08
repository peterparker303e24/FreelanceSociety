import { ethers, isAddress } from "../libs/ethers.min.js"
import {
    loadHeader,
    parseUserData,
    prefixHexBytes
} from "../../utils/commonFunctions.js";
import { USERS_CONTRACT_ADDRESS } from "../../utils/constants.js";

// Page elements
const activateUserButton = document.getElementById("activate-user-button");
const previousButton = document.getElementById("previous-button");
const nextButton = document.getElementById("next-button");
const searchHeader = document.getElementById("search-header");
const searchButton = document.getElementById("search-button");
const searchInput = document.getElementById("search-input");
const usersContainer
    = document.getElementById("users-rows-container");
const userItemTemplate
    = document.getElementById("user-item-template");

// Load the header button navigation functionality
loadHeader();

// Get users contract
const usersContractAddress = USERS_CONTRACT_ADDRESS;
const provider = new ethers.BrowserProvider(window.ethereum);
const usersAbi = await fetch('./data/abi/usersAbi.json');
const usersJson = await usersAbi.json();
const usersContract
    = new ethers.Contract(usersContractAddress, usersJson.abi, provider);

// Initialize search variables
const minimumBlockNumber = 1;
let pageItems = { items: [], nextPageSettings: [] };
let currentPage = 0;
let maxSearchItems = null;
let searchingPage = false;

// If search parameter in URL, search using that value (also convert dashes in
// URL to periods)
const url = new URL(window.location.href);
const params = Object.fromEntries(url.searchParams.entries());
const pageSearch = params.search;
if (pageSearch !== undefined) {
    searchInput.value = pageSearch;
}

// Begin recent search, or search of URL parameter value
executeSearch();

// Redirects to add requirement page
activateUserButton.addEventListener("click", () => {
    window.location.href = 'pages/profile.html';
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
 * @property {?('address' | 'hex' | 'recent')} inputType Detected type of search
 * for requirement by either index, hex, or recent
 * @property {?Number} blockIndex Index of the block to search next in the
 * blockchain
 * @property {?Number} eventIndex Index of the event to search next in the block
 */

/**
 * @typedef {Object} User
 * @property {String} userAddress Ethereum address of the user
 * @property {String} links Contact links and endpoints of the user
 * @property {Bytes} userData Data of the user, such as name
 * @property {'UNACTIVATED' | 'ACTIVE' | 'DEACTIVATED'} activationStatus Whether
 * the user has been activated, and whether they have afterward been deactivated
 * @property {String} lockoutCode Keccak256 hash of the bytes32 lockout key
 */

/**
 * Gets at most 10 of the next page of requirement items given the search
 * settings
 * @param {SearchSettings} searchSettings Settings used to initialize search
 * starting from a specific point in the blockchain
 * @param {number} searchPage Search page index
 * @param {Object} searchItems Requirement search items list and next page
 * search settings for search pages
 * @param {Array<Object>} searchItems.items List of 10 user search items
 * @param {Array<Object>} searchItems.nextPageSettings List of search settings
 * on a given page as a starting search point for the next page
 */
async function search(searchSettings, searchPage, searchItems) {

    // If search string empty, then search recent, otherwise search text value
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
 * Gets the user data results for the given page using possible caching with
 * the search items
 * @param {Number} searchPage Page index for search
 * @param {Object} searchItems User search items list and next page search
 * settings for search pages
 * @param {Array<Object>} searchItems.items List of 10 user search items
 * @param {Array<Object>} searchItems.nextPageSettings List of search settings
 * @param {SearchSettings} searchSettings Search settings of next page where
 * previous page left off
 * @returns {Array<Requirement>} return.results Array of maximum first 10 users
 * found in the page search
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
            results.push(result.user);
            searchSettings = {
                inputType: result.inputType,
                blockIndex: result.blockIndex,
                eventIndex: result.eventIndex
            };

            // Update search settings with data from result
            if (result.inputType === "address") {
                break;
            } else if (result.inputType === "hex") {
                searchSettings.inputType = "hex";
            } else if (result.inputType === "text") {
                searchSettings.inputType = "text";
            } else if (result.inputType === "recent") {
                searchSettings.inputType = "recent";
            }
        }
    }

    // Return user data after finding 10 items or finished searching
    return {
        results: results,
        searchSettings: searchSettings
    };
}

/**
 * Updates the users list in the page
 * @param {Array<User>} results Array of requirement data
 */
function updatePageResults(results) {

    // Reset the requirements items container then iteratively add each item
    usersContainer.textContent = "";
    results.forEach((searchResult, i) => {

        // Create user item with retrieved data
        const searchItem = userItemTemplate.content.cloneNode(true);
        searchItem.querySelector('#user-address').textContent
            = `User Address: ${searchResult.userAddress}`;
        searchItem.querySelector('#user-links').textContent
            = `Links: ${searchResult.links}`;
        searchItem.querySelector('#user-name').textContent
            = `User Data: ${searchResult.userData}`;
        searchItem.querySelector('#user-activation-status').textContent
            = `Activation Status: ${searchResult.activationStatus}`;
        searchItem.querySelector('#user-lockout-code').textContent
            = `Lockout Code: ${searchResult.lockoutCode}`;
        searchItem.querySelector('#view-button').id = `view-button-${i}`;
        searchItem.querySelector(`#view-button-${i}`)
            .addEventListener("click", () => {
                window.location.href = `pages/users/user.html?address=`
                    + `${searchResult.userAddress}`;
            });
        usersContainer.appendChild(searchItem);
    });

    // If there are no matching items found, then display message
    if (results.length === 0) {
        usersContainer.textContent = "No results match search criteria";
    }
}

/**
 * Searches for the next search input matching user starting from the given
 * search settings point
 * @param {string} searchInput Search input text
 * @param {SearchSettings} searchSettings Settings used to initialize search
 * starting from a specific point in the blockchain
 * @returns {?User} User found in search by given search text
 */
async function searchNext(searchInput, searchSettings) {

    // Whether search input format follows valid search types
    let isValidAddress;
    let isValidHex;
    let isRecent;

    // Search settings variable
    let userAddress;

    // Obtain the search validation of the parsed search text and corresponding
    // possible address and hex data
    const searchValidationData = await getValidSearchTypes(
        searchInput,
        searchSettings
    );

    // If invalid recent search index return null
    if (searchValidationData === null) {
        return null;
    }

    // Update variables with the retrieved data
    isValidAddress = searchValidationData.isValidAddress;
    isValidHex = searchValidationData.isValidHex;
    isRecent = searchValidationData.isRecent;
    userAddress = searchValidationData.userAddress;

    // If is valid search by address, then get specific user, otherwise search
    // by hex if valid hex or recent
    if (isValidAddress) {

        // Search a specific user by address
        return await searchByAddress(
            userAddress
        );
    } else {

        // Search a user by hex value, or search all users by recent
        return await searchByMatch(
            searchSettings,
            isRecent,
            isValidHex,
            searchInput
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
 * @returns {?Object} Valid types and possible corresponding values
 * @returns {Boolean} return.isValidAddress Whether the given search input is a
 * valid 20 byte hex, which determines an address
 * @returns {Boolean} return.isValidHex Whether the given search input is valid
 * hex
 * @returns {Boolean} return.isRecent Whether the search is for recent users
 * @returns {?String} return.searchHex Hex formatted without the "0x" prefix if
 * it is valid hex data
 * @returns {?String} return.userAddress Hex formatted user address without the "0x"
 * prefix if it is a valid address
 */
async function getValidSearchTypes(
    searchInput,
    searchSettings
) {

    // Search text valid types
    let isValidAddress = false;
    let isValidHex = false;
    let isRecent = false;

    // Values parsed from type
    let searchHex = null;
    let userAddress = null;

    // Get the search type of index, hex, or recent if not cached
    if (!("inputType" in searchSettings)) {

        // If search text is empty then search recent, otherwise parse search
        // input type
        if (searchInput === "") {
            isRecent = true;
            isValidAddress = false;
            isValidHex = false;
        } else {

            // Determine if search input is valid hex, and extract raw hex
            // characters if true
            isValidHex = prefixHexBytes(searchInput) !== null
                && prefixHexBytes(searchInput).length <= 66;
            if (isValidHex) {
                searchHex = prefixHexBytes(searchInput).substring(2);
            }

            // Determine if search input is valid address, which is when the
            // search hex is 20 bytes
            isValidAddress = isValidHex && isAddress(prefixHexBytes(searchHex));
            if (isValidAddress) {
                userAddress = searchHex;
            }

        }
    } else if (searchSettings.inputType === "address") {

        // If index search type is cached, set search text only to valid index
        isValidAddress = true;
        isValidHex = false;
        isRecent = false;
        userAddress = searchSettings.address;
    } else if (searchSettings.inputType === "hex") {

        // If hex search type is cached, set search text to only valid hex
        isValidAddress = false;
        isValidHex = true;
        isRecent = false;

        // Clean the "0x" from the search input
        searchHex = prefixHexBytes(searchInput).substring(2);
    } else if (searchSettings.inputType === "text") {

        // If hex search type is cached, set search text to only valid hex
        isValidAddress = false;
        isValidHex = true;
        isRecent = false;

        // Clean the "0x" from the search input
        searchHex = prefixHexBytes(searchInput).substring(2);
    } else if (searchSettings.inputType === "recent") {

        // If recent type is cached, set search text to only valid index, and
        // set is recent flag to true
        isValidAddress = false;
        isValidHex = false;
        isRecent = true;
    }

    // Return search input validations and possible corresponding values
    return {
        isValidAddress: isValidAddress,
        isValidHex: isValidHex,
        isRecent: isRecent,
        searchHex: searchHex,
        userAddress: userAddress
    }
}

/**
 * Searches for the given user data using their address
 * @param {Boolean} isRecent Whether the search is for recent requirements
 * @param {?Number} userAddress Address of the user
 * @returns {?User} return.user User data with the given user address retrieved
 * from the blockchain
 */
async function searchByAddress(
    userAddress
) {

    // Standardize the user address with a prefix for blockchain data retrieval
    let prefixedUserAddress = prefixHexBytes(userAddress);

    // Validate user address, and if invalid return null
    if (prefixedUserAddress === null || prefixedUserAddress.length !== 42) {
        return null;
    }

    // Obtain the activation status text using the enum number
    const activationStatus = Number(
        await usersContract.activationStatus(prefixedUserAddress)
    );
    const activationStatusText = getActivationStatusText(activationStatus);

    // Convert the user data bytes to user name string
    const userData = await usersContract.usersData(prefixedUserAddress);
    const userName = parseUserData(userData).data;

    // Return the retrieved information
    return {
        user: {
            userAddress: prefixedUserAddress,
            links: await usersContract.links(prefixedUserAddress),
            userData: await userName,
            activationStatus: activationStatusText,
            lockoutCode: await usersContract.lockoutCodes(prefixedUserAddress)
        }
    };
}

/**
 * Sequentially searches for users with matching given search input
 * @param {SearchSettings} searchSettings Settings used to initialize search
 * starting from a specific point in the blockchain
 * @param {String} isRecent Whether the search is for recent user activations
 * @param {String} isValidHex Whether the search input is valid hex
 * @param {String} searchInput Search input string
 * @returns {?Object} User and cache data
 * @returns {?User} return.user User data that matches the search input
 * @returns {Number} return.blockIndex Block index on the blockchain of the next
 * block search index
 * @returns {Number} return.eventIndex Event index in the block of the next
 * block search index
 */
async function searchByMatch(searchSettings, isRecent, isValidHex, searchInput) {

    // Get max blockchain block index if not already cached
    let blockIndex;
    if ("blockIndex" in searchSettings) {
        blockIndex = searchSettings.blockIndex;
    } else {
        blockIndex = Number(await provider.getBlockNumber());
    }

    // Get the event index to search within a block
    let eventIndex;
    if ("eventIndex" in searchSettings) {
        eventIndex = searchSettings.eventIndex;
    } else {
        eventIndex = -1;
    }

    // Search through all emitted user activation updates backwards using the
    // last interaction block index to more efficiently traverse blockchain
    let blockSearchIndex = blockIndex;
    while (blockSearchIndex >= minimumBlockNumber) {

        // Filter user activation events in the search block
        const activateUserLinksFilter = await usersContract.filters
            .ActivateUserLinks()
            .getTopicFilter();
        const activateUserLinksDataFilter = await usersContract.filters
            .ActivateUserLinksData()
            .getTopicFilter();
        const activateUserLinksLockoutFilter = await usersContract.filters
            .ActivateUserLinksLockout()
            .getTopicFilter();
        const activateUserLinksDataLockoutFilter = await usersContract.filters
            .ActivateUserLinksDataLockout()
            .getTopicFilter();
        const eventsFilter = [
            activateUserLinksFilter
                .concat(activateUserLinksDataFilter)
                .concat(activateUserLinksLockoutFilter)
                .concat(activateUserLinksDataLockoutFilter)
        ];
        let events = await usersContract.queryFilter(
            eventsFilter,
            blockSearchIndex,
            blockSearchIndex
        );

        // If no event index is specified, then use the last event
        if (eventIndex === -1) {
            eventIndex = events.length - 1;
        }

        // Search through possibly multiple user activations in a block
        let eventFound = null;
        for (let i = eventIndex; i >= 0; i--) {

            // Get the user address from the user activation event
            let userAddress = null;
            if (events[i].fragment.name === "ActivateUserLinks") {
                userAddress = events[i].args[0];
            } else if (events[i].fragment.name === "ActivateUserLinksData") {
                userAddress = events[i].args[0];
            } else if (events[i].fragment.name === "ActivateUserLinksLockout") {
                userAddress = events[i].args[0];
            } else if (events[i].fragment.name === "ActivateUserLinksDataLockout") {
                userAddress = events[i].args[0];
            }

            // Validate user address
            if (userAddress === null) {
                continue;
            }

            // Retrieve the most recent user information from the user address
            const links = await usersContract.links(userAddress);
            const userData = await usersContract.usersData(userAddress);
            const userName = parseUserData(userData).data;
            const activationStatusEnumNumber = Number(
                await usersContract.activationStatus(userAddress)
            );
            const activationStatus = getActivationStatusText(
                activationStatusEnumNumber
            );
            const lockoutCode = await usersContract.lockoutCodes(userAddress);

            // Determine whether the user information matches any search
            // criteria
            let matchFound = false;
            if (isRecent) {
                matchFound = true;
            } else if (isValidHex) {
                const formattedHex = prefixHexBytes(searchInput)
                    .substring(2)
                    .toLowerCase();
                if (userAddress.toLowerCase().includes(formattedHex)
                    || links.toLowerCase().includes(formattedHex)
                    || userName.toLowerCase().includes(formattedHex)
                    || lockoutCode.toLowerCase().includes(formattedHex)
                ) {
                    matchFound = true;
                }
            } else {
                const formattedSearchInput = searchInput.toLowerCase();
                if (userAddress.toLowerCase().includes(formattedSearchInput)
                    || links.toLowerCase().includes(formattedSearchInput)
                    || userName.toLowerCase().includes(formattedSearchInput)
                    || lockoutCode.toLowerCase().includes(formattedSearchInput)
                ) {
                    matchFound = true;
                }
            }

            // If a match is found then setup the search settings for the next
            // search block and event index
            if (matchFound && i === eventIndex) {

                // Continue searching the current block if not all events have
                // been searched
                let nextBlockIndex = blockSearchIndex;
                let nextEventIndex = -1;
                if (i > 0) {
                    nextEventIndex = i - 1;
                } else {

                    // Search to a previous block if all events in the block
                    // have been processed
                    nextBlockIndex = Number(
                        await usersContract.lastInteractionBlockIndex(
                            { blockTag: blockSearchIndex }
                        )
                    );
                    if (nextBlockIndex === blockSearchIndex) {
                        nextBlockIndex--;
                    }
                }

                // Set the user data and settings with the information from the
                // matching event found
                eventFound = {
                    user: {
                        userAddress: userAddress,
                        links: links,
                        userData: userName,
                        activationStatus: activationStatus,
                        lockoutCode: lockoutCode,
                    },
                    blockIndex: nextBlockIndex,
                    eventIndex: nextEventIndex
                };
                break;
            }
        }

        // If a user match has been retrieved, then return it, otherwise
        // continue the search
        if (eventFound !== null) {
            return eventFound;
        }

        // If the hex was not found in this block, then use the last
        // interaction block to navigate to the previous blockchain block
        // with The List contract interactions
        const currentBlock = blockSearchIndex;
        eventIndex = -1;
        blockSearchIndex = Number(
            await usersContract.lastInteractionBlockIndex(
                { blockTag: blockSearchIndex }
            )
        );
        if (blockSearchIndex === currentBlock) {
            blockSearchIndex--;
        }

        // If searched through entire blockchain without any successful
        // matches, then return null
        if (blockSearchIndex < minimumBlockNumber) {
            return null;
        }
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