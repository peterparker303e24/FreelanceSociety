import { ethers, keccak256 } from "../libs/ethers.min.js";
import * as JSZip from "../libs/jszip.min.js";
import {
    loadHeader,
    prefixHexBytes,
    removeClass,
    addClass,
    getRequirementVersionData,
    replaceClass,
    formatFileStructure,
    formatRequirementJson,
    parseUserData
} from "../../utils/commonFunctions.js";
import { THE_LIST_CONTRACT_ADDRESS, USERS_CONTRACT_ADDRESS, THE_LIST_CONTRACT_MINIMUM_BLOCK } from "../../utils/constants.js";

// Page elements
const idText = document.getElementById("requirement-id");
const hashText = document.getElementById("requirement-hash");
const userText = document.getElementById("requirement-user");
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
const requirementJsonArea = document.getElementById("requirement-json");
const saveLocallyButton = document.getElementById("save-locally-button");
const downloadRequirementAnchor
    = document.getElementById("download-requirement-anchor");
const uploadLocallyButton = document.getElementById("upload-locally-button");
const uploadErrorText = document.getElementById("upload-locally-error");
const zipInput = document.getElementById("file-input");
const viewProposalsButton = document.getElementById("view-proposals-button");
const viewOtherVersionsButton
    = document.getElementById("view-other-versions-button");
const proposeUpdateButton = document.getElementById("propose-update-button");
const requirementFileTreeArea
    = document.getElementById("requirement-file-tree");

// Load the header button navigation functionality
loadHeader();

// Users and The List contract addresses on the blockchain
const usersContractAddress = USERS_CONTRACT_ADDRESS;
const theListContractAddress = THE_LIST_CONTRACT_ADDRESS;

// Minimum block number for contracts interactions'
const minimumBlockNumber = THE_LIST_CONTRACT_MINIMUM_BLOCK;

// Gets provider's access to contracts
const usersAbi = await fetch('./data/abi/usersAbi.json');
const theListAbi = await fetch('./data/abi/theListAbi.json');
const usersJson = await usersAbi.json();
const theListJson = await theListAbi.json();
const provider = new ethers.BrowserProvider(window.ethereum);
const usersContract = new ethers.Contract(
    usersContractAddress,
    usersJson.abi,
    provider
);
const theListContract = new ethers.Contract(
    theListContractAddress,
    theListJson.abi,
    provider
);

// Gets the URL parameters and defaults to 0.1
const url = new URL(window.location.href);
const params = Object.fromEntries(url.searchParams.entries());
const requirementIdVersion = params.id ?? "0-1";
const requirementIdVersionSplit = requirementIdVersion.indexOf("-");

// Requirement index and version
const requirementId = Number(
    requirementIdVersion.substring(0, requirementIdVersionSplit)
);
const requirementVersion = Number(
    requirementIdVersion.substring(requirementIdVersionSplit + 1)
);

// Page interaction variables
let validatorAddress;
let versionHash;
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

// Updates the text of the requirement index and version
idText.textContent = `Requirement Id: ${requirementId}-${requirementVersion}`;

// Retrieves the requirement data and updates the display on the page
getRequirementVersionData(
    provider,
    theListContract,
    requirementId,
    requirementVersion,
    THE_LIST_CONTRACT_MINIMUM_BLOCK
)
    .then((versionData) => {
        if (versionData !== null) {
            versionHash = versionData.versionHash;
            validatorAddress = versionData.validatorAddress;
            hashText.textContent = `Requirement Hash:\r\n${versionHash}`;
            userText.textContent = `Requirement Manager Address:\r\n`
                + `${validatorAddress}`;
        }
    });

// Toggles to the manual search data view
manualDiscoverButton.addEventListener("click", () => {
    removeClass(manualSection, "hide");
    addClass(autoDiscoverSection, "hide");
});

// Toggles to the auto search data view
autoDiscoverButton.addEventListener("click", () => {

    // Validate the requirement version hash is available then update page
    if (versionHash === undefined) {
        return;
    }
    replaceClass(tryDownloadButton, "inactive-border-button", "border-button");
    removeClass(autoDiscoverSection, "hide");
    addClass(manualSection, "hide");

    // Automatically search for requirement data
    continueSearch({});
});

// Displays zip input custom button, then clicks hidden zip input button
uploadLocallyButton.addEventListener("click", () => {

    // Only upload if data has not yet been retrieved
    if (!saveLocallyButtonUnlocked) {
        zipInput.click();
    }
});

// Redirects to view proposal page using the requirement index of this page
viewProposalsButton.addEventListener("click", () => {
    window.location.href = `pages/requirements/viewProposals.html?index=${requirementId}`;
});

// Redirects to view requirements page using the requirement index of this page
viewOtherVersionsButton.addEventListener("click", () => {
    window.location.href = `pages/requirements/viewRequirements.html?search=`
        + `${requirementId}`;
});

// Redirects to the add requirement proposal page using the requirement index of
// this page
proposeUpdateButton.addEventListener("click", () => {
    window.location.href = `pages/requirements/addRequirement.html?index=`
        + `${requirementId}`;
});

// Prompts user for upload of requirement zip, and displays requirement if valid
zipInput.addEventListener("change", zipInputClicked);

// After any change in the user search textbox, the user is searched for and if
// the user exists, then the data is searched through their links
userSearch.addEventListener("input", searchUser);

// When the button is clicked, the data tries to download from the displayed
// user/website
tryDownloadButton.addEventListener("click", tryDownload);

// Continue to search for the requirement data through other users if any users
// are left
skipAddressButton.addEventListener("click", () => {
    if (canSkipAddress) {
        continueSearch(autoSearchCriteria);
    }
});

// Continue to search for the requirement data through other user links if the
// user has any links left
skipLinkButton.addEventListener("click", skipLink);

/**
 * @typedef {Object} SearchCriteria Search data for getting users links and data
 * @property {Number} searchBlock Blockchain block index to search
 * @property {Number} eventIndex Event within block to search
 */

/**
 * Validates the zip input of the user matches the expected requirement has, and
 * if so the requirement.json data tries to be extracted
 * @param {Event} event Zip input button click event
 */
async function zipInputClicked(event) {

    // Reset error text
    uploadErrorText.textContent = "";

    // Validate the input is a .zip
    const inputFile = event.target.files[0];
    if (inputFile.type !== 'application/zip') {
        uploadErrorText.textContent
            = "[X] ERROR: File uploaded is not a zip file";
        return;
    }

    // Read the zip file data
    const reader = new FileReader();
    reader.readAsArrayBuffer(inputFile);

    // On loading the zip data
    reader.onload = async function (event) {
        const arrayBuffer = event.target.result;
        const fileBytes = new Uint8Array(arrayBuffer);

        // Validate requirement hash matches expected
        const fileHash = keccak256(fileBytes).toString('hex');
        if (fileHash != versionHash) {
            uploadErrorText.textContent = "[X] ERROR: Uploaded .zip file hash "
                + "does not match requirement hash";
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
 * Searches the user from the user address textbox for requirement data from
 * their links
 */
async function searchUser() {

    // Formats the hex bytes
    const userSearchValue = prefixHexBytes(userSearch.value);

    // Validate user address
    if (userSearchValue === null || userSearchValue.length !== 42) {
        return;
    }

    // Get each link from the comma separated list of user
    const userLinks = await usersContract.links(userSearchValue);
    const userLinksArray = userLinks.split(",");

    // Search each link as URL to find data matching requirement hash
    for (let i = 0; i < userLinksArray.length; i++) {

        // Try to read the link as a URL and upon failure continue to next link
        let userUrl = null;
        try {
            userUrl = new URL(userLinksArray[i]);
        } catch (_) {
            continue;
        }

        // Retrieve data from link
        const response = await fetch(`${userUrl}/TheList/`
            + `${versionHash.substring(2)}/Requirement.zip`
        );
        if (!response.ok) {
            continue;
        }
        const arrayBuffer = await response.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        // Validate the data hash matches requirement hash
        const downloadHash = keccak256(uint8Array).toString('hex');
        if (downloadHash !== versionHash) {
            manualSearchError.textContent = `Incorrect data hash from,`
                + `\r\nUser: ${userSearchValue}`
                + `\r\nAt address: ${userUrl}/TheList/`
                + `${versionHash.substring(2)}/Requirement.zip`;
            continue;
        }

        // Data found so reset manual search error and parse file
        manualSearchError.textContent = "";
        dataHashMatchFound(arrayBuffer);
        return;
    }

    // Display error if data not found from user
    manualSearchError.textContent = `[X] ERROR: Requirement data not found from `
        + `user: ${userSearchValue}`;
}

/**
 * Tries to download requirement data from the current user link
 */
async function tryDownload() {

    if (!canSkipAddress && !canSkipLink) {
        return;
    }

    // Download data from current user link
    const userUrl = autoUserLinks[autoUserLinksIndex];
    const response = await fetch(
        `${userUrl}/TheList/${versionHash.substring(2)}/Requirement.zip`
    );

    // Validate correct link response
    if (!response.ok) {
        autoDownloadError.textContent = `Download failed from ${userUrl}`
            + `/TheList/${versionHash.substring(2)}/Requirement.zip`;
        return;
    }

    // Validate requirement data hash
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const downloadHash = keccak256(uint8Array).toString('hex');
    if (downloadHash === versionHash) {

        // Parse file
        dataHashMatchFound(arrayBuffer);
    } else {
        autoDownloadError.textContent = `Incorrect data hash from ${userUrl}`
            + `/TheList/${versionHash.substring(2)}/Requirement.zip`;
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
        + `/TheList/${versionHash.substring(2)}/Requirement.json`;
}

/**
 * Visually updates the save requirement data button and creates download
 * functionality when save button is clicked
 */
function unlockSaveRequirementLocally() {

    // If the save button is already unlocked, no need to unlock again
    if (saveLocallyButtonUnlocked) {
        return;
    }

    // Update the save button visual to interactable
    replaceClass(saveLocallyButton, "inactive-border-button", "border-button");

    // Downloads the requirement data on button click
    saveLocallyButton.addEventListener("click", () => {
        const blob = new Blob([localZipFile], { type: 'application/zip' });
        const url = URL.createObjectURL(blob);
        downloadRequirementAnchor.href = url;
        downloadRequirementAnchor.download
            = `Requirement${requirementId}.${requirementVersion}.zip`;
        downloadRequirementAnchor.click();
    });

    // Save button is now unlocked
    saveLocallyButtonUnlocked = true;
}

/**
 * Displays the zip file contents in the file tree
 * @param {File} zipFile Zip file with matching requirement hash
 */
async function dataHashMatchFound(zipFile) {

    // Update zip file variable
    localZipFile = zipFile;

    // Unlock the save file button and lock the upload file button
    unlockSaveRequirementLocally();
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
        requirementFileTreeArea.textContent = `Error parsing .zip file`;
        return;
    }

    // Set zip file tree structure
    requirementFileTreeArea.textContent = formatFileStructure(zipFileContents);

    // Parse requirement json data for display
    const requirementJson
        = zipContents.file(`${outerFolderName}/requirement.json`);
    if (!requirementJson) {
        requirementJsonArea.textContent
            = `[X] ERROR: requirement.json not found under directory path`;
        return;
    }
    let jsonObject;
    try {
        const content = await requirementJson.async("string");
        jsonObject = JSON.parse(content);
    } catch (error) {
        requirementJsonArea.textContent
            = `[X] ERROR: Problem parsing requirement.json`;
        return;
    }
    try {
        requirementJsonArea.textContent = formatRequirementJson(jsonObject);
    } catch (error) {
        requirementJsonArea.textContent
            = `[X] ERROR: Problem reading requirement.json`;
        return;
    }
}

/**
 * Given the search criteria iteratively searches for the next user data in the
 * search
 * @param {SearchCriteria} searchCriteria Search data for getting users links
 * and data
 * @returns {Object} Next search criteria and possible user data
 * @returns {SearchCriteria} return.searchCriteria Search data for getting users
 * links and data for the next search iteration
 * @returns {?String} return.userAddress Address of user found
 * @returns {?String} return.userLinks Most recent links of user found
 * @returns {?String} return.userData Most recent data of user found
 */
async function autoDiscoverRequirement(searchCriteria) {

    // Get search block using cache if available
    let searchBlock;
    if ("searchBlock" in searchCriteria) {
        searchBlock = searchCriteria.searchBlock;
    } else {
        searchBlock = Number(await usersContract.lastInteractionBlockIndex());
    }

    // Get user activation events
    const linksFilter = await usersContract.filters
        .ActivateUserLinks().getTopicFilter();
    const linksDataFilter = await usersContract.filters
        .ActivateUserLinksData().getTopicFilter();
    const linksLockoutFilter = await usersContract.filters
        .ActivateUserLinksLockout().getTopicFilter();
    const linksDataLockoutFilter = await usersContract.filters
        .ActivateUserLinksDataLockout().getTopicFilter();
    const activateUserFilters = [
        linksFilter
            .concat(linksDataFilter)
            .concat(linksLockoutFilter)
            .concat(linksDataLockoutFilter)
    ];
    let events = await usersContract.queryFilter(
        activateUserFilters,
        searchBlock,
        searchBlock
    );

    // Get the event index cache if multiple events in one block
    let searchEventIndex = 0;
    if ("eventIndex" in searchCriteria) {
        searchEventIndex = searchCriteria.eventIndex;
    }

    // Search criteria for next user search
    let nextSearchCriteria;

    // If any events are in the search block, then get their user data,
    // otherwise set search criteria to the last interaction block
    if (events.length !== 0) {

        // If all user events in block searched, then search last interaction
        // block, and otherwise search next user event in block
        if (searchEventIndex + 1 === events.length) {

            // Get the last interaction block from the earliest event in the
            // block
            const allEvents = await usersContract.queryFilter(
                "*",
                searchBlock,
                searchBlock
            );
            const firstBlockEventArgs = allEvents[0].args;
            nextSearchCriteria = {
                searchBlock: firstBlockEventArgs[firstBlockEventArgs.length - 1]
            };
        } else {
            nextSearchCriteria = {
                searchBlock: searchBlock,
                eventIndex: searchEventIndex + 1
            };
        }

        // If no other users exist, end data search
        if (nextSearchCriteria.searchBlock === 0) {
            canSkipAddress = false;
            replaceClass(
                skipAddressButton,
                "border-button",
                "inactive-border-button"
            );
        }

        // Get most recent links and data of user
        const userAddress = events[searchEventIndex].args[0];
        const userLinks = await usersContract.links(userAddress);
        const userData = await usersContract.usersData(userAddress);

        // If user has possible valid links, then return data, otherwise return
        // just the next search criteria
        if (userLinks !== "") {
            return {
                userAddress: userAddress,
                userLinks: userLinks,
                userData: userData,
                searchCriteria: nextSearchCriteria
            };
        }
        return {
            searchCriteria: nextSearchCriteria
        };
    } else {

        // If no user activation events in the block, then go to the last
        // interaction block of the earliest event
        const allEvents = await usersContract.queryFilter(
            "*",
            searchBlock,
            searchBlock
        );

        if (allEvents.length > 0) {
            const firstBlockEventArgs = allEvents[0].args;
            return {
                searchCriteria: {
                    searchBlock: firstBlockEventArgs[
                        firstBlockEventArgs.length - 1
                    ]
                }
            };
        } else {
            const lastInteractionBlockIndex
                = await theListContract.lastInteractionBlockIndex();
            return {
                searchCriteria: {
                    searchBlock: lastInteractionBlockIndex
                }
            };
        }


    }
}

/**
 * Continues a single iteration of the user links search
 * @param {SearchCriteria} searchCriteria Search data for getting users links
 * and data
 */
function continueSearch(searchCriteria) {

    // Discovers the next user, then displays the user link information
    autoDiscoverRequirement(searchCriteria).then((user) => {

        // If user not found, then display end of user search
        if (!("userAddress" in user)) {
            tryDownloadButton.textContent = `No more users`;
            canSkipLink = false;
            canSkipAddress = false;
            replaceClass(
                skipLinkButton,
                "border-button",
                "inactive-border-button"
            );
            replaceClass(
                skipAddressButton,
                "border-button",
                "inactive-border-button"
            );
            replaceClass(
                tryDownloadButton,
                "border-button",
                "inactive-border-button"
            );
            return;
        }

        // Update the user address, links, and data
        autoUserAddress = user.userAddress;
        const userLinks = user.userLinks.split(",");
        autoUserData = user.userData;
        autoSearchCriteria = user.searchCriteria;
        autoUserLinks = [];
        if (userLinks) {
            for (let i = 0; i < userLinks.length; i++) {
                try {
                    const url = new URL(userLinks[i]);
                    autoUserLinks.push(url);
                } catch (_) { }
            }
        }

        // If user does not have any valid URL links, then continue search for
        // other users
        if (autoUserLinks.length === 0) {
            continueSearch(autoSearchCriteria);
        }

        // Update user links 
        autoUserLinksIndex = 0;
        canSkipAddress = false;
        canSkipLink = false;

        // If the user has more than one valid link, show skip user link button
        if (autoUserLinks.length > 1) {
            replaceClass(
                skipLinkButton,
                "inactive-border-button",
                "border-button"
            );
            canSkipLink = true;
        } else {
            replaceClass(
                skipLinkButton,
                "border-button",
                "inactive-border-button"
            );
            canSkipLink = false;
        }

        // Show skip user if possibly more users to search
        if (autoSearchCriteria.searchBlock !== 0) {
            replaceClass(
                skipAddressButton,
                "inactive-border-button",
                "border-button"
            );
            canSkipAddress = true;
        }

        // Display retrieved user link
        tryDownloadButton.textContent = `Try download from: `
            + `${parseUserData(autoUserData).data}\r\nAddress: `
            + `${autoUserAddress}\r\nLink: ${autoUserLinks[0]}/TheList/`
            + `${versionHash.substring(2)}/Requirement.json`;
    });
}
