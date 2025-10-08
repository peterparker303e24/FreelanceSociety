// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "./Users.sol";

/// @title The List
/// @author Peter Parker
/// @notice Collection of requirement hashes and ethics requirements
contract TheList {

    // Requirement for The List
    struct Requirement {

        // Hash of the requirement
        bytes32 requirementHash;

        // Address that submitted the most current version of the requirement
        address validatorAddress;

        // Version of the requirement, 1-indexed, and has a geometric increase
        // in number of votes necessary to update
        uint64 version;

        // Count of proposals to update the requirement
        uint64 proposalsCount;

        // Proposal updates for the requirement
        mapping (uint64 => RequirementUpdateProposal)
            requirementUpdateProposals;
    }

    // Update proposal for an existing requirement
    struct RequirementUpdateProposal {

        // Address that submitted the proposal
        address proposalAddress;

        // Hash of the requirement
        bytes32 proposalHash;

        // Mapping of users who have voted
        mapping (address => bool) didVote;

        // Number of votes in favor of the requirement
        uint64 votesFor;
    }

    // Update proposal for a new set of ethics requirements
    struct EthicsRequirementsUpdateProposal {

        // Array of independent requirements necessary for all data submissions
        string[] ethicsRequirements;

        // Address that submitted the ethics requirements proposal
        address ethicsProposalAddress;

        // Mapping of voters who have voted
        mapping (address => bool) didVote;

        // Number of votes in favor of the requirement
        uint64 votesFor;
    }

    // Most current set of ethics requirements
    string[] public ethicsRequirements;

    // Version of the ethics requirements, 1-indexed, and has a geometric
    // increase in number of votes necessary to update
    uint64 public ethicsVersion;

    // Count of proposals to update the ethics requirements
    uint64 public ethicsProposalsCount;

    // Count of requirements in The List
    uint64 public requirementCount;
    
    // Ethereum block index of the last interaction with this contract
    uint64 public lastInteractionBlockIndex;

    // All ethics update proposals in The List
    mapping (uint64 => EthicsRequirementsUpdateProposal)
        public ethicsUpdateProposals;

    // All requirements in The List
    mapping (uint => Requirement) public requirements;

    // Reference to the manager, worker, and validator users
    Users public usersContract;

    // Emits when the ethics requirements are updated, a geometric increase in
    // the number of votes are needed to update
    event NewEthicsRequirements(
        uint64 version,
        address proposalAddress,
        uint64 lastInteractionBlockIndex
    );

    // Emits when a new ethics proposal is created
    event EthicsProposal(
        uint64 proposalIndex,
        address proposalAddress,
        uint64 lastInteractionBlockIndex
    );
    
    // Emits when a new vote is made for an ethics proposal
    event EthicsVote(
        uint64 ethicsProposalIndex,
        address voterAddress,
        uint64 lastInteractionBlockIndex
    );
    
    // Emits when a new requirement is created
    event NewRequirement(
        uint requirementIndex,
        bytes32 newRequirementHash,
        address requirementAddress,
        uint64 lastInteractionBlockIndex
    );

    // Emits when a new requirement proposal is created
    event Proposal(
        uint requirementIndex,
        uint64 requirementProposalIndex,
        address proposalAddress,
        uint64 lastInteractionBlockIndex
    );
    
    // Emits when a vote is made for an ethics proposal
    event Vote(
        uint requirementIndex,
        uint64 requirementProposalIndex,
        address voterAddress,
        uint64 lastInteractionBlockIndex
    );
    
    // Emits when a requirement is updated, a geometric increase in the number
    // of votes are needed to update
    event NewRequirementUpdate(
        uint requirementIndex,
        bytes32 newRequirementHash,
        uint64 version,
        address proposalAddress,
        uint64 lastInteractionBlockIndex
    );
    
    /// @notice The List is created with dependent users and the given ethics
    /// requirements is set with the given data
    /// @param _ethicsRequirements Initialized set of ethics requirements
    /// @param _usersContractAddress References to a dependent contract of
    /// manager, worker, and validator users
    constructor(
        string[] memory _ethicsRequirements,
        address _usersContractAddress
    ) {

        // Reference Users contract
        usersContract = Users(_usersContractAddress);

        // Initialize the ethics requirements proposal
        EthicsRequirementsUpdateProposal storage thisProposal
            = ethicsUpdateProposals[0];
        thisProposal.ethicsRequirements = _ethicsRequirements;
        thisProposal.didVote[msg.sender] = true;
        thisProposal.votesFor = 1;
        thisProposal.ethicsProposalAddress = msg.sender;

        // Emit the proposal information
        emit EthicsProposal(
            ethicsProposalsCount,
            msg.sender,
            lastInteractionBlockIndex
        );

        // Set the ethics requirements initialization data
        ethicsProposalsCount = 1;
        ethicsRequirements = _ethicsRequirements;
        ethicsVersion = 1;
    }

    /// @notice Create a new ethics requirements proposal and initialize data
    /// @param _ethicsRequirements New set of ethics requirements to propose
    function updateEthicsRequirements(
        string[] memory _ethicsRequirements
    ) public activeUser() {

        // Initialize ethics requirements proposal data
        EthicsRequirementsUpdateProposal storage thisProposal
            = ethicsUpdateProposals[ethicsProposalsCount];
        thisProposal.ethicsRequirements = _ethicsRequirements;
        thisProposal.didVote[msg.sender] = true;
        thisProposal.votesFor = 1;
        thisProposal.ethicsProposalAddress = msg.sender;

        // Emit proposal information, update ethics proposals and interaction
        // block index
        emit EthicsProposal(
            ethicsProposalsCount,
            msg.sender,
            lastInteractionBlockIndex
        );
        ethicsProposalsCount++;
        lastInteractionBlockIndex = (uint64)(block.number);
    }

    /// @notice Adds a vote for the given proposal if user has not voted yet,
    /// and updates the ethics requirements if the number of votes for the
    /// proposal meets the geometric growth value
    /// @param _proposalIndex Index of the ethics proposal to vote for
    function voteEthicsRequirementsUpdate(
        uint64 _proposalIndex
    ) public activeUser() {

        // Add a vote if user hasn't voted yet
        EthicsRequirementsUpdateProposal storage thisProposal
            = ethicsUpdateProposals[_proposalIndex];
        require(!thisProposal.didVote[msg.sender], "1 vote limit per account");
        thisProposal.didVote[msg.sender] = true;
        thisProposal.votesFor++;

        // Emit the vote information
        emit EthicsVote(_proposalIndex, msg.sender, lastInteractionBlockIndex);

        // If votes for ethics requirements meet geometric growth value, then
        // the ethics requirements are updated
        if (thisProposal.votesFor == 2 ** ethicsVersion) {
            ethicsRequirements = thisProposal.ethicsRequirements;
            ethicsVersion++;
            emit NewEthicsRequirements(
                ethicsVersion,
                thisProposal.ethicsProposalAddress,
                lastInteractionBlockIndex
            );
        }

        // Update interaction block index
        lastInteractionBlockIndex = (uint64)(block.number);
    }

    /// @notice Adds a new requirement to The List
    /// @param _requirementHash Hash of the requirement directions
    function addRequirement(
        bytes32 _requirementHash
    ) public activeUser() {

        // Initialize requirement with given data
        requirements[requirementCount].requirementHash = _requirementHash;
        requirements[requirementCount].version = 1;
        requirements[requirementCount].validatorAddress = msg.sender;

        // Emit new requirement information
        emit NewRequirement(
            requirementCount,
            _requirementHash,
            msg.sender,
            lastInteractionBlockIndex
        );

        // Increment number of requirements, initialize requirement proposal
        // with given data which also updates interaction block index
        requirementCount++;
        updateRequirement(requirementCount - 1, _requirementHash);
    }

    /// @notice Creates a new proposal for the given requirement
    /// @param _requirementIndex Index of requirement to update
    /// @param _requirementHash Hash of new updated requirement directions
    function updateRequirement(
        uint _requirementIndex,
        bytes32 _requirementHash
    ) public activeUser() {

        // Requirement index input validation
        require(
            _requirementIndex < requirementCount,
            "Requirement index out of bounds"
        );

        // Initialize a new requirement update proposal with the given data
        Requirement storage thisRequriement = requirements[_requirementIndex];
        RequirementUpdateProposal storage thisProposal
            = thisRequriement.requirementUpdateProposals[
                thisRequriement.proposalsCount
            ];
        thisProposal.votesFor = 1;
        thisProposal.proposalHash = _requirementHash;
        thisProposal.didVote[msg.sender] = true;
        thisProposal.proposalAddress = msg.sender;

        // Emit the requirement update proposal information
        emit Proposal(
            _requirementIndex,
            thisRequriement.proposalsCount,
            msg.sender,
            lastInteractionBlockIndex
        );

        // Increment number of requirement proposals and update interaction
        // block index
        requirements[_requirementIndex].proposalsCount++;
        lastInteractionBlockIndex = (uint64)(block.number);
    }

    /// @notice Adds a vote for the given proposal, and if the number of votes
    /// towards the proposal crosses a geometric vote barrier, then the
    /// requirement is updated to the proposal
    /// @param _requirementIndex Index of requirement to vote for
    /// @param _proposalIndex Index of the requirement proposal proposal for the
    /// requirement to vote for
    function voteRequirementUpdate(
        uint _requirementIndex,
        uint64 _proposalIndex
    ) public activeUser() {

        // Requirement index input validation
        require(
            _requirementIndex < requirementCount,
            "Requirement index out of bounds"
        );

        // Add vote if user hasn't voted yet
        Requirement storage thisRequirement = requirements[_requirementIndex];
        RequirementUpdateProposal storage thisProposal
            = thisRequirement.requirementUpdateProposals[_proposalIndex];
        require(!thisProposal.didVote[msg.sender], "1 vote limit per account");
        thisProposal.didVote[msg.sender] = true;
        thisProposal.votesFor++;

        // Emit vote information
        emit Vote(
            _requirementIndex,
            _proposalIndex,
            msg.sender,
            lastInteractionBlockIndex
        );

        // If votes for requirement meets geometric growth value, then the
        // requirement is updated
        if (thisProposal.votesFor == 2 ** thisRequirement.version) {
            thisRequirement.requirementHash = thisProposal.proposalHash;
            thisRequirement.validatorAddress = thisProposal.proposalAddress;
            thisRequirement.version++;
            emit NewRequirementUpdate(
                _requirementIndex,
                requirements[_requirementIndex].requirementHash,
                requirements[_requirementIndex].version,
                thisProposal.proposalAddress,
                lastInteractionBlockIndex
            );
        }

        // Update interaction block index
        lastInteractionBlockIndex = (uint64)(block.number);
    }

    /// @notice Requires the message address to be an active user in this
    /// contract's corresponding Users contract
    modifier activeUser() {
        require(usersContract.activeUsers(msg.sender), "Inactive account");
        _;
    }

    /// @notice Gets the set of ethics requirements for the given proposal
    /// @param _proposalIndex Index of the ethics requirements proposal
    /// @return Set of ethics requirements for the given proposal
    function getEthicsRequirementsProposal(
        uint64 _proposalIndex
    ) public view returns (string[] memory) {
        return ethicsUpdateProposals[_proposalIndex].ethicsRequirements;
    }

    /// @notice Gets the proposal address for the ethics requirements
    /// @param _proposalIndex Index of the ethics requirements proposal
    /// @return Proposal address for the ethics requirements
    function getEthicsRequirementsProposalAddress(
        uint64 _proposalIndex
    ) public view returns (address) {
        return ethicsUpdateProposals[_proposalIndex].ethicsProposalAddress;
    }

    /// @notice Gets the number of votes for a given ethics requirements
    /// @param _proposalIndex Index of the ethics requirements proposal
    /// @return Number of votes for a given ethics requirements
    function getEthicsRequirementsProposalVotesFor(
        uint64 _proposalIndex
    ) public view returns (uint64) {
        return ethicsUpdateProposals[_proposalIndex].votesFor;
    }

    /// @notice Gets whether a user has voted for a given ethics requirements
    /// proposal
    /// @param _proposalIndex Index of the ethics requirements proposal
    /// @param _voterAddress User address to check vote
    /// @return Whether a user has voted for a given ethics requirements
    /// proposal
    function getEthicsRequirementsProposalDidVote(
        uint64 _proposalIndex,
        address _voterAddress
    ) public view returns (bool) {
        return ethicsUpdateProposals[_proposalIndex].didVote[_voterAddress];
    }

    /// @notice Gets the set of ethics requirements
    /// @return Set of ethics requirements
    function getEthicsRequirements() public view returns (string[] memory) {
        return ethicsRequirements;
    }

    /// @notice Gets the hash of the given requirement
    /// @param _requirementIndex Index of requirement in The List
    /// @return Hash of the given requirement
    function getRequirementHash(
        uint _requirementIndex
    ) public view returns (bytes32) {
        return requirements[_requirementIndex].requirementHash;
    }

    /// @notice Gets the version of the given requirement, 1 indexed
    /// @param _requirementIndex Index of the requirement in The List
    /// @return Version of the given requirement, 1 indexed
    function getRequirementVersion(
        uint _requirementIndex
    ) public view returns (uint64) {
        return requirements[_requirementIndex].version;
    }

    /// @notice Gets the number of proposals for the given requirement
    /// @param _requirementIndex Index of the requirement in The List
    /// @return Number of proposals for the given requirement
    function getRequirementProposals(
        uint _requirementIndex
    ) public view returns (uint64) {
        return requirements[_requirementIndex].proposalsCount;
    }

    /// @notice Gets the address of the creator of the requirement
    /// @param _requirementIndex Index of the requirement in The List
    /// @return Address of the creator of the requirement
    function getRequirementValidatorAddress(
        uint _requirementIndex
    ) public view returns (address) {
        return requirements[_requirementIndex].validatorAddress;
    }

    /// @notice Get the address for the given requirement proposal
    /// @param _requirementIndex Index of the requirement in The List
    /// @param _proposalIndex Index of the proposal in the requirement
    /// @return Address for the given requirement proposal
    function getRequirementProposalAddress(
        uint _requirementIndex,
        uint64 _proposalIndex
    ) public view returns (address) {
        return requirements[_requirementIndex]
            .requirementUpdateProposals[_proposalIndex].proposalAddress;
    }

    /// @notice Gets the hash of the given requirement proposal
    /// @param _requirementIndex Index of the requirement in The List
    /// @param _proposalIndex Index of the proposal in the requirement
    /// @return Hash of the given requirement proposal
    function getRequirementProposalHash(
        uint _requirementIndex,
        uint64 _proposalIndex
    ) public view returns (bytes32) {
        return requirements[_requirementIndex]
            .requirementUpdateProposals[_proposalIndex].proposalHash;
    }

    /// @notice Gets the number of votes for the given requirement proposal
    /// @param _requirementIndex Index of the requirement in The List
    /// @param _proposalIndex Index of the proposal in the requirement
    /// @return Number of votes for the given requirement proposal
    function getRequirementProposalVotesFor(
        uint _requirementIndex,
        uint64 _proposalIndex
    ) public view returns (uint64) {
        return requirements[_requirementIndex]
            .requirementUpdateProposals[_proposalIndex].votesFor;
    }

    /// @notice Gets whether the given user address has voted to a given
    /// requirement proposal
    /// @param _requirementIndex Index of the requirement in The List
    /// @param _proposalIndex Index of the proposal in the requirement
    /// @param _voterAddress User address to check vote
    /// @return Whether the given user address has voted to a given requirement
    /// proposal
    function getRequirementProposalDidVote(
        uint _requirementIndex,
        uint64 _proposalIndex,
        address _voterAddress
    ) public view returns (bool) {
        return requirements[_requirementIndex]
            .requirementUpdateProposals[_proposalIndex].didVote[_voterAddress];
    }
}