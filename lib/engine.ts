import {
  Batch,
  BatchStatus,
  OnChainProof,
  Role,
  SAFE_BAND,
  TelemetryCheckpoint,
  VerificationResult,
  CHAIN,
} from './types';
import { addressFromRng, blockFromRng, hashFromRng, rng } from './rng';

function hashStr(s: string): number {
  let h = 7;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const MANUFACTURERS = [
  { label: 'Helix Pharma Industries', addr: '0x4F2a7b1c8d9e0a1b2c3d4e5f6a7b8c9d0e1f2a3b' },
  { label: 'Korall BioLabs', addr: '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b' },
  { label: 'Veridian Therapeutics', addr: '0x1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c' },
];

const PRODUCTS = [
  'Insulin Glargine 100IU',
  'Oncorase IV Vial',
  'Pneumovax 23',
  'Humira Prefill Syringe',
  'Enoxaparin 40mg',
  'Botulinum Toxin 50U',
  'Meningococcal Conjugate',
  'Rituximab 10mg/mL',
];

const ORIGINS = [
  { lat: 19.0760, lng: 72.8777, label: 'Mumbai, IN — Plant 04' },
  { lat: 28.6139, lng: 77.2090, label: 'Delhi, IN — Plant 12' },
  { lat: 13.0827, lng: 80.2707, label: 'Chennai, IN — Plant 07' },
];

const DESTINATIONS = [
  { lat: 12.9716, lng: 77.5946, label: 'Bangalore, IN — Central Pharmacy' },
  { lat: 17.3850, lng: 78.4867, label: 'Hyderabad, IN — Hospital Depot' },
  { lat: 22.5726, lng: 88.3639, label: 'Kolkata, IN — Eastern Hub' },
];

const STATUSES: BatchStatus[] = [
  'Manufactured',
  'InTransit',
  'Distributed',
  'Verified',
  'Spoiled',
];

function pad(n: number, len: number): string {
  return n.toString().padStart(len, '0');
}

function serialFor(rand: () => number): string {
  const a = Math.floor(rand() * 0xffff).toString(16).toUpperCase().padStart(4, '0');
  const b = Math.floor(rand() * 0xffff).toString(16).toUpperCase().padStart(4, '0');
  return `GS1-${a}-${b}`;
}

/** Deterministic batch factory seeded by an integer index. */
export function makeBatch(seed: number): Batch {
  const rand = rng(seed * 9973 + 17);
  const manufacturer = MANUFACTURERS[Math.floor(rand() * MANUFACTURERS.length)];
  const productName = PRODUCTS[Math.floor(rand() * PRODUCTS.length)];
  const origin = ORIGINS[Math.floor(rand() * ORIGINS.length)];
  const destination = DESTINATIONS[Math.floor(rand() * DESTINATIONS.length)];

  // Skew status distribution toward realistic mid-flow states.
  const r = rand();
  let status: BatchStatus;
  if (r < 0.22) status = 'Manufactured';
  else if (r < 0.5) status = 'InTransit';
  else if (r < 0.72) status = 'Distributed';
  else if (r < 0.88) status = 'Verified';
  else status = 'Spoiled';

  const now = Date.now();
  const createdAt = now - Math.floor(rand() * 14 * 24 * 3600_000); // up to 14d old
  const telemetry = generateTelemetry(rand, createdAt, status === 'Spoiled');

  return {
    batchId: `BATCH-${pad(seed, 4)}-${pad(Math.floor(rand() * 9999), 4)}`,
    productName,
    manufacturer: manufacturer.addr,
    manufacturerLabel: manufacturer.label,
    currentStatus: status,
    createdAt,
    units: 100 + Math.floor(rand() * 9) * 100,
    serial: serialFor(rand),
    origin,
    destination,
    telemetry,
    provisionTx: hashFromRng(rand),
    provisionBlock: blockFromRng(rand),
  };
}

/** Generate a realistic cold-chain telemetry series for a batch. */
export function generateTelemetry(
  rand: () => number,
  startTs: number,
  spoiled: boolean
): TelemetryCheckpoint[] {
  const count = 8 + Math.floor(rand() * 8);
  const points: TelemetryCheckpoint[] = [];
  let temp = 4.5 + rand() * 1.5; // start in band
  let breached = false;

  for (let i = 0; i < count; i++) {
    // Random walk with mean reversion toward 5°C.
    const drift = (5 - temp) * 0.18;
    const noise = (rand() - 0.5) * 2.6;
    temp = Math.round((temp + drift + noise) * 10) / 10;

    // For spoiled batches, force a breach around the middle of the journey.
    if (spoiled && i === Math.floor(count / 2)) {
      temp = 9.4 + Math.round(rand() * 30) / 10;
    }
    if (spoiled && i === Math.floor(count / 2) + 1) {
      temp = 11.2 + Math.round(rand() * 20) / 10;
    }

    const isBreach = temp < SAFE_BAND.min || temp > SAFE_BAND.max;
    if (isBreach) breached = true;

    const t = startTs + i * 4 * 3600_000; // every 4h
    const lat = 45 + Math.sin(i / 2) * 6 + rand() * 0.4;
    const lng = 5 + Math.cos(i / 3) * 8 + rand() * 0.4;

    points.push({
      timestamp: t,
      lat: Math.round(lat * 10000) / 10000,
      lng: Math.round(lng * 10000) / 10000,
      temperature: temp,
      signer: addressFromRng(rand),
      txHash: hashFromRng(rand),
      breached: isBreach,
    });
  }

  // If a breach happened, mark the batch spoiled permanently (per contract rule).
  if (breached) {
    // The contract auto-mutates status to Spoiled on any breach.
  }
  return points;
}

/** Produce a deterministic seed of N batches for the dashboard. */
export function makeBatches(count = 24): Batch[] {
  return Array.from({ length: count }, (_, i) => makeBatch(i + 1));
}

/** Provision a new batch (manufacturer role). */
export function provisionBatch(
  productName: string,
  units: number,
  seedKey: string
): Batch {
  const seed = (hashStr(seedKey) * 31) % 99991 + 1000;
  const rand = rng(seed);
  const manufacturer = MANUFACTURERS[0];
  const origin = ORIGINS[0];
  const destination = DESTINATIONS[Math.floor(rand() * DESTINATIONS.length)];
  const now = Date.now();

  return {
    batchId: `BATCH-${pad(Math.floor(rand() * 9999), 4)}-${pad(
      Math.floor(rand() * 9999),
      4
    )}`,
    productName,
    manufacturer: manufacturer.addr,
    manufacturerLabel: manufacturer.label,
    currentStatus: 'Manufactured',
    createdAt: now,
    units,
    serial: serialFor(rand),
    origin,
    destination,
    telemetry: [],
    provisionTx: hashFromRng(rand),
    provisionBlock: blockFromRng(rand),
  };
}

/** Ingest a new telemetry reading for a batch (carrier role). */
export function ingestTelemetry(
  batch: Batch,
  temperature: number,
  seedKey: string
): { batch: Batch; checkpoint: TelemetryCheckpoint; spoiled: boolean } {
  const seed = (hashStr(seedKey) * 33) % 99991;
  const rand = rng(seed);
  const breached = temperature < SAFE_BAND.min || temperature > SAFE_BAND.max;
  const last = batch.telemetry[batch.telemetry.length - 1];
  const ts = last ? last.timestamp + 4 * 3600_000 : Date.now();

  const checkpoint: TelemetryCheckpoint = {
    timestamp: ts,
    lat: batch.origin.lat + (rand() - 0.5) * 4,
    lng: batch.origin.lng + (rand() - 0.5) * 4,
    temperature,
    signer: addressFromRng(rand),
    txHash: hashFromRng(rand),
    breached,
  };

  const spoiled = breached || batch.currentStatus === 'Spoiled';
  const nextStatus: BatchStatus = spoiled
    ? 'Spoiled'
    : batch.currentStatus === 'Manufactured'
    ? 'InTransit'
    : batch.currentStatus;

  return {
    batch: {
      ...batch,
      currentStatus: nextStatus,
      telemetry: [...batch.telemetry, checkpoint],
    },
    checkpoint,
    spoiled,
  };
}

/** Inspector role — verify a batch on-chain. */
export function verifyBatch(batch: Batch, seedKey: string): OnChainProof {
  const seed = (hashStr(seedKey) * 37) % 99991;
  const rand = rng(seed);
  return {
    txHash: hashFromRng(rand),
    blockNumber: blockFromRng(rand),
    contractAddress: CHAIN.contractAddress,
    chain: CHAIN.name,
    inspector: addressFromRng(rand),
    verifiedAt: Date.now(),
    batchId: batch.batchId,
    method: 'verifyBatch(bytes32)',
  };
}

/**
 * Simulated computer-vision hologram verification.
 * Mirrors the FastAPI `/api/v1/verify-hologram` pipeline:
 * OpenCV adaptive threshold → bounding boxes → SSIM vs reference.
 */
export function verifyHologram(
  batch: Batch,
  imageSignature: string
): VerificationResult {
  const seed = (hashStr(batch.batchId + imageSignature) * 41) % 99991;
  const rand = rng(seed);
  const t0 = performance.now();

  // Structural similarity index distance (0 = identical, 1 = unrelated).
  const ssimDistance = Math.round(rand() * 1000) / 1000;
  // Bounding boxes found by adaptive threshold.
  const boundingBoxes = 3 + Math.floor(rand() * 9);
  // Authenticity: high when SSIM distance is low and batch is not spoiled.
  const baseScore = 1 - ssimDistance;
  const spoiledPenalty = batch.currentStatus === 'Spoiled' ? 0.35 : 0;
  const authenticityScore = Math.max(
    0,
    Math.min(1, Math.round((baseScore - spoiledPenalty) * 1000) / 1000)
  );
  const anomaliesDetected = authenticityScore < 0.85 || batch.currentStatus === 'Spoiled';

  const t1 = performance.now();
  const processingTimeMs = Math.round((t1 - t0) + 180 + rand() * 420);

  const proof = verifyBatch(batch, imageSignature);

  return {
    authenticityScore,
    anomaliesDetected,
    processingTimeMs,
    boundingBoxes,
    ssimDistance,
    proof,
  };
}

export function roleLabel(role: Role): string {
  return role
    .replace('_ROLE', '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
