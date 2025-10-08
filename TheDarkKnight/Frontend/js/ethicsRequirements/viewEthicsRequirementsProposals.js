import { ethers, keccak256, toUtf8Bytes, concat } from "../libs/ethers.min.js";
import {
    prefixHexBytes, loadHeader
} from "../../utils/commonFunctions.js";
import { THE_LIST_CONTRACT_ADDRESS } from "../../utils/constants.js";

// Page elements
const addProposalButton = document.getElementById("add-proposal-button");
const ethicsRequirementsVersionText
    = document.getElementById("ethics-version");
const ethicsProposalsNumber
    = document.getElementById("ethics-proposals-number");
const previousButton = document.getElementById("previous-button");
const nextButton = document.getElementById("next-button");
const searchHeader = document.getElementById("search-header");
const searchButton = document.getElementById("search-button");
const searchInput = document.getElementById("search-input");
const proposalsContainer = document.getElementById("proposals-rows-container");
const proposalItemTemplate = document.getElementById("proposal-item-template");

// Load the header button navigation functionality
loadHeader();

// Get The List contract
const theListContractAddress = THE_LIST_CONTRACT_ADDRESS;
const provider = new ethers.BrowserProvider(window.ethereum);
const theListAbi = await fetch('./data/abi/theListAbi.json');
const theListJson = await theListAbi.json();
const theListContract = new ethers.Contract(
    theListContractAddress,
    theListJson.abi,
    provider
);

// Get ethics proposals search value from url if any
const url = new URL(window.location.href);
const params = Object.fromEntries(url.searchParams.entries());
const pageSearch = params.search;

// Ethics proposals search variables
let pageItems = {};
let currentPage = 0;
let maxSearchItems = null;
let searchingPage = false;

// If a search input was included in the URL, then use that value in the search
if (pageSearch !== undefined) {
    searchInput.value = pageSearch;
}

// Update the ethics requirements version in the display
theListContract.ethicsVersion().then((v) => {
    ethicsRequirementsVersionText.textContent
        = `Ethics Requirements Version: ${v}`;
});

// Once the number of proposals have been retrieved, update the display and
// execute the search
theListContract.ethicsProposalsCount().then((p) => {
    ethicsProposalsNumber.textContent = `Ethics Requirements Proposals: ${p}`;
});

// Begin search for ethics requirements proposals
executeSearch();

// Redirects to add ethics requirements proposal page
addProposalButton.addEventListener("click", () => {
    window.location.href = `pages/ethicsRequirements/addEthicsRequirementsProposal.html`;
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
 * @property {?Number} numberProposals Total number of ethics requirements
 * proposals
 * @property {?('index' | 'hex' | 'recent')} inputType Detected type of search
 * for ethics requirements proposal by either index, hex, or recent
 * @property {?Number} index Ethics requirements proposal index
 */

/**
 * @typedef {Object} EthicsRequirementsProposal
 * @property {?Number} hash Ethics requirements proposal hash of list data
 * @property {?Number} index Ethics requirements proposal index
 * @property {?Number} validator Creator of the ethics requirements proposal
 * @property {?Number} votesFor Votes in favor of the ethics requirements
 * proposal
 */

/**
 * Gets at most 10 of the next page of ethics requirements proposal items given
 * the search settings
 * @param {SearchSettings} searchSettings Settings used to initialize search
 * starting from a specific point in the blockchain
 * @param {number} searchPage Search page index
 * @param {Object} searchItems Ethics requirements proposal search items list
 * and next page search settings for search pages
 * @param {Array<Object>} searchItems.items List of 10 ethics requirements
 * proposals search items
 * @param {Array<Object>} searchItems.nextPageSettings List of search settings
 * on a given page as a starting search point for the next page
 */
async function search(searchSettings, searchPage, searchItems) {

    // If search string empty, then search recent, otherwise search text value
    const searchText = searchInput.value;
    if (searchText === "") {
        proposalsContainer.textContent = `Searching recent`;
    } else {
        proposalsContainer.textContent = `Searching "${searchText}"`;
    }

    // Array of up to 10 ethics requirements proposal items
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
 * Gets the ethics requirements proposal data results for the given page using
 * possible caching with the search items
 * @param {Number} searchPage Page index for search
 * @param {Object} searchItems Ethics requirements proposal search items list
 * and next page search settings for search pages
 * @param {Array<Object>} searchItems.items List of 10 ethics requirements
 * proposal search items
 * @param {Array<Object>} searchItems.nextPageSettings List of search settings
 * @param {SearchSettings} searchSettings Search settings of next page where
 * previous page left off
 * @returns {Array<EthicsRequirementsProposal>} return.results Array of maximum
 * first 10 ethics requirements proposals found in the page search
 * @returns {SearchSettings} return.searchSettings Search settings of next page
 * where previous page left off
 */
async function searchPageResults(
    searchText,
    searchPage,
    searchItems,
    searchSettings
) {
    // Ethics requirements proposal data objects list
    let results = [];

    // If search page is cached, then use the cache value, otherwise search
    // the blockchain
    if (searchPage in searchItems.items) {
        results = searchItems.items[searchPage];
        searchSettings = searchItems.nextPageSettings[searchPage]
    } else {

        // Iterate 10 items or until everything searched
        for (let i = 0; i < 10; i++) {

            // Search next ethics requirements proposal item for result
            const result = await searchNext(searchText, searchSettings);

            // If result is null, then done searching page and update end of
            // search values
            if (result === null) {
                searchSettings = null;
                maxSearchItems = currentPage * 10 + i;
                break;
            }

            // Add result and initialize search settings for next item
            results.push(result.ethicsRequirementsProposal);
            searchSettings = {
                numberProposals: result.numberProposals,
                inputType: result.inputType,
                index: result.ethicsRequirementsProposal.index
            };

            if (result.inputType === "index") {
                break;
            } else if (result.inputType === "hex") {
                searchSettings.index = result.index - 1;
                if (searchSettings.index === -1) {
                    break;
                }
            } else if (result.inputType === "recent") {
                searchSettings.index = result.index - 1;
                if (searchSettings.index === -1) {
                    break;
                }
            }
        }
    }

    // Return ethics requirements data after finding 10 items or finished
    // searching
    return {
        results: results,
        searchSettings: searchSettings
    };
}

/**
 * Updates the ethics requirements proposals list in the page
 * @param {Array<Requirement>} results Array of ethics requirements proposals
 * data
 */
function updatePageResults(results) {

    // Reset the ethics requirements proposal items container then iteratively
    // add each item
    proposalsContainer.textContent = "";
    results.forEach((searchResult, i) => {
        const searchItem = proposalItemTemplate.content.cloneNode(true);
        searchItem.querySelector('#index-version').textContent
            = `#${searchResult.index}`;
        searchItem.querySelector('#item-hash').textContent
            = `Hash: ${searchResult.hash}`;
        searchItem.querySelector('#validator-hex').textContent
            = `Validator: ${searchResult.validator}`;
        searchItem.querySelector('#votes-for').textContent
            = `Votes For: ${searchResult.votesFor}`;
        searchItem.querySelector('#view-button').id = `view-button-${i}`;
        searchItem.querySelector(`#view-button-${i}`)
            .addEventListener("click", () => {
                window.location.href = `pages/ethicsRequirements/ethicsRequirementsProposal.html`
                    + `?index=${searchResult.index}`;
            });
        proposalsContainer.appendChild(searchItem);
    });
    // If there are no matching items found, then display message
    if (results.length === 0) {
        proposalsContainer.textContent = "No results match search criteria";
    }
}

/**
 * Searches for the next search input matching ethics requirements proposal
 * starting from the given search settings point
 * @param {string} searchInput Search input text
 * @param {SearchSettings} searchSettings Settings used to initialize search
 * starting from a specific point in the blockchain
 * @returns {?Requirement} Ethics requirements proposal found in search by given
 * search text
 */
async function searchNext(searchInput, searchSettings) {

    // Whether search input format follows valid search types
    let isValidIndex;
    let isValidHex;
    let isRecent;

    // Search settings variables
    let index;
    let numberProposals;
    let searchHex;

    // Get number of ethics requirements proposals if not already cached
    if ("numberProposals" in searchSettings) {
        numberProposals = searchSettings.numberProposals;
    } else {
        numberProposals = Number(await theListContract.ethicsProposalsCount());
    }

    // Obtain the search validation of the parsed search text and corresponding
    // possible index, second index, and hex data
    const searchValidationData = await getValidSearchTypes(
        searchInput,
        searchSettings,
        numberProposals
    );

    // If invalid recent search index return null
    if (searchValidationData === null) {
        return null;
    }

    // Update variables with the retrieved data
    isValidIndex = searchValidationData.isValidIndex;
    isValidHex = searchValidationData.isValidHex;
    isRecent = searchValidationData.isRecent;
    if (isValidIndex) {
        index = searchValidationData.index;
    } else if (isValidHex) {
        searchHex = searchValidationData.searchHex;
    }

    // If is valid search by index or version index, then get specific
    // ethics requirements proposal item, otherwise search by index if valid hex
    if (isValidIndex) {

        // Search a specific ethics requirements proposal
        return await searchByIndex(
            isRecent,
            searchSettings,
            numberProposals,
            index
        );
    } else if (isValidHex) {

        // Search an ethics requirements proposal by hex value
        return await searchByHex(
            searchHex,
            searchSettings,
            numberProposals
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
 * @param {Number} numberProposals Total number of ethics requirements proposal
 * @returns {?Object} Valid types and possible corresponding values
 * @returns {boolean} return.isValidIndex Search input parses to a valid index
 * @returns {boolean} return.isValidHex Search input parses to a valid hex
 * @returns {boolean} return.isRecent Search input is empty to search for recent
 * @returns {?Number} return.index Search requirement index if valid
 * @returns {?String} return.searchHex Search hex if valid
 */
async function getValidSearchTypes(
    searchInput,
    searchSettings,
    numberProposals
) {

    // Search text valid types
    let isValidIndex = false;
    let isValidHex = false;
    let isRecent = false;

    // Values parsed from type
    let index = null;
    let searchHex = null;

    // Get the search type of index, hex, or recent if not cached
    if (!("inputType" in searchSettings)) {

        // If search text is empty then search recent, otherwise parse search
        // input type
        if (searchInput === "") {
            isRecent = true;
            isValidIndex = true;
            index = numberProposals - 1;
        } else {

            // Determine if search input is a valid ethics requirements proposal
            // index
            if (searchInput[0] === "#") {
                index = Number(searchInput.substring(1));
            } else {
                index = Number(searchInput);
            }
            isValidIndex = Number.isInteger(index)
                && !searchInput.includes(".")
                && searchInput.substring(0, 2) !== "0x"
                && 0 <= index
                && index < numberProposals;

            // Determine if search input is valid hex, and extract raw hex
            // characters if true
            const prefixSearchHex = prefixHexBytes(searchInput);
            isValidHex = prefixSearchHex !== null
                && prefixSearchHex.length <= 66;
            if (isValidHex) {
                searchHex = prefixSearchHex.substring(2);
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
        index = searchSettings.index;
        if (index === -1) {
            return null;
        }
    }

    // Return search input validations and possible corresponding values
    return {
        isValidIndex: isValidIndex,
        isValidHex: isValidHex,
        isRecent: isRecent,
        index: index,
        searchHex: searchHex,
    }
}

/**
 * Searches for the given ethics requirements proposal index and version, and if
 * no version is given, then the most recent version is used
 * @param {Boolean} isRecent Whether the search is for recent ethics
 * requirements proposals
 * @param {SearchSettings} searchSettings Settings used to initialize search
 * starting from a specific point in the blockchain
 * @param {Number} numberProposals Total number of ethics requirements proposals
 * @param {Number} index Ethics requirements proposal index
 * @returns {?Object} Ethics requirements proposal and cache data
 * @returns {?EthicsRequirementsProposal} return.ethicsRequirementsProposal
 * Ethics requirements proposal data that matches the search index and version
 * @returns {Number} return.numberProposals Total number of ethics requirements
 * proposals
 * @returns {'recent' | 'index'} return.inputType Search input type
 */
async function searchByIndex(
    isRecent,
    searchSettings,
    numberProposals,
    index
) {

    // Whether searching by recent
    let inputType;
    if (isRecent) {
        inputType = "recent";
    } else {
        inputType = "index";
    }

    // Validate ethics requirements proposal index
    if (index < 0 || searchSettings.numberProposals <= index) {
        return null;
    }

    // Get the ethics requirements proposal hash of list data, and other data
    let proposalList
        = await theListContract.getEthicsRequirementsProposal(index);
    proposalList = proposalList
        .map((ethicsRequirement) => toUtf8Bytes(ethicsRequirement));
    proposalList = concat(proposalList);
    const proposalHash = keccak256(proposalList);
    const proposalValidator
        = await theListContract.getEthicsRequirementsProposalAddress(index);
    const proposalVotesFor
        = await theListContract.getEthicsRequirementsProposalVotesFor(index);

    // Return the retrieved information
    return {
        ethicsRequirementsProposal: {
            hash: proposalHash,
            index: index,
            validator: proposalValidator,
            votesFor: proposalVotesFor
        },
        inputType: inputType,
        numberProposals: numberProposals,
        index: index
    };
}

/**
 * Sequentially searches for ethics requirements proposals with matching given
 * search hex
 * @param {String} searchHex Hex search input string
 * @param {SearchSettings} searchSettings Settings used to initialize search
 * starting from a specific point in the blockchain
 * @param {Number} numberProposals Total number of ethics requirements proposals
 * @returns {?Object} Ethics requirements proposal and cache data
 * @returns {?EthicsRequirementsProposal} return.ethicsRequirementsProposal
 * Ethics requirements proposal data that matches the search hex
 * @returns {Number} return.numberProposals Total number of ethics requirements
 * proposals
 * @returns {inputType} return.inputType Search input type of "hex"
 */
async function searchByHex(searchHex, searchSettings, numberProposals) {

    // Get the ethics requirements proposal index to begin searching from
    let index;
    if ("index" in searchSettings) {
        index = searchSettings.index;
    } else {
        index = 0;
    }

    // Validate ethics ethics requirements proposals proposal index
    if (index < 0 || numberProposals <= index) {
        return null;
    }

    // Begin by searching by the most recent ethics requirements proposals
    for (let i = index; i >= 0; i--) {


        // Get the ethics requirements proposal hash of list data, and other
        // data
        let proposalList
            = await theListContract.getEthicsRequirementsProposal(i);
        proposalList = proposalList
            .map((ethicsRequirement) => toUtf8Bytes(ethicsRequirement));
        proposalList = concat(proposalList);
        const proposalHash = keccak256(proposalList);
        const proposalValidator
            = await theListContract.getEthicsRequirementsProposalAddress(i);
        const proposalVotesFor
            = await theListContract.getEthicsRequirementsProposalVotesFor(i);

        // If any hex data matches search, then return the item
        if (proposalHash.includes(searchHex)
            || proposalValidator.includes(searchHex)
        ) {
            return {
                ethicsRequirementsProposal: {
                    hash: proposalHash,
                    index: i,
                    validator: proposalValidator,
                    votesFor: proposalVotesFor
                },
                inputType: "hex",
                numberProposals: numberProposals,
                index: i
            };
        }
    }

    // If no other matching items found, then return null
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