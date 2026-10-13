# SalesIA Enterprise – Fase 02: Arquitectura Técnica y Contratos API

## 1. Topología del Sistema y Aislamiento de Capas

```
                     ┌───────────────────────────────────┐
                     │          Cliente Web             │
                     │  React 18 + TS + Tailwind + Shadcn│
                     └─────────────────┬─────────────────┘
                                       │ HTTPS / JSON REST
                                       ▼
                     ┌───────────────────────────────────┐
                     │          API Gateway              │
                     │  FastAPI (Middleware, CORS, JWT)  │
                     └─────────────────┬─────────────────┘
                                       │
         ┌─────────────────────────────┼─────────────────────────────┐
         ▼                             ▼                             ▼
┌──────────────────┐          ┌──────────────────┐          ┌──────────────────┐
│ Dominio Comercial│          │  Motor Estadístico│         │  Auditoría & RBAC│
│ Ventas, Pedidos, │          │  NumPy, Pandas,  │          │  Control de Roles│
│ Clientes, Stock  │          │  SciPy (Semana 07│          │  y Registro Logs │
└────────┬─────────┘          └────────┬─────────┘          └────────┬─────────┘
         │                             │                             │
         └─────────────────────────────┼─────────────────────────────┘
                                       │ SQLAlchemy 2.0 (Pool transaccional)
                                       ▼
                     ┌───────────────────────────────────┐
                     │       PostgreSQL 18 Database      │
                     │  salesia_db (Port 5433 / ACID)    │
                     └───────────────────────────────────┘
```

---

## 2. Contratos de la API REST (Prefijo `/api/v1`)

### Autenticación y Perfil
* `POST /api/v1/auth/login` → Inicio de sesión, retorna JWT Bearer token y claims de usuario/rol.
* `GET /api/v1/auth/me` → Información de sesión activa, permisos y empresa vinculada.

### Clientes
* `GET /api/v1/customers` → Listado paginado con filtros (`search`, `status`, `sort`).
* `POST /api/v1/customers` → Registro de cliente con validación de documento y unicidad.
* `GET /api/v1/customers/{id}` → Ficha completa con KPIs de compra calculados.
* `PUT /api/v1/customers/{id}` → Actualización de datos de contacto o estado.

### Productos y Categorías
* `GET /api/v1/categories` → Listado de categorías activas.
* `POST /api/v1/categories` → Crear categoría.
* `GET /api/v1/products` → Catálogo paginado con costo, precio de venta y margen.
* `POST /api/v1/products` → Crear producto y registrar inventario inicial.
* `GET /api/v1/products/{id}` → Detalle del producto con datos de inventario vinculado.
* `PUT /api/v1/products/{id}` → Actualizar información del producto.

### Inventario
* `GET /api/v1/inventory` → Existencias: stock físico, reservado y disponible con alertas de stock mínimo.
* `POST /api/v1/inventory/movements` → Registro manual autorizado de entrada, salida o ajuste.
* `GET /api/v1/inventory/movements` → Historial auditable de movimientos por producto o rango de fechas.

### Pedidos (Órdenes)
* `GET /api/v1/orders` → Listado de pedidos con filtro de estado (`DRAFT`, `PENDING`, `CONFIRMED`, `CANCELLED`).
* `POST /api/v1/orders` → Creación de pedido con líneas de detalle y cálculo de subtotal/impuestos.
* `POST /api/v1/orders/{id}/confirm` → Confirma pedido y reserva inventario.
* `POST /api/v1/orders/{id}/cancel` → Cancela pedido y libera reserva de existencias.

### Ventas y Facturación
* `GET /api/v1/sales` → Listado de ventas válidas y anuladas.
* `POST /api/v1/sales` → Registro de venta directa o desde pedido confirmado (descuenta stock, crea snapshot).
* `GET /api/v1/sales/{id}` → Detalle de la venta con desglose inmutable y lista de pagos.
* `POST /api/v1/sales/{id}/annul` → Anulación con reingreso físico de existencias y auditoría.

### Pagos
* `GET /api/v1/payments/sale/{sale_id}` → Historial de pagos de una venta específica.
* `POST /api/v1/payments` → Registro de pago (efectivo, tarjeta, transferencia, etc.) con validación de saldo.
* `GET /api/v1/payments/methods` → Métodos de pago habilitados.

### Personal y Vendedores
* `GET /api/v1/employees` → Directorio de colaboradores y vendedores.
* `POST /api/v1/employees` → Alta de colaborador y enlace opcional con cuenta de usuario.
* `GET /api/v1/employees/{id}/performance` → Indicadores de rendimiento comercial por período.

### Inteligencia Comercial y Motor Estadístico
* `GET /api/v1/dashboard/summary` → KPIs operativos en tiempo real (Ventas, Ingresos cobrados, Pedidos pendientes).
* `GET /api/v1/analytics/overview` → Métricas temporales agrupadas (por día, semana, mes).
* `POST /api/v1/statistics/mean` → Cálculo determinístico de media aritmética con validaciones.
* `POST /api/v1/statistics/median` → Cálculo de mediana ordenando muestras pares e impares.
* `POST /api/v1/statistics/compare` → Comparación numérica y análisis prudente de asimetría.
* `POST /api/v1/probability/bayes` → Evaluación formal del Teorema de Bayes con procedimiento algebraico.
* `POST /api/v1/random-variables/analyze` → Clasificación y cálculo de variables aleatorias discretas/continuas.
* `GET /api/v1/insights` → Observaciones automáticas basadas en reglas explicables y evidencia cuantitativa.
* `GET /api/v1/reports` → Generación consolidada de reportes y descarga en formatos CSV/PDF.
