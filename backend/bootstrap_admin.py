"""
Procedimiento de Inicialización Seguro para el Primer Administrador de SalesIA Enterprise.
Este script se ejecuta exclusivamente en el servidor mediante CLI autorizado.
No permite ejecuciones no autorizadas si ya existe un Administrador activo.
"""

import sys
import os
import uuid
from typing import Optional

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.nucleo.base_datos import SesionLocal
from app.modulos.empresas.modelos import Empresa
from app.modulos.roles.modelos import Rol, UsuarioRol
from app.modulos.usuarios.modelos import Usuario


def crear_primer_administrador(
    correo: str = "admin@salesia.com",
    nombre: str = "Administrador General",
    usuario_uuid: Optional[str] = None
) -> None:
    db = SesionLocal()
    try:
        print("[INFO] Verificando existencia de administradores activos...")
        
        # 1. Verificar si ya existe un Administrador en la empresa
        admin_rol = db.query(Rol).filter(Rol.codigo == "ADMINISTRADOR").first()
        if not admin_rol:
            print("[ERROR] El rol ADMINISTRADOR no existe en la base de datos. Ejecute primero el script DDL de Etapa 01.")
            return

        admin_existente = db.query(UsuarioRol).filter(
            UsuarioRol.rol_id == admin_rol.id
        ).first()

        if admin_existente:
            print(f"[ALERTA] Ya existe un Administrador registrado en el sistema. Operacion de bootstrap omitida por seguridad.")
            return

        # 2. Obtener la empresa principal
        empresa = db.query(Empresa).first()
        if not empresa:
            print("[INFO] Creando empresa principal por defecto...")
            empresa = Empresa(
                nombre="SalesIA Tech Solutions S.A.C.",
                identificador_fiscal="20608912345",
                direccion="Av. República de Panamá 3505, San Isidro, Lima",
                moneda="USD",
                tasa_impuesto=0.1800,
                activo=True
            )
            db.add(empresa)
            db.flush()

        # 3. Determinar UUID del usuario (vinculado a auth.users en Supabase)
        admin_id = uuid.UUID(usuario_uuid) if usuario_uuid else uuid.uuid4()

        # 4. Crear registro en auth.users si no existe (para entorno local/PostgreSQL)
        try:
            from sqlalchemy import text
            db.execute(
                text("INSERT INTO auth.users (id, email) VALUES (:id, :email) ON CONFLICT (id) DO NOTHING;"),
                {"id": admin_id, "email": correo.lower().strip()}
            )
            db.flush()
        except Exception:
            pass  # En Supabase gestionado por GoTrue ya existe

        # 5. Crear usuario empresarial
        nuevo_admin = Usuario(
            id=admin_id,
            empresa_id=empresa.id,
            nombre_completo=nombre.strip(),
            correo_electronico=correo.lower().strip(),
            activo=True
        )
        db.add(nuevo_admin)
        db.flush()

        # 6. Asignar rol ADMINISTRADOR
        ur = UsuarioRol(
            usuario_id=nuevo_admin.id,
            rol_id=admin_rol.id
        )
        db.add(ur)

        db.commit()
        print(f"[EXITO] Primer Administrador inicializado correctamente:")
        print(f"        - UUID       : {admin_id}")
        print(f"        - Nombre     : {nombre}")
        print(f"        - Correo     : {correo}")
        print(f"        - Rol        : ADMINISTRADOR")
        print(f"        - Empresa    : {empresa.nombre} (ID: {empresa.id})")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] No se pudo inicializar el primer administrador: {str(e)}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    email = sys.argv[1] if len(sys.argv) > 1 else "admin@salesia.com"
    name = sys.argv[2] if len(sys.argv) > 2 else "Administrador General"
    uid = sys.argv[3] if len(sys.argv) > 3 else "a0000000-0000-0000-0000-000000000001"
    crear_primer_administrador(correo=email, nombre=name, usuario_uuid=uid)
