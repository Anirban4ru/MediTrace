# Veritas Chain — Architecture Reference

Decentralized pharmaceutical supply-chain & counterfeit detector spanning four
layers. The Next.js application in this repository is the production frontend; it
runs against a deterministic in-browser simulation of the backend layers so the
full UX is exercisable on free-tier infrastructure without external RPC keys.

## 1. Tech Stack

| Layer            | Technology                                                        |
| ---------------- | ----------------------------------------------------------------- |
| Blockchain       | Solidity ^0.8.20, Hardhat/Foundry, Arbitrum Sepolia L2 testnet    |
| Backend          | Java 21, Spring Boot 3.x, Web3j, Spring WebFlux / Virtual Threads |
| Database         | PostgreSQL (JPA/Hibernate mapping)                                |
| AI / CV          | Python 3.11+, FastAPI, OpenCV, TensorFlow/Keras inference          |
| Frontend         | Next.js 14 (App Router), React, Tailwind CSS, Lucide React         |

## 2. Smart Contract — `contracts/MedicineTracker.sol`

- State machine: `Manufactured -> InTransit -> Distributed -> Verified`,
  with `Spoiled` as a terminal state reachable from any state.
- `Batch` struct tracks `batchId`, `manufacturer`, `productName`,
  `currentStatus`, and an array of `Telemetry` checkpoints
  (`timestamp`, `latE6`, `lngE6`, `temperatureCp`, `signer`, `breached`).
- Absolute safety trigger: `logTelemetry` checks every reading against the
  `[2.00, 8.00] C` band (stored as centi-degrees). Any breach instantly and
  permanently mutates `currentStatus` to `Spoiled` and emits `BatchSpoiled`.
- OpenZeppelin `AccessControl` gates every transition:
  `MANUFACTURER_ROLE`, `CARRIER_ROLE`, `INSPECTOR_ROLE`.
- `ReentrancyGuard` on all mutating entry points.

### Deployment (Arbitrum Sepolia)

```bash
# hardhat.config.ts
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";

const config: HardhatUserConfig = {
  solidity: { version: "0.8.20", settings: { optimizer: { enabled: true, runs: 200 } } },
  networks: {
    arbitrumSepolia: {
      url: "https://sepolia-rollup.arbitrum.io/rpc",
      accounts: [process.env.DEPLOYER_PK!],
    },
  },
  etherscan: { apiKey: { arbitrumSepolia: process.env.ARBISCAN_KEY! } },
};
export default config;
```

## 3. Spring Boot Backend

- Web3j CLI compiles `MedicineTracker.sol` into `MedicineTracker.java` wrapper
  classes (`web3j generate ...`).
- `POST /api/v1/telemetry` — reactive ingestion endpoint using virtual threads:
  persists the reading to PostgreSQL (JPA `TelemetryEntity`), evaluates the
  safe band, and on breach orchestrates an on-chain write via Web3j
  `logTelemetry(...)` signed with the carrier wallet.
- JPA entities: `BatchEntity` (1) -> (N) `TelemetryEntity` with a
  `@OneToMany` lazy join indexed on `batch_id` for time-series analytics.

## 4. FastAPI Computer-Vision Service

`POST /api/v1/verify-hologram` (multipart form, field `file`):

1. Read upload bytes, decode with OpenCV `cv2.imdecode`.
2. Convert to grayscale: `cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)`.
3. Adaptive threshold: `cv2.adaptiveThreshold(..., cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)`.
4. Find contours and isolate structural bounding boxes:
   `cv2.findContours` -> `cv2.boundingRect`.
5. Compute SSIM distance against a flawless reference hologram vector
   (`skimage.metrics.structural_similarity`).
6. Return strict JSON:
   `{ "authenticity_score": 0.0..1.0, "anomalies_detected": bool, "processing_time_ms": int }`

## 5. Frontend (this repository)

Three brutalist-glassmorphic views, all functional in-browser:

1. **Manufacturer Provisioning Dashboard** — grid-aligned batch ledger + glass
   provisioning form that registers new batches with a deterministic on-chain
   proof (batch ID, serial, tx hash, block number).
2. **In-Transit Telemetry Console** — step-line chart of sensor readings against
   a rigid red safety ceiling (8.0 C) and floor (2.0 C), with a carrier
   ingestion form and a route-checkpoint grid.
3. **Pharmacy Terminal & Scanner** — drag-and-drop image upload, glass loader
   with staged CV pipeline progress, then a result sheet revealing the AI
   authenticity score, anomaly flag, SSIM distance, and the on-chain
   cryptographic proof (tx hash, block, contract, inspector, method).

### Design system

- Canvas: `#FFFFFF`, concrete `#F4F4F6`, structural `#E5E5E9`, ink `#000000`.
- Single accent: Muted Deep Blue `#102A43` / Slate Green `#1E3A8A` for active
  statuses and confirmations. Danger red `#B91C1C` for spoilage only.
- Brutalist primitives: 2px solid black borders, hard 4px offset shadows,
  zero blur. Glassmorphic sheets: `rgba(255,255,255,0.45)` + `backdrop-filter: blur(12px)`.
- Typography: Inter (geometric sans, heavy headers) + JetBrains Mono (tabular
  data numbers).

## 6. Data persistence

The frontend uses an in-memory React context (`LedgerProvider`) seeded by a
deterministic PRNG so the full supply-chain lifecycle is exercisable without a
live backend. For production multi-user persistence, the same domain model maps
1:1 onto a Supabase/PostgreSQL schema (`batches`, `telemetry`, `verifications`)
with RLS policies scoped per role.
