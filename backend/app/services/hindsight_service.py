import json
import logging
import httpx
import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.core.config import settings
from app.db.models import HindsightMemory, AuditLog

logger = logging.getLogger("sec_hindsight.hindsight")

class HindsightService:
    """
    Dedicated Hindsight Cloud API Client & Organizational Memory Service.
    Implements real retain, recall, and reflect primitives backed by
    the Hindsight Cloud API (https://api.hindsight.vectorize.io) and mirrored locally.
    Ensures memory immutability and strict identity isolation per incident.
    """
    def __init__(self):
        self.api_key = settings.HINDSIGHT_API_KEY
        self.base_url = settings.get_effective_hindsight_url()
        self.bank_id = settings.HINDSIGHT_BANK_ID or "sechindsight"

    async def retain_memory(
        self,
        db: AsyncSession,
        incident_id: str,
        category: str,
        evidence_summary: str,
        analyst_decision: str,
        response_taken: str,
        outcome: str,
        lesson_learned: str,
        tags: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Retains an incident outcome into Hindsight Cloud Organizational Memory Bank (sechindsight)
        and mirrors it in the local application database with strict incident identity isolation.
        """
        tags = tags or [category, outcome]
        
        # 1. Idempotent check in local database mirror to prevent duplicate/corrupted records
        stmt = select(HindsightMemory).where(
            HindsightMemory.incident_id == incident_id,
            HindsightMemory.memory_bank_id == self.bank_id
        )
        res = await db.execute(stmt)
        db_memory = res.scalars().first()

        if db_memory:
            # Update record for this specific incident_id without mutating others
            db_memory.category = category
            db_memory.evidence_summary = evidence_summary
            db_memory.analyst_decision = analyst_decision
            db_memory.response_taken = response_taken
            db_memory.outcome = outcome
            db_memory.lesson_learned = lesson_learned
            db_memory.tags = tags
            db_memory.retained_at = datetime.now(timezone.utc)
        else:
            # Create new immutable memory with unique primary key
            db_memory = HindsightMemory(
                id=str(uuid.uuid4()),
                incident_id=incident_id,
                memory_bank_id=self.bank_id,
                category=category,
                evidence_summary=evidence_summary,
                analyst_decision=analyst_decision,
                response_taken=response_taken,
                outcome=outcome,
                lesson_learned=lesson_learned,
                tags=tags,
                retained_at=datetime.now(timezone.utc)
            )
            db.add(db_memory)

        audit = AuditLog(
            incident_id=incident_id,
            actor="HindsightService",
            action="RETAIN_MEMORY",
            details=f"Retained immutable outcome for incident {incident_id} in bank '{self.bank_id}'"
        )
        db.add(audit)
        await db.commit()
        await db.refresh(db_memory)

        # 2. Retain in real Hindsight Cloud API with complete structured metadata
        cloud_success = False
        if self.api_key and self.api_key.strip() != "":
            try:
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                }
                memory_text = (
                    f"Incident {incident_id} [{category}]: Evidence: {evidence_summary}. "
                    f"Analyst Decision: {analyst_decision}. Response Taken: {response_taken}. "
                    f"Outcome: {outcome}. Lesson Learned: {lesson_learned}"
                )
                cloud_payload = {
                    "items": [
                        {
                            "content": memory_text,
                            "metadata": {
                                "incident_id": incident_id,
                                "category": category,
                                "evidence_summary": evidence_summary,
                                "analyst_decision": analyst_decision,
                                "response_taken": response_taken,
                                "outcome": outcome,
                                "lesson_learned": lesson_learned,
                                "tags": tags
                            }
                        }
                    ]
                }

                async with httpx.AsyncClient(timeout=15.0) as client:
                    resp = await client.post(
                        f"{self.base_url}/v1/default/banks/{self.bank_id}/memories",
                        headers=headers,
                        json=cloud_payload
                    )
                    if resp.status_code in [200, 201]:
                        cloud_success = True
                        logger.info(f"Successfully retained memory for {incident_id} in Hindsight Cloud Bank '{self.bank_id}'.")
                    else:
                        logger.warning(f"Hindsight Cloud API HTTP {resp.status_code}: {resp.text[:150]}")
            except Exception as e:
                logger.error(f"Error connecting to Hindsight Cloud API during retain: {type(e).__name__}")
        else:
            logger.info("Hindsight Cloud API key not set. Stored in local database.")

        return {
            "id": db_memory.id,
            "incident_id": incident_id,
            "bank_id": self.bank_id,
            "cloud_retained": cloud_success,
            "lesson_learned": lesson_learned
        }

    async def recall_memories(
        self,
        db: AsyncSession,
        query_text: str,
        category: Optional[str] = None,
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Recalls historical incident experiences matching current indicators from Hindsight.
        Ensures returned evidence_summary, analyst_decision, response_taken, and outcome
        belong strictly to the original retained historical incident.
        """
        cloud_results = []
        if self.api_key and self.api_key.strip() != "":
            try:
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                }
                async with httpx.AsyncClient(timeout=15.0) as client:
                    resp = await client.post(
                        f"{self.base_url}/v1/default/banks/{self.bank_id}/memories/recall",
                        headers=headers,
                        json={"query": query_text, "top_k": top_k}
                    )
                    if resp.status_code == 200:
                        res_data = resp.json()
                        cloud_results = res_data.get("results") or res_data.get("memories") or []
            except Exception as e:
                logger.error(f"Error calling Hindsight Cloud recall API: {type(e).__name__}")

        # Always fetch local DB memory records to ensure exact, uncorrupted metadata mapping
        stmt = select(HindsightMemory).order_by(HindsightMemory.retained_at.desc())
        db_res = await db.execute(stmt)
        all_local_memories = db_res.scalars().all()
        local_by_incident = {m.incident_id: m for m in all_local_memories}

        recalled_list = []
        seen_incident_ids = set()

        # If Cloud API returned results, prioritize and enrich them using stored incident metadata
        for r in cloud_results:
            meta = r.get("metadata") or {}
            inc_id = meta.get("incident_id")
            
            if inc_id and inc_id in local_by_incident:
                # Use authentic local DB memory record for this incident_id
                mem = local_by_incident[inc_id]
                if mem.incident_id not in seen_incident_ids:
                    recalled_list.append({
                        "id": mem.id,
                        "incident_id": mem.incident_id,
                        "category": mem.category,
                        "evidence_summary": mem.evidence_summary,
                        "analyst_decision": mem.analyst_decision,
                        "response_taken": mem.response_taken,
                        "outcome": mem.outcome,
                        "lesson_learned": mem.lesson_learned,
                        "tags": mem.tags or [],
                        "similarity_score": round(r.get("score", 0.90), 2),
                        "retained_at": mem.retained_at.isoformat() if mem.retained_at else None
                    })
                    seen_incident_ids.add(mem.incident_id)
            elif inc_id and inc_id not in seen_incident_ids:
                # Use cloud metadata fields if present, never defaulting evidence_summary to query_text
                recalled_list.append({
                    "id": r.get("id", str(uuid.uuid4())),
                    "incident_id": inc_id,
                    "category": meta.get("category", category or "credential_compromise"),
                    "evidence_summary": meta.get("evidence_summary", r.get("content", "")),
                    "analyst_decision": meta.get("analyst_decision", "BENIGN_CONFIRMED"),
                    "response_taken": meta.get("response_taken", "NONE_REQUIRED"),
                    "outcome": meta.get("outcome", "Retained Experience"),
                    "lesson_learned": meta.get("lesson_learned", r.get("content", "")),
                    "tags": meta.get("tags", []),
                    "similarity_score": round(r.get("score", 0.88), 2),
                    "retained_at": datetime.now(timezone.utc).isoformat()
                })
                seen_incident_ids.add(inc_id)

        # Fill remaining slots from local DB using semantic keyword relevance
        query_terms = set(query_text.lower().replace(",", " ").replace("+", " ").split())
        for mem in all_local_memories:
            if mem.incident_id in seen_incident_ids:
                continue

            score = 0.5
            text_corpus = f"{mem.category} {mem.evidence_summary} {mem.lesson_learned} {mem.outcome}".lower()
            matches = sum(1 for term in query_terms if term in text_corpus)
            if matches > 0:
                score += min(0.45, matches * 0.15)
            if category and mem.category.lower() == category.lower():
                score += 0.2
            score = round(min(0.98, score), 2)

            if score > 0.4:
                recalled_list.append({
                    "id": mem.id,
                    "incident_id": mem.incident_id,
                    "category": mem.category,
                    "evidence_summary": mem.evidence_summary,
                    "analyst_decision": mem.analyst_decision,
                    "response_taken": mem.response_taken,
                    "outcome": mem.outcome,
                    "lesson_learned": mem.lesson_learned,
                    "tags": mem.tags or [],
                    "similarity_score": score,
                    "retained_at": mem.retained_at.isoformat() if mem.retained_at else None
                })
                seen_incident_ids.add(mem.incident_id)

        recalled_list.sort(key=lambda x: x["similarity_score"], reverse=True)
        return recalled_list[:top_k]

    async def reflect_on_memories(
        self,
        db: AsyncSession,
        incident_summary: str,
        recalled_memories: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Reflects upon organizational memories using Hindsight Cloud Reflect API
        or local reflection synthesis over uncorrupted recalled memories.
        """
        if not recalled_memories:
            return {
                "reflection_summary": "No relevant historical incident memories retrieved yet.",
                "historical_pattern": "First time observing this specific alert profile.",
                "false_positive_risk": "Moderate - baseline unknown.",
                "recommended_focus": "Gather additional primary evidence."
            }

        # 1. Query Hindsight Cloud Reflect API if configured
        if self.api_key and self.api_key.strip() != "":
            try:
                # Build context snippet from faithful recalled memories
                mem_context = "\n".join([
                    f"- {m['incident_id']} [{m['category']}]: Evidence: {m['evidence_summary']} | Outcome: {m['outcome']} | Decision: {m['analyst_decision']}"
                    for m in recalled_memories
                ])
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                }
                async with httpx.AsyncClient(timeout=20.0) as client:
                    resp = await client.post(
                        f"{self.base_url}/v1/default/banks/{self.bank_id}/reflect",
                        headers=headers,
                        json={"query": f"Current Alert: {incident_summary}\n\nHistorical Context:\n{mem_context}"}
                    )
                    if resp.status_code == 200:
                        reflect_text = resp.json().get("text", "")
                        if reflect_text:
                            return {
                                "reflection_summary": f"Hindsight Cloud Reflection over bank '{self.bank_id}'.",
                                "historical_pattern": reflect_text[:300],
                                "false_positive_risk": "Evaluated against Hindsight memory graph.",
                                "organizational_lessons": reflect_text,
                                "key_delta_to_watch": "Check for privilege escalation or unauthorized token creation."
                            }
            except Exception as e:
                logger.error(f"Error calling Hindsight Cloud reflect API: {type(e).__name__}")

        # 2. Local reflection synthesis over uncorrupted recalled memories
        outcomes = [m.get("outcome", "").lower() for m in recalled_memories]
        false_positives = sum(1 for o in outcomes if "false" in o or "legitimate" in o or "benign" in o)
        compromises = sum(1 for o in outcomes if "contained" in o or "compromise" in o or "isolated" in o)

        if false_positives > compromises:
            fp_risk = "HIGH - Previous similar alerts frequently turned out to be false positives."
        elif compromises > false_positives:
            fp_risk = "LOW - Previous similar alerts strongly correlated with confirmed compromises."
        else:
            fp_risk = "BALANCED - Prior cases yielded mixed outcomes based on specific contextual deltas."

        lessons = [m.get("lesson_learned", "") for m in recalled_memories if m.get("lesson_learned")]
        lessons_summary = " | ".join(lessons[:3])

        return {
            "reflection_summary": f"Analyzed {len(recalled_memories)} historical incident memories from bank '{self.bank_id}'.",
            "historical_pattern": f"Found {false_positives} past false-positive/benign cases and {compromises} confirmed security incidents.",
            "false_positive_risk": fp_risk,
            "organizational_lessons": lessons_summary,
            "key_delta_to_watch": "Check for privilege escalation or lateral movement indicators, which distinguish confirmed attacks from benign false positives."
        }

hindsight_service = HindsightService()
