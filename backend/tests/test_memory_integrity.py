import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

@pytest.fixture(autouse=True, scope="module")
def setup_seed():
    """Ensure clean seeded environment before test execution."""
    res = client.post("/api/v1/seed")
    assert res.status_code == 200



def test_a_inc_1001_memory_integrity():
    """TEST A: INC-1001 memory contains known corporate laptop evidence and does NOT contain UNK-DEV-9921 or privilege escalation."""
    res = client.get("/api/v1/memories?query=INC-1001")
    assert res.status_code == 200
    memories = res.json()["memories"]
    
    inc_1001_mem = next((m for m in memories if m["incident_id"] == "INC-1001"), None)
    assert inc_1001_mem is not None, "INC-1001 memory must exist"

    ev = inc_1001_mem["evidence_summary"].lower()
    assert "laptop" in ev or "vpn" in ev or "workstation-012" in ev, "INC-1001 must contain corporate laptop evidence"
    assert "unk-dev-9921" not in ev, "INC-1001 evidence must NOT contain UNK-DEV-9921"
    assert "privilege escalation" not in ev, "INC-1001 evidence must NOT contain privilege escalation"
    assert inc_1001_mem["analyst_decision"] == "BENIGN_CONFIRMED"


def test_b_inc_1002_memory_does_not_overwrite_1001():
    """TEST B: INC-1002 memory contains UNK-DEV-9921 and does NOT overwrite INC-1001."""
    res = client.get("/api/v1/memories")
    assert res.status_code == 200
    memories = res.json()["memories"]

    mem_1001 = next((m for m in memories if m["incident_id"] == "INC-1001"), None)
    mem_1002 = next((m for m in memories if m["incident_id"] == "INC-1002"), None)

    assert mem_1001 is not None, "INC-1001 memory must exist"
    assert mem_1002 is not None, "INC-1002 memory must exist"
    assert mem_1001["id"] != mem_1002["id"], "INC-1001 and INC-1002 must have distinct memory IDs"

    assert "unk-dev-9921" in mem_1002["evidence_summary"].lower()
    assert "unk-dev-9921" not in mem_1001["evidence_summary"].lower()


def test_c_inc_1003_memory_content():
    """TEST C: INC-1003 memory contains UNK-DEV-9921 + privilege escalation."""
    res = client.get("/api/v1/memories")
    assert res.status_code == 200
    memories = res.json()["memories"]

    mem_1003 = next((m for m in memories if m["incident_id"] == "INC-1003"), None)
    assert mem_1003 is not None, "INC-1003 memory must exist"

    ev = mem_1003["evidence_summary"].lower()
    assert "unk-dev-9921" in ev, "INC-1003 must contain UNK-DEV-9921"
    assert "privilege" in ev or "escalation" in ev, "INC-1003 must contain privilege escalation"


def test_d_memories_remain_separate_after_investigations():
    """TEST D: INC-1001, INC-1002 and INC-1003 remain separate after all three investigations run."""
    # Trigger investigations for INC-1001, INC-1002, and INC-1003
    r1 = client.post("/api/v1/incidents/INC-1001/investigate")
    assert r1.status_code == 200
    r2 = client.post("/api/v1/incidents/INC-1002/investigate")
    assert r2.status_code == 200
    r3 = client.post("/api/v1/incidents/INC-1003/investigate")
    assert r3.status_code == 200

    # Fetch memories after all investigations
    res = client.get("/api/v1/memories")
    memories = res.json()["memories"]

    mem_1001 = next((m for m in memories if m["incident_id"] == "INC-1001"), None)
    mem_1002 = next((m for m in memories if m["incident_id"] == "INC-1002"), None)
    mem_1003 = next((m for m in memories if m["incident_id"] == "INC-1003"), None)

    assert mem_1001["evidence_summary"] != mem_1002["evidence_summary"]
    assert mem_1001["evidence_summary"] != mem_1003["evidence_summary"]

    assert "unk-dev-9921" not in mem_1001["evidence_summary"].lower()
    assert "privilege escalation" not in mem_1001["evidence_summary"].lower()
    assert mem_1001["analyst_decision"] == "BENIGN_CONFIRMED"


def test_e_seed_idempotency():
    """TEST E: Running /api/v1/seed twice does not corrupt or duplicate the historical memory set."""
    # Seed first time
    res1 = client.post("/api/v1/seed")
    assert res1.status_code == 200

    # Seed second time
    res2 = client.post("/api/v1/seed")
    assert res2.status_code == 200

    # Fetch memories
    res_mem = client.get("/api/v1/memories")
    memories = res_mem.json()["memories"]

    inc_ids = [m["incident_id"] for m in memories]
    assert len(inc_ids) == len(set(inc_ids)), "Every incident memory must have a unique incident_id without duplicates"

    mem_1001 = next(m for m in memories if m["incident_id"] == "INC-1001")
    assert "unk-dev-9921" not in mem_1001["evidence_summary"].lower()


def test_f_recall_for_1003_preserves_historical_evidence():
    """TEST F: Recall for INC-1003 can retrieve relevant historical incidents, but the historical evidence remains faithful to those original incidents."""
    # Run investigation for INC-1003
    r = client.post("/api/v1/incidents/INC-1003/investigate")
    assert r.status_code == 200

    recalled = r.json()["results"]["recalled_memories"]
    assert len(recalled) > 0, "Must recall historical memories"

    rec_1001 = next((m for m in recalled if m["incident_id"] == "INC-1001"), None)
    if rec_1001:
        ev = rec_1001["evidence_summary"].lower()
        assert "unk-dev-9921" not in ev, "Recalled INC-1001 evidence must NOT be corrupted with INC-1003 UNK-DEV-9921"
        assert rec_1001["analyst_decision"] == "BENIGN_CONFIRMED"
