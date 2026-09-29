from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.db.session import get_db
from app.db.models import Incident, IncidentEvidence, AgentRun, AnalystDecision, ResponseAction, AuditLog
from app.agents.orchestrator import orchestrator
from app.services.simulator_service import simulator_service

router = APIRouter(prefix="/incidents", tags=["Incidents"])

class IncidentCreateSchema(BaseModel):
    title: str
    description: str
    category: str = "credential_compromise"
    severity: str = "medium"
    source_host: Optional[str] = "WORKSTATION-042"
    user_account: Optional[str] = "jdoe"
    ip_address: Optional[str] = "192.168.1.105"
    demo_scenario_step: Optional[int] = 0

class DecisionSchema(BaseModel):
    decision: str = "APPROVE"  # APPROVE or REJECT
    analyst_name: str = "SOC Lead Analyst"
    reasoning: Optional[str] = "Confirmed threat based on evidence delta & Hindsight memory influence."
    action_id: Optional[str] = None

@router.get("")
async def list_incidents(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Incident).order_by(desc(Incident.created_at)).limit(limit)
    if status:
        stmt = stmt.where(Incident.status == status)
    if severity:
        stmt = stmt.where(Incident.severity == severity)
    if category:
        stmt = stmt.where(Incident.category == category)

    result = await db.execute(stmt)
    incidents = result.scalars().all()

    items = []
    for inc in incidents:
        items.append({
            "id": inc.id,
            "title": inc.title,
            "description": inc.description,
            "category": inc.category,
            "severity": inc.severity,
            "confidence": inc.confidence,
            "status": inc.status,
            "source_host": inc.source_host,
            "user_account": inc.user_account,
            "ip_address": inc.ip_address,
            "demo_scenario_step": inc.demo_scenario_step,
            "created_at": inc.created_at.isoformat() if inc.created_at else None,
            "updated_at": inc.updated_at.isoformat() if inc.updated_at else None
        })
    return {"incidents": items, "count": len(items)}


@router.post("", status_code=201)
async def create_incident(
    payload: IncidentCreateSchema,
    db: AsyncSession = Depends(get_db)
):
    incident = Incident(
        title=payload.title,
        description=payload.description,
        category=payload.category,
        severity=payload.severity,
        confidence=0.5,
        status="NEW",
        source_host=payload.source_host,
        user_account=payload.user_account,
        ip_address=payload.ip_address,
        demo_scenario_step=payload.demo_scenario_step
    )
    db.add(incident)
    
    # Audit log
    audit = AuditLog(
        incident_id=incident.id,
        actor="SIEM Ingestion API",
        action="CREATE_INCIDENT",
        details=f"Created incident '{payload.title}' with severity {payload.severity}"
    )
    db.add(audit)
    
    await db.commit()
    await db.refresh(incident)

    return {
        "id": incident.id,
        "title": incident.title,
        "status": incident.status,
        "message": "Incident created successfully."
    }


@router.get("/{incident_id}")
async def get_incident(
    incident_id: str,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Incident).where(Incident.id == incident_id)
    res = await db.execute(stmt)
    inc = res.scalar_one_or_none()

    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found.")

    # Fetch evidence
    ev_stmt = select(IncidentEvidence).where(IncidentEvidence.incident_id == incident_id)
    ev_res = await db.execute(ev_stmt)
    evidence = ev_res.scalars().all()

    # Fetch agent runs
    ar_stmt = select(AgentRun).where(AgentRun.incident_id == incident_id).order_by(AgentRun.started_at)
    ar_res = await db.execute(ar_stmt)
    agent_runs = ar_res.scalars().all()

    # Fetch decisions
    dec_stmt = select(AnalystDecision).where(AnalystDecision.incident_id == incident_id)
    dec_res = await db.execute(dec_stmt)
    decisions = dec_res.scalars().all()

    # Fetch responses
    resp_stmt = select(ResponseAction).where(ResponseAction.incident_id == incident_id)
    resp_res = await db.execute(resp_stmt)
    responses = resp_res.scalars().all()

    return {
        "incident": {
            "id": inc.id,
            "title": inc.title,
            "description": inc.description,
            "category": inc.category,
            "severity": inc.severity,
            "confidence": inc.confidence,
            "status": inc.status,
            "source_host": inc.source_host,
            "user_account": inc.user_account,
            "ip_address": inc.ip_address,
            "demo_scenario_step": inc.demo_scenario_step,
            "created_at": inc.created_at.isoformat() if inc.created_at else None,
            "updated_at": inc.updated_at.isoformat() if inc.updated_at else None
        },
        "evidence": [
            {
                "id": e.id,
                "evidence_type": e.evidence_type,
                "description": e.description,
                "raw_data": e.raw_data,
                "created_at": e.created_at.isoformat() if e.created_at else None
            } for e in evidence
        ],
        "agent_runs": [
            {
                "id": r.id,
                "agent_name": r.agent_name,
                "status": r.status,
                "input_summary": r.input_summary,
                "output_json": r.output_json,
                "execution_time_ms": r.execution_time_ms,
                "error": r.error,
                "started_at": r.started_at.isoformat() if r.started_at else None,
                "completed_at": r.completed_at.isoformat() if r.completed_at else None
            } for r in agent_runs
        ],
        "decisions": [
            {
                "id": d.id,
                "decision": d.decision,
                "analyst_name": d.analyst_name,
                "reasoning": d.reasoning,
                "created_at": d.created_at.isoformat() if d.created_at else None
            } for d in decisions
        ],
        "responses": [
            {
                "id": r.id,
                "action_type": r.action_type,
                "target": r.target,
                "reason": r.reason,
                "risk_level": r.risk_level,
                "status": r.status,
                "approved_by": r.approved_by,
                "execution_details": r.execution_details,
                "executed_at": r.executed_at.isoformat() if r.executed_at else None
            } for r in responses
        ]
    }


@router.post("/{incident_id}/investigate")
async def trigger_investigation(
    incident_id: str,
    db: AsyncSession = Depends(get_db)
):
    try:
        res = await orchestrator.execute_full_investigation(db, incident_id)
        return {
            "incident_id": incident_id,
            "status": "COMPLETED",
            "results": res
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{incident_id}/approve")
async def approve_response(
    incident_id: str,
    payload: DecisionSchema,
    db: AsyncSession = Depends(get_db)
):
    # 1. Record analyst decision
    decision = AnalystDecision(
        incident_id=incident_id,
        decision="APPROVE",
        analyst_name=payload.analyst_name,
        reasoning=payload.reasoning
    )
    db.add(decision)
    await db.commit()

    # 2. Find pending response action to execute
    stmt = select(ResponseAction).where(
        ResponseAction.incident_id == incident_id,
        ResponseAction.status == "PENDING_APPROVAL"
    )
    if payload.action_id:
        stmt = select(ResponseAction).where(ResponseAction.id == payload.action_id)

    res = await db.execute(stmt)
    action = res.scalars().first()

    if not action:
        # If no explicit pending action record, create & execute default isolation action
        inc_stmt = select(Incident).where(Incident.id == incident_id)
        inc_res = await db.execute(inc_stmt)
        inc = inc_res.scalar_one_or_none()
        
        action = ResponseAction(
            incident_id=incident_id,
            action_type="ISOLATE_ENDPOINT",
            target=inc.source_host if inc else "WORKSTATION-042",
            reason="Analyst approved defensive endpoint isolation.",
            risk_level="medium",
            status="PENDING_APPROVAL"
        )
        db.add(action)
        await db.commit()
        await db.refresh(action)

    # 3. Execute simulated response action
    sim_res = await simulator_service.execute_action(
        db=db,
        action_id=action.id,
        approved_by=payload.analyst_name
    )

    return {
        "incident_id": incident_id,
        "decision": "APPROVED",
        "action_executed": sim_res,
        "message": "Response action approved and simulated defensive isolation executed successfully. Outcome retained in Hindsight."
    }


@router.post("/{incident_id}/reject")
async def reject_response(
    incident_id: str,
    payload: DecisionSchema,
    db: AsyncSession = Depends(get_db)
):
    decision = AnalystDecision(
        incident_id=incident_id,
        decision="REJECT",
        analyst_name=payload.analyst_name,
        reasoning=payload.reasoning or "Analyst rejected automated response action."
    )
    db.add(decision)

    # Update incident & actions to REJECTED
    inc_stmt = select(Incident).where(Incident.id == incident_id)
    inc_res = await db.execute(inc_stmt)
    inc = inc_res.scalar_one_or_none()
    if inc:
        inc.status = "REJECTED"

    resp_stmt = select(ResponseAction).where(ResponseAction.incident_id == incident_id)
    resp_res = await db.execute(resp_stmt)
    actions = resp_res.scalars().all()
    for act in actions:
        act.status = "REJECTED"

    await db.commit()
    return {
        "incident_id": incident_id,
        "status": "REJECTED",
        "message": "Response action rejected by analyst."
    }
