import time
import logging
from typing import Dict, Any, List
from app.services.mitre_service import mitre_service
from app.services.ai_service import ai_service

logger = logging.getLogger("sec_hindsight.agent.threat")

class ThreatAnalysisAgent:
    """
    Threat Analysis Agent: Maps incident evidence to official MITRE ATT&CK techniques
    and clearly distinguishes factual evidence from analytical inferences.
    Uses unified AI Service (Groq / Gemini) for threat synthesis.
    """
    async def run(
        self,
        incident_title: str,
        description: str,
        category: str,
        investigation_output: Dict[str, Any]
    ) -> Dict[str, Any]:
        start_time = time.time()

        # 1. Fetch official MITRE ATT&CK technique matches from service
        mitre_matches = mitre_service.match_evidence_to_techniques(description, category)

        # 2. Structure Evidence vs Inference mapping
        facts = []
        inferences = []

        desc_lower = description.lower()
        if "login" in desc_lower or "vpn" in desc_lower:
            facts.append("Factual: User authenticated via corporate VPN gateway.")
        if "unknown device" in desc_lower:
            facts.append("Factual: Device fingerprint GUID does not match registered endpoint inventory.")
        if "privilege" in desc_lower or "escalation" in desc_lower:
            facts.append("Factual: Elevated permission request issued (sudo / admin privileges).")

        if "privilege" in desc_lower:
            inferences.append("Inference: Evidence is consistent with potential post-exploitation administrative access attempt.")
            inferences.append("Inference: Initial authentication tokens may have been harvested via phishing or credential reuse.")
        else:
            inferences.append("Inference: User may be traveling or logging in from a newly issued personal device.")

        # 3. LLM Threat Synthesis via AI Service
        system_prompt = (
            "You are an expert Cybersecurity Threat Analysis AI Agent. "
            "Map incident indicators to verified MITRE ATT&CK techniques and clearly separate evidence from inference. "
            "IMPORTANT RULES:\n"
            "1. Never state 'This proves an attack'. Use cautious language like 'Evidence is consistent with...', 'Possible threat context...'.\n"
            "2. Do not invent non-standard MITRE ATT&CK techniques. Explain why matched techniques apply based on structured security knowledge."
        )

        user_prompt = f"""
Incident: {incident_title}
Category: {category}
Description: {description}
Key Deltas: {investigation_output.get('key_differences', [])}

Matched MITRE Techniques:
{mitre_matches}

Provide a JSON object with this schema:
{{
  "mitre_techniques": [
    {{
      "id": "T1078",
      "name": "Valid Accounts",
      "tactic": "Initial Access",
      "confidence": float,
      "reasoning": "why technique applies"
    }}
  ],
  "threat_summary": "Executive threat landscape summary",
  "attack_stage": "Initial Access" | "Privilege Escalation" | "Persistence" | "Exfiltration",
  "facts": ["list of verified empirical facts"],
  "inferences": ["list of analytical inferences"]
}}
"""

        fallback = {
            "mitre_techniques": [
                {
                    "id": m["id"],
                    "name": m["name"],
                    "tactic": m["tactic"],
                    "confidence": m.get("confidence", 0.90),
                    "reasoning": m.get("reasoning", "Evidence aligns with official MITRE ATT&CK technique definition.")
                }
                for m in mitre_matches[:3]
            ],
            "threat_summary": f"Threat Analysis completed for '{incident_title}'. Matched {len(mitre_matches)} MITRE ATT&CK techniques.",
            "attack_stage": "Privilege Escalation" if "privilege" in desc_lower else "Initial Access",
            "facts": facts or ["User authentication event recorded in SOC SIEM logs."],
            "inferences": inferences or ["Potential unauthorized credential usage detected."]
        }

        output = await ai_service.generate_json(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            fallback_response=fallback
        )

        execution_time_ms = round((time.time() - start_time) * 1000, 2)
        return {
            "agent": "ThreatAnalysisAgent",
            "execution_time_ms": execution_time_ms,
            "output": output
        }

threat_agent = ThreatAnalysisAgent()
