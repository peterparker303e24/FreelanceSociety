import { addClass, removeClass, replaceClass } from "../../utils/commonFunctions.js";

/**
 * Reusable discover section component to show and hide the manual and auto
 * discover sections, handle button and input click events, and handle error
 * text
 */
export class DiscoverSection extends HTMLElement {
    constructor() {
        super();

        // Define the component html and css
        this.attachShadow({ mode: "open" });
        this.shadowRoot.innerHTML = `
            <link rel="stylesheet" href="./global.css">
            <div class="discover">

                <!-- Discover type section -->
                <div class="discover__row row space-around medium-padding-vertical">
                    <div class="discover__auto-discover-button border-button xx-large-width medium-padding">Auto Discover Task</div>
                    <div class="discover__manual-discover-button border-button xx-large-width medium-padding">Manually Discover Task</div>
                </div>

                <!-- Auto discover section -->
                <div class="discover__auto hide">

                    <!-- Try download from user link button -->
                    <div class="discover__auto__try-download-button border-button medium-padding medium-margin-vertical left-align left-justify text-content-return wrap-text">Try Download From: -</div>
                    <div class="discover__auto__download-error text-content-return wrap-text left-align"></div>

                    <!-- Skip user/link buttons -->
                    <div class="discover__auto__skip-section two-column-grid">
                        <div class="discover__auto__skip-address-button inactive-border-button medium-padding medium-margin-vertical medium-margin-right">Skip Address</div>
                        <div class="discover__auto__skip-link-button inactive-border-button medium-padding medium-margin-vertical medium-margin-left">Skip Link</div>
                    </div>
                </div>

                <!-- Manual discover section -->
                <div class="discover__manual hide">
                    <div class="discover__manual__search-row row-left vertically-center-row">

                        <!-- User search input section -->
                        <div class="discover__manual__search-text medium-text medium-padding-vertical">Download From User: </div>
                        <input class="discover__manual__user-search-box input-line address-input-width medium-text left-align medium-margin" type="text" placeholder="Search User Address">
                    </div>
                    <div class="discover__manual__search-error text-content-return wrap-text left-align"></div>
                </div>
            </div>
        `;

        // Save elements as class variables
        this.autoDiscoverButton = this.shadowRoot.querySelector(
            ".discover__auto-discover-button"
        );
        this.manualDiscoverButton = this.shadowRoot.querySelector(
            ".discover__manual-discover-button"
        );
        this.autoDiscoverSection = this.shadowRoot.querySelector(
            ".discover__auto"
        );
        this.manualDiscoverSection = this.shadowRoot.querySelector(
            ".discover__manual"
        );
        this.tryDownloadButton = this.shadowRoot.querySelector(
            ".discover__auto__try-download-button"
        );
        this.tryDownloadError = this.shadowRoot.querySelector(
            ".discover__auto__download-error"
        );
        this.skipAddress = this.shadowRoot.querySelector(
            ".discover__auto__skip-address-button"
        );
        this.skipLink = this.shadowRoot.querySelector(
            ".discover__auto__skip-link-button"
        );
        this.userSearch = this.shadowRoot.querySelector(
            ".discover__manual__user-search-box"
        );
        this.manualSearchError = this.shadowRoot.querySelector(
            ".discover__manual__search-error"
        );

        // Instantiate function variable for when auto discover section button
        // clicked
        this.startAutoDiscover;
    }
    
    /**
     * This lifecycle method is called when the element is inserted into the
     * DOM, bind the show section button functions for when each button is
     * clicked
     */
    connectedCallback() {
        
        // Toggles to the auto search data view
        this.autoDiscoverButton.addEventListener(
            "click",
            this.selectAutoDiscoverSection.bind(this)
        );

        // Toggles to the manual search data view
        this.manualDiscoverButton.addEventListener(
            "click",
            this.selectManuallyDiscoverSection.bind(this)
        );
    }

    /**
     * Shows the manual discover section and hides the auto discover section
     */
    selectManuallyDiscoverSection() {
        removeClass(this.manualDiscoverSection, "hide");
        addClass(this.autoDiscoverSection, "hide");
    }

    /**
     * Shows the auto discover section and hides the manual discover section,
     * resets the buttons to active, and calls the startAutoDiscover function to
     * perform the action that starts the auto discover process
     */
    selectAutoDiscoverSection() {
        removeClass(this.autoDiscoverSection, "hide");
        addClass(this.manualDiscoverSection, "hide");
        addClass(this.tryDownloadButton, "inactive-border-button");
        addClass(this.skipAddress, "inactive-border-button");
        addClass(this.skipLink, "inactive-border-button");
        if (this.startAutoDiscover !== undefined) {
            this.startAutoDiscover();
        }
    }

    /**
     * Gets the manual user search input
     * @returns {String} Manual user search input
     */
    getManualInput() {
        return this.userSearch.value;
    }

    /**
     * Sets the startAutoDiscover function
     * @param {Function} startAutoDiscover This function is called when the auto
     * discover section button is clicked to start the auto discover process
     * @returns {DiscoverSection} This element for builder pattern
     */
    setAutoDiscoverOnClickAction(startAutoDiscover) {
        this.startAutoDiscover = startAutoDiscover;
        return this;
    }

    /**
     * Sets the tryDownload function
     * @param {Function} tryDownload This function is called when the try
     * download button is clicked
     * @returns {DiscoverSection} This element for builder pattern
     */
    setTryDownloadButtonOnClickAction(tryDownload) {
        this.tryDownloadButton.addEventListener("click", tryDownload);
        return this;
    }

    /**
     * Sets the skipAddress function
     * @param {Function} skipAddress This function is called when the skip
     * address button is clicked
     * @returns {DiscoverSection} This element for builder pattern
     */
    setSkipAddressOnClickAction(skipAddress) {
        this.skipAddress.addEventListener("click", skipAddress);
        return this;
    }

    /**
     * Sets the skipLink function
     * @param {Function} skipLink This function is called when the skip link
     * button is clicked
     * @returns {DiscoverSection} This element for builder pattern
     */
    setSkipLinkOnClickAction(skipLink) {
        this.skipLink.addEventListener("click", skipLink);
        return this;
    }

    /**
     * Sets the onChange function for the manual discover input
     * @param {Function} onChange This function is called whenever download from
     * user input changes
     * @returns {DiscoverSection} This element for builder pattern
     */
    setUserSearchOnChangeAction(onChange) {
        this.userSearch.addEventListener("input", onChange);
        return this;
    }

    /**
     * Sets the error text for the try download button
     * @param {String} errorText Error text to display
     */
    setAutoDiscoverError(errorText) {
        this.tryDownloadError.textContent = errorText;
    }

    /**
     * Sets the input text in the manual discover user input
     * @param {String} input Input text
     */
    setManualDiscoverInput(input) {
        this.userSearch.value = input;
    }
    
    /**
     * Sets the error text in the manual discover section
     * @param {String} errorText Error text to display
     */
    setManualDiscoverError(errorText) {
        this.manualSearchError.textContent = errorText;
    }

    /**
     * Set the text for the try download button
     * @param {String} text Text for the try download button
     */
    setTryDownloadText(text) {
        this.tryDownloadButton.textContent = text;
    }

    /**
     * Set whether the try download button display is active or inactive
     * @param {Boolean} isEnabled Whether to enable the try download button
     * display
     */
    setIsTryDownloadButtonEnabled(isEnabled) {
        if (isEnabled) {
            replaceClass(
                this.tryDownloadButton,
                "inactive-border-button",
                "border-button"
            );
        } else {
            replaceClass(
                this.tryDownloadButton,
                "border-button",
                "inactive-border-button"
            );
        }
    }

    /**
     * Set whether the skip address button display is active or inactive
     * @param {Boolean} isEnabled Whether to enable the try skip address button
     * display
     */
    setIsSkipAddressButtonEnabled(isEnabled) {
        if (isEnabled) {
            replaceClass(
                this.skipAddress,
                "inactive-border-button",
                "border-button"
            );
        } else {
            replaceClass(
                this.skipAddress,
                "border-button",
                "inactive-border-button"
            );
        }
    }

    /**
     * Set whether the skip link button display is active or inactive
     * @param {Boolean} isEnabled Whether to enable the skip link button display
     */
    setIsSkipLinkButtonEnabled(isEnabled) {
        if (isEnabled) {
            replaceClass(
                this.skipLink,
                "inactive-border-button",
                "border-button"
            );
        } else {
            replaceClass(
                this.skipLink,
                "border-button",
                "inactive-border-button"
            );
        }
    }
}

// Define the help section component
customElements.define("discover-section", DiscoverSection);
