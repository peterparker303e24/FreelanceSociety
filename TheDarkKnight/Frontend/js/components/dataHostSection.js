import {
    addClass,
    prefixHexBytes,
    removeClass,
    replaceClass,
    tryDownloadDataFromUrlsParallel,
    urlNoTrailingSlash
} from "../../utils/commonFunctions.js";
import { ethers } from "../libs/ethers.min.js";
import { USERS_CONTRACT_ADDRESS } from "../../utils/constants.js";

/**
 * Reusable section to display detected user hosts, display data retrieval
 * endpoints, connect the user, and refetch endpoint data
 */
export class DataHostSection extends HTMLElement {

    /**
     * @type {ShadowRoot | null} Shadow root element for this component
     */
    #shadowRootElement = null;

    /**
     * @type {Boolean | null} Whether there are connected hosts to be able to
     * fetch endpoints from
     */
    #fetchActive = false;
    
    /**
     * @type {Set<String> | null} Set of user URL host base endpoints
     */
    #hosts = null;
    
    /**
     * @type {String | null} Path from base to hash (no trailing or preceding /)
     */
    #filePath = null;
    
    /**
     * @type {String | null} File path hash (no preceding "0x" and no trailing
     * or preceding /)
     */
    #fileHash = null;
    
    /**
     * @type {String | null} Name of the file and extension (no preceding /)
     */
    #fileName = null;
    
    /**
     * @type {Provider | null} Ethereum wallet network provider
     */
    #provider = null;
    
    /**
     * @type {String | null} Ethereum address of the active user (with preceding
     * "0x")
     */
    #userAddress = null;
    
    /**
     * @type {Contract | null} Ethereum users contract
     */
    #usersContract = null;
    
    /**
     * @type {Set<Function>} Set of subscribers to be notified when data has
     * been fetched matching the hash
     */
    #subscribers = new Set();
    
    /**
     * @type {HTMLElement | null} Button for the user to actively fetch data
     * from the user host endpoints
     */
    #fetchDataButton = null;
    
    /**
     * @type {HTMLElement | null} Text to display user base host URL
     */
    #userUrlLinks = null;
    
    /**
     * @type {HTMLElement | null} Text to display user host endpoints
     */
    #userUrlHostingLinks = null;

    /**
     * @type {HTMLElement | null} Text to display when user has no detected
     * links
     */
    #noUserUrlLinks = null;
    
    /**
     * @type {HTMLElement | null} Button link to user profile page
     */
    #editProfileLinksButton = null;
    
    /**
     * @type {HTMLElement | null} Button for the user to connect the website
     * their wallet browser extension and user
     */
    #connectWalletButton = null;
    
    /**
     * @type {HTMLElement | null} Error text for wallet connection issues
     */
    #connectWalletError = null;
    
    /**
     * @type {HTMLElement | null} Text to display file fetch loading, success,
     * or failure
     */
    #fileHostingText = null;
    
    /**
     * @type {HTMLElement | null} Error text for data fetching
     */
    #fileHostingError = null;

    /**
     * @typedef {Object} DataFound Data found bytes and keccak256 hash
     * @property {Uint8Array} data Data bytes
     * @property {String} hash Keccak256 hash of the data bytes with preceding
     * "0x"
     */
    
    /**
     * Initialize component shadow root HTML and set class variables for HTML
     * elements
     */
    constructor() {
        super();
        this.#shadowRootElement = this.attachShadow({ mode: "open" });
        this.#shadowRootElement.innerHTML = `
            <link rel="stylesheet" href="./global.css">
            <div class="file-hosting-section left-align medium-padding">

                <!-- Detected URL endpoints from user links data -->
                <div class="hosting-instructions">Host your file data at one of your hosted endpoints.</div>

                <div class="connect-wallet-button border-button xx-large-width medium-padding medium-margin-vertical hide">Connect Ethereum Wallet</div>
                <div class="connect-wallet-error medium-margin-vertical hide"></div>

                <div class="hosting-endpoints-description">Your user detected URL endpoint links:</div>
                <div class="user-url-links large-margin text-content-return">-</div>
                
                <!-- Display message when user has no valid URL endpoint links -->
                <div class="no-url-links-text large-margin hide">No URL links detected. Add a publicly available URL base path to the comma separated <b>Links</b> data for your user. This public URL base path should be a folder where you can control the editing of folders and files.</div>
                <a class="edit-profile-links-button border-button redirectable medium-text medium-padding large-margin xx-large-width hide" href="./pages/profile.html">Edit User Links</a>
                
                <!-- Detect file data hosting status with user links and file hash -->
                <div class="host-urls-text">Host the file data at one of these URLs:</div>
                <div class="user-url-hosting-links large-margin text-content-return">-/-/-/-</div>

                <!-- Refetch file data hosting and display success status and any failures -->
                <div class="hosting-status-text">File Hosting Status: -</div>
                <br>
                <div class="fetch-file-hosting-status inactive-border-button medium-text medium-padding xx-large-width">Fetch Status</div>
                <br>
                <div class="file-hosting-error text-content-return medium-margin-bottom"></div>
            </div>
        `;
        this.#fetchDataButton = this.#shadowRootElement.querySelector(
            ".fetch-file-hosting-status"
        );
        this.#userUrlLinks = this.#shadowRootElement.querySelector(
            ".user-url-links"
        );
        this.#userUrlHostingLinks = this.#shadowRootElement.querySelector(
            ".user-url-hosting-links"
        );
        this.#noUserUrlLinks = this.#shadowRootElement.querySelector(
            ".no-url-links-text"
        );
        this.#editProfileLinksButton = this.#shadowRootElement.querySelector(
            ".edit-profile-links-button"
        );
        this.#connectWalletButton = this.#shadowRootElement.querySelector(
            ".connect-wallet-button"
        );
        this.#connectWalletError = this.#shadowRootElement.querySelector(
            ".connect-wallet-error"
        );
        this.#fileHostingText = this.#shadowRootElement.querySelector(
            ".hosting-status-text"
        );
        this.#fileHostingError = this.#shadowRootElement.querySelector(
            ".file-hosting-error"
        );
    }
    
    /**
     * This lifecycle method is called when the element is inserted into the
     * DOM. Bind button event listeners to the button functions.
     */
    connectedCallback() {
        this.#fetchDataButton.addEventListener(
            "click",
            this.#fetchStatus.bind(this)
        );
        this.#connectWalletButton.addEventListener(
            "click",
            this.#connectWallet.bind(this)
        );
    }

    /**
     * Fetch the user URL host links from the blockchain
     */
    async #fetchUserLinks() {

        // Validate the dependencies are ready
        if (this.#userAddress === null
            || (this.#provider === null && this.#usersContract === null)
        ) {
            return;
        }

        // Contruct the users contract if it does not already exist
        if (this.#usersContract === null) {
            const usersContractAddress = USERS_CONTRACT_ADDRESS;
            const usersAbi = await fetch('./data/abi/usersAbi.json');
            const usersJson = await usersAbi.json();
            this.#usersContract = new ethers.Contract(
                usersContractAddress,
                usersJson.abi,
                this.#provider
            );
        }

        // Get the user links from the blockchain
        let userLinks;
        try {
            userLinks = await this.#usersContract.links(this.#userAddress);
        } catch (error) {
            this.#fileHostingError.textContent
                = `[X] ERROR: Failed to fetch user links - ${error}`;
            return;
        }

        // Parse the valid URL hosts from the user links
        this.#hosts = new Set();
        try {
            const linksSplit = userLinks.split(",");
            for (const link of linksSplit) {
                try {
                    const nextUrl = urlNoTrailingSlash(new URL(link));
                    this.#hosts.add(nextUrl);
                } catch {
                    continue;
                }
            }
        } catch (error) {
            this.#fileHostingError.textContent
                = `[X] ERROR: Failed to parse user links - ${error}`;
            return;
        }

        // Update fetch data variables and display
        this.#fetchActive = true;
        this.#updateUserUrlLinks();
        this.#fetchStatus();
    }

    /**
     * Fetch the data from all user hosted endpoints, display success or
     * failure, and notify subscribers of data
     */
    async #fetchStatus() {

        // Reset fetch status display
        replaceClass(
            this.#fetchDataButton,
            "border-button",
            "inactive-border-button"
        );
        this.#fileHostingError.textContent = "";

        // Validate all hosting data dependencies
        if (!this.#fetchActive
            || this.#hosts === null
            || this.#hosts.size === 0
            || this.#filePath === null
            || this.#fileHash === null
            || this.#fileName === null
        ) {
            this.#fileHostingError.textContent
                = `(!) Missing endpoint information`;
            return;
        }

        // Set file fetch loading display
        this.#fetchDataButton.textContent = "Fetching Status...";
        this.#fileHostingText.textContent = "File Hosting Status: -";

        // Try to fetch the data from each user hosted endpoint, if any endpoint
        // finds the data then terminate other fetches, if any endpoint fails
        // then log a warning in the error text and if all data fetches fail
        // then log the fetch error
        let arrayBuffer
        let bytes;
        const FETCH_DELAY_MS = 200;
        try {
            arrayBuffer = await tryDownloadDataFromUrlsParallel(
                this.#getEndpoints(),
                this.#fileHash,
                this.#fileHostingError
            );
            bytes = new Uint8Array(arrayBuffer);
        } catch (error) {

            // Set minimum load time so user knows the fetching process occured
            // for failed fetch
            setTimeout(() => {
                replaceClass(
                    this.#fetchDataButton,
                    "inactive-border-button",
                    "border-button"
                );
                this.#fileHostingText.textContent
                    = "File Hosting Status: FAILURE";
                this.#fetchDataButton.textContent = "Fetch Status";
            }, FETCH_DELAY_MS);
            return;
        }

        // Notify subscribers of when fetched data is found
        this.#notifyDataFound({
            data: bytes,
            hash: this.#fileHash
        });

        // Set minimum load time so user knows the fetching process occured for
        // successful fetch
        setTimeout(() => {
            this.#fileHostingText.textContent = "File Hosting Status: SUCCESS";
            this.#fetchDataButton.textContent = "Fetch Status";
            replaceClass(
                this.#fetchDataButton,
                "inactive-border-button",
                "border-button"
            );
        }, FETCH_DELAY_MS);
    }

    /**
     * Connect the users wallet to the website
     */
    async #connectWallet() {

        // Validate the wallet provider exists
        if (this.#provider === undefined || this.#provider === null) {
            return;
        }

        // Try to connect to the browser wallet and display any error
        try {
            this.#userAddress = (await this.#provider.getSigner()).address;
        } catch (error) {
            this.#connectWalletError.textContent
                = `[X] ERROR: Failed to connect wallet - ${error}`;
            return;
        }
        
        // Update display and fetch user links data on wallet connection success
        addClass(this.#connectWalletButton, "hide");
        addClass(this.#connectWalletError, "hide");
        this.#fetchUserLinks();
    }

    /**
     * Gets the list of full or partial user hosted endpoint strings
     * @returns {Array<String>} List of full or partial user hosted endpoint
     * strings
     */
    #getEndpoints() {
        if (this.#hosts === null) {
            return [
                `-/${this.#filePath ?? "-"}/`
                    + `${this.#fileHash?.substring(2) ?? "-"}`
                    + `/${this.#fileName ?? "-"}`
            ];
        } else {
            return Array.from(this.#hosts, (host) =>  
                `${host}/${this.#filePath ?? "-"}/`
                    + `${this.#fileHash?.substring(2) ?? "-"}`
                    + `/${this.#fileName ?? "-"}`
            );
        }
    }

    /**
     * Sets the user host base URL, updates the display, and refetches user
     * links
     * @param {Array<String>} hosts User host base URL
     * @returns {DataHostSection} Returns this data host section object for
     * builder pattern
     */
    setHosts(hosts) {
        this.#hosts = new Set(hosts);
        this.#updateUserUrlLinks();
        this.#fetchUserLinks();
        return this;
    }

    /**
     * Sets the Path from base to hash (no trailing or preceding /), updates the
     * display, and refetches user links
     * @param {String} filePath Path from base to hash (no trailing or
     * preceding /)
     * @returns {DataHostSection} Returns this data host section object for
     * builder pattern
     */
    setFilePath(filePath) {
        this.#filePath = filePath;
        this.#updateUserUrlLinks();
        this.#fetchUserLinks();
        return this;
    }

    /**
     * Sets the file path hash (no preceding "0x" and no trailing or preceding
     * /), updates the display, and refetches user links
     * @param {String} fileHash File path hash (no preceding "0x" and no
     * trailing or preceding /)
     * @returns {DataHostSection} Returns this data host section object for
     * builder pattern
     */
    setFileHash(fileHash) {
        this.#fileHash = prefixHexBytes(fileHash);
        this.#updateUserUrlLinks();
        this.#fetchUserLinks();
        return this;
    }

    /**
     * Sets the name of the file and extension (no preceding /), updates the
     * display, and refetches user links
     * @param {String} fileName Name of the file and extension (no preceding /)
     * @returns {DataHostSection} Returns this data host section object for
     * builder pattern
     */
    setFileName(fileName) {
        this.#fileName = fileName;
        this.#updateUserUrlLinks();
        this.#fetchUserLinks();
        return this;
    }

    /**
     * Sets the Ethereum wallet network provider and refetches user links
     * @param {Provider} provider Ethereum wallet network provider
     * @returns {DataHostSection} Returns this data host section object for
     * builder pattern
     */
    setProvider(provider) {
        this.#provider = provider;
        this.#fetchUserLinks();
        return this;
    }

    /**
     * Sets the Ethereum users contract and refetches user links
     * @param {Contract} usersContract Ethereum users contract
     * @returns {DataHostSection} Returns this data host section object for
     * builder pattern
     */
    setUsersContract(usersContract) {
        this.#usersContract = usersContract;
        this.#fetchUserLinks();
        return this;
    }

    /**
     * Adds the given function to the data found subscribers set
     * @param {Function} dataFoundCallback Callback function notified when data
     * has been fetched matching the hash
     * @returns {DataHostSection} Returns this data host section object for
     * builder pattern
     */
    subscribeToDataFound(dataFoundCallback) {
        this.#subscribers.add(dataFoundCallback);
        return this;
    }

    /**
     * Unsubscribes the given function from the data found notification
     * @param {Function} dataFoundCallback Function to delete from set of
     * subscribers
     * @returns {DataHostSection} Returns this data host section object for
     * builder pattern
     */
    unsubscribeToDataFound(dataFoundCallback) {
        this.#subscribers.delete(dataFoundCallback);
    }

    /**
     * Notifies all subscribers with the data found
     * @param {DataFound} dataObject Data found to pass on to each subscriber
     */
    #notifyDataFound(dataObject) {
        for (const callback of this.#subscribers) {
            callback(dataObject);
        }
    }

    /**
     * Initializes the data host section display and functionality
     */
    init() {
        if (window.ethereum !== undefined
            && window.ethereum.selectedAddress !== null
        ) {
            this.#userAddress = window.ethereum.selectedAddress;
            this.#fetchUserLinks();
        } else {
            removeClass(this.#connectWalletButton, "hide");
            removeClass(this.#connectWalletError, "hide");
        }
    }

    /**
     * Updates the display for the user hosted base URL links and user hosted
     * endpoint ULR links
     */
    #updateUserUrlLinks() {
        let linksText = "";
        let hostingLinks = "";

        // If there are no links, then show the no user links message and set
        // the text element links data to default text
        if (this.#hosts === null || this.#hosts.size == 0) {
            removeClass(this.#noUserUrlLinks, "hide");
            removeClass(this.#editProfileLinksButton, "hide");
            this.#userUrlLinks.textContent = "-";
            this.#userUrlHostingLinks.textContent = this.#getEndpoints()[0];
            return;
        } 
        
        // Hide the no links message if there are any hosts
        addClass(this.#noUserUrlLinks, "hide");
        addClass(this.#editProfileLinksButton, "hide");
        

        // Show a line for each link
        linksText = Array.from(this.#hosts).join("\n\n");
        hostingLinks = this.#getEndpoints().join("\n\n");

        // Update the text elements with the links data
        this.#userUrlLinks.textContent = linksText;
        this.#userUrlHostingLinks.textContent = hostingLinks;
    }
}

// Define the data host section component
customElements.define("data-host-section", DataHostSection);
