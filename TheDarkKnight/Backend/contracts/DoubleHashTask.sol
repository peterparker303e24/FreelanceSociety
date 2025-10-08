// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "./Users.sol";

/// @title Double Hash Task Response
/// @author Peter Parker
/// @notice Worker completes the task by deducing the pre-preimage, then
/// announces the preimage to schedule a response time block to prevent
/// frontrunning, then collects the reward by announcing the pre-preimage at
/// their time block
contract DoubleHashTask {

    // Double hash task
    struct Task {

        // Hashed hash value of the pre-preimage
        bytes32 hashValue;

        // Hash of the requirement directions to obtain the pre-preimage
        bytes32 taskHash;

        // Manager who initially creates and funds the task
        address managerAddress;

        // All funders of the task
        mapping (address => uint) contributorsWeiAmounts;

        // Total amount of Wei funded to task
        uint contributionTotalWei;

        // Time of the deadline for worker responses
        uint64 deadline;

        // Whether task has already been completed
        bool taskComplete;

        // Whether the manager must reveal the pre-preimage to withdraw their
        // task funds
        bool keyReveal;

        // Seconds of time window for worker to submit second response
        uint32 secondResponseWindow;

        // Minimum seconds of delay until start of the second response window
        uint16 secondResponseDelay;

        // Count of worker responses announcing the preimage
        uint64 responseCount;

        // Timestamp of the next available time block start
        uint64 nextSlotTime;

        // All responses announced for this task
        mapping (uint => TaskResponse) responses;
    }

    // First response for preimage announcement
    struct TaskResponse {

        // Worker address that announced the task response
        address workerAddress;

        // Timestamp second response time window start
        uint64 responseWindowStart;
    }

    // Ethereum block index of the last interaction with this contract
    uint64 public lastInteractionBlockIndex;

    // Count of double hash tasks created by this contract
    uint64 public tasksCount;

    // All tasks created by this contract
    mapping (uint => Task) public tasks;

    // Reference to the manager, worker, and validator users
    Users public usersContract;

    // Emitted when a new double hash task is created
    event NewDoubleTask(
        uint taskIndex,
        bytes32 hashValue,
        bytes32 taskHash,
        address managerAddress,
        uint reward,
        uint deadline,
        bool keyReveal,
        uint32 secondResponseWindow,
        uint64 lastInteractionBlockIndex
    );

    // Emitted when an existing task has funds added to it
    event DoubleTaskFunded(
        uint taskIndex,
        address funderAddress,
        uint reward,
        uint totalReward,
        uint64 lastInteractionBlockIndex
    );

    // Emitted when the preimage first response is announced
    event DoubleTaskSubmit(
        uint taskIndex,
        uint responseIndex,
        bytes32 firstHashValueKey,
        address submissionWorker,
        uint64 responseStartTime,
        uint64 responseEndTime,
        uint64 lastInteractionBlockIndex
    );

    // Emitted when the pre-preimage second response is announced, and the task
    // is completed
    event DoubleTaskComplete(
        uint taskIndex,
        uint responseIndex,
        bytes32 secondHashValueKey,
        address completionWorker,
        uint totalReward,
        uint64 lastInteractionBlockIndex
    );

    // Emitted when a task has gone incomplete, and funds are withdrawn
    event DoubleTaskWithdrawn(
        uint taskIndex,
        bytes32 keyReveal,
        uint weiAmount,
        address withdrawAddress,
        uint64 lastInteractionBlockIndex
    );

    /// @notice Double hash task contract is generated with dependent users
    /// @param _usersContractAddress References to a dependent contract of
    /// manager, worker, and validator users
    constructor(address _usersContractAddress) {
        usersContract = Users(_usersContractAddress);
    }

    /// @notice A manager creates a new task
    /// @param _hashValue Hashed hash value of the pre-preimage
    /// @param _taskHash Hash of the requirement directions to obtain the
    /// pre-preimage
    /// @param _secondsToDeadline Seconds from now until worker submission
    /// deadline
    /// @param _keyReveal Whether the manager must reveal the preimage to obtain
    /// funds after the deadline
    /// @param _responseWindow Time window in seconds for the second response
    /// @param _responseDelay Time in secods delay between first response and
    /// second response
    function addDoubleHashTask(
        bytes32 _hashValue,
        bytes32 _taskHash,
        uint64 _secondsToDeadline,
        bool _keyReveal,
        uint32 _responseWindow,
        uint16 _responseDelay
    ) public payable {

        // Manager user must be active and task must include reasonable timing
        require(usersContract.activeUsers(msg.sender), "Inactive account");
        require(_secondsToDeadline > 0, "Deadline must be in the future");
        require(_responseWindow > 0, "Response window must be positive");

        // Assign initialization variables to the task object
        Task storage thisTask = tasks[tasksCount];
        thisTask.hashValue = _hashValue;
        thisTask.taskHash = _taskHash;
        thisTask.managerAddress = msg.sender;
        thisTask.contributorsWeiAmounts[msg.sender] = msg.value;
        thisTask.contributionTotalWei += msg.value;
        thisTask.deadline = (uint64)(block.timestamp + _secondsToDeadline);
        thisTask.secondResponseWindow = _responseWindow;
        thisTask.secondResponseDelay = _responseDelay;
        thisTask.keyReveal = _keyReveal;

        // Emit the task information
        emit NewDoubleTask(
            tasksCount,
            _hashValue,
            _taskHash,
            msg.sender,
            msg.value,
            thisTask.deadline,
            _keyReveal,
            thisTask.secondResponseWindow,
            lastInteractionBlockIndex
        );

        // Update block interaction index and new task count
        lastInteractionBlockIndex = (uint64)(block.number);
        tasksCount++;
    }

    /// @notice A manager creates a new task
    /// @param _taskIndex Index of the double hash task
    function fundDoubleHashTask(
        uint _taskIndex
    ) public payable activeTask(_taskIndex) {

        // Workers can only submit up to the task deadline
        Task storage thisTask = tasks[_taskIndex];
        require(
            block.timestamp <= thisTask.deadline,
            "Task deadline has passed"
        );

        // Funds are added to the associated contributor and added to the total
        // task reward value
        thisTask.contributorsWeiAmounts[msg.sender] += msg.value;
        thisTask.contributionTotalWei += msg.value;

        // Emit the fund information and update the interaction block index
        emit DoubleTaskFunded(
            _taskIndex,
            msg.sender,
            msg.value,
            thisTask.contributionTotalWei,
            lastInteractionBlockIndex
        );
        lastInteractionBlockIndex = (uint64)(block.number);
    }

    /// @notice A worker announces the preimage to schedule their second
    /// response time block
    /// @param _taskIndex Double hash task index
    /// @param _firstHashValue Hash of the pre-preimage
    function submitDoubleHashTask(
        uint _taskIndex,
        bytes32 _firstHashValue
    ) public activeTask(_taskIndex) {

        // Meet submission deadline and preimage requirements
        Task storage thisTask = tasks[_taskIndex];
        require(
            block.timestamp <= thisTask.deadline,
            "Task deadline has passed"
        );
        require(
            keccak256(abi.encode(_firstHashValue)) == thisTask.hashValue,
            "First hash value does not match expected"
        );

        // Initialize task response and second response time block window
        TaskResponse storage thisTaskResponse
            = thisTask.responses[thisTask.responseCount];
        uint delayedStart = block.timestamp + thisTask.secondResponseDelay;
        uint nextTimeSlotStart;
        if (thisTask.nextSlotTime < delayedStart) {
            nextTimeSlotStart = delayedStart;
        } else {
            nextTimeSlotStart = thisTask.nextSlotTime;
        }

        // Initialize response information
        thisTaskResponse.responseWindowStart = (uint64)(nextTimeSlotStart);
        thisTask.nextSlotTime
            = (uint64)(nextTimeSlotStart + thisTask.secondResponseWindow);
        thisTaskResponse.workerAddress = msg.sender;

        // Emit first response information, and update interaction block index
        // and task response count
        emit DoubleTaskSubmit(
            _taskIndex,
            thisTask.responseCount,
            _firstHashValue,
            msg.sender,
            thisTaskResponse.responseWindowStart,
            (uint64)(nextTimeSlotStart + thisTask.secondResponseWindow),
            lastInteractionBlockIndex
        );
        lastInteractionBlockIndex = (uint64)(block.number);
        thisTask.responseCount++;
    }

    /// @notice A worker announces the pre-preimage during their time block to
    /// complete the task
    /// @param _taskIndex Double hash task index
    /// @param _responseIndex Index of the responses among this task
    /// @param _secondHashValue Pre-preimage value
    function confirmDoubleHashTask(
        uint _taskIndex,
        uint _responseIndex,
        bytes32 _secondHashValue
    ) public payable activeTask(_taskIndex) {

        // Task submission input and timing should be valid
        Task storage thisTask = tasks[_taskIndex];
        require(
            _responseIndex < thisTask.responseCount,
            "Task response index out of bounds"
        );
        TaskResponse memory thisTaskResponse
            = thisTask.responses[_responseIndex];
        require(
            thisTaskResponse.workerAddress == msg.sender,
            "Sender address does not match"
        );
        require(
            thisTaskResponse.responseWindowStart <= block.timestamp
                && block.timestamp < (uint64)(
                    thisTaskResponse.responseWindowStart
                    + thisTask.secondResponseWindow
                ),
            "Submission not completed within time window"
        );
        require(
            keccak256(abi.encode(
                keccak256(abi.encode(_secondHashValue))
            )) == thisTask.hashValue,
            "Second hash value does not match expected"
        );

        // Transfer reward to sender
        (bool success,)
            = msg.sender.call{value: thisTask.contributionTotalWei}("");
        require(
            success,
            "Error transferring funds of successful task completion"
        );

        // Emit task completion information, and update task complete value and
        // interaction block index
        emit DoubleTaskComplete(
            _taskIndex,
            _responseIndex,
            _secondHashValue,
            msg.sender,
            thisTask.contributionTotalWei,
            lastInteractionBlockIndex
        );
        thisTask.taskComplete = true;
        lastInteractionBlockIndex = (uint64)(block.number);
    }

    /// @notice A user withdraws funds they contributed to the given task
    /// @param _taskIndex Index of the double hash task
    /// @param _keyReveal Pre-preimage value
    function withdrawDoubleHashTask(
        uint _taskIndex,
        bytes32 _keyReveal
    ) public payable activeTask(_taskIndex) {

        // Withdraw funds only after deadline and all response window terminate
        Task storage thisTask = tasks[_taskIndex];
        require(
            block.timestamp > thisTask.deadline,
            "Must wait for task deadline"
        );
        require(
            block.timestamp > thisTask.nextSlotTime,
            "Must wait for pending submissions"
        );

        // If manager is withdrawing and specified keyReveal as true, then they
        // must announce the pre-preimage to withdraw funds.
        require(
            !thisTask.keyReveal
                || msg.sender != thisTask.managerAddress
                || keccak256(abi.encode(
                    keccak256(abi.encode(_keyReveal))
                )) == thisTask.hashValue,
            "Manger must reveal key to withdraw funds"
        );

        // Remove sender contribution from the task and give to sender
        uint weiAmount = thisTask.contributorsWeiAmounts[msg.sender];
        (bool success,) = msg.sender.call{value: weiAmount}("");
        require(success, "Error withdrawing funds from task");
        thisTask.contributorsWeiAmounts[msg.sender] = 0;

        // Emit withdraw information and update interaction block index
        emit DoubleTaskWithdrawn(
            _taskIndex,
            _keyReveal,
            weiAmount,
            msg.sender,
            lastInteractionBlockIndex
        );
        lastInteractionBlockIndex = (uint64)(block.number);
    }

    /// @notice Requires task index to exist and not yet been completed
    /// @param _taskIndex Index of the double hash task
    modifier activeTask(uint _taskIndex) {
        require(_taskIndex < tasksCount, "Task index out of bounds");
        require(!tasks[_taskIndex].taskComplete, "Task already completed");
        _;
    }

    /// @notice Gets the hash of the hash of the task pre-preimage
    /// @param _taskIndex Index of the double hash task
    /// @return Hash of the hash of the task pre-preimage
    function getDoubleHashTaskHash(
        uint _taskIndex
    ) public view returns (bytes32) {
        return tasks[_taskIndex].hashValue;
    }

    /// @notice Gets the hash of the task requirement directions
    /// @param _taskIndex Index of the double hash task
    /// @return Hash of the task requirement directions
    function getDoubleHashTaskTaskHash(
        uint _taskIndex
    ) public view returns (bytes32) {
        return tasks[_taskIndex].taskHash;
    }

    /// @notice Gets the manager address of the task
    /// @param _taskIndex Index of the double hash task
    /// @return Manager address of the task
    function getDoubleHashTaskManagerAddress(
        uint _taskIndex
    ) public view returns (address) {
        return tasks[_taskIndex].managerAddress;
    }

    /// @notice Gets the Wei contribution of given contributor to task
    /// @param _taskIndex Index of the double hash task
    /// @param _contributorAddress Address of the fund contributor
    /// @return Wei contribution of given contributor to task
    function getDoubleHashTaskWeiContribution(
        uint _taskIndex,
        address _contributorAddress
    ) public view returns (uint) {
        return tasks[_taskIndex].contributorsWeiAmounts[_contributorAddress];
    }

    /// @notice Gets the total Wei reward of the given task
    /// @param _taskIndex Index of the double hash task
    /// @return Total Wei reward of the given task
    function getDoubleHashTaskTotalWei(
        uint _taskIndex
    ) public view returns (uint) {
        return tasks[_taskIndex].contributionTotalWei;
    }

    /// @notice Gets the deadline of the given task
    /// @param _taskIndex Index of the double hash task
    /// @return Block timestamp deadline in seconds of given task
    function getDoubleHashTaskDeadline(
        uint _taskIndex
    ) public view returns (uint64) {
        return tasks[_taskIndex].deadline;
    }

    /// @notice Gets whether the given task is complete
    /// @param _taskIndex Index of the double hash task
    /// @return Whether the given task has been completed
    function getDoubleHashTaskComplete(
        uint _taskIndex
    ) public view returns (bool) {
        return tasks[_taskIndex].taskComplete;
    }

    /// @notice Gets whether the given task requires a key for the manager to
    /// withdraw their funds after an incomplete task
    /// @param _taskIndex Index of the double hash task
    /// @return Whether the given task requires a key for the manager to
    /// withdraw their funds after an incomplete task
    function getDoubleHashTaskKeyReveal(
        uint _taskIndex
    ) public view returns (bool) {
        return tasks[_taskIndex].keyReveal;
    }

    /// @notice Gets the time window in seconds for a worker to submit their
    /// second response announcement
    /// @param _taskIndex Index of the double hash task
    /// @return Time window in seconds for a worker to submit their second
    /// response announcement
    function getDoubleHashTaskSecondResponseWindow(
        uint _taskIndex
    ) public view returns (uint32) {
        return tasks[_taskIndex].secondResponseWindow;
    }

    /// @notice Gets the delay between the first response announcement and start
    /// of the second response time window
    /// @param _taskIndex Index of the double hash task
    /// @return Delay between the first response announcement and start of the
    /// second response time window
    function getDoubleHashTaskDelay(
        uint _taskIndex
    ) public view returns (uint64) {
        return tasks[_taskIndex].secondResponseDelay;
    }

    /// @notice Gets the time window in seconds for a worker to submit their
    /// second response announcement
    /// @param _taskIndex Index of the double hash task
    /// @return Time window in seconds for a worker to submit their second
    /// response announcement
    function getDoubleHashTaskResponseCount(
        uint _taskIndex
    ) public view returns (uint64) {
        return tasks[_taskIndex].responseCount;
    }

    /// @notice Gets the timestamp for the end of the last response window, 0
    /// if there are no responses
    /// @param _taskIndex Index of the double hash task
    /// @return Timestamp for the end of the last response window, 0 if there
    /// are no responses
    function getDoubleHashTaskNextSlotTime(
        uint _taskIndex
    ) public view returns (uint64) {
        return tasks[_taskIndex].nextSlotTime;
    }

    /// @notice Gets the worker address of the given task response
    /// @param _taskIndex Index of the double hash task
    /// @param _responseIndex Index of the task response
    /// @return Worker address of the given task response
    function getDoubleHashTaskResponseWorkerAddress(
        uint _taskIndex,
        uint _responseIndex
    ) public view returns (address) {
        return tasks[_taskIndex].responses[_responseIndex].workerAddress;
    }

    /// @notice Gets the timestamp of the start of the response time window
    /// @param _taskIndex Index of the double hash task
    /// @param _responseIndex Index of the task response
    /// @return Timestamp of the start of the response time window
    function getDoubleHashTaskResponseWindowStart(
        uint _taskIndex,
        uint _responseIndex
    ) public view returns (uint64) {
        return tasks[_taskIndex].responses[_responseIndex].responseWindowStart;
    }
}