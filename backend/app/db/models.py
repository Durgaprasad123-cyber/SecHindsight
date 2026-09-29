import datetime
import uuid
from sqlalchemy import Column, String, Float, Integer, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.db.session import Base

def generate_uuid():
    return str(uuid.uuid4())

def utc_now():
    return datetime.datetime.now(datetime.timezone.utc)

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(100), nullable=False, default="unknown")
    severity = Column(String(50), nullable=False, default="medium")  # low, medium, high, critical
    confidence = Column(Float, nullable=False, default=0.5)
    status = Column(String(50), nullable=False, default="NEW")  # NEW, TRIAGING, INVESTIGATING, THREAT_ANALYSIS, RESPONSE_RECOMMENDED, AWAITING_APPROVAL, CONTAINED, REJECTED, CLOSED, FAILED
    
    source_host = Column(String(100), nullable=True)
    user_account = Column(String(100), nullable=True)
    ip_address = Column(String(100), nullable=True)
    demo_scenario_step = Column(Integer, default=0)

    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    evidence_items = relationship("IncidentEvidence", back_populates="incident", cascade="all, delete-orphan")
    agent_runs = relationship("AgentRun", back_populates="incident", cascade="all, delete-orphan")
    decisions = relationship("AnalystDecision", back_populates="incident", cascade="all, delete-orphan")
    responses = relationship("ResponseAction", back_populates="incident", cascade="all, delete-orphan")


class IncidentEvidence(Base):
    __tablename__ = "incident_evidence"

    id = Column(String, primary_key=True, default=generate_uuid)
    incident_id = Column(String, ForeignKey("incidents.id"), nullable=False)
    evidence_type = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    raw_data = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    incident = relationship("Incident", back_populates="evidence_items")


class AgentRun(Base):
    __tablename__ = "agent_runs"

    id = Column(String, primary_key=True, default=generate_uuid)
    incident_id = Column(String, ForeignKey("incidents.id"), nullable=False)
    agent_name = Column(String(50), nullable=False)  # triage, investigation, threat, response
    status = Column(String(50), nullable=False, default="PENDING")  # PENDING, RUNNING, COMPLETED, FAILED
    input_summary = Column(Text, nullable=True)
    output_json = Column(JSON, nullable=True)
    execution_time_ms = Column(Float, default=0.0)
    error = Column(Text, nullable=True)
    
    started_at = Column(DateTime(timezone=True), default=utc_now)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    incident = relationship("Incident", back_populates="agent_runs")


class AnalystDecision(Base):
    __tablename__ = "analyst_decisions"

    id = Column(String, primary_key=True, default=generate_uuid)
    incident_id = Column(String, ForeignKey("incidents.id"), nullable=False)
    decision = Column(String(50), nullable=False)  # APPROVE, REJECT
    analyst_name = Column(String(100), nullable=False, default="SOC Analyst")
    reasoning = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    incident = relationship("Incident", back_populates="decisions")


class ResponseAction(Base):
    __tablename__ = "response_actions"

    id = Column(String, primary_key=True, default=generate_uuid)
    incident_id = Column(String, ForeignKey("incidents.id"), nullable=False)
    action_type = Column(String(100), nullable=False)  # ISOLATE_ENDPOINT, BLOCK_IP, DISABLE_ACCOUNT, REVOKE_SESSION, QUARANTINE_FILE
    target = Column(String(255), nullable=False)
    reason = Column(Text, nullable=False)
    risk_level = Column(String(50), nullable=False, default="low")
    status = Column(String(50), nullable=False, default="PENDING_APPROVAL")  # PENDING_APPROVAL, APPROVED, EXECUTED, REJECTED, FAILED
    approved_by = Column(String(100), nullable=True)
    execution_details = Column(JSON, nullable=True)
    executed_at = Column(DateTime(timezone=True), nullable=True)

    incident = relationship("Incident", back_populates="responses")


class HindsightMemory(Base):
    __tablename__ = "hindsight_memories"

    id = Column(String, primary_key=True, default=generate_uuid)
    incident_id = Column(String, nullable=False)
    memory_bank_id = Column(String, nullable=False, default="sec-hindsight-soc-bank")
    category = Column(String(100), nullable=False)
    evidence_summary = Column(Text, nullable=False)
    analyst_decision = Column(Text, nullable=False)
    response_taken = Column(Text, nullable=False)
    outcome = Column(Text, nullable=False)
    lesson_learned = Column(Text, nullable=False)
    tags = Column(JSON, nullable=True)
    retained_at = Column(DateTime(timezone=True), default=utc_now)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    incident_id = Column(String, nullable=True)
    actor = Column(String(100), nullable=False, default="System")
    action = Column(String(100), nullable=False)
    details = Column(Text, nullable=False)
    timestamp = Column(DateTime(timezone=True), default=utc_now)
