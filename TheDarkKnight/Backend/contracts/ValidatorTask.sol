// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "./Users.sol";

/// @title Validator Task
/// @author Peter Parker
/// @notice Manager defines task with trusted validator(s) to escrow the worker
/// submissions for a comission fee. If task requirements are met by a worker
/// submission, a validator evaluates it complete and the reward can be
/// withdrawn by the corresponding worker. If all validators passively allow the
/// validation deadline to expire, them no comission is given and the overlooked
/// worker submission is allowed to withdraw the reward.
contract ValidatorTask {

    // Validator Task
    struct Task {

        // Hash of the requirements file
        bytes32 taskHash;

        // Requirements count that need to be met for complete task
        uint64 requirementsCount;

        // Timespan in seconds allocated for validator(s) to evaluate the worker
        // submission
        uint64 evaluationTime;

        // Timestamp of the deadline for worker submissions
        uint64 deadline;

        // Timestamp following the final worker submission end time
        uint64 nextSlotTime;

        // Submissions count for the task
        uint64 submissionsCount;

        // Count of submissions that have completed evaluation
        uint64 evaluatedSubmissionsCount;

        // Whether the timespans of the evaluations overlap, if true the
        // timespans do not overlap and follow each other in blocks
        bool blockValidationSchedule;

        // Minimum seconds of delay until start of the evaluation timespan used
        // to allow for confirmation time of a transaction on the blockchain
        uint16 evaluationDelay;

        // Whether the task has been completed
        bool taskComplete;

        // Address of the manager that submitted the task
        address managerAddress;

        // Index of the submission that completed the task
        uint submissionCompletionIndex;

        // Addresses of the validators, any of which can evaluate the
        // worker submissions
        address[] validators;

        // Wei comission fee for the validator who evaluates any given worker
        // submission
        uint validatorComission;

        // All funders of the task
        mapping (address => uint) contributorsWeiAmounts;

        // Total amount of Wei funded to task
        uint contributionTotalWei;

        // All worker submissions
        mapping (uint => Submission) submissions;
    }

    // Worker submission for a task
    struct Submission {

        // Address of the worker who submitted to the task
        address workerAddress;

        // Hash of the worker submission file
        bytes32 submissionHash;

        // Timestamp of the start of the submission evaluation
        uint64 validationStart;

        // Whether the submission has been rejected by a validator with any
        // requirements not met
        bool rejected;

        // Whether the submission, and its fee, has been withdrawn by the worker
        // in the case where another worker has completed the task before the
        // submission
        bool withdrawn;
    }

    // Total count of validator tasks created by this contract
    uint64 public tasksCount;

    // Ethereum block index of the last interaction with this contract
    uint64 public lastInteractionBlockIndex;

    // All validator tasks
    mapping (uint => Task) public tasks;

    // Reference to the manager, worker, and validator users
    Users public usersContract;
    
    // Emitted when a new task has been added to the contract
    event AddTask(
        uint taskIndex,
        bytes32 taskHash,
        uint numRequirements,
        uint deadline,
        bool blockValidationSchedule,
        uint evaluationDelay,
        uint evaluationTime,
        address[] validators,
        uint validatorComission,
        address manager,
        uint64 lastInteractionBlockIndex
    );
    
    // Emitted when a new fund to a task has been made
    event FundTask(
        uint taskIndex,
        address funderAddress,
        uint reward,
        uint totalReward,
        uint64 lastInteractionBlockIndex
    );
    
    // Emitted when a new task submission has been made
    event SubmitTask(
        uint taskIndex,
        uint submissionIndex,
        bytes32 submissionHash,
        address workerAddress,
        uint64 lastInteractionBlockIndex
    );
    
    // Emitted when a task validation has been made
    event EvaluateTask(
        uint taskIndex,
        uint submissionIndex,
        address validatorAddress,
        uint[] unmetRequirementsEvalution,
        uint64 lastInteractionBlockIndex
    );
    
    // Emitted when task funds have been withdrawn after an incomplete task
    event WithdrawTask(
        uint taskIndex,
        address withdrawAddress,
        uint withdrawAmount,
        uint64 lastInteractionBlockIndex
    );
    
    // Emitted when a worker's submission has been withdrawn after its
    // evaluation deadline has been passed and defaults to complete
    event WithdrawSubmissionUnevaluated(
        uint taskIndex,
        uint submissionIndex,
        address workerAddress,
        uint withdrawAmount,
        uint64 lastInteractionBlockIndex
    );
    
    // Emitted when a worker's submission has been evaluated as complete by a
    // validator
    event WithdrawSubmissionCompletion(
        uint taskIndex,
        uint submissionIndex,
        address workerAddress,
        uint weiAmount,
        bool defaultCompletion,
        uint64 lastInteractionBlockIndex
    );

    /// @notice Validator task contract is generated with dependent users
    /// @param _usersContractAddress References to a dependent contract of
    /// manager, worker, and validator users
    constructor(address _usersContractAddress) {
        usersContract = Users(_usersContractAddress);
    }

    /// @notice Initializes a new validator task
    /// @param _taskHash Hash of the requirements file
    /// @param _numRequirements Requirements count that need to be met
    /// @param _secondsToDeadline Time in seconds until deadline for worker
    /// submissions
    /// @param _blockValidationSchedule Whether the timespans of the evaluations
    /// overlap
    /// @param _evaluationTime Timespan in seconds allocated for validator(s) to
    ///  evaluate the worker submission
    /// @param _validators Addresses of the validators
    /// @param _validatorComission Wei comission fee for the validator who
    /// evaluates any given worker submission
    function addTask(
        bytes32 _taskHash,
        uint _numRequirements,
        uint _secondsToDeadline,
        bool _blockValidationSchedule,
        uint16 _evaluationDelay,
        uint _evaluationTime,
        address[] memory _validators,
        uint _validatorComission
    ) public payable activeUser() {

        // Deadline validation
        require(_secondsToDeadline > 0, "Deadline must be in the future");

        // Initializes information of task
        Task storage thisTask = tasks[tasksCount];
        thisTask.taskHash = _taskHash;
        thisTask.requirementsCount = (uint64)(_numRequirements);
        thisTask.deadline = (uint64)(block.timestamp + _secondsToDeadline);
        thisTask.evaluationDelay = _evaluationDelay;
        thisTask.blockValidationSchedule = _blockValidationSchedule;
        thisTask.validators = _validators;
        thisTask.managerAddress = msg.sender;
        thisTask.validatorComission = _validatorComission;
        thisTask.contributorsWeiAmounts[msg.sender] = msg.value;
        thisTask.contributionTotalWei = msg.value;
        thisTask.evaluationTime = (uint64)(_evaluationTime);

        // Emit task information
        emit AddTask(
            tasksCount,
            _taskHash,
            _numRequirements,
            thisTask.deadline,
            _blockValidationSchedule,
            _evaluationDelay,
            _evaluationTime,
            _validators,
            _validatorComission,
            msg.sender,
            lastInteractionBlockIndex
        );

        // Update interaction block index and number of tasks
        lastInteractionBlockIndex = (uint64)(block.number);
        tasksCount++;
    }

    /// @notice Adds funds to an existing task
    /// @param _taskIndex Index of the validator task
    function fundTask(
        uint _taskIndex
    ) public payable existingTask(_taskIndex) incompleteTask(_taskIndex) {

        // Task can only be funded if it has not completed, not defaulted, and
        // not reached its submission deadline
        require(
            block.timestamp <= tasks[_taskIndex].deadline,
            "Task deadline has passed"
        );

        // Make sure task has not already defaulted to a previous submission
        require(!taskDefaulted(_taskIndex), "Task defaulted");

        // Add funds to the task contributor and total
        tasks[_taskIndex].contributorsWeiAmounts[msg.sender] += msg.value;
        tasks[_taskIndex].contributionTotalWei += msg.value;

        // Emit task funding information
        emit FundTask(
            _taskIndex,
            msg.sender,
            msg.value,
            tasks[_taskIndex].contributionTotalWei,
            lastInteractionBlockIndex
        );

        // Update interaction block index
        lastInteractionBlockIndex = (uint64)(block.number);
    }

    /// @notice Creates a worker submission for a given task and designates the
    /// validator evaluation timespan for the submission
    /// @param _taskIndex Index of the validator task
    /// @param _submissionHash Hash of the worker submission file
    function submitTask(
        uint _taskIndex,
        bytes32 _submissionHash
    ) public payable activeUser() existingTask(_taskIndex)
    incompleteTask(_taskIndex) {

        // Validator comission fee and deadline validation
        Task storage thisTask = tasks[_taskIndex];
        require(
            thisTask.validatorComission == msg.value,
            "Invalid task submission validator commission"
        );
        require(
            block.timestamp <= thisTask.deadline,
            "Task deadline has passed"
        );

        // Make sure task has not already defaulted to a previous submission
        require(!taskDefaulted(_taskIndex), "Task defaulted");

        // Start of the validator evaluation timespan to be assigned depending
        // on existing submissions and block schedule
        uint nextTimeSlotStart;

        // Earliest validator evaluation start time
        uint timestampOffset = block.timestamp + thisTask.evaluationDelay;

        // If following a block schedule, then set the time slot to the next
        // available free time (with delay if free now), otherwise always set
        // time slot to now (with a delay)
        if (thisTask.blockValidationSchedule) {
            if (thisTask.nextSlotTime < timestampOffset) {
                nextTimeSlotStart = timestampOffset;
            } else {
                nextTimeSlotStart = thisTask.nextSlotTime;
            }
        } else {
            nextTimeSlotStart = timestampOffset;
        }

        // Initialize submission information
        Submission storage thisTaskSubmission
            = thisTask.submissions[tasks[_taskIndex].submissionsCount];
        thisTaskSubmission.validationStart = (uint64)(nextTimeSlotStart);
        thisTask.nextSlotTime
            = (uint64)(nextTimeSlotStart + thisTask.evaluationTime);
        thisTaskSubmission.workerAddress = msg.sender;
        thisTaskSubmission.submissionHash = _submissionHash;

        // Emit worker submission information
        emit SubmitTask(
            _taskIndex,
            thisTask.submissionsCount,
            _submissionHash,
            msg.sender,
            lastInteractionBlockIndex
        );

        // Update interaction block index and task submissions count
        lastInteractionBlockIndex = (uint64)(block.number);
        thisTask.submissionsCount++;
    }

    /// @notice Evaluates the given submission with the given unmet requirements
    /// evaluation and rejects or accepts the submission. If the submission is
    /// rejected, then the non-zero indices of the unmet requirements array show
    /// which requirements were evaluated as incomplete. If the submission is
    /// accepted, then the submission worker can withdraw the reward and any
    /// following submissions are discarded, but the workers can withdraw the
    /// validator comission since its evaluation is no longer needed.
    /// @param _taskIndex Index of the validator task
    /// @param _submissionIndex Index of the submission within in given task
    /// @param _validatorIndex Index of the validator evaluating in the
    /// validators array in the given task
    /// @param _unmetRequirementsEvalution Evaluation of the validator where a
    /// binary 1 digit represents an unmet requirement at the corresponding
    /// digit, any nonzero element indicates a submission rejection
    function evaluateTask(
        uint _taskIndex,
        uint _submissionIndex,
        uint _validatorIndex,
        uint[] memory _unmetRequirementsEvalution
    ) public payable existingTask(_taskIndex) incompleteTask(_taskIndex) {

        // Make sure task has not already defaulted to a previous submission
        Task storage thisTask = tasks[_taskIndex];
        require(!taskDefaulted(_taskIndex), "Task defaulted");

        // Validator and submission validation, submissions must be evaluated in
        // order of timestamp
        require(
            thisTask.validators[_validatorIndex] == msg.sender,
            "Validator does not match expected"
        );
        require(
            thisTask.evaluatedSubmissionsCount == _submissionIndex,
            "Invalid submission index"
        );

        // Validator evaluation timespan validation
        Submission storage thisTaskSubmission
            = thisTask.submissions[_submissionIndex];
        require(
            thisTaskSubmission.validationStart < block.timestamp
                && block.timestamp <=
                    thisTaskSubmission.validationStart
                    + thisTask.evaluationTime,
            "Validation not completed within time window"
        );

        // Correct structure of evaluation validation
        require(
            validEvaluation(
                thisTask.requirementsCount + 1,
                _unmetRequirementsEvalution
            ),
            "Invalid evaluation data"
        );

        // Reject or accept the submission
        if (metRequirements(_unmetRequirementsEvalution)) {
            thisTask.taskComplete = true;
            thisTask.submissionCompletionIndex = _submissionIndex;
        } else {
            thisTaskSubmission.rejected = true;
        }

        // Transfer submission evalution comission to validator
        (bool success,)
            = msg.sender.call{value: thisTask.validatorComission}("");
        require(success, "Error withdrawing funds from task");
        
        // Emit evaluation information
        emit EvaluateTask(
            _taskIndex,
            _submissionIndex,
            msg.sender,
            _unmetRequirementsEvalution,
            lastInteractionBlockIndex
        );

        // Update interaction block index and evaluated submissions count
        lastInteractionBlockIndex = (uint64)(block.number);
        thisTask.evaluatedSubmissionsCount++;
    }

    /// @notice Withdraws the contributor's funds from the given incomplete task
    /// @param _taskIndex Index of the validator task
    function withdrawTask(
        uint _taskIndex
    ) public payable existingTask(_taskIndex) {

        // Deadline validation
        Task storage thisTask = tasks[_taskIndex];
        require(
            block.timestamp > thisTask.deadline,
            "Must wait for task deadline"
        );

        // Must wait for all submission evaluation timespans to pass
        require(
            block.timestamp > thisTask.nextSlotTime,
            "Must wait for pending submissions"
        );

        // Task must be incomplete for contributor to withdraw funds
        require(
            !thisTask.taskComplete && !taskDefaulted(_taskIndex),
            "Task already completed"
        );

        // Transfer funds back to contributor
        (bool success,) = msg.sender.call{
            value: thisTask.contributorsWeiAmounts[msg.sender]
        }("");
        require(success, "Error withdrawing funds from task");

        // Emit the withdraw information
        emit WithdrawTask(
            _taskIndex,
            msg.sender,
            thisTask.contributorsWeiAmounts[msg.sender],
            lastInteractionBlockIndex
        );

        // Update the contributor balance and interaction block index
        thisTask.contributorsWeiAmounts[msg.sender] = 0;
        lastInteractionBlockIndex = (uint64)(block.number);
    }

    /// @notice Worker withdraws task reward with either defaulted or accepted
    /// completion
    /// @param _taskIndex Index of the validator task
    /// @param _submissionIndex Index of the submission in the given task
    function withdrawSubmissionCompletion(
        uint _taskIndex,
        uint _submissionIndex
    ) public payable existingTask(_taskIndex) {

        // Task submission index must be within bounds of task submissions
        Task storage thisTask = tasks[_taskIndex];
        require(
            _submissionIndex < thisTask.submissionsCount,
            "Task submission index out of bounds"
        );

        // Worker can only withdraw reward once
        Submission storage thisSubmission
            = thisTask.submissions[_submissionIndex];
        require(!thisSubmission.withdrawn, "Submission already withdrawn");

        // Whether the submission is complete from validators missing evaluation
        // timespan causing the submission to default as complete
        bool defaultCompletion = taskDefaulted(_taskIndex)
                && _submissionIndex == thisTask.evaluatedSubmissionsCount;

        // Wei value rewarded to worker for completion
        uint workerReward = thisTask.contributionTotalWei;
        
        // If the submission is defaulted to complete, then additionally
        // withdraw the unevaluated validator comission and update the task
        // completion information
        if (defaultCompletion) {
            workerReward += thisTask.validatorComission;
            thisTask.taskComplete = true;
            thisTask.submissionCompletionIndex = _submissionIndex;
        }

        // Validate the worker and submission withdrawing reward
        require(
            _submissionIndex == thisTask.submissionCompletionIndex
                || defaultCompletion,
            "Unauthorized submission index"
        );
        require(
            thisSubmission.workerAddress == msg.sender,
            "Unauthorized worker address"
        );

        // Transfer the reward to the worker
        (bool success,) = msg.sender.call{value: workerReward}("");
        require(success, "Error withdrawing funds from task");

        // Emit the worker withdraw information
        emit WithdrawSubmissionCompletion(
            _taskIndex,
            _submissionIndex,
            msg.sender,
            thisTask.contributionTotalWei,
            defaultCompletion,
            lastInteractionBlockIndex
        );

        // Update the submission withdrawn and interaction block index
        // information
        thisSubmission.withdrawn = true;
        lastInteractionBlockIndex = (uint64)(block.number);
    }

    /// @notice When a previous submission is complete by default or accepted,
    /// the unevaluated submission can withdraw the validator comission fee
    /// @param _taskIndex Index of the validator task
    /// @param _submissionIndex Index of the submission in the given task
    function withdrawSubmissionUnevaluated(
        uint _taskIndex,
        uint _submissionIndex
    ) public payable existingTask(_taskIndex) {

        // Task submission index must be within bounds of task submissions
        Task storage thisTask = tasks[_taskIndex];
        require(
            _submissionIndex < thisTask.submissionsCount,
            "Task submission index out of bounds"
        );

        // Withdraw only available after task completion or task defaulted to a
        // previous submission
        Submission storage thisSubmission
            = thisTask.submissions[_submissionIndex];
        require(
            thisTask.taskComplete || taskDefaulted(_taskIndex),
            "Withdraw only available after task completion"
        );

        // Submission must be unevaluated and not already withdrawn
        require(!thisSubmission.rejected, "Submission already rejected");
        require(!thisSubmission.withdrawn, "Submission already withdrawn");

        // If the task defaulted, then the worker can only withdraw when it is
        // not the defaulted submission, otherwise the task is complete and the
        // worker can only withdraw when it is not the accepted submission
        if (taskDefaulted(_taskIndex)) {
            require(
                _submissionIndex != thisTask.evaluatedSubmissionsCount,
                "Can not withdraw reward through this function"
            );
        } else {
            require(
                _submissionIndex != thisTask.evaluatedSubmissionsCount - 1,
                "Can not withdraw reward through this function"
            );
        }

        // Validate worker withdrawing comission fee
        require(
            thisSubmission.workerAddress == msg.sender,
            "Unauthorized worker address"
        );

        // Transfer comission fee back to worker
        (bool success,)
            = msg.sender.call{value: thisTask.validatorComission}("");
        require(success, "Error withdrawing funds from task");

        // Emit submission withdrawn information
        emit WithdrawSubmissionUnevaluated(
            _taskIndex,
            _submissionIndex,
            msg.sender,
            thisTask.validatorComission,
            lastInteractionBlockIndex
        );

        // Update submission withdrawn and last interaction block index
        thisSubmission.withdrawn = true;
        lastInteractionBlockIndex = (uint64)(block.number);
    }

    /// @notice Validate the length of the requirements array and that the
    /// leftmost overflow of binary digits are 0s, so there is a clear 1-to-1
    /// mapping between unment requirements and corresponding binary 1 digits
    /// @param _numRequirements Number of requirements for the task
    /// @param _unmetRequirementsEvalution Evaluation by the validator where a
    /// binary 1 digit represents an unmet requirement at the corresponding
    /// digit
    /// @return Whether the evaluation follows the correct structure
    function validEvaluation(
        uint _numRequirements,
        uint[] memory _unmetRequirementsEvalution
    ) private pure returns (bool) {

        // Expected length of the array from the number of requirements
        uint expectedLength = (_numRequirements - 1) / 256 + 1;

        // If requirements exceed 256, then validate the length of array matches
        // expected array size to fit the number of requirements
        if (expectedLength != _unmetRequirementsEvalution.length) {
            return false;
        }

        // If the number of requirements is divisible by 256, then there can be
        // no incorrect structure given the array length is correct
        if (_numRequirements % 256 == 0) {
            return true;
        }

        // Binary digit to the left of the leftmost requirement digit
        uint finalDigit = 1 << (_numRequirements % 256);

        // All binary digits at or to the left of the final digit must be 0
        uint lastEvaluationElement = _unmetRequirementsEvalution[
            _unmetRequirementsEvalution.length - 1
        ];
        if (lastEvaluationElement >= finalDigit) {
            return false;
        }

        // If both validations pass, the evaluation follows correct structure
        return true;
    }

    /// @notice Determines whether the input indicates a rejection, and assumes
    /// input has valid structure
    /// @param _unmetRequirementsEvalution Evaluation by the validator where a
    /// binary 1 digit represents an unmet requirement at the corresponding
    /// digit
    /// @return Whether the input indicates a rejection
    function metRequirements(
        uint[] memory _unmetRequirementsEvalution
    ) private pure returns (bool) {

        // Any nonzero element indicates rejection
        for (uint i = 0; i < _unmetRequirementsEvalution.length; i++) {
            if (_unmetRequirementsEvalution[i] != 0) {
                return false;
            }
        }
        return true;
    }

    /// @notice Whether a task has defaulted by validators missing the
    /// evaluation window for a submission
    /// @param _taskIndex Index of the validator task
    /// @return Whether the given task has defaulted
    function taskDefaulted(uint _taskIndex) public view returns (bool) {

        // Whether there exist submissions that have not been evaluated
        Task storage thisTask = tasks[_taskIndex];
        bool submissionUnevaluated
            = thisTask.evaluatedSubmissionsCount < thisTask.submissionsCount;

        // Whether the next submission in the evaluation lineup has a deadline
        // that has passed
        bool evaluationDeadlineMissed
            = block.timestamp
                > thisTask.submissions[
                    thisTask.evaluatedSubmissionsCount
                ].validationStart
                + thisTask.evaluationTime;

        // There must be more submissions than evaluations, the next submission
        // to be evaluated has a deadline that has passed, and the task has not
        // already been complete are necessary for the task to be defaulted
        return submissionUnevaluated
            && evaluationDeadlineMissed
            && !thisTask.taskComplete;
    }

    /// @notice Requires the message address to be an active user in this
    /// contract's corresponding Users contract
    modifier activeUser() {
        require(usersContract.activeUsers(msg.sender), "Inactive account");
        _;
    }

    /// @notice Requires the task index to be within the bounds of existing
    /// tasks
    /// @param _taskIndex Index of the validator task
    modifier existingTask(uint _taskIndex) {
        require(_taskIndex < tasksCount, "Task index out of bounds");
        _;
    }

    /// @notice Requires the given task to not have been completed
    /// @param _taskIndex Index of the validator task
    modifier incompleteTask(uint _taskIndex) {
        require(!tasks[_taskIndex].taskComplete, "Task already completed");
        _;
    }

    /// @notice Gets the requirements hash of the given task
    /// @param _taskIndex Index of the validator task
    /// @return Requirements hash of the given task
    function getTaskHash(
        uint _taskIndex
    ) public view returns (bytes32) {
        return tasks[_taskIndex].taskHash;
    }

    /// @notice Gets the number of submissions of the given task
    /// @param _taskIndex Index of the validator task
    /// @return Number of submissions of the given task
    function getSubmissionsCount(
        uint _taskIndex
    ) public view returns (uint64) {
        return tasks[_taskIndex].submissionsCount;
    }

    /// @notice Gets the number of requirements of the given task
    /// @param _taskIndex Index of the validator task
    /// @return Number of requirements of the given task
    function getRequirementsCount(
        uint _taskIndex
    ) public view returns (uint64) {
        return tasks[_taskIndex].requirementsCount;
    }

    /// @notice Gets the validation timespan of the given task
    /// @param _taskIndex Index of the validator task
    /// @return Validation timespan of the given task
    function getValidationTime(uint _taskIndex) public view returns (uint64) {
        return tasks[_taskIndex].evaluationTime;
    }

    /// @notice Gets the deadline timestamp of the given task
    /// @param _taskIndex Index of the validator task
    /// @return Deadline timestamp of the given task
    function getDeadline(uint _taskIndex) public view returns (uint64) {
        return tasks[_taskIndex].deadline;
    }

    /// @notice Gets the next available evaluation start time for a submission
    /// for the given task
    /// @param _taskIndex Index of the validator task
    /// @return Next available evaluation start time for a submission for the
    /// given task
    function getNextSlotTime(uint _taskIndex) public view returns (uint64) {
        return tasks[_taskIndex].nextSlotTime;
    }

    /// @notice Gets the number of submissions evaluated for the given task
    /// @param _taskIndex Index of the validator task
    /// @return Number of submissions evaluated for the given task
    function getEvaluatedSubmissionsCount(
        uint _taskIndex
    ) public view returns (uint64) {
        return tasks[_taskIndex].evaluatedSubmissionsCount;
    }

    /// @notice Gets whether the given task follows a block schedule or allows
    /// for overlap in evaluation timespand
    /// @param _taskIndex Index of the validator task
    /// @return Whether the given task follows a block schedule or allows for
    /// overlap in evaluation timespand
    function getBlockValidationSchedule(
        uint _taskIndex
    ) public view returns (bool) {
        return tasks[_taskIndex].blockValidationSchedule;
    }

    /// @notice Gets the minimum seconds of delay until start of the evaluation
    /// timespan
    /// @param _taskIndex Index of the validator task
    /// @return Minimum seconds of delay until start of the evaluation timespan
    function getValidationDelay(
        uint _taskIndex
    ) public view returns (uint16) {
        return tasks[_taskIndex].evaluationDelay;
    }

    /// @notice Gets whether the given task is complete
    /// @param _taskIndex Index of the validator task
    /// @return Whether the given task is complete
    function getTaskComplete(uint _taskIndex) public view returns (bool) {
        return tasks[_taskIndex].taskComplete;
    }

    /// @notice Gets the submission completion index of the given task
    /// @param _taskIndex Index of the validator task
    /// @return Submission completion index of the given task
    function getCompletionSubmissionIndex(
        uint _taskIndex
    ) public view returns (uint) {
        return tasks[_taskIndex].submissionCompletionIndex;
    }

    /// @notice Gets the manager address of the given task
    /// @param _taskIndex Index of the validator task
    /// @return Manager address of the given task
    function getManagerAddress(uint _taskIndex) public view returns (address) {
        return tasks[_taskIndex].managerAddress;
    }

    /// @notice Gets the array of validators for the given task
    /// @param _taskIndex Index of the validator task
    /// @return Array of validators for the given task
    function getValidators(
        uint _taskIndex
    ) public view returns (address[] memory) {
        return tasks[_taskIndex].validators;
    }

    /// @notice Gets the validator comission value in Wei for the given task
    /// @param _taskIndex Index of the validator task
    /// @return Validator comission value in Wei for the given task
    function getValidatorComission(uint _taskIndex) public view returns (uint) {
        return tasks[_taskIndex].validatorComission;
    }

    /// @notice Gets the Wei contribution by the given address to the given task
    /// @param _taskIndex Index of the validator task
    /// @param _contributorAddress Address of the contributor
    /// @return Wei contribution by the given address to the given task
    function getWeiContribution(
        uint _taskIndex,
        address _contributorAddress
    ) public view returns (uint) {
        return tasks[_taskIndex].contributorsWeiAmounts[_contributorAddress];
    }

    /// @notice Gets the total reward in Wei for the given task
    /// @param _taskIndex Index of the validator task
    /// @return Total reward in Wei for the given task
    function getContributionTotalWei(
        uint _taskIndex
    ) public view returns (uint) {
        return tasks[_taskIndex].contributionTotalWei;
    }

    /// @notice Gets the worker address for the given submission
    /// @param _taskIndex Index of the validator task
    /// @param _submissionIndex Index of the submission within the given task
    /// @return Worker address for the given submission
    function getSubmissionWorkerAddress(
        uint _taskIndex,
        uint _submissionIndex
    ) public view returns (address) {
        return tasks[_taskIndex].submissions[_submissionIndex].workerAddress;
    }

    /// @notice Gets the submission hash for the given submission
    /// @param _taskIndex Index of the validator task
    /// @param _submissionIndex Index of the submission within the given task
    /// @return Submission hash for the given submission
    function getSubmissionHash(
        uint _taskIndex,
        uint _submissionIndex
    ) public view returns (bytes32) {
        return tasks[_taskIndex].submissions[_submissionIndex].submissionHash;
    }

    /// @notice Gets the submission evaluation start time timestamp for the
    /// given submission
    /// @param _taskIndex Index of the validator task
    /// @param _submissionIndex Index of the submission within the given task
    /// @return Submission evaluation start time timestamp for the given
    /// submission
    function getSubmissionValidationStart(
        uint _taskIndex,
        uint _submissionIndex
    ) public view returns (uint64) {
        return tasks[_taskIndex].submissions[_submissionIndex].validationStart;
    }

    /// @notice Gets the submission evaluation end time timestamp for the given
    /// submission
    /// @param _taskIndex Index of the validator task
    /// @param _submissionIndex Index of the submission within the given task
    /// @return submission Evaluation end time timestamp for the given
    /// submission
    function getSubmissionValidationEnd(
        uint _taskIndex,
        uint _submissionIndex
    ) public view returns (uint64) {
        return tasks[_taskIndex].submissions[_submissionIndex].validationStart
            + tasks[_taskIndex].evaluationTime;
    }

    /// @notice Gets whether the given submission has been rejected
    /// @param _taskIndex Index of the validator task
    /// @param _submissionIndex Index of the submission within the given task
    /// @return Whether the given submission has been rejected
    function getSubmissionRejected(
        uint _taskIndex,
        uint _submissionIndex
    ) public view returns (bool) {
        return tasks[_taskIndex].submissions[_submissionIndex].rejected;
    }

    /// @notice Gets whether the given submission reward and/or fee has been
    /// withdrawn by completion, default, or incomplete
    /// @param _taskIndex Index of the validator task
    /// @param _submissionIndex Index of the submission within the given task
    /// @return Whether the given submission reward and/or fee has been
    /// withdrawn by completion, default, or incomplete
    function getSubmissionWithdrawn(
        uint _taskIndex,
        uint _submissionIndex
    ) public view returns (bool) {
        return tasks[_taskIndex].submissions[_submissionIndex].withdrawn;
    }
}