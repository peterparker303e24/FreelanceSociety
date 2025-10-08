/**
 * Reusable side panel navigation component for learning pages
 */
class LearningNavigationPanel extends HTMLElement {
    constructor() {
        super();

        // Attatch shadow DOM 
        this.attachShadow({ mode: "open" });

        // Define the component html and css
        this.shadowRoot.innerHTML = `
            <link rel="stylesheet" href="./global.css">
            <link rel="stylesheet" href="./css/learning.css">
            <div id="panel">
                <div>Theory</div>
                <a href="./pages/learning/theory/freelanceSociety.html" class="learning-navigation-link">Freelance Society</a>
                <a href="./pages/learning/theory/manager.html" class="learning-navigation-link">Manager</a>
                <a href="./pages/learning/theory/safety.html" class="learning-navigation-link">Safety</a>
                <a href="./pages/learning/theory/tasks.html" class="learning-navigation-link">Tasks</a>
                <a href="./pages/learning/theory/theList.html" class="learning-navigation-link">The List</a>
                <a href="./pages/learning/theory/validator.html" class="learning-navigation-link">Validator</a>
                <a href="./pages/learning/theory/worker.html" class="learning-navigation-link">Worker</a>
                <div>Website</div>
                <a href="./pages/learning/website/add.html" class="learning-navigation-link">Add</a>
                <a href="./pages/learning/website/common.html" class="learning-navigation-link">Common</a>
                <a href="./pages/learning/website/doubleHashTask.html" class="learning-navigation-link">Double Hash Task</a>
                <a href="./pages/learning/website/ethicsRequirements.html" class="learning-navigation-link">Ethics Requirements</a>
                <a href="./pages/learning/website/ethicsRequirementsProposals.html" class="learning-navigation-link">Ethics Requirements Proposals</a>
                <a href="./pages/learning/website/hashTask.html" class="learning-navigation-link">Hash Task</a>
                <a href="./pages/learning/website/home.html" class="learning-navigation-link">Home</a>
                <a href="./pages/learning/website/navigation.html" class="learning-navigation-link">Navigation</a>
                <a href="./pages/learning/website/profile.html" class="learning-navigation-link">Profile</a>
                <a href="./pages/learning/website/requirementProposals.html" class="learning-navigation-link">Requirement Proposals</a>
                <a href="./pages/learning/website/requirements.html" class="learning-navigation-link">Requirements</a>
                <a href="./pages/learning/website/search.html" class="learning-navigation-link">Search</a>
                <a href="./pages/learning/website/settings.html" class="learning-navigation-link">Settings</a>
                <a href="./pages/learning/website/submit.html" class="learning-navigation-link">Submit</a>
                <a href="./pages/learning/website/theList.html" class="learning-navigation-link">The List</a>
                <a href="./pages/learning/website/users.html" class="learning-navigation-link">Users</a>
                <a href="./pages/learning/website/validatorTask.html" class="learning-navigation-link">Validator Task</a>
                <a href="./pages/learning/website/viewItem.html" class="learning-navigation-link">View Item</a>
                <a href="./pages/learning/website/viewSubmissions.html" class="learning-navigation-link">View Submissions</a>
                <div>Code</div>
                <a href="./pages/learning/code/doubleHashTask.html" class="learning-navigation-link">DoubleHashTask.sol</a>
                <a href="./pages/learning/code/hashTask.html" class="learning-navigation-link">HashTask.sol</a>
                <a href="./pages/learning/code/theList.html" class="learning-navigation-link">TheList.sol</a>
                <a href="./pages/learning/code/users.html" class="learning-navigation-link">Users.sol</a>
                <a href="./pages/learning/code/validatorTask.html" class="learning-navigation-link">ValidatorTask.sol</a>
                <a href="./pages/learning/code/website.html" class="learning-navigation-link">Website</a>
            </div>
        `;
    }
}

// Define the navigation component
customElements.define("learning-navigation-panel", LearningNavigationPanel);
