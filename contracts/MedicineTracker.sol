// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MedicineTracker
 * @notice Decentralized pharmaceutical supply-chain & cold-chain integrity ledger.
 * @dev Implements a rigid state machine with role-gated transitions and an
 *      absolute safety trigger that permanently spoils a batch on any temperature
 *      reading outside the [2.0, 8.0] degrees Celsius safe band.
 *
 *      State machine:
 *        Manufactured -> InTransit -> Distributed -> Verified
 *                     \-> Spoiled   (terminal, from any state on breach)
 *
 *      Roles (OpenZeppelin AccessControl):
 *        MANUFACTURER_ROLE  — provision batches, advance Manufactured -> InTransit
 *        CARRIER_ROLE       — log telemetry checkpoints
 *        INSPECTOR_ROLE     — advance Distributed -> Verified
 */

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract MedicineTracker is AccessControl, ReentrancyGuard {
    // ---------------------------------------------------------------------
    // Types
    // ---------------------------------------------------------------------

    enum Status {
        Manufactured,
        InTransit,
        Distributed,
        Verified,
        Spoiled
    }

    struct Telemetry {
        uint64 timestamp;     // unix seconds
        int32  latE6;          // latitude  * 1e6
        int32  lngE6;          // longitude * 1e6
        int16  temperatureCp; // temperature in centi-degrees Celsius (e.g. 450 = 4.50C)
        address signer;       // carrier device that signed the reading
        bool   breached;       // true if reading was outside the safe band
    }

    struct Batch {
        bytes32  batchId;          // off-chain GS1 identifier hashed to bytes32
        address manufacturer;
        string   productName;
        Status   currentStatus;
        uint64   createdAt;
        Telemetry[] telemetry;
    }

    // ---------------------------------------------------------------------
    // Constants
    // ---------------------------------------------------------------------

    /// @dev Safe cold-chain band, in centi-degrees Celsius.
    int16 public constant SAFE_MIN_CP = 200;   // 2.00 C
    int16 public constant SAFE_MAX_CP = 800;   // 8.00 C

    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");
    bytes32 public constant CARRIER_ROLE      = keccak256("CARRIER_ROLE");
    bytes32 public constant INSPECTOR_ROLE    = keccak256("INSPECTOR_ROLE");

    // ---------------------------------------------------------------------
    // Storage
    // ---------------------------------------------------------------------

    mapping(bytes32 => Batch) private batches;
    bytes32[] private batchIds;

    // ---------------------------------------------------------------------
    // Events
    // ---------------------------------------------------------------------

    event BatchProvisioned(
        bytes32 indexed batchId,
        address indexed manufacturer,
        string productName,
        uint64 createdAt
    );
    event StatusChanged(
        bytes32 indexed batchId,
        Status indexed from,
        Status indexed to,
        address by
    );
    event TelemetryLogged(
        bytes32 indexed batchId,
        int16 temperatureCp,
        bool breached,
        address signer
    );
    event BatchSpoiled(bytes32 indexed batchId, int16 temperatureCp, address by);

    // ---------------------------------------------------------------------
    // Modifiers
    // ---------------------------------------------------------------------

    modifier onlyManufacturer() {
        require(hasRole(MANUFACTURER_ROLE, msg.sender), "NOT_MANUFACTURER");
        _;
    }
    modifier onlyCarrier() {
        require(hasRole(CARRIER_ROLE, msg.sender), "NOT_CARRIER");
        _;
    }
    modifier onlyInspector() {
        require(hasRole(INSPECTOR_ROLE, msg.sender), "NOT_INSPECTOR");
        _;
    }

    modifier notSpoiled(bytes32 batchId) {
        require(batches[batchId].currentStatus != Status.Spoiled, "BATCH_SPOILED");
        _;
    }

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MANUFACTURER_ROLE, admin);
        _grantRole(CARRIER_ROLE, admin);
        _grantRole(INSPECTOR_ROLE, admin);
    }

    // ---------------------------------------------------------------------
    // Manufacturer — provisioning
    // ---------------------------------------------------------------------

    /**
     * @notice Provision a new medicine batch onto the ledger.
     * @dev batchId should be keccak256 of the GS1 serial identifier.
     */
    function provisionBatch(
        bytes32 batchId,
        string calldata productName
    ) external onlyManufacturer nonReentrant {
        require(batches[batchId].manufacturer == address(0), "BATCH_EXISTS");
        require(bytes(productName).length > 0, "NAME_EMPTY");

        Batch storage b = batches[batchId];
        b.batchId = batchId;
        b.manufacturer = msg.sender;
        b.productName = productName;
        b.currentStatus = Status.Manufactured;
        b.createdAt = uint64(block.timestamp);
        batchIds.push(batchId);

        emit BatchProvisioned(batchId, msg.sender, productName, b.createdAt);
        emit StatusChanged(batchId, Status.Manufactured, Status.Manufactured, msg.sender);
    }

    /**
     * @notice Advance a batch from Manufactured -> InTransit.
     */
    function dispatchBatch(bytes32 batchId)
        external
        onlyManufacturer
        notSpoiled(batchId)
    {
        Batch storage b = batches[batchId];
        require(b.manufacturer != address(0), "NO_BATCH");
        require(b.currentStatus == Status.Manufactured, "WRONG_STATE");

        b.currentStatus = Status.InTransit;
        emit StatusChanged(batchId, Status.Manufactured, Status.InTransit, msg.sender);
    }

    // ---------------------------------------------------------------------
    // Carrier — telemetry ingestion
    // ---------------------------------------------------------------------

    /**
     * @notice Log a telemetry checkpoint for a batch.
     * @dev Absolute safety trigger: any reading outside [2.0, 8.0] C
     *      permanently mutates the batch status to Spoiled. This is
     *      irreversible and takes precedence over any other transition.
     */
    function logTelemetry(
        bytes32 batchId,
        uint64  timestamp,
        int32   latE6,
        int32   lngE6,
        int16   temperatureCp
    ) external onlyCarrier nonReentrant {
        Batch storage b = batches[batchId];
        require(b.manufacturer != address(0), "NO_BATCH");
        require(b.currentStatus != Status.Spoiled, "BATCH_SPOILED");

        bool breached =
            temperatureCp < SAFE_MIN_CP || temperatureCp > SAFE_MAX_CP;

        b.telemetry.push(Telemetry({
            timestamp: timestamp,
            latE6: latE6,
            lngE6: lngE6,
            temperatureCp: temperatureCp,
            signer: msg.sender,
            breached: breached
        }));

        emit TelemetryLogged(batchId, temperatureCp, breached, msg.sender);

        // Absolute, permanent spoilage on breach.
        if (breached) {
            Status prev = b.currentStatus;
            b.currentStatus = Status.Spoiled;
            emit BatchSpoiled(batchId, temperatureCp, msg.sender);
            emit StatusChanged(batchId, prev, Status.Spoiled, msg.sender);
        }
    }

    // ---------------------------------------------------------------------
    // Inspector — verification
    // ---------------------------------------------------------------------

    /**
     * @notice Advance a batch from InTransit -> Distributed (receipt at pharmacy depot).
     */
    function markDistributed(bytes32 batchId)
        external
        onlyInspector
        notSpoiled(batchId)
    {
        Batch storage b = batches[batchId];
        require(b.manufacturer != address(0), "NO_BATCH");
        require(b.currentStatus == Status.InTransit, "WRONG_STATE");

        b.currentStatus = Status.Distributed;
        emit StatusChanged(batchId, Status.InTransit, Status.Distributed, msg.sender);
    }

    /**
     * @notice Verify a distributed batch — terminal "clean" state.
     */
    function verifyBatch(bytes32 batchId)
        external
        onlyInspector
        notSpoiled(batchId)
    {
        Batch storage b = batches[batchId];
        require(b.manufacturer != address(0), "NO_BATCH");
        require(b.currentStatus == Status.Distributed, "WRONG_STATE");

        b.currentStatus = Status.Verified;
        emit StatusChanged(batchId, Status.Distributed, Status.Verified, msg.sender);
    }

    // ---------------------------------------------------------------------
    // Views
    // ---------------------------------------------------------------------

    function getBatch(bytes32 batchId)
        external
        view
        returns (
            address manufacturer,
            string memory productName,
            Status currentStatus,
            uint64 createdAt,
            uint256 telemetryCount
        )
    {
        Batch storage b = batches[batchId];
        return (
            b.manufacturer,
            b.productName,
            b.currentStatus,
            b.createdAt,
            b.telemetry.length
        );
    }

    function getTelemetry(bytes32 batchId, uint256 index)
        external
        view
        returns (Telemetry memory)
    {
        return batches[batchId].telemetry[index];
    }

    function batchCount() external view returns (uint256) {
        return batchIds.length;
    }

    function batchIdAt(uint256 index) external view returns (bytes32) {
        return batchIds[index];
    }
}
