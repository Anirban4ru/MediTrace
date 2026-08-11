// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract MedicineTracker is AccessControl {
    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");
    bytes32 public constant CARRIER_ROLE = keccak256("CARRIER_ROLE");
    bytes32 public constant INSPECTOR_ROLE = keccak256("INSPECTOR_ROLE");

    enum BatchStatus {
        Manufactured,
        InTransit,
        Distributed,
        Verified,
        Spoiled
    }

    struct Telemetry {
        uint256 timestamp;
        int256 latE6;
        int256 lngE6;
        int256 temperatureCp; // centi-degrees Celsius (e.g., 200 = 2.0C)
        address signer;
        bool breached;
    }

    struct Batch {
        string batchId;
        string productName;
        address manufacturer;
        string manufacturerLabel;
        BatchStatus currentStatus;
        uint256 createdAt;
        uint256 units;
        string serial;
        string originLabel;
        string destinationLabel;
        bool exists;
    }

    mapping(string => Batch) public batches;
    mapping(string => Telemetry[]) public batchTelemetry;

    event BatchProvisioned(string batchId, address indexed manufacturer);
    event TelemetryLogged(string batchId, address indexed carrier, int256 temperatureCp, bool breached);
    event BatchSpoiled(string batchId, address indexed carrier, int256 temperatureCp);
    event BatchStatusChanged(string batchId, BatchStatus newStatus);
    event BatchRevoked(string batchId, address indexed admin, string reason);
    event VerificationRecorded(string batchId, address indexed inspector, bytes32 payloadHash);

    // Constants for safety bounds (2.0C to 8.0C) -> 200 to 800 in centi-degrees
    int256 public constant MIN_TEMP = 200;
    int256 public constant MAX_TEMP = 800;

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function registerManufacturer(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(MANUFACTURER_ROLE, account);
    }

    function registerCarrier(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(CARRIER_ROLE, account);
    }

    function registerInspector(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(INSPECTOR_ROLE, account);
    }

    // Provision a new batch
    function provisionBatch(
        string memory _batchId,
        string memory _productName,
        string memory _manufacturerLabel,
        uint256 _units,
        string memory _serial,
        string memory _originLabel,
        string memory _destinationLabel
    ) public onlyRole(MANUFACTURER_ROLE) {
        require(!batches[_batchId].exists, "Batch already exists");

        batches[_batchId] = Batch({
            batchId: _batchId,
            productName: _productName,
            manufacturer: msg.sender,
            manufacturerLabel: _manufacturerLabel,
            currentStatus: BatchStatus.Manufactured,
            createdAt: block.timestamp,
            units: _units,
            serial: _serial,
            originLabel: _originLabel,
            destinationLabel: _destinationLabel,
            exists: true
        });

        emit BatchProvisioned(_batchId, msg.sender);
    }

    // Log telemetry for an in-transit batch
    function logTelemetry(
        string memory _batchId,
        int256 _latE6,
        int256 _lngE6,
        int256 _tempCp
    ) public onlyRole(CARRIER_ROLE) {
        require(batches[_batchId].exists, "Batch does not exist");
        require(batches[_batchId].currentStatus != BatchStatus.Spoiled, "Batch is already spoiled");

        bool breached = (_tempCp < MIN_TEMP || _tempCp > MAX_TEMP);

        Telemetry memory reading = Telemetry({
            timestamp: block.timestamp,
            latE6: _latE6,
            lngE6: _lngE6,
            temperatureCp: _tempCp,
            signer: msg.sender,
            breached: breached
        });

        batchTelemetry[_batchId].push(reading);
        emit TelemetryLogged(_batchId, msg.sender, _tempCp, breached);

        if (breached) {
            batches[_batchId].currentStatus = BatchStatus.Spoiled;
            emit BatchSpoiled(_batchId, msg.sender, _tempCp);
            emit BatchStatusChanged(_batchId, BatchStatus.Spoiled);
        } else if (batches[_batchId].currentStatus == BatchStatus.Manufactured) {
            batches[_batchId].currentStatus = BatchStatus.InTransit;
            emit BatchStatusChanged(_batchId, BatchStatus.InTransit);
        }
    }

    function revokeBatch(string memory _batchId, string memory _reason) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(batches[_batchId].exists, "Batch does not exist");
        batches[_batchId].currentStatus = BatchStatus.Spoiled;
        emit BatchRevoked(_batchId, msg.sender, _reason);
        emit BatchStatusChanged(_batchId, BatchStatus.Spoiled);
    }

    function recordVerificationHash(string memory _batchId, bytes32 _payloadHash) public onlyRole(INSPECTOR_ROLE) {
        require(batches[_batchId].exists, "Batch does not exist");
        emit VerificationRecorded(_batchId, msg.sender, _payloadHash);
    }

    function getBatch(string memory _batchId) public view returns (Batch memory) {
        require(batches[_batchId].exists, "Batch does not exist");
        return batches[_batchId];
    }

    function getTelemetryCount(string memory _batchId) public view returns (uint256) {
        return batchTelemetry[_batchId].length;
    }

    function getTelemetry(string memory _batchId, uint256 index) public view returns (Telemetry memory) {
        require(index < batchTelemetry[_batchId].length, "Index out of bounds");
        return batchTelemetry[_batchId][index];
    }
}
