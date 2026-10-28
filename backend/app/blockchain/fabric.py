"""Hyperledger Fabric adapter (integration path).

This is the seam where a real permissioned-blockchain integration plugs in. It is
intentionally NOT implemented against a live network here, because running Fabric
requires Docker + a configured network (see blockchain/README.md). Rather than fake
success, every operation honestly reports that on-chain anchoring/verification is
unavailable until the network is configured (`BLOCKCHAIN_MODE=fabric` + connection
profile).

To implement for real: use `fabric-sdk-py` (or a Fabric Gateway client) to submit a
chaincode transaction that stores the event's `chain_hash`, and to query/verify it.
"""
from __future__ import annotations

from app.models.audit import AuditEvent


class FabricUnavailable(RuntimeError):
    pass


def anchor_on_chain(event: AuditEvent) -> dict:
    """Would submit the event hash to chaincode. Unavailable without a network."""
    return {
        "event_id": event.id,
        "mode": "fabric",
        "status": "unavailable",
        "message": "Fabric network not configured — event is not anchored on-chain.",
    }


def verify_on_chain(event: AuditEvent) -> dict:
    """Would query chaincode to verify the hash. Unavailable without a network."""
    return {
        "event_id": event.id,
        "mode": "fabric",
        "status": "unavailable",
        "message": (
            "On-chain verification unavailable — configure a Hyperledger Fabric network "
            "(BLOCKCHAIN_MODE=fabric). We never report a fake successful verification."
        ),
    }
