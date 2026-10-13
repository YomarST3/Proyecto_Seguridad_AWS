from typing import List, Set
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status

from app.modulos.usuarios.modelos import Usuario
from app.modulos.roles.modelos import Rol, UsuarioRol, RolPermiso, Permiso
from app.modulos.usuarios.esquemas import UsuarioCrear, UsuarioActualizar


class ServicioUsuarios:
    @staticmethod
    def obtener_por_id(db: Session, usuario_id: UUID) -> Usuario:
        usr = db.query(Usuario).filter(Usuario.id == usuario_id).first()
        if not usr:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado."
            )
        return usr

    @staticmethod
    def listar_por_empresa(db: Session, empresa_id: int) -> List[Usuario]:
        return db.query(Usuario).filter(Usuario.empresa_id == empresa_id).all()

    @staticmethod
    def obtener_codigos_permisos(db: Session, usuario_id: UUID) -> List[str]:
        """Extrae el conjunto consolidado de códigos de permisos activos del usuario."""
        permisos = db.query(Permiso.codigo).join(
            RolPermiso, RolPermiso.permiso_id == Permiso.id
        ).join(
            Rol, Rol.id == RolPermiso.rol_id
        ).join(
            UsuarioRol, UsuarioRol.rol_id == Rol.id
        ).filter(
            UsuarioRol.usuario_id == usuario_id,
            Rol.activo == True
        ).distinct().all()

        return [p[0] for p in permisos]

    @staticmethod
    def crear_usuario(db: Session, datos: UsuarioCrear) -> Usuario:
        existente = db.query(Usuario).filter(
            Usuario.correo_electronico == datos.correo_electronico
        ).first()

        if existente:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"El correo '{datos.correo_electronico}' ya está registrado en el sistema."
            )

        nuevo_usr = Usuario(
            id=datos.id,
            empresa_id=datos.empresa_id,
            nombre_completo=datos.nombre_completo.strip(),
            correo_electronico=datos.correo_electronico.lower().strip(),
            telefono=datos.telefono,
            activo=True
        )
        db.add(nuevo_usr)
        db.flush()

        if datos.roles_ids:
            for rid in datos.roles_ids:
                ur = UsuarioRol(usuario_id=nuevo_usr.id, rol_id=rid)
                db.add(ur)

        db.commit()
        db.refresh(nuevo_usr)
        return nuevo_usr

    @staticmethod
    def asignar_roles(db: Session, usuario_id: UUID, roles_ids: List[int], asignado_por_id: UUID) -> None:
        usr = ServicioUsuarios.obtener_por_id(db, usuario_id)

        # Eliminar asignaciones actuales
        db.query(UsuarioRol).filter(UsuarioRol.usuario_id == usr.id).delete()

        for rid in roles_ids:
            # Validar que el rol pertenezca a la misma empresa
            rol = db.query(Rol).filter(Rol.id == rid, Rol.empresa_id == usr.empresa_id).first()
            if rol:
                ur = UsuarioRol(
                    usuario_id=usr.id,
                    rol_id=rol.id,
                    asignado_por_id=asignado_por_id
                )
                db.add(ur)

        db.commit()

    @staticmethod
    def validar_desactivacion_segura(db: Session, usuario: Usuario) -> None:
        """Impide desactivar o eliminar al último administrador activo de la empresa."""
        # Verificar si el usuario tiene el rol de ADMINISTRADOR
        es_admin = db.query(UsuarioRol).join(
            Rol, Rol.id == UsuarioRol.rol_id
        ).filter(
            UsuarioRol.usuario_id == usuario.id,
            Rol.codigo == "ADMINISTRADOR"
        ).first()

        if es_admin:
            # Contar cuántos administradores activos quedan en la empresa
            total_admins_activos = db.query(func.count(Usuario.id)).join(
                UsuarioRol, UsuarioRol.usuario_id == Usuario.id
            ).join(
                Rol, Rol.id == UsuarioRol.rol_id
            ).filter(
                Usuario.empresa_id == usuario.empresa_id,
                Usuario.activo == True,
                Rol.codigo == "ADMINISTRADOR"
            ).scalar() or 0

            if total_admins_activos <= 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Operación denegada: No es posible desactivar al último Administrador activo de la empresa."
                )

    @staticmethod
    def actualizar_usuario(db: Session, usuario_id: UUID, datos: UsuarioActualizar) -> Usuario:
        usr = ServicioUsuarios.obtener_por_id(db, usuario_id)

        # Si se intenta desactivar el usuario, verificar regla de último administrador
        if datos.activo is False and usr.activo is True:
            ServicioUsuarios.validar_desactivacion_segura(db, usr)

        payload = datos.model_dump(exclude_unset=True)
        for campo, valor in payload.items():
            setattr(usr, campo, valor)

        db.commit()
        db.refresh(usr)
        return usr
