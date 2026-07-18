// Domain model for the pharmaceutical supply chain ledger.
// Mirrors the on-chain Batch struct in MedicineTracker.sol and the
// Spring Boot persistence layer's JPA entities.

export type BatchStatus =
  | 'Manufactured'
  | 'InTransit'
  | 'Distributed'
  | 'Verified'
  | 'Spoiled';

export const STATUS_ORDER: BatchStatus[] = [
  'Manufactured',
  'InTransit',
  'Distributed',
  'Verified',
  'Spoiled',
];

export type Role = 'MANUFACTURER_ROLE' | 'CARRIER_ROLE' | 'INSPECTOR_ROLE';

export interface TelemetryCheckpoint {
  /** Epoch milliseconds. */
  timestamp: number;
  /** Decimal latitude. */
  lat: number;
  /** Decimal longitude. */
  lng: number;
  /** Celsius, one decimal precision. */
  temperature: number;
  /** Address of the carrier device that signed the reading. */
  signer: string;
  /** Transaction hash of the on-chain telemetry write. */
  txHash: string;
  /** True if this checkpoint breached the 2–8°C safe band. */
  breached: boolean;
}

export interface Batch {
  batchId: string;
  productName: string;
  manufacturer: string;
  manufacturerLabel: string;
  currentStatus: BatchStatus;
  createdAt: number;
  /** Total units in the batch. */
  units: number;
  /** GS1-style serial. */
  serial: string;
  /** Origin coordinates. */
  origin: { lat: number; lng: number; label: string };
  /** Destination coordinates. */
  destination: { lat: number; lng: number; label: string };
  telemetry: TelemetryCheckpoint[];
  /** Hash of the provisioning transaction. */
  provisionTx: string;
  /** Block number of the provisioning event. */
  provisionBlock: number;
}

export interface VerificationResult {
  authenticityScore: number;
  anomaliesDetected: boolean;
  processingTimeMs: number;
  /** Structural bounding boxes found by OpenCV adaptive threshold. */
  boundingBoxes: number;
  /** SSIM distance from the reference hologram vector. */
  ssimDistance: number;
  /** On-chain proof tying this scan to the batch. */
  proof: OnChainProof;
}

export interface OnChainProof {
  txHash: string;
  blockNumber: number;
  contractAddress: string;
  chain: string;
  inspector: string;
  verifiedAt: number;
  batchId: string;
  method: string;
}

export const SAFE_BAND = { min: 2.0, max: 8.0 };

export const CHAIN = {
  name: 'Arbitrum Sepolia L2',
  chainId: 421614,
  contractAddress: '0x7A3c1F2E4b9D8aBc1234567890aBcDeF123456789',
};

export const ROLES: Record<Role, string> = {
  MANUFACTURER_ROLE: '0x829a8c4f9b1e3d2a5c7e9f1a3b5c7d9e1f3a5b7c',
  CARRIER_ROLE: '0x3f7c2d1e9b8a5f6c4d2e1a3b5c7d9e1f3a5b7c9d1',
  INSPECTOR_ROLE: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
};
