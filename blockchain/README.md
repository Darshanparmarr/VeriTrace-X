# VeriTrace-X — Blockchain audit

Two modes, selected by `BLOCKCHAIN_MODE`:

## `development` (default) — local hash-chain
No external infrastructure. Each audit event is stored in the database with
`chain_hash = sha256(previous_chain_hash + payload_hash)`. Altering, reordering, or
deleting any event breaks every later event's hash — **genuine tamper-evidence**.

This is **not** a public or permissioned blockchain, and the UI/API say so. On-chain
verification honestly reports **"unavailable"** in this mode. Implemented in
`backend/app/blockchain/service.py`; verify via `GET /api/v1/audit-events/{id}/verify`.

## `fabric` — Hyperledger Fabric (production path)
Anchors each event's hash on a permissioned ledger and verifies against it.

### What's here
- `chaincode/veritrace-audit/` — a minimal audit chaincode (Go) contract sketch:
  `RecordHash(eventId, hash)` and `VerifyHash(eventId, hash)`.
- `network/` — where a Fabric test network + connection profile live (generated, git-ignored).
- `scripts/` — helper scripts to bring the network up and deploy the chaincode.

### To enable (requires Docker)
1. Install Docker + the Hyperledger Fabric binaries & `fabric-samples` test network.
2. Start the network and create a channel (`veritrace-channel`).
3. Package & deploy `chaincode/veritrace-audit`.
4. Drop the connection profile at `blockchain/network/connection.json` and set in `.env`:
   ```
   BLOCKCHAIN_MODE=fabric
   FABRIC_CONNECTION_PROFILE=blockchain/network/connection.json
   FABRIC_CHANNEL=veritrace-channel
   FABRIC_CHAINCODE=veritrace-audit
   ```
5. Implement the submit/query calls in `backend/app/blockchain/fabric.py` using a Fabric
   Gateway client (e.g. `fabric-sdk-py`). The seam is already wired: `service.record_event`
   and `service.verify_event` delegate to `fabric.py` when `BLOCKCHAIN_MODE=fabric`.

Until all of the above is configured, Fabric operations honestly return **"unavailable"** —
the app never fakes a successful on-chain anchor or verification.

## On-chain data minimisation
Only a **hash** (plus event type/entity reference and timestamp) is ever written on-chain.
Sensitive personal and commercial data stays off-chain.
