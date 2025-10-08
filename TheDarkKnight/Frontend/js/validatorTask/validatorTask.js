import { ethers, keccak256 } from "../libs/ethers.min.js";
import * as JSZip from "../libs/jszip.min.js";
import {
    loadHeader,
    prefixHexBytes,
    removeClass,
    addClass,
    replaceClass,
    formatFileStructure,
    formatTaskJson,
    updateInputNumberToGroupedDigits,
    continueSearch,
    formatWei,
    getRequirementVersionData,
    formatBlockTimestamp,
    parseUserData
} from "../../utils/commonFunctions.js";
import {
    THE_LIST_CONTRACT_ADDRESS,
    USERS_CONTRACT_ADDRESS,
    VALIDATOR_TASK_CONTRACT_ADDRESS,
    THE_LIST_CONTRACT_MINIMUM_BLOCK
} from "../../utils/constants.js";

// Page elements
const taskId = document.getElementById("task-id");
const validatorTaskHash = document.getElementById("task-hash");
const managerAddress = document.getElementById("manager-address");
const reward = document.getElementById("reward");
const deadline = document.getElementById("deadline");
const completed = document.getElementById("completed");
const taskDefaulted = document.getElementById("task-defaulted");
const submissionsCount = document.getElementById("submissions-count");
const evaluatedSubmissionsCount
    = document.getElementById("evaluated-submissions-count");
const blockValidation
    = document.getElementById("block-validation");
const validationDelay = document.getElementById("validation-delay");
const requirementsCount = document.getElementById("requirements-count");
const validationTime = document.getElementById("validation-time");
const nextSlotTime = document.getElementById("next-slot-time");
const completionAddress = document.getElementById("completion-address");
const completionIndex = document.getElementById("completion-index");
const validatorComission = document.getElementById("validator-comission");
const validators = document.getElementById("validators");
const fundInput = document.getElementById("fund-input");
const fundButton = document.getElementById("fund-button");
const withdrawFundsButton = document.getElementById("withdraw-funds-button");
const fundError = document.getElementById("fund-error");
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
const taskJsonArea = document.getElementById("task-json");
const saveLocallyButton = document.getElementById("save-locally-button");
const downloadTaskAnchor = document.getElementById("download-task-anchor");
const uploadLocallyButton = document.getElementById("upload-locally-button");
const uploadErrorText = document.getElementById("upload-locally-error");
const zipInput = document.getElementById("file-input");
const submitTaskButton = document.getElementById("submit-task-button");
const viewTaskSubmissions
    = document.getElementById("view-task-submissions-button");
const viewValidatorTasksButton
    = document.getElementById("view-validator-tasks-button");
const addValidatorTaskButton
    = document.getElementById("add-validator-task-button");
const taskFileTreeArea
    = document.getElementById("task-file-tree");

// Load the header button navigation functionality
loadHeader();

// Users, hash task, and The List contract addresses on the blockchain
const usersContractAddress = USERS_CONTRACT_ADDRESS;
const validatorTaskContractAddress = VALIDATOR_TASK_CONTRACT_ADDRESS;
const theListContractAddress = THE_LIST_CONTRACT_ADDRESS;

// Gets provider's access to contracts
const usersAbi = await fetch('./data/abi/usersAbi.json');
const validatorTaskAbi = await fetch('./data/abi/validatorTaskAbi.json');
const theListAbi = await fetch('./data/abi/theListAbi.json');
const usersJson = await usersAbi.json();
const validatorTaskJson = await validatorTaskAbi.json();
const theListJson = await theListAbi.json();
const provider = new ethers.BrowserProvider(window.ethereum);
const usersContract = new ethers.Contract(
    usersContractAddress,
    usersJson.abi,
    provider
);
const validatorTaskContract = new ethers.Contract(
    validatorTaskContractAddress,
    validatorTaskJson.abi,
    provider
);
const theListContract = new ethers.Contract(
    theListContractAddress,
    theListJson.abi,
    provider
);

// Gets the URL parameters
const url = new URL(window.location.href);
const params = Object.fromEntries(url.searchParams.entries());

// Redirect to validator task search if url hash task id param invalid
let validValidatorTaskId = false;
let validatorTaskIndex;
if (typeof (params.id) === "string") {
    const urlId = params.id;
    const taskIdSplit = urlId.indexOf("-");
    if (taskIdSplit > 0) {
        const taskType = urlId.substring(0, taskIdSplit);
        if (taskType === "v" && urlId.length > taskIdSplit + 1) {
            const taskIndex = Number(urlId.substring(taskIdSplit + 1));
            if (taskIndex >= 0) {
                validatorTaskIndex = taskIndex;
                validValidatorTaskId = true;
            }
        }
    }
}
if (!validValidatorTaskId) {
    window.location.href = "pages/viewTasks.html?search=v";
}

// Page interaction variables
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
let canFundTask;
let canWithdrawFunds;
let isBeforeDeadline;
let isTaskComplete;
let taskDefaultedValue;
let signer;
let validatorTaskSigner;
let taskManagerAddress;
let isKeyReveal;
let nextSlotTimeValue;
let userAddress;
let validatorTaskHashValue;
let submissionsCountValue;
let evaluatedSubmissionsCountValue;
let requirementsCountValue;
let validationTimeValue;
let blockValidationValue;
let validationDelayValue;
let completionAddressValue;
let validatorComissionValue;
let validatorsValue;
let submissionCompletionIndex;
const emptyHash
    = "0x0000000000000000000000000000000000000000000000000000000000000000";
const emptyAddress
    = "0x0000000000000000000000000000000000000000";
const validatorTaskIndexValue = Number(validatorTaskIndex);

// Updates the text of the task ID
taskId.textContent = `Task ID: v-${validatorTaskIndex}`;

// Update hash task variables with data retrieved from the blockchain
validatorTaskContract
    .getTaskHash(validatorTaskIndexValue)
    .then(h => {
        validatorTaskHashValue = h;
        validatorTaskHash.textContent = `Task Hash:\r\n${validatorTaskHashValue}`;

        // Allow the user to withdraw funds if available
        updateWithdrawFundsSection();
    });
validatorTaskContract
    .getManagerAddress(validatorTaskIndexValue)
    .then(a => {
        taskManagerAddress = a;
        managerAddress.textContent = `Manager Address:\r\n${taskManagerAddress}`;

        // Allow the user to withdraw funds if available
        updateWithdrawFundsSection();
    });
validatorTaskContract
    .getContributionTotalWei(validatorTaskIndexValue)
    .then(w => {
        reward.textContent
            = `Reward (Wei): ${formatWei(w)}`;
    });
validatorTaskContract
    .getDeadline(validatorTaskIndexValue)
    .then(d => {
        deadline.textContent
            = `Deadline (UTC): ${new Date(Number(d) * 1000).toUTCString()}`;

        // Allow the user to fund the task if the task deadline has not arrived
        isBeforeDeadline = Math.floor(Date.now() / 1000) <= Number(d);
        if (isBeforeDeadline) {
            canFundTask = true;
            replaceClass(
                fundButton,
                "inactive-payable-button",
                "payable-button"
            );
        }

        // Allow the user to withdraw funds if available
        updateWithdrawFundsSection();
    });
validatorTaskContract
    .getTaskComplete(validatorTaskIndexValue)
    .then(c => {
        isTaskComplete = c;
        completed.textContent = `Completed: ${isTaskComplete ? "TRUE" : "FALSE"}`;

        validatorTaskContract
            .getCompletionSubmissionIndex(validatorTaskIndexValue)
            .then(s => {
                submissionCompletionIndex = s;
                if (isTaskComplete) {
                    completionIndex.textContent
                        = `Completion Index: ${submissionCompletionIndex}`;
                    validatorTaskContract
                        .getSubmissionWorkerAddress(
                            validatorTaskIndexValue,
                            submissionCompletionIndex
                        ).then(c => {
                            completionAddressValue = c;
                            completionAddress.textContent = `Completion Address:`
                                + `\r\n${completionAddressValue}`;
                        });
                } else {
                    completionIndex.textContent
                        = `Completion Index: X`;
                    completionAddress.textContent
                        = `Completion Address: X`;
                }

            });

        // Allow the user to withdraw funds if available
        updateWithdrawFundsSection();
    });
validatorTaskContract
    .taskDefaulted(validatorTaskIndexValue)
    .then(d => {
        taskDefaultedValue = d;
        taskDefaulted.textContent
            = `Task Defaulted: ${taskDefaultedValue ? "TRUE" : "FALSE"}`;

        // Allow the user to withdraw funds if available
        updateWithdrawFundsSection();
    });
validatorTaskContract
    .getSubmissionsCount(validatorTaskIndexValue)
    .then(s => {
        submissionsCountValue = Number(s);
        submissionsCount.textContent
            = `Submissions Count: ${submissionsCountValue}`;
    });
validatorTaskContract
    .getEvaluatedSubmissionsCount(validatorTaskIndexValue)
    .then(e => {
        evaluatedSubmissionsCountValue = Number(e);
        evaluatedSubmissionsCount.textContent
            = `Evaluated Submissions Count: ${evaluatedSubmissionsCountValue}`;
    });
validatorTaskContract
    .getBlockValidationSchedule(validatorTaskIndexValue)
    .then(b => {
        blockValidationValue = b;
        blockValidation.textContent
            = `Block Validation: ${blockValidationValue ? "TRUE" : "FALSE"}`;
    });
validatorTaskContract
    .getValidationDelay(validatorTaskIndexValue)
    .then(d => {
        validationDelayValue = d;
        validationDelay.textContent
            = `Validation Delay (Seconds): ${validationDelayValue}`;
    });
validatorTaskContract
    .getRequirementsCount(validatorTaskIndexValue)
    .then(r => {
        requirementsCountValue = Number(r);
        requirementsCount.textContent
            = `Specifications Count: ${requirementsCountValue}`;
    });
validatorTaskContract
    .getValidationTime(validatorTaskIndexValue)
    .then(t => {
        validationTimeValue = Number(t);
        validationTime.textContent
            = `Validation Time (Seconds): ${validationTimeValue}`;
    });
validatorTaskContract
    .getNextSlotTime(validatorTaskIndexValue)
    .then(n => {
        nextSlotTimeValue = Number(n);
        if (nextSlotTimeValue === 0
            || new Date(nextSlotTimeValue * 1000) < new Date()
        ) {
            nextSlotTime.textContent = `Next Slot Time (UTC): Now - `
                + `${new Date().toUTCString()}`;
        } else {
            nextSlotTime.textContent = `Next Slot Time (UTC): `
                + `${formatBlockTimestamp(nextSlotTimeValue)}`;
        }
    });
validatorTaskContract
    .getValidatorComission(validatorTaskIndexValue)
    .then(c => {
        validatorComissionValue = c;
        validatorComission.textContent = `Validator Comission (Wei): `
            + `${formatWei(validatorComissionValue)}`;

    });
validatorTaskContract
    .getValidators(validatorTaskIndexValue)
    .then(v => {
        validatorsValue = v;
        let validatorsListString = "";
        for (let i = 0; i < validatorsValue.length; i++) {
            validatorsListString += `${validatorsValue[i]}\r\n`;
        }
        validators.textContent = `Validators:\r\n${validatorsListString}`;
    });

// Validates reward numerical input
fundInput.addEventListener("input", () => {
    updateInputNumberToGroupedDigits(fundInput);
});

// Create a transaction that funds the hash task if it is possible
fundButton.addEventListener("click", async () => {

    // Only allow the user to fund the task if it's available
    if (canFundTask) {

        // Try to get the user hash task contract signer, and upon any problem
        // display the error
        await getValidatorTaskSigner(fundError);
        if (validatorTaskSigner !== undefined) {

            // Create the funding transaction
            let transactionResponse;
            try {
                transactionResponse = await validatorTaskSigner
                    .fundTask(
                        validatorTaskIndex,
                        { value: BigInt(fundInput.value.replaceAll(" ", "")) }
                    );
            } catch (error) {
                fundError.textContent
                    = `[X] ERROR: Transaction failed - ${error}`;
                return;
            }

            // Refresh the page when the transaction goes through
            transactionResponse.wait().then(async () => {
                window.location.reload();
            });
        } else {
            fundError.textContent
                = "[X] ERROR: Failed to get hash task contract signer";
        }
    }
});

// Create a transaction that withdraws any funds the hash task if it is possible
withdrawFundsButton.addEventListener("click", async () => {
    if (canWithdrawFunds) {

        // Try to get the user hash task contract signer, and upon any problem
        // display the error
        await getValidatorTaskSigner(fundError);
        if (validatorTaskSigner !== undefined) {

            // Create the funding transaction
            let transactionResponse;
            try {
                transactionResponse = await validatorTaskSigner
                    .withdrawTask(validatorTaskIndex);
            } catch (error) {
                fundError.textContent
                    = `[X] ERROR: Transaction failed - ${error}`;
                return;
            }

            // Refresh the page when the transaction goes through
            transactionResponse.wait().then(async () => {
                window.location.reload();
            });
        } else {
            fundError.textContent
                = "[X] ERROR: Failed to get hash task contract signer";
        }
    }
});

// Toggles to the manual search data view
manualDiscoverButton.addEventListener("click", () => {
    removeClass(manualSection, "hide");
    addClass(autoDiscoverSection, "hide");
});

// Toggles to the auto search data view
autoDiscoverButton.addEventListener("click", () => {

    // Task can only be discovered if the task hash is known
    if (validatorTaskHashValue === undefined) {
        return;
    }

    replaceClass(tryDownloadButton, "inactive-border-button", "border-button");
    removeClass(autoDiscoverSection, "hide");
    addClass(manualSection, "hide");

    // Automatically search for task data
    continueSearch(
        {},
        usersContract,
        skipLinkButton,
        skipAddressButton,
        tryDownloadButton,
        (userLinks) => `${userLinks[0]}/Tasks/ValidatorTasks/`
            + `${validatorTaskHashValue.substring(2)}/Task.zip`

    ).then((linkSearchData) => {
        autoUserAddress = linkSearchData.autoUserAddress;
        autoUserData = linkSearchData.autoUserData;
        autoUserLinks = linkSearchData.autoUserLinks;
        autoUserLinksIndex = linkSearchData.autoUserLinksIndex;
        canSkipAddress = linkSearchData.canSkipAddress;
        canSkipLink = linkSearchData.canSkipLink;
        autoSearchCriteria = linkSearchData.autoSearchCriteria;
    });
});

// Displays zip input custom button, then clicks hidden zip input button
uploadLocallyButton.addEventListener("click", () => {

    // Only upload if data has not yet been retrieved
    if (!saveLocallyButtonUnlocked) {
        zipInput.click();
    }
});

// Redirects to view proposal page using the task index of this page
submitTaskButton.addEventListener("click", () => {
    window.location.href = `pages/validatorTask/submitValidatorTask.html?`
        + `index=${validatorTaskIndex}`;
});

// Redirects to view task submissions page using the task index of this page
viewTaskSubmissions.addEventListener("click", () => {
    window.location.href = `pages/validatorTask/viewValidatorTaskSubmissions`
        + `.html?index=${validatorTaskIndex}`;
});

// Redirects to view tasks page using the task index of this page
viewValidatorTasksButton.addEventListener("click", () => {
    window.location.href = `pages/viewTasks.html?search=v`;
});

// Redirects to the add task proposal page using the task index of
// this page
addValidatorTaskButton.addEventListener("click", () => {
    window.location.href = `pages/validatorTask/addValidatorTask.html?index=`
        + `${validatorTaskIndex}`;
});

// Prompts user for upload of task zip, and displays task if valid
zipInput.addEventListener("change", zipInputClicked);

// After any change in the user search textbox, the user is searched for and if
// the user exists, then the data is searched through their links
userSearch.addEventListener("input", searchUser);

// When the button is clicked, the data tries to download from the displayed
// user/website
tryDownloadButton.addEventListener("click", tryDownload);

// Continue to search for the task data through other users if any users
// are left
skipAddressButton.addEventListener("click", () => {
    if (canSkipAddress) {
        continueSearch(
            autoSearchCriteria,
            usersContract,
            skipLinkButton,
            skipAddressButton,
            tryDownloadButton,
            (userLinks) => `${userLinks[0]}/Tasks/ValidatorTasks/`
                + `${validatorTaskHashValue.substring(2)}/Task.zip`
        ).then((linkSearchData) => {
            autoUserAddress = linkSearchData.autoUserAddress;
            autoUserData = linkSearchData.autoUserData;
            autoUserLinks = linkSearchData.autoUserLinks;
            autoUserLinksIndex = linkSearchData.autoUserLinksIndex;
            canSkipAddress = linkSearchData.canSkipAddress;
            canSkipLink = linkSearchData.canSkipLink;
            autoSearchCriteria = linkSearchData.autoSearchCriteria;
        });
    }
});

// Continue to search for the task data through other user links if the
// user has any links left
skipLinkButton.addEventListener("click", skipLink);

/**
 * @typedef {Object} SearchCriteria Search data for getting users links and data
 * @property {Number} searchBlock Blockchain block index to search
 * @property {Number} eventIndex Event within block to search
 */

/**
 * Validates the zip input of the user matches the expected task hash, and
 * if so the specifications.json data tries to be extracted
 * @param {Event} event Zip input button click event
 */
async function zipInputClicked(event) {

    // Reset error text
    uploadErrorText.textContent = "";

    // Validate the input is a .zip
    const inputFile = event.target.files[0];
    if (inputFile.type !== 'application/zip') {
        uploadErrorText.textContent = "[X] ERROR: File uploaded is not a zip "
            + "file";
        return;
    }

    // Read the zip file data
    const reader = new FileReader();
    reader.readAsArrayBuffer(inputFile);

    // On loading the zip data
    reader.onload = async function (event) {
        const arrayBuffer = event.target.result;
        const fileBytes = new Uint8Array(arrayBuffer);

        // Validate task hash matches expected
        const fileHash = keccak256(fileBytes).toString('hex');
        if (fileHash != validatorTaskHashValue) {
            uploadErrorText.textContent = "[X] ERROR: Uploaded .zip file hash "
                + "does not match task hash";
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
 * Searches the user from the user address textbox for task data from
 * their links
 */
async function searchUser() {

    // Task can only be retrived if the task hash is known
    if (validatorTaskHashValue === undefined) {
        return;
    }

    // Formats the hex bytes
    const userSearchValue = prefixHexBytes(userSearch.value);

    // Validate user address
    if (userSearchValue === null || userSearchValue.length !== 42) {
        return;
    }

    // Get each link from the comma separated list of user
    const userLinks = await usersContract.links(userSearchValue);
    const userLinksArray = userLinks.split(",");

    // Search each link as URL to find data matching task hash
    for (let i = 0; i < userLinksArray.length; i++) {

        // Try to read the link as a URL and upon failure continue to next link
        let userUrl = null;
        try {
            userUrl = new URL(userLinksArray[i]);
        } catch (_) {
            continue;
        }

        // Retrieve data from link
        const response = await fetch(`${userUrl}/Tasks/ValidatorTasks/`
            + `${validatorTaskHashValue.substring(2)}/Task.zip`
        );
        if (!response.ok) {
            continue;
        }
        const arrayBuffer = await response.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        // Validate the data hash matches task hash
        const downloadHash = keccak256(uint8Array).toString('hex');
        if (downloadHash !== validatorTaskHashValue) {
            manualSearchError.textContent = `Incorrect data hash from,`
                + `\r\nUser: ${userSearchValue}`
                + `\r\nAt address: ${userUrl}/Tasks/ValidatorTasks/`
                + `${validatorTaskHashValue.substring(2)}/Task.zip`;
            continue;
        }

        // Data found so reset manual search error and parse file
        manualSearchError.textContent = "";
        dataHashMatchFound(arrayBuffer);
        return;
    }

    // Display error if data not found from user
    manualSearchError.textContent = `[X] ERROR: Task data not found from `
        + `user: ${userSearchValue}`;
}

/**
 * Tries to download task data from the current user link
 */
async function tryDownload() {

    // If the end of available users reached, no user can be searched
    if (!canSkipAddress && !canSkipLink) {
        return;
    }

    // Download data from current user link
    const userUrl = autoUserLinks[autoUserLinksIndex];
    const response = await fetch(
        `${userUrl}/Tasks/ValidatorTasks/${validatorTaskHashValue.substring(2)}`
        + `/Task.zip`
    );

    // Validate correct link response
    if (!response.ok) {
        autoDownloadError.textContent = `Download failed from ${userUrl}`
            + `/Tasks/ValidatorTasks/${validatorTaskHashValue.substring(2)}/`
            + `Task.zip`;
        return;
    }

    // Validate task data hash
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const downloadHash = keccak256(uint8Array).toString('hex');
    if (downloadHash === validatorTaskHashValue) {

        // Parse file
        dataHashMatchFound(arrayBuffer);
    } else {
        autoDownloadError.textContent = `Incorrect data hash from ${userUrl}`
            + `/Tasks/ValidatorTasks/${validatorTaskHashValue.substring(2)}/`
            + `Task.zip`;
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
        + `/Tasks/ValidatorTasks/${validatorTaskHashValue.substring(2)}`
        + `/Task.zip`;
}

/**
 * Visually updates the save task data button and creates download
 * functionality when save button is clicked
 */
function unlockSaveTaskLocally() {

    // If the save button is already unlocked, no need to unlock again
    if (saveLocallyButtonUnlocked) {
        return;
    }

    // Update the save button visual to interactable
    replaceClass(saveLocallyButton, "inactive-border-button", "border-button");

    // Downloads the task data on button click
    saveLocallyButton.addEventListener("click", () => {
        const blob = new Blob([localZipFile], { type: 'application/zip' });
        const url = URL.createObjectURL(blob);
        downloadTaskAnchor.href = url;
        downloadTaskAnchor.download
            = `Task-v-${validatorTaskIndex}.zip`;
        downloadTaskAnchor.click();
    });

    // Save button is now unlocked
    saveLocallyButtonUnlocked = true;
}

/**
 * Displays the zip file contents in the file tree
 * @param {File} zipFile Zip file with matching task hash
 */
async function dataHashMatchFound(zipFile) {

    // Update zip file variable
    localZipFile = zipFile;

    // Unlock the save file button and lock the upload file button
    unlockSaveTaskLocally();
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
        taskFileTreeArea.textContent = `Error parsing .zip file`;
        return;
    }

    // Set zip file tree structure
    taskFileTreeArea.textContent = formatFileStructure(zipFileContents);

    // Parse specifications json data for display
    const specificationsJson
        = zipContents.file(`${outerFolderName}/specifications.json`);
    if (!specificationsJson) {
        taskJsonArea.textContent
            = `[X] ERROR: specifications.json not found under directory path`;
        return;
    }
    let jsonObject;
    try {
        const content = await specificationsJson.async("string");
        jsonObject = JSON.parse(content);
    } catch (error) {
        taskJsonArea.textContent
            = `[X] ERROR: Problem parsing specifications.json`;
        return;
    }

    // Task content header
    taskJsonArea.textContent = "<h1>Task Requirements</h1>";

    // Iterate over each requirement listed in the specifications, and for each
    // one parse the corresponding requirement in the requirements folder to
    // display in the requirement fold using the specifications data
    for (let i = 0; i < jsonObject.length; i++) {

        // Displays the requirement with a warning if error parsing, otherwise
        // the requirement is displayed with the specifications inserted
        try {

            // Gets the contents of the corresponding requirement listed in the
            // specification
            const requirementIndex = jsonObject[i].requirementIndex;
            const requirementVersionIndex
                = jsonObject[i].requirementVersionIndex;
            const requirementZip = zipContents.file(
                `${outerFolderName}/Requirements/Requirement${requirementIndex}`
                + `-${requirementVersionIndex}.zip`
            );
            const requirementArrayBuffer
                = await requirementZip.async("arraybuffer");

            // Validate the requirement hash matches the expected in The List
            const requirementFileBytes = new Uint8Array(requirementArrayBuffer);
            const requirementData = await getRequirementVersionData(
                provider,
                theListContract,
                requirementIndex,
                requirementVersionIndex,
                THE_LIST_CONTRACT_MINIMUM_BLOCK
            );
            let requirementJson;
            const taskRequirementHash
                = keccak256(requirementFileBytes).toString("hex");
            const theListRequirementHash = requirementData.versionHash;

            // If the requirement hash is as expected, then integrate the task
            // specifications into the requirement content, otherwise display a
            // warning
            if (taskRequirementHash === theListRequirementHash) {
                const requirementContents
                    = await JSZip.loadAsync(requirementArrayBuffer);

                // Gets the requirement json object from the requirements.json
                // file
                let requirementOuterFolderName;
                requirementContents.forEach((relativePath, zipEntry) => {
                    if (zipEntry.dir) {
                        requirementOuterFolderName = relativePath.substring(
                            0,
                            relativePath.indexOf("/")
                        );
                    }
                });
                const requirementJsonFile = requirementContents.file(
                    `${requirementOuterFolderName}/requirement.json`
                );
                const requirementFile
                    = await requirementJsonFile.async("string");
                requirementJson = JSON.parse(requirementFile);
            } else {
                requirementJson = null;
            }

            // Formats the specification contents with the requirement
            formatTaskJson(
                jsonObject[i],
                requirementJson
            );
        } catch (error) {

            // If the parsing results in an error, then display a warning for
            // the requirement
            formatTaskJson(
                null,
                null
            );
        }
    }
}

/**
 * Get the hash task contract signer if not already cached, and output any error
 * to the given error element
 * @param {Element} errorElement Error element to output possible error
 */
async function getValidatorTaskSigner(errorElement) {

    // Get the signer if not already cached
    if (signer === undefined) {
        try {
            signer = await provider.getSigner();
        } catch (error) {
            errorElement.textContent = `[X] ERROR: Get signer failed - ${error}`;
            return;
        }
    }

    // Get the hash task contract signer if not already cached
    if (validatorTaskSigner === undefined) {
        validatorTaskSigner = new ethers.Contract(
            validatorTaskContractAddress,
            validatorTaskJson.abi,
            signer
        );
    }
}

/**
 * Validate task parameters have been retrieved, then allow the user to withdraw
 * funds if the deadline has passed and the task remains incomplete and upate
 * the display. But, in the case where the task is passed incomplete with key
 * reveal active and the current user the task manager, then display the key
 * reveal row to the task manager before they can withdraw their funds
 */
function updateWithdrawFundsSection() {
    if (isBeforeDeadline !== undefined
        && isKeyReveal !== undefined
        && isTaskComplete !== undefined
        && taskManagerAddress !== undefined
    ) {

        // If the user is a manager, validate they can withdraw first, otherwise
        // validate whether any funder can withdraw
        if (!isBeforeDeadline && isKeyReveal && !isTaskComplete) {
            provider.getSigner().then(s => {
                userAddress = s.address;
                if (userAddress === taskManagerAddress) {
                    removeClass(managerSection, "hide");
                    canWithdrawFunds = false;
                } else {
                    canWithdrawFunds = !isBeforeDeadline && !isTaskComplete;
                    if (canWithdrawFunds) {
                        replaceClass(
                            withdrawFundsButton,
                            "inactive-payable-button",
                            "payable-button"
                        );
                    }
                }
            });
        } else {
            canWithdrawFunds = !isBeforeDeadline && !isTaskComplete;
            if (canWithdrawFunds) {
                replaceClass(
                    withdrawFundsButton,
                    "inactive-payable-button",
                    "payable-button"
                );
            }
        }
    }
}
