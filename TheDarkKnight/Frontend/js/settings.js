import { loadHeader } from "../utils/commonFunctions.js";
import {
    USERS_CONTRACT_ADDRESS,
    THE_LIST_CONTRACT_ADDRESS,
    HASH_TASK_CONTRACT_ADDRESS,
    DOUBLE_HASH_TASK_CONTRACT_ADDRESS,
    VALIDATOR_TASK_CONTRACT_ADDRESS,
    USERS_CONTRACT_MINIMUM_BLOCK,
    THE_LIST_CONTRACT_MINIMUM_BLOCK,
    HASH_TASK_CONTRACT_MINIMUM_BLOCK,
    DOUBLE_HASH_TASK_CONTRACT_MINIMUM_BLOCK,
    VALIDATOR_TASK_CONTRACT_MINIMUM_BLOCK,
} from "../utils/constants.js";

// Page elements
const toggleButton = document.getElementById("toggle-button");
const modeButton = document.getElementById("mode-button");
const modeButtonSvg = document.getElementById("mode-button-svg");
const modeButtonText = document.getElementById("mode-icon-text");
const blockchainDataInput = document.getElementById("blockchain-data-input");
const blockchainDataSaveButton
    = document.getElementById("blockchain-data-save-button");
const blockchainDataError = document.getElementById("blockchain-data-error");

// Load the header button navigation functionality
loadHeader();

// Get local storage data
const darkMode = localStorage.getItem("darkMode");
const blockchainDataString = localStorage.getItem("blockchainData");

// Apply dark mode preference to body
let isLightMode = darkMode === "disabled";
if (isLightMode) {
    document.body.classList.remove("dark-mode");
    modeButtonSvg.setAttribute("src", "assets/icons/LightMode.svg");
    modeButtonText.textContent = "Light Mode";
    toggleButton.textContent = "Toggle: Light Mode";
} else {
    document.body.classList.add("dark-mode");
    modeButtonSvg.setAttribute("src", "assets/icons/DarkMode.svg");
    modeButtonText.textContent = "Dark Mode";
    toggleButton.textContent = "Toggle: Dark Mode";
}

// Set the blockchain data input from local storage
if (blockchainDataString != null) {
    const blockchainDataObject = JSON.parse(blockchainDataString);
    const formattedJson = JSON.stringify(blockchainDataObject, null, 4);
    blockchainDataInput.value = formattedJson;
}

// Dark/light mode icon button toggles between dark and light theme
toggleButton.addEventListener("click", changeVariableAndIcon);

// Dark/light mode button toggles between dark and light theme
modeButton.addEventListener("click", changeVariableAndIcon);

// Save button saves blockchain data input to local storage, and displays error
// or save text
blockchainDataSaveButton.addEventListener("click", saveBlockchainData);

/**
 * Toggles the dark/light theme local storage variable, and toggles the icon
 * correspondingly
 */
function changeVariableAndIcon() {
    if (isLightMode) {
        isLightMode = false;
        document.body.classList.add("dark-mode");
        localStorage.setItem("darkMode", "enabled");
        modeButtonSvg.setAttribute("src", "assets/icons/DarkMode.svg");
        modeButtonText.textContent = "Dark Mode";
        toggleButton.textContent = "Toggle: Dark Mode";
    } else {
        isLightMode = true;
        document.body.classList.remove("dark-mode");
        localStorage.setItem("darkMode", "disabled");
        modeButtonSvg.setAttribute("src", "assets/icons/LightMode.svg");
        modeButtonText.textContent = "Light Mode";
        toggleButton.textContent = "Toggle: Light Mode";
    }
}

/**
 * Tries to set the blockchain data, but if an error occurs, then display the
 * error to the user. The blockchain data consists of each of the contract
 * addresses and the block indices of the contract addresses.
 */
function saveBlockchainData() {

    // Try to et the blockchain data, and if an error is occurs, display the
    // error message
    try {

        // Save the data with compact string format
        const blockchainDataObject = JSON.parse(blockchainDataInput.value);
        const blockchainDataDenseString = JSON.stringify(blockchainDataObject);
        localStorage.setItem("blockchainData", blockchainDataDenseString);

        // Display the successfully saved message, wait, then hide the message
        blockchainDataError.style.display = "block";
        blockchainDataError.textContent = "Saved!";
        setTimeout(() => {
            blockchainDataError.style.display = "none";
            blockchainDataError.textContent = "";
        }, 5000);
    } catch (error) {

        // Display the error encountered
        blockchainDataError.style.display = "block";
        blockchainDataError.textContent
            = `[X] Error saving blockchain data: ${error}`;
    }
}
