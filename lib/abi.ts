export const MedicineTrackerABI = [
  "event BatchProvisioned(string batchId, address indexed manufacturer)",
  "event TelemetryLogged(string batchId, address indexed carrier, int256 temperatureCp, bool breached)",
  "event BatchSpoiled(string batchId, address indexed carrier, int256 temperatureCp)",
  "event BatchStatusChanged(string batchId, uint8 newStatus)",
  "function MIN_TEMP() view returns (int256)",
  "function MAX_TEMP() view returns (int256)",
  "function provisionBatch(string _batchId, string _productName, string _manufacturerLabel, uint256 _units, string _serial, string _originLabel, string _destinationLabel)",
  "function logTelemetry(string _batchId, int256 _latE6, int256 _lngE6, int256 _tempCp)",
  "function getBatch(string _batchId) view returns (tuple(string batchId, string productName, address manufacturer, string manufacturerLabel, uint8 currentStatus, uint256 createdAt, uint256 units, string serial, string originLabel, string destinationLabel, bool exists))",
  "function getTelemetryCount(string _batchId) view returns (uint256)",
  "function getTelemetry(string _batchId, uint256 index) view returns (tuple(uint256 timestamp, int256 latE6, int256 lngE6, int256 temperatureCp, address signer, bool breached))"
];
