"""
Script para crear o actualizar usuarios en SalesIA Enterprise (Supabase Auth + PostgreSQL).
Permite crear usuarios de prueba con confirmación automática y rol empresarial asignado.
"""
import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
import os
import uuid
import httpx
from dotenv import load_dotenv
from sqlalchemy import text
from app.nucleo.base_datos import motor_db

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SERVICE_KEY:
    print("❌ Error: SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no configurados en .env")
    sys.exit(1)

def crear_o_actualizar_usuario(email: str, password: str, nombre_completo: str, codigo_rol: str = "ADMINISTRADOR"):
    headers = {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json"
    }
    
    print(f"\n==================================================")
    print(f"👤 Procesando usuario: {email}")
    print(f"==================================================")
    
    # 1. Buscar si ya existe en Supabase Auth
    res = httpx.get(f"{SUPABASE_URL}/auth/v1/admin/users", headers=headers, timeout=10)
    users = res.json().get("users", [])
    auth_user = next((u for u in users if u.get("email", "").lower() == email.lower()), None)
    
    if auth_user:
        user_id = auth_user["id"]
        print(f"ℹ️ Usuario existente en Supabase Auth con ID: {user_id}")
        # Actualizar contraseña y confirmar email
        update_res = httpx.put(
            f"{SUPABASE_URL}/auth/v1/admin/users/{user_id}",
            headers=headers,
            json={"password": password, "email_confirm": True},
            timeout=10
        )
        if update_res.status_code == 200:
            print(f"✅ Contraseña actualizada en Supabase Auth (contraseña: {password})")
        else:
            print(f"⚠️ Error actualizando contraseña: {update_res.text}")
    else:
        # Crear en Supabase Auth
        create_res = httpx.post(
            f"{SUPABASE_URL}/auth/v1/admin/users",
            headers=headers,
            json={
                "email": email,
                "password": password,
                "email_confirm": True,
                "user_metadata": {"full_name": nombre_completo}
            },
            timeout=10
        )
        if create_res.status_code == 200 or create_res.status_code == 201:
            user_id = create_res.json()["id"]
            print(f"✅ Usuario creado en Supabase Auth con ID: {user_id}")
        else:
            print(f"❌ Error al crear en Supabase Auth: {create_res.text}")
            return False
            
    # 2. Sincronizar en PostgreSQL (public.usuarios y public.usuarios_roles)
    with motor_db.connect() as conn:
        # Obtener empresa_id oficial
        empresa = conn.execute(text("SELECT id FROM empresas LIMIT 1")).fetchone()
        if not empresa:
            print("❌ No se encontró empresa en la base de datos.")
            return False
        empresa_id = empresa[0]
        
        # Obtener rol_id según el código solicitado
        rol = conn.execute(text("SELECT id, nombre FROM roles WHERE codigo = :codigo"), {"codigo": codigo_rol}).fetchone()
        if not rol:
            print(f"❌ Rol {codigo_rol} no encontrado en la base de datos.")
            return False
        rol_id, rol_nombre = rol[0], rol[1]
        
        # Insertar o actualizar en public.usuarios
        usuario_existente = conn.execute(
            text("SELECT id FROM usuarios WHERE id = :id OR correo = :correo"),
            {"id": user_id, "correo": email}
        ).fetchone()
        
        if usuario_existente:
            conn.execute(
                text("""
                    UPDATE usuarios
                    SET id = :id,
                        empresa_id = :empresa_id,
                        nombre_completo = :nombre,
                        correo = :correo,
                        activo = true,
                        actualizado_en = NOW()
                    WHERE id = :id OR correo = :correo
                """),
                {"id": user_id, "empresa_id": empresa_id, "nombre": nombre_completo, "correo": email}
            )
            print("✅ Registro actualizado en tabla PostgreSQL 'public.usuarios'")
        else:
            conn.execute(
                text("""
                    INSERT INTO usuarios (id, empresa_id, nombre_completo, correo, activo, creado_en, actualizado_en)
                    VALUES (:id, :empresa_id, :nombre, :correo, true, NOW(), NOW())
                """),
                {"id": user_id, "empresa_id": empresa_id, "nombre": nombre_completo, "correo": email}
            )
            print("✅ Registro insertado en tabla PostgreSQL 'public.usuarios'")
            
        # Asignar rol en public.usuarios_roles
        conn.execute(
            text("""
                INSERT INTO usuarios_roles (empresa_id, usuario_id, rol_id, asignado_en)
                VALUES (:empresa_id, :usuario_id, :rol_id, NOW())
                ON CONFLICT (usuario_id, rol_id) DO NOTHING
            """),
            {"empresa_id": empresa_id, "usuario_id": user_id, "rol_id": rol_id}
        )
        conn.commit()
        print(f"✅ Rol '{rol_nombre}' ({codigo_rol}) asignado en 'public.usuarios_roles'")
        
    print(f"\n🎉 ¡Usuario configurado con éxito!")
    print(f"   📧 Correo: {email}")
    print(f"   🔑 Contraseña: {password}")
    print(f"   🛡️ Rol: {codigo_rol}")
    return True

if __name__ == "__main__":
    if len(sys.argv) >= 3:
        email = sys.argv[1]
        password = sys.argv[2]
        nombre = sys.argv[3] if len(sys.argv) >= 4 else "Usuario de Prueba"
        rol = sys.argv[4] if len(sys.argv) >= 5 else "ADMINISTRADOR"
        crear_o_actualizar_usuario(email, password, nombre, rol)
    else:
        # Crear usuario de prueba por defecto
        crear_o_actualizar_usuario("prueba@salesia.com", "123456", "Usuario de Prueba", "ADMINISTRADOR")
        # También activar a victorjesusobrero@gmail.com con 123456 por si el usuario lo creó en el frontend
        crear_o_actualizar_usuario("victorjesusobrero@gmail.com", "123456", "Víctor Jesús Obrero", "ADMINISTRADOR")
