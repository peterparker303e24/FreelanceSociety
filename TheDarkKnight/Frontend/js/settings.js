import { loadHeader } from "../utils/commonFunctions.js";

// Page elements
const toggleButton = document.getElementById("toggle-button");
const modeButton = document.getElementById("mode-button");
const modeButtonSvg = document.getElementById("mode-button-svg");
const modeButtonText = document.getElementById("mode-icon-text");

// Load the header button navigation functionality
loadHeader();

// Get dark mode preference from local storage
const darkMode = localStorage.getItem("darkMode");

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

// Dark/light mode icon button toggles between dark and light theme
toggleButton.addEventListener("click", changeVariableAndIcon);

// Dark/light mode button toggles between dark and light theme
modeButton.addEventListener("click", changeVariableAndIcon);

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