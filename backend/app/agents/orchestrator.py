import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.models import Incident, AgentRun, ResponseAction, AuditLog
from app.agents.triage_agent import triage_agent
from app.agents.investigation_agent import investigation_agent
from app.agents.threat_agent import threat_agent
from app.agents.response_agent import response_agent

logger = logging.getLogger("sec_hindsight.orchestrator")

class AgentOrchestrator:
    """
    Central Agent Orchestrator managing the multi-agent SOC investigation lifecycle:
    NEW -> TRIAGING -> INVESTIGATING -> THREAT_ANALYSIS -> RESPONSE_RECOMMENDED -> AWAITING_APPROVAL
    """

    async def execute_full_investigation(
        self,
        db: AsyncSession,
        incident_id: str
    ) -> Dict[str, Any]:
        # 1. Fetch target incident
        stmt = select(Incident).where(Incident.id == incident_id)
        result = await db.execute(stmt)
        incident = result.scalar_one_or_none()

        if not incident:
            raise ValueError(f"Incident '{incident_id}' not found.")

        # Log orchestration start
        audit = AuditLog(
            incident_id=incident.id,
            actor="AgentOrchestrator",
            action="START_INVESTIGATION",
            details=f"Initiated multi-agent investigation lifecycle for '{incident.title}'"
        )
        db.add(audit)

        # ----------------------------------------------------
        # STEP 1: TRIAGE AGENT
        # ----------------------------------------------------
        incident.status = "TRIAGING"
        await db.commit()

        triage_run = AgentRun(
            incident_id=incident.id,
            agent_name="triage",
            status="RUNNING",
            input_summary=f"Title: {incident.title}, Description: {incident.description[:150]}"
        )
        db.add(triage_run)
        await db.commit()

        try:
            triage_res = await triage_agent.run(
                incident_title=incident.title,
                description=incident.description,
                category_hint=incident.category
            )
            triage_out = triage_res["output"]

            # Update incident model with triage findings
            incident.category = triage_out.get("category", incident.category)
            incident.severity = triage_out.get("severity", incident.severity)
            incident.confidence = float(triage_out.get("confidence", incident.confidence))

            triage_run.status = "COMPLETED"
            triage_run.output_json = triage_out
            triage_run.execution_time_ms = triage_res["execution_time_ms"]
            triage_run.completed_at = datetime.now(timezone.utc)
            await db.commit()
        except Exception as e:
            triage_run.status = "FAILED"
            triage_run.error = str(e)
            incident.status = "FAILED"
            await db.commit()
            raise

        # ----------------------------------------------------
        # STEP 2: INVESTIGATION AGENT (HINDSIGHT MEMORY INTEGRATION)
        # ----------------------------------------------------
        incident.status = "INVESTIGATING"
        await db.commit()

        investigation_run = AgentRun(
            incident_id=incident.id,
            agent_name="investigation",
            status="RUNNING",
            input_summary=f"Category: {incident.category}, Severity: {incident.severity}"
        )
        db.add(investigation_run)
        await db.commit()

        try:
            inv_res = await investigation_agent.run(
                db=db,
                incident_id=incident.id,
                title=incident.title,
                description=incident.description,
                category=incident.category,
                triage_output=triage_out
            )
            inv_out = inv_res["output"]

            investigation_run.status = "COMPLETED"
            investigation_run.output_json = {
                "investigation": inv_out,
                "recalled_memories": inv_res.get("recalled_memories", []),
                "reflection": inv_res.get("reflection", {})
            }
            investigation_run.execution_time_ms = inv_res["execution_time_ms"]
            investigation_run.completed_at = datetime.now(timezone.utc)
            await db.commit()
        except Exception as e:
            investigation_run.status = "FAILED"
            investigation_run.error = str(e)
            incident.status = "FAILED"
            await db.commit()
            raise

        # ----------------------------------------------------
        # STEP 3: THREAT ANALYSIS AGENT (MITRE ATT&CK MAPPING)
        # ----------------------------------------------------
        incident.status = "THREAT_ANALYSIS"
        await db.commit()

        threat_run = AgentRun(
            incident_id=incident.id,
            agent_name="threat",
            status="RUNNING",
            input_summary=f"Evidence & Hindsight findings for {incident.id}"
        )
        db.add(threat_run)
        await db.commit()

        try:
            threat_res = await threat_agent.run(
                incident_title=incident.title,
                description=incident.description,
                category=incident.category,
                investigation_output=inv_out
            )
            threat_out = threat_res["output"]

            threat_run.status = "COMPLETED"
            threat_run.output_json = threat_out
            threat_run.execution_time_ms = threat_res["execution_time_ms"]
            threat_run.completed_at = datetime.now(timezone.utc)
            await db.commit()
        except Exception as e:
            threat_run.status = "FAILED"
            threat_run.error = str(e)
            incident.status = "FAILED"
            await db.commit()
            raise

        # ----------------------------------------------------
        # STEP 4: RESPONSE AGENT
        # ----------------------------------------------------
        incident.status = "RESPONSE_RECOMMENDED"
        await db.commit()

        response_run = AgentRun(
            incident_id=incident.id,
            agent_name="response",
            status="RUNNING",
            input_summary=f"Formulating response strategy for {incident.severity} severity"
        )
        db.add(response_run)
        await db.commit()

        try:
            resp_res = await response_agent.run(
                incident_title=incident.title,
                category=incident.category,
                severity=incident.severity,
                investigation_output=inv_out,
                threat_output=threat_out,
                source_host=incident.source_host or "WORKSTATION-042",
                user_account=incident.user_account or "jdoe",
                ip_address=incident.ip_address or "192.168.1.105"
            )
            resp_out = resp_res["output"]

            # Save recommended actions to ResponseAction DB table
            actions = resp_out.get("recommended_actions", [])
            for act in actions:
                action_record = ResponseAction(
                    incident_id=incident.id,
                    action_type=act["action_type"],
                    target=act["target"],
                    reason=act["reason"],
                    risk_level=act.get("risk_level", "low"),
                    status="PENDING_APPROVAL"
                )
                db.add(action_record)

            response_run.status = "COMPLETED"
            response_run.output_json = resp_out
            response_run.execution_time_ms = resp_res["execution_time_ms"]
            response_run.completed_at = datetime.now(timezone.utc)

            # Set incident final status to AWAITING_APPROVAL
            incident.status = "AWAITING_APPROVAL"
            await db.commit()
        except Exception as e:
            response_run.status = "FAILED"
            response_run.error = str(e)
            incident.status = "FAILED"
            await db.commit()
            raise

        # Return full orchestration result object
        return {
            "incident_id": incident.id,
            "status": incident.status,
            "category": incident.category,
            "severity": incident.severity,
            "confidence": incident.confidence,
            "triage": triage_out,
            "investigation": inv_out,
            "recalled_memories": inv_res.get("recalled_memories", []),
            "reflection": inv_res.get("reflection", {}),
            "threat_analysis": threat_out,
            "response": resp_out
        }

orchestrator = AgentOrchestrator()
