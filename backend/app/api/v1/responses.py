from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.db.session import get_db
from app.db.models import ResponseAction, AuditLog

router = APIRouter(prefix="/responses", tags=["Response Simulator & Audit Logs"])

@router.get("")
async def list_responses(
    status: Optional[str] = None,
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(ResponseAction).order_by(desc(ResponseAction.executed_at)).limit(limit)
    if status:
        stmt = stmt.where(ResponseAction.status == status)

    res = await db.execute(stmt)
    actions = res.scalars().all()

    items = []
    for a in actions:
        items.append({
            "id": a.id,
            "incident_id": a.incident_id,
            "action_type": a.action_type,
            "target": a.target,
            "reason": a.reason,
            "risk_level": a.risk_level,
            "status": a.status,
            "approved_by": a.approved_by,
            "execution_details": a.execution_details,
            "executed_at": a.executed_at.isoformat() if a.executed_at else None
        })
    return {"responses": items, "count": len(items)}

@router.get("/audit-logs")
async def list_audit_logs(
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(AuditLog).order_by(desc(AuditLog.timestamp)).limit(limit)
    res = await db.execute(stmt)
    logs = res.scalars().all()

    items = []
    for l in logs:
        items.append({
            "id": l.id,
            "incident_id": l.incident_id,
            "actor": l.actor,
            "action": l.action,
            "details": l.details,
            "timestamp": l.timestamp.isoformat() if l.timestamp else None
        })
    return {"audit_logs": items, "count": len(items)}
