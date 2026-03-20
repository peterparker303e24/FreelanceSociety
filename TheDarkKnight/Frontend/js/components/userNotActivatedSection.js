import { ethers } from "../libs/ethers.min.js";
import { USERS_CONTRACT_ADDRESS } from "../../utils/constants.js";
import { wait } from "../../utils/commonFunctions.js";

const ATTEMPTS_UNTIL_FAILURE = 3;

/**
 * Reusable wallet network misconfiguration section component
 */
class UserNotActivatedSection extends HTMLElement {
    constructor() {
        super();

        // Update the display on page load and when the account changes
        window.ethereum.on('accountsChanged', () => {
            this.UpdateDisplayFromActivationStatus();
        });
        this.attachShadow({ mode: "open" });
        this.UpdateDisplayFromActivationStatus();
    }

    /**
     * Update the component display to show or hide using account activation
     * status
     */
    async UpdateDisplayFromActivationStatus() {

        // Wait for wallet extension to load selected address if it is null, and
        // exit early on failure
        for (let i = 0; i < ATTEMPTS_UNTIL_FAILURE; i++) {
            if (window.ethereum.selectedAddress !== null) {
                break;
            } else {
                await wait(1000);
            }
            if (i === ATTEMPTS_UNTIL_FAILURE - 1) {
                return;
            }
        }

        // Try to get the current user's activation status
        this.GetUserActivationStatus().then((activationStatusIndex) => {

            // Set the activation status to the enum value
            let activationStatus;
            switch (Number(activationStatusIndex)) {
                case 0:
                    activationStatus = "UNACTIVATED";
                    break;
                case 1:
                    activationStatus = "ACTIVATED";
                    break;
                case 2:
                    activationStatus = "DEACTIVATED";
                    break;
                default:
                    return;
            }

            // Do not show the section if data cannot be retrieved
            if (activationStatus === null) {
                return;
            }

            // Attatch shadow DOM for appropriate non-activated status type
            this.shadowRoot.innerHTML = "";
            if (activationStatus === "DEACTIVATED") {
                this.shadowRoot.innerHTML = `
                    <link rel="stylesheet" href="./global.css">
                    <div class="bordered-box medium-margin medium-padding">
                        <div class="large-text medium-margin">(!) Current Account Is Deactivated</div>
                        <div class="medium-text medium-margin  left-align">User Address: ${window.ethereum.selectedAddress}</div>
                        <div class="medium-text medium-margin left-align">This user can no longer contribute content to Freelance Society.</div>
                    </div>
                `;
            } else if (activationStatus === "UNACTIVATED") {
                this.shadowRoot.innerHTML = `
                    <link rel="stylesheet" href="./global.css">
                    <div class="bordered-box medium-margin left-align">
                        <div class="large-text medium-margin">(!) Current User Is Not Activated</div>
                        <div class="medium-text medium-margin left-align">User Address: ${window.ethereum.selectedAddress}</div>
                        <div class="medium-text medium-margin">You cannot contribute new tasks, requirements, voting, or submissions to Freelance Society until user is activated.</div>
                        <a class="border-button redirectable medium-padding medium-margin x-large-width" href="./pages/profile.html">Activate User</a>
                    </div>
                `;
            }
        });
    }

    /**
     * Get the current user activation status from the blockchain of the current
     * account in the wallet extension
     * @returns { 'UNACTIVATED' | 'ACTIVATED' | 'DEACTIVATED' | null} Activation
     * status from the current account in the wallet extension
     */
    async GetUserActivationStatus() {

        // Validate wallet extension
        if (!window.ethereum) {
            return null;
        }

        // Try to retrieve the user activation status from the blockchain using
        // the current account in the wallet extension
        try {
            const usersAbi = await fetch('./data/abi/usersAbi.json');
            const usersJson = await usersAbi.json();
            const provider = new ethers.BrowserProvider(window.ethereum);
            const usersContract = new ethers.Contract(
                USERS_CONTRACT_ADDRESS,
                usersJson.abi,
                provider
            );
            return await usersContract.activationStatus(
                window.ethereum.selectedAddress
            );
        } catch (error) {
            return null;
        }
    }
}

// Define the user not activated section component
customElements.define(
    "user-not-activated-section",
    UserNotActivatedSection
);
