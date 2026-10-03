import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings
from app.services.ai_service import ai_service
from app.services.gemini_service import gemini_service
from app.services.groq_service import groq_service
from app.agents.investigation_agent import investigation_agent

client = TestClient(app)

@pytest.mark.asyncio
async def test_1_ai_provider_groq_selection():
    """1. Test AI provider selection when AI_PROVIDER = groq."""
    with patch.object(settings, "AI_PROVIDER", "groq"):
        info = ai_service.get_provider_info()
        assert info["provider"] == "groq"
        assert info["model"] == settings.GROQ_MODEL
        assert "groq" in info["supported_providers"]

@pytest.mark.asyncio
async def test_2_ai_provider_gemini_selection():
    """2. Test AI provider selection when AI_PROVIDER = gemini."""
    with patch.object(settings, "AI_PROVIDER", "gemini"):
        info = ai_service.get_provider_info()
        assert info["provider"] == "gemini"
        assert info["model"] == settings.GEMINI_MODEL
        assert "gemini" in info["supported_providers"]

@pytest.mark.asyncio
async def test_3_missing_gemini_api_key():
    """3. Test missing Gemini API key results in controlled fallback."""
    with patch.object(settings, "GEMINI_API_KEY", ""):
        fallback = {"test_status": "fallback_triggered"}
        res = await gemini_service.generate_json(
            system_prompt="Test system prompt",
            user_prompt="Test user prompt",
            fallback_response=fallback
        )
        assert res == fallback

@pytest.mark.asyncio
async def test_4_invalid_provider_handling():
    """4. Test invalid provider name falls back safely to groq without executing arbitrary provider."""
    fallback = {"status": "ok"}
    res = await ai_service.generate_json(
        system_prompt="Test",
        user_prompt="Test",
        fallback_response=fallback,
        provider="unsupported_provider_xyz"
    )
    assert res["_ai_metadata"]["actual_provider"] == "groq"
    assert res["_ai_metadata"]["fallback_used"] is True

@pytest.mark.asyncio
async def test_5_structured_gemini_response():
    """5. Test structured Gemini response generation with mock client."""
    mock_response = MagicMock()
    mock_response.text = '{"assessment": "Suspicious login consistent with travel", "severity": "medium", "confidence": 0.85, "recommendation": "Verify MFA"}'
    
    mock_client = MagicMock()
    mock_client.aio.models.generate_content = AsyncMock(return_value=mock_response)

    with patch.object(settings, "GEMINI_API_KEY", "test_gemini_key_123"):
        with patch("google.genai.Client", return_value=mock_client):
            res = await gemini_service.generate_json(
                system_prompt="Return JSON",
                user_prompt="Analyze incident",
                fallback_response={"fallback": True}
            )
            assert res["severity"] == "medium"
            assert res["confidence"] == 0.85


@pytest.mark.asyncio
async def test_6_provider_error_handling():
    """6. Test provider error/exception handling produces controlled fallback response."""
    with patch.object(groq_service, "generate_json", side_effect=Exception("API Connection Refused")):
        fallback = {"status": "fallback_safe"}
        res = await ai_service.generate_json(
            system_prompt="Test",
            user_prompt="Test",
            fallback_response=fallback,
            provider="groq"
        )
        assert res["status"] == "fallback_safe"

@pytest.mark.asyncio
async def test_7_investigation_agent_works_via_common_ai_interface():
    """7. Test Investigation Agent executes through unified AI Service router."""
    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalars().all.return_value = []
    mock_db.execute = AsyncMock(return_value=mock_result)

    triage_output = {"initial_assessment": "Moderate alert"}
    
    with patch.object(settings, "AI_PROVIDER", "gemini"):
        with patch.object(ai_service, "generate_json", new_callable=AsyncMock) as mock_gen:
            mock_gen.return_value = {
                "recalled_memories_count": 2,
                "key_similarities": ["Same user VPN login gateway"],
                "key_differences": ["Current case includes privilege escalation attempt"],
                "memory_influence_summary": "Recalled benign logins but elevated risk due to sudo attempt",
                "historical_false_positive_risk": "low",
                "recommended_investigation_steps": ["Verify sudo logs"],
                "detailed_analysis": "Evidence consistent with potential token compromise"
            }
            res = await investigation_agent.run(
                db=mock_db,
                incident_id="INC-2047",
                title="Suspicious Login & Sudo Escalation",
                description="User logged in from unknown IP and attempted sudo escalation",
                category="credential_compromise",
                triage_output=triage_output
            )
            assert res["agent"] == "InvestigationAgent"
            assert len(res["output"]["key_differences"]) > 0
            assert mock_gen.called

def test_8_hindsight_recall_independent_of_ai_provider():
    """8. Test Hindsight Recall functions independently of AI provider setting."""
    with patch.object(settings, "AI_PROVIDER", "gemini"):
        res = client.get("/api/v1/memories?category=credential_compromise")
        assert res.status_code == 200
        data = res.json()
        assert "memories" in data

    with patch.object(settings, "AI_PROVIDER", "groq"):
        res = client.get("/api/v1/memories?category=credential_compromise")
        assert res.status_code == 200
        data = res.json()
        assert "memories" in data

def test_9_hindsight_retain_independent_of_ai_provider():
    """9. Test Hindsight Retain functions independently of AI provider setting."""
    payload = {
        "incident_id": "INC-TEST-RETAIN-01",
        "category": "credential_compromise",
        "evidence_summary": "Test evidence for retain independence test",
        "analyst_decision": "BENIGN_CONFIRMED",
        "response_taken": "No action required",
        "outcome": "Resolved false positive",
        "lesson_learned": "Verified user hardware tag match."
    }
    with patch.object(settings, "AI_PROVIDER", "gemini"):
        res = client.post("/api/v1/memories/retain", json=payload)
        assert res.status_code in [200, 201]
        assert res.json()["status"].upper() == "SUCCESS"

def test_10_human_approval_required_before_simulation():
    """10. Test human approval requirement before safe response simulation executes."""
    # Create incident
    inc_res = client.post("/api/v1/incidents", json={
        "title": "Unrecognized Device & Admin Session Attempt",
        "description": "User logged in from unknown IP and attempted admin token access",
        "category": "credential_compromise",
        "severity": "high"
    })
    assert inc_res.status_code == 201
    inc_id = inc_res.json()["id"]

    # Approve response for created incident
    app_res = client.post(f"/api/v1/incidents/{inc_id}/approve", json={
        "decision": "APPROVE",
        "analyst_name": "SOC Lead Analyst",
        "reasoning": "Explicit human approval granted"
    })
    assert app_res.status_code == 200
    data = app_res.json()
    assert data["decision"] == "APPROVED"
    assert "simulated defensive isolation executed" in data["message"].lower()

def test_11_ai_provider_api_endpoint():
    """11. Test GET /api/v1/ai/provider endpoint."""
    res = client.get("/api/v1/ai/provider")
    assert res.status_code == 200
    data = res.json()
    assert "provider" in data
    assert "model" in data
    assert "supported_providers" in data
