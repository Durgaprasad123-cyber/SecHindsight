from typing import Optional, List
from fastapi import APIRouter, Depends, Query, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.db.session import get_db
from app.db.models import HindsightMemory
from app.services.hindsight_service import hindsight_service

router = APIRouter(prefix="/memories", tags=["Hindsight Memory"])

@router.get("")
async def list_memories(
    category: Optional[str] = None,
    query: Optional[str] = None,
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    if query:
        memories = await hindsight_service.recall_memories(db=db, query_text=query, category=category, top_k=limit)
        return {"memories": memories, "count": len(memories), "query": query}

    stmt = select(HindsightMemory).order_by(desc(HindsightMemory.retained_at)).limit(limit)
    if category:
        stmt = stmt.where(HindsightMemory.category == category)

    res = await db.execute(stmt)
    records = res.scalars().all()

    items = []
    for m in records:
        items.append({
            "id": m.id,
            "incident_id": m.incident_id,
            "bank_id": m.memory_bank_id,
            "category": m.category,
            "evidence_summary": m.evidence_summary,
            "analyst_decision": m.analyst_decision,
            "response_taken": m.response_taken,
            "outcome": m.outcome,
            "lesson_learned": m.lesson_learned,
            "tags": m.tags or [],
            "retained_at": m.retained_at.isoformat() if m.retained_at else None
        })

    return {"memories": items, "count": len(items), "bank_id": hindsight_service.bank_id}


@router.post("/retain")
async def retain_memory(
    payload: dict = Body(...),
    db: AsyncSession = Depends(get_db)
):
    res = await hindsight_service.retain_memory(
        db=db,
        incident_id=payload.get("incident_id", "INC-1003"),
        category=payload.get("category", "privilege_escalation"),
        evidence_summary=payload.get("evidence_summary", "Unrecognized device combined with privilege escalation attempt."),
        analyst_decision=payload.get("analyst_decision", "CONFIRMED_COMPROMISE"),
        response_taken=payload.get("response_taken", "ISOLATE_ENDPOINT"),
        outcome=payload.get("outcome", "Host WORKSTATION-042 isolated; token revoked."),
        lesson_learned=payload.get("lesson_learned", "Unrecognized device hardware ID with privilege escalation requires endpoint isolation."),
        tags=payload.get("tags", ["privilege_escalation", "isolated"])
    )
    return {"status": "SUCCESS", "retained_memory": res}
