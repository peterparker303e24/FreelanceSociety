import { ethers } from "./libs/ethers.min.js";
import { addClass, removeClass } from "../utils/commonFunctions.js";
import "./libs/jszip.min.js";

// Page elements
const textAreaInputElement = document.getElementById("text-area-input");
const dropdownElement = document.getElementById("input-type");
const firstHashText = document.getElementById('first-hash');
const secondHashText = document.getElementById('second-hash');
const thirdHashText = document.getElementById('third-hash');
const hashErrorText = document.getElementById('hash-error');
const fileUpload = document.getElementById('upload-file-button');
const zipInput = document.getElementById('file-input');
const fileName = document.getElementById('file-name');
const fileHash = document.getElementById('file-hash');
const fileUploadError = document.getElementById('file-upload-error');

// Update the keccak256 hashes when the text area input changes
textAreaInputElement.addEventListener("input", hashInput);

// Convert tab key event to tab character
textAreaInputElement.addEventListener("keydown", convertTab);

// Update the keccak256 hash when the input type changes
dropdownElement.addEventListener("change", hashInput);

// Activates the zip file upload anchor
fileUpload.addEventListener('click', function () {
    zipInput.click();
});

// Prompts user to upload a zip file
zipInput.addEventListener('change', zipInputUpload);

// On the inital page load, update the keccak256 hashes with the input in the
// text area
hashInput();

/**
 * Converts tab key pressed event into a tab character in the text area instead
 * of tabbing through page elements
 * @param {Event} event User action event
 */
function convertTab(event) {

    // Only trigger for the tab key character event
    if (event !== undefined && event.key === 'Tab') {
        event.preventDefault();

        // Get the cursor selection positions
        const start = textAreaInputElement.selectionStart;
        const end = textAreaInputElement.selectionEnd;

        // Insert the tab character in place of the selection
        textAreaInputElement.value
            = textAreaInputElement.value.substring(0, start)
            + '\t'
            + textAreaInputElement.value.substring(end);

        // Move the cursor to the right position after the tab character
        textAreaInputElement.selectionStart
            = textAreaInputElement.selectionEnd = start + 1;

        // Update the keccak256 hashes
        hashInput();
    }
}

/**
 * Hashes the input bytes data and displays the first, second, and third hashes
 */
function hashInput() {

    // Get the text value of the input text area
    let inputValue = textAreaInputElement.value;
    
    // Calculate the bytes dependent on the input type
    let bytes;
    switch (dropdownElement.value.toLowerCase()) {

        // UTF-8 text encoding into bytes
        case "text":

            // Remove the error display
            addClass(hashErrorText, "hide");
            hashErrorText.textContent = "";

            // Encode the text into bytes using UTF-8
            const encoder = new TextEncoder();
            bytes = encoder.encode(inputValue);
            break;

        // Hex encoding of the bytes, with optional "0x" prefix
        case "hex":

            // If the hex value is valid, then calculate and display the
            // keccak256 hashes, otherwise display an error
            if (isValidHex(inputValue)) {

                // Remove the error display
                addClass(hashErrorText, "hide");
                hashErrorText.textContent = "";

                // Only collect the data not in any prefix
                if (inputValue.substring(0, 2) === "0x") {
                    inputValue = inputValue.slice(2);
                }

                // Obtain the byte data as hex
                if (inputValue.length === 0) {
                    bytes = Uint8Array.from([]);
                } else {
                    bytes = Uint8Array.from(
                        inputValue
                            .padStart(
                                inputValue.length + (inputValue.length % 2),
                                "0"
                            )
                            .match(/.{1,2}/g)
                            .map(b => parseInt(b, 16))
                    );
                }
            } else {

                // Display invalid hex error
                removeClass(hashErrorText, "hide");
                hashErrorText.textContent = "[X] ERROR: Invalid hex input";
            }
            break;
        default:
            break;
    }

    // Reset the display hashes to default and exit early
    if (bytes === undefined) {
        firstHashText.textContent = "-";
        secondHashText.textContent = "-";
        thirdHashText.textContent = "-";
        return;
    }

    // Display the keccak256 hash values
    const firstHash = ethers.keccak256(bytes);
    const secondHash = ethers.keccak256(firstHash);
    const thirdHash = ethers.keccak256(secondHash);
    firstHashText.textContent = firstHash;
    secondHashText.textContent = secondHash;
    thirdHashText.textContent = thirdHash;
}

/**
 * Determines whether the given input can be parsed as valid hex, it can have an
 * optional "0x" prefix that will be ignored from hex parsing
 * @param {String} textInput String input to determine whether it can be parsed
 * as valid hex
 * @returns {Boolean} Whether the textInput was able to be parsed as valid hex
 */
function isValidHex(textInput) {

    // Remove '0x' prefix if it exists
    if (textInput.substring(0, 2) === "0x") {
        textInput = textInput.slice(2);
    }
    
    // If the hex character filtered text equals the original text, then
    // the input is valid hex
    let filteredText = textInput;

    // Extract only valid hex characters
    const hexPattern = /^[0-9a-fA-F]*$/;
    filteredText = textInput
        .split("")
        .filter(char => hexPattern.test(char))
        .join("");
    return filteredText === textInput;
}

/**
 * Read the user zip file upload, display file name and hash
 * @param {Event} event Zip file upload event
 */
async function zipInputUpload(event) {

    // Reset display values
    fileUploadError.textContent = "";
    fileName.textContent = "-";
    fileHash.textContent = "-";

    // Validates zip file upload
    const inputFile = event.target.files[0];
    if (inputFile.type !== 'application/zip') {
        fileUploadError.textContent = "[X] ERROR: File uploaded is not a zip file";
        return;
    }

    // Read bytes of zip folder
    const reader = new FileReader();
    reader.readAsArrayBuffer(inputFile);

    // Display zip file name and hash
    reader.onload = async function (event) {
        const arrayBuffer = event.target.result;
        const fileBytes = new Uint8Array(arrayBuffer);
        const fileHashValue = ethers.keccak256(fileBytes).toString('hex');
        fileName.textContent = inputFile.name;
        fileHash.textContent = fileHashValue;
    };

    // Display error if problem reading zip file
    reader.onerror = function () {
        fileUploadError.textContent = "[X] ERROR: Problem reading zip file";
    };
}
