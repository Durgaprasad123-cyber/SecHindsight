from typing import Optional
from fastapi import APIRouter, HTTPException
from app.services.mitre_service import mitre_service

router = APIRouter(prefix="/threats", tags=["Threat Intelligence"])

@router.get("")
async def list_mitre_techniques():
    techniques = mitre_service.list_techniques()
    return {"techniques": techniques, "count": len(techniques)}

@router.get("/{technique_id}")
async def get_mitre_technique(technique_id: str):
    tech = mitre_service.get_technique(technique_id.upper())
    if not tech:
        raise HTTPException(status_code=404, detail=f"MITRE Technique '{technique_id}' not found.")
    return {"technique": tech}
