/**
 * Reusable page header component with home button, header, and settings button
 */
class HeaderSection extends HTMLElement {
    constructor() {
        super();

        // Attatch shadow DOM 
        this.attachShadow({ mode: "open" });

        // Define the component html and css
        this.shadowRoot.innerHTML = `
            <link rel="stylesheet" href="global.css">
            <div id="header-container" class="row vertically-center-row">
                <div id="left-button" class="icon-button redirectable left medium-padding">
                    <img src="./assets/icons/Home.svg" class="icon" />
                    <div class="icon-text">Home</div>
                </div>
                <h1 id="header-text"></h1>
                <div id="right-button" class="icon-button redirectable right medium-padding">
                    <img src="./assets/icons/Settings.svg" class="icon" />
                    <div class="icon-text">Settings</div>
                </div>
            </div>
        `;

        this.headerElement = this.shadowRoot.getElementById('header-text');
    }

    // Define the observed attributes
    static get observedAttributes() {
        return ['headerText'];
    }

    // Called when the component is added to the DOM
    connectedCallback() {
        this.updateContent();
    }

    // Called when an observed attribute changes
    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'headerText') {
            this.updateContent();
        }
    }

    // Getter for the property
    get headerText() {
        return this.getAttribute('headerText');
    }

    // Setter for the property
    set headerText(value) {
        this.setAttribute('headerText', value);
    }

    // Update the content of the div based on the property
    updateContent() {
        if (this.headerElement) {
            this.headerElement.textContent = this.headerText;
        }
    }
}

// Define the header section component
customElements.define("header-section", HeaderSection);
