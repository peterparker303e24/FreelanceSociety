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
    }
};