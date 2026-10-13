import uuid
from typing import Optional, List, Callable
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.nucleo.base_datos import obtener_sesion_db
from app.nucleo.configuracion import configuracion
from app.modulos.usuarios.modelos import Usuario
from app.modulos.usuarios.servicios import ServicioUsuarios

portador_seguridad = HTTPBearer(auto_error=False)


def decodificar_token_supabase(token: str) -> dict:
    """Verifica y decodifica un token JWT emitido por Supabase Auth (GoTrue)."""
    try:
        # Validación con el secreto del proyecto Supabase
        payload = jwt.decode(
            token,
            configuracion.SUPABASE_JWT_SECRET,
            algorithms=[configuracion.SUPABASE_JWT_ALGORITHM],
            options={"verify_aud": False}
        )
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token de Supabase inválido o expirado: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


def obtener_usuario_autenticado(
    credenciales: Optional[HTTPAuthorizationCredentials] = Depends(portador_seguridad),
    db: Session = Depends(obtener_sesion_db)
) -> Usuario:
    """Extrae el usuario autenticado a partir del JWT de Supabase."""
    if not credenciales:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales de autenticación no proporcionadas.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credenciales.credentials
    payload = decodificar_token_supabase(token)
    
    sub = payload.get("sub")
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="El token no contiene un identificador de usuario válido (sub).",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        usuario_uuid = uuid.UUID(sub)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Formato de identificador de usuario UUID inválido.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    usuario = db.query(Usuario).filter(
        Usuario.id == usuario_uuid,
        Usuario.activo == True
    ).first()

    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario no registrado en la empresa o se encuentra inactivo."
        )

    return usuario


def requerir_permiso(codigo_permiso: str) -> Callable:
    """Inyector de dependencias para autorización RBAC basada en permisos granulares."""
    def verificador_permiso(
        usuario: Usuario = Depends(obtener_usuario_autenticado),
        db: Session = Depends(obtener_sesion_db)
    ) -> Usuario:
        permisos_usuario = ServicioUsuarios.obtener_codigos_permisos(db, usuario.id)

        # Si el usuario tiene el permiso específico o posee rol de administrador total
        if codigo_permiso in permisos_usuario or "empresas:configurar" in permisos_usuario:
            return usuario

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Acceso denegado: Se requiere el permiso '{codigo_permiso}' para ejecutar esta acción."
        )

    return verificador_permiso
