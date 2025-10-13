import { ethers, keccak256, toUtf8Bytes, concat } from "../libs/ethers.min.js";
import "../libs/jszip.min.js";
import {
    loadHeader,
    replaceClass
} from "../../utils/commonFunctions.js";
import { THE_LIST_CONTRACT_ADDRESS, USERS_CONTRACT_ADDRESS } from "../../utils/constants.js";

// Page elements
const idText = document.getElementById("requirement-proposal-id");
const hashText = document.getElementById("proposal-hash");
const validatorText = document.getElementById("proposal-validator");
const votesForText = document.getElementById("proposal-votes-for");
const voteForButton = document.getElementById("vote-for-button");
const voteForError = document.getElementById("vote-for-error");
const viewProposalsButton = document.getElementById("view-proposals-button");
const viewEthicsButton = document.getElementById("view-ethics-button");
const proposeUpdateButton = document.getElementById("propose-update-button");
const ethicsRequirementsText = document.getElementById("ethics-requirements");
const saveLocallyButton = document.getElementById("save-locally-button");
const downloadRequirementAnchor
    = document.getElementById("download-requirement-anchor");

// Load the header button navigation functionality
loadHeader();

// Get users and The List contracts
const usersContractAddress = USERS_CONTRACT_ADDRESS;
const theListContractAddress = THE_LIST_CONTRACT_ADDRESS;
const provider = new ethers.BrowserProvider(window.ethereum);
const usersAbi = await fetch('./data/abi/usersAbi.json');
const theListAbi = await fetch('./data/abi/theListAbi.json');
const usersJson = await usersAbi.json();
const theListJson = await theListAbi.json();
const usersContract = new ethers.Contract(
    usersContractAddress,
    usersJson.abi,
    provider
);
const theListContract = new ethers.Contract(
    theListContractAddress,
    theListJson.abi,
    provider
);
const signer = await provider.getSigner();
const address = signer.address;
const signerTheListContract = new ethers.Contract(
    theListContractAddress,
    theListJson.abi,
    signer
);
const userActivated = await usersContract.activeUsers(address);

// Ethics requirements proposal variables
let validatorAddress;
let proposalHash;
let proposalVotesFor;
let didVote;
let requirementsArray;

// Update display with proposal
const url = new URL(window.location.href);
const params = Object.fromEntries(url.searchParams.entries());
const proposalIndex = Number(params.index) ?? "0";
idText.textContent = `Ethics Requirements Proposal Id: #${proposalIndex}`;

// Updates the display of the ethics requirements proposal
getProposalData().then((proposalData) => {

    // Validate ethics requirements proposal data response
    if (proposalData === null) {
        return;
    }

    // Update the ethics requirements proposal variables
    proposalHash = proposalData.proposalHash;
    validatorAddress = proposalData.validatorAddress;
    proposalVotesFor = proposalData.proposalVotesFor;
    didVote = proposalData.didVoteProposal;
    requirementsArray = proposalData.proposalEthicsRequirements;

    // Updates the ethics requirements proposal display
    if (!didVote) {
        replaceClass(
            voteForButton,
            "inactive-payable-button",
            "payable-button"
        );
    }
    hashText.textContent = `Proposal Hash:\r\n${proposalHash}`;
    validatorText.textContent
        = `Proposal Validator Address:\r\n${validatorAddress}`;
    votesForText.textContent = `Proposal Votes For: ${proposalVotesFor} `
        + `(${didVote ? "Already Voted" : "Not Yet Voted"})`;
    let ethicsRequirementsListString = "";
    for (let i = 0; i < proposalData.proposalEthicsRequirements.length; i++) {
        ethicsRequirementsListString
            += `${proposalData.proposalEthicsRequirements[i]}\r\n\r\n`;
    }
    ethicsRequirementsText.textContent = ethicsRequirementsListString;
});

// Redirects to view ethics requirements page
viewProposalsButton.addEventListener("click", () => {
    window.location.href = `pages/ethicsRequirements/viewEthicsRequirementsProposals.html`;
});

// Redirects to ethics requirements page
viewEthicsButton.addEventListener("click", () => {
    window.location.href = `pages/ethicsRequirements/ethicsRequirements.html`;
});

// Redirects to add ethics requirements proposal page
proposeUpdateButton.addEventListener("click", () => {
    window.location.href = `pages/ethicsRequirements/addEthicsRequirementsProposal.html`;
});

// Saves the ethics requirements proposal locally
saveLocallyButton.addEventListener("click", async () => {

    // Converts the ethics requirements data to a JSON file
    const requirementArray = Array.from(requirementsArray);
    const jsonObject = JSON.stringify(requirementArray, null, 2);
    const blob = new Blob([jsonObject], { type: 'text/plain' });

    // Downloads the JSON file
    const url = URL.createObjectURL(blob);
    downloadRequirementAnchor.href = url;
    downloadRequirementAnchor.download
        = `EthicsRequirements${proposalIndex}.json`;
    downloadRequirementAnchor.click();
    URL.revokeObjectURL(downloadRequirementAnchor.href);
});

// Votes for the current proposal if possible
voteForButton.addEventListener("click", voteFor);

/**
 * Gets the ethics requirements proposal data
 * @returns {Object} Ethics requirements proposal data
 * @returns {String} return.validatorAddress Address of the creator of the
 * ethics requirements proposal
 * @returns {String} return.proposalHash Hash of the ethics requirements data
 * @returns {Array<String>} return.proposalEthicsRequirements Data of the ethics
 * requirements proposal
 * @returns {Number} return.proposalVotesFor Total user votes for the ehtics
 * requirements proposal
 * @returns {Boolean} return.didVoteProposal Whether the current user voted for
 * the ethics requirements proposal
 */
async function getProposalData() {

    // Gets the ethics requirements proposal data and hash
    const proposalEthicsRequirements
        = await theListContract.getEthicsRequirementsProposal(proposalIndex);
    let proposalList = proposalEthicsRequirements
        .map((ethicsRequirement) => toUtf8Bytes(ethicsRequirement));
    proposalList = concat(proposalList);
    const proposalHash = keccak256(proposalList);

    // Gets other ethics requirements proposal data
    const proposalValidator
        = await theListContract.getEthicsRequirementsProposalAddress(
            proposalIndex
        );
    const proposalVotesFor
        = await theListContract.getEthicsRequirementsProposalVotesFor(
            proposalIndex
        );
    const didVote
        = await theListContract.getEthicsRequirementsProposalDidVote(
            proposalIndex, address
        );

    // Returns the retrieved results
    return {
        validatorAddress: proposalValidator,
        proposalHash: proposalHash,
        proposalEthicsRequirements: proposalEthicsRequirements,
        proposalVotesFor: proposalVotesFor,
        didVoteProposal: didVote
    };
}

/**
 * User votes for the ethics requirements proposal if possible and updates the
 * display
 */
async function voteFor() {

    // Validate user can vote for the ethics requirements proposal
    if (!userActivated) {
        voteForError.textContent = "(!) User inactivated";
        return;
    }
    if (didVote) {
        voteForError.textContent = `(!) Maximum 1 vote per user`;
        return;
    }

    // Connects to the user's wallet
    try {
        await provider.send("eth_requestAccounts", []);
    } catch {
        voteForError.textContent = "[X] ERROR: no wallet found";
    }

    // Tries to vote for the ethics requirements proposal through a transation
    // to the blockchain
    let transactionResponse;
    try {
        transactionResponse
            = await signerTheListContract.voteEthicsRequirementsUpdate(
                proposalIndex
            );
        didVote = true;
    } catch (error) {
        voteForError.textContent = `[X] ERROR: Problem occurred while voting`;
        return;
    }

    // Updates the ethics requirements vote data and display
    transactionResponse.wait().then(async () => {
        const newVotesFor
            = await theListContract.getEthicsRequirementsProposalVotesFor(
                proposalIndex
            );
        proposalVotesFor = newVotesFor;
        didVote = true;
        votesForText.textContent = `Proposal Votes For: ${proposalVotesFor} `
            + `(${didVote ? "Already Voted" : "Not Yet Voted"})`;
        replaceClass(
            voteForButton,
            "payable-button",
            "inactive-payable-button"
        );
    });
}
