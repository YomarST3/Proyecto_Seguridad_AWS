import uuid
from typing import List
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session

from app.nucleo.base_datos import obtener_sesion_db
from app.infraestructura.supabase_auth import obtener_usuario_autenticado, requerir_permiso
from app.modulos.usuarios.modelos import Usuario
from app.modulos.empresas.esquemas import EmpresaRespuesta, EmpresaActualizar
from app.modulos.empresas.servicios import ServicioEmpresas
from app.modulos.usuarios.esquemas import (
    UsuarioRespuesta, UsuarioPerfilRespuesta, UsuarioCrear, UsuarioActualizar
)
from app.modulos.usuarios.servicios import ServicioUsuarios
from app.modulos.roles.esquemas import RolRespuesta, PermisoRespuesta, AsignarRolesEsquema
from app.modulos.roles.servicios import ServicioRoles

router = APIRouter(prefix="/administracion", tags=["Administración & Seguridad"])


@router.get("/perfil", response_model=UsuarioPerfilRespuesta)
def obtener_perfil_actual(
    usuario_actual: Usuario = Depends(obtener_usuario_autenticado),
    db: Session = Depends(obtener_sesion_db)
):
    permisos = ServicioUsuarios.obtener_codigos_permisos(db, usuario_actual.id)
    roles_nombres = [ur.rol.nombre for ur in usuario_actual.roles_asignados if ur.rol.activo]

    return UsuarioPerfilRespuesta(
        id=usuario_actual.id,
        empresa_id=usuario_actual.empresa_id,
        nombre_completo=usuario_actual.nombre_completo,
        correo_electronico=usuario_actual.correo_electronico,
        telefono=usuario_actual.telefono,
        activo=usuario_actual.activo,
        ultimo_acceso=usuario_actual.ultimo_acceso,
        creado_en=usuario_actual.creado_en,
        actualizado_en=usuario_actual.actualizado_en,
        roles=roles_nombres,
        permisos=permisos
    )


@router.get("/empresa", response_model=EmpresaRespuesta)
def obtener_datos_empresa(
    usuario_actual: Usuario = Depends(obtener_usuario_autenticado),
    db: Session = Depends(obtener_sesion_db)
):
    return ServicioEmpresas.obtener_por_id(db, usuario_actual.empresa_id)


@router.put("/empresa", response_model=EmpresaRespuesta)
def actualizar_datos_empresa(
    datos: EmpresaActualizar,
    usuario_actual: Usuario = Depends(requerir_permiso("empresas:configurar")),
    db: Session = Depends(obtener_sesion_db)
):
    return ServicioEmpresas.actualizar_empresa(db, usuario_actual.empresa_id, datos)


@router.get("/usuarios", response_model=List[UsuarioRespuesta])
def listar_usuarios(
    usuario_actual: Usuario = Depends(requerir_permiso("usuarios:administrar")),
    db: Session = Depends(obtener_sesion_db)
):
    usuarios = ServicioUsuarios.listar_por_empresa(db, usuario_actual.empresa_id)
    resultado = []
    for u in usuarios:
        roles_nombres = [ur.rol.nombre for ur in u.roles_asignados if ur.rol.activo]
        resultado.append(UsuarioRespuesta(
            id=u.id,
            empresa_id=u.empresa_id,
            nombre_completo=u.nombre_completo,
            correo_electronico=u.correo_electronico,
            telefono=u.telefono,
            activo=u.activo,
            ultimo_acceso=u.ultimo_acceso,
            creado_en=u.creado_en,
            actualizado_en=u.actualizado_en,
            roles=roles_nombres
        ))
    return resultado


@router.post("/usuarios", response_model=UsuarioRespuesta, status_code=status.HTTP_201_CREATED)
def registrar_usuario(
    datos: UsuarioCrear,
    usuario_actual: Usuario = Depends(requerir_permiso("usuarios:administrar")),
    db: Session = Depends(obtener_sesion_db)
):
    # Forzar que el usuario pertenezca a la empresa del administrador que lo registra
    datos.empresa_id = usuario_actual.empresa_id
    u = ServicioUsuarios.crear_usuario(db, datos)
    roles_nombres = [ur.rol.nombre for ur in u.roles_asignados if ur.rol.activo]
    return UsuarioRespuesta(
        id=u.id,
        empresa_id=u.empresa_id,
        nombre_completo=u.nombre_completo,
        correo_electronico=u.correo_electronico,
        telefono=u.telefono,
        activo=u.activo,
        ultimo_acceso=u.ultimo_acceso,
        creado_en=u.creado_en,
        actualizado_en=u.actualizado_en,
        roles=roles_nombres
    )


@router.put("/usuarios/{usuario_id}", response_model=UsuarioRespuesta)
def actualizar_usuario(
    usuario_id: uuid.UUID,
    datos: UsuarioActualizar,
    usuario_actual: Usuario = Depends(requerir_permiso("usuarios:administrar")),
    db: Session = Depends(obtener_sesion_db)
):
    u = ServicioUsuarios.actualizar_usuario(db, usuario_id, datos)
    roles_nombres = [ur.rol.nombre for ur in u.roles_asignados if ur.rol.activo]
    return UsuarioRespuesta(
        id=u.id,
        empresa_id=u.empresa_id,
        nombre_completo=u.nombre_completo,
        correo_electronico=u.correo_electronico,
        telefono=u.telefono,
        activo=u.activo,
        ultimo_acceso=u.ultimo_acceso,
        creado_en=u.creado_en,
        actualizado_en=u.actualizado_en,
        roles=roles_nombres
    )


@router.post("/usuarios/{usuario_id}/roles")
def asignar_roles_a_usuario(
    usuario_id: uuid.UUID,
    datos: AsignarRolesEsquema,
    usuario_actual: Usuario = Depends(requerir_permiso("usuarios:administrar")),
    db: Session = Depends(obtener_sesion_db)
):
    if usuario_id == usuario_actual.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Operación no permitida: Por seguridad corporativa, un usuario no puede modificar sus propios roles."
        )
    ServicioUsuarios.asignar_roles(db, usuario_id, datos.roles_ids, usuario_actual.id)
    return {"mensaje": "Roles asignados correctamente."}


@router.get("/roles", response_model=List[RolRespuesta])
def listar_roles(
    usuario_actual: Usuario = Depends(requerir_permiso("roles:administrar")),
    db: Session = Depends(obtener_sesion_db)
):
    roles = ServicioRoles.listar_roles_por_empresa(db, usuario_actual.empresa_id)
    resultado = []
    for r in roles:
        permisos_resp = [rp.permiso for rp in r.permisos_asociados if rp.permiso]
        resultado.append(RolRespuesta(
            id=r.id,
            empresa_id=r.empresa_id,
            codigo=r.codigo,
            nombre=r.nombre,
            descripcion=r.descripcion,
            es_sistema=r.es_sistema,
            activo=r.activo,
            creado_en=r.creado_en,
            permisos=permisos_resp
        ))
    return resultado


@router.get("/permisos", response_model=List[PermisoRespuesta])
def listar_catalogo_permisos(
    usuario_actual: Usuario = Depends(requerir_permiso("roles:administrar")),
    db: Session = Depends(obtener_sesion_db)
):
    return ServicioRoles.listar_permisos(db)
