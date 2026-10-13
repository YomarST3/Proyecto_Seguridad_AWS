from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.entities import User, Sale, SaleStatusEnum
from app.security.deps import get_current_user
from app.schemas.statistics import (
    MeanRequest, MedianRequest, CompareRequest,
    RandomVariableRequest, BayesRequest, StatisticalResultResponse
)
from app.statistics.engine import StatisticalEngine

router = APIRouter(tags=["Estadística & Probabilidades"])


@router.post("/statistics/mean")
def calculate_arithmetic_mean(
    data: MeanRequest,
    current_user: User = Depends(get_current_user)
):
    try:
        return StatisticalEngine.calculate_mean(data.values)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/statistics/median")
def calculate_median(
    data: MedianRequest,
    current_user: User = Depends(get_current_user)
):
    try:
        return StatisticalEngine.calculate_median(data.values)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/statistics/compare")
def compare_mean_and_median(
    data: CompareRequest,
    current_user: User = Depends(get_current_user)
):
    try:
        return StatisticalEngine.compare_mean_and_median(data.values)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/random-variables/analyze")
def analyze_random_variable(
    data: RandomVariableRequest,
    current_user: User = Depends(get_current_user)
):
    try:
        return StatisticalEngine.analyze_random_variable(
            observations=data.observations,
            variable_name=data.variable_name,
            variable_type=data.variable_type
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/probability/bayes")
def calculate_bayes_theorem(
    data: BayesRequest,
    current_user: User = Depends(get_current_user)
):
    try:
        return StatisticalEngine.calculate_bayes(
            prior_prob_a=data.prior_prob_a,
            likelihood_b_given_a=data.likelihood_b_given_a,
            marginal_prob_b=data.marginal_prob_b,
            event_a_name=data.event_a_name,
            event_b_name=data.event_b_name
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/statistics/live-sales-metrics")
def get_live_sales_statistics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Extrae las ventas reales confirmadas y calcula media, mediana y asimetría automáticamente."""
    sales = db.query(Sale.total_amount).filter(
        Sale.company_id == current_user.company_id,
        Sale.status == SaleStatusEnum.CONFIRMED
    ).all()

    values = [float(s[0]) for s in sales if s[0] is not None]

    if not values:
        return {
            "has_data": False,
            "message": "No hay ventas confirmadas registradas en el período para análisis."
        }

    comparison = StatisticalEngine.compare_mean_and_median(values)
    return {
        "has_data": True,
        "raw_values": values,
        "metrics": comparison
    }
