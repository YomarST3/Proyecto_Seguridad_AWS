from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict
from datetime import datetime


class MeanRequest(BaseModel):
    values: List[float] = Field(min_length=1, description="Lista de números reales")
    variable_name: Optional[str] = "Importe"


class MedianRequest(BaseModel):
    values: List[float] = Field(min_length=1, description="Lista de números reales")
    variable_name: Optional[str] = "Importe"


class CompareRequest(BaseModel):
    values: List[float] = Field(min_length=1, description="Lista de números reales")
    variable_name: Optional[str] = "Importe"


class RandomVariableRequest(BaseModel):
    observations: List[Any] = Field(min_length=1)
    variable_name: str
    variable_type: str = "QUANTITATIVE_DISCRETE" # QUANTITATIVE_DISCRETE, QUALITATIVE_NOMINAL, etc.


class BayesRequest(BaseModel):
    event_a_name: str = "Compra Producto Premium"
    event_b_name: str = "Recibió Descuento > 10%"
    prior_prob_a: float = Field(ge=0.0, le=1.0, description="P(A)")
    likelihood_b_given_a: float = Field(ge=0.0, le=1.0, description="P(B|A)")
    marginal_prob_b: float = Field(gt=0.0, le=1.0, description="P(B)")


class StatisticalResultResponse(BaseModel):
    metric_name: str
    metric_value: float
    sample_size: int
    details: Dict[str, Any]
    explanation: Optional[str]
