"""End-to-end ML flow: upload -> analyze -> transactions -> explanation.

Skipped automatically if no trained model artifact is present (e.g. fresh CI
checkout without training). Train with: python -m veritrace_ml.train (in ml/).
"""
from __future__ import annotations

import io

import pytest

from app.ml.predictor import predictor
from app.services import sample_data

pytestmark = pytest.mark.skipif(
    not predictor.is_available, reason="no trained model artifact present"
)


def _upload(client, headers, content: bytes, filename="data.csv"):
    return client.post(
        "/api/v1/datasets/upload",
        headers=headers,
        files={"file": (filename, io.BytesIO(content), "text/csv")},
    )


def test_model_card(client, auth_headers):
    r = client.get("/api/v1/model", headers=auth_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "active"
    assert body["algorithm"]
    assert len(body["global_importance"]) > 0


def test_full_analysis_flow(client, auth_headers):
    # Upload a synthetic sample (has the Type/payment column so it's scorable).
    up = _upload(client, auth_headers, sample_data.sample_csv(60).encode())
    assert up.status_code == 201
    dataset_id = up.json()["dataset"]["id"]

    # Run analysis
    an = client.post("/api/v1/analyses", headers=auth_headers, json={"dataset_id": dataset_id})
    assert an.status_code == 201, an.text
    job = an.json()
    assert job["status"] == "completed"
    assert job["summary"]["rows_scored"] == 60

    # List transactions for the analysis (sorted by risk desc)
    tx = client.get(
        f"/api/v1/transactions?analysis_id={job['id']}&page_size=100", headers=auth_headers
    )
    assert tx.status_code == 200
    page = tx.json()
    assert page["total"] == 60
    scores = [t["risk_score"] for t in page["items"] if t["risk_score"] is not None]
    assert scores == sorted(scores, reverse=True)  # ordered by risk

    # Detail + explanation for the top transaction
    top_id = page["items"][0]["id"]
    det = client.get(f"/api/v1/transactions/{top_id}", headers=auth_headers)
    assert det.status_code == 200
    assert det.json()["features"]

    ex = client.get(f"/api/v1/transactions/{top_id}/explanation", headers=auth_headers)
    assert ex.status_code == 200
    exp = ex.json()
    assert exp["available"] is True
    assert len(exp["contributions"]) > 0
    assert exp["method"].startswith("shap")


def test_analysis_requires_existing_dataset(client, auth_headers):
    r = client.post("/api/v1/analyses", headers=auth_headers, json={"dataset_id": 99999})
    assert r.status_code == 404
