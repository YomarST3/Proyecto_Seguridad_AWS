import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_login_success():
    response = client.post("/api/v1/auth/login", json={
        "email": "admin@salesia.com",
        "password": "admin123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "ADMIN"
    assert data["email"] == "admin@salesia.com"


def test_login_invalid_password():
    response = client.post("/api/v1/auth/login", json={
        "email": "admin@salesia.com",
        "password": "wrong_password"
    })
    assert response.status_code == 401


def test_authenticated_dashboard_summary():
    login_resp = client.post("/api/v1/auth/login", json={
        "email": "admin@salesia.com",
        "password": "admin123"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    dash_resp = client.get("/api/v1/dashboard/summary", headers=headers)
    assert dash_resp.status_code == 200
    dash_data = dash_resp.json()
    assert "confirmed_sales_total" in dash_data
    assert "collected_cash_total" in dash_data
    assert float(dash_data["confirmed_sales_total"]) > 0.0


def test_bayes_endpoint():
    login_resp = client.post("/api/v1/auth/login", json={
        "email": "admin@salesia.com",
        "password": "admin123"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    bayes_resp = client.post("/api/v1/probability/bayes", headers=headers, json={
        "event_a_name": "Recompra",
        "event_b_name": "Descuento",
        "prior_prob_a": 0.25,
        "likelihood_b_given_a": 0.60,
        "marginal_prob_b": 0.30
    })
    assert bayes_resp.status_code == 200
    res = bayes_resp.json()
    # (0.60 * 0.25) / 0.30 = 0.15 / 0.30 = 0.50
    assert res["posterior_prob_a_given_b"] == 0.50
