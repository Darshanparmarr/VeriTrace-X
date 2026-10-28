"""Audit trail with tamper-evidence.

Development mode (default) maintains a **local hash-chain** in the database: each
audit event stores `sha256(prev_chain_hash + payload_hash)`. Altering, reordering,
or deleting any event breaks the chain — genuine tamper-evidence. This is explicitly
NOT a public/permissioned blockchain; verification is honestly labelled as a local
integrity check.

Fabric mode (future, requires a running Hyperledger Fabric network) would additionally
anchor each event's hash on-chain via `app/blockchain/fabric.py`. Until configured,
on-chain verification honestly reports "unavailable" — we never fake a success.

Only a hash of the payload is stored (not sensitive data).
"""
from __future__ import annotations

import hashlib
import json

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.audit import (
    AuditEvent,
    AuditEventType,
    BlockchainReference,
    BlockchainRefStatus,
)


def _sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def hash_payload(payload: dict) -> str:
    """Deterministic hash of a payload (canonical JSON)."""
    return _sha256(json.dumps(payload, sort_keys=True, separators=(",", ":"), default=str))


def _chain_hash(prev_hash: str | None, payload_hash: str) -> str:
    return _sha256((prev_hash or "GENESIS") + payload_hash)


def _last_event(db: Session) -> AuditEvent | None:
    return db.scalar(select(AuditEvent).order_by(AuditEvent.id.desc()).limit(1))


def record_event(
    db: Session,
    event_type: AuditEventType,
    entity_type: str,
    entity_id: str,
    payload: dict,
    actor_id: int | None = None,
) -> AuditEvent:
    """Append a tamper-evident audit event to the local hash-chain."""
    payload_hash = hash_payload(payload)
    prev = _last_event(db)
    prev_hash = prev.chain_hash if prev else None
    chain_hash = _chain_hash(prev_hash, payload_hash)

    event = AuditEvent(
        event_type=event_type,
        entity_type=entity_type,
        entity_id=str(entity_id),
        actor_id=actor_id,
        payload_hash=payload_hash,
        chain_prev_hash=prev_hash,
        chain_hash=chain_hash,
        meta={k: v for k, v in payload.items() if k != "_sensitive"},
    )
    db.add(event)
    db.flush()

    # Record the ledger reference. In development mode it is explicitly NOT anchored.
    ref = BlockchainReference(
        audit_event_id=event.id,
        mode=settings.blockchain_mode,
        status=BlockchainRefStatus.unavailable
        if settings.blockchain_mode == "development"
        else BlockchainRefStatus.pending,
    )
    db.add(ref)
    db.flush()
    return event


def verify_event(db: Session, event: AuditEvent) -> dict:
    """Verify an event's integrity.

    Development mode: recompute the local hash-chain from genesis up to this event
    and confirm every link matches — detects tampering, reordering, or deletion.
    Fabric mode: delegate to the Fabric adapter (currently unavailable).
    """
    mode = settings.blockchain_mode
    if mode != "development":
        # Real on-chain verification requires a configured Fabric network.
        from app.blockchain.fabric import verify_on_chain

        return verify_on_chain(event)

    # Walk the chain from the start to this event's position.
    events = db.scalars(
        select(AuditEvent).where(AuditEvent.id <= event.id).order_by(AuditEvent.id.asc())
    ).all()

    # Recompute the chain from genesis. We propagate the RECOMPUTED hash (not the
    # stored one) so that tampering with ANY earlier event breaks every later event.
    prev_recomputed = None
    for i, e in enumerate(events):
        expected = _chain_hash(prev_recomputed, e.payload_hash)
        link_ok = e.chain_prev_hash == prev_recomputed
        hash_ok = e.chain_hash == expected
        if e.id == event.id:
            verified = link_ok and hash_ok
            return {
                "event_id": event.id,
                "mode": mode,
                "status": "verified" if verified else "failed",
                "block_index": i,
                "chain_length": len(events),
                "checks": {
                    "previous_link_matches": link_ok,
                    "chain_hash_matches": hash_ok,
                },
                "message": (
                    "Integrity confirmed against the local hash-chain (development mode — "
                    "tamper-evident, but not a public blockchain)."
                    if verified
                    else "Integrity check FAILED — the chain has been altered."
                ),
            }
        prev_recomputed = expected

    return {
        "event_id": event.id,
        "mode": mode,
        "status": "failed",
        "message": "Event not found in the chain.",
    }
