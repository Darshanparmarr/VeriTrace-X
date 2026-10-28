"""Reports, settings (thresholds), and security tests."""
from __future__ import annotations

from app.core.database import get_db
from app.models.transaction import RiskBand, ReviewStatus, Transaction


def _seed(client):
    db = next(client.app.dependency_overrides[get_db]())
    db.add(
        Transaction(
            order_id="VX-R1", supplier="Acme", product="Widget", location="US",
            order_value=500.0, risk_score=0.95, risk_band=RiskBand.critical,
            review_status=ReviewStatus.new, features={"order_value": 500.0},
        )
    )
    db.commit()


# ── Reports ──
def test_report_summary(client, auth_headers):
    _seed(client)
    r = client.get("/api/v1/reports/summary", headers=auth_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["total_transactions"] >= 1
    assert "risk_distribution" in body and "review_outcomes" in body


def test_transactions_csv_export_is_injection_safe(client, auth_headers):
    db = next(client.app.dependency_overrides[get_db]())
    # A malicious-looking supplier that could trigger a formula on open.
    db.add(
        Transaction(
            order_id="VX-CSV", supplier="=cmd|calc", product="X", location="US",
            order_value=1.0, risk_score=0.1, risk_band=RiskBand.low,
            review_status=ReviewStatus.new, features={},
        )
    )
    db.commit()
    r = client.get("/api/v1/reports/transactions.csv", headers=auth_headers)
    assert r.status_code == 200
    assert "attachment" in r.headers["content-disposition"]
    assert "'=cmd|calc" in r.text  # neutralised with a leading quote


def test_reviews_csv(client, auth_headers):
    r = client.get("/api/v1/reports/reviews.csv", headers=auth_headers)
    assert r.status_code == 200


# ── Settings / thresholds ──
def test_get_and_update_thresholds(client, auth_headers):
    r = client.get("/api/v1/settings/thresholds", headers=auth_headers)
    assert r.status_code == 200
    assert r.json() == {"low": 0.25, "medium": 0.5, "high": 0.75}

    ok = client.put("/api/v1/settings/thresholds", headers=auth_headers,
                    json={"low": 0.2, "medium": 0.55, "high": 0.8})
    assert ok.status_code == 200
    assert ok.json()["medium"] == 0.55

    # Persisted
    again = client.get("/api/v1/settings/thresholds", headers=auth_headers)
    assert again.json()["high"] == 0.8


def test_invalid_thresholds_rejected(client, auth_headers):
    bad = client.put("/api/v1/settings/thresholds", headers=auth_headers,
                     json={"low": 0.6, "medium": 0.5, "high": 0.8})  # low >= medium
    assert bad.status_code == 422


# ── Security ──
def test_security_headers_present(client):
    r = client.get("/api/v1/health")
    assert r.headers["x-content-type-options"] == "nosniff"
    assert r.headers["x-frame-options"] == "DENY"
    assert "referrer-policy" in r.headers


def test_login_rate_limited(client):
    # Exceed the login limit (20/60s) -> 429.
    codes = [
        client.post("/api/v1/auth/login", json={"email": "x@y.com", "password": "nope"}).status_code
        for _ in range(25)
    ]
    assert 429 in codes
    assert codes[-1] == 429
