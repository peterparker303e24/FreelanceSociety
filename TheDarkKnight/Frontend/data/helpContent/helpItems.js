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
};