// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "./Users.sol";

/// @title Single Hash Task Response
/// @author Peter Parker
/// @notice Worker completes the task by deducing the preimage, with nonce to
/// prevent frontrunning
contract HashTask {

    // Single hash task
    struct Task {

        // Hash value of the preimage
        bytes32 hashValue;

        // Hash of the requirement directions to obtain the preimage
        bytes32 taskHash;

        // Manager who initially creates and funds the task
        address managerAddress;

        // All funders of the task
        mapping (address => uint) contributorsWeiAmounts;
        
        // Total amount of Wei funded to task
        uint contributionTotalWei;
        
        // Time of the deadline for worker responses
        uint64 deadline;
        
        // Number of zeros of worker response hash
        uint8 difficulty; 
        
        // Whether task has already been completed
        bool taskComplete; 
        
        // Whether the manager must reveal the preimage to withdraw their task
        // funds
        bool keyReveal;
    }

    // Count of single hash tasks created by this contract
    uint64 public tasksCount;

    // Ethereum block index of the last interaction with this contract
    uint64 public lastInteractionBlockIndex;

    // All tasks created by this contract
    mapping (uint => Task) public tasks;

    // Reference to the manager, worker, and validator users
    Users public usersContract;

    // Emitted when a new single hash task is created
    event NewTask(
        uint taskIndex,
        bytes32 hashValue,
        bytes32 taskHash,
        address managerAddress,
        uint reward,
        uint deadline,
        uint8 difficulty,
        bool keyReveal,
        uint64 lastInteractionBlockIndex
    );

    // Emitted when an existing task has funds added to it
    event TaskFunded(
        uint taskIndex,
        address funderAddress,
        uint reward,
        uint totalReward,
        uint64 lastInteractionBlockIndex
    );

    // Emitted when a task has been completed
    event TaskComplete(
        uint taskIndex,
        bytes32 hashValueKey,
        uint nonce,
        uint totalReward,
        address completionWorker,
        uint64 lastInteractionBlockIndex
    );

    // Emitted when a task has gone incomplete, and funds are withdrawn
    event TaskWithdrawn(
        uint taskIndex,
        bytes32 key,
        uint weiAmount,
        address withdrawAddress,
        uint64 lastInteractionBlockIndex
    );
    
    /// @notice Single hash task contract is generated with dependent users
    /// @param _usersContractAddress References to a dependent contract of
    /// manager, worker, and validator users
    constructor(address _usersContractAddress) {
        usersContract = Users(_usersContractAddress);
    }

    /// @notice A manager creates a new task
    /// @param _hashValue Hash value of the preimage
    /// @param _taskHash Hash of the requirement directions to obtain
    /// the preimage
    /// @param _secondsToDeadline Seconds from now until worker submission
    /// deadline
    /// @param _difficulty Necessary number of preceding zeros in the hash of
    /// the worker submission
    /// @param _keyReveal Whether the manager must reveal the preimage to obtain
    /// funds after the deadline
    function addHashTask(
        bytes32 _hashValue,
        bytes32 _taskHash,
        uint _secondsToDeadline,
        uint8 _difficulty,
        bool _keyReveal
    ) public payable {

        // Manager user must be active and task must include reasonable deadline
        require(usersContract.activeUsers(msg.sender), "Inactive account");
        require(_secondsToDeadline > 0, "Deadline must be in the future");

        // Assign initialization variables to the task object
        Task storage thisTask = tasks[tasksCount];
        thisTask.hashValue = _hashValue;
        thisTask.taskHash = _taskHash;
        thisTask.managerAddress = msg.sender;
        thisTask.contributorsWeiAmounts[msg.sender] = msg.value;
        thisTask.contributionTotalWei += msg.value;
        thisTask.deadline = (uint64)(block.timestamp + _secondsToDeadline);
        thisTask.difficulty = _difficulty;
        thisTask.keyReveal = _keyReveal;

        // Emit the task information
        emit NewTask(
            tasksCount,
            _hashValue,
            _taskHash,
            msg.sender,
            msg.value,
            thisTask.deadline,
            _difficulty,
            _keyReveal,
            lastInteractionBlockIndex
        );

        // Update block interaction index and task count
        lastInteractionBlockIndex = (uint64)(block.number);
        tasksCount++;
    }

    /// @notice A user adds funds to a task reward. The index must be a valid
    /// task and the deadline for the task must not have passed.
    /// @param _taskIndex Index of the single hash task
    function fundHashTask(
        uint _taskIndex
    ) public payable activeTask(_taskIndex) validDeadline(_taskIndex, true){

        // Funds are added to the associated contributor and added to the total
        // task reward value
        Task storage thisTask = tasks[_taskIndex];
        thisTask.contributorsWeiAmounts[msg.sender] += msg.value;
        thisTask.contributionTotalWei += msg.value;

        // Emit the fund information and update the interaction block index
        emit TaskFunded(
            _taskIndex,
            msg.sender,
            msg.value,
            thisTask.contributionTotalWei,
            lastInteractionBlockIndex
        );
        lastInteractionBlockIndex = (uint64)(block.number);
    }

    /// @notice A worker provides the preimage value to a corresponding active
    /// task. The preimage value and response difficulty is verified.
    /// @param _taskIndex Index of the single hash task
    /// @param _hashValueKey Preimage value
    /// @param _nonce Tunable value to result in the correct difficulty
    function submitHashTask(
        uint _taskIndex,
        bytes32 _hashValueKey,
        uint _nonce
    ) public payable activeTask(_taskIndex) validDeadline(_taskIndex, true){

        // Require preimage hash results in correct hash value
        Task storage thisTask = tasks[_taskIndex];
        require(
            keccak256(abi.encode(_hashValueKey)) == thisTask.hashValue,
            "Hash value does not match expected"
        );

        // Require response hash difficulty validation
        bytes32 responseHash = keccak256(abi.encode(
            keccak256(abi.encode(_hashValueKey, msg.sender)),
            _nonce
        ));
        require(
            (thisTask.difficulty == 0 ||
                (uint)(responseHash) < 2 ** (256 - thisTask.difficulty)),
            "Response hash does not match difficulty"
        );

        // Transfer reward to sender
        (bool success,) = msg.sender.call{
            value: thisTask.contributionTotalWei
        }("");
        require(
            success,
            "Error transferring funds of successful task completion"
        );
        
        // Update task to completed, emit completion information, and update
        // interaction block index
        thisTask.taskComplete = true;
        emit TaskComplete(
            _taskIndex,
            _hashValueKey,
            _nonce,
            thisTask.contributionTotalWei,
            msg.sender,
            lastInteractionBlockIndex
        );
        lastInteractionBlockIndex = (uint64)(block.number);
    }

    /// @notice A user withdraws funds they contributed to the given task
    /// @param _taskIndex Index of the single hash task
    /// @param _keyReveal Preimage value
    function withdrawHashTask(
        uint _taskIndex,
        bytes32 _keyReveal
    ) public payable activeTask(_taskIndex) validDeadline(_taskIndex, false){

        // Require only the manager to reveal the key to withdraw funds iff
        // required by the task, otherwise continue
        Task storage thisTask = tasks[_taskIndex];
        require(
            !thisTask.keyReveal || msg.sender != thisTask.managerAddress ||
                keccak256(abi.encode(_keyReveal)) == thisTask.hashValue,
            "Manger must reveal key to withdraw funds"
        );

        // Remove sender contribution from the task and give to sender
        uint weiAmount = thisTask.contributorsWeiAmounts[msg.sender];
        (bool success,) = msg.sender.call{value: weiAmount}("");
        require(success, "Error withdrawing funds from task");
        thisTask.contributorsWeiAmounts[msg.sender] = 0;

        // Emit withdraw information and update interaction block index
        emit TaskWithdrawn(
            _taskIndex,
            _keyReveal,
            weiAmount,
            msg.sender,
            lastInteractionBlockIndex
        );
        lastInteractionBlockIndex = (uint64)(block.number);
    }

    /// @notice Requires task index to exist and not yet been completed
    /// @param _taskIndex Index of the single hash task
    modifier activeTask(uint _taskIndex) {
        require(_taskIndex < tasksCount, "Task index out of bounds");
        require(!tasks[_taskIndex].taskComplete, "Task already completed");
        _;
    }

    /// @notice Requires time of function submission to match necessary side of
    /// the deadline
    /// @param _taskIndex Index of the single hash task
    /// @param _beforeDeadline Whether the current time must be before the task
    /// deadline for the function execution
    modifier validDeadline(uint _taskIndex, bool _beforeDeadline) {
        if (_beforeDeadline) {
            require(
                block.timestamp <= tasks[_taskIndex].deadline,
                "Task deadline has passed"
            );
        } else {
            require(
                block.timestamp > tasks[_taskIndex].deadline,
                "Must wait for task deadline"
            );
        }
        _;
    }

    /// @notice Gets the hash of the task preimage
    /// @param _taskIndex Index of the single hash task
    /// @return Hash of the preimage of given task
    function getHashTaskHash(uint _taskIndex) public view returns (bytes32) {
        return tasks[_taskIndex].hashValue;
    }

    /// @notice Gets the hash of the task requirement directions
    /// @param _taskIndex Index of the single hash task
    /// @return Hash of the task requirement directions
    function getHashTaskTaskHash(
        uint _taskIndex
    ) public view returns (bytes32) {
        return tasks[_taskIndex].taskHash;
    }

    /// @notice Gets the manager address of the task
    /// @param _taskIndex Index of the single hash task
    /// @return Address of the task manager
    function getHashTaskManagerAddress(
        uint _taskIndex
    ) public view returns (address) {
        return tasks[_taskIndex].managerAddress;
    }

    /// @notice Gets the Wei contribution of given contributor to task
    /// @param _taskIndex Index of the single hash task
    /// @param _contributorAddress Address of the fund contributor
    /// @return Wei contribution of given contributor to task
    function getHashTaskWeiContribution(
        uint _taskIndex,
        address _contributorAddress
    ) public view returns (uint) {
        return tasks[_taskIndex].contributorsWeiAmounts[_contributorAddress];
    }

    /// @notice Gets the total Wei reward of the given task
    /// @param _taskIndex Index of the single hash task
    /// @return Total Wei reward of the given task
    function getHashTaskTotalWei(uint _taskIndex) public view returns (uint) {
        return tasks[_taskIndex].contributionTotalWei;
    }

    /// @notice Gets the deadline of the given task
    /// @param _taskIndex Index of the single hash task
    /// @return Block timestamp deadline in seconds of given task
    function getHashTaskDeadline(uint _taskIndex) public view returns (uint64) {
        return tasks[_taskIndex].deadline;
    }

    /// @notice Gets the difficulty of the given task
    /// @param _taskIndex Index of the single hash task
    /// @return Geometric nonce difficulty scale
    function getHashTaskDifficulty(uint _taskIndex) public view returns (uint8) {
        return tasks[_taskIndex].difficulty;
    }

    /// @notice Gets whether the given task is complete
    /// @param _taskIndex Index of the single hash task
    /// @return Whether the given task has been completed
    function getHashTaskComplete(uint _taskIndex) public view returns (bool) {
        return tasks[_taskIndex].taskComplete;
    }

    /// @notice Gets whether the given task requires a key for the manager to
    /// withdraw their funds after an incomplete task
    /// @param _taskIndex Index of the single hash task
    /// @return Whether the given task requires a key for the manager to
    /// withdraw their funds after an incomplete task
    function getHashTaskKeyReveal(uint _taskIndex) public view returns (bool) {
        return tasks[_taskIndex].keyReveal;
    }
}