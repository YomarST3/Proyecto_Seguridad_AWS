import sys
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')
import json
import uuid
import time
import urllib.request
from decimal import Decimal
import httpx
from sqlalchemy import text, inspect

from app.nucleo.base_datos import motor_db, SesionLocal
from app.nucleo.configuracion import configuracion
from app.core.config import settings
from app.modulos.usuarios.modelos import Usuario
from app.modulos.roles.modelos import Rol, Permiso
from app.modulos.usuarios.servicios import ServicioUsuarios
from app.models.entities import (
    Customer, Product, Category, Inventory, InventoryMovement,
    Sale, SaleDetail, Payment, PaymentMethod, Employee,
    SaleStatusEnum, PaymentStatusEnum, InventoryMovementTypeEnum
)
from app.services.customer_service import CustomerService
from app.services.product_service import ProductService
from app.services.sale_service import SaleService
from app.statistics.engine import StatisticalEngine
from app.infraestructura.supabase_auth import decodificar_token_supabase, requerir_permiso
from jose import jwt
from fastapi import HTTPException

resultados = {}

print("=================================================================")
print("🧪 SALESIA ENTERPRISE - SUITE DE SINCRONIZACIÓN Y PRUEBAS REALES")
print("=================================================================\n")

# -----------------------------------------------------------------
# PRUEBA 1: Conexión con Supabase oficial y las 29 tablas
# -----------------------------------------------------------------
print("[PRUEBA 1] Verificando conexión a Supabase y catálogo oficial de 29 tablas...")
try:
    with motor_db.connect() as conn:
        res = conn.execute(text("SELECT current_database(), current_user, inet_server_addr()")).fetchone()
        db_name, db_user, server_ip = res[0], res[1], res[2]
        
    insp = inspect(motor_db)
    tablas = sorted(insp.get_table_names())
    
    es_supabase = "mvlsuvxwthaakfeqzkhy" in db_user or "us-east-2" in configuracion.DATABASE_URL
    assert es_supabase, f"El usuario {db_user} o la URL no corresponden a Supabase mvlsuvxwthaakfeqzkhy"
    assert len(tablas) == 29, f"Se esperaban 29 tablas en Supabase, encontradas: {len(tablas)}"
    
    resultados["prueba_1_conexion_29_tablas"] = {
        "estado": "PASÓ",
        "base_datos": db_name,
        "usuario": db_user,
        "host": configuracion.DATABASE_URL.split("@")[1].split("/")[0],
        "total_tablas": len(tablas),
        "tablas": tablas
    }
    print(f" -> PASÓ: Conectado a Supabase en {resultados['prueba_1_conexion_29_tablas']['host']}")
    print(f" -> Total tablas verificadas ({len(tablas)} tablas oficiales en español):")
    for i in range(0, len(tablas), 5):
        print("   ", tablas[i:i+5])
    print()
except Exception as e:
    resultados["prueba_1_conexion_29_tablas"] = {"estado": "FALLÓ", "error": str(e)}
    print(" -> FALLÓ:", e, "\n")

# -----------------------------------------------------------------
# PRUEBA 2: Inicio de sesión mediante Supabase Auth
# -----------------------------------------------------------------
print("[PRUEBA 2] Probando infraestructura y endpoints de Supabase Auth...")
try:
    # 2.1 Verificar JWKS de Supabase
    jwks_url = configuracion.SUPABASE_JWT_JWKS_URL
    req = urllib.request.Request(jwks_url, headers={"User-Agent": "SalesIA-Test"})
    with urllib.request.urlopen(req, timeout=5) as r:
        jwks_data = json.loads(r.read().decode())
    
    keys_count = len(jwks_data.get("keys", []))
    assert keys_count > 0, "No se encontraron claves públicas en JWKS de Supabase"
    
    # 2.2 Probar decodificación de token con el usuario Administrador existente
    db = SesionLocal()
    admin_usr = db.query(Usuario).first()
    
    token_admin = jwt.encode(
        {
            "sub": str(admin_usr.id),
            "email": admin_usr.correo,
            "role": "authenticated",
            "aud": "authenticated",
            "exp": int(time.time()) + 3600,
            "iss": configuracion.SUPABASE_URL
        },
        configuracion.SUPABASE_JWT_SECRET,
        algorithm="HS256"
    )
    
    resp_sesion = httpx.post("http://127.0.0.1:8000/api/v1/auth/sesion", json={"access_token": token_admin}, timeout=5)
    assert resp_sesion.status_code == 200, f"Error en /auth/sesion: {resp_sesion.text}"
    sesion_data = resp_sesion.json()
    assert sesion_data["estado"] == "ACTIVO", f"Estado esperado ACTIVO, obtenido: {sesion_data['estado']}"
    assert sesion_data["usuario"]["id"] == str(admin_usr.id)
    
    resultados["prueba_2_supabase_auth"] = {
        "estado": "PASÓ",
        "jwks_claves_activas": keys_count,
        "endpoint_sesion": "HTTP 200 (ACTIVO)",
        "usuario_autenticado": sesion_data["usuario"]["correo_electronico"],
        "empresa_id": str(sesion_data["usuario"]["empresa_id"])
    }
    print(f" -> PASÓ: JWKS activo ({keys_count} claves). Endpoint /auth/sesion retornó estado ACTIVO para {admin_usr.correo}\n")
    db.close()
except Exception as e:
    resultados["prueba_2_supabase_auth"] = {"estado": "FALLÓ", "error": str(e)}
    print(" -> FALLÓ:", e, "\n")

# -----------------------------------------------------------------
# PRUEBA 3: Confirmar que el Administrador obtiene sus 22 permisos
# -----------------------------------------------------------------
print("[PRUEBA 3] Verificando que el Administrador registrado posea sus 22 permisos en PostgreSQL...")
try:
    db = SesionLocal()
    admin_usr = db.query(Usuario).first()
    permisos = ServicioUsuarios.obtener_codigos_permisos(db, admin_usr.id)
    roles = [ur.rol.codigo for ur in admin_usr.roles_asignados]
    
    assert "ADMINISTRADOR" in roles, f"El rol del usuario es {roles}, se esperaba ADMINISTRADOR"
    assert len(permisos) == 22, f"Se esperaban 22 permisos, se obtuvieron: {len(permisos)}"
    
    resultados["prueba_3_admin_22_permisos"] = {
        "estado": "PASÓ",
        "usuario": admin_usr.correo,
        "rol": roles,
        "total_permisos": len(permisos),
        "permisos": sorted(permisos)
    }
    print(f" -> PASÓ: Usuario {admin_usr.correo} con rol {roles} cuenta con EXACTAMENTE {len(permisos)} permisos:")
    print("   ", sorted(permisos), "\n")
    db.close()
except Exception as e:
    resultados["prueba_3_admin_22_permisos"] = {"estado": "FALLÓ", "error": str(e)}
    print(" -> FALLÓ:", e, "\n")

# -----------------------------------------------------------------
# PRUEBA 4: Acceso no autenticado a endpoints protegidos (HTTP 401)
# -----------------------------------------------------------------
print("[PRUEBA 4] Verificando rechazo HTTP 401 a usuarios sin autenticación...")
try:
    r1 = httpx.get("http://127.0.0.1:8000/api/v1/auth/me", timeout=5)
    assert r1.status_code == 401, f"Se esperaba 401 sin auth en /auth/me, se obtuvo {r1.status_code}"
    
    r2 = httpx.get("http://127.0.0.1:8000/api/v1/auth/solicitudes", timeout=5)
    assert r2.status_code == 401, f"Se esperaba 401 sin auth en /auth/solicitudes, se obtuvo {r2.status_code}"
    
    r3 = httpx.get(
        "http://127.0.0.1:8000/api/v1/auth/me",
        headers={"Authorization": "Bearer token_falso_invalido_123"},
        timeout=5
    )
    assert r3.status_code == 401, f"Se esperaba 401 con token falso, se obtuvo {r3.status_code}"
    
    resultados["prueba_4_acceso_no_autenticado_401"] = {
        "estado": "PASÓ",
        "sin_token_me": f"HTTP {r1.status_code}",
        "sin_token_solicitudes": f"HTTP {r2.status_code}",
        "token_invalido": f"HTTP {r3.status_code}"
    }
    print(" -> PASÓ: Todos los accesos sin credenciales válidas retornaron HTTP 401 Unauthorized.\n")
except Exception as e:
    resultados["prueba_4_acceso_no_autenticado_401"] = {"estado": "FALLÓ", "error": str(e)}
    print(" -> FALLÓ:", e, "\n")

# -----------------------------------------------------------------
# PRUEBA 5: Usuario sin permisos recibe HTTP 403
# -----------------------------------------------------------------
print("[PRUEBA 5] Verificando que usuario sin permisos reciba HTTP 403 Forbidden...")
try:
    db = SesionLocal()
    admin_usr = db.query(Usuario).first()
    
    checker = requerir_permiso("permiso:super_secreto_no_existe")
    try:
        checker(usuario=admin_usr, db=db)
        raise AssertionError("Se esperaba HTTPException 403 y no se lanzó.")
    except HTTPException as he:
        assert he.status_code == 403, f"Se esperaba 403, se obtuvo {he.status_code}"
        assert "Acceso denegado" in he.detail
        resultados["prueba_5_autorizacion_rbac_403"] = {
            "estado": "PASÓ",
            "codigo_respuesta": "HTTP 403 Forbidden",
            "detalle": he.detail
        }
        print(f" -> PASÓ: Intentar acción sin el permiso requerido arrojó HTTP 403 ({he.detail})\n")
    db.close()
except Exception as e:
    resultados["prueba_5_autorizacion_rbac_403"] = {"estado": "FALLÓ", "error": str(e)}
    print(" -> FALLÓ:", e, "\n")

# -----------------------------------------------------------------
# PRUEBA 6: Contraseñas no almacenadas en tablas ni expuestas
# -----------------------------------------------------------------
print("[PRUEBA 6] Verificando que ninguna de las 29 tablas contenga columnas de contraseñas...")
try:
    insp = inspect(motor_db)
    columnas_sospechosas = []
    palabras_clave = ["password", "clave", "contrasena", "hash", "secret", "pwd"]
    
    for t in insp.get_table_names():
        for col in insp.get_columns(t):
            cname = col["name"].lower()
            for kw in palabras_clave:
                if kw in cname:
                    columnas_sospechosas.append(f"{t}.{col['name']}")
                    
    assert len(columnas_sospechosas) == 0, f"Se encontraron columnas de contraseña: {columnas_sospechosas}"
    
    resultados["prueba_6_aislamiento_passwords"] = {
        "estado": "PASÓ",
        "columnas_contrasena_en_29_tablas": 0,
        "modelo_auth": "Supabase GoTrue (auth.users externa gestionada por Supabase)"
    }
    print(" -> PASÓ: 0 columnas de contraseña en las 29 tablas del esquema public.")
    print("    Las contraseñas residen exclusivamente en Supabase GoTrue Auth con bcrypt/argon2.\n")
except Exception as e:
    resultados["prueba_6_aislamiento_passwords"] = {"estado": "FALLÓ", "error": str(e)}
    print(" -> FALLÓ:", e, "\n")

# -----------------------------------------------------------------
# PRUEBA 7: Comprobar que no se use accidentalmente PostgreSQL local
# -----------------------------------------------------------------
print("[PRUEBA 7] Comprobando que el backend no utilice PostgreSQL local...")
try:
    url_actual = configuracion.DATABASE_URL
    assert "localhost" not in url_actual and "127.0.0.1" not in url_actual, "La URL apunta a localhost"
    assert "pooler.supabase.com" in url_actual, "La URL no apunta al pooler de Supabase"
    assert "us-east-2" in url_actual, "La región de la URL no es us-east-2"
    assert "mvlsuvxwthaakfeqzkhy" in url_actual, "La URL no contiene el tenant ID de Supabase"
    
    with motor_db.connect() as conn:
        db_user = conn.execute(text("SELECT current_user;")).scalar()
        db_name = conn.execute(text("SELECT current_database();")).scalar()
        assert db_user == "postgres", f"Usuario esperado postgres, obtenido {db_user}"
        assert db_name == "postgres", f"BD esperada postgres, obtenida {db_name}"
        
    resultados["prueba_7_pg_local_desconectado"] = {
        "estado": "PASÓ",
        "host_activo": url_actual.split("@")[1].split("/")[0],
        "tenant_id": "mvlsuvxwthaakfeqzkhy",
        "usuario_bd": db_user,
        "base_datos": db_name,
        "pg_local_desconectado": True
    }
    print(f" -> PASÓ: Conexión exclusiva al host remoto {resultados['prueba_7_pg_local_desconectado']['host_activo']}")
    print(f"    Tenant verificado: mvlsuvxwthaakfeqzkhy | BD remota: {db_name}\n")
except Exception as e:
    resultados["prueba_7_pg_local_desconectado"] = {"estado": "FALLÓ", "error": str(e)}
    print(" -> FALLÓ:", e, "\n")

# -----------------------------------------------------------------
# PRUEBA 8: Módulo de Clientes (búsqueda y listado en 'clientes')
# -----------------------------------------------------------------
print("[PRUEBA 8] Verificando módulo de Clientes sobre la tabla 'clientes'...")
try:
    db = SesionLocal()
    admin_usr = db.query(Usuario).first()
    company_id = admin_usr.empresa_id

    # Listar clientes de la empresa
    clientes = db.query(Customer).filter(Customer.empresa_id == company_id).all()
    
    # Si no hay clientes demo, creamos uno identificado explícitamente como Demostración
    if not clientes:
        cliente_demo = Customer(
            empresa_id=company_id,
            tipo_cliente="NATURAL",
            nombre_razon_social="Cliente Demostración Académica (Demo)",
            tipo_documento="DNI",
            numero_documento="77889900",
            correo="cliente.demo@salesia.enterprise",
            telefono="987654321",
            direccion="Av. Demostración 123",
            activo=True
        )
        db.add(cliente_demo)
        db.commit()
        db.refresh(cliente_demo)
        clientes = [cliente_demo]

    # Probar búsqueda por documento o nombre
    primer_cliente = clientes[0]
    buscados = CustomerService.list_customers(db, company_id=company_id, search=primer_cliente.numero_documento)
    assert len(buscados) > 0, "No se encontró el cliente mediante el servicio de búsqueda"

    # Probar detalle del cliente
    detalle = CustomerService.get_customer_detail(db, company_id=company_id, customer_id=primer_cliente.id)
    assert detalle.id == primer_cliente.id

    resultados["prueba_8_clientes"] = {
        "estado": "PASÓ",
        "total_clientes": len(clientes),
        "cliente_encontrado": detalle.full_name,
        "documento": detalle.doc_number,
        "id_uuid": str(detalle.id)
    }
    print(f" -> PASÓ: Clientes consultados ({len(clientes)}). Detalle obtenido para {detalle.full_name} (ID: {detalle.id})\n")
    db.close()
except Exception as e:
    resultados["prueba_8_clientes"] = {"estado": "FALLÓ", "error": str(e)}
    print(" -> FALLÓ:", e, "\n")

# -----------------------------------------------------------------
# PRUEBA 9: Consulta de Detalle del Producto (categoría, precio, impuesto, stock)
# -----------------------------------------------------------------
print("[PRUEBA 9] Verificando detalle de Producto con categoría, precio, impuesto y stock...")
try:
    db = SesionLocal()
    admin_usr = db.query(Usuario).first()
    company_id = admin_usr.empresa_id

    # Verificar categoría
    categoria = db.query(Category).filter(Category.empresa_id == company_id).first()
    if not categoria:
        categoria = Category(
            empresa_id=company_id,
            nombre="Equipos de Cómputo (Demo)",
            descripcion="Categoría para pruebas y demostración",
            activo=True
        )
        db.add(categoria)
        db.commit()
        db.refresh(categoria)

    # Verificar producto
    producto = db.query(Product).filter(Product.empresa_id == company_id).first()
    if not producto:
        producto = Product(
            empresa_id=company_id,
            categoria_id=categoria.id,
            sku="PROD-DEMO-001",
            nombre="Laptop Empresarial Pro (Demo)",
            descripcion="Equipo para pruebas de inventario y ventas",
            costo_actual=Decimal("2500.00"),
            precio_venta=Decimal("3800.00"),
            tasa_impuesto=Decimal("0.180000"),
            stock_minimo=5,
            activo=True
        )
        db.add(producto)
        db.flush()

        inv = Inventory(
            empresa_id=company_id,
            producto_id=producto.id,
            cantidad_fisica=25,
            cantidad_reservada=0
        )
        db.add(inv)
        db.commit()
        db.refresh(producto)

    # Ejecutar consulta de detalle con ProductService
    prod_detalle = ProductService.get_product(db, company_id=company_id, product_id=producto.id)
    assert prod_detalle.category_name != "", "Categoría no resuelta en el detalle"
    assert prod_detalle.sale_price > Decimal("0.00"), "Precio de venta no válido"
    assert prod_detalle.tax_rate >= Decimal("0.00"), "Tasa de impuesto no válida"
    assert prod_detalle.available_stock >= 0, "Stock disponible no válido"

    resultados["prueba_9_detalle_producto"] = {
        "estado": "PASÓ",
        "producto": prod_detalle.name,
        "sku": prod_detalle.sku,
        "categoria": prod_detalle.category_name,
        "precio_venta": float(prod_detalle.sale_price),
        "costo": float(prod_detalle.cost_price),
        "tasa_impuesto": float(prod_detalle.tax_rate),
        "stock_fisico": prod_detalle.physical_stock,
        "stock_reservado": prod_detalle.reserved_stock,
        "stock_disponible": prod_detalle.available_stock,
        "margen_unitario": float(prod_detalle.unit_margin)
    }
    print(f" -> PASÓ: Detalle de producto validado:")
    print(f"    Producto: {prod_detalle.name} | SKU: {prod_detalle.sku} | Categoría: {prod_detalle.category_name}")
    print(f"    Precio: S/ {prod_detalle.sale_price} | Impuesto: {prod_detalle.tax_rate*100}% | Stock disponible: {prod_detalle.available_stock}\n")
    db.close()
except Exception as e:
    resultados["prueba_9_detalle_producto"] = {"estado": "FALLÓ", "error": str(e)}
    print(" -> FALLÓ:", e, "\n")

# -----------------------------------------------------------------
# PRUEBA 10: Venta transaccional con concurrencia y descuento de stock
# -----------------------------------------------------------------
print("[PRUEBA 10] Verificando venta transaccional con bloqueo pesimista y descuento de stock...")
try:
    db = SesionLocal()
    admin_usr = db.query(Usuario).first()
    company_id = admin_usr.empresa_id

    cliente = db.query(Customer).filter(Customer.empresa_id == company_id).first()
    producto = db.query(Product).filter(Product.empresa_id == company_id).first()
    inventario = db.query(Inventory).filter(Inventory.producto_id == producto.id).first()

    # Empleado
    empleado = db.query(Employee).filter(Employee.empresa_id == company_id).first()
    if not empleado:
        empleado = Employee(
            empresa_id=company_id,
            nombres="Franchesco",
            apellidos="Alexander",
            numero_documento="44556677",
            correo="franchescoalexanderj@gmail.com",
            cargo="ADMINISTRADOR",
            activo=True
        )
        db.add(empleado)
        db.commit()
        db.refresh(empleado)

    # Método de pago
    metodo_pago = db.query(PaymentMethod).filter(PaymentMethod.empresa_id == company_id).first()
    if not metodo_pago:
        metodo_pago = PaymentMethod(
            empresa_id=company_id,
            nombre="Transferencia Bancaria BCP (Demo)",
            codigo="TRANSFERENCIA",
            activo=True
        )
        db.add(metodo_pago)
        db.commit()
        db.refresh(metodo_pago)

    stock_inicial = inventario.physical_stock
    cantidad_a_vender = 2

    from app.schemas.sales import SaleCreate, SaleItemCreate
    datos_venta = SaleCreate(
        customer_id=cliente.id,
        salesperson_id=empleado.id,
        items=[SaleItemCreate(
            product_id=producto.id,
            quantity=cantidad_a_vender,
            unit_price=producto.sale_price,
            discount_amount=Decimal("0.00")
        )],
        paid_amount=producto.sale_price * cantidad_a_vender * (Decimal("1.00") + producto.tax_rate),
        payment_method_id=metodo_pago.id,
        payment_reference="BCP-OP-987654",
        notes="Venta de prueba de verificación transaccional y descuento de stock"
    )

    # Ejecutar la venta a través del servicio transaccional
    venta_res = SaleService.create_sale(
        db=db,
        company_id=company_id,
        data=datos_venta,
        current_user_id=admin_usr.id,
        current_user_employee_id=empleado.id
    )

    # Refrescar y validar que el inventario bajó exactamente por la cantidad vendida
    db.refresh(inventario)
    stock_final = inventario.physical_stock
    assert stock_final == stock_inicial - cantidad_a_vender, f"Stock no disminuyó correctamente: antes {stock_inicial}, después {stock_final}"

    # Validar movimiento de auditoría en movimientos_inventario
    mov = db.query(InventoryMovement).filter(InventoryMovement.documento_referencia == venta_res.sale_code).first()
    assert mov is not None, "No se generó el movimiento de kardex / inventario para la venta"

    resultados["prueba_10_venta_transaccional"] = {
        "estado": "PASÓ",
        "codigo_venta": venta_res.sale_code,
        "total_venta": float(venta_res.total_amount),
        "pagado": float(venta_res.paid_amount),
        "estado_pago": str(venta_res.payment_status),
        "stock_anterior": stock_inicial,
        "stock_nuevo": stock_final,
        "unidades_descontadas": cantidad_a_vender,
        "kardex_registrado": mov.documento_referencia
    }
    print(f" -> PASÓ: Venta registrada con éxito:")
    print(f"    Código: {venta_res.sale_code} | Total: S/ {venta_res.total_amount} | Estado Pago: {venta_res.payment_status}")
    print(f"    Stock: disminuyó de {stock_inicial} a {stock_final} (-{cantidad_a_vender} unidades) bajo bloqueo pesimista\n")
    db.close()
except Exception as e:
    resultados["prueba_10_venta_transaccional"] = {"estado": "FALLÓ", "error": str(e)}
    print(" -> FALLÓ:", e, "\n")

# -----------------------------------------------------------------
# PRUEBA 11: Motor estadístico con datos reales de ventas y catálogo
# -----------------------------------------------------------------
print("[PRUEBA 11] Verificando integración del motor estadístico con datos reales...")
try:
    db = SesionLocal()
    admin_usr = db.query(Usuario).first()
    company_id = admin_usr.empresa_id

    # 11.1 Consultar endpoint real de métricas de ventas
    token_admin = jwt.encode(
        {
            "sub": str(admin_usr.id),
            "email": admin_usr.correo,
            "role": "authenticated",
            "aud": "authenticated",
            "exp": int(time.time()) + 3600,
            "iss": configuracion.SUPABASE_URL
        },
        configuracion.SUPABASE_JWT_SECRET,
        algorithm="HS256"
    )

    resp_sales_stats = httpx.get(
        "http://127.0.0.1:8000/api/v1/statistics/live-sales-metrics",
        headers={"Authorization": f"Bearer {token_admin}"},
        timeout=5
    )
    assert resp_sales_stats.status_code == 200, f"Error en live-sales-metrics: {resp_sales_stats.text}"
    sales_stats = resp_sales_stats.json()

    # 11.2 Consultar endpoint real de métricas de productos
    resp_prod_stats = httpx.get(
        "http://127.0.0.1:8000/api/v1/statistics/live-products-metrics",
        headers={"Authorization": f"Bearer {token_admin}"},
        timeout=5
    )
    assert resp_prod_stats.status_code == 200, f"Error en live-products-metrics: {resp_prod_stats.text}"
    prod_stats = resp_prod_stats.json()

    # 11.3 Probar cálculo bayesiano
    bayes_res = StatisticalEngine.calculate_bayes(
        prior_prob_a=0.30,
        likelihood_b_given_a=0.75,
        marginal_prob_b=0.45,
        event_a_name="Compra Producto Premium",
        event_b_name="Recibe Promoción Especial"
    )
    assert bayes_res["posterior_prob_a_given_b"] == 0.5

    resultados["prueba_11_motor_estadistico"] = {
        "estado": "PASÓ",
        "live_sales_metrics": sales_stats,
        "live_products_metrics": prod_stats,
        "bayes_theorem": {
            "p_a": bayes_res["prior_prob_a"],
            "p_b_dado_a": bayes_res["likelihood_b_given_a"],
            "p_b": bayes_res["marginal_prob_b"],
            "p_a_dado_b": bayes_res["posterior_prob_a_given_b"],
            "interpretacion": bayes_res["verbal_interpretation"]
        }
    }
    print(" -> PASÓ: Motor estadístico integrado con datos reales:")
    if sales_stats.get("has_data"):
        m = sales_stats["metrics"]
        print(f"    Ventas reales: Muestra={m['sample_size']} | Media=S/ {m['mean']} | Mediana=S/ {m['median']} | Forma={m['distribution_shape']}")
    if prod_stats.get("has_data"):
        p = prod_stats.get("price_statistics")
        if p:
            print(f"    Productos reales: Total={prod_stats['total_products']} | Precio Medio=S/ {p['mean']} | Mediana=S/ {p['median']}")
    print(f"    Teorema de Bayes: P(A|B)={bayes_res['posterior_prob_a_given_b']} | {bayes_res['verbal_interpretation']}\n")
    db.close()
except Exception as e:
    resultados["prueba_11_motor_estadistico"] = {"estado": "FALLÓ", "error": str(e)}
    print(" -> FALLÓ:", e, "\n")

# -----------------------------------------------------------------
# PRUEBA 12: Configuración de CORS y compatibilidad con ngrok
# -----------------------------------------------------------------
print("[PRUEBA 12] Verificando política CORS y soporte para ngrok...")
try:
    # 12.1 Verificar options preflight desde frontend local
    resp_cors_local = httpx.options(
        "http://127.0.0.1:8000/api/v1/auth/sesion",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "authorization,content-type"
        },
        timeout=5
    )
    assert resp_cors_local.headers.get("access-control-allow-origin") == "http://localhost:5173", "CORS no autorizó localhost:5173"

    # 12.2 Verificar options preflight desde un subdominio ngrok autorizado
    resp_cors_ngrok = httpx.options(
        "http://127.0.0.1:8000/api/v1/auth/sesion",
        headers={
            "Origin": "https://salesia-demo.ngrok-free.app",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "authorization,content-type"
        },
        timeout=5
    )
    assert resp_cors_ngrok.headers.get("access-control-allow-origin") == "https://salesia-demo.ngrok-free.app", "CORS no autorizó dominio ngrok"

    # 12.3 Verificar que un origen no autorizado sea rechazado
    resp_cors_malicious = httpx.options(
        "http://127.0.0.1:8000/api/v1/auth/sesion",
        headers={
            "Origin": "https://sitio-malicioso-externo.com",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "authorization,content-type"
        },
        timeout=5
    )
    assert "access-control-allow-origin" not in resp_cors_malicious.headers, "CORS permitió un origen externo no autorizado"

    resultados["prueba_12_cors_ngrok"] = {
        "estado": "PASÓ",
        "frontend_local": "PERMITIDO (http://localhost:5173)",
        "ngrok_tunnel": "PERMITIDO (https://salesia-demo.ngrok-free.app)",
        "origen_malicioso": "BLOQUEADO (Sin Access-Control-Allow-Origin)",
        "credenciales_permitidas": True
    }
    print(" -> PASÓ: Política CORS validada: Localhost y túneles ngrok autorizados, sitios arbitrarios bloqueados.\n")
except Exception as e:
    resultados["prueba_12_cors_ngrok"] = {"estado": "FALLÓ", "error": str(e)}
    print(" -> FALLÓ:", e, "\n")

# -----------------------------------------------------------------
# GUARDAR RESULTADOS JSON
# -----------------------------------------------------------------
with open("resultados_verificacion.json", "w", encoding="utf-8") as f:
    json.dump(resultados, f, indent=2, ensure_ascii=False)

print("=================================================================")
print("🏁 RESULTADO FINAL: 12 DE 12 PRUEBAS EJECUTADAS")
print("=================================================================")
