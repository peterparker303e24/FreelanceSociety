export const helpItems = {
    "TaskId": {
        "name": `Task ID`,
        "description": `The unique identifier for a task. It is formed by the task type shortname followed by a dash "-" then the task index for the respective task type.`,
        "examples": `Task ID: h-0\nTask ID: dh-1\nTask ID: v-6`,
        "purpose": `To uniquely identify a task and provide information about the smart contract incentive structure of the task.`
    },
    "Reward": {
        "name": `Reward`,
        "description": `The ETH payout to the worker that completes the task.`,
        "examples": `Reward (Wei): 2 000 000 000 000 000\nReward (ETH): 0.005`,
        "purpose": `To incentivize workers to complete the tasks provided by managers.`
    },
    "ValidatorCommission": {
        "name": `Validator Commission`,
        "description": `Eth payed by the worker to the validator for the service of validating the worker submission.`,
        "examples": `Validator Commission (Wei): 200 000 000 000 000\nValidator Commission (ETH): 0.0005`,
        "purpose": `To compensate the validator for their service of validating the task submission. Without a validator commission, a worker can flood the task with dummy task submissions that the validator would need to spend extensive time working on without receiving any value.`
    },
    "TaskCompleted": {
        "name": `Task Completed`,
        "description": `Whether the task can be permanently marked as complete. The inverse is not necessarily true, a task may not be able to be completed, but still marked as "Task Completed: FALSE."`,
        "examples": `Task Completed: TRUE\nTask Completed: FALSE`,
        "purpose": `To show whether workers are able to be compensated for working on the task.`
    },
    "TaskDefaulted": {
        "name": `Task Defaulted`,
        "description": `Whether the validator task has defaulted. The task becomes defaulted when the validators have missed the task submission validation window. So the default behavior to automatically reward the worker who never got their submission evaluated.`,
        "examples": `Task Defaulted: TRUE\nTask Defaulted: FALSE`,
        "purpose": `To show whether workers are able to be compensated for working on the task. The task defaulting incentivizes managers to choose validators who are active and available. It also incentivizes validators to evaluate all submissions, since otherwise they miss out on the validator commission and lessen their reputation.`
    },
    "Deadline": {
        "name": `Deadline`,
        "description": `Timestamp on the blockchain when the smart contract will no longer accept further submissions for the task.`,
        "examples": `Deadline (UTC): Mon, 01 Mar 2026 12:00:00 GMT\nDeadline (UTC): Thu, 03 Jan 2109 12:00:00 GMT`,
        "purpose": `To incentivize workers to complete a task before a certain time. Managers can know that at the deadline they will either shortly after have a submission satisfying their task or be able to take back their task investment.`
    },
    "NextSlotTime": {
        "name": `Next Slot Time`,
        "description": `The time when the worker task submission will begin its validation window.`,
        "examples": `Next Slot Time (UTC): Now - Mon, 01 Mar 2026 12:00:00 GMT\nNext Slot Time (UTC): Thu, 03 Jan 2109 12:00:00 GMT`,
        "purpose": `To show the worker when their task submission would begin its evaluation window.`
    },
    "SubmissionsCount": {
        "name": `Submissions Count`,
        "description": `The number of worker task submissions have been submitted to the task.`,
        "examples": `Submissions Count: 0\nSubmissions Count: 2`,
        "purpose": `To show the worker how many worker task submissions may precede their task submission.`
    },
    "EvaluatedSubmissionsCount": {
        "name": `Evaluated Submissions Count`,
        "description": `The number of worker task submissions have been evaluated by validators for the task.`,
        "examples": `Evaluated Submissions Count: 0\nEvaluated Submissions Count: 2`,
        "purpose": `To show the worker how many worker task submissions have been evaluated preceding their task submission.`
    },
    "ViewSubmissions": {
        "name": `View Submissions`,
        "description": `Redirect to the page to show the full content of each existing task submission.`,
        "examples": `N/A`,
        "purpose": `To give the worker access to competing task submissions that precede their potential task submission.`
    },
    "UploadZipFile": {
        "name": `Upload ZIP File`,
        "description": `Prompts the user to upload a ZIP file from their local computer.`,
        "examples": `N/A`,
        "purpose": `To extract the task submission file hash which is necessary for the file sharing protocol.`
    },
    "Links": {
        "name": `Links`,
        "description": `A comma separated list of links of base paths for file resources and contact link information.`,
        "examples": `https://base.freelancesociety.app\nhttps://raw.githubusercontent.com/peterparker303e24/Base/main`,
        "purpose": `To show users where to find file resources hosted by other users and display contact link information.`
    },
    "HostingStatus": {
        "name": `Hosting Status`,
        "description": `Show whether the file resource is accessible to Freelance Society users.`,
        "examples": `Hosting Status: SUCCESS\nHosting Status: FAILURE`,
        "purpose": `To show the user whether Freelance Society is able to communicate the file resources necessary for data transfer.`
    },
    "FetchStatus": {
        "name": `Fetch Status`,
        "description": `A button to refresh the hosting status of file resources.`,
        "examples": `N/A`,
        "purpose": `To refresh the access status of hosted file resources.`
    },
    "EthicsRequirementsCheck": {
        "name": `Ethics Requirements Check`,
        "description": `A checkbox that is needed to be checked for the user to acknowledge they are producing a task or work that is ethical.`,
        "examples": `'✓'\n' '`,
        "purpose": `To incentivize all users to produce tasks and work that is ethical.`
    },
    "AddValidatorTaskSubmission": {
        "name": `Add Validator Task Submission`,
        "description": `A blockchain write transaction for the worker to add their task submission.`,
        "examples": `N/A`,
        "purpose": `To enable users to submit their task submission.`
    },
    "Connect": {
        "name": `Connect`,
        "description": `Connect the website to the user Ethereum wallet browser extension.`,
        "examples": `N/A`,
        "purpose": `To connect the Freelance Society website to the blockchain.`
    },
    "EthereumAddress": {
        "name": `Ethereum Address`,
        "description": `A unique 20 byte address to identify an Ethereum account within a wallet.`,
        "examples": `0x1d019f0c9d331520DCa4601e96bd4Cb5d6F025B9\n0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`,
        "purpose": `To uniquely identify an Ethereum account and its associated ETH and transactions.`
    },
    "Name": {
        "name": `Name`,
        "description": `A display name to other users. It can be changed at any time.`,
        "examples": `PeterParker303e24\nAlice\nBob`,
        "purpose": `To give users the opportunity to display identity information.`
    },
    "LockoutCode": {
        "name": `Lockout Code`,
        "description": `A 32 byte code that be used as a one-time action to lockout the user from Freelance Society. If no lockout code is provided, a null key encrypted lockout code is set by default and the user can not be locked out. The lockout key is a 32 byte secret that when hashed using keccak256 results in the lockout code. This lockout key is provided in the one-time action to lockout the user.`,
        "examples": `0x5bb1b92c745cb672998fe2b90af8e4dd64be2d51f97989e56b1e7598ad10d53c\n0x0000000000000000000000000000000000000000000000000000000000000000`,
        "purpose": `To give users the opportunity to permanently remove their user from Freelance Society. The lockout code enables the user to lockout the user from Ethereum another account and to keep the lockout key in cold storage. This can be useful such as in the event the hot wallet and account of a user is hacked. The user can switch to another wallet and account, then prove their identity by using the one-time action of revealing the lockout key to maintain some reputation of the previous account.`
    },
    "ActivateUser": {
        "name": `Activate User`,
        "description": `A blockchain write transaction to activate the user to Freelance Society.`,
        "examples": `N/A`,
        "purpose": `To enable users to activate their Freelance Society user to share file data.`
    },
    "EditUser": {
        "name": `Edit User`,
        "description": `A blockchain write transaction to edit user links and name data.`,
        "examples": `N/A`,
        "purpose": `To enable users to change their hosted links, contact links, or name display.`
    },
    "LockoutKey": {
        "name": `Lockout Key`,
        "description": `A 32 byte secret that when hashed using keccak256 results in the lockout code. This lockout key is provided in the one-time action to lockout the user along with the user address to lockout.`,
        "examples": `0x1234567812345678123456781234567812345678123456781234567812345678\n0x0000000000000000000000000000000000000000000000000000000000000000`,
        "purpose": `To give users the opportunity to permanently remove their user from Freelance Society. The lockout code enables the user to lockout the user from Ethereum another account and to keep the lockout key in cold storage. This can be useful such as in the event the hot wallet and account of a user is hacked. The user can switch to another wallet and account, then prove their identity by using the one-time action of revealing the lockout key to maintain some reputation of the previous account.`
    },
    "HashKey": {
        "name": `Hash Key`,
        "description": `32 byte hex data. You must solve the task to obtain this secret value. Once this is obtained, you can follow the submission process to complete the task. If you are the first to complete the submission, then you will earn the task reward. Revealing this hash key will notify everyone who can view the blockchain of the solution.`,
        "examples": `0x1234567812345678123456781234567812345678123456781234567812345678\n0x0000000000000000000000000000000000000000000000000000000000000000`,
        "purpose": `To incentive tasks with the incentive structure that uses the hash key for solving puzzles with a specific answer. Only one correct answer will result in a 32 byte data that can solve the task. The manager that created the task must know the hash key, or else may has created a task with no possible solution.`
    },
    "FirstHashResult": {
        "name": `First Hash Result`,
        "description": `Keccak256 hash of the hash key for the task.`,
        "examples": `0x3d6b7104c741bf23615b1bb00e067e9ef51c8ba2ab40042ee05086c14870f17c\n0x290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e563`,
        "purpose": `In the double hash task, the first hash allows the worker to reveal they have the hash key since the first hash can be derived from the hash key. This first hash is used in the smart contract to allocate a time window where only that specific worker may reveal the hash key and complete the double hash task.`
    },
    "SecondHashResult": {
        "name": `Second Hash Result`,
        "description": `Keccak256 hash of the keccak256 hash of the hash key for the task. If the second hash result matches the task hash value, then the worker has found the correct hash key that can be used to complete the double hash task.`,
        "examples": `0xefb23dc3fa8934192280d273e635ba2f834d729dab81abe97de286f2fa736067\n0x510e4e770828ddbf7f7b00ab00a9f6adaf81c0dc9cc85f1f8249c256942d61d9`,
        "purpose": `To show the worker whether their second hash result matches the task hash value to complete the double hash task.`
    },
    "HashValue": {
        "name": `Hash Value`,
        "description": `Public hash value of the task. Workers can verify they have found the hash key task solution if they can derive the hash value using the keccak256 hashing function.`,
        "examples": `0xefb23dc3fa8934192280d273e635ba2f834d729dab81abe97de286f2fa736067\n0x510e4e770828ddbf7f7b00ab00a9f6adaf81c0dc9cc85f1f8249c256942d61d9`,
        "purpose": `To show workers whether they have obtained the correct hash key to complete the task. The hash value can be derived from the hash key and prove within the smart contract that the worker has completed the task.`
    },
    "SecondResponseWindow": {
        "name": `Second Response Window`,
        "description": `Window of time (in seconds) the worker is allocated to submit their hash key. Only this worker can complete the task within this time window.`,
        "examples": `Second Response Window (Seconds): 40\nSecond Response Window (Seconds): 1800`,
        "purpose": `To give workers buffer time to reveal the hash key solution for the task to everyone where only they are allowed to submit the solution and reveive the reward.`
    },
    "Delay": {
        "name": `Delay`,
        "description": `Minimum time (in seconds) before the submission transaction is confirmed.`,
        "examples": `Delay (seconds): 20\nDelay (seconds): 600\n`,
        "purpose": `To allow confirmation blocks process to solidify the transaction in the blockchain.`
    },
    "ResponseCount": {
        "name": `Response Count`,
        "description": `Number of existing responses for the task made by workers.`,
        "examples": `Response Count: 0\nResponse Count: 2`,
        "purpose": `To show the worker how many first hash and/or hash key responses have been made for the task.`
    },
    "SubmitWindowStart": {
        "name": `Submit Window Start`,
        "description": `Start time for the user to complete their transaction. This time is dependent on the internal timestamp system in the blockchain, and may be different than the exact time.`,
        "examples": `Submit Window Start: Mon, 01 Mar 2026 12:00:00 GMT\nSubmit Window Start: Thu, 03 Jan 2109 12:00:00 GMT`,
        "purpose": `To show the worker the start time (in UTC) of the submission window.`
    },
    "CurrentTime": {
        "name": `Current Time`,
        "description": `Current UTC time provided by the browser.`,
        "examples": `Current Time (UTC): Mon, 01 Mar 2026 12:00:00 GMT\nCurrent Time (UTC): Thu, 03 Jan 2109 12:00:00 GMT`,
        "purpose": `To show the user the current UTC time to compare with any transactions dependent on the blockchain timestamp.`
    },
    "SubmitWindowEnd": {
        "name": `Submit Window End`,
        "description": `End time for the user to complete their transaction. This time is dependent on the internal timestamp system in the blockchain, and may be different than the exact time.`,
        "examples": `Submit Window End: Mon, 01 Mar 2026 12:00:00 GMT\nSubmit Window End: Thu, 03 Jan 2109 12:00:00 GMT`,
        "purpose": `To show the worker the end time (in UTC) of the submission window.`
    },
    "SubmitFirstHash": {
        "name": `Submit First Hash`,
        "description": `Blockchain transaction for the worker to reveal the first hash for the double hash task. This transaction can only take place if the first hash successfully hashes to the task hash value. When this transaction is made, the worker is allocated a time window where only they are allowed to submit the hash key and complete the task.\nHash Key --- keccak256 ---> First Hash --- keccak256 ---> Hash Value`,
        "examples": `N/A`,
        "purpose": `To give the worker a unique time window where only they are allowed to complete the task while they reveal the hash key.`
    },
    "SubmitSecondHash": {
        "name": `Submit Second Hash`,
        "description": `Blockchain transaction for the worker to reveal the hash key for the double hash task. This transaction can only take place if the hash key successfully hashes to the task hash value. When this transaction is made, the worker completes the task and receives the reward. When this transaction is made, the task solution is broadcast to everyone.\nHash Key --- keccak256 ---> First Hash --- keccak256 ---> Hash Value`,
        "examples": `N/A`,
        "purpose": `To allow the worker to reveal the task hash key solution and complete the double hash task to earn the task reward.`
    },
    "EthicsRequirementsVersion": {
        "name": `Ethics Requirements Version`,
        "description": `The ethics requirements version. The version is incremented once the first ethics requirements proposal is reached for a certain threshold. This threshold is increased exponentially for each increased ethics requirements version.`,
        "examples": `1\n5`,
        "purpose": `To indicate the ethics requirements status quo.`
    },
    "ViewEthicsRequirementsProposals": {
        "name": `View Ethics Requirements Proposals`,
        "description": `View the search page for all ethics requirements proposals.`,
        "examples": `N/A`,
        "purpose": `To redirect the user to a page to search for all ethics requirements proposed by any user.`
    },
    "AddEthicsRequirementsProposal": {
        "name": `Add Ethics Requirements Proposal`,
        "description": `View the page to proposal a new set of ethics requirements as a user.`,
        "examples": `N/A`,
        "purpose": `To redirect the user to a page where they are able to propose a new set of ethics requirements.`
    },
    "EthicsRequirements": {
        "name": `Ethics Requirements`,
        "description": `The ethics requirements status quo that must be followed by all users in creating and completing tasks.`,
        "examples": `Task or submission does not produce content of excessive harm of living beings.\nTask or submission does not produce content of weapons of which the prominent purpose is to harm.\nTask or submission does not produce content of any non-consentual nudity or sexual acts.\nTask or submission does not produce content of an individual's information for which there is a reasonable expectation of privacy.`,
        "purpose": `To incentivize users to only contribute ethical work, structures, and tasks to Freelance Society.`
    },
    "HashTaskNonce": {
        "name": `Nonce`,
        "description": `A number configurable by the user for the blockchain transaction. In the hash task, the nonce is used to provide a proof of work to the smart contract to meet the hash task difficulty threshold.`,
        "examples": `0\n1000\n12345678`,
        "purpose": `To create a buffer time that prevents other users from copying the worker's solution. Once the hash task is submitted, the hash key is revealed and other users can copy the hash task submission and attempt to frontrun their transaction before the original worker's submission transaction. The difficulty value is dependent on both the hash key and the submission Ethereum address, so the hash key must be known and another user cannot copy the nonce of a task submission with the hash key.`
    },
    "GenerateNonce": {
        "name": `Generate Nonce`,
        "description": `Clicking this button generates nonces within the browser until it comes across a nonce that satisfies the hash task difficulty value.`,
        "examples": `N/A`,
        "purpose": `To find a nonce that satisfies the hash task difficulty value for the task submission.`
    },
    "DifficultyValue": {
        "name": `Difficulty Value`,
        "description": `The calculated difficulty value that must be less than the expected difficulty value to complete the hash task. The difficulty value is derived from the hash key, nonce, and the Ethereum address of the currently selected account.`,
        "examples": `001822cce3f13fe5603d4133d69f2c27578807aa70194713e7207d50506fface\n0113b360a40f566beddc01fbf2c31f89cd6fe28220f8cdd3de4f6d6c468d6bf7`,
        "purpose": `To create a buffer time that prevents other users from copying the worker's solution. Once the hash task is submitted, the hash key is revealed and other users can copy the hash task submission and attempt to frontrun their transaction before the original worker's submission transaction. The difficulty value is dependent on both the hash key and the submission Ethereum address, so the hash key must be known and another user cannot copy the nonce of a task submission with the hash key.`
    },
    "ExpectedDifficultyValue": {
        "name": `Expected Difficulty Value`,
        "description": `The difficulty value that is necessary to complete the hash task. The smart contract code only allows task submissions that meet the expected difficulty threshold.`,
        "examples": `0040000000000000000000000000000000000000000000000000000000000000\n0200000000000000000000000000000000000000000000000000000000000000\nN/A`,
        "purpose": `To create a buffer time that prevents other users from copying the worker's solution. Once the hash task is submitted, the hash key is revealed and other users can copy the hash task submission and attempt to frontrun their transaction before the original worker's submission transaction. The difficulty value is dependent on both the hash key and the submission Ethereum address, so the hash key must be known and another user cannot copy the nonce of a task submission with the hash key.`
    },
    "SubmitHashTask": {
        "name": `Submit Hash Task`,
        "description": `Blockchain transaction for the worker to reveal the hash key for the hash task. This transaction can only take place if the hash key successfully hashes to the task hash value. When this transaction is made, the worker completes the task and receives the reward. When this transaction is made, the task solution is broadcast to everyone.\nHash Key --- keccak256 ---> Hash Value`,
        "examples": `N/A`,
        "purpose": `To allow the worker to reveal the task hash key solution and complete the hash task to earn the task reward.`
    },
    "TotalTasksCount": {
        "name": `Total Tasks Count`,
        "description": `The total number of all types of tasks ever submitted. Or the total number of tasks submitted of a specific task type.`,
        "examples": `Total Tasks Count: 15\nHash Tasks Count: 7\nDouble Hash Tasks Count: 5\nValidator Tasks Count: 3`,
        "purpose": `To show the user how many tasks exist in all of Freelance society, and for each task type.`
    },
    "AddTask": {
        "name": `Add Task`,
        "description": `Redirect the user to the add task page for the specified task type.`,
        "examples": `Add Hash Task\nAdd Double Hash Task\nAdd Validator Task\n`,
        "purpose": `To redirect the user to pages where they are able to contribute a new task to Freelance Society.`
    },
    "HideCompletedAndPastTasks": {
        "name": `Hide completed and past tasks`,
        "description": `When checked, any tasks that the user is definitively unable to complete to receive the reward are not shown in the search results.`,
        "examples": `'✓'\n' '`,
        "purpose": `To enable the user to refine their search criteria, especially if searching as a worker that wants to complete tasks to earn ETH rewards.`
    },
    "Search": {
        "name": `Search`,
        "description": `The search button and input for discovering tasks, requirements, users, transactions, or submissions. `,
        "examples": `v\ndh-2\n0x70997970C51812dc3A010C7d01b50e0d17dc79C8\n0xe8503ca1bacc9a2addc1ba6e13a7c22daee9b3956821a5609ba44c1e87752562\n0xe850`,
        "purpose": `To enable the user to narrow their search results, or search for the most recent results.`
    },
    "Previous/Next": {
        "name": `Previous/Next`,
        "description": `Previous button and next button to navigate between search page results.`,
        "examples": `N/A`,
        "purpose": `To allow the user to search in batches and navigate between search pages.`
    },
    "Results": {
        "name": `Results`,
        "description": `Results text to display the number of results found in the search page.`,
        "examples": `Results 1 - 10:\nNo results match search criteria`,
        "purpose": `To show the user how many results were discovered for the current page.`
    },
    "SearchResult": {
        "name": `Search Result`,
        "description": `A single search result with some identifying information and data.`,
        "examples": `h-6\nHash: 0xe8503ca1bacc9a2addc1ba6e13a7c22daee9b3956821a5609ba44c1e87752562\nManager Address: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8\nReward: 2 000 000 000 000 000 (Wei)\nDeadline (UTC): Tue, 02 Mar 2027 17:07:04 GMT\nTask Complete: FALSE`,
        "purpose": `To show the user unique identifying information about a search result, to show some common data attributes of a search result, and possibly a button for the user to redirect to the search result page.`
    },
    "ManagerAddress": {
        "name": `Manager Address`,
        "description": `Ethereum address of the user that originally added the task. This user should be the user that has access to and distributes the Task.zip file as they are the one that created the task.`,
        "examples": `Manager Address: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8`,
        "purpose": `To show users which Ethereum address contributed the task to Freelance Society.`
    },
    "ViewTask": {
        "name": `View Task`,
        "description": `Redirects the user to the view task page for the task identified in the search result.`,
        "examples": `N/A`,
        "purpose": `To redirect the user to the task page for the task identified in the search result.`
    },
    "TaskHash": {
        "name": `Task Hash`,
        "description": `The keccak256 hash of the Task.zip file data.`,
        "examples": `0xe8503ca1bacc9a2addc1ba6e13a7c22daee9b3956821a5609ba44c1e87752562\n0x22e5594e977f215c69be7c0bd8254a0fe8a61e21014e11ebceb97ed17695952b\n0x54a7232f0cdbf8f9f18ba940bb65dd4f1694b676aacc42501a4029e5c43bde5b`,
        "purpose": `To enable users to verify a Task.zip file that they have discovered exactly matches the task described on the blockchain.`
    },
    "KeyReveal": {
        "name": `Key Reveal`,
        "description": `Key reveal changes the incentive structure of the task for the manager that created the task. If key reveal is set to true and the task deadline passes while no user completed the task, then the manager must reveal the hash key that would have completed the task in order to withdraw their funds from the task. If key reveal is set to false and the task deadline passes while no user completed the task, then the manager can withdraw their funds without revealing the task hash key solution.`,
        "examples": `Key Reveal: TRUE\nKey Reveal: FALSE`,
        "purpose": `To enable managers to change the structure of the task incentive structure. If key reveal is set to true and the task deadline passes while no user completed the task, then the manager must reveal the hash key that would have completed the task in order to withdraw their funds from the task. If key reveal is set to false and the task deadline passes while no user completed the task, then the manager can withdraw their funds without revealing the task hash key solution.`
    },
    "FundTaskAmount": {
        "name": `Fund Task Amount`,
        "description": `The amount of ETH to add to the task reward.`,
        "examples": `Fund Task Amount (Wei): 10 000 000 000 000 000\nFund Task Amount (ETH): 0.01\n`,
        "purpose": `To allow the user to decide how much more they would like to increase the task incentive.`
    },
    "FundTask": {
        "name": `Fund Task`,
        "description": `Add funds to the task reward for any additional ETH value. You can make additional funding transactions any number of times before the task deadline. If you add funds to a task and no task submissions submitted before the deadline complete the task, then you can withdraw the cumulative funds of all fund transactions to the task.`,
        "examples": `N/A`,
        "purpose": `To allow the task manager or any user to increase the incentive for an existing task.`
    },
    "WithdrawTaskFunds": {
        "name": `Withdraw Task Funds`,
        "description": `Withdraw the the cumulative funds of all fund transactions to the task`,
        "examples": `N/A`,
        "purpose": `To enable users that funded the task to withdraw their funds since workers failed to complete the task before the deadline.`
    },
    "AutoDiscover": {
        "name": `Auto Discover`,
        "description": `Search iteratively through all Freelance Society users from most recent to oldest, and try to retrieve data through user endpoints.`,
        "examples": `N/A`,
        "purpose": `To enable users to efficiently search through all Freelance Society users for data hosting endpoints.`
    },
    "TryDownloadFrom": {
        "name": `Try download from`,
        "description": `Actively try to download data from the user shown at the endpoint shown.`,
        "examples": `Try download from: PeterParker303e24\nAddress: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266\nLink: https://base.freelancesociety.app//Tasks/DoubleHashTasks/22e5594e977f215c69be7c0bd8254a0fe8a61e21014e11ebceb97ed17695952b/Task.zip`,
        "purpose": `To enable users to actively decide whether to download data from a given user.`
    },
    "SkipAddress": {
        "name": `Skip Address`,
        "description": `Skip the current user.`,
        "examples": `N/A`,
        "purpose": `To enable the user to discover data by searching through a different user.`
    },
    "SkipLink": {
        "name": `Skip Link`,
        "description": `Skip the current user link. If the user has other links, then the other endpoints will be tried.`,
        "examples": `N/A`,
        "purpose": `To enable the user to discover data by searching through alternative endpoint links.`
    },
    "ManuallyDiscover": {
        "name": `Manually Discover`,
        "description": `Discover data through endpoint links of a specific user by address.`,
        "examples": `N/A`,
        "purpose": `To enable the user to try discovering data through a manually selected user address.`
    },
    "DownloadFromUser": {
        "name": `Download From User`,
        "description": `Ethereum address of the user to try to discover the data through their endpoint links.`,
        "examples": `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266\n0x70997970C51812dc3A010C7d01b50e0d17dc79C8`,
        "purpose": `To enable the user to input the specific user address to try discovering the data.`
    },
    "TaskSpecifications": {
        "name": `Task Specifications`,
        "description": `The list of all task specifications that must be satisfied to complete the task.`,
        "examples": `Requirement 2-1\nCondition\nA set of instructions described in instructions lead to a set of bytes _bytes1 that can be hashed using the keccak256 function to produce a set of 32 bytes _bytes2 when hashed again using the keccak256 function produce another set of 32 bytes _bytes3 when hashed once again using the keccak256 function matches the labeled hash value _bytes4 in the contract indicating a successful decryption. The lowercase of the alphanumeric hex characters of the _bytes2 is used as the passphrase in aes-256-cbc encryption to encrypt/decrypt the solution of the task explained in the encrypted file encryptedSolution to be decrypted into decryptedSolution. Submit the bytes _bytes3 to the contract, then wait for the scheduled confirmation time slot shortly after, then submit the bytes _bytes2 to the contract.\n\ninstructions:\n1 + 1 = ?\nencryptedSolution:\nsolution.enc\ndecryptedSolution:\nsolution.txt`,
        "purpose": `To show users the list of all specifications that must be completed to complete the task.`
    },
    "TaskSpecificationHeader": {
        "name": `Task Specification Header`,
        "description": `The requirement structure for one of the task specification items.`,
        "examples": `Requirement 2-1\nRequirement 0-1\nRequirement 3-4`,
        "purpose": `To show users the exact task specification structure that must be satisfied.`
    },
    "TaskSpecificationCondition": {
        "name": `Task Specification Condition`,
        "description": `The condition described in the requirement that must be satisfied for the task with the given parameters defined in the requirement.`,
        "examples": `Condition\nA set of instructions described in instructions lead to a set of bytes _bytes1 that can be hashed using the keccak256 function to produce a set of 32 bytes _bytes2 when hashed again using the keccak256 function produce another set of 32 bytes _bytes3 when hashed once again using the keccak256 function matches the labeled hash value _bytes4 in the contract indicating a successful decryption. The lowercase of the alphanumeric hex characters of the _bytes2 is used as the passphrase in aes-256-cbc encryption to encrypt/decrypt the solution of the task explained in the encrypted file encryptedSolution to be decrypted into decryptedSolution. Submit the bytes _bytes3 to the contract, then wait for the scheduled confirmation time slot shortly after, then submit the bytes _bytes2 to the contract.\n\ninstructions:\n1 + 1 = ?\nencryptedSolution:\nsolution.enc\ndecryptedSolution:\nsolution.txt`,
        "purpose": `To show users the specification requirement and specification requirement parameters that form the task condition that must be satisfied.`
    },
    "SaveLocally": {
        "name": `Save Locally`,
        "description": `If the task data has already been discovered, then the button will download the data to the user's local computer.`,
        "examples": `N/A`,
        "purpose": `To enable users to download data so they no longer have to rely on other users to view the data.`
    },
    "UploadLocally": {
        "name": `Upload Locally`,
        "description": `Upload any undiscovered data from their local computer to the webpage to verify its authenticity and view.`,
        "examples": `N/A`,
        "purpose": `To enable users to verify and view any data saved locally on their computer.`
    },
    "SubmitTask": {
        "name": `Submit Task`,
        "description": `Redirect to the task submission page to complete the current task.`,
        "examples": `N/A`,
        "purpose": `To redirect users to the task submission page to complete the current task.`
    },
    "ViewTasks": {
        "name": `View Tasks`,
        "description": `Redirect to the task search page. This may automatically search for any related tasks with the same current task type.`,
        "examples": `View Tasks\nView Hash Tasks\nView Double Hash Tasks\nView Validator Tasks`,
        "purpose": `To redirect users to the task search page, possibly while filtering for any related tasks.`
    },
    "ZipContents": {
        "name": `Zip Contents`,
        "description": `If the task data has been discovered and the ZIP contents are parsed correctly, the ZIP files and folder tree structure will be displayed.`,
        "examples": `Task\n\tRequirements\n\t\tRequirement2-1.zip\n\tsolution.enc\n\tspecifications.json`,
        "purpose": `To display the file structure of the discovered data ZIP file and folder contents.`
    },
    "Difficulty": {
        "name": `Difficulty`,
        "description": `The difficulty that is necessary to complete the hash task. The smart contract code only allows task submissions that meet the expected difficulty threshold. Each increment of the difficulty doubles the difficulty in finding the nonce.`,
        "examples": `0\n10\n15`,
        "purpose": `To create a buffer time that prevents other users from copying the worker's solution. Once the hash task is submitted, the hash key is revealed and other users can copy the hash task submission and attempt to frontrun their transaction before the original worker's submission transaction. The difficulty value is dependent on both the hash key and the submission Ethereum address, so the hash key must be known and another user cannot copy the nonce of a task submission with the hash key.`
    },
    "SpecificationsCount": {
        "name": `Specifications Count`,
        "description": `The number of specifications for the task.`,
        "examples": `Specifications Count: 1\nSpecifications Count: 5`,
        "purpose": `To show the number of specifications for the task.`
    },
    "ValidationTime": {
        "name": `Validation Time`,
        "description": `The amount of time, in seconds, of the validator task submission evaluation window.`,
        "examples": `Validation Time (Seconds): 600\nValidation Time (Seconds): 1209600`,
        "purpose": `To allow managers to decide how much time is allocated for validators to perform their task submission evaluations. The amount of time expected to complete the task validation may depend on the specifications, so managers may choose the amount of time accordingly.`
    },
    "EvaluatedSubmissionsCount": {
        "name": `Evauated Submissions Count`,
        "description": `The number of task submissions that have been evaluated by validators for the current task.`,
        "examples": `Evauated Submissions Count: 0\nEvauated Submissions Count: 2`,
        "purpose": `To show users how many task submissions have been evaluated by validators. Users can compare the evaluated submissions count with the submissions count to see how many task submissions are left that are waiting evaluation.`
    },
    "BlockValidation": {
        "name": `Block Validation`,
        "description": `Whether to use block validation in the evaluation time windows. If block validation is true, then the validator time window blocks do not overlap, so any added task submission has its evaluation start time begin at least at the end of the last task submission. If block validation is false, then the validator time window blocks may overlap, so any added task submission has its evaluation start time begin immediately following the block confirmation delay.`,
        "examples": `Block Validation: TRUE\nBlock Validation: FALSE`,
        "purpose": `To allow managers to decide the evaluation schedule for the validators. If block schedule is true, then validators have more time for each task submission evaluation since the time windows are independent, but can be slow for multiple submissions. If block schedule is false, then multiple submissions can be evaluated quickly, but the validators may be overwhelmed by multiple overlapping task submissions.`
    },
    "CompletionIndex": {
        "name": `Completion Index`,
        "description": `Index of the task submission that was accepted.`,
        "examples": `Completion Index: X\nCompletion Index: 0\nCompletion Index: 2`,
        "purpose": `To show users the index of which task submission was accepted.`
    },
    "CompletionAddress": {
        "name": `Completion Address`,
        "description": `The Ethereum address of the worker that completed the task.`,
        "examples": `X\n0x70997970C51812dc3A010C7d01b50e0d17dc79C8`,
        "purpose": `To show users which user completed the current task.`
    },
    "Validators": {
        "name": `Validators`,
        "description": `Validators for the task. Any validator may evaluate any task submission within the validator evaluation window. Only the first validator that evaluates a submission has full control of the submission outcome and receives the commission.`,
        "examples": `Validators:\n0x70997970C51812dc3A010C7d01b50e0d17dc79C8\n\nValidators:\n0x70997970C51812dc3A010C7d01b50e0d17dc79C8\n0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`,
        "purpose": `To show users which validators have control in determining the outcome of task submission evaluations. The validators are public and their full validation history can be searched, so any user can independently verify the trustworthyness of the validators.`
    },
};