from typing import Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.nucleo.base_datos import obtener_sesion_db
from app.modulos.usuarios.modelos import Usuario
from app.infraestructura.supabase_auth import (
    obtener_usuario_autenticado,
    portador_seguridad,
    requerir_permiso
)

# Exportar get_current_user para compatibilidad con todos los endpoints
get_current_user = obtener_usuario_autenticado


def require_roles(allowed_roles: List[str]):
    """Verificador de roles RBAC basado en el modelo empresarial de Supabase."""
    def role_checker(
        usuario: Usuario = Depends(obtener_usuario_autenticado),
        db: Session = Depends(obtener_sesion_db)
    ) -> Usuario:
        codigos_roles = [ur.rol.codigo for ur in usuario.roles_asignados if ur.rol and ur.rol.activo]
        
        # Superadministrador tiene pase directo
        if "ADMINISTRADOR" in codigos_roles or "ADMIN" in codigos_roles:
            return usuario
            
        if not any(r in allowed_roles for r in codigos_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acceso denegado. Se requiere uno de los siguientes roles: {', '.join(allowed_roles)}."
            )
        return usuario
    return role_checker
