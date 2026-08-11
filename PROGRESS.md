# PharmaTrace Loop Engineering Progress

## Phase 0 — Setup & Guardrails
- [x] Create PROGRESS.md
- [x] Run npm install and confirm project builds/typechecks
- [x] Create git branch loop-engineering/flaws-and-features

## Phase 1 — Contract Hardening
- [x] Add OpenZeppelin's AccessControl to MedicineTracker.sol
- [x] Add MANUFACTURER_ROLE and CARRIER_ROLE logic
- [x] Add revokeBatch logic
- [x] Add recordVerificationHash logic
- [x] Update lib/abi.ts
- [x] Write Hardhat tests
- [x] Deploy hardened MedicineTracker contract

## Phase 2 — Supabase Row Level Security
- [x] Write RLS policies
- [x] Apply RLS policies

## Phase 3 — Auth/RBAC Simplification
- [x] Remove hardcoded passwords
- [x] Route dashboard access purely off `user.role` from `useAuth()`
- [x] Add a friendly 'Access restricted' screen for mismatched roles

## Phase 4 — Dedaub Webhook Fail-Closed Fix
- [x] Fail open fix

## Phase 5 — Engineering Hygiene
- [x] Upgrade Next/React
- [x] Fix GlobeComponent hydration warnings
- [ ] Fix eslint ignore
- [ ] Remove stale comment
- [x] Add CI Action
- [x] Confirm GitHub Actions is enabled

## Phase 6 — UX Polish
- [x] Replace alerts with sonner
- [x] Add skeleton loaders
- [x] Add demo badge
- [x] Wire cmdk
- [x] Build Judge Mode
- [x] Responsive pass

## Phase 7 — Animations
- [x] framer-motion status pill
- [x] recharts animation
- [x] Scanning laser
- [x] react-globe animation
- [x] canvas-confetti

## Phase 8 — New Consumer & Tech Features
- [x] Build /track
- [x] Generate QR codes
- [x] QR code on PDF
- [x] Supabase Presence
- [x] Anomaly commentary
- [x] Web Push

## Phase 9 — Final Pass
- [x] Re-run verification suite
- [x] Update README
- [x] Open PR
- [ ] Review and merge PR
