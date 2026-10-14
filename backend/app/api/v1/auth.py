import uuid
from typing import List, Optional, Any
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Header
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from sqlalchemy.orm import Session
from jose import jwt

from app.nucleo.base_datos import obtener_sesion_db
from app.nucleo.configuracion import configuracion
from app.infraestructura.supabase_auth import (
    obtener_usuario_autenticado,
    decodificar_token_supabase,
    requerir_permiso
)
from app.modulos.usuarios.modelos import Usuario
from app.modulos.usuarios.servicios import ServicioUsuarios
from app.modulos.solicitudes.modelos import SolicitudAcceso
from app.modulos.solicitudes.servicios import ServicioSolicitudes
from app.modulos.solicitudes.esquemas import (
    SolicitudAccesoCrear,
    SolicitudAccesoRespuesta,
    SolicitudAprobar,
    SolicitudRechazar
)

# Legacy imports for test suite compatibility
from app.core.database import get_db
from app.schemas.auth import LoginRequest, TokenResponse, UserResponse
from app.models.entities import User
from app.security.passwords import verify_password
from app.security.jwt import create_access_token

router = APIRouter(prefix="/auth", tags=["Autenticación & Acceso por Roles"])


# ==============================================================================
# ESQUEMAS DE AUTENTICACIÓN EMPRESARIAL
# ==============================================================================

class VerificarCorreoPaso1(BaseModel):
    correo: EmailStr = Field(description="Correo electrónico del usuario")


class RespuestaPaso1(BaseModel):
    valido: bool = True
    siguiente_paso: str = "password"
    mensaje: str = "Formato de correo válido. Proceda a ingresar su contraseña."


class SesionSupabaseRequest(BaseModel):
    access_token: str = Field(description="JWT Bearer token obtenido de Supabase Auth")


class UsuarioEmpresarialRespuesta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    correo_electronico: str
    nombre_completo: str
    empresa_id: uuid.UUID
    activo: bool
    roles: List[str] = []
    permisos: List[str] = []


class EstadoSesionRespuesta(BaseModel):
    estado: str  # ACTIVO, SOLICITUD_PENDIENTE, RECHAZADA, INACTIVO, NO_REGISTRADO
    mensaje: str
    usuario: Optional[UsuarioEmpresarialRespuesta] = None
    solicitud_id: Optional[Any] = None


# ==============================================================================
# ENDPOINTS DE AUTENTICACIÓN EN DOS PASOS
# ==============================================================================

@router.post("/verificar-correo", response_model=RespuestaPaso1)
def verificar_correo_paso1(datos: VerificarCorreoPaso1):
    """
    Paso 1 del Login Empresarial:
    Valida el formato del correo y responde siempre con éxito para evitar
    la enumeración de cuentas por atacantes externos (seguridad anti-enumeración).
    """
    return RespuestaPaso1(
        valido=True,
        siguiente_paso="password",
        mensaje="Formato de correo válido."
    )


@router.post("/sesion", response_model=EstadoSesionRespuesta)
def verificar_sesion_supabase(
    datos: SesionSupabaseRequest,
    db: Session = Depends(obtener_sesion_db)
):
    """
    Paso 2 del Login Empresarial:
    1. Verifica y decodifica criptográficamente el JWT emitido por Supabase.
    2. Localiza al usuario en la tabla 'public.usuarios' mediante auth.users.id (UUID).
    3. Si el usuario no existe en la empresa, verifica si tiene una solicitud de acceso pendiente.
    4. Si está activo, retorna su perfil con su matriz de roles y permisos autorizados.
    """
    payload = decodificar_token_supabase(datos.access_token)
    sub = payload.get("sub")
    email = payload.get("email")

    if not sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="El token no contiene un identificador de usuario válido (sub)."
        )

    try:
        usuario_uuid = uuid.UUID(sub)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Identificador de usuario en token no es un UUID válido."
        )

    # 1. Buscar en tabla empresarial 'usuarios'
    usuario = db.query(Usuario).filter(Usuario.id == usuario_uuid).first()

    if usuario:
        if not usuario.activo:
            return EstadoSesionRespuesta(
                estado="INACTIVO",
                mensaje="Tu cuenta de usuario ha sido desactivada por un administrador.",
                usuario=None
            )

        # Consultar roles y permisos autorizados
        permisos = ServicioUsuarios.obtener_codigos_permisos(db, usuario.id)
        codigos_roles = [ur.rol.codigo for ur in usuario.roles_asignados if ur.rol and ur.rol.activo]

        # Validar si el usuario no tiene ningún rol activo asignado
        if not codigos_roles:
            return EstadoSesionRespuesta(
                estado="SIN_ROLES",
                mensaje="Tu cuenta de usuario está activa pero aún no cuenta con ningún rol empresarial asignado.",
                usuario=None
            )

        # Sincronización segura de correo si cambió en Supabase Auth
        if email and email.lower().strip() != usuario.correo_electronico.lower().strip():
            usuario.correo_electronico = email.lower().strip()

        # Actualizar marca de último acceso
        usuario.ultimo_acceso = datetime.utcnow()
        db.commit()

        usr_dto = UsuarioEmpresarialRespuesta(
            id=usuario.id,
            correo_electronico=usuario.correo_electronico,
            nombre_completo=usuario.nombre_completo,
            empresa_id=usuario.empresa_id,
            activo=usuario.activo,
            roles=codigos_roles,
            permisos=permisos
        )

        return EstadoSesionRespuesta(
            estado="ACTIVO",
            mensaje="Sesión empresarial autenticada exitosamente.",
            usuario=usr_dto
        )

    # 2. Si no está en 'usuarios', verificar si tiene solicitud en 'solicitudes_acceso'
    solicitud = ServicioSolicitudes.obtener_por_usuario_id(db, usuario_uuid)
    if solicitud:
        if solicitud.estado == "PENDIENTE":
            return EstadoSesionRespuesta(
                estado="SOLICITUD_PENDIENTE",
                mensaje="Tu cuenta está confirmada en Supabase, pero tu solicitud de acceso empresarial se encuentra en revisión por un administrador.",
                solicitud_id=solicitud.id
            )
        elif solicitud.estado == "RECHAZADA":
            return EstadoSesionRespuesta(
                estado="RECHAZADA",
                mensaje="Tu solicitud de acceso fue rechazada por la administración.",
                solicitud_id=solicitud.id
            )

    # 3. Usuario registrado en Supabase pero aún no ha creado solicitud
    return EstadoSesionRespuesta(
        estado="NO_REGISTRADO",
        mensaje="Cuenta autenticada en Supabase, pero sin vinculación empresarial.",
        solicitud_id=None
    )


@router.post("/solicitar-acceso", response_model=SolicitudAccesoRespuesta)
def registrar_solicitud_acceso(
    datos: SolicitudAccesoCrear,
    db: Session = Depends(obtener_sesion_db)
):
    """
    Registra de forma segura e idempotente una solicitud de acceso empresarial tras
    completar el registro en Supabase Auth.
    """
    solicitud = ServicioSolicitudes.crear_solicitud_idempotente(db, datos)
    return solicitud


@router.get("/me", response_model=UsuarioEmpresarialRespuesta)
def obtener_perfil_actual(
    usuario_actual: Usuario = Depends(obtener_usuario_autenticado),
    db: Session = Depends(obtener_sesion_db)
):
    """
    Retorna el perfil del usuario autenticado, su lista de roles y sus permisos granulares.
    """
    permisos = ServicioUsuarios.obtener_codigos_permisos(db, usuario_actual.id)
    codigos_roles = [ur.rol.codigo for ur in usuario_actual.roles_asignados if ur.rol and ur.rol.activo]

    return UsuarioEmpresarialRespuesta(
        id=usuario_actual.id,
        correo_electronico=usuario_actual.correo_electronico,
        nombre_completo=usuario_actual.nombre_completo,
        empresa_id=usuario_actual.empresa_id,
        activo=usuario_actual.activo,
        roles=codigos_roles,
        permisos=permisos
    )


# ==============================================================================
# GESTIÓN DE SOLICITUDES DE ACCESO (ADMINISTRADOR)
# ==============================================================================

@router.get("/solicitudes", response_model=List[SolicitudAccesoRespuesta])
def listar_solicitudes_acceso(
    admin: Usuario = Depends(requerir_permiso("usuarios:administrar")),
    db: Session = Depends(obtener_sesion_db)
):
    """Lista las solicitudes de acceso empresarial pendientes (Solo administradores)."""
    return ServicioSolicitudes.listar_pendientes(db, admin.empresa_id)


@router.post("/solicitudes/{solicitud_id}/aprobar")
def aprobar_solicitud_acceso(
    solicitud_id: UUID,
    datos: SolicitudAprobar,
    admin: Usuario = Depends(requerir_permiso("usuarios:administrar")),
    db: Session = Depends(obtener_sesion_db)
):
    """Aprueba una solicitud de acceso y asigna los roles seleccionados."""
    usuario_creado = ServicioSolicitudes.aprobar_solicitud(
        db=db,
        solicitud_id=solicitud_id,
        datos=datos,
        admin_id=admin.id
    )
    return {
        "mensaje": f"Solicitud #{solicitud_id} aprobada exitosamente.",
        "usuario_id": str(usuario_creado.id),
        "correo": usuario_creado.correo_electronico
    }


@router.post("/solicitudes/{solicitud_id}/rechazar")
def rechazar_solicitud_acceso(
    solicitud_id: UUID,
    datos: Optional[SolicitudRechazar] = None,
    admin: Usuario = Depends(requerir_permiso("usuarios:administrar")),
    db: Session = Depends(obtener_sesion_db)
):
    """Rechaza una solicitud de acceso."""
    motivo = datos.motivo if datos else None
    solicitud = ServicioSolicitudes.rechazar_solicitud(
        db=db,
        solicitud_id=solicitud_id,
        admin_id=admin.id,
        motivo=motivo
    )
    return {
        "mensaje": f"Solicitud #{solicitud_id} rechazada.",
        "solicitud_id": solicitud.id
    }


# ==============================================================================
# COMPATIBILIDAD CON ENTORNO DE PRUEBAS / SUITE AUTOMATIZADA
# ==============================================================================

@router.post("/login", response_model=TokenResponse)
def login_compatibilidad(
    data: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Endpoint de login compatible con la suite de pruebas local.
    Verifica las credenciales y genera un JWT válido firmado con SUPABASE_JWT_SECRET.
    """
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo electrónico o contraseña incorrectos."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="La cuenta de usuario está desactivada."
        )

    role_name = user.role.name if user.role else "USER"
    token = create_access_token(
        subject=user.id,
        role=role_name,
        company_id=user.company_id
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        full_name=user.full_name,
        email=user.email,
        role=role_name,
        company_id=user.company_id
    )

