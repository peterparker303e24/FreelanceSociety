import { ethers } from "../libs/ethers.min.js"
import {
    loadHeader,
    prefixHexBytes,
    binarySearchBlockchainVersions
} from "../../utils/commonFunctions.js";
import { THE_LIST_CONTRACT_ADDRESS } from "../../utils/constants.js";

// Page elements
const addRequirementButton = document.getElementById("add-requirement-button");
const requirementsNumber = document.getElementById("requirements-number");
const previousButton = document.getElementById("previous-button");
const nextButton = document.getElementById("next-button");
const searchHeader = document.getElementById("search-header");
const searchButton = document.getElementById("search-button");
const searchInput = document.getElementById("search-input");
const requirementsContainer
    = document.getElementById("requirements-rows-container");
const requirementItemTemplate
    = document.getElementById("requirement-item-template");

// Load the header button navigation functionality
loadHeader();

// Get The List contract
const theListContractAddress = THE_LIST_CONTRACT_ADDRESS;
const provider = new ethers.BrowserProvider(window.ethereum);
const theListAbi = await fetch('./data/abi/theListAbi.json');
const theListJson = await theListAbi.json();
const theListContract
    = new ethers.Contract(theListContractAddress, theListJson.abi, provider);

// Initialize search variables
const minimumBlockNumber = 1;
let pageItems = { items: [], nextPageSettings: [] };
let currentPage = 0;
let maxSearchItems = null;
let requirementsCountValue = 0;
let searchingPage = false;

// If search parameter in URL, search using that value (also convert dashes in
// URL to periods)
const url = new URL(window.location.href);
const params = Object.fromEntries(url.searchParams.entries());
const pageSearch = params.search;
if (pageSearch !== undefined) {
    searchInput.value = pageSearch;
    executeSearch();
}

// Updates the requirement count, then searches the most recent requirements
theListContract.requirementCount().then((n) => {
    requirementsCountValue = n;
    requirementsNumber.textContent
        = `Requirements Count: ${requirementsCountValue}`;
    executeSearch();
});

// Redirects to add requirement page
addRequirementButton.addEventListener("click", () => {
    window.location.href = 'pages/requirements/addRequirement.html';
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
 * @property {?Number} numberRequirementsValue Total number of requirements
 * @property {?('index' | 'hex' | 'recent')} inputType Detected type of search
 * for requirement by either index, hex, or recent
 * @property {?Number} maxBlock Maximum block index in blockchain
 * @property {?Number} indexVersions Number of versions for the searched
 * requirement index
 * @property {?Number} versionIndex The version to search for
 * @property {?Number} startIndex Requirement index to count up from
 * @property {?Number} eventIndex New requirement version event index for a
 * block to count up from
 * @property {?Number} recentIndex Recent requirement index to count down from
 */

/**
 * @typedef {Object} Requirement
 * @property {String} hash Hash of the requirement
 * @property {Number} index Requirement index
 * @property {Number} version Version of the requirement
 * @property {String} validator Validator address who created the requirement
 * version
 */

/**
 * Gets at most 10 of the next page of requirement items given the search
 * settings
 * @param {SearchSettings} searchSettings Settings used to initialize search
 * starting from a specific point in the blockchain
 * @param {number} searchPage Search page index
 * @param {Object} searchItems Requirement search items list and next page
 * search settings for search pages
 * @param {Array<Object>} searchItems.items List of 10 requirement search items
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
 * Gets the requirement data results for the given page using possible caching
 * with the search items
 * @param {Number} searchPage Page index for search
 * @param {Object} searchItems Requirement search items list and next page
 * search settings for search pages
 * @param {Array<Object>} searchItems.items List of 10 requirement search items
 * @param {Array<Object>} searchItems.nextPageSettings List of search settings
 * @param {SearchSettings} searchSettings Search settings of next page where
 * previous page left off
 * @returns {Array<Requirement>} return.results Array of maximum first 10
 * requirements found in the page search
 * @returns {SearchSettings} return.searchSettings Search settings of next page
 * where previous page left off
 */
async function searchPageResults(
    searchText,
    searchPage,
    searchItems,
    searchSettings
) {

    // Requirement data objects list
    let results = [];

    // If search page is cached, then use the cache value, otherwise search
    // the blockchain
    if (searchPage in searchItems.items) {
        results = searchItems.items[searchPage];
        searchSettings = searchItems.nextPageSettings[searchPage]
    } else {

        // Iterate 10 items or until everything searched
        for (let i = 0; i < 10; i++) {

            // Search next requirement item for result
            const result = await searchNext(searchText, searchSettings);

            // If result is null, then done searching page and update end of
            // search values
            if (result === null) {
                searchSettings = null;
                maxSearchItems = currentPage * 10 + i;
                break;
            }

            // Add result and initialize search settings for next item
            results.push(result.requirement);
            searchSettings = {
                numberRequirementsValue: result.numberRequirementsValue,
                inputType: result.inputType,
                index: result.requirement.index
            };

            // Update search settings with data from result
            if (result.maxBlock) {
                searchSettings.maxBlock = result.maxBlock
            }
            if (result.inputType === "index") {
                searchSettings.indexVersions = result.indexVersions;
                searchSettings.versionIndex = result.versionIndex - 1;
            } else if (result.inputType === "hex") {
                searchSettings.startIndex = result.requirement.index + 1;
                if ("eventIndex" in result) {
                    searchSettings.eventIndex = result.eventIndex;
                }
            } else if (result.inputType === "recent") {
                searchSettings.recentIndex = result.requirement.index - 1;
            }
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
 * @param {Array<Requirement>} results Array of requirement data
 */
function updatePageResults(results) {

    // Reset the requirements items container then iteratively add each item
    requirementsContainer.textContent = "";
    results.forEach((searchResult, i) => {

        // Create requirement item with retrieved data
        const searchItem = requirementItemTemplate.content.cloneNode(true);
        searchItem.querySelector('#index-version').textContent
            = `${searchResult.index}-${searchResult.version}`;
        searchItem.querySelector('#item-hash').textContent
            = `Hash: ${searchResult.hash}`;
        searchItem.querySelector('#validator-hex').textContent
            = `Manager: ${searchResult.validator}`;
        searchItem.querySelector('#view-button').id
            = `view-button-${i}`;
        searchItem.querySelector(`#view-button-${i}`)
            .addEventListener("click", () => {
                window.location.href = "pages/requirements/requirement.html?id="
                    + `${searchResult.index}-${searchResult.version}`;
            });
        requirementsContainer.appendChild(searchItem);
    });

    // If there are no matching items found, then display message
    if (results.length === 0) {
        requirementsContainer.textContent = "No results match search criteria";
    }
}

/**
 * Searches for the next search input matching requirement starting from the
 * given search settings point
 * @param {string} searchInput Search input text
 * @param {SearchSettings} searchSettings Settings used to initialize search
 * starting from a specific point in the blockchain
 * @returns {?Requirement} Requirement found in search by given search text
 */
async function searchNext(searchInput, searchSettings) {

    // Whether search input format follows valid search types
    let isValidIndex;
    let isValidIndexVersion;
    let isValidHex;

    // Search settings variables
    let numberRequirementsValue;
    let index;
    let secondIndex;
    let searchHex;
    let indexVersions;
    let isRecent;

    // Get number of requirements if not already cached
    if ("numberRequirementsValue" in searchSettings) {
        numberRequirementsValue = searchSettings.numberRequirementsValue;
    } else {
        numberRequirementsValue = Number(
            await theListContract.requirementCount()
        );
    }

    // Obtain the search validation of the parsed search text and corresponding
    // possible index, second index, and hex data
    const searchValidationData = await getValidSearchTypes(
        searchInput,
        searchSettings,
        numberRequirementsValue
    );

    // If invalid recent search index return null
    if (searchValidationData === null) {
        return null;
    }

    // Update variables with the retrieved data
    isValidIndex = searchValidationData.isValidIndex;
    isValidIndexVersion = searchValidationData.isValidIndexVersion;
    isValidHex = searchValidationData.isValidHex;
    isRecent = searchValidationData.isRecent;
    if (isValidIndex) {
        index = searchValidationData.index;
    } else if (isValidIndexVersion) {
        index = searchValidationData.index;
        indexVersions = searchValidationData.indexVersions;
        secondIndex = searchValidationData.secondIndex;
    } else if (isValidHex) {
        searchHex = searchValidationData.searchHex;
    }

    // If is valid search by index or version index, then get specific
    // requirement item, otherwise search by index if valid hex
    if (isValidIndex || isValidIndexVersion) {

        // Search a specific requirement version
        return await searchByIndexVersion(
            isRecent,
            searchSettings,
            numberRequirementsValue,
            index,
            indexVersions,
            secondIndex,
            isValidIndexVersion
        );
    } else if (isValidHex) {

        // Search a requirement by hex value
        return await searchByHex(
            searchHex,
            searchSettings,
            numberRequirementsValue
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
 * @param {Number} numberRequirementsValue Total number of requirements
 * @returns {?Object} Valid types and possible corresponding values
 * @returns {boolean} return.isValidIndex Search input parses to a valid index
 * @returns {boolean} return.isValidIndexVersion Whether search input parses to
 * a valid index version
 * @returns {boolean} return.isValidHex Search input parses to a valid hex
 * @returns {boolean} return.isRecent Search input is empty to search for recent
 * @returns {?Number} return.index Search requirement index if valid
 * @returns {?Number} return.secondIndex Search requirement version if valid
 * @returns {?String} return.searchHex Search hex if valid
 */
async function getValidSearchTypes(
    searchInput,
    searchSettings,
    numberRequirementsValue
) {

    // Search text valid types
    let isValidIndex = false;
    let isValidIndexVersion = false;
    let isValidHex = false;
    let isRecent = false;

    // Values parsed from type
    let index = null;
    let secondIndex = null;
    let searchHex = null;
    let indexVersions = null;

    // Get the search type of index, hex, or recent if not cached
    if (!("inputType" in searchSettings)) {

        // If search text is empty then search recent, otherwise parse search
        // input type
        if (searchInput === "") {
            isRecent = true;
            isValidIndex = true;
            index = numberRequirementsValue - 1;
        } else {

            // Determine if search input is a valid requirement index
            index = Number(searchInput);
            isValidIndex = Number.isInteger(index)
                && !searchInput.includes("-")
                && searchInput.substring(0, 2) !== "0x"
                && 0 <= index
                && index < numberRequirementsValue;

            // Determine if search input is valid requirement index with
            // version number
            if (!searchInput.includes("-")
                || searchInput.substring(0, 2) === "0x"
            ) {
                isValidIndexVersion = false;
            } else {

                // Does the search text have a period that splits the index and
                // the version, and have a valid index
                index = Number(
                    searchInput.substring(0, searchInput.indexOf("-"))
                );
                isValidIndexVersion = Number.isInteger(index)
                    && 0 <= index
                    && index < numberRequirementsValue;

                // Validate the version index
                if (isValidIndexVersion) {

                    // Parse the second split to get version
                    secondIndex = Number(
                        searchInput.substring(searchInput.indexOf("-") + 1)
                    );

                    // Get the number of versions for the search requirement
                    // index if not already cached
                    if ("indexVersions" in searchSettings) {
                        indexVersions = searchSettings.indexVersions;
                    } else {
                        indexVersions = Number(
                            await theListContract.getRequirementVersion(index)
                        );
                    }

                    // Validate the version index
                    isValidIndexVersion = Number.isInteger(secondIndex)
                        && 0 < secondIndex
                        && secondIndex <= indexVersions;
                }
            }

            // Determine if search input is valid hex, and extract raw hex
            // characters if true
            isValidHex = prefixHexBytes(searchInput) !== null
                && prefixHexBytes(searchInput).length <= 66;
            if (isValidHex) {
                searchHex = prefixHexBytes(searchInput).substring(2);
            }
        }
    } else if (searchSettings.inputType === "index") {

        // If index search type is cached, set search text only to valid index
        isValidIndex = true;
        isValidHex = false;
        index = searchSettings.index;
    } else if (searchSettings.inputType === "hex") {

        // If hex search type is cached, set search text to only valid hex
        isValidIndex = false;
        isValidHex = true;

        // Clean the "0x" from the search input
        searchHex = prefixHexBytes(searchInput).substring(2);
    } else if (searchSettings.inputType === "recent") {

        // If recent type is cached, set search text to only valid index, and
        // set is recent flag to true
        isValidIndex = true;
        isValidHex = false;
        isRecent = true;

        // Get the index to search for in recent
        index = searchSettings.recentIndex;
        if (index === -1) {
            return null;
        }
    }

    // Return search input validations and possible corresponding values
    return {
        isValidIndex: isValidIndex,
        isValidIndexVersion: isValidIndexVersion,
        isValidHex: isValidHex,
        isRecent: isRecent,
        index: index,
        secondIndex: secondIndex,
        searchHex: searchHex,
        indexVersions: indexVersions
    }
}

/**
 * Searches for the given requirement index and version, and if no version is
 * given, then the most recent version is used
 * @param {Boolean} isRecent Whether the search is for recent requirements
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
 * @returns {Number} return.versionIndex Version index searched for within the
 * given requirement
 * @returns {Number} return.maxBlock Maximum block in blockchain to search
 * within
 * @returns {Number} return.isValidVersionIndex Whether the given search input
 * follows a valid requirement index and version 
 * @returns {'recent' | 'index'} return.inputType Search input type
 */
async function searchByIndexVersion(
    isRecent,
    searchSettings,
    numberRequirementsValue,
    index,
    indexVersions,
    version,
    isValidIndexVersion
) {

    // Whether searching by recent
    let inputType;
    if (isRecent) {
        inputType = "recent";
    } else {
        inputType = "index";
    }

    // Validate search index, and if out of bounds return null
    if (index < 0) {
        return null;
    }

    // Get number of versions for search index if not already cached
    if ("indexVersions" in searchSettings) {
        indexVersions = searchSettings.indexVersions;
    } else if (!indexVersions) {
        indexVersions = Number(
            await theListContract.getRequirementVersion(index)
        );
    }

    // Get the specific version index to search for within requirement index,
    // and default to most recent version
    if (version !== null) {
        if ("versionIndex" in searchSettings) {
            version = searchSettings.versionIndex;
        } else {
            version = indexVersions;
        }
    }

    // Validate version search index, and if out of bounds return null
    if (version <= 0 || indexVersions < version) {
        return null;
    }

    // Get max blockchain index if not already cached
    let maxBlock;
    if ("maxBlock" in searchSettings) {
        maxBlock = searchSettings.maxBlock;
    } else {
        maxBlock = Number(await provider.getBlockNumber());
    }

    // Version search variables
    let versionHash;
    let versionValidator;
    let versionBlock;

    // If searching the most recent version, then the requirement data can
    // be obtained in the most recent block, otherwise binary search through
    // previous blocks for the data
    if (version === indexVersions) {
        versionHash
            = await theListContract.getRequirementHash(index);
        versionValidator
            = await theListContract.getRequirementValidatorAddress(index);
    } else {

        // Binary search blockchain for the specific version, and if problem
        // occurs return null, otherwise get version data with obtained
        // blockchain block index
        const requirementIndexVersion = await binarySearchBlockchainVersions(
            theListContract,
            minimumBlockNumber,
            maxBlock,
            index,
            version
        );
        if (requirementIndexVersion === null) {
            return null;
        }
        versionHash = requirementIndexVersion.hash;
        versionValidator = requirementIndexVersion.validator;
    }

    // Return the retrieved information
    return {
        requirement: {
            hash: versionHash,
            index: index,
            version: version,
            validator: versionValidator
        },
        versionBlock: versionBlock,
        numberRequirementsValue: numberRequirementsValue,
        inputType: inputType,
        indexVersions: indexVersions,
        versionIndex: version,
        maxBlock: maxBlock,
        isValidIndexVersion: isValidIndexVersion
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
async function searchByHex(searchHex, searchSettings, numberRequirementsValue) {

    // Get the requirement index to begin searching from
    let startIndex;
    if ("startIndex" in searchSettings) {
        startIndex = searchSettings.startIndex;
    } else {
        startIndex = 0;
    }

    // If all updated requirement versions have been searched, then back search
    // for previous versions of requirements
    const backSearch = "maxBlock" in searchSettings

    if (!backSearch) {

        // Begin by searching by the most updated version of each requirement
        for (let i = startIndex; i < numberRequirementsValue; i++) {

            // Get the requirement hex data
            const requirementHash = await theListContract.getRequirementHash(i);
            const requirementValidator
                = await theListContract.getRequirementValidatorAddress(i);

            // If any hex data matches search, then return the item
            if (requirementHash.includes(searchHex)
                || requirementValidator.includes(searchHex)
            ) {
                const requirementVersion = Number(
                    await theListContract.getRequirementVersion(i)
                );
                return {
                    requirement: {
                        hash: requirementHash,
                        index: i,
                        version: requirementVersion,
                        validator: requirementValidator
                    },
                    numberRequirementsValue: numberRequirementsValue,
                    inputType: "hex",
                };
            }
        }
    }

    // Get max blockchain index if not already cached
    let maxBlock;
    if ("maxBlock" in searchSettings) {
        maxBlock = searchSettings.maxBlock;
    } else {
        maxBlock = Number(await provider.getBlockNumber());
    }

    // If no hex matches found in most recent versions, then search through
    // all emitted version updates backwards using the last interaction
    // block index to more efficiently traverse blockchain
    let blockSearchIndex = maxBlock;
    while (blockSearchIndex >= minimumBlockNumber) {

        // Filter new requirement and update requirement events in the search
        // block
        const updateRequirementEventFilter = await theListContract.filters
            .NewRequirementUpdate()
            .getTopicFilter();
        const newRequirementEventFilter2 = await theListContract.filters
            .NewRequirement()
            .getTopicFilter();
        const eventsFilter = [
            updateRequirementEventFilter.concat(newRequirementEventFilter2)
        ];
        let events = await theListContract.queryFilter(
            eventsFilter,
            blockSearchIndex,
            blockSearchIndex
        );

        // Search through possibly multiple version updates in a block
        let eventFound = null;
        events.forEach((event, index) => {

            // Get the requirement information from the corresponding emitted
            // fileds depending on the type of event
            let eventArgHash = null;
            let eventArgValidator = null;
            let eventArgIndex = null;
            let eventArgVersion = null;
            if (event.fragment.name === "NewRequirementUpdate") {
                eventArgHash = event.args[1];
                eventArgValidator = event.args[3];
                eventArgIndex = event.args[0];
                eventArgVersion = event.args[2];
            } else if (event.fragment.name === "NewRequirement") {
                eventArgHash = event.args[1];
                eventArgValidator = event.args[2];
                eventArgIndex = event.args[0];
                eventArgVersion = 1;
            } else {
                return null;
            }

            // If the requirement hash or validator emitted values match the
            // searched hex value and event has not already been searched,
            // then return the requirement version information
            if (
                (
                    eventArgValidator.includes(searchHex)
                    || eventArgHash.includes(searchHex)
                ) && (
                    !("eventIndex" in searchSettings)
                    || searchSettings.eventIndex < index
                    || maxBlock !== blockSearchIndex
                )
            ) {
                eventFound = {
                    requirement: {
                        index: Number(eventArgIndex),
                        hash: eventArgHash,
                        version: Number(eventArgVersion),
                        validator: eventArgValidator
                    },
                    numberRequirementsValue: numberRequirementsValue,
                    inputType: "hex",
                    maxBlock: blockSearchIndex,
                    eventIndex: index
                };
            }
        });
        if (eventFound !== null) {
            return eventFound;
        }

        // If the hex was not found in this block, then use the last
        // interaction block to navigate to the previous blockchain block
        // with The List contract interactions
        const currentBlock = blockSearchIndex;
        blockSearchIndex = Number(
            await theListContract.lastInteractionBlockIndex(
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