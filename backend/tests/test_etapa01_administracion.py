import uuid
import pytest
from datetime import datetime, timedelta
from jose import jwt
from fastapi.testclient import TestClient

from app.main import app
from app.nucleo.configuracion import configuracion

client = TestClient(app)


def generar_token_supabase(usuario_uuid: str, correo: str) -> str:
    """Genera un token JWT de prueba firmado con el secreto configurado de Supabase."""
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


def test_obtener_perfil_admin(auth_headers_admin):
    """Verifica que el usuario administrador recupere su perfil y sus 20 permisos."""
    response = client.get("/api/v1/administracion/perfil", headers=auth_headers_admin)
    assert response.status_code == 200
    datos = response.json()
    assert datos["correo_electronico"] == "admin@salesia.com"
    assert "ADMINISTRADOR" in datos["roles"] or "Administrador" in datos["roles"]
    assert "empresas:configurar" in datos["permisos"]
    assert "usuarios:administrar" in datos["permisos"]
    assert len(datos["permisos"]) == 20


def test_obtener_empresa_admin(auth_headers_admin):
    """Verifica la consulta de información fiscal e institucional de la empresa."""
    response = client.get("/api/v1/administracion/empresa", headers=auth_headers_admin)
    assert response.status_code == 200
    empresa = response.json()
    assert empresa["identificador_fiscal"] == "20608912345"
    assert "SalesIA" in empresa["nombre"]
    assert float(empresa["tasa_impuesto"]) == 0.18


def test_control_acceso_rbac_usuarios(auth_headers_admin, auth_headers_vendedor):
    """Verifica que solo usuarios con permiso puedan listar usuarios (Admin: 200, Vendedor: 403)."""
    # Administrador tiene permiso
    resp_admin = client.get("/api/v1/administracion/usuarios", headers=auth_headers_admin)
    assert resp_admin.status_code == 200
    usuarios = resp_admin.json()
    assert len(usuarios) >= 5

    # Vendedor no tiene permiso usuarios:administrar -> 403 Forbidden
    resp_vendedor = client.get("/api/v1/administracion/usuarios", headers=auth_headers_vendedor)
    assert resp_vendedor.status_code == 403
    assert "Acceso denegado" in resp_vendedor.json()["detail"]


def test_catalogo_roles_y_permisos(auth_headers_admin):
    """Verifica el catálogo de roles empresariales y permisos granulares."""
    # Listar roles
    resp_roles = client.get("/api/v1/administracion/roles", headers=auth_headers_admin)
    assert resp_roles.status_code == 200
    roles = resp_roles.json()
    codigos_roles = [r["codigo"] for r in roles]
    assert "ADMINISTRADOR" in codigos_roles
    assert "GERENTE" in codigos_roles
    assert "VENDEDOR" in codigos_roles
    assert "ANALISTA" in codigos_roles
    assert "ALMACEN" in codigos_roles

    # Listar permisos
    resp_permisos = client.get("/api/v1/administracion/permisos", headers=auth_headers_admin)
    assert resp_permisos.status_code == 200
    permisos = resp_permisos.json()
    assert len(permisos) == 20
