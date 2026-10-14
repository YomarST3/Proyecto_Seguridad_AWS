import uuid
import time
import pytest
from jose import jwt
from fastapi.testclient import TestClient
from sqlalchemy import text

from app.main import app
from app.nucleo.configuracion import configuracion
from app.nucleo.base_datos import SesionLocal
from app.modulos.usuarios.modelos import Usuario
from app.modulos.roles.modelos import Rol, UsuarioRol
from app.modulos.empresas.modelos import Empresa

client = TestClient(app)


def generar_token(usuario_uuid: str, correo: str, expired: bool = False) -> str:
    ahora = int(time.time())
    if expired:
        exp = ahora - 600
    else:
        exp = ahora + 7200

    payload = {
        "sub": usuario_uuid,
        "email": correo,
        "role": "authenticated",
        "aud": "authenticated",
        "exp": exp,
        "iss": configuracion.SUPABASE_URL
    }
    return jwt.encode(
        payload,
        configuracion.SUPABASE_JWT_SECRET,
        algorithm="HS256"
    )


def test_token_expirado_rechazado():
    """Verifica que un token expirado sea rechazado con 401."""
    token = generar_token("a0000000-0000-0000-0000-000000000001", "admin@salesia.com", expired=True)
    resp = client.post("/api/v1/auth/sesion", json={"access_token": token})
    assert resp.status_code == 401
    assert "expirado" in resp.json()["detail"].lower() or "sesión" in resp.json()["detail"].lower()


def test_token_firma_manipulada():
    """Verifica que un token alterado sea rechazado con 401."""
    token = generar_token("a0000000-0000-0000-0000-000000000001", "admin@salesia.com")
    token_alterado = token[:-5] + "XXXXX"
    resp = client.post("/api/v1/auth/sesion", json={"access_token": token_alterado})
    assert resp.status_code == 401


def test_usuario_inactivo_rechazado():
    """Verifica que un usuario desactivado reciba estado INACTIVO sin datos."""
    db = SesionLocal()
    u_inactivo_id = uuid.uuid4()
    correo_inactivo = f"inactivo_{uuid.uuid4().hex[:6]}@salesia.com"
    empresa = db.query(Empresa).first()
    
    # 1. Registrar identidad en auth.users
    db.execute(
        text("INSERT INTO auth.users (id, email) VALUES (:id, :email) ON CONFLICT (id) DO NOTHING;"),
        {"id": u_inactivo_id, "email": correo_inactivo}
    )
    db.commit()

    # 2. Registrar usuario en tabla empresarial con activo=False
    usr = Usuario(
        id=u_inactivo_id,
        empresa_id=empresa.id,
        nombre_completo="Usuario Inactivo Test",
        correo_electronico=correo_inactivo,
        activo=False
    )
    db.add(usr)
    db.commit()
    db.close()

    token = generar_token(str(u_inactivo_id), correo_inactivo)
    resp = client.post("/api/v1/auth/sesion", json={"access_token": token})
    assert resp.status_code == 200
    data = resp.json()
    assert data["estado"] == "INACTIVO"
    assert data["usuario"] is None


def test_usuario_sin_roles_asignados():
    """Verifica que un usuario activo pero sin roles asignados reciba estado SIN_ROLES."""
    db = SesionLocal()
    u_sin_roles_id = uuid.uuid4()
    correo = f"sin_roles_{uuid.uuid4().hex[:6]}@salesia.com"
    empresa = db.query(Empresa).first()
    
    # 1. Registrar identidad en auth.users
    db.execute(
        text("INSERT INTO auth.users (id, email) VALUES (:id, :email) ON CONFLICT (id) DO NOTHING;"),
        {"id": u_sin_roles_id, "email": correo}
    )
    db.commit()

    # 2. Registrar usuario activo pero sin filas en usuarios_roles
    usr = Usuario(
        id=u_sin_roles_id,
        empresa_id=empresa.id,
        nombre_completo="Usuario Sin Roles",
        correo_electronico=correo,
        activo=True
    )
    db.add(usr)
    db.commit()
    db.close()

    token = generar_token(str(u_sin_roles_id), correo)
    resp = client.post("/api/v1/auth/sesion", json={"access_token": token})
    assert resp.status_code == 200
    data = resp.json()
    assert data["estado"] == "SIN_ROLES"
    assert data["usuario"] is None


def test_prohibicion_auto_otorgamiento_roles():
    """Verifica que un usuario no pueda auto-modificarse sus propios roles (anti-autoescalamiento)."""
    admin_uuid = "a0000000-0000-0000-0000-000000000001"
    token = generar_token(admin_uuid, "admin@salesia.com")
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.post(
        f"/api/v1/administracion/usuarios/{admin_uuid}/roles",
        headers=headers,
        json={"roles_ids": [1, 2]}
    )
    assert resp.status_code == 400
    assert "no puede modificar sus propios roles" in resp.json()["detail"].lower()


def test_proteccion_ultimo_administrador():
    """Verifica que no sea posible desactivar al último administrador activo."""
    admin_uuid = "a0000000-0000-0000-0000-000000000001"
    token = generar_token(admin_uuid, "admin@salesia.com")
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.put(
        f"/api/v1/administracion/usuarios/{admin_uuid}",
        headers=headers,
        json={"activo": False}
    )
    assert resp.status_code == 400
    assert "último administrador" in resp.json()["detail"].lower()
