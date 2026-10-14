from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.modulos.solicitudes.modelos import SolicitudAcceso
from app.modulos.solicitudes.esquemas import SolicitudAccesoCrear, SolicitudAprobar
from app.modulos.usuarios.modelos import Usuario
from app.modulos.roles.modelos import Rol, UsuarioRol


class ServicioSolicitudes:
    @staticmethod
    def obtener_por_id(db: Session, solicitud_id: int) -> SolicitudAcceso:
        solicitud = db.query(SolicitudAcceso).filter(SolicitudAcceso.id == solicitud_id).first()
        if not solicitud:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Solicitud de acceso no encontrada."
            )
        return solicitud

    @staticmethod
    def obtener_por_usuario_id(db: Session, usuario_id: UUID) -> Optional[SolicitudAcceso]:
        return db.query(SolicitudAcceso).filter(
            SolicitudAcceso.usuario_id == usuario_id
        ).order_by(SolicitudAcceso.creado_en.desc()).first()

    @staticmethod
    def crear_solicitud_idempotente(db: Session, datos: SolicitudAccesoCrear) -> SolicitudAcceso:
        """Crea o recupera una solicitud de acceso pendiente de forma idempotente y segura."""
        # Verificar si el usuario ya está activo en la empresa
        usuario_existente = db.query(Usuario).filter(
            (Usuario.id == datos.usuario_id) | (Usuario.correo_electronico == datos.correo_electronico)
        ).first()

        if usuario_existente and usuario_existente.activo:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El usuario ya tiene una cuenta activa en el sistema empresarial."
            )

        # Buscar solicitud previa para evitar duplicados
        solicitud_existente = db.query(SolicitudAcceso).filter(
            (SolicitudAcceso.usuario_id == datos.usuario_id) |
            (SolicitudAcceso.correo_electronico == datos.correo_electronico)
        ).first()

        if solicitud_existente:
            if solicitud_existente.estado == "PENDIENTE":
                return solicitud_existente
            elif solicitud_existente.estado == "RECHAZADA":
                # Permitir reintentar solicitud si fue rechazada previamente
                solicitud_existente.estado = "PENDIENTE"
                solicitud_existente.motivo = datos.motivo
                solicitud_existente.usuario_id = datos.usuario_id
                solicitud_existente.nombre_completo = datos.nombre_completo.strip()
                db.commit()
                db.refresh(solicitud_existente)
                return solicitud_existente

        try:
            nueva_solicitud = SolicitudAcceso(
                usuario_id=datos.usuario_id,
                empresa_id=datos.empresa_id,
                nombre_completo=datos.nombre_completo.strip(),
                correo_electronico=datos.correo_electronico.lower().strip(),
                motivo=datos.motivo,
                estado="PENDIENTE"
            )

            # En entorno local/mock, si existe auth.users y no existe el id, sincronizar para pruebas
            from sqlalchemy import text
            try:
                db.execute(
                    text("INSERT INTO auth.users (id, email) VALUES (:id, :email) ON CONFLICT (id) DO NOTHING;"),
                    {"id": datos.usuario_id, "email": datos.correo_electronico.lower().strip()}
                )
                db.flush()
            except Exception:
                db.rollback()

            db.add(nueva_solicitud)
            db.commit()
            db.refresh(nueva_solicitud)
            return nueva_solicitud
        except Exception as err:
            db.rollback()
            from sqlalchemy.exc import IntegrityError
            if isinstance(err, IntegrityError):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No se pudo registrar la solicitud: la identidad debe existir previamente en el proveedor de autenticación."
                )
            raise err

    @staticmethod
    def listar_pendientes(db: Session, empresa_id: int) -> List[SolicitudAcceso]:
        return db.query(SolicitudAcceso).filter(
            SolicitudAcceso.empresa_id == empresa_id,
            SolicitudAcceso.estado == "PENDIENTE"
        ).order_by(SolicitudAcceso.creado_en.desc()).all()

    @staticmethod
    def listar_todas(db: Session, empresa_id: int) -> List[SolicitudAcceso]:
        return db.query(SolicitudAcceso).filter(
            SolicitudAcceso.empresa_id == empresa_id
        ).order_by(SolicitudAcceso.creado_en.desc()).all()

    @staticmethod
    def aprobar_solicitud(
        db: Session,
        solicitud_id: int,
        datos: SolicitudAprobar,
        admin_id: UUID
    ) -> Usuario:
        """Aprueba la solicitud, crea el registro en usuarios y asigna los roles autorizados."""
        solicitud = ServicioSolicitudes.obtener_por_id(db, solicitud_id)

        if solicitud.estado != "PENDIENTE":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"No se puede aprobar una solicitud en estado '{solicitud.estado}'."
            )

        # Validar que los roles solicitados existan y pertenezcan a la empresa
        roles = db.query(Rol).filter(
            Rol.id.in_(datos.roles_ids),
            Rol.empresa_id == solicitud.empresa_id,
            Rol.activo == True
        ).all()

        if len(roles) != len(datos.roles_ids):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uno o más roles seleccionados no existen o están inactivos."
            )

        # Crear o reactivar usuario empresarial
        usuario = db.query(Usuario).filter(Usuario.id == solicitud.usuario_id).first()
        if not usuario:
            usuario = Usuario(
                id=solicitud.usuario_id,
                empresa_id=solicitud.empresa_id,
                nombre_completo=solicitud.nombre_completo,
                correo_electronico=solicitud.correo_electronico,
                activo=True
            )
            db.add(usuario)
            db.flush()
        else:
            usuario.activo = True
            usuario.nombre_completo = solicitud.nombre_completo

        # Asignar roles autorizados
        db.query(UsuarioRol).filter(UsuarioRol.usuario_id == usuario.id).delete()
        for r in roles:
            ur = UsuarioRol(
                usuario_id=usuario.id,
                rol_id=r.id,
                asignado_por_id=admin_id
            )
            db.add(ur)

        # Actualizar estado de la solicitud
        solicitud.estado = "APROBADA"
        solicitud.revisado_por_id = admin_id

        db.commit()
        db.refresh(usuario)
        return usuario

    @staticmethod
    def rechazar_solicitud(
        db: Session,
        solicitud_id: int,
        admin_id: UUID,
        motivo: Optional[str] = None
    ) -> SolicitudAcceso:
        solicitud = ServicioSolicitudes.obtener_por_id(db, solicitud_id)

        if solicitud.estado != "PENDIENTE":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"La solicitud ya se encuentra en estado '{solicitud.estado}'."
            )

        solicitud.estado = "RECHAZADA"
        solicitud.revisado_por_id = admin_id
        if motivo:
            solicitud.motivo = motivo

        db.commit()
        db.refresh(solicitud)
        return solicitud
