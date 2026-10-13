from datetime import datetime
from decimal import Decimal
import enum
from typing import Optional, List
from sqlalchemy import (
    Column, Integer, String, Boolean, Numeric, DateTime, ForeignKey, 
    Text, Enum as SQLEnum, Index, UniqueConstraint
)
from sqlalchemy.orm import relationship
from app.core.database import Base


# --- ENUMS DEL SISTEMA ---

class UserRoleEnum(str, enum.Enum):
    ADMIN = "ADMIN"
    MANAGER = "MANAGER"
    SALESPERSON = "SALESPERSON"
    ANALYST = "ANALYST"
    WAREHOUSE = "WAREHOUSE"


class CustomerTypeEnum(str, enum.Enum):
    NATURAL = "NATURAL"
    JURIDICA = "JURIDICA"


class OrderStatusEnum(str, enum.Enum):
    DRAFT = "DRAFT"
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"
    FULFILLED = "FULFILLED"


class SaleStatusEnum(str, enum.Enum):
    CONFIRMED = "CONFIRMED"
    ANNULLED = "ANNULLED"
    PARTIALLY_REFUNDED = "PARTIALLY_REFUNDED"
    REFUNDED = "REFUNDED"


class PaymentStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    PARTIAL = "PARTIAL"
    PAID = "PAID"
    REFUNDED = "REFUNDED"


class InventoryMovementTypeEnum(str, enum.Enum):
    ENTRY = "ENTRY"          # Entrada por compra/producción
    EXIT = "EXIT"            # Salida por venta directa o entrega
    RESERVE = "RESERVE"      # Reserva por pedido confirmado
    RELEASE = "RELEASE"      # Liberación por cancelación de pedido
    ADJUSTMENT = "ADJUSTMENT"# Ajuste por merma, conteo físico o corrección


class VariableTypeEnum(str, enum.Enum):
    QUALITATIVE_NOMINAL = "QUALITATIVE_NOMINAL"
    QUALITATIVE_ORDINAL = "QUALITATIVE_ORDINAL"
    QUANTITATIVE_DISCRETE = "QUANTITATIVE_DISCRETE"
    QUANTITATIVE_CONTINUOUS = "QUANTITATIVE_CONTINUOUS"


class InsightSeverityEnum(str, enum.Enum):
    INFO = "INFO"
    WARNING = "WARNING"
    OPPORTUNITY = "OPPORTUNITY"
    CRITICAL = "CRITICAL"


# --- 1. ADMINISTRACIÓN & MULTI-TENANT ---

class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    tax_id = Column(String(50), nullable=False, unique=True, index=True) # RUC / CIF / NIF
    address = Column(String(300), nullable=True)
    phone = Column(String(50), nullable=True)
    email = Column(String(100), nullable=True)
    currency = Column(String(10), default="USD", nullable=False)
    tax_rate = Column(Numeric(5, 4), default=Decimal("0.18"), nullable=False) # ej. 18% IGV / IVA
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    users = relationship("User", back_populates="company")
    customers = relationship("Customer", back_populates="company")
    categories = relationship("Category", back_populates="company")
    products = relationship("Product", back_populates="company")
    employees = relationship("Employee", back_populates="company")
    orders = relationship("Order", back_populates="company")
    sales = relationship("Sale", back_populates="company")


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(String(255), nullable=True)
    permissions = Column(Text, nullable=True) # JSON serializado de permisos

    users = relationship("User", back_populates="role")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False, index=True)
    email = Column(String(120), nullable=False, unique=True, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_login = Column(DateTime, nullable=True)

    company = relationship("Company", back_populates="users")
    role = relationship("Role", back_populates="users")
    employee = relationship("Employee", back_populates="user", uselist=False)
    audit_logs = relationship("AuditLog", back_populates="user")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(100), nullable=False) # e.g. "SALE_ANNULLED", "STOCK_ADJUSTED"
    entity_affected = Column(String(100), nullable=False) # e.g. "sales", "inventory"
    entity_id = Column(Integer, nullable=True)
    details = Column(Text, nullable=True) # JSON con payload o snapshot previo
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    user = relationship("User", back_populates="audit_logs")


# --- 2. CLIENTES ---

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_type = Column(SQLEnum(CustomerTypeEnum), default=CustomerTypeEnum.NATURAL, nullable=False)
    full_name = Column(String(200), nullable=False, index=True)
    doc_type = Column(String(20), default="DNI", nullable=False) # DNI, RUC, PASSPORT
    doc_number = Column(String(50), nullable=False, index=True)
    email = Column(String(120), nullable=True)
    phone = Column(String(50), nullable=True)
    address = Column(String(300), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("company_id", "doc_number", name="uq_customer_doc_per_company"),
    )

    company = relationship("Company", back_populates="customers")
    orders = relationship("Order", back_populates="customer")
    sales = relationship("Sale", back_populates="customer")


# --- 3. CATEGORÍAS & PRODUCTOS ---

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    __table_args__ = (
        UniqueConstraint("company_id", "name", name="uq_category_name_per_company"),
    )

    company = relationship("Company", back_populates="categories")
    products = relationship("Product", back_populates="category")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False, index=True)
    sku = Column(String(100), nullable=False, index=True)
    name = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=True)
    cost_price = Column(Numeric(14, 2), nullable=False, default=Decimal("0.00")) # Costo de adquisición unitario
    sale_price = Column(Numeric(14, 2), nullable=False, default=Decimal("0.00")) # Precio base de venta sin tax
    tax_rate = Column(Numeric(5, 4), nullable=False, default=Decimal("0.18"))   # Impuesto aplicable (18%)
    min_stock_alert = Column(Integer, nullable=False, default=5)
    image_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("company_id", "sku", name="uq_product_sku_per_company"),
    )

    company = relationship("Company", back_populates="products")
    category = relationship("Category", back_populates="products")
    inventory = relationship("Inventory", back_populates="product", uselist=False)
    order_details = relationship("OrderDetail", back_populates="product")
    sale_details = relationship("SaleDetail", back_populates="product")


# --- 4. INVENTARIO & MOVIMIENTOS ---

class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    physical_stock = Column(Integer, nullable=False, default=0) # Existencia física total en bodega
    reserved_stock = Column(Integer, nullable=False, default=0) # Existencia comprometida en pedidos
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    product = relationship("Product", back_populates="inventory")
    movements = relationship("InventoryMovement", back_populates="inventory")


class InventoryMovement(Base):
    __tablename__ = "inventory_movements"

    id = Column(Integer, primary_key=True, index=True)
    inventory_id = Column(Integer, ForeignKey("inventory.id", ondelete="CASCADE"), nullable=False, index=True)
    movement_type = Column(SQLEnum(InventoryMovementTypeEnum), nullable=False)
    quantity = Column(Integer, nullable=False) # Cantidad que ingresa o egresa
    previous_stock = Column(Integer, nullable=False)
    resulting_stock = Column(Integer, nullable=False)
    reference_doc = Column(String(100), nullable=True) # e.g. "SALE-0001", "ORD-0005", "AJUSTE-CONTEO"
    reason = Column(String(255), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    inventory = relationship("Inventory", back_populates="movements")


# --- 5. PERSONAL (EMPLEADOS & VENDEDORES) ---

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, unique=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    doc_number = Column(String(50), nullable=False)
    email = Column(String(120), nullable=True)
    phone = Column(String(50), nullable=True)
    job_title = Column(String(100), default="Vendedor", nullable=False)
    commission_rate = Column(Numeric(5, 4), default=Decimal("0.05"), nullable=False) # 5% comisión
    monthly_sales_target = Column(Numeric(14, 2), default=Decimal("10000.00"), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    hire_date = Column(DateTime, default=datetime.utcnow, nullable=False)

    company = relationship("Company", back_populates="employees")
    user = relationship("User", back_populates="employee")
    orders = relationship("Order", back_populates="salesperson")
    sales = relationship("Sale", back_populates="salesperson")


# --- 6. PEDIDOS (ORDERS) ---

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    order_code = Column(String(50), nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="RESTRICT"), nullable=False, index=True)
    salesperson_id = Column(Integer, ForeignKey("employees.id", ondelete="RESTRICT"), nullable=False, index=True)
    status = Column(SQLEnum(OrderStatusEnum), default=OrderStatusEnum.PENDING, nullable=False, index=True)
    subtotal = Column(Numeric(14, 2), nullable=False, default=Decimal("0.00"))
    tax_amount = Column(Numeric(14, 2), nullable=False, default=Decimal("0.00"))
    discount_amount = Column(Numeric(14, 2), nullable=False, default=Decimal("0.00"))
    total_amount = Column(Numeric(14, 2), nullable=False, default=Decimal("0.00"))
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("company_id", "order_code", name="uq_order_code_per_company"),
    )

    company = relationship("Company", back_populates="orders")
    customer = relationship("Customer", back_populates="orders")
    salesperson = relationship("Employee", back_populates="orders")
    details = relationship("OrderDetail", back_populates="order", cascade="all, delete-orphan")
    sale = relationship("Sale", back_populates="order", uselist=False)


class OrderDetail(Base):
    __tablename__ = "order_details"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="RESTRICT"), nullable=False, index=True)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(14, 2), nullable=False)
    unit_cost = Column(Numeric(14, 2), nullable=False)
    discount_percentage = Column(Numeric(5, 4), default=Decimal("0.00"), nullable=False)
    line_subtotal = Column(Numeric(14, 2), nullable=False)

    order = relationship("Order", back_populates="details")
    product = relationship("Product", back_populates="order_details")


# --- 7. VENTAS (SALES) & DETALLE INMUTABLE ---

class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    sale_code = Column(String(50), nullable=False, index=True) # e.g. "VTA-2026-0001"
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="SET NULL"), nullable=True, unique=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="RESTRICT"), nullable=False, index=True)
    salesperson_id = Column(Integer, ForeignKey("employees.id", ondelete="RESTRICT"), nullable=False, index=True)
    status = Column(SQLEnum(SaleStatusEnum), default=SaleStatusEnum.CONFIRMED, nullable=False, index=True)
    payment_status = Column(SQLEnum(PaymentStatusEnum), default=PaymentStatusEnum.PENDING, nullable=False, index=True)
    
    subtotal = Column(Numeric(14, 2), nullable=False, default=Decimal("0.00"))
    tax_amount = Column(Numeric(14, 2), nullable=False, default=Decimal("0.00"))
    discount_amount = Column(Numeric(14, 2), nullable=False, default=Decimal("0.00"))
    total_amount = Column(Numeric(14, 2), nullable=False, default=Decimal("0.00"))
    paid_amount = Column(Numeric(14, 2), nullable=False, default=Decimal("0.00")) # Acumulado cobrado
    
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("company_id", "sale_code", name="uq_sale_code_per_company"),
    )

    company = relationship("Company", back_populates="sales")
    order = relationship("Order", back_populates="sale")
    customer = relationship("Customer", back_populates="sales")
    salesperson = relationship("Employee", back_populates="sales")
    details = relationship("SaleDetail", back_populates="sale", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="sale", cascade="all, delete-orphan")


class SaleDetail(Base):
    __tablename__ = "sale_details"

    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="RESTRICT"), nullable=False, index=True)
    quantity = Column(Integer, nullable=False)
    unit_cost = Column(Numeric(14, 2), nullable=False)  # Snapshot inmutable de costo al vender
    unit_price = Column(Numeric(14, 2), nullable=False) # Snapshot inmutable de precio al vender
    tax_rate = Column(Numeric(5, 4), nullable=False)    # Snapshot inmutable de impuesto
    discount_amount = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    line_subtotal = Column(Numeric(14, 2), nullable=False)
    line_total = Column(Numeric(14, 2), nullable=False)

    sale = relationship("Sale", back_populates="details")
    product = relationship("Product", back_populates="sale_details")


# --- 8. MÉTODOS DE PAGO & PAGOS ---

class PaymentMethod(Base):
    __tablename__ = "payment_methods"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True) # EFECTIVO, TARJETA_DEBITO, TARJETA_CREDITO, TRANSFERENCIA
    requires_reference = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    payments = relationship("Payment", back_populates="payment_method")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id", ondelete="CASCADE"), nullable=False, index=True)
    payment_method_id = Column(Integer, ForeignKey("payment_methods.id"), nullable=False, index=True)
    amount = Column(Numeric(14, 2), nullable=False)
    reference = Column(String(100), nullable=True) # Número de voucher / transacción bancaria
    received_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    payment_date = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    notes = Column(String(255), nullable=True)

    sale = relationship("Sale", back_populates="payments")
    payment_method = relationship("PaymentMethod", back_populates="payments")


# --- 9. MOTOR ESTADÍSTICO, PROBABILIDADES & INSIGHTS (SEMANA 07) ---

class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    source_type = Column(String(50), nullable=False, default="SALES_OPERATIONS") # SALES, PRODUCTS, CUSTOMERS
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    variables = relationship("DatasetVariable", back_populates="dataset", cascade="all, delete-orphan")
    observations = relationship("Observation", back_populates="dataset", cascade="all, delete-orphan")
    analyses = relationship("StatisticalAnalysis", back_populates="dataset")


class DatasetVariable(Base):
    __tablename__ = "dataset_variables"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False, index=True)
    variable_name = Column(String(100), nullable=False)
    variable_type = Column(SQLEnum(VariableTypeEnum), nullable=False) # Nominal, Ordinal, Discreta, Continua
    measurement_unit = Column(String(50), nullable=True) # e.g. "USD", "unidades", "compras"

    dataset = relationship("Dataset", back_populates="variables")


class Observation(Base):
    __tablename__ = "observations"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False, index=True)
    record_index = Column(Integer, nullable=False)
    variable_name = Column(String(100), nullable=False)
    numeric_value = Column(Numeric(14, 4), nullable=True)
    text_value = Column(String(255), nullable=True)
    observed_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    dataset = relationship("Dataset", back_populates="observations")


class StatisticalAnalysis(Base):
    __tablename__ = "statistical_analyses"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    analysis_type = Column(String(50), nullable=False) # "MEAN", "MEDIAN", "COMPARISON", "DISCRETE_RV", "BAYES"
    parameters = Column(Text, nullable=True) # JSON de parámetros y filtros
    executed_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    dataset = relationship("Dataset", back_populates="analyses")
    results = relationship("StatisticalResult", back_populates="analysis", cascade="all, delete-orphan")


class StatisticalResult(Base):
    __tablename__ = "statistical_results"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("statistical_analyses.id", ondelete="CASCADE"), nullable=False, index=True)
    metric_name = Column(String(100), nullable=False) # e.g. "mean", "median", "relative_difference_pct"
    metric_value = Column(Numeric(14, 4), nullable=False)
    sample_size = Column(Integer, nullable=False)
    explanation = Column(Text, nullable=True)

    analysis = relationship("StatisticalAnalysis", back_populates="results")
    insights = relationship("Insight", back_populates="statistical_result")


class BayesAnalysis(Base):
    __tablename__ = "bayes_analyses"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    event_a_description = Column(String(255), nullable=False) # ej. "Cliente recompra producto premium"
    event_b_description = Column(String(255), nullable=False) # ej. "Cliente recibió descuento > 10%"
    prior_prob_a = Column(Numeric(8, 6), nullable=False)     # P(A)
    likelihood_b_given_a = Column(Numeric(8, 6), nullable=False) # P(B|A)
    marginal_prob_b = Column(Numeric(8, 6), nullable=False)  # P(B)
    posterior_prob_a_given_b = Column(Numeric(8, 6), nullable=False) # P(A|B)
    calculation_steps = Column(Text, nullable=False) # Markdown / LaTeX desglosado
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)


class Insight(Base):
    __tablename__ = "insights"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    statistical_result_id = Column(Integer, ForeignKey("statistical_results.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    metric = Column(String(100), nullable=False)
    period = Column(String(50), nullable=False)
    condition_rule = Column(String(255), nullable=False)
    evidence_value = Column(String(100), nullable=False)
    severity = Column(SQLEnum(InsightSeverityEnum), default=InsightSeverityEnum.INFO, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    statistical_result = relationship("StatisticalResult", back_populates="insights")


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    report_type = Column(String(50), nullable=False) # "SALES", "PRODUCTS", "CUSTOMERS", "INVENTORY", "STATISTICS"
    title = Column(String(200), nullable=False)
    filter_parameters = Column(Text, nullable=True) # JSON
    file_format = Column(String(10), default="PDF", nullable=False) # PDF, CSV
    file_url = Column(String(500), nullable=True)
    generated_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
