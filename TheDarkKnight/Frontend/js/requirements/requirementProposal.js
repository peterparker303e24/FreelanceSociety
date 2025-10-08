import { ethers, keccak256 } from "../libs/ethers.min.js";
import * from as JSZip "../libs/jszip.min.js";
import {
    loadHeader,
    addClass,
    prefixHexBytes,
    formatFileStructure,
    removeClass,
    formatRequirementJson,
    replaceClass,
    parseUserData
} from "../../utils/commonFunctions.js";
import { THE_LIST_CONTRACT_ADDRESS, USERS_CONTRACT_ADDRESS } from "../../utils/constants.js";

// Page elements
const idText = document.getElementById("requirement-proposal-id");
const hashText = document.getElementById("proposal-hash");
const validatorText = document.getElementById("proposal-validator");
const votesForText = document.getElementById("proposal-votes-for");
const voteForButton = document.getElementById("vote-for-button");
const voteForError = document.getElementById("vote-for-error");
const discoverSection = document.getElementById("discover-section");
const autoDiscoverButton = document.getElementById("auto-discover-button");
const autoDownloadError = document.getElementById("auto-download-error");
const autoDiscoverSection = document.getElementById("auto-section");
const manualDiscoverButton = document.getElementById("manual-discover-button");
const manualSection = document.getElementById("manual-section");
const userSearch = document.getElementById("validator-search-box");
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

// Get The List and users contracts
const usersContractAddress = USERS_CONTRACT_ADDRESS;
const theListContractAddress = THE_LIST_CONTRACT_ADDRESS;
const provider = new ethers.BrowserProvider(window.ethereum);
const usersAbi = await fetch('./data/abi/usersAbi.json');
const theListAbi = await fetch('./data/abi/theListAbi.json');
const usersJson = await usersAbi.json();
const theListJson = await theListAbi.json();
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

// Get requirement and proposal indices and default each to 0 if neither are
// found
const url = new URL(window.location.href);
const params = Object.fromEntries(url.searchParams.entries());
const requirementIndex = Number(params.index) ?? "0";
const proposalIndex = Number(params.proposalIndex) ?? "0";

// Load the user
try {
    await provider.send("eth_requestAccounts", []);
} catch {
    voteForError.textContent = "[X] ERROR: no wallet found";
}

// Get the user signer
const signer = await provider.getSigner();
const address = signer.address;
const signerTheListContract = new ethers.Contract(
    theListContractAddress,
    theListJson.abi,
    signer
);

// Get user activation status
const userActivated = await usersContract.activeUsers(address);

// Requirement proposal variables
let validatorAddress;
let proposalHash;
let proposalVotesFor;
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
let didVote;

// Sets the requirement proposal ID from the url parameters
idText.textContent
    = `Requirement Proposal ID: ${requirementIndex}_${proposalIndex}`;

// Retrieves the proposal data from the blockchain, then updates the display
getProposalData().then((proposalData) => {
    if (proposalData === null) {
        return;
    }

    // Set data variables
    proposalHash = proposalData.proposalHash;
    validatorAddress = proposalData.validatorAddress;
    proposalVotesFor = proposalData.proposalVotesFor;
    didVote = proposalData.didVoteProposal;

    // Show proposal data
    hashText.textContent = `Proposal Hash:\r\n${proposalHash}`;
    validatorText.textContent
        = `Proposal Manager Address:\r\n${validatorAddress}`;
    votesForText.textContent = `Proposal Votes For: ${proposalVotesFor} `
        + `(${didVote ? "Already Voted" : "Not Yet Voted"})`;

    // Unlock vote button is user has not voted for proposal
    if (!didVote) {
        replaceClass(
            voteForButton,
            "inactive-payable-button",
            "payable-button"
        );
    }
});

// Toggles to the manual search data view
manualDiscoverButton.addEventListener("click", () => {
    removeClass(manualSection, "hide");
    addClass(autoDiscoverSection, "hide");
});

// Toggles to the auto search data view
autoDiscoverButton.addEventListener("click", () => {

    // Validate the requirement proposal hash is available then update page
    if (proposalHash === undefined) {
        return;
    }
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

// Redirects to view proposals page using the requirement index of this page
viewProposalsButton.addEventListener("click", () => {
    window.location.href
        = `pages/requirements/viewProposals.html?index=${requirementIndex}`;
});

// Redirects to view requirements page using the requirement index of this page
viewOtherVersionsButton.addEventListener("click", () => {
    window.location.href
        = `pages/requirements/viewRequirements.html?search=${requirementIndex}`;
});

// Redirects to the add requirement proposal page using the requirement index of
// this page
proposeUpdateButton.addEventListener("click", () => {
    window.location.href = `pages/requirements/addRequirementProposal.html?`
        + `index=${requirementIndex}`;
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

// Continue to search for the requirement proposal data through other user links
// if the user has any links left
skipLinkButton.addEventListener("click", skipLink);

// Votes for the current proposal if available, then updates the display
voteForButton.addEventListener("click", voteFor);

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
        if (fileHash != proposalHash) {
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
            + `${proposalHash.substring(2)}/Requirement.zip`
        );
        if (!response.ok) {
            continue;
        }
        const arrayBuffer = await response.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        // Validate the data hash matches requirement hash
        const downloadHash = keccak256(uint8Array).toString('hex');
        if (downloadHash !== proposalHash) {
            manualSearchError.textContent = `Incorrect data hash from,`
                + `\r\nUser: ${userSearchValue}`
                + `\r\nAt address: ${userUrl}/TheList/`
                + `${proposalHash.substring(2)}/Requirement.zip`;
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
        + `/TheList/${proposalHash.substring(2)}/Requirement.json`;
}

/**
 * Tries to download requirement data from the current user link
 */
async function tryDownload() {
    if (autoUserLinks.length <= autoUserLinksIndex) {
        return;
    }

    // Download data from current user link
    const userUrl = autoUserLinks[autoUserLinksIndex];
    const response = await fetch(
        `${userUrl}/TheList/${proposalHash.substring(2)}/Requirement.zip`
    );

    // Validate correct link response
    if (!response.ok) {
        autoDownloadError.textContent = `Download failed from ${userUrl}`
            + `/TheList/${proposalHash.substring(2)}/Requirement.zip`;
        return;
    }

    // Validate requirement data hash
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const downloadHash = keccak256(uint8Array).toString('hex');
    if (downloadHash === proposalHash) {

        // Parse file
        dataHashMatchFound(arrayBuffer);
    } else {
        autoDownloadError.textContent = `Incorrect data hash from ${userUrl}`
            + `/TheList/${proposalHash.substring(2)}/Requirement.zip`;
    }
}

/**
 * Gets the requirement proposal data for the current page
 * @returns {Object} Requirement proposal data
 * @returns {String} return.validatorAddress Requirement proposal creation
 * address
 * @returns {String} return.proposalHash Requirement proposal data hash
 * @returns {Number} return.proposalVotesFor Number of votes for the proposal
 * for the requirement
 * @returns {Boolean} return.didVoteProposal Whether the current user has voted
 * for the requirement proposal
 */
async function getProposalData() {
    return {
        validatorAddress: await theListContract.getRequirementProposalAddress(
            requirementIndex,
            proposalIndex
        ),
        proposalHash: await theListContract.getRequirementProposalHash(
            requirementIndex,
            proposalIndex
        ),
        proposalVotesFor: await theListContract.getRequirementProposalVotesFor(
            requirementIndex,
            proposalIndex
        ),
        didVoteProposal: await theListContract.getRequirementProposalDidVote(
            requirementIndex,
            proposalIndex,
            address
        )
    };
}

/**
 * Visually updates the save requirement data button and creates download
 * functionality when save button is clicked
 */
function unlockSaveRequirementProposalLocally() {

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
            = `Requirement${requirementIndex}.${proposalHash}.zip`;
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
    unlockSaveRequirementProposalLocally();
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
                searchBlock: Number(
                    firstBlockEventArgs[firstBlockEventArgs.length - 1]
                )
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
        // interaction block of the earliest event and recursively return the
        // data in that block
        const allEvents = await usersContract.queryFilter(
            "*",
            searchBlock,
            searchBlock
        );
        let lastInteractionBlockIndex;
        if (allEvents.length > 0) {
            const firstBlockEventArgs = allEvents[0].args;
            lastInteractionBlockIndex
                = Number(firstBlockEventArgs[firstBlockEventArgs.length - 1]);
        } else {
            lastInteractionBlockIndex
                = Number(await theListContract.lastInteractionBlockIndex(
                    { blockTag: searchBlock }
                ));
        }
        if (lastInteractionBlockIndex === 0) {
            return {};
        }
        return await autoDiscoverRequirement({
            searchBlock: lastInteractionBlockIndex
        });
    }
}

/**
 * User votes for the current proposal if available, then updates the display
 */
async function voteFor() {

    // Validate user can vote for proposal
    if (!userActivated) {
        voteForError.textContent = "[X] ERROR: User inactivated";
        return;
    }
    if (didVote) {
        return;
    }

    // User votes for the current proposal and updates the display
    const transactionResponse
        = await signerTheListContract.voteRequirementUpdate(
            requirementIndex,
            proposalIndex
        );
    transactionResponse.wait().then(async () => {
        const newVotesFor = await theListContract
            .getRequirementProposalVotesFor(
                requirementIndex,
                proposalIndex
            )
        proposalVotesFor = newVotesFor;
        didVote = true;
        votesForText.textContent = `Proposal Votes For: ${proposalVotesFor} `
            + `(${didVote ? "Already Voted" : "Not Yet Voted"})`;
        replaceClass(voteForButton, "payable-button", "inactive-payable-button")
    });
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
            + `${proposalHash.substring(2)}/Requirement.json`;
    });
}
