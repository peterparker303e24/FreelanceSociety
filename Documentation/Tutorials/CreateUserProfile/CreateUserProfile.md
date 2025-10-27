
### Before You Start

You should be completing this tutorial through either the online Sepolia testnet blockchain or the local blockchain. In both cases you are using testnet cryptocurrencies that are freely available, so no value will be lost in testing within the tutorial. Be aware that if you interact with the Sepolia network, the transactions and data you submit are immutable and public, which may affect your privacy.

If you are using the Sepolia network, then you can use the online GitHub hosted Freelance Society website in the link below. But, if you are using a Localhost blockchain or prefer to locally self host the Freelance Society website on your local computer, then you should have the frontend server running and use the Localhost link below.

GitHub hosted Freelance Society website: [https://peterparker303e24.github.io/FreelanceSociety/TheDarkKnight/Frontend/index.html](https://peterparker303e24.github.io/FreelanceSociety/TheDarkKnight/Frontend/index.html)

Localhost Freelance Society website: [http://localhost:3000](http://localhost:3000)

For the Localhost blockchain, you can add the account corresponding to the deployWithData.cjs script with the following private key:

###
    0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

### Create User Profile

In the Home page, select "Profile" to begin creating the profile associated with your user and corresponding address.

If your wallet is connected to the website and is properly connected to your selected blockchain, then you will see your address, an input for Links, an input for Name, and input for Lockout Code.

In the Links input you should input a base route to a website where you can add files and directories to route Freelance Society to data resources. Currently in GitHub, you can create an account for free and host files with some data and networking limitations. You can then create a repository and upload files for hosting. The link for that corresponding base route would then be "https://raw.githubusercontent.com/<YourUsername>/<YourRepository>/<YourBranch>". If you would like to continue the tutorial without going through that process you should be able to use the link below, though you cannot edit the files and the network availability may not be completely persistent.

###
    https://raw.githubusercontent.com/peterparker303e24/Base/main

You may input any name in the Name input field.

The Lockout Code is the keccak256 hash of some hidden 32 bytes of data. This code allows a user to permanently delete their user from Freelance Society if their account has been compromised or if the user would like to terminate their participation. For the purposes of this tutorial you can use the Lockout Code 32 byte hex below. (This lockout code and it's corresponding key is not secret and so anybody can lockout your user from Freelance Society). Using the secret "LockoutKey", which when hashed using keccak256 in UTF-8 encoding results in the secret 32 byte lockout key "0x204b330b3533d423bee04f6872bfc339d1c5a6f3e0ad1191fec292163545570d". The keccak256 hash of these 32 bytes results in the Lockout Code below.

Lockout Code:
###
    0x5bb1b92c745cb672998fe2b90af8e4dd64be2d51f97989e56b1e7598ad10d53c

Select "Create User". Interactions on Freelance Society that require a transaction to the blockchain have colored buttons to identify them. When you select this button you should receive a popup from your MetaMask wallet to confirm the transaction. You need to have enough cryptocurrency to complete this transaction. Select "Confirm" to submit your transaction to the blockchain. If you are using a Localhost blockchain, then the transaction may take a few seconds to confirm. But if you are using the Sepolia blockchain, then it may take a bit longer to confirm, but typically well under a minute.

You have now initialized your user profile on the blockchain and can now create requirements, tasks, and submissions. You now have all of the knowledge needed to submit any Freelance Society interactions to blockchain, well done!

### What To Do Next

Continue to the next section to add a new requirement to The List to create incentive structures for workers to complete tasks: [Requirement Tutorial](https://github.com/peterparker303e24/FreelanceSociety/blob/main/Documentation/Tutorials/Requirement/Requirement.md#add-a-requirement-to-the-list).
