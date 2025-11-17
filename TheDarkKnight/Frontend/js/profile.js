import { ethers } from "../js/libs/ethers.min.js";
import {
    loadHeader,
    prefixHexBytes,
    parseUserData
} from "../utils/commonFunctions.js";
import { USERS_CONTRACT_ADDRESS } from "../utils/constants.js";

// Page elements
const ethereumAddress = document.getElementById("ethereum-address");
const errorText = document.getElementById("profile-error-text");
const deleteErrorText = document.getElementById("delete-error-text");
const connectWallet = document.getElementById("connect-wallet");
const createProfileGrid = document.getElementById("create-profile-grid");
const updateProfileGrid = document.getElementById("update-profile-grid");
const deleteProfileGrid = document.getElementById("delete-profile-grid");
const saveProfileButton = document.getElementById("save-profile");
const createProfileButton = document.getElementById("create-profile");
const userLinks = document.getElementById("user-links");
const userNameText = document.getElementById("user-name");
const userLockoutCode = document.getElementById("user-lockout-code");
const linksTextbox = document.getElementById("create-links-textbox");
const nameTextbox = document.getElementById("create-name-textbox");
const lockoutCodeTextbox
    = document.getElementById("create-lockout-code-textbox");
const editLinksButton = document.getElementById("update-links-edit-button");
const editNameButton = document.getElementById("update-name-edit-button");
const updateLinksTextbox = document.getElementById("update-links-textbox");
const updateNameTextbox = document.getElementById("update-name-textbox");
const deleteAddressText = document.getElementById("delete-address-text");
const deleteAddressTextbox = document.getElementById("delete-address-textbox");
const deleteKeyText = document.getElementById("delete-key-text");
const deleteKeyTextbox = document.getElementById("delete-key-textbox");
const deleteUser = document.getElementById("delete-user");
const userLockedOutText = document.getElementById("user-locked");

// Load the header button navigation functionality
loadHeader();

// Ethereum user variables
let address;
let userLinksValue;
let userNameValue;
let userLockoutCodeValue;
let editLinksMode = false;
let editNameMode = false;

// Network provider and signer for transactions
let provider;
let signer;
let signerUsersContract;

// Connect to wallet provider if found, otherwise display error
if (window.ethereum) {
    provider = new ethers.BrowserProvider(window.ethereum);
} else {
    errorText.textContent = "[X] ERROR: No wallet found";
}

// Get the User contract
const usersContractAddress = USERS_CONTRACT_ADDRESS;
const usersAbi = await fetch('./data/abi/usersAbi.json');
const usersJson = await usersAbi.json();
const usersContract = new ethers.Contract(
    usersContractAddress,
    usersJson.abi,
    provider
);

// Automatically load user, or show button for user to connect
if (window.ethereum && window.ethereum.selectedAddress) {
    window.ethereum.on('accountsChanged', () => {
        loadUser();
    });
    loadUser();
} else {
    connectWallet.style.display = "flex";
}

// Connect wallet and load user when button clicked
connectWallet.addEventListener("click", () => {
    errorText.textContent = "";
    connectWallet.style.display = "none";
    loadUser();
});

// Create user with information fields
createProfileButton.addEventListener("click", async () => {

    // Display error if problem connecting to wallet
    if (!validateWallet()) {
        return;
    }

    // Display error if missing required links field
    const links = linksTextbox.value;
    if (links === "") {
        errorText.textContent = "[X] ERROR: Links should not be empty";
        return;
    }

    // Convert name field to bytes if it's filled in
    let name = "";
    if (nameTextbox.value != "") {
        const nameBytes = ethers.toUtf8Bytes(nameTextbox.value);
        name = Uint8Array.from([0, ...nameBytes]);
    }

    // Convert hex lockout code to bytes if it's filled in, otherwise use null
    // key encryption
    let lockout = "";
    if (lockoutCodeTextbox.value != "") {
        lockout = ethers.getBytes(prefixHexBytes(lockoutCodeTextbox.value));
    }

    // Execute user creation transaction depending on filled in fields
    let transactionResponse;
    if (name === "" && lockout === "") {
        transactionResponse = await signerUsersContract[
            "activateUser(string)"
        ](links);
    } else if (name === "") {
        transactionResponse = await signerUsersContract[
            "activateUser(string, bytes32)"
        ](links, lockout);
    } else if (lockout === "") {
        transactionResponse = await signerUsersContract[
            "activateUser(string, bytes)"
        ](links, name);
    } else {
        transactionResponse = await signerUsersContract[
            "activateUser(string, bytes, bytes32)"
        ](links, name, lockout);
    }

    // Once the transaction finishes reload user profile
    transactionResponse.wait().then(async () => {
        await loadUser();
    });
});

// Update any profile changes
saveProfileButton.addEventListener("click", async () => {

    // Display error if problem connecting to wallet
    if (!validateWallet()) {
        return;
    }

    // Execute user update transaction depending on filled in fields
    const links
        = editLinksMode ? updateLinksTextbox.value : userLinks.textContent;
    const name
        = editNameMode ? updateNameTextbox.value : userNameText.textContent;
    const nameBytes = ethers.toUtf8Bytes(updateNameTextbox.value);
    const userData = Uint8Array.from([0, ...nameBytes]);
    let transactionResponse;
    if (links !== userLinksValue && name !== userNameValue) {
        transactionResponse = await signerUsersContract[
            "updateUserLinksData(string, bytes)"
        ](links, userData);
    } else if (links !== userLinksValue) {
        transactionResponse = await signerUsersContract[
            "updateUserLinks(string)"
        ](links);
    } else if (name !== userNameValue) {
        transactionResponse = await signerUsersContract[
            "updateData(bytes)"
        ](userData);
    } else {
        errorText.textContent = "[X] ERROR: No changes in values detected";
        return;
    }

    // Once the transaction finishes reload user profile
    transactionResponse.wait().then(async () => {
        window.location.reload();
    });
});

// When edit button clicked change links button from readonly to write
editLinksButton.addEventListener("click", () => {
    const linksText = userLinks.textContent;
    updateLinksTextbox.value = linksText;
    updateLinksTextbox.style.display = "block";
    userLinks.style.display = "none";
    editLinksMode = true;
});

// When edit button clicked change name button from readonly to write
editNameButton.addEventListener("click", () => {
    const nameText = userNameText.textContent;
    updateNameTextbox.value = nameText;
    updateNameTextbox.style.display = "block";
    userNameText.style.display = "none";
    editNameMode = true;
});

// Show delete user button if address and lockout code matches expected
deleteKeyTextbox.addEventListener("input", updateUserDelete);

// Show delete user button if address and lockout code matches expected
deleteAddressTextbox.addEventListener("input", updateUserDelete);

// Delete user if valid data provided
deleteUser.addEventListener("click", async () => {

    // Display error if problem connecting to wallet
    if (!validateWallet()) {
        return;
    }

    // Get delete address and lockout key to use in delete user transaction
    const deleteAddress = deleteAddressTextbox.value;
    const deleteKey = deleteKeyTextbox.value;
    const transactionResponse = await signerUsersContract.lockoutUser(
        prefixHexBytes(deleteAddress),
        prefixHexBytes(deleteKey)
    );
    transactionResponse.wait().then(loadUser);
});

/**
 * Displays error text iff encounter connecting wallet error
 * @returns True if success, and false if error connecting wallet
 */
function validateWallet() {
    errorText.textContent = "";
    if (window.ethereum === undefined) {
        errorText.textContent = "[X] ERROR: Ethereum wallet not found";
        return false;
    }
    return true;
}
/**
 * Updates the delete user error text and button depending on delete address and
 * lockout key input fields
 */
async function updateUserDelete() {

    // Reset error text and delete button, and hide both if fields empty
    deleteErrorText.textContent = '';
    deleteUser.style.display = 'none';
    if (deleteAddressTextbox.value === "" && deleteKeyTextbox.value === "") {
        return;
    }

    // Display error if problem with address or key input
    const cleanAddressBytes = prefixHexBytes(deleteAddressTextbox.value);
    const cleanKeyBytes = prefixHexBytes(deleteKeyTextbox.value);
    if (cleanAddressBytes === null || cleanAddressBytes.length !== 42) {
        deleteErrorText.textContent = "[X] ERROR: Invalid user address";
        return;
    }
    if (cleanKeyBytes === null || cleanKeyBytes.length !== 66) {
        deleteErrorText.textContent = "[X] ERROR: Invalid lockout key";
        return;
    }

    // Display error if problem obtaining lockout code
    let lockoutCodeExpected;
    try {
        lockoutCodeExpected
            = await usersContract.lockoutCodes(cleanAddressBytes);
    } catch (error) {
        deleteErrorText.textContent = error;
        return;
    }

    // Display error if lockout key hash doesn't match expected
    const hashValue = ethers.keccak256(cleanKeyBytes);
    if (hashValue === lockoutCodeExpected) {
        deleteUser.style.display = 'block';
    } else {
        deleteErrorText.textContent = `[X] ERROR: Hash of lockout code does not `
            + `match expected`;
    }
}

/**
 * Show user fields based on user activation status from user address
 */
async function loadUser() {

    // Show error if problem with wallet provider
    try {
        await provider.send("eth_requestAccounts", []);
    } catch {
        errorText.textContent = "[X] ERROR: No wallet found";
        return;
    }

    // Get wallet and provider signers to retrieve data from the blockchain
    signer = await provider.getSigner();
    address = signer.address;
    signerUsersContract = new ethers.Contract(
        usersContractAddress,
        usersJson.abi,
        signer
    );

    // Update user address field
    ethereumAddress.textContent = `Ethereum Address: ${address}`;

    // Get user activation status where 0 === UNACTIVATED, 1 === ACTIVE, and
    // 2 === DEACTIVE
    const activationStatus = Number(
        await usersContract.activationStatus(address)
    );

    // Hide all sections for reload
    userLockedOutText.style.display = "none";
    saveProfileButton.style.display = "none";
    createProfileButton.style.display = "none";
    deleteUser.style.display = "none";
    updateProfileGrid.style.display = "none";
    createProfileGrid.style.display = "none";
    deleteProfileGrid.style.display = "none";

    // Show fields based on user activation status
    if (activationStatus === 0) {

        // If user is unactivated, then show user unactivated fields
        createProfileGrid.style.display = 'grid';
        createProfileButton.style.display = 'block';
        deleteAddressText.style.display = 'block';
        deleteAddressTextbox.style.display = 'block';
        deleteKeyText.style.display = 'block';
        deleteKeyTextbox.style.display = 'block';

    } else if (activationStatus === 1) {

        // If user is unactivated, then show active user fields

        // Retrieve user data
        const { links, userName, lockoutCode } = await fetchUserData(address);

        // Update user data with retrieved data
        userLinksValue = links;
        userNameValue = userName;
        userLockoutCodeValue = lockoutCode;

        // Update user fields with retrieved data
        userLinks.textContent = links;
        userNameText.textContent = userName;
        updateLinksTextbox.textContent = links;
        updateNameTextbox.textContent = userName;
        userLockoutCode.textContent = lockoutCode;

        // Show active user fields
        updateProfileGrid.style.display = 'grid';
        saveProfileButton.style.display = 'block';
        userLinks.style.display = "block";
        userNameText.style.display = "block";
        deleteProfileGrid.style.display = 'grid';
        deleteAddressText.style.display = 'block';
        deleteAddressTextbox.style.display = 'block';
        deleteKeyText.style.display = 'block';
        deleteKeyTextbox.style.display = 'block';

        // If delete user data is filled in, then show delete button if address
        // and lockout key match expected
        if (
            deleteAddressTextbox.value !== ""
            && deleteKeyTextbox.value !== ""
        ) {
            updateUserDelete();
        }
    } else if (activationStatus === 2) {

        // If user is deactivated, show deactive message
        userLockedOutText.style.display = 'block';
    }
}

/**
 * Gets the user links, data, and lockout code of given address on the
 * blockchain
 * @param {string} address Ethereum address of user
 * @returns {Object} The user data
 * @returns {string} return.links Contact and api links to user
 * @returns {string} return.userName User data bytes in UTF-8 formatting
 * @returns {string} return.lockoutCode User lockout code bytes with preceding
 * "0x"
 */
async function fetchUserData(address) {
    const links = await usersContract.links(address);
    const userData = await usersContract.usersData(address);
    const userName = parseUserData(userData).data;
    const lockoutCode = await usersContract.lockoutCodes(address);
    return { links, userName, lockoutCode }
}
