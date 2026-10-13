-- ============================================================================
-- SALESIA ENTERPRISE — ETAPA 01: MÓDULO ADMINISTRATIVO
-- ============================================================================

-- 1. Habilitar extensión UUID si no está activa
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Compatibilidad para auth.users (en Supabase existe de forma nativa)
CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABLA: empresas
CREATE TABLE IF NOT EXISTS public.empresas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    identificador_fiscal VARCHAR(50) NOT NULL UNIQUE, -- RUC, NIF o CIF
    direccion VARCHAR(300),
    telefono VARCHAR(50),
    correo_electronico VARCHAR(100),
    moneda VARCHAR(10) DEFAULT 'USD' NOT NULL,
    tasa_impuesto NUMERIC(5, 4) DEFAULT 0.1800 NOT NULL, -- 18% IGV / IVA
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_empresas_tasa_impuesto CHECK (tasa_impuesto >= 0 AND tasa_impuesto <= 1)
);

CREATE INDEX IF NOT EXISTS idx_empresas_identificador_fiscal ON public.empresas (identificador_fiscal);

-- 3. TABLA: usuarios (vinculada a auth.users de Supabase)
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    empresa_id INT NOT NULL REFERENCES public.empresas(id) ON DELETE RESTRICT,
    nombre_completo VARCHAR(150) NOT NULL,
    correo_electronico VARCHAR(120) NOT NULL UNIQUE,
    telefono VARCHAR(50),
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    ultimo_acceso TIMESTAMP WITH TIME ZONE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_usuarios_empresa ON public.usuarios (empresa_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_correo ON public.usuarios (correo_electronico);

-- 4. TABLA: roles
CREATE TABLE IF NOT EXISTS public.roles (
    id SERIAL PRIMARY KEY,
    empresa_id INT NOT NULL REFERENCES public.empresas(id) ON DELETE RESTRICT,
    codigo VARCHAR(50) NOT NULL, -- ADMINISTRADOR, GERENTE, VENDEDOR, ANALISTA, ALMACEN
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255),
    es_sistema BOOLEAN DEFAULT FALSE NOT NULL,
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_roles_empresa_codigo UNIQUE (empresa_id, codigo)
);

CREATE INDEX IF NOT EXISTS idx_roles_empresa ON public.roles (empresa_id);

-- 5. TABLA: permisos
CREATE TABLE IF NOT EXISTS public.permisos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(100) NOT NULL UNIQUE, -- e.g. 'clientes:leer', 'ventas:crear'
    modulo VARCHAR(50) NOT NULL,         -- e.g. 'clientes', 'ventas'
    nombre VARCHAR(150) NOT NULL,
    descripcion VARCHAR(255),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_permisos_modulo ON public.permisos (modulo);

-- 6. TABLA INTERMEDIA: usuarios_roles
CREATE TABLE IF NOT EXISTS public.usuarios_roles (
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    rol_id INT NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT,
    asignado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    asignado_por_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    PRIMARY KEY (usuario_id, rol_id)
);

CREATE INDEX IF NOT EXISTS idx_usuarios_roles_usuario ON public.usuarios_roles (usuario_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_roles_rol ON public.usuarios_roles (rol_id);

-- 7. TABLA INTERMEDIA: roles_permisos
CREATE TABLE IF NOT EXISTS public.roles_permisos (
    rol_id INT NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    permiso_id INT NOT NULL REFERENCES public.permisos(id) ON DELETE CASCADE,
    asignado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY (rol_id, permiso_id)
);

CREATE INDEX IF NOT EXISTS idx_roles_permisos_rol ON public.roles_permisos (rol_id);
CREATE INDEX IF NOT EXISTS idx_roles_permisos_permiso ON public.roles_permisos (permiso_id);

-- 8. TRIGGER: Actualización automática de actualizado_en
CREATE OR REPLACE FUNCTION public.actualizar_marca_tiempo()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_empresas_actualizado_en ON public.empresas;
CREATE TRIGGER trg_empresas_actualizado_en
    BEFORE UPDATE ON public.empresas
    FOR EACH ROW EXECUTE FUNCTION public.actualizar_marca_tiempo();

DROP TRIGGER IF EXISTS trg_usuarios_actualizado_en ON public.usuarios;
CREATE TRIGGER trg_usuarios_actualizado_en
    BEFORE UPDATE ON public.usuarios
    FOR EACH ROW EXECUTE FUNCTION public.actualizar_marca_tiempo();

-- ============================================================================
-- POBLACIÓN INICIAL DE PERMISOS BÁSICOS (CATÁLOGO REUTILIZABLE)
-- ============================================================================

INSERT INTO public.permisos (codigo, modulo, nombre, descripcion) VALUES
('empresas:configurar', 'empresas', 'Configurar Empresa', 'Permiso para modificar datos institucionales e impuestos'),
('usuarios:administrar', 'usuarios', 'Administrar Usuarios', 'Permiso para crear y gestionar usuarios y asignaciones'),
('roles:administrar', 'roles', 'Administrar Roles', 'Permiso para crear y modificar roles y sus permisos'),
('clientes:leer', 'clientes', 'Consultar Clientes', 'Permiso para ver listado y fichas de clientes'),
('clientes:escribir', 'clientes', 'Registrar Clientes', 'Permiso para registrar y editar clientes'),
('productos:leer', 'productos', 'Consultar Catálogo', 'Permiso para ver productos, precios y márgenes'),
('productos:administrar', 'productos', 'Gestionar Catálogo', 'Permiso para crear y editar productos y categorías'),
('inventario:leer', 'inventario', 'Consultar Existencias', 'Permiso para ver stock y alertas mínimas'),
('inventario:ajustar', 'inventario', 'Ajustar Inventario', 'Permiso para registrar entradas, salidas y ajustes'),
('pedidos:crear', 'pedidos', 'Crear Pedidos', 'Permiso para registrar cotizaciones y pedidos'),
('pedidos:confirmar', 'pedidos', 'Confirmar Pedidos', 'Permiso para confirmar pedidos y reservar existencias'),
('ventas:crear', 'ventas', 'Emitir Ventas', 'Permiso para registrar ventas directas o desde pedidos'),
('ventas:anular', 'ventas', 'Anular Ventas', 'Permiso para autorizar la anulación de ventas'),
('pagos:registrar', 'pagos', 'Registrar Cobros', 'Permiso para registrar pagos y amortizaciones'),
('personal:administrar', 'personal', 'Administrar Colaboradores', 'Permiso para gestionar metas y comisiones de vendedores'),
('analytics:ver', 'analytics', 'Ver Analytics', 'Permiso para consultar dashboards de métricas estadísticas'),
('probabilidad:calcular', 'probabilidades', 'Calcular Probabilidades', 'Permiso para inferencia probabilística y Teorema de Bayes'),
('insights:ver', 'insights', 'Ver Insights', 'Permiso para visualizar alertas e insights automáticos'),
('reportes:exportar', 'reportes', 'Exportar Reportes', 'Permiso para descargar reportes en formatos CSV y PDF'),
('auditoria:consultar', 'auditoria', 'Ver Auditoría', 'Permiso para consultar bitácoras de operaciones sensibles')
ON CONFLICT (codigo) DO NOTHING;