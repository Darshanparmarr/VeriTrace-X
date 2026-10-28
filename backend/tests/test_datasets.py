"""Dataset upload & validation tests."""
from __future__ import annotations

import io

from app.services import sample_data


def _upload(client, headers, content: bytes, filename="data.csv"):
    return client.post(
        "/api/v1/datasets/upload",
        headers=headers,
        files={"file": (filename, io.BytesIO(content), "text/csv")},
    )


def test_upload_valid_sample(client, auth_headers):
    csv = sample_data.sample_csv(30).encode()
    r = _upload(client, auth_headers, csv)
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["validation"]["is_valid"] is True
    assert body["validation"]["row_count"] == 30
    assert "order_id" in body["validation"]["required_present"]
    assert len(body["preview"]) > 0


def test_upload_missing_required_columns(client, auth_headers):
    # Only an unrelated column -> order_id & order_value missing -> invalid.
    csv = b"foo,bar\n1,2\n3,4\n"
    r = _upload(client, auth_headers, csv)
    assert r.status_code == 201  # upload accepted, but reported invalid
    v = r.json()["validation"]
    assert v["is_valid"] is False
    assert "order_id" in v["required_missing"]
    assert "order_value" in v["required_missing"]


def test_upload_requires_auth(client):
    r = _upload(client, {}, sample_data.sample_csv(5).encode())
    assert r.status_code == 401


def test_reject_unsupported_type(client, auth_headers):
    r = client.post(
        "/api/v1/datasets/upload",
        headers=auth_headers,
        files={"file": ("notes.pdf", io.BytesIO(b"%PDF-1.4"), "application/pdf")},
    )
    assert r.status_code == 415


def test_empty_file_rejected(client, auth_headers):
    r = _upload(client, auth_headers, b"")
    assert r.status_code == 400


def test_get_dataset_detail(client, auth_headers):
    up = _upload(client, auth_headers, sample_data.sample_csv(10).encode())
    ds_id = up.json()["dataset"]["id"]
    r = client.get(f"/api/v1/datasets/{ds_id}", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["validation_report"]["row_count"] == 10


def test_sample_downloads(client):
    for path in ("/api/v1/datasets/sample/template", "/api/v1/datasets/sample/example"):
        r = client.get(path)
        assert r.status_code == 200
        assert "Order Id" in r.text
