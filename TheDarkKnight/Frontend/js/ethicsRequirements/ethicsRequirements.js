import { ethers } from "../libs/ethers.min.js";
import { loadHeader } from "../../utils/commonFunctions.js";
import { THE_LIST_CONTRACT_ADDRESS } from "../../utils/constants.js";

// Page elements
const ethicsRequirementsVersionText
    = document.getElementById("ethics-requirements-version");
const viewEthicsRequirementsButton
    = document.getElementById("view-ethics-requirements-button");
const addEthicsRequirementsButton
    = document.getElementById("add-ethics-requirements-button");
const ethicsRequirementsList
    = document.getElementById("ethics-requirements-list");

// Load the header button navigation functionality
loadHeader();

// Get The List contract
const theListContractAddress = THE_LIST_CONTRACT_ADDRESS;
const provider = new ethers.BrowserProvider(window.ethereum);
const theListAbi = await fetch('./data/abi/theListAbi.json');
const theListJson = await theListAbi.json();
const theListContract = new ethers.Contract(
    theListContractAddress,
    theListJson.abi,
    provider
);

// Update the display with the ethics requirements version when retrieved
theListContract.ethicsVersion().then((v) => {
    ethicsRequirementsVersionText.textContent
        = `Ethics Requirements Version: ${v}`;
});

// Update the display with the ethics requirements when retrieved
theListContract.getEthicsRequirements().then((l) => {
    let ethicsRequirementsListString = "";
    for (let i = 0; i < l.length; i++) {
        ethicsRequirementsListString += `${l[i]}\r\n\r\n`;
    }
    ethicsRequirementsList.textContent = ethicsRequirementsListString;
});

// Redirects to view ethics requirements proposals page
viewEthicsRequirementsButton.addEventListener("click", () => {
    window.location.href = 'pages/ethicsRequirements/viewEthicsRequirementsProposals.html';
});

// Redirects to add ethics requirements proposal page
addEthicsRequirementsButton.addEventListener("click", () => {
    window.location.href = 'pages/ethicsRequirements/addEthicsRequirementsProposal.html';
});
