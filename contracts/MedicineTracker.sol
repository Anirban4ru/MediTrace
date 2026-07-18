// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MedicineTracker {
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

    // Constants for safety bounds (2.0C to 8.0C) -> 200 to 800 in centi-degrees
    int256 public constant MIN_TEMP = 200;
    int256 public constant MAX_TEMP = 800;

    // Provision a new batch
    function provisionBatch(
        string memory _batchId,
        string memory _productName,
        string memory _manufacturerLabel,
        uint256 _units,
        string memory _serial,
        string memory _originLabel,
        string memory _destinationLabel
    ) public {
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
    ) public {
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
