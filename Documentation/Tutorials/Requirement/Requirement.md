
### Before You Start

You should be completing this tutorial through either the online Sepolia testnet blockchain or the local blockchain. In both cases you are using testnet cryptocurrencies that are freely available, so no value will be lost in testing within the tutorial. Be aware that if you interact with the Sepolia network, the transactions and data you submit are immutable and public, which may affect your privacy.

If you are using the Sepolia network, then you can use the online GitHub hosted Freelance Society website in the link below. But, if you are using a Localhost blockchain or prefer to locally self host the Freelance Society website on your local computer, then you should have the frontend server running and use the Localhost link below.

GitHub hosted Freelance Society website: [https://peterparker303e24.github.io/FreelanceSociety/TheDarkKnight/Frontend/index.html](https://peterparker303e24.github.io/FreelanceSociety/TheDarkKnight/Frontend/index.html)

Localhost Freelance Society website: [http://localhost:3000](http://localhost:3000)

For the Localhost blockchain it is recommended to use the account 0x70997970C51812dc3A010C7d01b50e0d17dc79C8. You can add this account with the following private key in MetaMask:

###
    0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

### Add A Requirement To The List

In the Home page, select "Requirements" to navigate to The List search page. You can view the recent requirements, search for specific requirements, navigate between pages with the "Next" and "Previous" buttons, and navigate to the Add Requirement page. Select the "Add Requirement" button to navigate to the Add Requirement page.

A requirement is a standardized communication structure that is used by manager users to incentivize worker users to complete a task that aligns with the manager's needs. The requirement data structure is a ZIP file of a folder with contents "requiremens.json" and any other supporting files or folders. The requirements.json file has JSON properties: condition, labeledVariables, intermediateVariables, exampleSpecifications, and exampleAnswer. The condition property is an array of strings that alternate between description text and keyword labeledVariables/intermediateVariables. The labeledVariables property is an array of the keyword strings that must be present in the requirement specification. The intermediateVariables property is an array of keyword strings that are supporting variables for improved clarity in the requirement description. The exampleSpecification property is an optional object with properties corresponding to each of the labeledVariables. The exampleAnswer property is the corresponding solution to the exampleSpecification requirement.

Input the text below into the requirement JSON field:

###
    {
        "condition": [
            "A concise set of requirements are listed in the instructions ",
	    "instructions",
	    ". All requirements in ",
	    "instructions",
	    " are clearly met within the most basic interpretation of ",
	    "instructions",
	    "."
        ],
        "labeledVariables": [
            "instructions"
        ],
        "exampleSpecification": {
            "instructions": "Respond with the answer to 1 + 1."
        },
        "exampleAnswer": "2"
    }

Scroll down and select the button "Download Requirement". The ZIP file should be uploaded within your base route with the path "TheList/&lt;ZipFileHash&gt;/Requirement.zip" (Do not include the "0x" hex prefix). If you are not hosting the data, then you can download the ZIP file [here](https://raw.githubusercontent.com/peterparker303e24/Base/main/TheList/a5f9dd923a070e174a6eba176c73bd909ea5957c3b58048755914bc3d57692bd/Requirement.zip) (open the link in a new tab) with the ZIP hash "a5f9dd923a070e174a6eba176c73bd909ea5957c3b58048755914bc3d57692bd". Once the file is correctly hosted and available, scroll back up to the top of the page and select "Upload Zip File" and select the ZIP file that you downloaded. If Freelance Society is able to access the hosted ZIP file data, then the "Add Requirement" button will be enabled. Select "Add Requirement" and confirm the transaction to add the requirement to The List.

You will be redirected to the View Requirements page and the recent requirements will shortly populate the page. Select "View Requirement" with the requirement that has the matching "Manager Address" of your account. You will be redirected to the Requirement page and you can view the requirement data such as the Requirement Id, Requirement Hash, and Requirement Manager Address. You can display the requirement to the page by either uploading the corresponding requirement ZIP file by selecting the "Upload Locally" or by retrieving the requirement ZIP file through the internet using either the "Auto Discover Requirement" or "Manually Discover Requirement" buttons. If you select "Auto Discover Requirement", then you can select the download button to try downloading the ZIP file data through the link from the user shown. You can select skip to skip the user link or whole user entirely. If you instead select "Manually Discover Requirement", then you can input a user address (such as your own) to retrieve the requirement data.

You and all users in the blockchain can now view the full requirement data that you created. You can now use your requirement for creating and completing tasks.

### What To Do Next

Continue to the next section to add a new hash task to incentivize workers to complete a task you create: [Hash Task Tutorial](https://github.com/peterparker303e24/FreelanceSociety/blob/main/Documentation/Tutorials/HashTask/HashTask.md#add-a-hash-task).
