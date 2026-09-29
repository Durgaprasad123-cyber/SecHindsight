from typing import Dict, Any, List, Optional

MITRE_ATTACK_DB: Dict[str, Dict[str, Any]] = {
    "T1078": {
        "id": "T1078",
        "name": "Valid Accounts",
        "tactic": "Initial Access / Persistence / Privilege Escalation",
        "description": "Adversaries may obtain and use credentials of existing enterprise accounts to gain access, escalate privileges, or maintain persistence.",
        "detection": "Monitor authentication logs for unusual login times, unexpected source IPs, or geographically impossible travel.",
        "mitigation": "Enforce Multi-Factor Authentication (MFA), audit account permissions, and enforce strong password policies."
    },
    "T1110": {
        "id": "T1110",
        "name": "Brute Force",
        "tactic": "Credential Access",
        "description": "Adversaries may use brute force techniques to attempt credential guessing or password spraying across multiple user accounts.",
        "detection": "Detect high volumes of failed login attempts followed by a successful login across user accounts.",
        "mitigation": "Set account lockout thresholds, mandate MFA, and block malicious source IP ranges."
    },
    "T1068": {
        "id": "T1068",
        "name": "Exploitation for Privilege Escalation",
        "tactic": "Privilege Escalation",
        "description": "Adversaries may exploit software vulnerabilities in operating systems or applications to elevate privileges to administrator or SYSTEM level.",
        "detection": "Monitor system process creation for unauthorized token impersonation or unusual child processes spawned by system services.",
        "mitigation": "Apply operating system security patches promptly and enforce principle of least privilege."
    },
    "T1566": {
        "id": "T1566",
        "name": "Phishing",
        "tactic": "Initial Access",
        "description": "Adversaries may send phishing emails with malicious links or attachments to gain access to victim systems.",
        "detection": "Analyze incoming email headers, domain age, attachment file extensions, and outbound traffic to suspicious URLs.",
        "mitigation": "Deploy email filtering solutions, disable macros by default, and conduct regular security awareness training."
    },
    "T1059": {
        "id": "T1059",
        "name": "Command and Scripting Interpreter",
        "tactic": "Execution",
        "description": "Adversaries may abuse command and script interpreters (PowerShell, cmd.exe, bash) to execute commands, scripts, or binaries.",
        "detection": "Enable PowerShell script block logging, process command-line auditing, and alert on obfuscated command flags.",
        "mitigation": "Restrict execution of unverified scripts via AppLocker/WDAC and limit execution privileges."
    },
    "T1021": {
        "id": "T1021",
        "name": "Remote Services",
        "tactic": "Lateral Movement",
        "description": "Adversaries may use valid credentials to log into a service (SSH, RDP, SMB) designed to enable remote access to systems.",
        "detection": "Track lateral RDP/SSH connections between internal workstations or non-standard server pairs.",
        "mitigation": "Segment networks, restrict RDP/SSH to authorized jump hosts, and disable network protocols where unnecessary."
    },
    "T1048": {
        "id": "T1048",
        "name": "Exfiltration Over Alternative Protocol",
        "tactic": "Exfiltration",
        "description": "Adversaries may steal data by transferring it over a non-standard protocol or encrypted tunnel to an external server.",
        "detection": "Monitor for unusually large outbound data transfers to external IP addresses over non-web ports.",
        "mitigation": "Implement Data Loss Prevention (DLP) controls and enforce egress network filtering."
    },
    "T1486": {
        "id": "T1486",
        "name": "Data Encrypted for Impact",
        "tactic": "Impact",
        "description": "Adversaries may encrypt data on target systems to interrupt availability of system and network resources (Ransomware).",
        "detection": "Monitor high volume file rename/write operations with common ransomware extensions and VSS shadow copy deletion.",
        "mitigation": "Maintain immutable offline backups and deploy endpoint behavioral protection."
    }
}

class MitreService:
    """
    MITRE ATT&CK Knowledge Provider.
    Resolves official techniques, tactics, detection patterns and mitigations.
    """
    def get_technique(self, technique_id: str) -> Optional[Dict[str, Any]]:
        return MITRE_ATTACK_DB.get(technique_id)

    def list_techniques(self) -> List[Dict[str, Any]]:
        return list(MITRE_ATTACK_DB.values())

    def match_evidence_to_techniques(self, evidence_summary: str, category: str) -> List[Dict[str, Any]]:
        matches = []
        ev_lower = evidence_summary.lower() + " " + category.lower()

        if "login" in ev_lower or "credential" in ev_lower or "vpn" in ev_lower:
            matches.append({**MITRE_ATTACK_DB["T1078"], "confidence": 0.92, "reasoning": "Observed authentication attempt using existing user credentials."})
        if "brute" in ev_lower or "failed login" in ev_lower or "spray" in ev_lower:
            matches.append({**MITRE_ATTACK_DB["T1110"], "confidence": 0.88, "reasoning": "Multiple authentication attempts detected."})
        if "privilege" in ev_lower or "escalat" in ev_lower or "sudo" in ev_lower or "admin" in ev_lower:
            matches.append({**MITRE_ATTACK_DB["T1068"], "confidence": 0.95, "reasoning": "Evidence indicates elevation from standard user to administrative privileges."})
        if "script" in ev_lower or "powershell" in ev_lower or "cmd" in ev_lower:
            matches.append({**MITRE_ATTACK_DB["T1059"], "confidence": 0.85, "reasoning": "Execution of command interpreter scripts detected."})
        if "rdp" in ev_lower or "ssh" in ev_lower or "lateral" in ev_lower:
            matches.append({**MITRE_ATTACK_DB["T1021"], "confidence": 0.80, "reasoning": "Remote connection attempt to internal host."})
        if "exfiltration" in ev_lower or "transfer" in ev_lower or "download" in ev_lower:
            matches.append({**MITRE_ATTACK_DB["T1048"], "confidence": 0.82, "reasoning": "Large volume data egress observed."})
        if "phishing" in ev_lower or "email" in ev_lower:
            matches.append({**MITRE_ATTACK_DB["T1566"], "confidence": 0.90, "reasoning": "Malicious link click or email attachment opened."})
        if "ransomware" in ev_lower or "encrypt" in ev_lower:
            matches.append({**MITRE_ATTACK_DB["T1486"], "confidence": 0.96, "reasoning": "Mass file encryption activity detected."})

        # Default fallback match if no specific keyword matched
        if not matches:
            matches.append({**MITRE_ATTACK_DB["T1078"], "confidence": 0.70, "reasoning": "Potential misuse of system privileges or user account."})

        return matches

mitre_service = MitreService()
