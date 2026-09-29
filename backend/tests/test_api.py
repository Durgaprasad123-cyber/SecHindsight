import pytest
import httpx
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "integrations" in data

    integrations = data["integrations"]
    
    # Test Groq Integration status
    groq = integrations["groq_llm"]
    assert groq["configured"] is True
    assert groq["model"] == "openai/gpt-oss-120b"

    # Test Hindsight Cloud Memory status
    hindsight = integrations["hindsight_memory"]
    assert hindsight["configured"] is True
    assert hindsight["bank_id"] == "sechindsight"

    # Test Database / Supabase status
    db = integrations["database"]
    assert db["supabase_configured"] is True
    assert db["url_type"] == "postgres"


def test_list_incidents():
    response = client.get("/api/v1/incidents")
    assert response.status_code == 200
    data = response.json()
    assert "incidents" in data


def test_list_threats():
    response = client.get("/api/v1/threats")
    assert response.status_code == 200
    data = response.json()
    assert "techniques" in data
    assert data["count"] > 0
