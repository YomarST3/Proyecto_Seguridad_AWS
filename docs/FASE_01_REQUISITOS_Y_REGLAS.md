# SalesIA Enterprise – Fase 01: Análisis y Levantamiento de Requisitos

## 1. Visión y Objetivos del Sistema
SalesIA Enterprise es una plataforma web empresarial integral diseñada para unificar la gestión comercial operativa (clientes, productos, inventario, pedidos, ventas y pagos) con un motor estadístico y probabilístico determinístico en backend (media, mediana, variables discretas/continuas, Teorema de Bayes, insights automáticos y reportes auditables).

---

## 2. Actores y Matriz de Roles (RBAC)

| Rol | Alcance y Responsabilidades | Permisos Clave |
| :--- | :--- | :--- |
| **Administrador** | Control total del sistema, configuración global de empresa, sucursales, auditoría y roles. | Gestión de usuarios, roles, parámetros comerciales, acceso a logs de auditoría. |
| **Gerente Comercial** | Supervisión operativa, metas de vendedores, reportes ejecutivos e indicadores generales. | Visualización de todos los dashboards, reportes consolidados, métricas de desempeño. |
| **Vendedor** | Ejecución comercial directa con clientes asignados o prospectos. | Registro de pedidos, ventas directas autorizadas, consulta de stock disponible, sus propios KPIs. |
| **Almacén / Logística** | Control de existencias físicas y trazabilidad de movimientos. | Registro de entradas, salidas, transferencias y ajustes de inventario; consulta de alertas de stock. |
| **Analista de Datos** | Exploración analítica, modelado de variables y evaluación probabilística. | Ejecución de análisis descriptivos (media/mediana), Teorema de Bayes, exploración de datasets. |

---

## 3. Reglas de Negocio Esenciales

### Dominio Clientes
* **RN-CLI-01:** Identificación única por tipo y número de documento (DNI, RUC, Pasaporte) y correo electrónico por empresa (`company_id`).
* **RN-CLI-02:** Desacoplamiento de precios y costos. La ficha de cliente solo administra información demográfica, de contacto y segmentación.
* **RN-CLI-03:** Los indicadores comerciales del cliente (frecuencia, ticket promedio, monto acumulado, fecha de última compra) son proyecciones calculadas en tiempo de consulta desde `sales`.

### Dominio Productos y Precios
* **RN-PRO-01:** Cada producto posee un SKU único por empresa.
* **RN-PRO-02:** Distinción estricta entre costo de adquisición unitario (`cost_price`) y precio de venta base (`sale_price`).
* **RN-PRO-03:** Margen bruto unitario calculado: $\text{Margen} = \text{Precio Venta Neto} - \text{Costo Unitario}$.
* **RN-PRO-04:** Margen porcentual: $\text{Margen \%} = \left(\frac{\text{Margen}}{\text{Precio Venta Neto}}\right) \times 100$, previniendo divisiones por cero.
* **RN-PRO-05:** Inmutabilidad en ventas: Modificar el costo o precio actual de un producto en el catálogo **nunca** altera el costo o precio registrado en ventas históricas previas.

### Dominio Inventario
* **RN-INV-01:** El inventario físico se mantiene en la entidad `inventory`, no en `products`.
* **RN-INV-02:** El stock disponible se calcula como: $\text{Stock Disponible} = \text{Stock Físico} - \text{Stock Reservado}$.
* **RN-INV-03:** No se permite stock disponible negativo. Toda operación de venta o reserva valida disponibilidad bajo bloqueo transaccional (`SELECT ... FOR UPDATE`).
* **RN-INV-04:** Cada alteración de existencias debe generar un `inventory_movement` con tipo (ENTRADA, SALIDA, RESERVA, LIBERACION, AJUSTE), motivo, documento de referencia y usuario responsable.

### Dominio Pedidos, Ventas y Pagos
* **RN-PED-01:** Un pedido (`orders`) representa una intención de compra con estados: `DRAFT`, `PENDING`, `CONFIRMED`, `CANCELLED`, `FULFILLED`. Al pasar a `CONFIRMED`, genera reserva de stock.
* **RN-VEN-01:** Una venta (`sales`) representa un hecho comercial con estados: `CONFIRMED`, `ANNULLED`, `PARTIALLY_REFUNDED`, `REFUNDED`.
* **RN-VEN-02:** Una venta puede generarse directamente o a partir de un pedido confirmado. En este último caso, la reserva se transmuta a salida definitiva en una sola transacción atómica, evitando doble descuento.
* **RN-PAG-01:** Los pagos (`payments`) administran los cobros recibidos. El estado de pago de la venta (`PENDING`, `PARTIAL`, `PAID`) se deriva de: $\text{Saldo Pendiente} = \text{Total Venta} - \sum \text{Pagos Válidos}$.
* **RN-PAG-02:** No se permiten pagos acumulados que superen el saldo de la venta.

### Dominio Motor Estadístico y Probabilidades (Semana 07)
* **RN-EST-01:** Clasificación rigurosa de variables: Cualitativas Nominales, Cualitativas Ordinales, Cuantitativas Discretas y Cuantitativas Continuas.
* **RN-EST-02:** Media aritmética: $\bar{x} = \frac{1}{n} \sum_{i=1}^n x_i$, validando $n > 0$.
* **RN-EST-03:** Mediana: Valor central para $n$ impar, promedio de los dos centrales para $n$ par.
* **RN-EST-04:** Comparación prudente: Cálculo de disparidad relativa entre media y mediana para detección de asimetría sin emitir conclusiones deterministas sesgadas.
* **RN-EST-05:** Teorema de Bayes: $P(A|B) = \frac{P(B|A) \cdot P(A)}{P(B)}$, exigiendo $P(B) > 0$ y probabilidades en el intervalo $[0, 1]$, detallando el paso a paso algebraico.

---

## 4. Criterios de Aceptación Globales
1. Toda operación monetaria se almacena y calcula con precisión decimal (`NUMERIC(14,2)`), libre de errores de coma flotante IEEE 754.
2. Aislamiento estricto multi-tenant por `company_id`.
3. Consistencia total entre Dashboard, Analytics y Reportes: no existen cifras discrepantes para un mismo período y filtro.
4. Historial inmutable y auditoría para acciones críticas (anulaciones, ajustes manuales de stock, cambios de rol).
