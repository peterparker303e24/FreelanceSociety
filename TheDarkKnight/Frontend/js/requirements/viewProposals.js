import { ethers } from "../libs/ethers.min.js";
import {
    loadHeader,
    prefixHexBytes,
    removeClass
} from "../../utils/commonFunctions.js";
import { THE_LIST_CONTRACT_ADDRESS } from "../../utils/constants.js";

// Page elements
const addProposalButtonFixed
    = document.getElementById("add-proposal-button-fixed");
const addProposalButtonDynamic
    = document.getElementById("add-proposal-button-dynamic");
const index = document.getElementById("requirement-index");
const requirementsNumber = document.getElementById("requirements-number");
const requirementVersions = document.getElementById("versions-number");
const proposalsNumber = document.getElementById("proposals-number");
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
const provider = new ethers.BrowserProvider(window.ethereum);
const theListAbi = await fetch('./data/abi/theListAbi.json');
const theListJson = await theListAbi.json();
const theListContractAddress = THE_LIST_CONTRACT_ADDRESS;
const theListContract = new ethers.Contract(
    theListContractAddress,
    theListJson.abi,
    provider
);

// Get requirement index of proposals if fixed requirement
const url = new URL(window.location.href);
const params = Object.fromEntries(url.searchParams.entries());
const requirementIndexValue = params.index;
const fixedRequirement = requirementIndexValue !== undefined;

// Proposal search variables
let requirementsNumberValue;
let requirementVersionsValue;
let requirementProposalsValue;
let pageItems = { items: [], nextPageSettings: [] };
let currentPage = 0;
let maxSearchItems = null;
let searchingPage = false;

// If there is a requirement index specified in the url, fix that requirement,
// otherwise allow the user to input the requirement index
if (fixedRequirement) {

    // Change the page to display fixed requirement UI
    removeClass(addProposalButtonFixed, "hide");
    removeClass(index, "hide");
    removeClass(requirementVersions, "hide");
    removeClass(proposalsNumber, "hide");

    // Get the version and proposal count for the requirement, then execute a
    // search of the requirement proposals
    index.textContent = `Requirement Index: ${requirementIndexValue}`;
    theListContract.getRequirementVersion(requirementIndexValue).then((v) => {
        requirementVersionsValue = v;
        requirementVersions.textContent
            = `Requirement Versions: ${requirementVersionsValue}`;
    });
    theListContract.getRequirementProposals(requirementIndexValue).then((p) => {
        requirementProposalsValue = p;
        proposalsNumber.textContent
            = `Requirement Proposals: ${requirementProposalsValue}`;
        executeSearch();
    });
} else {

    // Change the page to display the dynamic requirement UI
    removeClass(addProposalButtonDynamic, "hide");
    removeClass(requirementsNumber, "hide");

    // Get the most recent requirement, then execute a search of the requirement
    // proposals
    theListContract.requirementCount().then(async (n) => {
        requirementsNumberValue = Number(n);
        requirementsNumber.textContent
            = `Requirements Count: ${requirementsNumberValue}`;
        executeSearch();
    });
}

// Redirect to a new proposal for the selected requirement index
addProposalButtonFixed.addEventListener("click", () => {
    window.location.href
        = `pages/requirements/addRequirementProposal.html?index=${requirementIndexValue}`;
});

// Redirect to a new proposal for a dynamic requirement index
addProposalButtonDynamic.addEventListener("click", () => {
    window.location.href = `pages/requirements/addRequirementProposal.html`;
});

// If the search button is clicked or enter button pressed, then execute the
// search using the information in the search textbox
searchButton.addEventListener("click", executeSearch);
searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        executeSearch();
    }
});

// Continue to next page search if possible
nextButton.addEventListener("click", async () => {

    // Only start a new search if not already searching
    if (searchingPage || pageItems.items.length === 0) {
        return;
    }
    searchingPage = true;

    // Search for next page if there are more search items left, otherwise 
    // end search
    if (maxSearchItems == null || (currentPage + 1) * 10 < maxSearchItems) {
        currentPage++;
        await search(
            pageItems.nextPageSettings[currentPage - 1],
            currentPage,
            pageItems,
            true
        );
    } else {
        searchingPage = false;
        return;
    }

    // Update the item count in the page
    updatePageItemCount();

    // End search
    searchingPage = false;
});

// Go to previous page if possible
previousButton.addEventListener("click", async () => {

    // Validate some previous page exists
    if (currentPage === 0) {
        return;
    }

    // Decrement page and search for previous page using cache
    currentPage--;
    await search({}, currentPage, pageItems, false);

    // Update the item count in the page
    updatePageItemCount();
});

/**
 * @typedef {Object} SearchSettings
 * @property {?('index' | 'hex' | 'recent')} inputType Detected type of search
 * @property {?Number} numberRequirements Total number of requirements
 * @property {?Number} requirementProposals Total number of proposals for the
 * selected requirement
 * @property {?Number} index Requirement index
 * @property {?Number} proposalIndex Requirement proposal index
 */

/**
 * @typedef {Object} Proposal Requirement proposal
 * @property {?Number} proposalHash Hash of the proposal
 * @property {?Number} index Requirement index of the proposal
 * @property {?Number} proposalIndex Index of the proposal within the
 * requirement
 * @property {?Number} validator Validator of the proposal
 * @property {?Number} votesFor Number of votes for the requirement proposal
 */

/**
 * Gets at most 10 of the next page of proposal items given the search settings
 * @param {SearchSettings} searchSettings Search settings of next page where
 * previous page left off
 * @param {Number} searchPage Page index for search
 * @param {Object} searchItems Requirement search items list and next page
 * search settings for search pages
 * @param {Boolean} newSearchPage Whether searching to a new page
 * @param {Array<Proposal>} searchItems.items Retrieved search proposal data
 * @param {Array<SearchSettings>} searchItems.nextPageSettings Search settings
 * for the next page of an existing page
 */
async function search(searchSettings, searchPage, searchItems, newSearchPage) {

    // Get search text from search input
    const searchText = searchInput.value;

    // Search recent if empty, otherwise search the given text
    if (searchText === "") {
        proposalsContainer.textContent = `Searching recent`;
    } else {
        proposalsContainer.textContent = `Searching "${searchText}"`;
    }

    // Array of up to 10 proposal items
    const searchPageData = await searchPageResults(
        searchText,
        searchPage,
        searchItems,
        searchSettings
    );
    let results = searchPageData.results;
    searchSettings = searchPageData.searchSettings;

    // Cache search data for next page search settings
    if (newSearchPage) {
        pageItems.nextPageSettings[searchPage] = searchSettings;
    }

    // Cache search page items
    pageItems.items[searchPage] = results;

    // Updates the retrieved items onto the page
    updatePageResults(results);
}

/**
 * Gets the proposals data results for the given page using possible caching
 * with the search items
 * @param {Number} searchPage Page index for search
 * @param {Object} searchItems Proposal search items list and next page search
 * settings for search pages
 * @param {Array<Proposal>} searchItems.items Array of at most 10 proposal
 * search items
 * @param {Array<SearchSettings>} searchItems.nextPageSettings Array of search
 * settings for each page
 * @param {SearchSettings} searchSettings Search settings of next page where
 * previous page left off
 * @returns {Array<Proposal>} return.results Array of maximum first 10
 * proposals found in the page search
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

    // Get search page cache if available, otherwise search for proposals using
    // the search settings
    if (searchPage in searchItems.items) {
        results = searchItems.items[searchPage];
        searchSettings = searchItems.nextPageSettings[searchPage];
    } else {

        // Search for at most 10 proposals
        for (let i = 0; i < 10; i++) {

            // Search for the next proposal item
            const result = await searchNext(searchText, searchSettings);

            // If no more proposals, then end search
            if (result === null) {
                searchSettings = null;
                maxSearchItems = currentPage * 10 + i;
                break;
            }

            // Add search result and next search settings
            results.push(result.proposal);
            searchSettings = {
                requirementProposals: result.requirementProposals,
                numberRequirements: result.numberRequirements,
                inputType: result.inputType
            };

            // Set search settings values for next search iteration
            if (result.inputType === "index") {

                // If only searching a single proposal, then end search,
                // otherwise continue to search proposals for requirement
                if ("isValidProposalIndex" in result
                    && result.isValidProposalIndex
                ) {
                    break;
                } else {
                    searchSettings.proposalIndex = result.proposalIndex - 1;
                    searchSettings.index = result.index;
                }
            } else if (result.inputType === "hex") {
                searchSettings.proposalIndex = result.proposalIndex - 1;
                searchSettings.index = result.index;
            } else if (result.inputType === "recent") {
                searchSettings.proposalIndex = result.proposalIndex - 1;
                searchSettings.index = result.index;

                // If all proposals for a requirement have been found, then go
                // to the most recent proposal of the previous requirement if
                // there is no fixed requirement, otherwise if there is a fixed
                // requirement or no requirement proposals left, then break from
                // the search
                if (searchSettings.proposalIndex === -1) {
                    if (fixedRequirement) {
                        break;
                    }
                    searchSettings.index--;
                    if (searchSettings.index === -1) {
                        break;
                    }
                    searchSettings.requirementProposals
                        = Number(
                            await theListContract.getRequirementProposals(
                                searchSettings.index
                            )
                        );
                    searchSettings.proposalIndex
                        = searchSettings.requirementProposals - 1;

                }
            }
        }
    }

    // Return proposal data after finding 10 items or finished searching
    return {
        results: results,
        searchSettings: searchSettings
    };
}

/**
 * Updates the proposals list in the page
 * @param {Array<Proposal>} results Array of proposal data
 */
function updatePageResults(results) {

    // Reset page items
    proposalsContainer.textContent = "";

    // Add each of the retrieved proposal items
    results.forEach((searchResult, i) => {
        const searchItem = proposalItemTemplate.content.cloneNode(true);
        searchItem.querySelector('#index-version').textContent
            = `${searchResult.index}_${searchResult.proposalIndex}`;
        searchItem.querySelector('#item-hash').textContent
            = `Hash: ${searchResult.hash}`;
        searchItem.querySelector('#validator-hex').textContent
            = `Validator: ${searchResult.validator}`;
        searchItem.querySelector('#votes-for').textContent
            = `Votes For: ${searchResult.votesFor}`;
        searchItem.querySelector('#view-button').id = `view-button-${i}`;
        searchItem.querySelector(`#view-button-${i}`)
            .addEventListener("click", () => {
                window.location.href = `pages/requirements/requirementProposal.html?index=`
                    + `${searchResult.index}&proposalIndex=`
                    + `${searchResult.proposalIndex}`;
            });
        proposalsContainer.appendChild(searchItem);
    });

    // Display message if no more results found
    if (results.length === 0) {
        proposalsContainer.textContent = "No results match search criteria";
    }
}

/**
 * Gets the next search item in the search iteration using the given search
 * input and search settings
 * @param {String} searchInput Search input text
 * @param {SearchSettings} searchSettings Settings used to initialize search
 * starting from a specific point in the blockchain
 * @returns {Object} Proposal found in search by given search text, search data,
 * and cache values
 * @returns {Proposal} return.proposal Proposal found in search by given search
 * text
 * @returns {?('index' | 'hex' | 'recent')} return.inputType Detected search
 * type
 * @returns {?Number} return.requirementProposals Number of proposals for the
 * given requirement index
 * @returns {?Number} return.numberRequirements Total number of requirements
 * @returns {?Number} return.proposalIndex Proposal index wihtin the given
 * requirement
 * @returns {?Number} return.index Index of search requirement
 * @returns {?Boolean} return.isValidProposalIndex Whether the given input is a
 * valid requirement proposal index
 * @returns {?Number} return.startIndex Proposal index in requirement to
 * continue hex search
 */
async function searchNext(searchInput, searchSettings) {

    // Whether search input format follows valid search types
    let isValidIndex;
    let isValidProposalIndex;
    let isValidHex;

    // Search settings variables
    let numberRequirements;
    let index;
    let proposalIndex;
    let searchHex;
    let requirementProposals;
    let isRecent;

    // Get number of requirements if not already cached
    if ("numberRequirements" in searchSettings) {
        numberRequirements = searchSettings.numberRequirements;
    } else {
        numberRequirements = Number(
            await theListContract.requirementCount()
        );
    }

    // Obtain the search validation of the parsed search text and corresponding
    // possible index, second index, and hex data
    const searchValidationData = await getValidSearchTypes(
        searchInput,
        searchSettings,
        numberRequirements
    );

    // If invalid recent search index return null
    if (searchValidationData === null) {
        return null;
    }

    // Update variables with the retrieved data
    isValidIndex = searchValidationData.isValidIndex;
    isValidProposalIndex = searchValidationData.isValidProposalIndex;
    isValidHex = searchValidationData.isValidHex;
    isRecent = searchValidationData.isRecent;
    if (isValidIndex) {
        index = searchValidationData.index;
    } else if (isValidProposalIndex) {
        index = searchValidationData.index;
        requirementProposals = searchValidationData.requirementProposals;
        proposalIndex = searchValidationData.proposalIndex;
    } else if (isValidHex) {
        searchHex = searchValidationData.searchHex;
    }

    // If is valid search by index or proposal index, then get specific proposal
    // item, otherwise search by index if valid hex
    if (isValidIndex || isValidProposalIndex) {

        // Search a specific requirement proposal
        return await searchByIndex(
            isRecent,
            searchSettings,
            numberRequirements,
            index,
            requirementProposals,
            proposalIndex,
            isValidProposalIndex
        );
    } else if (isValidHex) {

        // Search a requirement by hex value
        return await searchByHex(
            searchHex,
            searchSettings,
            numberRequirements
        );
    }

    // Return null at end of search
    return null;
}

/**
 * Given the search input and search data, determine the parsed search type, and
 * corresponding values
 * @param {String} searchInput Text input to search
 * @param {SearchSettings} searchSettings Settings used to initialize search
 * starting from a specific point in search iteration
 * @param {Number} numberRequirementsValue Total number of requirements
 * @returns {Object} Valid types and possible corresponding values
 * @returns {boolean} return.isValidIndex Whether search input parses to a valid
 * requirement index
 * @returns {boolean} return.isValidProposalIndex Whether search input parses to
 * a valid requirement proposal index
 * @returns {boolean} return.isValidHex Whether search input parses to a valid
 * hex
 * @returns {boolean} return.isRecent Whether search input is empty to search
 * for recent proposals
 * @returns {?Number} return.index Search requirement index if valid
 * @returns {?Number} return.requirementProposals Number of proposals for search
 * requirement index if valid
 */
async function getValidSearchTypes(
    searchInput,
    searchSettings,
    numberRequirements
) {

    // Search text valid types
    let isValidIndex = false;
    let isValidProposalIndex = false;
    let isValidHex = false;
    let isRecent = false;

    // Values parsed from type
    let index = null;
    let proposalIndex = null;
    let searchHex = null;
    let requirementProposals = null;

    // Get the input type if not already cached
    if (!("inputType" in searchSettings)) {

        // If the search input is empty then search for recent, otherwise search
        // the search input text
        if (searchInput === "") {
            isRecent = true;
            isValidIndex = true;
            index = numberRequirements - 1;
        } else {

            // Gets whether the requirement is a valid requirement index
            index = Number(searchInput);
            isValidIndex = Number.isInteger(index)
                && !searchInput.includes("_")
                && searchInput.substring(0, 2) !== "0x"
                && 0 <= index
                && index < numberRequirements;

            if (isValidIndex && fixedRequirement) {
                isValidIndex = false;
                isValidProposalIndex = true;
                proposalIndex = index;
                index = requirementIndexValue;
            } else {

                // If the input is possibly a requirement proposal index, then
                // continue its validation, otherwise invalidate index proposal
                if (searchInput.includes("_")
                    && searchInput.substring(0, 2) !== "0x"
                ) {

                    // Validate requirement index
                    index = Number(
                        searchInput.substring(0, searchInput.indexOf("_")
                        ));
                    isValidProposalIndex = Number.isInteger(index)
                        && 0 <= index
                        && index < numberRequirements;
                    if (isValidProposalIndex) {

                        // Validate proposal index
                        proposalIndex = Number(
                            searchInput.substring(searchInput.indexOf("_") + 1)
                        );

                        // Get requirement proposals count if not already cached
                        if ("requirementProposals" in searchSettings) {
                            requirementProposals
                                = searchSettings.requirementProposals;
                        } else {
                            requirementProposals = Number(
                                await theListContract
                                    .getRequirementProposals(index)
                            );
                        }

                        // Validate requirement proposal index
                        isValidProposalIndex = Number.isInteger(proposalIndex)
                            && 0 <= proposalIndex
                            && proposalIndex < requirementProposals;
                    }
                } else {
                    isValidProposalIndex = false
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
        isValidIndex = !searchSettings.isValidProposalIndex;
        isValidProposalIndex = searchSettings.isValidProposalIndex;
        isValidHex = false;
    } else if (searchSettings.inputType === "hex") {

        // If hex search type is cached, set search text to only valid hex
        searchHex = prefixHexBytes(searchInput).substring(2);
        isValidIndex = false;
        isValidHex = true;
    } else if (searchSettings.inputType === "recent") {

        // If recent type is cached, set search text to only valid index, and
        // set is recent flag to true
        isValidIndex = true;
        isValidHex = false;
        isRecent = true;

        // Get the requirement index and proposal index to search for in recent
        index = searchSettings.index;
        proposalIndex = searchSettings.proposalIndex;
    }

    // Return search input validations and possible corresponding values
    return {
        isValidIndex: isValidIndex,
        isValidProposalIndex: isValidProposalIndex,
        isValidHex: isValidHex,
        isRecent: isRecent,
        index: index,
        proposalIndex: proposalIndex,
        searchHex: searchHex,
        requirementProposals: requirementProposals
    }
}

/**
 * Searches for the given requirement index and version, and if no version is
 * given, then the most recent version is used
 * @param {Boolean} isRecent Whether the search is for recent requirements
 * @param {SearchSettings} searchSettings Settings used to initialize search
 * starting from a specific point in the search iteration
 * @param {Number} numberRequirementsValue Total number of requirements
 * @param {Number} index Search requirement index
 * @param {Number} requirementProposals Number of proposals of given requirement
 * @param {?Number} proposalIndex Specific requirement proposal for search
 * @param {?Number} isValidIndexVersion Whether search input parses to
 * a valid index version
 * @returns {Object} Proposal found in search by given search text, search data,
 * and cache values
 * @returns {Proposal} return.proposal Proposal found in search by given search
 * text
 * @returns {?('index' | 'hex' | 'recent')} return.inputType Detected search
 * type
 * @returns {?Number} return.requirementProposals Number of proposals for the
 * given requirement index
 * @returns {?Number} return.numberRequirements Total number of requirements
 * @returns {?Number} return.proposalIndex Proposal index wihtin the given
 * requirement
 * @returns {?Number} return.index Index of search requirement
 * @returns {?Boolean} return.isValidProposalIndex Whether the given input is a
 * valid requirement proposal index
 * @returns {?Number} return.startIndex Proposal index in requirement to
 * continue hex search
 */
async function searchByIndex(
    isRecent,
    searchSettings,
    numberRequirements,
    index,
    requirementProposals,
    proposalIndex,
    isValidProposalIndex
) {

    // Whether searching by recent
    let inputType;
    if (isRecent) {
        inputType = "recent";
        index = numberRequirements - 1;
    } else {
        inputType = "index";
    }

    // Get requirement index if not already cached
    if ("index" in searchSettings) {
        index = searchSettings.index;
    }

    // Get number of proposals for requirement index if not already cached
    if ("requirementProposals" in searchSettings) {
        requirementProposals = searchSettings.requirementProposals;
    } else {
        requirementProposals = Number(
            await theListContract.getRequirementProposals(index)
        );
    }

    // Get requirement proposal index, and default to most recent proposal
    if ("proposalIndex" in searchSettings) {
        proposalIndex = searchSettings.proposalIndex;
    } else if (!proposalIndex) {
        proposalIndex = requirementProposals - 1;
    }

    // Validate requirement proposal index
    if (proposalIndex < 0 || requirementProposals <= proposalIndex) {
        return null;
    }

    // Get the requirement proposal from the blockchain
    let proposalHash = await theListContract
        .getRequirementProposalHash(index, proposalIndex);
    let proposalValidator = await theListContract
        .getRequirementProposalAddress(index, proposalIndex);
    let proposalVotesFor = await theListContract
        .getRequirementProposalVotesFor(index, proposalIndex);

    // Return the proposal data, search variables, and cached data
    return {
        proposal: {
            hash: proposalHash,
            index: index,
            proposalIndex: proposalIndex,
            validator: proposalValidator,
            votesFor: proposalVotesFor
        },
        inputType: inputType,
        requirementProposals: requirementProposals,
        numberRequirements: numberRequirements,
        proposalIndex: proposalIndex,
        index: index,
        isValidProposalIndex: isValidProposalIndex
    };
}

/**
 * Sequentially searches for requirements with matching given search hex
 * @param {String} searchHex Hex search input string
 * @param {SearchSettings} searchSettings Settings used to initialize search
 * starting from a specific point in the search iteration
 * @param {Number} numberRequirementsValue Total number of requirements
 * @returns {Object} Proposal found in search by given search text, search data,
 * and cache values
 * @returns {Proposal} return.proposal Proposal found in search by given search
 * text
 * @returns {?('index' | 'hex' | 'recent')} return.inputType Detected search
 * type
 * @returns {?Number} return.requirementProposals Number of proposals for the
 * given requirement index
 * @returns {?Number} return.numberRequirements Total number of requirements
 * @returns {?Number} return.proposalIndex Proposal index wihtin the given
 * requirement
 * @returns {?Number} return.index Index of search requirement
 * @returns {?Boolean} return.isValidProposalIndex Whether the given input is a
 * valid requirement proposal index
 * @returns {?Number} return.startIndex Proposal index in requirement to
 * continue hex search
 */
async function searchByHex(searchHex, searchSettings, numberRequirements) {

    // Hex search variables
    let startIndex;
    let startProposalIndex;

    // Get the requirement index by cache, and default to most recent
    //requirement
    if ("index" in searchSettings) {
        startIndex = searchSettings.index;
    } else {
        startIndex = numberRequirements;
    }

    // Get the number of proposals of the selected requirement if not
    // already cached
    let requirementProposals;
    if ("requirementProposals" in searchSettings) {
        requirementProposals = searchSettings.requirementProposals;
    } else {
        requirementProposals = Number(
            await theListContract.getRequirementProposals(startIndex)
        );
    }

    // Get the requirement proposal index, and default to the most recent
    // proposal in the selected requirement
    if ("proposalIndex" in searchSettings) {
        startProposalIndex = searchSettings.proposalIndex;
    } else {
        startProposalIndex = requirementProposals - 1;
    }

    // Start search from search settings start proposal index
    let proposalIteration = startProposalIndex;

    // Iterate over the requirements
    for (let i = startIndex; i >= 0; i--) {

        // Iterate over the requirement proposals
        while (proposalIteration >= 0) {

            // Get the requirement proposal data
            const proposalHash = await theListContract
                .getRequirementProposalHash(i, proposalIteration);
            const proposalValidator = await theListContract
                .getRequirementProposalAddress(i, proposalIteration);
            const proposalVotesFor = await theListContract
                .getRequirementProposalVotesFor(i, proposalIteration);

            // If the proposal hash or validator matches the search hex,
            // then return the proposal
            if (proposalHash.includes(searchHex)
                || proposalValidator.includes(searchHex)
            ) {
                return {
                    proposal: {
                        hash: proposalHash,
                        index: i,
                        proposalIndex: proposalIteration,
                        validator: proposalValidator,
                        votesFor: proposalVotesFor
                    },
                    inputType: "hex",
                    numberRequirements: numberRequirements,
                    startIndex: startIndex,
                    requirementProposals: requirementProposals,
                    startProposalIndex: startProposalIndex,
                    proposalIndex: proposalIteration,
                    index: i
                };
            }

            // Iterate to previous proposal
            proposalIteration--;
        }

        // If requirement is fixed, then end the search after finding all
        // proposals of given requirement
        if (fixedRequirement) {
            break;
        }

        // Iterate to most recent proposal of the previous requirement
        if (i !== 0) {
            requirementProposals = Number(
                await theListContract.getRequirementProposals(i - 1)
            );
        }
        proposalIteration = requirementProposals - 1;
    }

    // Return null if no proposals found
    return null;
}

/**
 * Executes the beginning of a new proposal search
 */
async function executeSearch() {

    // Initialize search variables
    pageItems = { items: [], nextPageSettings: [] };
    maxSearchItems = null;
    let searchSettings = {};
    if (fixedRequirement) {
        searchSettings.index = requirementIndexValue;
    }

    // Searches for the first page of proposals
    await search(searchSettings, 0, pageItems, true);

    // If there were items retrieved, then update the item count for the page
    if (pageItems.items[currentPage].length > 0) {
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