from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.entities import User
from app.security.deps import get_current_user
from app.schemas.dashboard import InsightResponse
from app.services.insight_service import InsightService

router = APIRouter(prefix="/insights", tags=["Insights & Observaciones"])


@router.get("", response_model=List[InsightResponse])
def get_explainable_insights(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return InsightService.generate_explainable_insights(db, current_user.company_id)
