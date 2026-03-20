import {
    addClass,
    removeClass
} from "../../utils/commonFunctions.js";

/**
 * Reusable page header component with home button, header, and settings button
 */
class HelpSection extends HTMLElement {
    constructor() {
        super();

        // Attatch shadow DOM only if configured to show help
        this.showHelpButton = window.localStorage.getItem("showHelp");
        if (this.showHelpButton === "false") {
            return;
        }
        window.localStorage.setItem("showHelp", "true");

        // Define the component html and css
        this.attachShadow({ mode: "open" });
        this.shadowRoot.innerHTML = `
            <link rel="stylesheet" href="./global.css">
            <div id="help-button" class="help-button">?</div>
            <div id="help-panel" class="help-panel hide">
                <div id="help-close" class="help-close large-text">X</div>
                <div id="help-header" class="row-left vertically-center-row">
                    <div id="help-move-left" class="inactive-border-button medium-margin large-text medium-width medium-height">◀</div>
                    <div id="help-item" class="wrap-text medium-text xx-large-width"></div>
                    <div id="help-move-right" class="border-button medium-margin large-text medium-width medium-height">▶</div>
                </div>
                <div id="help-tabs" class="help-panel-tabs">
                    <div id="help-description-tab" class="help-tab tab-selected large-text">Description</div>
                    <div id="help-examples-tab" class="help-tab large-text">Examples</div>
                    <div id="help-purpose-tab" class="help-tab large-text">Purpose</div>
                </div>
                <div id="help-content" class="help-content"></div>
            </div>
        `;

        this.showHelpPanel = false;
        this.helpPanel = this.shadowRoot.getElementById("help-panel");
        this.shadowRoot.getElementById("help-button")
            .addEventListener("click", () => {
                this.showHelpPanel = !this.showHelpPanel;
                this.updateContent();
            });
        this.shadowRoot.getElementById("help-close")
            .addEventListener("click", () => {
                this.showHelpPanel = false;
                this.updateContent();
            });
        this.tabSection = "Description";
        this.descriptionTab = this.shadowRoot.getElementById("help-description-tab");
        this.descriptionTab.addEventListener("click", () => {
            this.tabSection = "Description";
            this.updateContent();
        });
        this.examplesTab = this.shadowRoot.getElementById("help-examples-tab");
        this.examplesTab.addEventListener("click", () => {
            this.tabSection = "Example";
            this.updateContent();
        });
        this.purposeTab = this.shadowRoot.getElementById("help-purpose-tab");
        this.purposeTab.addEventListener("click", () => {
            this.tabSection = "Purpose";
            this.updateContent();
        });
        this.collectionIndex = 0;
    }

    // Define the observed attributes
    static get observedAttributes() {
        return ['helpCollection'];
    }

    // Called when the component is added to the DOM
    connectedCallback() {
        this.updateContent();
    }

    // Called when an observed attribute changes
    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'helpCollection') {
            this.updateContent();
        }
    }

    // Getter for the property
    get helpCollection() {
        return this.getAttribute('helpCollection');
    }

    // Setter for the property
    set helpCollection(value) {
        this.setAttribute('helpCollection', value);
    }

    // Update the content of the div based on the property
    updateContent() {
        if (!this.showHelpPanel) {
            addClass(this.helpPanel, "hide");
            return;
        }
        removeClass(this.helpPanel, "hide");

        removeClass(this.descriptionTab, "tab-selected");
        removeClass(this.examplesTab, "tab-selected");
        removeClass(this.purposeTab, "tab-selected");
        switch(this.tabSection) {
            case "Description":
                addClass(this.descriptionTab, "tab-selected");
                break;
            case "Example":
                addClass(this.examplesTab, "tab-selected");
                break;
            case "Purpose":
                addClass(this.purposeTab, "tab-selected");
                break;
        }
        
    }
}

// Define the help component
customElements.define("help-section", HelpSection);
