import { loadHeader } from "../utils/commonFunctions.js";

// Load the header button navigation functionality
loadHeader();

// Return to home button
document.getElementById('home-button').addEventListener("click", () => {
    window.location.href = '/index.html';
});