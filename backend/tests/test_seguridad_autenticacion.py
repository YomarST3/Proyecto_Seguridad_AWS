import uuid
import pytest
from datetime import datetime, timedelta
from jose import jwt
from fastapi.testclient import TestClient

from app.main import app
from app.nucleo.configuracion import configuracion
from app.nucleo.base_datos import SesionLocal
from app.modulos.roles.modelos import Rol

client = TestClient(app)


def generar_token_supabase(usuario_uuid: str, correo: str) -> str:
    expiracion = datetime.utcnow() + timedelta(hours=2)
    payload = {
        "sub": usuario_uuid,
        "email": correo,
        "role": "authenticated",
        "aud": "authenticated",
        "exp": expiracion.timestamp()
    }
    return jwt.encode(
        payload,
        configuracion.SUPABASE_JWT_SECRET,
        algorithm=configuracion.SUPABASE_JWT_ALGORITHM
    )


@pytest.fixture
def auth_headers_admin():
    token = generar_token_supabase(
        usuario_uuid="a0000000-0000-0000-0000-000000000001",
        correo="admin@salesia.com"
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def auth_headers_vendedor():
    token = generar_token_supabase(
        usuario_uuid="a0000000-0000-0000-0000-000000000003",
        correo="vendedor@salesia.com"
    )
    return {"Authorization": f"Bearer {token}"}


def test_verificar_correo_anti_enumeracion():
    """
    Verifica que el Paso 1 de login no filtre si un usuario existe o no,
    previniendo ataques de enumeración de cuentas.
    """
    # Correo existente
    r1 = client.post("/api/v1/auth/verificar-correo", json={"correo": "admin@salesia.com"})
    assert r1.status_code == 200
    d1 = r1.json()
    assert d1["valido"] is True
    assert d1["siguiente_paso"] == "password"

    # Correo inexistente
    r2 = client.post("/api/v1/auth/verificar-correo", json={"correo": "no_existe_9999@empresa.com"})
    assert r2.status_code == 200
    d2 = r2.json()
    assert d2["valido"] is True
    assert d2["siguiente_paso"] == "password"

    # Formato inválido debe rechazarse con 422
    r3 = client.post("/api/v1/auth/verificar-correo", json={"correo": "formato-invalido"})
    assert r3.status_code == 422


def test_sesion_supabase_token_invalido():
    """Verifica que tokens alterados o con firma no válida sean rechazados con 401."""
    resp = client.post("/api/v1/auth/sesion", json={"access_token": "token.falso.invalido"})
    assert resp.status_code == 401


def test_sesion_supabase_usuario_activo():
    """Verifica que un usuario activo obtenga su perfil con roles y permisos."""
    token = generar_token_supabase(
        usuario_uuid="a0000000-0000-0000-0000-000000000001",
        correo="admin@salesia.com"
    )
    resp = client.post("/api/v1/auth/sesion", json={"access_token": token})
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["estado"] == "ACTIVO"
    assert datos["usuario"]["correo_electronico"] == "admin@salesia.com"
    assert "ADMINISTRADOR" in datos["usuario"]["roles"]
    assert len(datos["usuario"]["permisos"]) == 20


def test_flujo_solicitud_acceso_y_aprobacion(auth_headers_admin, auth_headers_vendedor):
    """
    Verifica el flujo completo de registro pendiente:
    1. Registro de solicitud por nuevo usuario.
    2. Al verificar sesión retorna SOLICITUD_PENDIENTE sin acceso a módulos.
    3. Solo un administrador puede ver y aprobar la solicitud asignando roles.
    4. Un vendedor sin permiso 'usuarios:administrar' recibe 403 Forbidden.
    """
    nuevo_uuid = str(uuid.uuid4())
    correo_nuevo = f"nuevo_colaborador_{uuid.uuid4().hex[:6]}@salesia.com"

    # Simular registro previo en auth.users como hace Supabase Auth al registrar credenciales
    db = SesionLocal()
    from sqlalchemy import text
    db.execute(
        text("INSERT INTO auth.users (id, email) VALUES (:id, :email) ON CONFLICT (id) DO NOTHING;"),
        {"id": uuid.UUID(nuevo_uuid), "email": correo_nuevo}
    )
    db.commit()
    db.close()

    # 1. Registrar solicitud de acceso
    req_resp = client.post("/api/v1/auth/solicitar-acceso", json={
        "usuario_id": nuevo_uuid,
        "empresa_id": 1,
        "nombre_completo": "Pedro Ingeniero",
        "correo_electronico": correo_nuevo,
        "motivo": "Ingreso al área de almacén"
    })

    assert req_resp.status_code == 200
    solicitud = req_resp.json()
    solicitud_id = solicitud["id"]
    assert solicitud["estado"] == "PENDIENTE"

    # 2. Verificar que al consultar sesión retorne SOLICITUD_PENDIENTE
    token_nuevo = generar_token_supabase(nuevo_uuid, correo_nuevo)
    sesion_resp = client.post("/api/v1/auth/sesion", json={"access_token": token_nuevo})
    assert sesion_resp.status_code == 200
    assert sesion_resp.json()["estado"] == "SOLICITUD_PENDIENTE"
    assert sesion_resp.json()["usuario"] is None

    # 3. Vendedor no puede ver solicitudes -> 403
    resp_vendedor = client.get("/api/v1/auth/solicitudes", headers=auth_headers_vendedor)
    assert resp_vendedor.status_code == 403

    # 4. Administrador consulta solicitudes pendientes
    resp_admin = client.get("/api/v1/auth/solicitudes", headers=auth_headers_admin)
    assert resp_admin.status_code == 200
    solicitudes = resp_admin.json()
    ids_pendientes = [s["id"] for s in solicitudes]
    assert solicitud_id in ids_pendientes

    # 5. Obtener ID del rol ALMACEN para asignarlo
    db = SesionLocal()
    rol_almacen = db.query(Rol).filter(Rol.codigo == "ALMACEN").first()
    db.close()
    assert rol_almacen is not None

    # 6. Administrador aprueba la solicitud asignando rol ALMACEN
    aprob_resp = client.post(
        f"/api/v1/auth/solicitudes/{solicitud_id}/aprobar",
        headers=auth_headers_admin,
        json={"roles_ids": [rol_almacen.id]}
    )
    assert aprob_resp.status_code == 200

    # 7. Ahora el usuario tiene estado ACTIVO con rol ALMACEN
    sesion_activa_resp = client.post("/api/v1/auth/sesion", json={"access_token": token_nuevo})
    assert sesion_activa_resp.status_code == 200
    datos_activos = sesion_activa_resp.json()
    assert datos_activos["estado"] == "ACTIVO"
    assert "ALMACEN" in datos_activos["usuario"]["roles"]
    assert "inventario:leer" in datos_activos["usuario"]["permisos"]
