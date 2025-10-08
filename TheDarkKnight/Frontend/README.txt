1. Home
    - Settings
    - Language
    - Light/Dark Mode
    - Network
    - Learn
    - Me
    - View Tasks
    - View Requirements
    - View Requirement Update Proposals
    - View Ethics Requirements Update Proposals
    - View Users
2. Me
    - Home
    - Settings
    - Connect wallet
    - Switch user
    $ activateUser
    $ lockoutUser
    $ updateData
    $ updateUserLinks
    * links
    * usersData
    * lockoutCodes
    * lockouts
    * activeUsers
3. View Requirements
    - Home
    - Settings
    - Number requirements
    - Search number, hash, keyword, time, block
    - Discover requirement
    - View requirement
    - Add requirement
    * requirements.version
    * requirementNumber
4. Add requirement
    - Home
    - Settings
    - Upload file
    - Write data
        - Condition
        - Labeled Variables
        - Intermediate variables
        - Example Task
        - Example submission
    $ addRequirement
5. View Requirement
    - Home
    - Settings
    - Save locally
    - Discover Proposals
    - Propose update
    - File tree
    * requirements.requirementHash
    * requirements.version
    * requirements.validatorAddress
    * requirementNumber
6. Requirement proposal update
    - Home
    - Settings
    - Upload file
    - File tree
    - Write data
        - Condition
        - Labeled Variables
        - Intermediate variables
        - Example Task
        - Example submission
    * requirements.requirementHash
    * requirements.version
    * requirements.validatorAddress
    * requirementNumber
    $ updateRequirement
7. View requirement proposal update
    - Home
    - Settings
    - Upload file
    - File tree
    - View files
    * requirements.requirementHash
    * requirements.version
    * requirements.validatorAddress
    * requirementNumber
    $ voteRequirementUpdate
8. View Ethics Requirements
    - Home
    - Settings
    - Version
    - Discover proposals
    - Add proposal
    * ethicsRequirements
    * ethicsVersion
9. View Ethics Requirements update proposals
    - Home
    - Settings
    - Search number, hash, keyword, time, block, minVotes
    - Add proposal
    * ethicsVersion
    * ethicsProposalAddress
    * voteFor
10. Ethics Requirements proposal update
    - Home
    - Settings
    - Upload file
    - Write data
    * ethicsVersion
    * ethicsProposalsNumber
    $ updateEthicsRequirements
11. View ethics requirements proposal update
    - Home
    - Settings
    * ethicsUpdateProposals.ethicsRequirements
    * ethicsUpdateProposals.ethicsProposalAddress
    * ethicsUpdateProposals.didVote
    * ethicsUpdateProposals.votesFor
    $ voteEthicsRequirementsUpdate
12. View Tasks
    - Home
    - Settings
    - Number tasks
    - Number open tasks
    - Search number, hash, keyword, time, block
    - Discover task
    - View task
    - Add task
    - Task type
    * tasks.managerAddress
    * tasks.complete
    * tasks.totalWeiAmount
    * tasks.deadline
    * tasksNumber
13. View Hash Task
    - Home
    - Settings
    - Task number
    - Submit task
    - Discover task
        - Save locally
    - File tree
    * tasks.hashValue
    * tasks.requirementsHash
    * tasks.managerAddress
    * tasks.totalWei
    * tasks.deadline
    * tasks.taskComplete
    * tasks.keyReveal
    $ fundHashTask
    $ withdrawHashTask
14. Submit Hash Task
    - Home
    - Settings
    - Hash input
    - resulting hash
    * tasks.hashValue
    $ submitHashTask
15. Add hash task
    - hash value
    - requirements hash
    - seconds to deadline
    - reward
    - key reveal
    - I have read and follow ethics requierments
    - I have requirements publicly available at webpage
    * links
    $ addHashTask
16. View Double Hash Task
    - Home
    - Settings
    - Task number
    - Submit task
    - Discover task
        - Save locally
    - File tree
    * tasks.hashValue
    * tasks.requirementsHash
    * tasks.managerAddress
    * tasks.totalWei
    * tasks.deadline
    * tasks.taskComplete
    * tasks.keyReveal
    $ fundDoubleHashTask
    $ withdrawDoubleHashTask
17. Submit Double Hash Task
    - Home
    - Settings
    - Hash input
    - first hash
    - second hash
    - any correct responses
    - My time start
    - My time end
    * tasks.hashValue
    * tasks.timeStart
    * tasks.timeEnd
    * tasks.submissions.firstHash
    $ submitDoubleHashTask
    $ confirmDoubleHashTask
18. Add double hash task
    - hash value
    - requirements hash
    - seconds to deadline
    - reward
    - key reveal
    - response window
    - I have read and follow ethics requierments
    - I have requirements publicly available at webpage
    * links
    $ addDoubleHashTask
19. View Validator Hash Task
    - Home
    - Settings
    - Discover task
    - Submit task
    - Save locally
    - Validate task
    - View task submissions
    - File tree
    - Task defaulted
    * tasks.requirementsHash
    * tasks.submissionsNumber
    * tasks.requirementsNumber
    * tasks.validationTime
    * tasks.deadline
    * tasks.nextSlotTime
    * tasks.evaluatedSubmissionsNumber
    * tasks.blockValidationSchedule
    * tasks.taskComplete
    * tasks.managerAddress
    * tasks.completionAddress
    * tasks.validators
    * tasks.validatorComission
    * tasks.contributionTotalWei
    $ fundTask
    $ withdrawTask
20. Submit Validator Task
    - Home
    - Settings
    - Upload file
    - Acknowledge
    - Task defaulted
    * tasks.submissionsNumber
    * tasks.evaluatedSubmissionsNumber
    * tasks.deadline
    * tasks.taskComplete
    * tasks.validatorComission
    $ submitTask
21. Add validator task
    - Requirements hash
    - Number requirements
    - seconds to deadline
    - block schedule
    - validation time
    - validator addresses
    - validator comissison
    - reward
    - I have read and follow ethics requierments
    - I have requirements publicly available at webpage
    * links
    $ addTask
22. View task submissions
    - Home
    - Settings
    - Number submissions
    - Evaluated submissions
    - Task defaulted
    - Task complete
    - Discover submission
    - Open submission
    - Attempt download form user Alice/0x12341234
    * lastinteractionBlockIndex
    * usersData
    * links
    * tasks.taskDefaulted
    * tasks.taskComplete
    $ withdrawSubmissionCompletion
    $ withdrawSubmissionUnevaluated
23. Validate submission
    - Home
    - Settings
    - Check ethics requirement fulfilled
        - Check requirement x fulfilled for each requirement
    * task.requirementsNumber
    * task.submissionsNumber
    * task.evaluatedSubmissionsNumber
    * task.taskComplete
    * task.managerAddress
    * task.validators
    * task.submissions.workerAddress
    * task.submissions.submissionHash
    * task.submissions.validationStart
    * task.submissions.validationEnd
    * task.submissions.rejected
    $ validateTask
24. View Users
    - Home
    - Settings
    - Search by address, block
    - View account
    * usersData
    * users
25. View User
    - Home
    - Settings
    - address
    - Discover interactions
    - Joined
    * usersData
    - Save locally
    - User interactions
    - TheList interactions
    - HashTask interactions
    - DoubleHashTask interactions
    - ValidatorTask interactions
26. Learn
    - Home
    - Settings
    - Navigation
        - Home
        - Me
        - View Requirements
        - Add requirement
        - view requriement
        - Requirement proposal update
        - View requirement proposal update
        - View ethics reqrurements
        - View ethics requirements update Proposals
        - Ethics requirements proposal update
        - View Ethics requirements proposal update
        - View tasks
        - View hash task
        - Submit hash task
        - View double hash task
        - Submit double hash task
        - View validator task
        - Submit validator task
        - View task submissions
        - Validate submission
        - View users
        - View user
        - Learn
        - Settings
    - Theory
        - Safety
            - malware
            - privacy
            - scamming
        - Manager
        - Worker
        - Validator
        - Tasks
    - Code
        - Users.sol
        - TheList.sol
        - HashTask.sol
        - DoubleHashTask.sol
        - ValidatorTask.sol
27. Settings
    - Home
    - Whitelist users addresses
    - Blacklist users addresses


const hashTaskContractAddress = '0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0';
const doubleHashTaskContractAddress = '0xcf7ed3acca5a467e9e704c703e8d87f634fb0fc9';
const validatorTaskContractAddress = '0xdc64a140aa3e981100a9beca4e685f962f0cf6c9';
const usersContractAddress = '0x5fbdb2315678afecb367f032d93f642f64180aa3';
const theListContractAddress = '0xe7f1725e7734ce288f8367e1bb143e90bb3f0512';

zip -r foo.zip foo -x "*.DS_Store"
My address: 0x70997970c51812dc3a010c7d01b50e0d17dc79c8
Ethereum Address: 0x1E3c2a8a5F1a98A7042f5a2FC287A9f173528C3E
https://raw.githubusercontent.com/MabzGamesStudio/dr/main
Mabz
Nonce: 670
387a8233c96e1fc0ad5e284353276177af2186e7afa85296f106336e376669f7
1e84a4b9cbdb7af415f0f3f94189bc971e69ea100ee19e87e5429ba52eb360ed
e8b6d628aa68d0f061dc10b6131a1436d674bd45e8fb672a614f3d6553e51c8f

Task: 0x0e55392f368530bd3131fa9831f16c28889c4441a582e27e9aadd57877dd390e
