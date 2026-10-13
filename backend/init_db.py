import sys
import os

# Asegurar path para importación de app
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.core.database import sync_engine, Base
from app.models import (
    Company, Role, User, AuditLog, Customer, Category, Product,
    Inventory, InventoryMovement, Employee, Order, OrderDetail,
    Sale, SaleDetail, PaymentMethod, Payment, Dataset,
    DatasetVariable, Observation, StatisticalAnalysis,
    StatisticalResult, BayesAnalysis, Insight, Report
)

def init_database():
    print("Conectando a PostgreSQL 18 y creando tablas de SalesIA Enterprise...")
    Base.metadata.create_all(bind=sync_engine)
    print("Todas las tablas fueron creadas exitosamente.")

if __name__ == "__main__":
    init_database()
