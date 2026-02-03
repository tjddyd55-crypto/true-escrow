// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title EscrowStatusRegistry
 * @notice Records final escrow milestone decisions on-chain for immutability
 * @dev This contract does NOT handle funds - it only records status decisions
 * 
 * Purpose:
 * - Record immutable milestone status decisions (FUNDS_HELD, RELEASED, REFUNDED)
 * - Ensure non-reversibility of final decisions
 * - Provide on-chain proof of escrow state transitions
 * 
 * Security:
 * - No funds are stored or transferred in this contract
 * - Only owner (backend wallet) can write records
 * - Once RELEASED or REFUNDED is recorded, no other status allowed
 * - No update or delete functions
 */
contract EscrowStatusRegistry {
    
    // ============ Constants ============
    
    uint8 public constant STATUS_FUNDS_HELD = 0;
    uint8 public constant STATUS_RELEASED = 1;
    uint8 public constant STATUS_REFUNDED = 2;
    
    // ============ State Variables ============
    
    address public owner;
    
    /**
     * @dev Record structure for milestone status
     */
    struct Record {
        bytes32 dealHash;
        bytes32 milestoneHash;
        uint8 status;        // 0: FUNDS_HELD, 1: RELEASED, 2: REFUNDED
        uint256 timestamp;
    }
    
    /**
     * @dev Mapping to check if a specific (dealHash, milestoneHash, status) combination is recorded
     * key = keccak256(abi.encodePacked(dealHash, milestoneHash, status))
     */
    mapping(bytes32 => bool) public recorded;
    
    /**
     * @dev Mapping to store records by their unique key
     */
    mapping(bytes32 => Record) public records;
    
    /**
     * @dev Track final status for each (dealHash, milestoneHash) pair
     * key = keccak256(abi.encodePacked(dealHash, milestoneHash))
     * value = final status (RELEASED or REFUNDED)
     * 0 means no final status recorded yet
     */
    mapping(bytes32 => uint8) public finalStatus;
    
    // ============ Events ============
    
    /**
     * @dev Emitted when a milestone status is recorded
     */
    event StatusRecorded(
        bytes32 indexed dealHash,
        bytes32 indexed milestoneHash,
        uint8 status,
        uint256 timestamp
    );
    
    /**
     * @dev Emitted when ownership is transferred
     */
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    
    // ============ Modifiers ============
    
    /**
     * @dev Throws if called by any account other than the owner
     */
    modifier onlyOwner() {
        require(msg.sender == owner, "EscrowStatusRegistry: caller is not the owner");
        _;
    }
    
    // ============ Constructor ============
    
    /**
     * @dev Initializes the contract with the deployer as the owner
     */
    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }
    
    // ============ Write Functions ============
    
    /**
     * @dev Records a milestone status on-chain
     * 
     * Rules:
     * - Same (dealHash, milestoneHash, status) cannot be recorded twice
     * - Once RELEASED or REFUNDED is recorded, no other status allowed for that milestone
     * - FUNDS_HELD can be recorded multiple times (updates are allowed for this status)
     * 
     * @param dealHash Hash of the deal identifier
     * @param milestoneHash Hash of the milestone identifier
     * @param status Status to record (0: FUNDS_HELD, 1: RELEASED, 2: REFUNDED)
     */
    function recordStatus(
        bytes32 dealHash,
        bytes32 milestoneHash,
        uint8 status
    ) external onlyOwner {
        require(
            status == STATUS_FUNDS_HELD || status == STATUS_RELEASED || status == STATUS_REFUNDED,
            "EscrowStatusRegistry: invalid status"
        );
        
        // Create unique key for this (dealHash, milestoneHash, status) combination
        bytes32 recordKey = keccak256(abi.encodePacked(dealHash, milestoneHash, status));
        
        // Create key for milestone (dealHash, milestoneHash) to check final status
        bytes32 milestoneKey = keccak256(abi.encodePacked(dealHash, milestoneHash));
        
        // Check if this exact combination is already recorded
        require(!recorded[recordKey], "EscrowStatusRegistry: status already recorded");
        
        // If recording RELEASED or REFUNDED, check that no final status exists
        if (status == STATUS_RELEASED || status == STATUS_REFUNDED) {
            require(
                finalStatus[milestoneKey] == 0,
                "EscrowStatusRegistry: final status already recorded for this milestone"
            );
            // Mark final status
            finalStatus[milestoneKey] = status;
        }
        
        // If a final status exists, prevent recording FUNDS_HELD
        if (status == STATUS_FUNDS_HELD) {
            require(
                finalStatus[milestoneKey] == 0,
                "EscrowStatusRegistry: cannot record FUNDS_HELD after final status"
            );
        }
        
        // Create and store record
        Record memory newRecord = Record({
            dealHash: dealHash,
            milestoneHash: milestoneHash,
            status: status,
            timestamp: block.timestamp
        });
        
        records[recordKey] = newRecord;
        recorded[recordKey] = true;
        
        // Emit event
        emit StatusRecorded(dealHash, milestoneHash, status, block.timestamp);
    }
    
    /**
     * @dev Transfers ownership of the contract to a new account
     * @param newOwner Address of the new owner
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "EscrowStatusRegistry: new owner is the zero address");
        address oldOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
    
    // ============ Read Functions ============
    
    /**
     * @dev Gets a record by its unique key
     * @param recordKey keccak256(abi.encodePacked(dealHash, milestoneHash, status))
     * @return Record struct containing dealHash, milestoneHash, status, and timestamp
     */
    function getRecord(bytes32 recordKey) external view returns (Record memory) {
        require(recorded[recordKey], "EscrowStatusRegistry: record not found");
        return records[recordKey];
    }
    
    /**
     * @dev Checks if a specific (dealHash, milestoneHash, status) combination is recorded
     * @param dealHash Hash of the deal identifier
     * @param milestoneHash Hash of the milestone identifier
     * @param status Status to check
     * @return true if recorded, false otherwise
     */
    function isRecorded(
        bytes32 dealHash,
        bytes32 milestoneHash,
        uint8 status
    ) external view returns (bool) {
        bytes32 recordKey = keccak256(abi.encodePacked(dealHash, milestoneHash, status));
        return recorded[recordKey];
    }
    
    /**
     * @dev Gets the final status for a milestone (RELEASED or REFUNDED)
     * @param dealHash Hash of the deal identifier
     * @param milestoneHash Hash of the milestone identifier
     * @return Final status (0 = none, 1 = RELEASED, 2 = REFUNDED)
     */
    function getFinalStatus(
        bytes32 dealHash,
        bytes32 milestoneHash
    ) external view returns (uint8) {
        bytes32 milestoneKey = keccak256(abi.encodePacked(dealHash, milestoneHash));
        return finalStatus[milestoneKey];
    }
}
