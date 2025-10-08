import {
    loadHeader
} from "../utils/commonFunctions.js";

// Page elements
const textArea = document.getElementById("right-column");

// Load the header button navigation functionality
loadHeader();

// Get the current html file name and adjecent folder
const folderSplits = window.location.pathname.split('/');
const folderName = folderSplits[folderSplits.length - 2];
const fileName = folderSplits[folderSplits.length - 1].split(".")[0];

// Retrieve the text data from 
let text = "";
try {
    const response = await fetch(
        `data/learningText/${folderName}/${fileName}.txt`
    );
    text = await response.text();
} catch (error) {
    text = "[X] Error: Text data retrieval failed ";
}

// Edit the text data so it can be displayed correctly in the div inner html
text = text
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, '<br>');

// Set the text area section with the text
textArea.innerHTML = text;
