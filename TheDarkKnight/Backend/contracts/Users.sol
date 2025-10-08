// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Users
/// @author Peter Parker
/// @notice Collection of users' contact links, data, and status
contract Users {

    // User activation status
    enum Mode {

        // Address has not been activated for a user
        UNACTIVATED,

        // Address is an active user
        ACTIVE,

        // Address has been deactivated by a user lockout
        DEACTIVATED
    }

    // Comma separated string of api and contact links to a user by address
    mapping (address => string) public links;

    // User personalized data by address
    mapping (address => bytes) public usersData;

    // User activation status mode
    mapping (address => Mode) public activationStatus;

    // Hash of preimage key to lockout a user address
    mapping (address => bytes32) public lockoutCodes;

    // Ethereum block index of the last interaction with this contract
    uint64 public lastInteractionBlockIndex;

    // Emits when a user is activated with just links
    event ActivateUserLinks(
        address userAddress,
        string links,
        uint64 lastInteractionBlockIndex
    );

    // Emits when a user is activated with links and data
    event ActivateUserLinksData(
        address userAddress,
        string links,
        bytes data,
        uint64 lastInteractionBlockIndex
    );

    // Emits when a user is activated with links and lockout code
    event ActivateUserLinksLockout(
        address userAddress,
        string links,
        bytes32 lockoutCode,
        uint64 lastInteractionBlockIndex
    );

    // Emits when a user is activated with links, data, and lockout code
    event ActivateUserLinksDataLockout(
        address userAddress,
        string links,
        bytes data,
        bytes32 lockoutCode,
        uint64 lastInteractionBlockIndex
    );

    // Emits when a user changes their links
    event UpdateLinks(
        address userAddress,
        string newLinks,
        uint64 lastInteractionBlockIndex
    );

    // Emits when a user changes their data
    event UpdateData(
        address userAddress,
        bytes newData,
        uint64 lastInteractionBlockIndex
    );

    // Emits when a user changes their links and data
    event UpdateLinksData(
        address userAddress,
        string links,
        bytes newData,
        uint64 lastInteractionBlockIndex
    );

    // Emits when a user's account has been deleted from a lockout
    event LockoutUser(
        address userAddress,
        bytes32 lockoutKey,
        address lockoutAddress,
        uint64 lastInteractionBlockIndex
    );

    /// @notice Involved in contract recieving ETH
    fallback() external {}

    /// @notice A user is activated with links contact information
    /// @param _links Comma separated list of user apis and contact links
    function activateUser(
        string memory _links
    ) public unactivatedUser(msg.sender) {
        activationStatus[msg.sender] = Mode.ACTIVE;
        links[msg.sender] = _links;
        emit ActivateUserLinks(msg.sender,  _links, lastInteractionBlockIndex);
        lastInteractionBlockIndex = (uint64)(block.number);
    }

    /// @notice A user is activated with links contact information and data
    /// @param _links Comma separated list of user apis and contact links
    /// @param _data Personalized user data
    function activateUser(
        string memory _links,
        bytes memory _data
    ) public unactivatedUser(msg.sender) {
        activationStatus[msg.sender] = Mode.ACTIVE;
        links[msg.sender] = _links;
        usersData[msg.sender] = _data;
        emit ActivateUserLinksData(
            msg.sender,
            _links,
            _data,
            lastInteractionBlockIndex
        );
        lastInteractionBlockIndex = (uint64)(block.number);
    }

    /// @notice A user is activated with links contact information and data
    /// @param _links Comma separated list of user apis and contact links
    /// @param _lockoutCode Preimage hash when revealed causes user lockout
    function activateUser(
        string memory _links,
        bytes32 _lockoutCode
    ) public unactivatedUser(msg.sender) {
        activationStatus[msg.sender] = Mode.ACTIVE;
        links[msg.sender] = _links;
        lockoutCodes[msg.sender] = _lockoutCode;
        emit ActivateUserLinksLockout(
            msg.sender,
            _links,
            _lockoutCode,
            lastInteractionBlockIndex
        );
        lastInteractionBlockIndex = (uint64)(block.number);
    }

    /// @notice A user is activated with links contact information and data
    /// @param _links Comma separated list of user apis and contact links
    /// @param _data Personalized user data
    /// @param _lockoutCode Preimage hash when revealed causes user lockout
    function activateUser(
        string memory _links,
        bytes memory _data,
        bytes32 _lockoutCode
    ) public unactivatedUser(msg.sender) {
        activationStatus[msg.sender] = Mode.ACTIVE;
        links[msg.sender] = _links;
        usersData[msg.sender] = _data;
        lockoutCodes[msg.sender] = _lockoutCode;
        emit ActivateUserLinksDataLockout(
            msg.sender,
            _links,
            _data,
            _lockoutCode,
            lastInteractionBlockIndex
        );
        lastInteractionBlockIndex = (uint64)(block.number);
    }

    /// @notice Updates contact information of user
    /// @param _links New comma separated list of user apis and contact links
    function updateUserLinks(
        string memory _links
    ) public activeUser(msg.sender) {
        emit UpdateLinks(msg.sender, _links, lastInteractionBlockIndex);
        links[msg.sender] = _links;
        lastInteractionBlockIndex = (uint64)(block.number);
    }

    /// @notice Updates personalized data of user
    /// @param _data New personalized user data
    function updateData(bytes memory _data) public activeUser(msg.sender) {
        emit UpdateData(msg.sender, _data, lastInteractionBlockIndex);
        usersData[msg.sender] = _data;
        lastInteractionBlockIndex = (uint64)(block.number);
    }

    /// @notice Updates personalized data and contact information of user
    /// @param _data New personalized user data
    /// @param _links New comma separated list of user apis and contact links
    function updateUserLinksData(
        string memory _links,
        bytes memory _data
    ) public activeUser(msg.sender) {
        emit UpdateLinksData(
            msg.sender,
            _links,
            _data,
            lastInteractionBlockIndex
        );
        links[msg.sender] = _links;
        usersData[msg.sender] = _data;
        lastInteractionBlockIndex = (uint64)(block.number);
    }

    /// @notice Locks out the given user if the correct preimage is provided
    /// @param _userAddress Address of user to lockout
    /// @param _lockoutKey Preimage which hashes to the lockout code
    function lockoutUser(
        address _userAddress,
        bytes32 _lockoutKey
    ) public activeUser(msg.sender) {

        // Hash of preimage lockout key must result in the lockout code of the
        // corresponding user address
        require(
            keccak256(abi.encode(_lockoutKey)) == lockoutCodes[_userAddress],
            "Invalid lockout key"
        );

        // User data is reset and user becomes deactivated
        links[_userAddress] = "";
        usersData[_userAddress] = "";
        lockoutCodes[_userAddress] = 0;
        activationStatus[_userAddress] = Mode.DEACTIVATED;
        emit LockoutUser(
            _userAddress,
            _lockoutKey,
            msg.sender,
            lastInteractionBlockIndex
        );
        lastInteractionBlockIndex = (uint64)(block.number);
    }

    /// @notice Requires given user to be active and not in lockout
    /// @param _userAddress Address of user activation
    modifier activeUser(address _userAddress) {
        require(
            activationStatus[_userAddress] == Mode.ACTIVE,
            "Inactive user"
        );
        _;
    }

    /// @notice Requires given user to not yet be activated
    /// @param _userAddress Address of user activation
    modifier unactivatedUser(address _userAddress) {
        require(
            activationStatus[_userAddress] == Mode.UNACTIVATED,
            "User already activated"
        );
        _;
    }

    /// @notice Gets whether a given user is in active status
    /// @param _userAddress User address
    /// @return Whether a given user is in active status
    function activeUsers(address _userAddress) public view returns (bool) {
        return activationStatus[_userAddress] == Mode.ACTIVE;
    }
}