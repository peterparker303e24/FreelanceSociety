import { ethers, getBytes } from "../js/libs/ethers.min.js";
import { TASK_SHORT_NAMES } from "./constants.js";

/**
 * Standardizes given hex bytes data in string form, and returns null if given
 * invalid hex string
 * @param {String} bytes String of characters
 * @returns {String | null} Hex string of characters with preceding "0x"
 */
export function prefixHexBytes(bytes) {

    // Validate bytes variable
    if (bytes === undefined) {
        return null;
    }

    // Test if string matches plain hex characters pattern, and returns it with
    // "0x" prepend
    if (/^[a-fA-F0-9]+$/.test(bytes)) {
        return "0x" + bytes;
    }

    // Test if string matches plain hex characters pattern with "0x" already
    // prepended, and returns it
    if (
        bytes.length > 2
        && bytes.slice(0, 2) === "0x"
        && /^[a-fA-F0-9]+$/.test(bytes.slice(2))
    ) {
        return bytes;
    }

    // If input does not match parsed hex, null is returned
    return null;
}

/**
 * Waits delay before re-executing a function to prevent excessive repetition of
 * given function
 * @param {Function} func Function to execute
 * @param {Number} msDelay Delay before re-executing the function
 * @returns Given function with debouce property
 */
export function debounce(func, msDelay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), msDelay);
    };
}

/**
 * Adds a given element class if not already there
 * @param {Element} element Element to apply class addition
 * @param {String} className Class name to add
 */
export function addClass(element, className) {
    if (!element.classList.contains(className)) {
        element.classList.add(className);
    }
}

/**
 * Removes a given element class if not already gone
 * @param {Element} element Element to apply class removal
 * @param {String} className Class name to remove
 */
export function removeClass(element, className) {
    if (element.classList.contains(className)) {
        element.classList.remove(className);
    }
}

/**
 * Replaces a given element class from one to another
 * @param {Element} element Element to apply class change
 * @param {String} classNameRemove Class name to remove
 * @param {String} classNameAdd Class name to add
 */
export function replaceClass(element, classNameRemove, classNameAdd) {

    // Deletes class if not already gone and adds class if not already there
    if (element.classList.contains(classNameRemove)) {
        element.classList.remove(classNameRemove);
    }
    if (!element.classList.contains(classNameAdd)) {
        element.classList.add(classNameAdd);
    }
}

/**
 * Use the ordering of the requirement versions to binary search for a given
 * requirement version
 * @param {Contract} theListContract Contract of The List
 * @param {Number} startBlock Minimum inclusuve block index in the blockchain
 * @param {Number} endBlock Maximum inclusive block index in the blockchain
 * @param {Number} index Requirement index
 * @param {Number} version Version index to search for
 * @returns {Requirement} Requirement version information
 */
export async function binarySearchBlockchainVersions(
    theListContract,
    startBlock,
    endBlock,
    index,
    version
) {

    // Binary search process
    while (startBlock <= endBlock) {

        // Binary split block
        let middleBlock = Math.floor((startBlock + endBlock) / 2);

        // Filter new requirement and update requirement events in the search
        // block
        const updateRequirementEventFilter = await theListContract.filters
            .NewRequirementUpdate()
            .getTopicFilter();
        const newRequirementEventFilter = await theListContract.filters
            .NewRequirement()
            .getTopicFilter();
        const eventsFilter = [
            updateRequirementEventFilter.concat(newRequirementEventFilter)
        ];
        let events = await theListContract.queryFilter(
            eventsFilter,
            middleBlock,
            middleBlock
        );

        // Search through possibly multiple version updates in a block
        events.forEach((event, _) => {

            // Get the requirement information from the corresponding emitted
            // fields depending on the type of event
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
                eventArgVersion = 0;
            } else {
                return null;
            }

            // If the requirement version is found in the events, return its
            // information
            if (Number(eventArgIndex) === index
                && Number(eventArgVersion) === version
            ) {
                return {
                    index: Number(eventArgIndex),
                    hash: eventArgHash,
                    version: Number(eventArgVersion),
                    validator: eventArgValidator
                };

            }
        });

        // Get the requirement version at a specific block,
        const blockIndexVersion = Number(
            await theListContract.getRequirementVersion(
                index,
                { blockTag: middleBlock }
            )
        );

        // Binary search splitting
        if (blockIndexVersion === version) {

            // If the requirement version is found, return its information
            const requirementVersionValidator
                = await theListContract.getRequirementValidatorAddress(
                    index,
                    { blockTag: middleBlock }
                );
            const requirementVersionHash
                = await theListContract.getRequirementHash(
                    index,
                    { blockTag: middleBlock }
                );
            return {
                index: index,
                hash: requirementVersionHash,
                version: version,
                validator: requirementVersionValidator
            };
        } else if (blockIndexVersion < version) {
            startBlock = middleBlock + 1;
        } else {
            endBlock = middleBlock - 1;
        }
    }

    // If problem encountered return null
    return null;
}

// Example requirement json placeholder text
export const requirementPlaceholder = ""
    + `{\n`
    + `    "condition": [\n`
    + `        "Write your condition with the labeled variables ",\n`
    + `        "labeledVariable",\n`
    + `        " and with intermediate variables ",\n`
    + `        "_intermediateVariable",\n`
    + `        " alternating with text description here."\n`
    + `    ],\n`
    + `    "labeledVariables": [\n`
    + `        "labeledVariable"\n`
    + `    ],\n`
    + `    "intermediateVariables": [\n`
    + `        "_intermediateVariable"\n`
    + `    ],\n`
    + `    "exampleSpecification": {\n`
    + `        "labeledVariable": "Only labeled variables are necessary for `
    + `the task description while intermediate variables are for requirement `
    + `descriptions."\n`
    + `    },\n`
    + `    "exampleAnswer": "Write an example answer to the exampleTask so `
    + `that others can better understand the condition that needs to be met `
    + `for the task."\n`
    + `}`;

/**
 * Converts the tab key of the given textarea element event to 4 spaces
 * @param {Element} textArea Textarea element
 * @param {Event} event Textarea element event
 */
export function convertTab(textArea, event) {
    if (event.key === 'Tab') {
        event.preventDefault();

        // Get the cursor selection positions
        const start = textArea.selectionStart;
        const end = textArea.selectionEnd;

        // Insert 4 spaces in place of the selection
        textArea.value = textArea.value.substring(0, start)
            + '    ' + textArea.value.substring(end);

        // Move the cursor to the right position after the tab character
        textArea.selectionStart = textArea.selectionEnd = start + 4;
    }
}

/**
 * Encapsultes the requirement json into a "Requirement" folder, zips the
 * folder, and downloads the zip
 * @param {Element} downloadAnchor Download anchor <a> element
 */
export async function downloadZip(stringData, downloadAnchor) {

    // Encapsultes the requirement json into a "Requirement" folder, zips the
    // folder, and downloads the zip
    const zip = new JSZip();
    const folder = zip.folder("Requirement");
    folder.file("requirement.json", stringData);
    const blob = await zip.generateAsync({ type: "blob" });
    downloadAnchor.href = URL.createObjectURL(blob);
    downloadAnchor.download = "Requirement.zip";
    downloadAnchor.click();
    URL.revokeObjectURL(downloadAnchor.href);
}

/**
 * Converts the file paths into a combined tree text with branch indents
 * @param {Array<String>} paths Paths to each file
 * @returns Tree structure of the files in text with branch indents
 */
export function formatFileStructure(paths) {

    // Initialize file tree root
    const tree = {};

    // For each file path add the folder branches and file leaf nodes
    paths.forEach(path => {
        const parts = path.split('/');
        let current = tree;

        // In each branch part extend the branch if it doesn't already exist
        parts.forEach((part, index) => {
            if (!current[part]) {
                current[part] = (index === parts.length - 1) ? null : {};
            }
            current = current[part];
        });
    });

    /**
     * Converts the given tree object to a text file tree
     * @param {Object} node Tree branch to recursively write folder and file
     * branches from
     * @param {Number} depth How many indent branches deep the given node is
     * @returns Text file tree
     */
    function formatTree(node, depth = 0) {

        // Initialize text tree
        let result = '';

        // List all folders and files in the current branch, and if there are
        // folders then recursively display it with increased indent
        for (const key in node) {
            result += '    '.repeat(depth) + key + '\n';
            if (node[key] !== null) {
                result += formatTree(node[key], depth + 1);
            }
        }

        // Return the accumulated text file tree
        return result;
    }

    // Return the calculated tree object into text file tree
    return formatTree(tree).trim();
}

/**
 * Formats the requirement display text using requirements.json data
 * @param {JSON} requirementsJson Requirement JSON data to display
 * @param {Element} rootElement Element to place the requirement JSON
 * @returns {String} JSON file formatted into display page string
 */
export function formatRequirementJson(requirementsJson, rootElement) {

    // Clear the existing content
    rootElement.textContent = "";

    // Append the header
    const requirementHeader = document.createElement("h1");
    requirementHeader.textContent = "requirement.json";
    rootElement.append(requirementHeader);

    // Gets any list of labeled variables
    let labeledVariables = [];
    if ("labeledVariables" in requirementsJson
        && Array.isArray(requirementsJson.labeledVariables)
    ) {
        labeledVariables = requirementsJson.labeledVariables;
    }

    // Gets any list of intermediate variables
    let intermediateVariables = [];
    if ("intermediateVariables" in requirementsJson
        && Array.isArray(requirementsJson.intermediateVariables)
    ) {
        intermediateVariables = requirementsJson.intermediateVariables;
    }

    // Gets any condition text
    if ("condition" in requirementsJson
        && Array.isArray(requirementsJson.condition)
    ) {

        // Appends each string element as normal text, bold for labeled
        // variables, and italicized for intermediate variables
        const conditionHeader = document.createElement("h2");
        conditionHeader.textContent = "Condition";
        rootElement.appendChild(conditionHeader);
        const conditionStrings = requirementsJson.condition;
        for (let i = 0; i < conditionStrings.length; i++) {
            let textSection;
            if (labeledVariables.includes(conditionStrings[i])) {
                textSection = document.createElement("b");
            } else if (intermediateVariables.includes(conditionStrings[i])) {
                textSection = document.createElement("i");
            } else {
                textSection = document.createTextNode("");
            }
            textSection.textContent = conditionStrings[i];
            rootElement.appendChild(textSection);
        }
    }

    // Displays any labeled variables data
    if (labeledVariables.length > 0) {
        const labeledVariablesHeader = document.createElement("h2");
        labeledVariablesHeader.textContent = "Labeled Variables";
        rootElement.appendChild(labeledVariablesHeader);
        for (let i = 0; i < labeledVariables.length; i++) {
            const labeledVariable = document.createElement("div");
            labeledVariable.textContent = labeledVariables[i];
            const breakElement = document.createElement("br");
            rootElement.appendChild(labeledVariable);
            rootElement.appendChild(breakElement);
        }
    }

    // Displays any intermediate variables
    if (intermediateVariables.length > 0) {
        const intermediateVariablesHeader = document.createElement("h2");
        intermediateVariablesHeader.textContent = "Intermediate Variables";
        rootElement.appendChild(intermediateVariablesHeader);
        for (let i = 0; i < intermediateVariables.length; i++) {
            const intermediateVariable = document.createElement("div");
            intermediateVariable.textContent = intermediateVariables[i];
            const breakElement = document.createElement("br");
            rootElement.appendChild(intermediateVariable);
            rootElement.appendChild(breakElement);
        }
    }

    // Displays any example task
    if ("exampleSpecification" in requirementsJson) {
        
        // Appends section to display
        const exampleHeader = document.createElement("h2");
        exampleHeader.textContent = "Example Specification";
        rootElement.appendChild(exampleHeader);
        
        // Characters for tab and new line for JSON display
        const jsonString
            = JSON.stringify(requirementsJson.exampleSpecification, null, "\t");
        const jsonStringArray = jsonString.split(/(\t|\n)/).filter(Boolean);
        for (let i = 0; i < jsonStringArray.length; i++) {
            let jsonSection;
            if (jsonStringArray[i] == "\n") {
                jsonSection = document.createElement("br");
            } else if (jsonStringArray[i] == "\t") {
                jsonSection
                    = document.createTextNode("\u00A0\u00A0\u00A0\u00A0");
            } else {
                jsonSection = document.createTextNode(jsonStringArray[i]);
            }
            rootElement.appendChild(jsonSection);
        }
    }

    // Display any example answer
    if ("exampleAnswer" in requirementsJson) {

        // Appends section to display
        const exampleHeader = document.createElement("h2");
        exampleHeader.textContent = "Example Answer";
        rootElement.appendChild(exampleHeader);
        
        // Characters for tab and new line for JSON display
        const jsonString
            = JSON.stringify(requirementsJson.exampleAnswer, null, "\t");
        const jsonStringArray = jsonString.split(/(\t|\n)/).filter(Boolean);
        for (let i = 0; i < jsonStringArray.length; i++) {
            let jsonSection;
            if (jsonStringArray[i] == "\n") {
                jsonSection = document.createElement("br");
            } else if (jsonStringArray[i] == "\t") {
                jsonSection
                    = document.createTextNode("\u00A0\u00A0\u00A0\u00A0");
            } else {
                jsonSection = document.createTextNode(jsonStringArray[i]);
            }
            rootElement.appendChild(jsonSection);
        }
    }
}

/**
 * Formats the display of the task specification fold using the given
 * specification and requirement data
 * @param {JSON} specificationJson Single task specification. If the value is
 * null, then a warning for the specification condition is displayed.
 * @param {JSON} requirementJson Corresponding requirement to task
 * specification. If the value is null, then a warning for the specification is
 * displayed.
 */
export function formatTaskJson(
    specificationJson,
    requirementJson
) {

    // Initialize json variables
    let labeledVariables = [];
    let intermediateVariables = [];

    // Container for all task requirements
    const container = document.getElementById("task-requirements-container");

    // Task requirement fold template construction
    const templateRequirement = document.createElement("div");
    templateRequirement.id = "requirement-fold";
    templateRequirement.classList.add(
        "border", "left-align", "padding", "margin"
    );
    const headerRow = document.createElement("div");
    headerRow.id = "requirement-header";
    headerRow.classList.add("row", "vertically-center-row");
    const content = document.createElement("div");
    content.id = "content";
    const requirementToggle = document.createElement("div");
    requirementToggle.classList.add("large-text");
    requirementToggle.id = "requirement-toggle";
    requirementToggle.textContent = "▼";
    requirementToggle.classList.add(
        "border-button", "square", "padding", "left-align", "large-text"
    );
    requirementToggle.addEventListener("click", () => {
        if (content.style.display === "none") {
            content.style.display = "block";
            requirementToggle.textContent = "▼";
        } else {
            content.style.display = "none";
            requirementToggle.textContent = "▶";
        }
    });
    const requirementHeader = document.createElement("h1");
    requirementHeader.id = "requirement-id";
    requirementHeader.classList.add("left-align", "padding", "left");
    templateRequirement.appendChild(headerRow);
    templateRequirement.appendChild(content);
    headerRow.appendChild(requirementToggle);
    headerRow.appendChild(requirementHeader);

    // Validate the specification and requirement, and display a warning and
    // return if null
    if (requirementJson === null) {
        requirementHeader.textContent = "(!) Task requirement is invalid";
        container.appendChild(templateRequirement);
        return;
    } else if (specificationJson === null) {
        requirementHeader.textContent = "(!) Task specification invalid";
        container.appendChild(templateRequirement);
        return;
    }

    // Display the requirement ID in the requirement fold header
    requirementHeader.textContent = `Requirement `
        + `${specificationJson.requirementIndex}-`
        + `${specificationJson.requirementVersionIndex}`;

    // Gets any list of labeled variables
    if ("labeledVariables" in requirementJson
        && Array.isArray(requirementJson.labeledVariables)
    ) {
        labeledVariables = requirementJson.labeledVariables;
    }

    // Gets any list of intermediate variables
    if ("intermediateVariables" in requirementJson
        && Array.isArray(requirementJson.intermediateVariables)
    ) {
        intermediateVariables = requirementJson.intermediateVariables;
    }

    // Gets any condition text
    if ("condition" in requirementJson
        && Array.isArray(requirementJson.condition)
    ) {

        // Appends each string element as normal text, bold for labeled
        // variables, and italicized for intermediate variables, and inserts the
        // specification in the labelled variable condition
        const conditionHeader = document.createElement("h2");
        conditionHeader.textContent = "Condition";
        content.appendChild(conditionHeader);
        const conditionStrings = requirementJson.condition;
        for (let i = 0; i < conditionStrings.length; i++) {
            let conditionTextSection;
            if (labeledVariables.includes(conditionStrings[i])) {
                const labeledVariableText = specificationJson
                    .specifications[conditionStrings[i]];
                conditionTextSection = document.createElement("b");
                conditionTextSection.textContent = labeledVariableText;
            } else if (intermediateVariables.includes(conditionStrings[i])) {
                conditionTextSection = document.createElement("i");
                conditionTextSection.textContent = conditionStrings[i];
            } else {
                conditionTextSection
                    = document.createTextNode(conditionStrings[i]);
            }
            content.appendChild(conditionTextSection);
        }
    }

    // The fold is appended to the task requirements section
    container.appendChild(templateRequirement);
}

/**
 * Validates the zip input of the user matches the expected requirement has, and
 * if so the requirement.json data tries to be extracted
 * @param {Event} event Zip input button click event
 * @param {Element} errorText Html text element to display error 
 * @param {String} hash Hash the zip file must match
 */
export async function zipInputClicked(event, errorText, hash) {

    // Reset error text
    errorText.textContent = "";

    // Validate the input is a .zip
    const inputFile = event.target.files[0];
    if (inputFile.type !== 'application/zip') {
        errorText.textContent = "[X] ERROR: File uploaded is not a zip file";
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
        if (fileHash != hash) {
            errorText.textContent = "[X] ERROR: Uploaded .zip file hash does "
                + "not match requirement hash";
        } else {

            // Parses data from zip file
            dataHashMatchFound(inputFile);
        }
    };

    // Display error if problem reading zip file
    reader.onerror = function () {
        errorText.textContent = "[X] ERROR: Problem reading .zip file";
    };
}

/**
 * Only allows numerical inputs, and spaces the number in groups of 3 digits
 */
export function updateInputNumberToGroupedDigits(input) {

    // Only accepts numerical characters
    let inputValue = input.value.replace(/[^0-9]/g, '');

    // Deletes any preceding 0s
    if (inputValue.length > 1) {
        inputValue = inputValue.replace(/^0+/, '');
        if (inputValue.length === 0) {
            inputValue = "0";
        }
    }

    // Spaces any large number in groups of 3 digits
    inputValue = BigInt(inputValue).toLocaleString('en-US').replace(/,/g, ' ');

    // Updates the display
    input.value = inputValue;
}

/**
 * Searches for the given requirement index and version, and if no version is
 * given, then the most recent version is used
 * @param {Provider} provider Blockchain provider
 * @param {Contract} theListContract The List contract object to query
 * @param {SearchSettings} searchSettings Settings used to initialize search
 * starting from a specific point in the blockchain
 * @param {Number} index Requirement index
 * @param {Number} version Specific requirement version for search
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
export async function searchByIndexVersion(
    provider,
    theListContract,
    searchSettings,
    index,
    version,
) {

    // Gets the total number of requirements in The List
    let numberRequirementsValue;
    if ("numberRequirementsValue" in searchSettings) {
        numberRequirementsValue = searchSettings.numberRequirementsValue;
    } else {
        numberRequirementsValue = Number(
            await theListContract.requirementCount()
        );
    }

    // Get number of versions for search index if not already cached
    let indexVersions;
    if ("indexVersions" in searchSettings) {
        indexVersions = searchSettings.indexVersions;
    } else {
        indexVersions = Number(
            await theListContract.getRequirementVersion(index)
        );
    }

    // Validate requirement ID, and if out of bounds return null
    if (version <= 0
        || indexVersions < version
        || index < 0
        || numberRequirementsValue < index
    ) {
        return null;
    }

    // Version search variables
    let versionHash;
    let versionValidator;

    // If searching the most recent version, then the requirement data can
    // be obtained in the most recent block, otherwise binary search through
    // previous blocks for the data
    if (version === indexVersions) {
        versionHash
            = await theListContract.getRequirementHash(index);
        versionValidator
            = await theListContract.getRequirementValidatorAddress(index);
    } else {

        // Get max blockchain index if not already cached
        let minBlock;
        if ("minBlock" in searchSettings) {
            minBlock = searchSettings.minBlock;
        } else {
            minBlock = 0;
        }

        // Get max blockchain index if not already cached
        let maxBlock;
        if ("maxBlock" in searchSettings) {
            maxBlock = searchSettings.maxBlock;
        } else {
            maxBlock = Number(await provider.getBlockNumber());
        }

        // Binary search blockchain for the specific version, and if problem
        // occurs return null, otherwise get version data with obtained
        // blockchain block index
        const requirementIndexVersion = await binarySearchBlockchainVersions(
            theListContract,
            minBlock,
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
        hash: versionHash,
        index: index,
        version: version,
        validator: versionValidator
    };
}

/**
 * Gets the date object of the UTC time given by the blockchain provider
 * @param {Provider} provider Blockchain provider
 * @returns {Date} Date of the UTC time given by the blockchain provider
 */
export async function getBlockchainUtcTime(provider) {
    const block = await provider.getBlock('latest');
    return new Date(block.timestamp * 1000);
}

/**
 * When the page loads, the home and settings buttons are queried within their
 * shadow DOM and redirect to their respective pages when clicked
 */
export function loadHeader() {
    document.addEventListener('DOMContentLoaded', () => {
        const shadowRoot = document.querySelector('header-section').shadowRoot;
        shadowRoot.getElementById('left-button')
            .addEventListener('click', () => {
                window.location.href = 'index.html';
            });
        shadowRoot.getElementById('right-button')
            .addEventListener('click', () => {
                window.location.href = 'pages/settings.html';
            });
    });
}

/**
 * Continues a single iteration of the user links search
 * @param {SearchCriteria} searchCriteria Search data for getting users links
 * and data
 * @param {Contract} usersContract Users contract
 * @param {Element} skipAddressButton Button element that skips the link of the
 * current user
 * @param {Element} skipAddressButton Button element that skips the current user
 * @param {Element} tryDownloadButton Button element that tries to download data
 * from the user link
 * @param {Element} link A function that given a list of links returns the link
 * to the desired resource
 * @returns {Boolean} return.canSkipLink Whether the current link can be skipped
 * @returns {Boolean} return.canSkipAddress Whether the current user address can
 * be skipped
 * @returns {Number} return.autoUserLinksIndex Index of the current user link
 * among their list of links
 * @returns {String} return.autoUserAddress Address of the current user
 * @returns {Object} return.autoUserData Data of the current user
 * @returns {Object} return.autoSearchCriteria Search criteria for the next user
 * link search
 */
export function continueSearch(
    searchCriteria,
    usersContract,
    skipLinkButton,
    skipAddressButton,
    tryDownloadButton,
    link
) {
    let canSkipLink;
    let canSkipAddress;
    let autoUserLinksIndex;

    // Discovers the next user, then displays the user link information
    return autoDiscoverUser(
        searchCriteria, usersContract, skipAddressButton
    ).then((user) => {

        // If user not found, then display end of user search
        if (!("userAddress" in user)) {
            tryDownloadButton.textContent = `No more users`;
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
            return {
                canSkipLink: false,
                canSkipAddress: false
            };
        }

        // Update the user address, links, and data
        let autoUserAddress = user.userAddress;
        const userLinks = user.userLinks.split(",");
        let autoUserData = user.userData;
        let autoSearchCriteria = user.searchCriteria;
        let autoUserLinks = [];
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
            return continueSearch(
                autoSearchCriteria,
                usersContract,
                skipLinkButton,
                skipAddressButton,
                tryDownloadButton,
                link
            );
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
            + `${autoUserAddress}\r\nLink: ${link(autoUserLinks)}`;

        // Return updated skip and user data
        return {
            canSkipLink: canSkipLink,
            canSkipAddress: canSkipAddress,
            autoUserLinks: autoUserLinks,
            autoUserLinksIndex: autoUserLinksIndex,
            autoUserAddress: autoUserAddress,
            autoUserData: autoUserData,
            autoSearchCriteria: autoSearchCriteria
        };
    });
}

/**
 * Given the search criteria iteratively searches for the next user data in the
 * search
 * @param {SearchCriteria} searchCriteria Search data for getting users links
 * and data
 * @param {Contract} usersContract Users contract
 * @param {Element} skipAddressButton Button element that skips the current user
 * @returns {Object} Next search criteria and possible user data
 * @returns {SearchCriteria} return.searchCriteria Search data for getting users
 * links and data for the next search iteration
 * @returns {?String} return.userAddress Address of user found
 * @returns {?String} return.userLinks Most recent links of user found
 * @returns {?String} return.userData Most recent data of user found
 */
async function autoDiscoverUser(
    searchCriteria,
    usersContract,
    skipAddressButton
) {

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
                    searchBlock: firstBlockEventArgs[firstBlockEventArgs.length - 1]
                }
            };
        } else {
            const lastInteractionBlockIndex
                = await usersContract.lastInteractionBlockIndex();
            return {
                searchCriteria: {
                    searchBlock: lastInteractionBlockIndex
                }
            };
        }


    }
}

/**
 * Formats large number wei into digit groups of 3 with spacing
 * @param {BigInt} wei Wei amount
 * @returns Formatted Wei number
 */
export function formatWei(wei) {
    return wei.toLocaleString('en-US').replace(/,/g, ' ');
}

/**
 * Fromats the given block timestamp to UTC
 * @param {BigInt} t Timestamp of block
 * @returns Timestamp of block in UTC format
 */
export function formatBlockTimestamp(t) {
    return new Date(Number(t) * 1000).toUTCString();
}

/**
 * Gets the validator address and requirement hash of the current requirement
 * @param {Provider} provider Blockchain provider
 * @param {Contract} theListContract The List contract object to query
 * @param {Number} index Requirement index
 * @param {Number} version Requirement version index
 * @param {Number} minimumBlockNumber Minimum block number to search from
 * @returns {?Object} Requirement data object
 * @returns {String} return.validatorAddress Requirement validator
 * @returns {String} return.versionHash Requirement hash
 */
export async function getRequirementVersionData(
    provider,
    theListContract,
    index,
    version,
    minimumBlockNumber
) {

    // Try to get latest data without searching blockchain history
    const currentVersion = Number(
	await theListContract.getRequirementVersion(index)
    );
    if (currentVersion === version) {
        return {
	    validatorAddress: await theListContract
		.getRequirementValidatorAddress(index),
	    versionHash: await theListContract.getRequirementHash(index)
	}
    }

    // Binary searches blockchain for requirement version
    const currentBlock = Number(await provider.getBlockNumber());
    const requirementVersionFound = await binarySearchBlockchainVersions(
        theListContract,
        minimumBlockNumber,
        currentBlock,
        index,
        version
    );

    // If requirement version not found return null, otherwise return
    // requirement version data
    if (requirementVersionFound === null) {
        return null;
    }
    return {
        validatorAddress: requirementVersionFound.validator,
        versionHash: requirementVersionFound.hash
    };
}

/**
 * Gets the validator task submission status which describes the submission
 * evaluation among the possible states
 * @param {Boolean} isTaskComplete Whether the task has been completed
 * @param {Boolean} isTaskDefaulted Whether the task has defaulted
 * @param {Number} index Index of the submission within the validator task
 * @param {Number} evaluatedSubmissions Number of submissions that have been
 * evaluated within the task
 * @param {Date} validationStartTime Time of the start of the submission
 * evaluation timespan
 * @param {Date} validationEndTime Time of the end of the submission evalution
 * timespan
 * @returns {
 * 'Completed'
 * | 'Completed Defaulted'
 * | 'Rejected'
 * | 'Incomplete Unevaluated'
 * | 'Waiting Evaluation'
 * | 'Waiting For Evaluation Timespan'
 * | 'Waiting For Previous Submission Evaluation'
 * | 'Unexpected Data'
 * } String describing the status of the submission
 */
export function getValidatorSubmissionStatus(
    isTaskComplete,
    isTaskDefaulted,
    index,
    evaluatedSubmissions,
    validationStartTime,
    validationEndTime
) {

    // Used to determine if a task is incomplete
    const isIncompleteUnevaluated = isTaskComplete
        && index !== evaluatedSubmissions - 1;
    const isIncompleteDefaulted = isTaskDefaulted
        && index !== evaluatedSubmissions;

    // Descriptions of the possible submission states that are dependent on
    // other evaluated tasks and the submission evaluation time window
    if (isTaskComplete && index === evaluatedSubmissions - 1) {
        return "Completed";
    } else if (isTaskDefaulted && index === evaluatedSubmissions) {
        return "Completed Defaulted";
    } else if (index < evaluatedSubmissions) {
        return "Rejected";
    } else if (isIncompleteUnevaluated || isIncompleteDefaulted) {
        return "Incomplete Unevaluated";
    } else if (
        !isTaskComplete
        && !isTaskDefaulted
        && validationStartTime < new Date()
        && new Date() < validationEndTime
    ) {
        return "Waiting Evaluation";
    } else if (
        !isTaskComplete
        && !isTaskDefaulted
        && index === evaluatedSubmissions
        && new Date() <= validationStartTime
    ) {
        return "Waiting For Evaluation Timespan";
    } else if (
        !isTaskComplete
        && !isTaskDefaulted
        && index > evaluatedSubmissions
    ) {
        return "Waiting For Previous Submission Evaluation";
    } else {
        return "Unexpected Data";
    }
}

/**
 * Given the hex data, it is converted to whatever data type it may represent
 * which is indicated by the leading bytes
 * @param {String} userDataBytes Hex bytes with "0x" prefix
 * @returns {Object} Object containing the data type and associated data
 * representation
 * @returns {String} return.type Description of the type of data
 * @returns {Object} return.data Some clear representation of the data
 */
export function parseUserData(userDataBytes) {

    // If it is empty bytes, then default to showing the empty byte data
    if (getBytes(userDataBytes).length === 0) {
        return {
            type: "None",
            data: userDataBytes
        };
    }

    // If it is a 0x00 byte, then it defaults to a UTF8 text name
    if (getBytes(userDataBytes)[0] === 0x00) {
        return {
            type: "Name",
            data: ethers.toUtf8String(getBytes(userDataBytes).slice(1))
        };
    }

    // Default unknown data type to "None" and display hex data
    return {
        type: "None",
        data: userDataBytes
    };
}

/**
 * Gets the button redirect path and button text to a relevant resource of the
 * given contract event
 * @param {String} contractName String name of the contract
 * @param {String} eventName String name of the event
 * @param {Array<Object>} eventValues Parameters of the contract event
 * @returns {?Object} Button data if there is a relevant resource to the event,
 * otherwise return null
 * @returns {String} return.redirectPath Relative path to the relevant resource
 * webpage
 * @returns {String} return.redirectText Description text of the button redirect
 */
export function getButtonRedirectFromEvent(
    contractName,
    eventName,
    eventValues
) {
    const eventId = `${contractName}:${eventName}`;
    if (eventId in EVENT_REDIRECT_MAPPING) {
        return EVENT_REDIRECT_MAPPING[eventId](eventValues);
    }
    return null;
}

const EVENT_REDIRECT_MAPPING = {

    // Users contract events
    "Users:ActivateUserLinks": (eventValues) => {
        return {
            redirectPath: `/pages/users/user.html?address=${eventValues[0]}`,
            redirectText: "View User"
        }
    },
    "Users:ActivateUserLinksData": (eventValues) => {
        return {
            redirectPath: `/pages/users/user.html?address=${eventValues[0]}`,
            redirectText: "View User"
        }
    },
    "Users:ActivateUserLinksLockout": (eventValues) => {
        return {
            redirectPath: `/pages/users/user.html?address=${eventValues[0]}`,
            redirectText: "View User"
        }
    },
    "Users:ActivateUserLinksDataLockout": (eventValues) => {
        return {
            redirectPath: `/pages/users/user.html?address=${eventValues[0]}`,
            redirectText: "View User"
        }
    },
    "Users:UpdateLinks": (eventValues) => {
        return {
            redirectPath: `/pages/users/user.html?address=${eventValues[0]}`,
            redirectText: "View User"
        }
    },
    "Users:UpdateData": (eventValues) => {
        return {
            redirectPath: `/pages/users/user.html?address=${eventValues[0]}`,
            redirectText: "View User"
        }
    },
    "Users:UpdateLinksData": (eventValues) => {
        return {
            redirectPath: `/pages/users/user.html?address=${eventValues[0]}`,
            redirectText: "View User"
        }
    },
    "Users:LockoutUser": (eventValues) => {
        return {
            redirectPath: `/pages/users/user.html?address=${eventValues[2]}`,
            redirectText: "View User"
        }
    },

    // TheList contract events
    "TheList:EthicsProposal": (eventValues) => {
        return {
            redirectPath: `/pages/ethicsRequirements/ethicsRequirementsProposal.html?index=${eventValues[0]}`,
            redirectText: "View Ethics Requirements Proposal"
        }
    },
    "TheList:EthicsVote": (eventValues) => {
        return {
            redirectPath: `/pages/ethicsRequirements/ethicsRequirementsProposal.html?index=${eventValues[0]}`,
            redirectText: "View Ethics Requirements Proposal"
        }
    },
    "TheList:NewRequirement": (eventValues) => {
        return {
            redirectPath: `/pages/requirements/requirement.html?id=${eventValues[0]}-1`,
            redirectText: "View Requirement"
        }
    },
    "TheList:Proposal": (eventValues) => {
        return {
            redirectPath: `/pages/requirements/requirementProposal.html?index=${eventValues[0]}&proposalIndex=${eventValues[1]}`,
            redirectText: "View Requirement Proposal"
        }
    },
    "TheList:Vote": (eventValues) => {
        return {
            redirectPath: `/pages/requirements/requirementProposal.html?index=${eventValues[0]}&proposalIndex=${eventValues[1]}`,
            redirectText: "View Requirement Proposal"
        }
    },
    "TheList:NewRequirementUpdate": (eventValues) => {
        return {
            redirectPath: `/pages/requirements/requirement.html?id=${eventValues[0]}-${eventValues[2]}`,
            redirectText: "View Requirement"
        }
    },

    // HashTask contract events
    "HashTask:NewTask": (eventValues) => {
        return {
            redirectPath: `/pages/hashTask/hashTask.html?id=h-${eventValues[0]}`,
            redirectText: "View Hash Task"
        }
    },
    "HashTask:TaskFunded": (eventValues) => {
        return {
            redirectPath: `/pages/hashTask/hashTask.html?id=h-${eventValues[0]}`,
            redirectText: "View Hash Task"
        }
    },
    "HashTask:TaskComplete": (eventValues) => {
        return {
            redirectPath: `/pages/hashTask/hashTask.html?id=h-${eventValues[0]}`,
            redirectText: "View Hash Task"
        }
    },
    "HashTask:TaskWithdrawn": (eventValues) => {
        return {
            redirectPath: `/pages/hashTask/hashTask.html?id=h-${eventValues[0]}`,
            redirectText: "View Hash Task"
        }
    },

    // DoubleHashTask contract events
    "DoubleHashTask:NewDoubleTask": (eventValues) => {
        return {
            redirectPath: `/pages/doubleHashTask/doubleHashTask.html?id=dh-${eventValues[0]}`,
            redirectText: "View Double Hash Task"
        }
    },
    "DoubleHashTask:DoubleTaskFunded": (eventValues) => {
        return {
            redirectPath: `/pages/doubleHashTask/doubleHashTask.html?id=dh-${eventValues[0]}`,
            redirectText: "View Double Hash Task"
        }
    },
    "DoubleHashTask:DoubleTaskSubmit": (eventValues) => {
        return {
            redirectPath: `/pages/doubleHashTask/doubleHashTask.html?id=dh-${eventValues[0]}`,
            redirectText: "View Double Hash Task"
        }
    },
    "DoubleHashTask:DoubleTaskComplete": (eventValues) => {
        return {
            redirectPath: `/pages/doubleHashTask/doubleHashTask.html?id=dh-${eventValues[0]}`,
            redirectText: "View Double Hash Task"
        }
    },
    "DoubleHashTask:DoubleTaskWithdrawn": (eventValues) => {
        return {
            redirectPath: `/pages/doubleHashTask/doubleHashTask.html?id=dh-${eventValues[0]}`,
            redirectText: "View Double Hash Task"
        }
    },

    // ValidatorTask contract events
    "ValidatorTask:AddTask": (eventValues) => {
        return {
            redirectPath: `/pages/validatorTask/validatorTask.html?id=v-${eventValues[0]}`,
            redirectText: "View Validator Task"
        }
    },
    "ValidatorTask:FundTask": (eventValues) => {
        return {
            redirectPath: `/pages/validatorTask/validatorTask.html?id=v-${eventValues[0]}`,
            redirectText: "View Validator Task"
        }
    },
    "ValidatorTask:SubmitTask": (eventValues) => {
        return {
            redirectPath: `/pages/validatorTask/validatorTaskSubmission.html?id=v-${eventValues[0]}-${eventValues[1]}`,
            redirectText: "View Validator Task Submission"
        }
    },
    "ValidatorTask:EvaluateTask": (eventValues) => {
        return {
            redirectPath: `/pages/validatorTask/validatorTaskSubmission.html?id=v-${eventValues[0]}-${eventValues[1]}`,
            redirectText: "View Validator Task Submission"
        }
    },
    "ValidatorTask:WithdrawTask": (eventValues) => {
        return {
            redirectPath: `/pages/validatorTask/validatorTask.html?id=v-${eventValues[0]}`,
            redirectText: "View Validator Task"
        }
    },
    "ValidatorTask:WithdrawSubmissionCompletion": (eventValues) => {
        return {
            redirectPath: `/pages/validatorTask/validatorTask.html?id=v-${eventValues[0]}-${eventValues[1]}`,
            redirectText: "View Validator Task Submission"
        }
    },
    "ValidatorTask:WithdrawSubmissionUnevaluated": (eventValues) => {
        return {
            redirectPath: `/pages/validatorTask/validatorTask.html?id=v-${eventValues[0]}-${eventValues[1]}`,
            redirectText: "View Validator Task Submission"
        }
    },
};

/**
 * Determines whether the given string is a valid task format
 * @param {String} taskString String to validate task format
 * @returns Whether the given string is a valid task format
 */
export function isValidTask(taskString) {
    if (typeof taskString !== "string") {
        return false;
    }
    const splitIndex = taskString.indexOf("-");
    if (splitIndex < 1 || taskString.length < splitIndex) {
        return false;
    }
    const shortName = taskString.substring(0, splitIndex);
    const index = Number(taskString.substring(splitIndex + 1));
    const validTaskShortName = TASK_SHORT_NAMES.includes(shortName);
    const validTaskIndex = Number.isInteger(index) && Number(index) >= 0;
    return validTaskShortName && validTaskIndex;
}

/**
 * Determines whether the given string is a valid requirement format
 * @param {String} requirementString String to validate requirement format
 * @returns Whether the given string is a valid requirement format
 */
export function isValidRequirement(requirementString) {
    if (typeof requirementString !== "string") {
        return false;
    }
    const splitIndex = requirementString.indexOf("-");
    if (splitIndex < 1 || requirementString.length < splitIndex) {
        return false;
    }
    const index = Number(requirementString.substring(0, splitIndex));
    const version = Number(requirementString.substring(splitIndex + 1));
    const validIndex = Number.isInteger(index) && Number(index) >= 0;
    const validVersion = Number.isInteger(version) && Number(version) >= 1;
    return validIndex && validVersion;
}

/**
 * Gets the cookie value of the given cookie name
 * @param {String} cookieName Name of the cookie
 * @returns {String} Value of the cookie or undefined if the cookie does
 * not exist
 */
export function getCookie(cookieName) {
    let name = `${cookieName}=`;
    let decodedCookie = decodeURIComponent(document.cookie);
    let cookieArray = decodedCookie.split(';');
    for(let i = 0; i < cookieArray.length; i++) {
        let cookie = cookieArray[i];
        while (cookie.charAt(0) == ' ') {
            cookie = cookie.substring(1);
        }
        if (cookie.indexOf(name) == 0) {
            return cookie.substring(name.length, cookie.length);
        }
    }
    return undefined;
}
