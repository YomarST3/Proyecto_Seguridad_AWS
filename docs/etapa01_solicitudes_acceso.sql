-- ============================================================================
-- SALESIA ENTERPRISE — TABLA: solicitudes_acceso (Compatibilidad Supabase)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.solicitudes_acceso (
    id SERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    empresa_id INT NOT NULL REFERENCES public.empresas(id) ON DELETE RESTRICT,
    nombre_completo VARCHAR(150) NOT NULL,
    correo_electronico VARCHAR(120) NOT NULL,
    motivo VARCHAR(255),
    estado VARCHAR(30) DEFAULT 'PENDIENTE' NOT NULL, -- PENDIENTE, APROBADA, RECHAZADA
    revisado_por_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_solicitud_estado CHECK (estado IN ('PENDIENTE', 'APROBADA', 'RECHAZADA'))
);

CREATE INDEX IF NOT EXISTS idx_solicitudes_acceso_estado ON public.solicitudes_acceso (estado);
CREATE INDEX IF NOT EXISTS idx_solicitudes_acceso_correo ON public.solicitudes_acceso (correo_electronico);
CREATE INDEX IF NOT EXISTS idx_solicitudes_acceso_usuario ON public.solicitudes_acceso (usuario_id);

-- Trigger para actualización automática de actualizado_en
DROP TRIGGER IF EXISTS trg_solicitudes_acceso_actualizado_en ON public.solicitudes_acceso;
CREATE TRIGGER trg_solicitudes_acceso_actualizado_en
    BEFORE UPDATE ON public.solicitudes_acceso
    FOR EACH ROW EXECUTE FUNCTION public.actualizar_marca_tiempo();
