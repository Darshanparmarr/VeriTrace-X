"""Health & dashboard smoke tests."""
from __future__ import annotations


def test_health(client):
    r = client.get("/api/v1/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    # Blockchain is honestly unavailable in dev mode.
    assert body["blockchain"]["status"] == "unavailable"
    assert body["model_status"] == "not_trained"


def test_dashboard_summary_empty_is_demo(client, auth_headers):
    r = client.get("/api/v1/dashboard/summary", headers=auth_headers)
    assert r.status_code == 200
    body = r.json()
    # No analysis run yet -> flagged as demo, zero real transactions.
    assert body["is_demo"] is True
    assert body["analyzed"] == 0
    assert len(body["risk_distribution"]) == 4


def test_root(client):
    r = client.get("/")
    assert r.status_code == 200
    assert r.json()["api"] == "/api/v1"
