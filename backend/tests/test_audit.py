"""Audit hash-chain: recording, verification, and tamper-detection."""
from __future__ import annotations

from app.blockchain import service as audit
from app.core.database import get_db
from app.models.audit import AuditEvent, AuditEventType
from app.models.transaction import RiskBand, ReviewStatus, Transaction


def _db(client):
    return next(client.app.dependency_overrides[get_db]())


def _seed_tx(db) -> Transaction:
    tx = Transaction(
        order_id="VX-A1", supplier="Acme", product="Widget", location="US",
        order_value=100.0, risk_score=0.9, risk_band=RiskBand.critical,
        review_status=ReviewStatus.new, features={"order_value": 100.0},
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx


def test_review_records_audit_event(client, auth_headers):
    db = _db(client)
    tx = _seed_tx(db)

    r = client.post(
        f"/api/v1/transactions/{tx.id}/reviews",
        headers=auth_headers,
        json={"decision": "escalated", "reason": "suspicious"},
    )
    assert r.status_code == 201

    events = client.get("/api/v1/audit-events", headers=auth_headers).json()
    assert events["total"] >= 1
    ev = events["items"][0]
    assert ev["event_type"] == "case_escalated"
    assert ev["chain_hash"]


def test_verify_detects_tampering(client, auth_headers):
    db = _db(client)

    # Record two events via the service directly.
    e1 = audit.record_event(db, AuditEventType.analysis_completed, "analysis", "1", {"a": 1})
    e2 = audit.record_event(db, AuditEventType.review_decision_recorded, "transaction", "1", {"b": 2})
    db.commit()

    # Genuine chain verifies.
    good = client.get(f"/api/v1/audit-events/{e2.id}/verify", headers=auth_headers).json()
    assert good["status"] == "verified"
    assert good["mode"] == "development"

    # Tamper with the first event's payload hash -> chain breaks for later events.
    stored = db.get(AuditEvent, e1.id)
    stored.payload_hash = "0" * 64
    db.commit()

    bad = client.get(f"/api/v1/audit-events/{e2.id}/verify", headers=auth_headers).json()
    assert bad["status"] == "failed"


def test_verify_requires_auth(client):
    assert client.get("/api/v1/audit-events/1/verify").status_code == 401
