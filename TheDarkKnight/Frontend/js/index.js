import { loadHeader } from "../utils/commonFunctions.js";

// Page element buttons
const profile = document.getElementById("profile-button");
const learn = document.getElementById("learn-button");
const tasks = document.getElementById("tasks-button");
const requirements = document.getElementById("requirements-button");
const requirementProposals
    = document.getElementById("requirement-proposals-button");
const ethicsRequirementsProposals
    = document.getElementById("ethics-requirements-proposals-button");
const users = document.getElementById("users-button");

// Load the header button navigation functionality
loadHeader();

// Buttons redirect to corresponding pages
profile.addEventListener("click", () => {
    window.location.href = 'pages/profile.html';
});
learn.addEventListener("click", () => {
    window.location.href = 'pages/learning/theory/freelanceSociety.html';
});
tasks.addEventListener("click", () => {
    window.location.href = 'pages/viewTasks.html';
});
requirements.addEventListener("click", () => {
    window.location.href = 'pages/requirements/viewRequirements.html';
});
requirementProposals.addEventListener("click", () => {
    window.location.href = 'pages/requirements/viewProposals.html';
});
ethicsRequirementsProposals.addEventListener("click", () => {
    window.location.href = 'pages/ethicsRequirements/ethicsRequirements.html';
});
users.addEventListener("click", () => {
    window.location.href = 'pages/users/viewUsers.html';
});

// Scroll through home page buttons
window.onload = function () {
    const scrollableContainer = document.querySelector('.scrollable-container');
    const scrollableArea = document.querySelector('.scrollable-area');
    const centerX = (
        scrollableArea.scrollWidth - scrollableContainer.clientWidth
    ) / 2;
    const centerY = (
        scrollableArea.scrollHeight - scrollableContainer.clientHeight
    ) / 2;
    scrollableContainer.scrollLeft = centerX;
    scrollableContainer.scrollTop = centerY;
};