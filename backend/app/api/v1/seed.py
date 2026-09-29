import logging
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete
from app.db.session import get_db
from app.db.models import Incident, IncidentEvidence, HindsightMemory, AuditLog, AgentRun, AnalystDecision, ResponseAction
from app.services.hindsight_service import hindsight_service

logger = logging.getLogger("sec_hindsight.seed")

router = APIRouter(prefix="/seed", tags=["Demo & Data Seeding"])

DEMO_INCIDENTS = [
    {
        "id": "INC-1001",
        "title": "Suspicious Login Attempt via Internal VPN Gateway",
        "description": "Single authentication attempt for user 'jdoe' originating from IP 192.168.1.105 via internal VPN gateway. Standard corporate laptop fingerprint recorded.",
        "category": "credential_compromise",
        "severity": "low",
        "confidence": 0.95,
        "source_host": "WORKSTATION-012",
        "user_account": "jdoe@corp.internal",
        "ip_address": "192.168.1.105",
        "demo_scenario_step": 1,
        "status": "CONTAINED",
        "evidence": [
            {"evidence_type": "auth_log", "description": "Successful Radius Auth via VPN Node internal-east-01"},
            {"evidence_type": "device_fingerprint", "description": "Matching MacAddress & Hardware GUID in Asset DB"}
        ],
        "memory": {
            "evidence_summary": "Single authentication attempt for user 'jdoe' originating from IP 192.168.1.105 via internal VPN gateway. Standard corporate laptop fingerprint recorded.",
            "analyst_decision": "BENIGN_CONFIRMED",
            "response_taken": "NONE_REQUIRED",
            "outcome": "Legitimate corporate VPN usage verified.",
            "lesson_learned": "Unusual login time alone from a verified internal corporate device frequently produces false positives.",
            "tags": ["vpn", "benign", "internal_device"]
        }
    },
    {
        "id": "INC-1002",
        "title": "Suspicious Login from Unrecognized Device Identifier",
        "description": "User 'jdoe' logged in via VPN gateway 192.168.1.105 using an unrecognized device fingerprint (Hardware ID: UNK-DEV-9921). No privilege changes requested.",
        "category": "credential_compromise",
        "severity": "medium",
        "confidence": 0.85,
        "source_host": "UNKNOWN-DEV-9921",
        "user_account": "jdoe@corp.internal",
        "ip_address": "192.168.1.105",
        "demo_scenario_step": 2,
        "status": "AWAITING_APPROVAL",
        "evidence": [
            {"evidence_type": "auth_log", "description": "VPN login successful from unrecognized User-Agent and MAC address."},
            {"evidence_type": "asset_check", "description": "Device UNK-DEV-9921 is not registered in MDM (Intune/Jamf)."}
        ],
        "memory": {
            "evidence_summary": "User 'jdoe' logged in via VPN gateway 192.168.1.105 using an unrecognized device fingerprint (Hardware ID: UNK-DEV-9921). No privilege changes requested.",
            "analyst_decision": "SESSION_VERIFIED",
            "response_taken": "REQUIRE_MFA_REAUTH",
            "outcome": "Unrecognized device verified with user via secondary MFA push.",
            "lesson_learned": "Unrecognized device hardware ID without privilege escalation requires step-up authentication, but does not indicate compromise.",
            "tags": ["vpn", "unknown_device", "mfa_verified"]
        }
    },
    {
        "id": "INC-1003",
        "title": "Suspicious Login + Unknown Device + Privilege Escalation Attempt",
        "description": "User 'jdoe' logged in from unrecognized device UNK-DEV-9921 via IP 192.168.1.105 and immediately initiated a privilege escalation command ('sudo su - root' / token impersonation attempt).",
        "category": "privilege_escalation",
        "severity": "high",
        "confidence": 0.94,
        "source_host": "WORKSTATION-042",
        "user_account": "jdoe@corp.internal",
        "ip_address": "192.168.1.105",
        "demo_scenario_step": 3,
        "status": "NEW",
        "evidence": [
            {"evidence_type": "auth_log", "description": "Authentication event from non-enrolled hardware ID."},
            {"evidence_type": "process_event", "description": "Process spawn: cmd.exe /c powershell -enc ... privilege escalation script."},
            {"evidence_type": "security_log", "description": "Event ID 4672: Special privileges assigned to new logon."}
        ],
        "memory": {
            "evidence_summary": "User 'jdoe' logged in from unrecognized device UNK-DEV-9921 via IP 192.168.1.105 and immediately initiated a privilege escalation command ('sudo su - root' / token impersonation attempt).",
            "analyst_decision": "CONFIRMED_COMPROMISE",
            "response_taken": "ISOLATE_ENDPOINT",
            "outcome": "Host WORKSTATION-042 isolated; active token revoked. Attack contained.",
            "lesson_learned": "Unrecognized device combined with immediate privilege escalation strongly correlates with true compromise.",
            "tags": ["privilege_escalation", "unknown_device", "isolated"]
        }
    },
    {
        "id": "INC-1004",
        "title": "Secondary Privilege Escalation Attempt in Finance Subnet",
        "description": "User 'mchen' logged in from unrecognized IP 10.0.12.44 and executed privilege elevation script targeting domain admin accounts. Identical attack pattern to INC-1003.",
        "category": "privilege_escalation",
        "severity": "critical",
        "confidence": 0.98,
        "source_host": "FINANCE-SERVER-01",
        "user_account": "mchen@corp.internal",
        "ip_address": "10.0.12.44",
        "demo_scenario_step": 4,
        "status": "NEW",
        "evidence": [
            {"evidence_type": "process_event", "description": "Mimikatz LSASS memory dump attempt detected by EDR."},
            {"evidence_type": "network_flow", "description": "High frequency RPC calls to Domain Controller DC-01."}
        ],
        "memory": {
            "evidence_summary": "User 'mchen' logged in from unrecognized IP 10.0.12.44 and executed privilege elevation script targeting domain admin accounts.",
            "analyst_decision": "CONFIRMED_COMPROMISE",
            "response_taken": "ISOLATE_ENDPOINT",
            "outcome": "Host FINANCE-SERVER-01 isolated.",
            "lesson_learned": "Privilege escalation attempts targeting admin credentials require immediate host isolation.",
            "tags": ["privilege_escalation", "finance_server", "isolated"]
        }
    }
]

SYNTHETIC_ATTACK_SCENARIOS = [
    {
        "id": "INC-2001",
        "title": "Distributed Password Spray Attack on Azure AD Gateway",
        "description": "Over 4,500 failed login attempts across 120 user accounts originating from 45 distinct external IP addresses within a 10-minute window.",
        "category": "brute_force",
        "severity": "high",
        "confidence": 0.91,
        "source_host": "AZURE-AD-SSO",
        "user_account": "multiple_users",
        "ip_address": "185.220.101.4",
        "status": "AWAITING_APPROVAL",
        "memory": {
            "evidence_summary": "Over 4,500 failed login attempts across 120 user accounts originating from 45 distinct external IP addresses.",
            "analyst_decision": "BLOCK_IP_RANGE",
            "response_taken": "BLOCK_IP",
            "outcome": "External malicious IP range blocked at edge firewall.",
            "lesson_learned": "Password spray attacks across multiple accounts require blocking source IP ranges.",
            "tags": ["brute_force", "password_spray", "blocked"]
        }
    },
    {
        "id": "INC-2002",
        "title": "Phishing Link Executed: Malicious Attachment Opened",
        "description": "Employee 'asmith' opened 'Invoice_Sept_2026.iso' delivered via external email. Payload spawned obfuscated PowerShell script making outbound C2 connection.",
        "category": "phishing",
        "severity": "high",
        "confidence": 0.93,
        "source_host": "WORKSTATION-109",
        "user_account": "asmith@corp.internal",
        "ip_address": "192.168.1.88",
        "status": "AWAITING_APPROVAL",
        "memory": {
            "evidence_summary": "Employee 'asmith' opened malicious ISO attachment spawning obfuscated PowerShell script.",
            "analyst_decision": "QUARANTINE_HOST",
            "response_taken": "QUARANTINE_FILE",
            "outcome": "Malicious payload quarantined; workstation isolated.",
            "lesson_learned": "ISO attachments executing obfuscated PowerShell must be immediately quarantined.",
            "tags": ["phishing", "powershell", "quarantined"]
        }
    },
    {
        "id": "INC-2003",
        "title": "Ransomware Encryption Activity Detected on Backup Share",
        "description": "Mass file write operations appending '.lockbit' extensions detected on network share \\\\NAS-01\\backups. VSS shadow copies deleted.",
        "category": "malware",
        "severity": "critical",
        "confidence": 0.99,
        "source_host": "NAS-01",
        "user_account": "svc-backup",
        "ip_address": "10.0.4.12",
        "status": "NEW",
        "memory": {
            "evidence_summary": "Mass file write operations appending '.lockbit' extensions detected on backup share.",
            "analyst_decision": "EMERGENCY_SHUTDOWN",
            "response_taken": "ISOLATE_ENDPOINT",
            "outcome": "Backup server isolated before encryption reached primary archives.",
            "lesson_learned": "Ransomware file extension renames mandate automated immediate endpoint isolation.",
            "tags": ["ransomware", "lockbit", "isolated"]
        }
    },
    {
        "id": "INC-2004",
        "title": "Anomalous Cloud S3 Bucket Exfiltration",
        "description": "Over 450 GB of sensitive customer database archives exported from AWS S3 bucket 'corp-prod-db-backups' to an unauthorized GCP Cloud Storage bucket.",
        "category": "data_exfiltration",
        "severity": "critical",
        "confidence": 0.96,
        "source_host": "AWS-S3-GATEWAY",
        "user_account": "aws-admin-dev",
        "ip_address": "54.210.12.89",
        "status": "NEW",
        "memory": {
            "evidence_summary": "Over 450 GB exported from production S3 bucket to external storage bucket.",
            "analyst_decision": "REVOKE_IAM_ROLE",
            "response_taken": "DISABLE_ACCOUNT",
            "outcome": "Access key disabled; egress traffic severed.",
            "lesson_learned": "Unscheduled large data transfers from production storage buckets require IAM credential revocation.",
            "tags": ["exfiltration", "s3", "disabled"]
        }
    }
]

@router.post("")
async def seed_demo_data(db: AsyncSession = Depends(get_db)):
    """
    Seeds database with Master 4-Incident Demo Scenario + synthetic attack scenarios.
    Populates Hindsight Organizational Memory bank with authentic, isolated memories per incident.
    Guaranteed idempotent.
    """
    # 1. Clean existing records for fresh demo reset
    await db.execute(delete(ResponseAction))
    await db.execute(delete(AnalystDecision))
    await db.execute(delete(AgentRun))
    await db.execute(delete(IncidentEvidence))
    await db.execute(delete(Incident))
    await db.execute(delete(HindsightMemory))
    await db.execute(delete(AuditLog))
    await db.commit()

    # 2. Seed Master Demo Incidents and their authentic Hindsight memories
    for item in DEMO_INCIDENTS:
        inc = Incident(
            id=item["id"],
            title=item["title"],
            description=item["description"],
            category=item["category"],
            severity=item["severity"],
            confidence=item["confidence"],
            source_host=item["source_host"],
            user_account=item["user_account"],
            ip_address=item["ip_address"],
            demo_scenario_step=item["demo_scenario_step"],
            status=item["status"]
        )
        db.add(inc)

        for ev in item.get("evidence", []):
            db_ev = IncidentEvidence(
                incident_id=inc.id,
                evidence_type=ev["evidence_type"],
                description=ev["description"]
            )
            db.add(db_ev)

        # Retain authentic memory for this incident
        mem = item.get("memory")
        if mem:
            await hindsight_service.retain_memory(
                db=db,
                incident_id=item["id"],
                category=item["category"],
                evidence_summary=mem["evidence_summary"],
                analyst_decision=mem["analyst_decision"],
                response_taken=mem["response_taken"],
                outcome=mem["outcome"],
                lesson_learned=mem["lesson_learned"],
                tags=mem["tags"]
            )

    # 3. Seed Synthetic Attack Scenarios and their memories
    for item in SYNTHETIC_ATTACK_SCENARIOS:
        inc = Incident(
            id=item["id"],
            title=item["title"],
            description=item["description"],
            category=item["category"],
            severity=item["severity"],
            confidence=item["confidence"],
            source_host=item["source_host"],
            user_account=item["user_account"],
            ip_address=item["ip_address"],
            status=item["status"]
        )
        db.add(inc)

        mem = item.get("memory")
        if mem:
            await hindsight_service.retain_memory(
                db=db,
                incident_id=item["id"],
                category=item["category"],
                evidence_summary=mem["evidence_summary"],
                analyst_decision=mem["analyst_decision"],
                response_taken=mem["response_taken"],
                outcome=mem["outcome"],
                lesson_learned=mem["lesson_learned"],
                tags=mem["tags"]
            )

    await db.commit()

    return {
        "status": "SUCCESS",
        "message": "Demo data & Hindsight memory bank seeded successfully with isolated incident experiences.",
        "master_demo_incidents": [i["id"] for i in DEMO_INCIDENTS],
        "synthetic_scenarios": [i["id"] for i in SYNTHETIC_ATTACK_SCENARIOS]
    }
