import time
import logging
from typing import Dict, Any, List
from app.services.ai_service import ai_service

logger = logging.getLogger("sec_hindsight.agent.response")

class ResponseAgent:
    """
    Response Agent: Generates targeted defensive response action recommendations.
    Provides clear risk evaluations, operational impact warnings, and mandates
    human analyst approval before any defensive simulation executes.
    Uses unified AI Service (Groq / Gemini).
    """
    async def run(
        self,
        incident_title: str,
        category: str,
        severity: str,
        investigation_output: Dict[str, Any],
        threat_output: Dict[str, Any],
        source_host: str = "WORKSTATION-042",
        user_account: str = "jdoe",
        ip_address: str = "192.168.1.105"
    ) -> Dict[str, Any]:
        start_time = time.time()

        system_prompt = (
            "You are an expert SOC Response AI Agent in a defensive copilot system. "
            "Formulate safe defensive response action recommendations requiring analyst approval. "
            "IMPORTANT: All actions are advisory recommendations requiring explicit human approval. "
            "Never claim destructive actions have been autonomously executed."
        )

        user_prompt = f"""
Incident: {incident_title}
Category: {category}
Severity: {severity}
Target Host: {source_host}
User Account: {user_account}
IP Address: {ip_address}
Threat Attack Stage: {threat_output.get('attack_stage', 'Initial Access')}

Provide a JSON object with this schema:
{{
  "recommended_actions": [
    {{
      "action_type": "ISOLATE_ENDPOINT" | "BLOCK_IP" | "DISABLE_ACCOUNT" | "REVOKE_SESSION" | "QUARANTINE_FILE",
      "target": "target host, IP, or username",
      "reason": "Clear explanation of why this action is recommended",
      "risk_level": "low" | "medium" | "high",
      "operational_impact": "Operational impact description (e.g. user disconnected from network)"
    }}
  ],
  "response_strategy": "Overall containment strategy summary",
  "requires_human_approval": true,
  "urgency": "IMMEDIATE" | "HIGH" | "STANDARD"
}}
"""

        # Deterministic fallback response
        recommended_actions = []

        if severity in ["high", "critical"] or "privilege" in incident_title.lower() or "privilege" in category.lower():
            recommended_actions.append({
                "action_type": "ISOLATE_ENDPOINT",
                "target": source_host or "WORKSTATION-042",
                "reason": "Prevent potential lateral movement and contain elevated administrative access.",
                "risk_level": "medium",
                "operational_impact": "Host will be severed from corporate LAN; management agent remains online."
            })
            recommended_actions.append({
                "action_type": "REVOKE_SESSION",
                "target": user_account or "jdoe@corp.internal",
                "reason": "Terminate active compromised authentication tokens and force password reset.",
                "risk_level": "low",
                "operational_impact": "User logged out of active SaaS & SSO sessions."
            })
        elif "device" in incident_title.lower() or severity == "medium":
            recommended_actions.append({
                "action_type": "REVOKE_SESSION",
                "target": user_account or "jdoe@corp.internal",
                "reason": "Invalidate unverified session tokens from unrecognized device hardware.",
                "risk_level": "low",
                "operational_impact": "User prompted to complete 2FA re-authentication."
            })
        else:
            recommended_actions.append({
                "action_type": "BLOCK_IP",
                "target": ip_address or "192.168.1.105",
                "reason": "Temporarily block remote ingress traffic from external VPN gateway node.",
                "risk_level": "low",
                "operational_impact": "Inbound connection attempts from target IP blocked at edge."
            })

        fallback = {
            "recommended_actions": recommended_actions,
            "response_strategy": f"Targeted containment plan for {severity.upper()} severity incident.",
            "requires_human_approval": True,
            "urgency": "IMMEDIATE" if severity in ["high", "critical"] else "STANDARD"
        }

        output = await ai_service.generate_json(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            fallback_response=fallback
        )

        execution_time_ms = round((time.time() - start_time) * 1000, 2)
        return {
            "agent": "ResponseAgent",
            "execution_time_ms": execution_time_ms,
            "output": output
        }

response_agent = ResponseAgent()
