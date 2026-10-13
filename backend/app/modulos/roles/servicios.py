from typing import List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.modulos.roles.modelos import Rol, Permiso, RolPermiso
from app.modulos.roles.esquemas import RolCrear


class ServicioRoles:
    @staticmethod
    def listar_permisos(db: Session) -> List[Permiso]:
        return db.query(Permiso).order_by(Permiso.modulo.asc(), Permiso.codigo.asc()).all()

    @staticmethod
    def listar_roles_por_empresa(db: Session, empresa_id: int) -> List[Rol]:
        return db.query(Rol).filter(
            Rol.empresa_id == empresa_id,
            Rol.activo == True
        ).order_by(Rol.nombre.asc()).all()

    @staticmethod
    def crear_rol(db: Session, empresa_id: int, datos: RolCrear) -> Rol:
        codigo_norm = datos.codigo.upper().strip()
        existente = db.query(Rol).filter(
            Rol.empresa_id == empresa_id,
            Rol.codigo == codigo_norm
        ).first()

        if existente:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Ya existe un rol con el código '{codigo_norm}' en esta empresa."
            )

        nuevo_rol = Rol(
            empresa_id=empresa_id,
            codigo=codigo_norm,
            nombre=datos.nombre.strip(),
            descripcion=datos.descripcion,
            es_sistema=False,
            activo=True
        )
        db.add(nuevo_rol)
        db.flush()

        if datos.permisos_ids:
            for pid in datos.permisos_ids:
                rp = RolPermiso(rol_id=nuevo_rol.id, permiso_id=pid)
                db.add(rp)

        db.commit()
        db.refresh(nuevo_rol)
        return nuevo_rol

    @staticmethod
    def inicializar_roles_predeterminados(db: Session, empresa_id: int) -> None:
        """Crea los 5 roles empresariales requeridos por el plan maestro si no existen."""
        roles_base = [
            ("ADMINISTRADOR", "Administrador General", "Acceso total y configuración del sistema", True),
            ("GERENTE", "Gerente Comercial", "Supervisión comercial y reportes ejecutivos", True),
            ("VENDEDOR", "Ejecutivo Comercial", "Atención a clientes, pedidos y ventas", True),
            ("ANALISTA", "Analista de Inteligencia Comercial", "Acceso a analítica, probabilidades e insights", True),
            ("ALMACEN", "Encargado de Logística y Almacén", "Control de stock físico y kardex", True)
        ]

        # Obtener todos los permisos para asignar al administrador
        todos_los_permisos = db.query(Permiso).all()

        for codigo, nombre, desc, es_sis in roles_base:
            rol = db.query(Rol).filter(
                Rol.empresa_id == empresa_id,
                Rol.codigo == codigo
            ).first()

            if not rol:
                rol = Rol(
                    empresa_id=empresa_id,
                    codigo=codigo,
                    nombre=nombre,
                    descripcion=desc,
                    es_sistema=es_sis,
                    activo=True
                )
                db.add(rol)
                db.flush()

                # El rol ADMINISTRADOR recibe todos los permisos
                if codigo == "ADMINISTRADOR":
                    for p in todos_los_permisos:
                        db.add(RolPermiso(rol_id=rol.id, permiso_id=p.id))

        db.commit()
