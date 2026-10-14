import enum
import uuid
from datetime import datetime, date
from decimal import Decimal
from typing import Optional, List

from sqlalchemy import (
    Column, Integer, String, Boolean, Numeric, DateTime, Date, ForeignKey, 
    Text
)
from sqlalchemy.dialects.postgresql import UUID, JSONB, INET
from sqlalchemy.orm import relationship, synonym
from app.nucleo.base_datos import BaseDeclarativa as Base


# ==============================================================================
# ENUMS DEL SISTEMA (COMPATIBILIDAD CON LÓGICA DE NEGOCIO Y ESQUEMAS)
# ==============================================================================

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
    DRAFT = "BORRADOR"
    PENDING = "PENDIENTE"
    CONFIRMED = "CONFIRMADO"
    CANCELLED = "CANCELADO"
    FULFILLED = "ATENDIDO"
    BORRADOR = "BORRADOR"
    PENDIENTE = "PENDIENTE"
    CONFIRMADO = "CONFIRMADO"
    CANCELADO = "CANCELADO"
    ATENDIDO = "ATENDIDO"


class SaleStatusEnum(str, enum.Enum):
    CONFIRMED = "CONFIRMADA"
    ANNULLED = "ANULADA"
    PARTIALLY_REFUNDED = "DEVUELTA_PARCIAL"
    REFUNDED = "DEVUELTA"
    CONFIRMADA = "CONFIRMADA"
    ANULADA = "ANULADA"
    DEVUELTA = "DEVUELTA"


class PaymentStatusEnum(str, enum.Enum):
    PENDING = "PENDIENTE"
    PARTIAL = "PARCIAL"
    PAID = "PAGADA"
    REFUNDED = "REEMBOLSADA"
    PENDIENTE = "PENDIENTE"
    PARCIAL_ES = "PARCIAL"
    PAGADA = "PAGADA"
    REEMBOLSADA = "REEMBOLSADA"


class InventoryMovementTypeEnum(str, enum.Enum):
    ENTRY = "ENTRADA"
    EXIT = "SALIDA"
    RESERVE = "RESERVA"
    RELEASE = "LIBERACION"
    ADJUSTMENT = "AJUSTE"
    ENTRADA = "ENTRADA"
    SALIDA = "SALIDA"
    RESERVA = "RESERVA"
    LIBERACION = "LIBERACION"
    AJUSTE = "AJUSTE"


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


# ==============================================================================
# 1. ADMINISTRACIÓN, EMPRESAS Y SEGURIDAD MULTI-TENANT
# ==============================================================================

from app.modulos.empresas.modelos import Empresa
from app.modulos.roles.modelos import Rol, Permiso, RolPermiso, UsuarioRol
from app.modulos.usuarios.modelos import Usuario
from app.modulos.solicitudes.modelos import SolicitudAcceso


# ==============================================================================
# 2. CLIENTES & CRM
# ==============================================================================

class Cliente(Base):
    __tablename__ = "clientes"
    __table_args__ = {'extend_existing': True}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    empresa_id = Column(UUID(as_uuid=True), ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    tipo_cliente = Column(String(20), default="NATURAL", nullable=False) # NATURAL / JURIDICA
    tipo_documento = Column(String(25), nullable=True) # DNI, RUC, etc.
    numero_documento = Column(String(30), nullable=True, index=True)
    nombre_razon_social = Column(String(200), nullable=False, index=True)
    correo = Column(String(255), nullable=True)
    telefono = Column(String(30), nullable=True)
    direccion = Column(Text, nullable=True)
    activo = Column(Boolean, default=True, nullable=False)
    creado_en = Column(DateTime, default=datetime.utcnow, nullable=False)
    actualizado_en = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    empresa = relationship("Empresa", back_populates="clientes")
    ventas = relationship("Venta", back_populates="cliente")
    pedidos = relationship("Pedido", back_populates="cliente")

    # Sinónimos
    company_id = synonym('empresa_id')
    name = synonym('nombre_razon_social')
    full_name = synonym('nombre_razon_social')
    customer_type = synonym('tipo_cliente')
    document_type = synonym('tipo_documento')
    doc_type = synonym('tipo_documento')
    document_number = synonym('numero_documento')
    doc_number = synonym('numero_documento')
    email = synonym('correo')
    phone = synonym('telefono')
    address = synonym('direccion')
    is_active = synonym('activo')
    created_at = synonym('creado_en')
    updated_at = synonym('actualizado_en')


# ==============================================================================
# 3. CATÁLOGO, PRODUCTOS & INVENTARIO
# ==============================================================================

class Categoria(Base):
    __tablename__ = "categorias"
    __table_args__ = {'extend_existing': True}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    empresa_id = Column(UUID(as_uuid=True), ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    nombre = Column(String(100), nullable=False)
    descripcion = Column(Text, nullable=True)
    activo = Column(Boolean, default=True, nullable=False)
    creado_en = Column(DateTime, default=datetime.utcnow, nullable=False)
    actualizado_en = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    empresa = relationship("Empresa", back_populates="categorias")
    productos = relationship("Producto", back_populates="categoria")

    # Sinónimos
    company_id = synonym('empresa_id')
    name = synonym('nombre')
    description = synonym('descripcion')
    is_active = synonym('activo')
    created_at = synonym('creado_en')
    updated_at = synonym('actualizado_en')


class Producto(Base):
    __tablename__ = "productos"
    __table_args__ = {'extend_existing': True}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    empresa_id = Column(UUID(as_uuid=True), ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    categoria_id = Column(UUID(as_uuid=True), ForeignKey("categorias.id", ondelete="RESTRICT"), nullable=False, index=True)
    sku = Column(String(100), nullable=False, index=True)
    nombre = Column(String(200), nullable=False, index=True)
    descripcion = Column(Text, nullable=True)
    costo_actual = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    precio_venta = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    tasa_impuesto = Column(Numeric(7, 6), default=Decimal("0.180000"), nullable=False)
    stock_minimo = Column(Integer, default=5, nullable=False)
    imagen_url = Column(Text, nullable=True)
    activo = Column(Boolean, default=True, nullable=False)
    creado_en = Column(DateTime, default=datetime.utcnow, nullable=False)
    actualizado_en = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    empresa = relationship("Empresa", back_populates="productos")
    categoria = relationship("Categoria", back_populates="productos")
    inventario = relationship("Inventario", back_populates="producto", uselist=False, cascade="all, delete-orphan")

    category = synonym('categoria')

    # Sinónimos
    company_id = synonym('empresa_id')
    category_id = synonym('categoria_id')
    name = synonym('nombre')
    description = synonym('descripcion')
    cost_price = synonym('costo_actual')
    sale_price = synonym('precio_venta')
    tax_rate = synonym('tasa_impuesto')
    min_stock = synonym('stock_minimo')
    min_stock_alert = synonym('stock_minimo')
    image_url = synonym('imagen_url')
    is_active = synonym('activo')
    created_at = synonym('creado_en')
    updated_at = synonym('actualizado_en')

    @property
    def inventory(self):
        return self.inventario


class Inventario(Base):
    __tablename__ = "inventario"
    __table_args__ = {'extend_existing': True}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    empresa_id = Column(UUID(as_uuid=True), ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    producto_id = Column(UUID(as_uuid=True), ForeignKey("productos.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    cantidad_fisica = Column(Integer, default=0, nullable=False)
    cantidad_reservada = Column(Integer, default=0, nullable=False)
    actualizado_en = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    producto = relationship("Producto", back_populates="inventario")
    movimientos = relationship("MovimientoInventario", back_populates="inventario", cascade="all, delete-orphan")

    company_id = synonym('empresa_id')
    product_id = synonym('producto_id')
    quantity_on_hand = synonym('cantidad_fisica')
    quantity_reserved = synonym('cantidad_reservada')
    physical_stock = synonym('cantidad_fisica')
    reserved_stock = synonym('cantidad_reservada')
    updated_at = synonym('actualizado_en')

    @property
    def available_quantity(self) -> int:
        return max(0, (self.cantidad_fisica or 0) - (self.cantidad_reservada or 0))

    @property
    def available_stock(self) -> int:
        return self.available_quantity


class MovimientoInventario(Base):
    __tablename__ = "movimientos_inventario"
    __table_args__ = {'extend_existing': True}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    inventario_id = Column(UUID(as_uuid=True), ForeignKey("inventario.id", ondelete="CASCADE"), nullable=False, index=True)
    usuario_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, index=True)
    tipo = Column(String(50), nullable=False) # ENTRY, EXIT, RESERVE, RELEASE, ADJUSTMENT
    cantidad = Column(Integer, nullable=False)
    stock_anterior = Column(Integer, nullable=False)
    stock_resultante = Column(Integer, nullable=False)
    documento_referencia = Column(String(100), nullable=True)
    motivo = Column(Text, nullable=True)
    creado_en = Column(DateTime, default=datetime.utcnow, nullable=False)

    inventario = relationship("Inventario", back_populates="movimientos")
    usuario = relationship("Usuario")

    inventory_id = synonym('inventario_id')
    user_id = synonym('usuario_id')
    movement_type = synonym('tipo')
    quantity = synonym('cantidad')
    previous_stock = synonym('stock_anterior')
    new_stock = synonym('stock_resultante')
    resulting_stock = synonym('stock_resultante')
    reference_document = synonym('documento_referencia')
    reference_doc = synonym('documento_referencia')
    notes = synonym('motivo')
    reason = synonym('motivo')
    created_at = synonym('creado_en')


# ==============================================================================
# 4. PERSONAL & EMPLEADOS
# ==============================================================================

class Empleado(Base):
    __tablename__ = "empleados"
    __table_args__ = {'extend_existing': True}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    empresa_id = Column(UUID(as_uuid=True), ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    usuario_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, unique=True, index=True)
    nombres = Column(String(100), nullable=False)
    apellidos = Column(String(100), nullable=False)
    numero_documento = Column(String(30), nullable=True)
    correo = Column(String(255), nullable=True)
    telefono = Column(String(30), nullable=True)
    cargo = Column(String(100), default="VENDEDOR", nullable=False)
    tasa_comision = Column(Numeric(7, 6), default=Decimal("0.000000"), nullable=False)
    meta_ventas_mensual = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    fecha_ingreso = Column(Date, default=date.today, nullable=True)
    activo = Column(Boolean, default=True, nullable=False)
    creado_en = Column(DateTime, default=datetime.utcnow, nullable=False)
    actualizado_en = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    empresa = relationship("Empresa", back_populates="empleados")
    usuario = relationship("Usuario", back_populates="empleado")
    ventas = relationship("Venta", back_populates="empleado")
    pedidos = relationship("Pedido", back_populates="empleado")

    company_id = synonym('empresa_id')
    user_id = synonym('usuario_id')
    first_name = synonym('nombres')
    last_name = synonym('apellidos')
    document_number = synonym('numero_documento')
    email = synonym('correo')
    phone = synonym('telefono')
    position = synonym('cargo')
    commission_rate = synonym('tasa_comision')
    monthly_sales_target = synonym('meta_ventas_mensual')
    hire_date = synonym('fecha_ingreso')
    is_active = synonym('activo')
    created_at = synonym('creado_en')
    updated_at = synonym('actualizado_en')

    @property
    def full_name(self) -> str:
        return f"{self.nombres} {self.apellidos}".strip()


# ==============================================================================
# 5. PEDIDOS Y VENTAS
# ==============================================================================

class Pedido(Base):
    __tablename__ = "pedidos"
    __table_args__ = {'extend_existing': True}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    empresa_id = Column(UUID(as_uuid=True), ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    cliente_id = Column(UUID(as_uuid=True), ForeignKey("clientes.id", ondelete="RESTRICT"), nullable=False, index=True)
    empleado_id = Column(UUID(as_uuid=True), ForeignKey("empleados.id", ondelete="RESTRICT"), nullable=True, index=True)
    numero_pedido = Column(String(50), nullable=False, index=True)
    estado = Column(String(50), default="PENDING", nullable=False) # DRAFT, PENDING, CONFIRMED, CANCELLED, FULFILLED
    subtotal = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    impuesto_total = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    descuento_total = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    total = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    notas = Column(Text, nullable=True)
    creado_en = Column(DateTime, default=datetime.utcnow, nullable=False)
    actualizado_en = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    empresa = relationship("Empresa", back_populates="pedidos")
    cliente = relationship("Cliente", back_populates="pedidos")
    empleado = relationship("Empleado", back_populates="pedidos")
    detalles = relationship("DetallePedido", back_populates="pedido", cascade="all, delete-orphan")
    venta = relationship("Venta", back_populates="pedido", uselist=False)

    company_id = synonym('empresa_id')
    customer_id = synonym('cliente_id')
    employee_id = synonym('empleado_id')
    salesperson_id = synonym('empleado_id')
    order_number = synonym('numero_pedido')
    order_code = synonym('numero_pedido')
    status = synonym('estado')
    tax_total = synonym('impuesto_total')
    tax_amount = synonym('impuesto_total')
    discount_total = synonym('descuento_total')
    discount_amount = synonym('descuento_total')
    total_amount = synonym('total')
    notes = synonym('notas')
    created_at = synonym('creado_en')
    updated_at = synonym('actualizado_en')

    @property
    def items(self):
        return self.detalles

    @property
    def details(self):
        return self.detalles

    @property
    def customer(self):
        return self.cliente

    @property
    def employee(self):
        return self.empleado

    @property
    def salesperson(self):
        return self.empleado


class DetallePedido(Base):
    __tablename__ = "detalles_pedido"
    __table_args__ = {'extend_existing': True}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    empresa_id = Column(UUID(as_uuid=True), nullable=True)
    pedido_id = Column(UUID(as_uuid=True), ForeignKey("pedidos.id", ondelete="CASCADE"), nullable=False, index=True)
    producto_id = Column(UUID(as_uuid=True), ForeignKey("productos.id", ondelete="RESTRICT"), nullable=False, index=True)
    cantidad = Column(Integer, default=1, nullable=False)
    precio_unitario = Column(Numeric(14, 2), nullable=False)
    costo_unitario_historico = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    descuento = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    impuesto_total = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    subtotal = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    total = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)

    pedido = relationship("Pedido", back_populates="detalles")
    producto = relationship("Producto")

    company_id = synonym('empresa_id')
    order_id = synonym('pedido_id')
    product_id = synonym('producto_id')
    quantity = synonym('cantidad')
    unit_price = synonym('precio_unitario')
    unit_cost_historical = synonym('costo_unitario_historico')
    unit_cost = synonym('costo_unitario_historico')
    discount = synonym('descuento')
    discount_amount = synonym('descuento')
    tax_total = synonym('impuesto_total')
    tax_amount = synonym('impuesto_total')
    line_subtotal = synonym('subtotal')
    line_total = synonym('total')

    @property
    def product(self):
        return self.producto

    @property
    def discount_percentage(self) -> Decimal:
        return Decimal("0.00")


class Venta(Base):
    __tablename__ = "ventas"
    __table_args__ = {'extend_existing': True}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    empresa_id = Column(UUID(as_uuid=True), ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    pedido_id = Column(UUID(as_uuid=True), ForeignKey("pedidos.id", ondelete="SET NULL"), nullable=True, index=True)
    cliente_id = Column(UUID(as_uuid=True), ForeignKey("clientes.id", ondelete="RESTRICT"), nullable=True, index=True)
    empleado_id = Column(UUID(as_uuid=True), ForeignKey("empleados.id", ondelete="RESTRICT"), nullable=True, index=True)
    numero_venta = Column(String(50), nullable=False, index=True)
    estado = Column(String(50), default="CONFIRMADA", nullable=False) # CONFIRMADA, ANULADA, DEVUELTA_PARCIAL, DEVUELTA
    estado_pago = Column(String(50), default="PENDIENTE", nullable=False) # PENDIENTE, PARCIAL, PAGADA, REEMBOLSADA
    subtotal = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    impuesto_total = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    descuento_total = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    total = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    total_pagado = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    notas = Column(Text, nullable=True)
    fecha_venta = Column(DateTime, default=datetime.utcnow, nullable=False)
    actualizado_en = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    empresa = relationship("Empresa", back_populates="ventas")
    pedido = relationship("Pedido", back_populates="venta")
    cliente = relationship("Cliente", back_populates="ventas")
    empleado = relationship("Empleado", back_populates="ventas")
    detalles = relationship("DetalleVenta", back_populates="venta", cascade="all, delete-orphan")
    pagos = relationship("Pago", back_populates="venta", cascade="all, delete-orphan")

    company_id = synonym('empresa_id')
    order_id = synonym('pedido_id')
    customer_id = synonym('cliente_id')
    employee_id = synonym('empleado_id')
    salesperson_id = synonym('empleado_id')
    sale_number = synonym('numero_venta')
    sale_code = synonym('numero_venta')
    status = synonym('estado')
    payment_status = synonym('estado_pago')
    tax_total = synonym('impuesto_total')
    tax_amount = synonym('impuesto_total')
    discount_total = synonym('descuento_total')
    discount_amount = synonym('descuento_total')
    total_amount = synonym('total')
    paid_amount = synonym('total_pagado')
    total_paid = synonym('total_pagado')
    notes = synonym('notas')
    created_at = synonym('fecha_venta')
    updated_at = synonym('actualizado_en')

    @property
    def items(self):
        return self.detalles

    @property
    def details(self):
        return self.detalles

    @property
    def customer(self):
        return self.cliente

    @property
    def employee(self):
        return self.empleado

    @property
    def salesperson(self):
        return self.empleado

    @property
    def payments(self):
        return self.pagos


class DetalleVenta(Base):
    __tablename__ = "detalles_venta"
    __table_args__ = {'extend_existing': True}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    empresa_id = Column(UUID(as_uuid=True), nullable=True)
    venta_id = Column(UUID(as_uuid=True), ForeignKey("ventas.id", ondelete="CASCADE"), nullable=False, index=True)
    producto_id = Column(UUID(as_uuid=True), ForeignKey("productos.id", ondelete="RESTRICT"), nullable=False, index=True)
    cantidad = Column(Integer, default=1, nullable=False)
    precio_unitario = Column(Numeric(14, 2), nullable=False)
    costo_unitario_historico = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    tasa_impuesto = Column(Numeric(7, 6), default=Decimal("0.180000"), nullable=False)
    descuento = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    subtotal = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    impuesto_total = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    total = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)

    venta = relationship("Venta", back_populates="detalles")
    producto = relationship("Producto")

    company_id = synonym('empresa_id')
    sale_id = synonym('venta_id')
    product_id = synonym('producto_id')
    quantity = synonym('cantidad')
    unit_price = synonym('precio_unitario')
    unit_cost_historical = synonym('costo_unitario_historico')
    unit_cost = synonym('costo_unitario_historico')
    tax_rate = synonym('tasa_impuesto')
    tax_amount = synonym('impuesto_total')
    discount = synonym('descuento')
    discount_amount = synonym('descuento')
    tax_total = synonym('impuesto_total')
    line_subtotal = synonym('subtotal')
    line_total = synonym('total')

    @property
    def product(self):
        return self.producto


# ==============================================================================
# 6. MÉTODOS DE PAGO Y COBROS
# ==============================================================================

class MetodoPago(Base):
    __tablename__ = "metodos_pago"
    __table_args__ = {'extend_existing': True}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    empresa_id = Column(UUID(as_uuid=True), ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    codigo = Column(String(40), nullable=False) # CASH, CARD, TRANSFER, DIGITAL_WALLET
    nombre = Column(String(100), nullable=False)
    requiere_referencia = Column(Boolean, default=False, nullable=False)
    activo = Column(Boolean, default=True, nullable=False)

    company_id = synonym('empresa_id')
    code = synonym('codigo')
    name = synonym('nombre')
    requires_reference = synonym('requiere_referencia')
    is_active = synonym('activo')


class Pago(Base):
    __tablename__ = "pagos"
    __table_args__ = {'extend_existing': True}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    empresa_id = Column(UUID(as_uuid=True), ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    venta_id = Column(UUID(as_uuid=True), ForeignKey("ventas.id", ondelete="CASCADE"), nullable=False, index=True)
    metodo_pago_id = Column(UUID(as_uuid=True), ForeignKey("metodos_pago.id", ondelete="RESTRICT"), nullable=False, index=True)
    usuario_receptor_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, index=True)
    monto = Column(Numeric(14, 2), nullable=False)
    estado = Column(String(50), default="CONFIRMADO", nullable=False) # PENDIENTE, CONFIRMADO, RECHAZADO, REEMBOLSADO
    referencia = Column(String(120), nullable=True)
    notas = Column(Text, nullable=True)
    fecha_pago = Column(DateTime, default=datetime.utcnow, nullable=False)

    venta = relationship("Venta", back_populates="pagos")
    metodo_pago = relationship("MetodoPago")
    usuario_receptor = relationship("Usuario")

    company_id = synonym('empresa_id')
    sale_id = synonym('venta_id')
    payment_method_id = synonym('metodo_pago_id')
    received_by_id = synonym('usuario_receptor_id')
    received_by_user_id = synonym('usuario_receptor_id')
    amount = synonym('monto')
    status = synonym('estado')
    reference = synonym('referencia')
    notes = synonym('notas')
    payment_date = synonym('fecha_pago')

    @property
    def payment_method(self):
        return self.metodo_pago

    @property
    def received_by(self):
        return self.usuario_receptor


# ==============================================================================
# 7. REGISTROS DE AUDITORÍA
# ==============================================================================

class RegistroAuditoria(Base):
    __tablename__ = "registros_auditoria"
    __table_args__ = {'extend_existing': True}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    empresa_id = Column(UUID(as_uuid=True), ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    usuario_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, index=True)
    accion = Column(String(100), nullable=False)
    entidad = Column(String(100), nullable=False)
    entidad_id = Column(UUID(as_uuid=True), nullable=True)
    detalles = Column(JSONB, nullable=True)
    direccion_ip = Column(INET, nullable=True)
    creado_en = Column(DateTime, default=datetime.utcnow, nullable=False)

    usuario = relationship("Usuario")

    company_id = synonym('empresa_id')
    user_id = synonym('usuario_id')
    action = synonym('accion')
    entity_affected = synonym('entidad')
    entity_id = synonym('entidad_id')
    details = synonym('detalles')
    ip_address = synonym('direccion_ip')
    created_at = synonym('creado_en')


# ==============================================================================
# 8. MOTOR ESTADÍSTICO, BAYESIANO E INSIGHTS
# ==============================================================================

class ConjuntoDatos(Base):
    __tablename__ = "conjuntos_datos"
    __table_args__ = {'extend_existing': True}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    empresa_id = Column(UUID(as_uuid=True), ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    nombre = Column(String(150), nullable=False)
    descripcion = Column(Text, nullable=True)
    tipo_origen = Column(String(60), default="SALES", nullable=False)
    filtros = Column(JSONB, nullable=True)
    creado_en = Column(DateTime, default=datetime.utcnow, nullable=False)

    variables = relationship("VariableEstadistica", back_populates="conjunto", cascade="all, delete-orphan")
    analisis = relationship("AnalisisEstadistico", back_populates="conjunto", cascade="all, delete-orphan")

    company_id = synonym('empresa_id')
    name = synonym('nombre')
    description = synonym('descripcion')
    source_type = synonym('tipo_origen')
    filter_criteria = synonym('filtros')
    created_at = synonym('creado_en')


class VariableEstadistica(Base):
    __tablename__ = "variables_estadisticas"
    __table_args__ = {'extend_existing': True}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    conjunto_id = Column(UUID(as_uuid=True), ForeignKey("conjuntos_datos.id", ondelete="CASCADE"), nullable=False, index=True)
    nombre = Column(String(100), nullable=False)
    tipo = Column(String(50), nullable=False) # QUALITATIVE_NOMINAL, QUANTITATIVE_CONTINUOUS, etc.
    unidad = Column(String(60), nullable=True)

    conjunto = relationship("ConjuntoDatos", back_populates="variables")

    dataset_id = synonym('conjunto_id')
    name = synonym('nombre')
    variable_type = synonym('tipo')
    unit = synonym('unidad')


class Observacion(Base):
    __tablename__ = "observaciones"
    __table_args__ = {'extend_existing': True}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    conjunto_id = Column(UUID(as_uuid=True), ForeignKey("conjuntos_datos.id", ondelete="CASCADE"), nullable=False, index=True)
    variable_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    indice_registro = Column(Integer, nullable=False)
    valor_numerico = Column(Numeric(20, 6), nullable=True)
    valor_texto = Column(Text, nullable=True)
    observado_en = Column(DateTime, default=datetime.utcnow, nullable=False)

    dataset_id = synonym('conjunto_id')
    record_index = synonym('indice_registro')
    numeric_value = synonym('valor_numerico')
    text_value = synonym('valor_texto')
    observed_at = synonym('observado_en')


class AnalisisEstadistico(Base):
    __tablename__ = "analisis_estadisticos"
    __table_args__ = {'extend_existing': True}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    conjunto_id = Column(UUID(as_uuid=True), ForeignKey("conjuntos_datos.id", ondelete="CASCADE"), nullable=False, index=True)
    usuario_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, index=True)
    tipo = Column(String(60), nullable=False) # DESCRIPTIVE, PROBABILITY, HYPOTHESIS, REGRESSION
    parametros = Column(JSONB, nullable=True)
    ejecutado_en = Column(DateTime, default=datetime.utcnow, nullable=False)

    conjunto = relationship("ConjuntoDatos", back_populates="analisis")
    resultados = relationship("ResultadoEstadistico", back_populates="analisis", cascade="all, delete-orphan")

    dataset_id = synonym('conjunto_id')
    user_id = synonym('usuario_id')
    analysis_type = synonym('tipo')
    parameters = synonym('parametros')
    executed_at = synonym('ejecutado_en')
    results = synonym('resultados')


class ResultadoEstadistico(Base):
    __tablename__ = "resultados_estadisticos"
    __table_args__ = {'extend_existing': True}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    analisis_id = Column(UUID(as_uuid=True), ForeignKey("analisis_estadisticos.id", ondelete="CASCADE"), nullable=False, index=True)
    nombre_metrica = Column(String(100), nullable=False)
    valor_numerico = Column(Numeric(20, 6), nullable=True)
    valor_texto = Column(Text, nullable=True)
    tamano_muestra = Column(Integer, nullable=True)
    explicacion = Column(Text, nullable=True)

    analisis = relationship("AnalisisEstadistico", back_populates="resultados")

    analysis_id = synonym('analisis_id')
    metric_name = synonym('nombre_metrica')
    numeric_value = synonym('valor_numerico')
    text_value = synonym('valor_texto')
    sample_size = synonym('tamano_muestra')
    interpretation = synonym('explicacion')


class VariableAleatoria(Base):
    __tablename__ = "variables_aleatorias"
    __table_args__ = {'extend_existing': True}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    conjunto_id = Column(UUID(as_uuid=True), ForeignKey("conjuntos_datos.id", ondelete="CASCADE"), nullable=False, index=True)
    nombre = Column(String(120), nullable=False)
    tipo = Column(String(50), nullable=False)
    distribucion = Column(String(80), nullable=True)
    parametros = Column(JSONB, nullable=True)
    creado_en = Column(DateTime, default=datetime.utcnow, nullable=False)


class AnalisisBayesiano(Base):
    __tablename__ = "analisis_bayesianos"
    __table_args__ = {'extend_existing': True}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    empresa_id = Column(UUID(as_uuid=True), ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    analisis_id = Column(UUID(as_uuid=True), ForeignKey("analisis_estadisticos.id", ondelete="SET NULL"), nullable=True, index=True)
    usuario_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, index=True)
    evento_a = Column(Text, nullable=False)
    evento_b = Column(Text, nullable=False)
    probabilidad_previa = Column(Numeric(9, 8), nullable=False)
    verosimilitud = Column(Numeric(9, 8), nullable=False)
    probabilidad_evidencia = Column(Numeric(9, 8), nullable=False)
    probabilidad_posterior = Column(Numeric(9, 8), nullable=False)
    pasos_calculo = Column(Text, nullable=True)
    creado_en = Column(DateTime, default=datetime.utcnow, nullable=False)

    company_id = synonym('empresa_id')
    analysis_id = synonym('analisis_id')
    user_id = synonym('usuario_id')
    prior_probability = synonym('probabilidad_previa')
    likelihood = synonym('verosimilitud')
    marginal_likelihood = synonym('probabilidad_evidencia')
    posterior_probability = synonym('probabilidad_posterior')
    calculation_steps = synonym('pasos_calculo')
    created_at = synonym('creado_en')


class Insight(Base):
    __tablename__ = "insights"
    __table_args__ = {'extend_existing': True}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    empresa_id = Column(UUID(as_uuid=True), ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    resultado_id = Column(UUID(as_uuid=True), ForeignKey("resultados_estadisticos.id", ondelete="SET NULL"), nullable=True, index=True)
    titulo = Column(String(200), nullable=False)
    descripcion = Column(Text, nullable=False)
    metrica = Column(String(120), nullable=True)
    periodo = Column(String(80), nullable=True)
    regla = Column(Text, nullable=True)
    valor_evidencia = Column(Text, nullable=True)
    severidad = Column(String(50), default="INFO", nullable=False) # INFO, WARNING, OPPORTUNITY, CRITICAL
    creado_en = Column(DateTime, default=datetime.utcnow, nullable=False)

    company_id = synonym('empresa_id')
    result_id = synonym('resultado_id')
    title = synonym('titulo')
    description = synonym('descripcion')
    metric_name = synonym('metrica')
    time_period = synonym('periodo')
    rule_triggered = synonym('regla')
    evidence_value = synonym('valor_evidencia')
    severity = synonym('severidad')
    created_at = synonym('creado_en')


class Reporte(Base):
    __tablename__ = "reportes"
    __table_args__ = {'extend_existing': True}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    empresa_id = Column(UUID(as_uuid=True), ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    usuario_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, index=True)
    tipo = Column(String(60), nullable=False)
    titulo = Column(String(200), nullable=False)
    filtros = Column(JSONB, nullable=True)
    formato = Column(String(10), default="PDF", nullable=False)
    archivo_url = Column(Text, nullable=True)
    generado_en = Column(DateTime, default=datetime.utcnow, nullable=False)

    company_id = synonym('empresa_id')
    user_id = synonym('usuario_id')
    report_type = synonym('tipo')
    title = synonym('titulo')
    filters = synonym('filtros')
    file_format = synonym('formato')
    file_url = synonym('archivo_url')
    generated_at = synonym('generado_en')


# ==============================================================================
# ALIASES Y SINÓNIMOS PARA CLASES LEGACY
# ==============================================================================

Company = Empresa
User = Usuario
Role = Rol
Customer = Cliente
Category = Categoria
Product = Producto
Inventory = Inventario
InventoryMovement = MovimientoInventario
Employee = Empleado
Order = Pedido
OrderDetail = DetallePedido
Sale = Venta
SaleDetail = DetalleVenta
PaymentMethod = MetodoPago
Payment = Pago
AuditLog = RegistroAuditoria
Dataset = ConjuntoDatos
DatasetVariable = VariableEstadistica
Observation = Observacion
StatisticalAnalysis = AnalisisEstadistico
StatisticalResult = ResultadoEstadistico
RandomVariable = VariableAleatoria
BayesAnalysis = AnalisisBayesiano
Report = Reporte
