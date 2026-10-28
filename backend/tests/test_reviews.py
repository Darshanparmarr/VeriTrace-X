"""Human review workflow tests."""
from __future__ import annotations

from app.core.database import get_db
from app.models.transaction import RiskBand, ReviewStatus, Transaction


def _seed_transaction(client) -> int:
    """Insert a transaction directly via the overridden session."""
    gen = client.app.dependency_overrides[get_db]()
    db = next(gen)
    tx = Transaction(
        order_id="VX-TEST-1",
        supplier="Acme",
        product="Widget",
        location="US",
        order_value=1000.0,
        risk_score=0.8,
        risk_band=RiskBand.critical,
        review_status=ReviewStatus.new,
        features={"order_value": 1000.0},
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx.id


def test_record_decision_and_history(client, auth_headers):
    tid = _seed_transaction(client)

    # Legitimate needs no reason.
    r = client.post(
        f"/api/v1/transactions/{tid}/reviews",
        headers=auth_headers,
        json={"decision": "legitimate"},
    )
    assert r.status_code == 201, r.text
    assert r.json()["status"] == "legitimate"

    # Escalate later with a reason -> history preserved (2 decisions).
    r2 = client.post(
        f"/api/v1/transactions/{tid}/reviews",
        headers=auth_headers,
        json={"decision": "escalated", "reason": "Unusual supplier pattern"},
    )
    assert r2.status_code == 201
    body = r2.json()
    assert body["status"] == "escalated"
    assert len(body["decisions"]) == 2  # history is preserved, not overwritten

    # The transaction's current status now reflects the latest decision.
    det = client.get(f"/api/v1/transactions/{tid}", headers=auth_headers)
    assert det.json()["review_status"] == "escalated"


def test_consequential_decision_requires_reason(client, auth_headers):
    tid = _seed_transaction(client)
    r = client.post(
        f"/api/v1/transactions/{tid}/reviews",
        headers=auth_headers,
        json={"decision": "confirmed_fraud"},  # no reason
    )
    assert r.status_code == 422
    assert "reason is required" in r.json()["detail"].lower()


def test_review_requires_auth(client):
    r = client.post("/api/v1/transactions/1/reviews", json={"decision": "legitimate"})
    assert r.status_code == 401
