import logging
from datetime import datetime, timezone
from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.models import Incident, ResponseAction, AuditLog
from app.services.hindsight_service import hindsight_service

logger = logging.getLogger("sec_hindsight.simulator")

class ResponseSimulatorService:
    """
    Safe Defensive Response Action Simulator.
    Executes simulated isolation, IP blocking, session revocation, and account disabling.
    Records realistic execution metrics and auto-retains incident outcomes into Hindsight.
    """
    async def execute_action(
        self,
        db: AsyncSession,
        action_id: str,
        approved_by: str = "SOC Lead Analyst"
    ) -> Dict[str, Any]:
        stmt = select(ResponseAction).where(ResponseAction.id == action_id)
        result = await db.execute(stmt)
        action = result.scalar_one_or_none()

        if not action:
            raise ValueError(f"ResponseAction {action_id} not found.")

        # Mark as executing
        action.status = "APPROVED"
        action.approved_by = approved_by
        action.executed_at = datetime.now(timezone.utc)

        # Build realistic simulated execution metadata based on action type
        now_str = action.executed_at.isoformat()
        target = action.target
        action_type = action.action_type

        execution_details: Dict[str, Any] = {
            "simulation_mode": True,
            "target": target,
            "action_type": action_type,
            "executed_at": now_str,
            "latency_ms": 142.5,
            "agent_verifier": "DefensiveSimulatorEngine v1.0"
        }

        if action_type == "ISOLATE_ENDPOINT":
            execution_details.update({
                "network_adapter": "eth0",
                "isolation_policy": "Drop all non-management traffic",
                "target_previous_state": "ONLINE",
                "target_current_state": "ISOLATED",
                "allowed_channels": ["10.0.0.5 (SOC Agent Console)"]
            })
        elif action_type == "BLOCK_IP":
            execution_details.update({
                "firewall_rule_id": "FW-RULE-9941",
                "target_previous_state": "ACTIVE",
                "target_current_state": "BLOCKED",
                "direction": "INBOUND_OUTBOUND",
                "duration": "PERMANENT"
            })
        elif action_type == "DISABLE_ACCOUNT":
            execution_details.update({
                "directory_service": "Active Directory / Entra ID",
                "target_previous_state": "ACTIVE",
                "target_current_state": "DISABLED",
                "tokens_invalidated": True
            })
        elif action_type == "REVOKE_SESSION":
            execution_details.update({
                "sso_provider": "Okta / Identity Provider",
                "active_sessions_killed": 4,
                "target_previous_state": "VALID_SESSION",
                "target_current_state": "REVOKED",
                "oauth_refresh_tokens_revoked": True
            })
        elif action_type == "QUARANTINE_FILE":
            execution_details.update({
                "file_hash_sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                "quarantine_path": "/var/sec/quarantine/isolated_sample.bin",
                "target_previous_state": "READ_WRITE",
                "target_current_state": "QUARANTINED"
            })
        else:
            execution_details.update({
                "target_previous_state": "ACTIVE",
                "target_current_state": "CONTAINED"
            })

        action.execution_details = execution_details
        action.status = "EXECUTED"

        # Update Incident status to CONTAINED
        inc_stmt = select(Incident).where(Incident.id == action.incident_id)
        inc_result = await db.execute(inc_stmt)
        incident = inc_result.scalar_one_or_none()

        if incident:
            incident.status = "CONTAINED"
            incident.updated_at = datetime.now(timezone.utc)

            # Audit Log Entry
            audit = AuditLog(
                incident_id=incident.id,
                actor=approved_by,
                action=f"EXECUTE_SIMULATED_{action_type}",
                details=f"Executed defensive action '{action_type}' on '{target}'. Incident marked CONTAINED."
            )
            db.add(audit)
            await db.commit()

            # Auto-retain outcome into Hindsight Organizational Memory!
            lesson = (
                f"Incident '{incident.title}' was successfully contained via {action_type} on target '{target}'. "
                f"Historical memory helped analyst confirm threat category '{incident.category}' with {int(incident.confidence*100)}% confidence."
            )
            await hindsight_service.retain_memory(
                db=db,
                incident_id=incident.id,
                category=incident.category,
                evidence_summary=incident.description,
                analyst_decision=f"APPROVED {action_type}",
                response_taken=action_type,
                outcome="Contained successfully",
                lesson_learned=lesson
            )

        return {
            "action_id": action.id,
            "incident_id": action.incident_id,
            "status": "EXECUTED",
            "execution_details": execution_details
        }

simulator_service = ResponseSimulatorService()
