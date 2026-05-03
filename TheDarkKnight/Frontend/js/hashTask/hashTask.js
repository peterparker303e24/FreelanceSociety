import { ethers, keccak256 } from "../libs/ethers.min.js";
import "../libs/jszip.min.js";
import {
    prefixHexBytes,
    removeClass,
    addClass,
    replaceClass,
    formatFileStructure,
    formatTaskJson,
    updateInputNumberToGroupedDigits,
    continueSearch,
    getRequirementVersionData,
    parseUserData,
    urlNoTrailingSlash,
    formatInConfiguredValue,
    getEthDisplayType,
    convertTab,
    downloadFile,
    debounce,
    formatTimeHoursMinutesSeconds,
    getExpectedDifficultyValueGenerationTime,
    getDifficultyValueFromDifficulty,
    getDifficultyValue,
    getLastInteractionBlockFromBlock
} from "../../utils/commonFunctions.js";
import {
    HASH_TASK_CONTRACT_ADDRESS,
    THE_LIST_CONTRACT_ADDRESS,
    USERS_CONTRACT_ADDRESS,
    THE_LIST_CONTRACT_MINIMUM_BLOCK,
    ETH_DISPLAY_TYPES_TEXT,
    HASH_TASK_CONTRACT_MINIMUM_BLOCK
} from "../../utils/constants.js";
import { DiscoverSection } from "../components/discoverSection.js";

// Page elements
const directDisplayTab = document.getElementById("direct-display-tab");
const basicDisplayTab = document.getElementById("basic-display-tab");
const basicDisplaySection = document.getElementById("basic-display-section");
const directDisplaySection = document.querySelector(".direct-display");
const taskId = document.getElementById("task-id");
const hash = document.getElementById("hash-value");
const taskHash = document.getElementById("task-hash");
const managerAddress = document.getElementById("manager-address");
const reward = document.getElementById("reward");
const deadline = document.getElementById("deadline");
const difficulty = document.getElementById("difficulty");
const completed = document.getElementById("completed");
const keyReveal = document.getElementById("key-reveal");
const fundInput = document.getElementById("fund-input");
const managerSection = document.getElementById("manager-key-reveal-section");
const managerKeyRevealInput = document.getElementById("key-reveal-input");
const fundButton = document.getElementById("fund-button");
const withdrawFundsButton = document.getElementById("withdraw-funds-button");
const fundError = document.getElementById("fund-error");
const discoverSection = document.querySelector(".discover-section");
const taskJsonArea = document.querySelector(".task-json");
const taskSpecificationsContainer = document.querySelector(
    ".task-specifications-container"
);
const taskCompletedSection = document.querySelector(
    ".direct-display__task-completed"
);
const taskCompletedText = document.querySelector(
    ".direct-display__task-completed-text"
);
const showSolutionButton = document.querySelector(
    ".direct-display__show-solution"
);
const trySolutionButton = document.querySelector(
    ".direct-display__try-solution"
);
const directDiscoverSection = document.querySelector(
    ".direct-display__discover-section"
);
const inputSolutionSection = document.querySelector(
    ".direct-display__input-solution"
);
const solutionReward = document.querySelector(
    ".direct-display__input-solution__reward"
);
const inputSolutionInstructions = document.querySelector(
    ".direct-display__input-solution__instructions"
);
const inputSolutionDownloadTask = document.querySelector(
    ".direct-display__input-solution__download-task-button"
);
const textKeySolutionInput = document.querySelector(
    ".direct-display__input-solution__input"
);
const isCorrectText = document.querySelector(
    ".direct-display__input-solution__is-correct"
);
const inputSolutionConnectWalletSection = document.querySelector(
    ".direct-display__input-solution__connect-wallet"
);
const inputSolutionConnectWalletButton = document.querySelector(
    ".direct-display__input-solution__connect-wallet-button"
);
const inputSolutionConnectWalletError = document.querySelector(
    ".direct-display__input-solution__connect-wallet-error"
);
const nonceGenerationSection = document.querySelector(
    ".direct-display__input-solution__nonce-generation"
);
const nonceGenerationTime = document.querySelector(
    ".direct-display__input-solution__nonce-generation-time"
);
const actualGenerationTime = document.querySelector(
    ".direct-display__input-solution__nonce-wait-time"
);
const inputSolutionSubmitTaskButton = document.querySelector(
    ".direct-display__input-solution__submit-button"
);
const inputSolutionSubmitError = document.querySelector(
    ".direct-display__input-solution__submit-error"
);
const solutionSection = document.querySelector(".direct-display__solution");
const solutionHashKey = document.querySelector(
    ".direct-display__solution__hash-key"
);
const solutionHashValue = document.querySelector(
    ".direct-display__solution__hash-value"
);
const solutionInstructions = document.querySelector(
    ".direct-display__solution__instructions"
);
const solutionDownloadTaskButton = document.querySelector(
    ".direct-display__solution__download-task-button"
);
const solutionTaskSolution = document.querySelector(
    ".direct-display__solution__solution-text"
);
const solutionDownloadSolutionButton = document.querySelector(
    ".direct-display__solution__download-solution-button"
);
const saveLocallyButton = document.getElementById("save-locally-button");
const uploadLocallyButton = document.getElementById("upload-locally-button");
const uploadErrorText = document.getElementById("upload-locally-error");
const zipInput = document.getElementById("file-input");
const submitTaskButton = document.getElementById("submit-task-button");
const viewHashTasksButton = document.getElementById("view-hash-tasks-button");
const addHashTaskButton = document.getElementById("add-hash-task-button");
const taskFileTreeArea = document.getElementById(
    "task-file-tree"
);

// Users, hash task, and The List contract addresses on the blockchain
const usersContractAddress = USERS_CONTRACT_ADDRESS;
const hashTaskContractAddress = HASH_TASK_CONTRACT_ADDRESS;
const theListContractAddress = THE_LIST_CONTRACT_ADDRESS;

// Gets provider's access to contracts
const usersAbi = await fetch('./data/abi/usersAbi.json');
const hashTaskAbi = await fetch('./data/abi/hashTaskAbi.json');
const theListAbi = await fetch('./data/abi/theListAbi.json');
const usersJson = await usersAbi.json();
const hashTaskJson = await hashTaskAbi.json();
const theListJson = await theListAbi.json();
const provider = new ethers.BrowserProvider(window.ethereum);
const usersContract = new ethers.Contract(
    usersContractAddress,
    usersJson.abi,
    provider
);
const hashTaskContract = new ethers.Contract(
    hashTaskContractAddress,
    hashTaskJson.abi,
    provider
);
const theListContract = new ethers.Contract(
    theListContractAddress,
    theListJson.abi,
    provider
);

// Gets the URL parameters and returns to task search page if invalid
const url = new URL(window.location.href);
const params = Object.fromEntries(url.searchParams.entries());

// Redirect to hash task search if url hash task id param invalid
let validHashTaskId = false;
let hashTaskIndex;
if (typeof (params.id) === "string") {
    const urlId = params.id;
    const taskIdSplit = urlId.indexOf("-");
    if (taskIdSplit > 0) {
        const taskType = urlId.substring(0, taskIdSplit);
        if (taskType === "h" && urlId.length > taskIdSplit + 1) {
            const taskIndex = Number(urlId.substring(taskIdSplit + 1));
            if (taskIndex >= 0) {
                hashTaskIndex = taskIndex;
                validHashTaskId = true;
            }
        }
    }
}
if (!validHashTaskId) {
    window.location.href = "./pages/viewTasks.html?search=h";
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
let signer;
let hashTaskSigner;
let taskManagerAddress;
let isKeyReveal;
let userAddress;
let taskHashValue;
let hashTaskHash;
let tabSection;
const emptyHash
    = "0x0000000000000000000000000000000000000000000000000000000000000000";
const hashTaskIndexValue = Number(hashTaskIndex);
let hashKey;
let difficultyValue;
let generatingNonce;
let generatedNonce;

// Configure the tab section
if (typeof (params.display) === "string") {
    const display = params.display;
    if (display === "basic") {
        tabSection === "basic";
    } else if (display === "direct") {
        tabSection = "direct";
    }
}
if (tabSection === "direct") {
    selectDirectDisplay();
} else {
    selectBasicDisplay();
}

// Switch tab section when tab clicked
basicDisplayTab.addEventListener("click", selectBasicDisplay);
directDisplayTab.addEventListener("click", selectDirectDisplay);

// Updates the text of the task ID
taskId.textContent = `Task ID: h-${hashTaskIndex}`;

// Update hash task variables with data retrieved from the blockchain
hashTaskContract.getHashTaskHash(hashTaskIndexValue).then(h => {
    taskHashValue = h;
    hash.textContent = `Hash Value:\n${taskHashValue}`;
    solutionHashValue.textContent = `Hash Value:\n${taskHashValue}`;;

    // Test solution correctness with existing user input
    evaluateSolutionCorrectness()

    // Allow the user to withdraw funds if available and diplay manager key
    // reveal section if necessary
    updateWithdrawFundsAndKeyRevealSection();
});
hashTaskContract.getHashTaskTaskHash(hashTaskIndexValue).then(h => {
    hashTaskHash = h;
    taskHash.textContent = `Task Hash:\n${hashTaskHash}`;

    // Discover task data if manual discover querystring provided
    manuallyDiscoverQueryString();
});
hashTaskContract.getHashTaskManagerAddress(hashTaskIndexValue).then(a => {
    taskManagerAddress = a;
    managerAddress.textContent = `Manager Address:\n${taskManagerAddress}`;

    // Allow the user to withdraw funds if available and diplay manager key
    // reveal section if necessary
    updateWithdrawFundsAndKeyRevealSection();
});
hashTaskContract.getHashTaskTotalWei(hashTaskIndexValue).then(w => {
    const ethDisplayType = getEthDisplayType();
    reward.textContent
        = `Reward:\n${formatInConfiguredValue(w, ethDisplayType)} `
            + `${ETH_DISPLAY_TYPES_TEXT[ethDisplayType]}`;
    solutionReward.textContent = `Task Reward:\n`
        + `${formatInConfiguredValue(w, ethDisplayType)} `
        + `${ETH_DISPLAY_TYPES_TEXT[ethDisplayType]}`;
    
});
hashTaskContract.getHashTaskDeadline(hashTaskIndexValue).then(d => {
    deadline.textContent
        = `Deadline (UTC): ${new Date(Number(d) * 1000).toUTCString()}`;

    // Allow the user to fund the task if the task deadline has not arrived
    isBeforeDeadline = Math.floor(Date.now() / 1000) <= Number(d);
    if (isBeforeDeadline) {
        canFundTask = true;
        replaceClass(fundButton, "inactive-payable-button", "payable-button");
    }

    // Update the direct task section with information
    updateDirectTaskSection();

    // Allow the user to withdraw funds if available and diplay manager key
    // reveal section if necessary
    updateWithdrawFundsAndKeyRevealSection();
});
hashTaskContract.getHashTaskDifficulty(hashTaskIndexValue).then(d => {
    difficultyValue = getDifficultyValueFromDifficulty(Number(d));
    difficulty.textContent = `Difficulty: ${Number(d)}`;
});
hashTaskContract.getHashTaskComplete(hashTaskIndexValue).then(c => {
    isTaskComplete = c;
    completed.textContent
        = `Task Completed: ${isTaskComplete ? "TRUE" : "FALSE"}`;
    if (isTaskComplete) {
        inputSolutionSubmitError.textContent = "(!) Task solution has already "
            + "been found, reward cannot be collected";
    }

    // Update the direct task section with information
    updateDirectTaskSection();

    // Allow the user to withdraw funds if available and diplay manager key
    // reveal section if necessary
    updateWithdrawFundsAndKeyRevealSection();
});
hashTaskContract.getHashTaskKeyReveal(hashTaskIndexValue).then(k => {
    isKeyReveal = k;
    keyReveal.textContent = `Key Reveal: ${isKeyReveal ? "TRUE" : "FALSE"}`;

    // Allow the user to withdraw funds if available and diplay manager key
    // reveal section if necessary
    updateWithdrawFundsAndKeyRevealSection();
});

// Validates reward numerical input
fundInput.addEventListener("input", () => {
    updateInputNumberToGroupedDigits(fundInput);
});

// Update the manager key reveal input and only allow the manager to withdraw
// funds if the key matches the expected hash value
managerKeyRevealInput.addEventListener("input", () => {

    // Retrieve and format the manager key reveal input
    const hexString = prefixHexBytes(managerKeyRevealInput.value);

    // Validate the user input hex string
    if (hexString === null || hexString.length !== 66) {
        canWithdrawFunds = false;
        replaceClass(
            withdrawFundsButton,
            "payable-button",
            "inactive-payable-button"
        );
        return;
    }

    // Validate the manager key reveal hash, and only allow the funds to be
    // withdrawn if the key matches the expected hash value
    const keyHash = keccak256(
        ethers.getBytes(hexString)
    );
    canWithdrawFunds = !isBeforeDeadline
        && isKeyReveal
        && !isTaskComplete
        && userAddress === taskManagerAddress
        && keyHash === taskHashValue;

    // Update the widthdraw funds availablility display
    if (canWithdrawFunds) {
        replaceClass(
            withdrawFundsButton,
            "inactive-payable-button",
            "payable-button"
        );
    } else {
        replaceClass(
            withdrawFundsButton,
            "payable-button",
            "inactive-payable-button"
        );
    }
});

// Create a transaction that funds the hash task if it is possible
fundButton.addEventListener("click", async () => {

    // Only allow the user to fund the task if it's available
    if (canFundTask) {

        // Try to get the user hash task contract signer, and upon any problem
        // display the error
        await getHashTaskSigner(fundError);
        if (hashTaskSigner !== undefined) {

            // Create the funding transaction
            let transactionResponse;
            try {
                transactionResponse = await hashTaskSigner.fundHashTask(
                    hashTaskIndex,
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
        await getHashTaskSigner(fundError);
        if (hashTaskSigner !== undefined) {

            // Create the funding transaction
            let transactionResponse;
            try {
                if (isKeyReveal && userAddress === taskManagerAddress) {
                    transactionResponse = await hashTaskSigner.withdrawHashTask(
                        hashTaskIndex,
                        prefixHexBytes(managerKeyRevealInput.value)
                    );
                } else {
                    transactionResponse = await hashTaskSigner.withdrawHashTask(
                        hashTaskIndex,
                        emptyHash
                    );
                }
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

// Initialize the discover section behavior
discoverSection
    .setAutoDiscoverOnClickAction(
        () => startAutoDiscoverAction(discoverSection)
    )
    .setTryDownloadButtonOnClickAction(() => tryDownloadAction(discoverSection))
    .setSkipAddressOnClickAction(() => skipAddressAction(discoverSection))
    .setSkipLinkOnClickAction(() => skipLinkAction(discoverSection))
    .setUserSearchOnChangeAction(() => searchUser(discoverSection))

// Initialize the direct discover section behavior
directDiscoverSection
    .setAutoDiscoverOnClickAction(
        () => startAutoDiscoverAction(directDiscoverSection)
    )
    .setTryDownloadButtonOnClickAction(
        () => tryDownloadAction(directDiscoverSection)
    )
    .setSkipAddressOnClickAction(() => skipAddressAction(directDiscoverSection))
    .setSkipLinkOnClickAction(() => skipLinkAction(directDiscoverSection))
    .setUserSearchOnChangeAction(() => searchUser(directDiscoverSection))

// Show the task solution section when button clicked
showSolutionButton.addEventListener("click", () => {
    removeClass(solutionSection, "hide");
    addClass(inputSolutionSection, "hide");
});

// Show the section to try to find the task solution
trySolutionButton.addEventListener("click", () => {
    removeClass(inputSolutionSection, "hide");
    addClass(solutionSection, "hide");
});

// Convert user input tab characters into the textbox character instead of
// tabbing out
textKeySolutionInput.addEventListener("keydown", (event) => {
    convertTab(textKeySolutionInput, event, false);
    isCorrectText.textContent = "Is Solution Correct: -";
});

// Check if the user solution is correct as they type
textKeySolutionInput.addEventListener("input", evaluateSolutionCorrectness);

// Query user to connect account with their wallet for contract interaction
inputSolutionConnectWalletButton.addEventListener(
    "click",
    () => {
        getHashTaskSigner(inputSolutionConnectWalletError)
            .then(checkAccountConnected);
    }
);

// Submit the task with the correct generated nonce and hash key if valid
inputSolutionSubmitTaskButton.addEventListener("click", async () => {
    if (hashTaskSigner === undefined
        || hashKey === undefined
        || generatingNonce !== false
        || isTaskComplete
        || !isBeforeDeadline
    ) {
        return;
    }

    // Submit the transaction and display message on error
    let transactionResponse;
    try {
        inputSolutionSubmitError.textContent = "Pending transaction...";
        transactionResponse = await hashTaskSigner.submitHashTask(
            hashTaskIndex,
            hashKey,
            BigInt(generatedNonce)
        );
    } catch (error) {
        inputSolutionSubmitError.textContent
            = `[X] ERROR: Transaction failed - ${error}`;
        return;
    }

    // Refresh the page when the transaction goes through
    transactionResponse.wait().then(async () => {
        inputSolutionSubmitError.textContent
            = "Task Complete!\nReward has transferred to your account address";
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
    window.location.href
        = `./pages/hashTask/submitHashTask.html?index=${hashTaskIndex}`;
});

// Redirects to view tasks page using the task index of this page
viewHashTasksButton.addEventListener("click", () => {
    window.location.href = `./pages/viewTasks.html?search=h`;
});

// Redirects to the add task proposal page using the task index of
// this page
addHashTaskButton.addEventListener("click", () => {
    window.location.href
        = `./pages/hashTask/addHashTask.html?index=${hashTaskIndex}`;
});

// Prompts user for upload of task zip, and displays task if valid
zipInput.addEventListener("change", zipInputClicked);

/**
 * Continue to search for data through other users if any users are left
 * @param {DiscoverSection} discoverSection Discover section element
 */
function skipAddressAction(discoverSection) {
    if (!canSkipAddress) {
        return;
    }
    continueSearch(
        autoSearchCriteria,
        usersContract,
        discoverSection,
        (userLinks) => `${userLinks[0]}/Tasks/HashTasks/`
            + `${hashTaskHash.substring(2)}/Task.zip`
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

        // Validate task hash matches expected
        const fileHash = keccak256(fileBytes).toString('hex');
        if (fileHash != hashTaskHash) {
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
 * @param {DiscoverSection} discoverSection Discover section element
 */
async function searchUser(discoverSection) {

    // Task can only be discovered if the task hash is known
    if (hashTaskHash === undefined) {
        return;
    }

    // Reset manual search error text
    discoverSection.setManualDiscoverError("");

    // Formats the hex bytes
    const userSearchValue = prefixHexBytes(discoverSection.getManualInput());

    // Validate user address
    if (userSearchValue === null || userSearchValue.length !== 42) {
        return;
    }

    // Get each valid URL link from the comma separated list of user links
    const userLinks = await usersContract.links(userSearchValue);
    const userLinksArray = userLinks.split(",");
    let userUrls = userLinksArray
        .map(urlString => {
            try {
                return urlNoTrailingSlash(new URL(urlString));
            } catch { return null; }
        })
        .filter(urlObj => urlObj !== null);

    // Try to download data from all user endpoints, and if any succeed with the
    // matching data hash, then display the data
    try {
        const arrayBuffer = await tryDownloadDataFromUrlsParallel(
            userUrls,
            discoverSection
        );
        
        // Data found so reset manual search error and parse file
        discoverSection.setManualDiscoverError("");
        dataHashMatchFound(arrayBuffer);
    } catch { }
}

/**
 * Try to download the data from each given base URL. If an endpoint response
 * fails or does not have the correct data hash, then display a warning for that
 * endpoint. If all endpoints fail, then display an error. If any one endpoints
 * succeed with the correct data hash, then stop all other featches and return
 * the data.
 * @param {Array<String>} userUrls Array of valid base URLs of the user
 * @param {DiscoverSection} discoverSection Discover section element
 * @returns {Promise<ArrayBuffer>} The data buffer of the data that has been
 * validated with the hash
 */
async function tryDownloadDataFromUrlsParallel(userUrls, discoverSection) {

    // Initialize controllers and signals for parallel fetches, whether any hash
    // validated data fetch succeeded, the cumulative fetch errors, and the
    // number of fetch failures
    const controllers = userUrls.map(() => new AbortController());
    const signals = controllers.map(controller => controller.signal);
    let settled = false;
    let cumulativeError = "";
    let failures = 0;

    // Return the promise to return the hash validated data or reject
    return new Promise((resolve, reject) => {
        userUrls.forEach((url, i) => {

            // Initialize fetch data and endpoint URL
            const opt = { signal: signals[i] };
            const endpoint = `${url}/Tasks/HashTasks/`
                + `${hashTaskHash.substring(2)}/Task.zip`;

            /**
             * Mark the endpoint as a failure, add an error message, and reject
             * the promise if all endpoints have failed
             * @param {String} message Message to add to manual discover error
             */
            const endpointFailed = (message) => {
                failures++;
                cumulativeError += message;
                discoverSection.setManualDiscoverError(cumulativeError);
                if (failures === userUrls.length && !settled) {
                    cumulativeError
                        += `[X] ERROR: All endpoints failed for user`;
                    discoverSection.setManualDiscoverError(cumulativeError);
                    reject(new Error('All endpoints failed'));
                }
            };

            // Make the actual fetch request
            fetch(
                endpoint,
                opt
            )
                .then(async response => {

                    // If the fetch gets a response back, then get the response
                    // data
                    if (settled) return;
                    if (response === undefined || !response.ok) {
                        endpointFailed(
                            `(!) Failed download from endpoint ${endpoint}\n`
                        );
                        return;
                    }
                    const arrayBuffer = await response.arrayBuffer();
                    const uint8Array = new Uint8Array(arrayBuffer);

                    // Validate the data hash matches task hash
                    const downloadHash = keccak256(uint8Array).toString('hex');
                    if (downloadHash !== hashTaskHash) {
                        endpointFailed(
                            `(!) Incorrect data hash at endpoint ${endpoint}\n`
                        );
                        return;
                    }
                    if (settled) return;

                    // If the endpoint finds the hash validated data first, then
                    // cancel other fetch requests and return the data
                    settled = true;
                    controllers.forEach((c, idx) => {
                        if (idx !== i) c.abort();
                    });
                    resolve(arrayBuffer);
                })
                .catch(err => {

                    // Mark the error if the fetch request fails
                    if (settled && err && err.name === 'AbortError') return;
                    endpointFailed(
                        `(!) Failure reaching endpoint ${endpoint}\n`
                    );
                });
        });
    });
}

/**
 * Tries to download task data from the current user link
 * @param {DiscoverSection} discoverSection Discover section element
 */
async function tryDownloadAction(discoverSection) {

    // Download data from current user link
    const userUrl = autoUserLinks[autoUserLinksIndex];
    let response;
    try {
        response = await fetch(
            `${userUrl}/Tasks/HashTasks/${hashTaskHash.substring(2)}/Task.zip`
        );
    } catch {}

    // Validate correct link response
    if (response === undefined || !response.ok) {
        discoverSection.setAutoDiscoverError(
            `[X] ERROR: Download failed from ${userUrl}/Tasks/HashTasks/`
            + `${hashTaskHash.substring(2)}/Task.zip`
        );
        return;
    }

    // Validate task data hash
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const downloadHash = keccak256(uint8Array).toString('hex');
    if (downloadHash === hashTaskHash) {

        // Parse file
        dataHashMatchFound(arrayBuffer);
    } else {
        discoverSection.setAutoDiscoverError(
            `[X] ERROR: Incorrect data hash from ${userUrl}/Tasks/HashTasks/`
            + `${hashTaskHash.substring(2)}/Task.zip`
        );
    }
}

/**
 * Updates download from link button with next user link and inactivates next
 * link button if user has no more links
 * @param {DiscoverSection} discoverSection Discover section element
 */
function skipLinkAction(discoverSection) {

    // Validate user has another link
    if (!canSkipLink) {
        return;
    }

    // Increment link index and reset link skip variable
    autoUserLinksIndex++;
    canSkipLink = false;

    // If at final link, update visuals and link skip variable
    if (autoUserLinks.length === autoUserLinksIndex + 1) {
        discoverSection.setIsSkipLinkButtonEnabled(false);
        canSkipLink = false;
    }

    // Update download from link button
    discoverSection.setIsTryDownloadButtonEnabled(true);
    discoverSection.setTryDownloadText(
        `Try download from: `
        + `${parseUserData(autoUserData).data}\nAddress: `
        + `${autoUserAddress}\nLink: ${autoUserLinks[autoUserLinksIndex]}`
        + `/Tasks/HashTasks/${hashTaskHash.substring(2)}/Task.zip`
    );
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

    // Update the save/downlaod task button visual to interactable
    replaceClass(saveLocallyButton, "inactive-border-button", "border-button");
    replaceClass(
        solutionDownloadTaskButton,
        "inactive-border-button",
        "border-button"
    );
    replaceClass(
        inputSolutionDownloadTask,
        "inactive-border-button",
        "border-button"
    );

    // Downloads the task data on button click
    const downloadTask = () => downloadFile(
        localZipFile,
        `Task-h-${hashTaskIndex}.zip`,
        "application/zip",
    );
    saveLocallyButton.addEventListener("click", downloadTask);
    solutionDownloadTaskButton.addEventListener("click", downloadTask);
    inputSolutionDownloadTask.addEventListener("click", downloadTask);

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
    addClass(directDiscoverSection, "hide");

    // Show the input solution section if the deadline has not passed and the
    // task has not yet been completed
    if (isBeforeDeadline !== undefined && isBeforeDeadline
        && isTaskComplete !== undefined && !isTaskComplete
    ) {
        removeClass(inputSolutionSection, "hide");
    }
    tryGetSolution(localZipFile, hashKey);

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
        taskFileTreeArea.textContent = `Error parsing .zip file - ${error}`;
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
            = `[X] ERROR: Problem parsing specifications.json - ${error}`;
        return;
    }

    // Task content header
    taskJsonArea.textContent = "";
    const taskRequirementsHeader = document.createElement("h1");
    taskRequirementsHeader.textContent = "Task Specifications";
    taskJsonArea.appendChild(taskRequirementsHeader);

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
                taskSpecificationsContainer,
                jsonObject[i],
                requirementJson
            );
        } catch (error) {

            // If the parsing results in an error, then display a warning for
            // the requirement
            formatTaskJson(
                taskSpecificationsContainer,
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
async function getHashTaskSigner(errorElement) {

    // Get the signer if not already cached
    if (signer === undefined) {
        try {
            signer = await provider.getSigner();
        } catch (error) {
            errorElement.textContent
                = `[X] ERROR: Get signer failed - ${error}`;
            return;
        }
    }

    // Get the hash task contract signer if not already cached
    if (hashTaskSigner === undefined) {
        hashTaskSigner = new ethers.Contract(
            hashTaskContractAddress,
            hashTaskJson.abi,
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
function updateWithdrawFundsAndKeyRevealSection() {
    if (isBeforeDeadline === undefined
        || isKeyReveal === undefined
        || isTaskComplete === undefined
        || taskManagerAddress === undefined) {
            return;
    }

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

/**
 * If a valid Ethereum address is provided in the manuallyDiscover querystring
 * parameter, then the manually discover data section shows, that user's data is
 * set in the input, and the endpoints for that user are searched.
 */
function manuallyDiscoverQueryString() {
    if (params.manuallyDiscover === undefined) {
        return;
    }
    const valueHex = prefixHexBytes(params.manuallyDiscover);
    if (valueHex === null || valueHex.length !== 42) {
        return;
    }
    if (tabSection === "basic") {
        discoverSection.setManualDiscoverInput(valueHex);
        searchUser(discoverSection);
    } else {
        directDiscoverSection.selectManuallyDiscoverSection();
        directDiscoverSection.setManualDiscoverInput(valueHex);
        searchUser(directDiscoverSection);
    }
}

/**
 * Select the basic display tab and hide the direct display section
 */
function selectBasicDisplay() {
    addClass(basicDisplayTab, "tab-selected");
    removeClass(basicDisplaySection, "hide");
    removeClass(directDisplayTab, "tab-selected");
    addClass(directDisplaySection, "hide");
}
/**
 * Select the direct display tab and hide the basic display section
 */
function selectDirectDisplay() {
    addClass(directDisplayTab, "tab-selected");
    removeClass(directDisplaySection, "hide");
    removeClass(basicDisplayTab, "tab-selected");
    addClass(basicDisplaySection, "hide");
}

/**
 * Begin search for data through users if any users are found
 * @param {DiscoverSection} discoverSection Discover section element
 */
function startAutoDiscoverAction(discoverSection) {
    if (hashTaskHash === undefined) {
        return;
    }

    // Automatically search for data
    continueSearch(
        {},
        usersContract,
        discoverSection,
        (userLinks) => `${userLinks[0]}/Tasks/HashTasks/`
            + `${hashTaskHash.substring(2)}/Task.zip`

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

/**
 * If the task completion and task deadline information has been retrieved, then
 * the task input solution section, task completed section, or task deadline
 * passed sections will show
 */
function updateDirectTaskSection() {

    // Validate dependent blockchain data has already been retrieved
    if (isTaskComplete === undefined || isBeforeDeadline === undefined) {
        return;
    }

    // If the task can no longer be completed for the reward then display that
    // information to the user and try to find the hash key for the solution
    if (isTaskComplete || !isBeforeDeadline) {
        if (isTaskComplete) {
            taskCompletedText.textContent = "(!) Hash Task Already Completed";
        } else if (!isBeforeDeadline) {
            taskCompletedText.textContent
                = "(!) Hash Task Deadline Already Passed";
        }
        removeClass(taskCompletedSection, "hide");

        // Try to find the hash key from the blockchain event data
        tryGetHashKey().then((k) => {
            if (k === null) {
                return;
            }
            hashKey = k;
            solutionHashKey.textContent = `Hash Key:\n${hashKey}`;

            // Try to parse the encrypted task solution using the hash key
            tryGetSolution(localZipFile, hashKey);
        });
    
    // Hide the discover task section if it has already been discovered
    } else if (localZipFile !== undefined) {
        removeClass(inputSolutionSection, "hide");
    }
}

/**
 * Binary searches through the blockchain for the block where the hash task is
 * completed and gets the hash key from the emitted event argument values, and
 * if instead the task deadline has passed search through all task funds
 * withdrawn events to search for key reveal
 * @returns {String | null} Hash key string or null if not found
 */
async function tryGetHashKey() {

    // If the task is incomplete, key reveal is false, or manager has not yet
    // revealed the key, then return null for no hash key found
    if (!isTaskComplete) {

        // Task funds withdrawn events can only happen after the deadline
        const taskDeadlineTimestamp
            = await hashTaskContract.getHashTaskDeadline(hashTaskIndex);
            
        // Only stop the search after backtracking to before the task deadline
        let searchBlock = await provider.getBlockNumber();
        let blockTimestamp;
        do {

            // Filter for task funds withdrawn events
            const taskWithdrawnFilter = await hashTaskContract.filters
                .TaskWithdrawn()
                .getTopicFilter();
            let events = await hashTaskContract.queryFilter(
                taskWithdrawnFilter,
                searchBlock,
                searchBlock
            );

            // Search for the hash key in possibly multiple events
            for (const event of events) {
                if (keccak256(event.args[1]) === taskHashValue) {
                    return event.args[1];
                }
            }

            // Use the lastInteractionBlock blockchain variable to search next
            // at that previous block index
            blockTimestamp = BigInt(
                (await provider.getBlock(searchBlock)).timestamp
            );
            searchBlock = await getLastInteractionBlockFromBlock(
                hashTaskContract,
                searchBlock
            );
        } while (blockTimestamp > taskDeadlineTimestamp);

        // If no hash key has been found, finish search and return null
        return null;
    }

    // Return null for hash key not found for unexpected error
    try {

        // Binary search start and end blocks
        let startBlock = HASH_TASK_CONTRACT_MINIMUM_BLOCK;
        let endBlock = await provider.getBlockNumber();

        // Binary search process
        while (startBlock <= endBlock) {

            // Binary split block
            let middleBlock = Math.floor((startBlock + endBlock) / 2);

            // Filter for task submission blocks
            const taskCompleteFilter = await hashTaskContract.filters
                .TaskComplete()
                .getTopicFilter();
            let events = await hashTaskContract.queryFilter(
                taskCompleteFilter,
                middleBlock,
                middleBlock
            );

            // Search through possibly multiple events in a block
            for (const event of events) {
                if (hashTaskIndex === Number(event.args[0])) {
                    return event.args[1];
                }
            }

            // Get whether the task has been completed yet at this split block
            const isTaskCompletedAtMiddleBlock
                = await hashTaskContract.getHashTaskComplete(
                    hashTaskIndex,
                    { blockTag: middleBlock }
                );

            // Split binary search to earlier if the task was completed before
            // or after if the task has not yet been completed at the middle
            // block
            if (isTaskCompletedAtMiddleBlock) {
                endBlock = middleBlock - 1;

            } else {
                startBlock = middleBlock + 1;
            }
        }
    } catch {

        // If an unexpected error is encountered, return null
        return null;
    }

    // If no hash key has been found through the binary search, return null
    return null;
}

/**
 * Try to parse, decryt, decode, and display the task solution to the user with
 * the hash key and setup the solution file download
 * @param {ArrayBuffer} fileBytes Hash task Task.zip data bytes
 * @param {String} hashKey Hash key hex data with "0x" prefix
 */
async function tryGetSolution(fileBytes, hashKey) {

    // Validate task data has been retrieved
    if (fileBytes === undefined) {
        return;
    }

    // Initialize the task text displays with loading text
    const loadingMessage = "Loading...";
    solutionInstructions.textContent = loadingMessage;
    inputSolutionInstructions.textContent = loadingMessage;
    solutionTaskSolution.textContent = loadingMessage;

    // Try to parse the task instructions from the Task.zip file specifications
    let zipFile;
    let firstSpecification;
    let encryptedSolutionFile;
    let decryptedSolutionFile;
    let encryptedData;
    let decryptedData;
    try {

        // Get the specifications JSON from the Task.zip
        zipFile = await JSZip.loadAsync(fileBytes);
        const file = zipFile.file(`Task/specifications.json`);
        const content = await file.async('string');
        const specificationsJson = JSON.parse(content);

        // Assume the first and only task specification is the task instructions
        // and parse the instructions for the displays
        firstSpecification = specificationsJson[0]["specifications"];
        const instructions = firstSpecification["instructions"];
        solutionInstructions.textContent = instructions;
        inputSolutionInstructions.textContent = instructions;
    } catch {

        // If task instructions could not be parsed from Task.zip, display a
        // message to the user for instructions sections
        const failureMessage = "(!) Failed to parse task instructions";
        solutionInstructions.textContent = failureMessage;
        inputSolutionInstructions.textContent = failureMessage;
    }

    // Try to get the encrypted solution file from the Task.zip
    try {
        encryptedSolutionFile = firstSpecification["encryptedSolution"];
        decryptedSolutionFile = firstSpecification["decryptedSolution"];
        const encryptedFile = zipFile.file(`Task/${encryptedSolutionFile}`);
        encryptedData = await encryptedFile.async('arraybuffer')
    } catch {
        solutionTaskSolution.textContent = "(!) Failed to parse task solution";
        return;
    }

    // Try to use the task hash key to decrypt the encrypted solution file
    try {
        decryptedData = await decryptData(encryptedData, hashKey.substring(2));
    } catch {
        solutionTaskSolution.textContent
            = "(!) Failed to decrypt task with hash key";
        return;
    }

    // Try to decode the decrypted task solution for the solution display
    try {

        // If the solution is a text file, then display the solution text to the
        // page and setup the file download
        if (decryptedSolutionFile.endsWith('.txt')) {
            const textContent = new TextDecoder().decode(decryptedData);
            solutionTaskSolution.textContent = textContent;
            solutionDownloadSolutionButton.addEventListener(
                "click",
                () => downloadFile(
                    decryptedData,
                    decryptedSolutionFile,
                    "application/txt"
                )
            );

        // If the solution is a ZIP file, then display a message for the user to
        // download the solution ZIP and setup the file download
        } else if (decryptedSolutionFile.endsWith('.zip')) {
            solutionTaskSolution.textContent
                = `Download ${decryptedSolutionFile} to view solution`;
            solutionDownloadSolutionButton.addEventListener(
                "click",
                () => downloadFile(
                    decryptedData,
                    decryptedSolutionFile,
                    "application/zip",
                )
            );
        
        // If the solution file type is unknown, then display that file and
        // setup the file download
        } else {
            solutionTaskSolution.textContent = `(!) Solution file not in known `
                + `format: ${decryptedSolutionFile}`;
            solutionDownloadSolutionButton.addEventListener(
                "click",
                () => downloadFile(
                    decryptedData,
                    decryptedSolutionFile,
                    null
                )
            );
        }

        // Enable the decrypted solution file to be downloaded
        replaceClass(
            solutionDownloadSolutionButton,
            "inactive-border-button",
            "border-button"
        )

    // Display an error message to the user if parsing the solution resulted in
    // an error
    } catch {
        solutionTaskSolution.textContent = "(!) Failed to decode task solution";
    }
}

/**
 * Tries to decrypt the given data with the given password using OpenSSL
 * AES-256-cbc decryption
 * @param {ArrayBuffer} data Data to try to decrypt
 * @param {String} password Password string to try to decrypt the encryption
 * @returns {ArrayBuffer} Decrypted data
 */
async function decryptData(data, password) {

    // Configure the crypto decryption data
    const view = new Uint8Array(data);    
    const ciphertext = view.slice(16);
    const salt = view.slice(8, 16);
    const encoder = new TextEncoder();
    const passwordBytes = encoder.encode(password);
    const hash1Data = new Uint8Array(passwordBytes.length + salt.length);
    hash1Data.set(passwordBytes);
    hash1Data.set(salt, passwordBytes.length);
    const hash1 = await crypto.subtle.digest('SHA-256', hash1Data);
    const key = new Uint8Array(hash1).slice(0, 32);
    const hash2Data = new Uint8Array(32 + passwordBytes.length + salt.length);
    hash2Data.set(new Uint8Array(hash1));
    hash2Data.set(passwordBytes, 32);
    hash2Data.set(salt, 32 + passwordBytes.length);
    const hash2 = await crypto.subtle.digest('SHA-256', hash2Data);
    const iv = new Uint8Array(hash2).slice(0, 16);

    // Set the decryption key
    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        key,
        { name: 'AES-CBC' },
        false,
        ['decrypt']
    );
    
    // Try the decryption process
    const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-CBC', iv },
        cryptoKey,
        ciphertext
    );

    // Return the decrypted data
    return decrypted;
}

/**
 * Evaluate the text key input, test its correctness, display the result to the
 * user, and possibly start the next step if correct
 */
function evaluateSolutionCorrectness() {

    // Only test the correctness once the user has stopped typing
    const debouncedFunction = debounce(async () => {

        // Encode the text key into bytes
        const utf8Bytes = new TextEncoder().encode(textKeySolutionInput.value);

        // Test the text key correctness
        if (keccak256(keccak256(utf8Bytes)) === taskHashValue) {

            // Save the hash key solution and display the result to the user
            hashKey = keccak256(utf8Bytes);
            solutionHashKey.textContent = `Hash Key:\n${hashKey}`;
            isCorrectText.textContent = "Is Solution Correct: TRUE";

            // Start the next step to check the account connected
            checkAccountConnected();

        // If the text key is incorrect, display the result to the user
        } else {
            isCorrectText.textContent = "Is Solution Correct: FALSE";
        }
    }, 300);
    debouncedFunction();
}

/**
 * Check if the account is connected and prompt the user if not yet connected
 */
async function checkAccountConnected() {

    // If the account is not connected at all, then display the message to
    // connect the user
    if (window.ethereum === undefined
        || window.ethereum.selectedAddress === null
    ) {
        removeClass(inputSolutionConnectWalletSection, "hide");
        return;
    } 

    // If the signer, used to make contract transactions, is not set then get it
    // from the wallet
    if (hashTaskSigner === undefined) {
        removeClass(inputSolutionConnectWalletSection, "hide");
        await getHashTaskSigner(inputSolutionConnectWalletError);
    }

    // Set the user address and hide the connect wallet display
    userAddress = window.ethereum.selectedAddress;
    addClass(inputSolutionConnectWalletSection, "hide");

    // Start the next step to generate the nonce for the hash task difficulty,
    // and if the nonce has already been found then skip regenerating the nonce
    if (generatingNonce === false) {
        return;
    }
    removeClass(nonceGenerationSection, "hide");
    generateNonce();
}

/**
 * Start the nonce generation process, continuously update the display for the
 * actual and estimated wait time, and enable the submit task button once a
 * nonce is found that satisfies the hash task difficulty value
 */
function generateNonce() {

    // Validate the nonce is not already being generated
    if (generatingNonce !== undefined) {
        return;
    }
    generatingNonce = true;

    // Update the nonce generation message
    inputSolutionSubmitError.textContent = "(!) Must wait for nonce generation "
        + "before submission";

    /**
     * Enable the task submission button
     */
    const enableSubmission = () => {

        // Hide the nonce generation section now that it is complete
        addClass(nonceGenerationSection, "hide");

        // Set the error message text if the user cannot submit the task due to
        // the task being complete or past the deadline
        if (isTaskComplete) {
            inputSolutionSubmitError.textContent = "(!) Task solution has "
                + "already been found, reward cannot be collected";
            return;
        } else if (!isBeforeDeadline) {
            inputSolutionSubmitError.textContent = "(!) Task deadline has "
                + "already passed, reward cannot be collected";
            return;
        }

        // Enable the button display and reset the error message text
        replaceClass(
            inputSolutionSubmitTaskButton,
            "inactive-payable-button",
            "payable-button"
        );
        inputSolutionSubmitError.textContent = "";
    };

    // If the difficulty value is set to default, then the nonce does not need
    // to be generated
    if (difficultyValue === "0x" + "f".repeat(64)) {
        generatedNonce = 0;
        enableSubmission();
        return;
    }
    
    // Initialize generation values and begin search generation
    let generationIntervalId;
    let generatedNoncesCount = 0;
    let generationStartTime = Date.now();
    generatedNonce = Math.floor(9000000000 * Math.random()) + 1000000000;

    // Update the Estimated wait time and actual wait time every half second
    generationIntervalId = setInterval(() => {

        // Calculate the expected wait time using the hash task difficulty
        // value, generation start time, and number of nonce generations so far
        const expectedGenerationSeconds
            = getExpectedDifficultyValueGenerationTime(
                difficultyValue,
                generationStartTime,
                generatedNoncesCount
            );

        // Update the wait time displays in hour minute second format
        nonceGenerationTime.textContent = `Estimated Wait Time: `
        + `${formatTimeHoursMinutesSeconds(expectedGenerationSeconds)}`;
        actualGenerationTime.textContent = `Actual Wait Time:    `
            + `${formatTimeHoursMinutesSeconds(
                Math.floor((Date.now() - generationStartTime) / 1000)
            )}`;
    }, 500);

    // Continuously test nonce values until one is found that satisfies the hash
    // task difficulty value
    while (generatingNonce) {

        // Get the expected difficulty value and current difficulty value based
        // on the dependent data and nonce
        const generatedDifficultyNumber = BigInt(getDifficultyValue(
            hashKey,
            userAddress,
            generatedNonce
        ));
        const expectedDifficultyNumber = BigInt(difficultyValue);

        // If the generated difficulty value meets the difficulty requirement,
        // then stop the generation process and update the display
        if (generatedDifficultyNumber < expectedDifficultyNumber) {
            generatingNonce = false;
            clearInterval(generationIntervalId);

            // Enable the submit task button
            enableSubmission();
            return;
        }

        // Increment the nonce generation
        generatedNoncesCount++;
        generatedNonce++;
    }
}