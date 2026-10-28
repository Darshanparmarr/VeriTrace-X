"""Auth flow tests."""
from __future__ import annotations


def test_register_login_me(client):
    # Register
    r = client.post(
        "/api/v1/auth/register",
        json={"email": "a@b.com", "full_name": "Ann", "password": "password123"},
    )
    assert r.status_code == 201
    body = r.json()
    assert body["token_type"] == "bearer"
    assert body["user"]["email"] == "a@b.com"
    assert body["user"]["role"] == "analyst"

    # Duplicate email -> 409
    r2 = client.post(
        "/api/v1/auth/register",
        json={"email": "a@b.com", "full_name": "Ann", "password": "password123"},
    )
    assert r2.status_code == 409

    # Login
    r3 = client.post("/api/v1/auth/login", json={"email": "a@b.com", "password": "password123"})
    assert r3.status_code == 200
    token = r3.json()["access_token"]

    # /me with token
    r4 = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r4.status_code == 200
    assert r4.json()["full_name"] == "Ann"


def test_login_wrong_password(client):
    client.post(
        "/api/v1/auth/register",
        json={"email": "c@d.com", "full_name": "Cal", "password": "password123"},
    )
    r = client.post("/api/v1/auth/login", json={"email": "c@d.com", "password": "wrong"})
    assert r.status_code == 401


def test_me_requires_auth(client):
    assert client.get("/api/v1/auth/me").status_code == 401


def test_short_password_rejected(client):
    r = client.post(
        "/api/v1/auth/register",
        json={"email": "e@f.com", "full_name": "Eve", "password": "short"},
    )
    assert r.status_code == 422
