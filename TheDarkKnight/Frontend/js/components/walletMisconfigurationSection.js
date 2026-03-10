import { ethers } from "../libs/ethers.min.js";
import {
    CONTRACT_DATA_CHAIN_ID,
    CHAIN_NAME,
    USERS_CONTRACT_ADDRESS_LOCALHOST,
    THE_LIST_CONTRACT_MINIMUM_BLOCK_LOCALHOST,
    HASH_TASK_CONTRACT_ADDRESS_LOCALHOST,
    THE_LIST_CONTRACT_ADDRESS_LOCALHOST,
    DOUBLE_HASH_TASK_CONTRACT_ADDRESS_LOCALHOST,
    VALIDATOR_TASK_CONTRACT_ADDRESS_LOCALHOST,
    USERS_CONTRACT_MINIMUM_BLOCK_LOCALHOST,
    HASH_TASK_CONTRACT_MINIMUM_BLOCK_LOCALHOST,
    DOUBLE_HASH_TASK_CONTRACT_MINIMUM_BLOCK_LOCALHOST,
    VALIDATOR_TASK_CONTRACT_MINIMUM_BLOCK_LOCALHOST,
    CONTRACT_DATA_CHAIN_ID_LOCALHOST,
    CHAIN_NAME_LOCALHOST,
    USERS_CONTRACT_ADDRESS_DEFAULT,
    THE_LIST_CONTRACT_ADDRESS_DEFAULT,
    HASH_TASK_CONTRACT_ADDRESS_DEFAULT,
    DOUBLE_HASH_TASK_CONTRACT_ADDRESS_DEFAULT,
    VALIDATOR_TASK_CONTRACT_ADDRESS_DEFAULT,
    USERS_CONTRACT_MINIMUM_BLOCK_DEFAULT,
    THE_LIST_CONTRACT_MINIMUM_BLOCK_DEFAULT,
    HASH_TASK_CONTRACT_MINIMUM_BLOCK_DEFAULT,
    DOUBLE_HASH_TASK_CONTRACT_MINIMUM_BLOCK_DEFAULT,
    VALIDATOR_TASK_CONTRACT_MINIMUM_BLOCK_DEFAULT,
    CONTRACT_DATA_CHAIN_ID_DEFAULT,
    CHAIN_NAME_DEFAULT
} from "../../utils/constants.js";
import { removeClass } from "../../utils/commonFunctions.js";

/**
 * Reusable wallet network misconfiguration section component
 */
class WalletMisconfigurationSection extends HTMLElement {
    constructor() {
        super();

        // Attatch shadow DOM 
        this.attachShadow({ mode: "open" });

        // Define the component html and css
        this.shadowRoot.innerHTML = `
            <link rel="stylesheet" href="./global.css">
            <div id="wallet-misconfiguration-panel" class="bordered-box medium-margin hide">
                <div class="large-text medium-padding">(!) Wallet And Website Network Misconfiguration</div>
                <div class="left-align medium-padding">
                    <div>Wallet Configurations</div>
                    <div id="wallet-network-name">&nbsp;&nbsp;&nbsp;&nbsp;Network Name:&nbsp;<div id="wallet-network-name-value">-</div></div>
                    <div id="wallet-network-chain-id">&nbsp;&nbsp;&nbsp;&nbsp;Network Chain ID:&nbsp;<div id="wallet-network-chain-id-value">-</div></div>
                    <div>Website Settings</div>
                    <div id="website-network-name">&nbsp;&nbsp;&nbsp;&nbsp;Network Name:&nbsp;<div id="website-network-name-value">-</div></div>
                    <div id="website-network-chain-id">&nbsp;&nbsp;&nbsp;&nbsp;Network Chain ID:&nbsp;<div id="website-network-chain-id-value">-</div></div>
                    <br>
                    <div>- To change the wallet network settings, open your wallet extension, select the website connection button at the top with the Freelance Society website icon, select the currently connected network name, then select the desired network from your list of networks.</div>
                    <br>
                    <div>- To change the website network settings, click one of the buttons below. Or navigate to the "Settings" page and paste custom JSON into the "Blockchain Data" text area.</div>
                    <div class="row">
                        <div id="reset-blockchain-data-localhost" class="border-button medium-margin medium-padding">Reset To localhost Website Blockchain Data</div>
                        <div id="reset-blockchain-data-default" class="border-button medium-margin medium-padding">Reset To ${CHAIN_NAME_DEFAULT} Website Blockchain Data</div>
                    </div>
                </div>
            </div>
            <div id="wallet-missing-panel" class="bordered-box medium-margin hide">
                <div class="large-text medium-padding">(!) Wallet Not Connected</div>
                <div class="left-align medium-padding">
                    <div>Ethereum wallet not detected. Check that the wallet extension is installed and enabled.</div>
                </div>
            </div>
        `;

        // Get the wallet provider, and display the wallet missing panel if it
        // fails
        let provider;
        if (window.ethereum) {
            provider = new ethers.BrowserProvider(window.ethereum);
        } else {
            const walletMissingContainer = this.shadowRoot
                .getElementById("wallet-missing-panel");
            removeClass(walletMissingContainer, "hide");
            return;
        }

        // Get the wallet and website blockchain configurations and display the
        // wallet misconfiguration panel if they differ
        this.GetNetworksData(provider).then((networksData) => {

            // If the network IDs match, there is no misconfiguration
            if (networksData.walletChainId === networksData.websiteChainId) {
                return;
            }

            // Update the panel display to show and set the different data for
            // each network
            const walletChainNameElement
                = this.shadowRoot
                    .getElementById("wallet-network-name-value");
            walletChainNameElement.textContent = networksData.walletChainName;
            const walletChainIdElement
                = this.shadowRoot
                    .getElementById("wallet-network-chain-id-value");
            walletChainIdElement.textContent = networksData.walletChainId;
            const websiteChainNameElement
                = this.shadowRoot
                    .getElementById("website-network-name-value");
            websiteChainNameElement.textContent = networksData.websiteChainName;
            const websiteChainIdElement
                = this.shadowRoot
                    .getElementById("website-network-chain-id-value");
            websiteChainIdElement.textContent = networksData.websiteChainId;
            const walletMisconfigurationContainer
                = this.shadowRoot
                    .getElementById("wallet-misconfiguration-panel");
            removeClass(walletMisconfigurationContainer, "hide")
            
            // Configure the reset blockchain data localhost network button
            this.shadowRoot
                .getElementById("reset-blockchain-data-localhost")
                .addEventListener("click", () => {
                    localStorage.setItem("blockchainData", JSON.stringify({
                        usersContractAddress:
                            USERS_CONTRACT_ADDRESS_LOCALHOST,
                        theListContractAddress:
                            THE_LIST_CONTRACT_ADDRESS_LOCALHOST,
                        hashTaskContractAddress:
                            HASH_TASK_CONTRACT_ADDRESS_LOCALHOST,
                        doubleHashTaskContractAddress:
                            DOUBLE_HASH_TASK_CONTRACT_ADDRESS_LOCALHOST,
                        validatorTaskContractAddress:
                            VALIDATOR_TASK_CONTRACT_ADDRESS_LOCALHOST,
                        usersContractMinimumBlock:
                            USERS_CONTRACT_MINIMUM_BLOCK_LOCALHOST,
                        theListContractMinimumBlock:
                            THE_LIST_CONTRACT_MINIMUM_BLOCK_LOCALHOST,
                        hashTaskContractMinimumBlock:
                            HASH_TASK_CONTRACT_MINIMUM_BLOCK_LOCALHOST,
                        doubleHashTaskContractMinimumBlock:
                            DOUBLE_HASH_TASK_CONTRACT_MINIMUM_BLOCK_LOCALHOST,
                        validatorTaskContractMinimumBlock:
                            VALIDATOR_TASK_CONTRACT_MINIMUM_BLOCK_LOCALHOST,
                        contractDataChainId:
                            CONTRACT_DATA_CHAIN_ID_LOCALHOST,
                        chainName:
                            CHAIN_NAME_LOCALHOST
                    }));
                    window.location.reload();
                });
            
            // Configure the reset blockchain data default network button
            this.shadowRoot
                .getElementById("reset-blockchain-data-default")
                .addEventListener("click", () => {
                    localStorage.setItem("blockchainData", JSON.stringify({
                        usersContractAddress:
                            USERS_CONTRACT_ADDRESS_DEFAULT,
                        theListContractAddress:
                            THE_LIST_CONTRACT_ADDRESS_DEFAULT,
                        hashTaskContractAddress:
                            HASH_TASK_CONTRACT_ADDRESS_DEFAULT,
                        doubleHashTaskContractAddress:
                            DOUBLE_HASH_TASK_CONTRACT_ADDRESS_DEFAULT,
                        validatorTaskContractAddress:
                            VALIDATOR_TASK_CONTRACT_ADDRESS_DEFAULT,
                        usersContractMinimumBlock:
                            USERS_CONTRACT_MINIMUM_BLOCK_DEFAULT,
                        theListContractMinimumBlock:
                            THE_LIST_CONTRACT_MINIMUM_BLOCK_DEFAULT,
                        hashTaskContractMinimumBlock:
                            HASH_TASK_CONTRACT_MINIMUM_BLOCK_DEFAULT,
                        doubleHashTaskContractMinimumBlock:
                            DOUBLE_HASH_TASK_CONTRACT_MINIMUM_BLOCK_DEFAULT,
                        validatorTaskContractMinimumBlock:
                            VALIDATOR_TASK_CONTRACT_MINIMUM_BLOCK_DEFAULT,
                        contractDataChainId:
                            CONTRACT_DATA_CHAIN_ID_DEFAULT,
                        chainName:
                            CHAIN_NAME_DEFAULT
                    }));
                    window.location.reload();
                });
        });
    }

    /**
     * Gets the network chain names and IDs of the network configured in the
     * wallet and configured in the website, and defaults the localhost Hardhat
     * network name to "localhost hardhat node"
     * @param {Provider} provider Ethereum wallet provider
     * @returns {String} return.walletChainName Name of the chain configured in
     * the wallet provider
     * @returns {Number} return.walletChainId Chain ID of the chain configured
     * in the wallet provider
     * @returns {String} return.walletChainName Name of the chain configured in
     * the website settings
     * @returns {Number} return.walletChainId Chain ID of the chain configured
     * in the website settings
     */
    async GetNetworksData(provider) {
        const walletNetworkData = await provider.getNetwork();

        // Rename localhost chain ID to hardhat blockchain, otherwise use the
        // provider given name
        let walletNetworkChainName;
        if (
            Number(walletNetworkData.chainId)
            === CONTRACT_DATA_CHAIN_ID_LOCALHOST
        ) {
            walletNetworkChainName = CHAIN_NAME_LOCALHOST;
        } else {
            walletNetworkChainName = walletNetworkData.name;
        }
        return {
            walletChainName: walletNetworkChainName,
            walletChainId: Number(walletNetworkData.chainId),
            websiteChainName: CHAIN_NAME,
            websiteChainId: Number(CONTRACT_DATA_CHAIN_ID)
        }
    }
}

// Define the wallet misconfiguration section component
customElements.define(
    "wallet-misconfiguration-section",
    WalletMisconfigurationSection
);
