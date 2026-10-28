#!/usr/bin/env bash
# Bring up a local Hyperledger Fabric test network and deploy the audit chaincode.
#
# Requires Docker + the Fabric samples/binaries (install_fabric). This is the
# documented production path; the default dev mode uses a local hash-chain and does
# NOT need any of this. See ../README.md.
set -euo pipefail

CHANNEL="${FABRIC_CHANNEL:-veritrace-channel}"
CC_NAME="${FABRIC_CHAINCODE:-veritrace-audit}"
CC_PATH="$(cd "$(dirname "$0")/.." && pwd)/chaincode/veritrace-audit"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required but not found. Install Docker, then re-run." >&2
  exit 1
fi

if [ ! -d "fabric-samples" ]; then
  echo "Fetching Fabric samples + binaries…"
  curl -sSL https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh | bash -s -- samples binary
fi

cd fabric-samples/test-network
./network.sh up createChannel -c "$CHANNEL" -ca
./network.sh deployCC -c "$CHANNEL" -ccn "$CC_NAME" -ccp "$CC_PATH" -ccl go

echo "Network up. Export the connection profile to blockchain/network/connection.json,"
echo "then set BLOCKCHAIN_MODE=fabric in your .env."
