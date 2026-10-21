import React, { useState, useEffect } from 'react';
import { Shield, Sparkles, Lightbulb, Lock, Cloud, Cpu, RefreshCw } from 'lucide-react';

export interface ProjectFact {
  id: number;
  category: string;
  title: string;
  fact: string;
  icon: 'shield' | 'cloud' | 'lock' | 'cpu';
}

export const PROJECT_SECURITY_FACTS: ProjectFact[] = [
  {
    id: 1,
    category: 'AWS IAM & Identidad',
    title: 'Principio de Menor Privilegio',
    fact: 'En AWS IAM, cada usuario, rol y microservicio opera bajo la política de mínimos privilegios, reduciendo drásticamente la superficie de ataque y previniendo elevación no autorizada.',
    icon: 'shield',
  },
  {
    id: 2,
    category: 'Criptografía & Datos',
    title: 'Cifrado Militar AES-256',
    fact: 'Toda la información sensible del proyecto se cifra en reposo mediante llaves administradas por AWS KMS (AES-256) y en tránsito con TLS 1.3 con secreto perfecto hacia adelante.',
    icon: 'lock',
  },
  {
    id: 3,
    category: 'Monitoreo & Auditoría',
    title: 'Trazabilidad Inmutable con CloudTrail',
    fact: 'Cada llamada a la API y cambio de configuración queda registrado en AWS CloudTrail con hashes criptográficos que impiden cualquier alteración o borrado de bitácoras.',
    icon: 'cloud',
  },
  {
    id: 4,
    category: 'Seguridad Predictiva',
    title: 'Detección Inteligente con GuardDuty',
    fact: 'AWS GuardDuty analiza flujos de red VPC y eventos de identidad mediante machine learning para neutralizar accesos sospechosos o ataques antes de que afecten la infraestructura.',
    icon: 'cpu',
  },
  {
    id: 5,
    category: 'Arquitectura Cloud',
    title: 'Segregación Zero-Trust en VPC',
    fact: 'Nuestras bases de datos residen en subredes privadas sin IP pública. Las conexiones internas exigen autenticación criptográfica en cada salto de red.',
    icon: 'shield',
  },
  {
    id: 6,
    category: 'Autenticación Empresarial',
    title: 'Tokens JWT & OAuth 2.0',
    fact: 'La autenticación con Google y Supabase valida firmas asimétricas RSA/Ed25519 garantizando que ninguna contraseña se transmita o guarde en texto plano.',
    icon: 'lock',
  },
  {
    id: 7,
    category: 'Defensa de Perímetro',
    title: 'Mitigación Activa con AWS WAF & Shield',
    fact: 'El Firewall de Aplicaciones Web (WAF) inspecciona cada petición HTTP en milisegundos, bloqueando inyecciones SQL, bots maliciosos y ataques DDoS volumétricos.',
    icon: 'cloud',
  },
  {
    id: 8,
    category: 'Alta Resiliencia',
    title: 'Disponibilidad Multi-AZ 99.99%',
    fact: 'El despliegue distribuido en múltiples Zonas de Disponibilidad garantiza tolerancia total a fallos de hardware con failover automático e instantáneo.',
    icon: 'cpu',
  },
  {
    id: 9,
    category: 'Control de Acceso RBAC',
    title: 'Matriz de Permisos Granulares',
    fact: 'El sistema valida en tiempo real roles (Administrador, Gerente, Analista, Vendedor) permitiendo auditar acciones críticas y restringir datos confidenciales.',
    icon: 'shield',
  },
  {
    id: 10,
    category: 'Modelos Matemáticos',
    title: 'Motor Probabilístico de Seguridad',
    fact: 'El módulo estadístico del sistema calcula en tiempo real distribuciones normales y probabilidades acumuladas para prever desviaciones operativas y riesgos de inventario.',
    icon: 'cpu',
  },
];

interface ProjectLoadingScreenProps {
  /** Mensaje principal de estado (ej: "Cargando Dashboard...") */
  message?: string;
  /** Si es true, se renderiza integrado en un contenedor (ej: dentro de una tarjeta o página), no a pantalla completa */
  inline?: boolean;
  /** Texto secundario o contexto */
  subtitle?: string;
}

export const ProjectLoadingScreen: React.FC<ProjectLoadingScreenProps> = ({
  message = 'Cargando módulo de seguridad...',
  inline = false,
  subtitle = 'CloudGuard AWS • Plataforma de Seguridad Empresarial',
}) => {
  // Elegir un dato aleatorio inicial
  const [factIndex, setFactIndex] = useState(() =>
    Math.floor(Math.random() * PROJECT_SECURITY_FACTS.length)
  );
  const [fadeAnim, setFadeAnim] = useState(true);

  // Rotar a otro dato aleatorio cada 4.5 segundos con animación de desvanecimiento
  useEffect(() => {
    const timer = setInterval(() => {
      setFadeAnim(false);
      setTimeout(() => {
        setFactIndex((prev) => (prev + 1) % PROJECT_SECURITY_FACTS.length);
        setFadeAnim(true);
      }, 350);
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  const currentFact = PROJECT_SECURITY_FACTS[factIndex];

  const renderIcon = (type: ProjectFact['icon']) => {
    switch (type) {
      case 'lock':
        return <Lock className="w-4 h-4 text-slate-300" />;
      case 'cloud':
        return <Cloud className="w-4 h-4 text-blue-400" />;
      case 'cpu':
        return <Cpu className="w-4 h-4 text-slate-300" />;
      case 'shield':
      default:
        return <Shield className="w-4 h-4 text-slate-200" />;
    }
  };

  const content = (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center text-center p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-400 relative z-10">
      
      {/* ===================================================================== */}
      {/* LOGO & SCANNER CORPORATIVO                                            */}
      {/* ===================================================================== */}
      <div className="relative mb-6 flex items-center justify-center">
        {/* Anillo sutil de contorno neutro */}
        <div className="absolute w-28 h-28 rounded-full border border-slate-700/50 animate-pulse pointer-events-none" />
        
        {/* Escudo central con acabado neutro de alta gama */}
        <div className="relative w-20 h-20 rounded-2xl bg-slate-900 p-[1px] border border-slate-700 shadow-xl">
          <div className="w-full h-full rounded-2xl bg-slate-950 flex items-center justify-center border border-slate-800 relative overflow-hidden">
            {/* Haz de luz de escaneo sutil */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-600/15 to-transparent translate-y-[-100%] animate-[scan_2s_ease-in-out_infinite]" />
            
            <Shield className="w-9 h-9 text-slate-200 animate-pulse" />
            <Sparkles className="w-3.5 h-3.5 text-slate-400 absolute top-2.5 right-2.5" />
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* TÍTULO Y MENSAJE                                                     */}
      {/* ===================================================================== */}
      <div className="space-y-1.5 mb-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-semibold tracking-wide uppercase">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span>{subtitle}</span>
        </div>
        
        <h2 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
          {message}
        </h2>

        {/* Barra de progreso corporativa */}
        <div className="w-48 sm:w-64 h-1.5 bg-slate-800 rounded-full overflow-hidden mx-auto mt-3 border border-slate-700/60 relative">
          <div className="h-full bg-blue-600 rounded-full w-2/3 animate-[indeterminate_1.6s_ease-in-out_infinite]" />
        </div>
      </div>

      {/* ===================================================================== */}
      {/* TARJETA DINÁMICA: DATO SOBRE EL PROYECTO & SEGURIDAD AWS             */}
      {/* ===================================================================== */}
      <div
        className={`w-full mt-2 transition-all duration-300 transform ${
          fadeAnim ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}
      >
        <div className="rounded-2xl border border-slate-800 bg-slate-900/95 shadow-xl p-4 sm:p-5 text-left relative overflow-hidden">
          
          {/* Cabecera del dato */}
          <div className="flex items-center justify-between mb-2.5 pb-2.5 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
                <Lightbulb className="w-4 h-4 text-slate-300" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Información Técnica • {currentFact.category}
                </span>
                <h4 className="text-xs sm:text-sm font-bold text-slate-100 leading-tight">
                  {currentFact.title}
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700 text-[10px] text-slate-400">
              {renderIcon(currentFact.icon)}
              <span className="hidden sm:inline font-mono">Dato #{currentFact.id}</span>
            </div>
          </div>

          {/* Texto explicativo del dato */}
          <p className="text-xs text-slate-300 leading-relaxed font-normal">
            {currentFact.fact}
          </p>

          {/* Pie de rotación */}
          <div className="mt-3 pt-2.5 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-800/80">
            <span className="flex items-center gap-1.5 text-slate-400">
              <RefreshCw className="w-2.5 h-2.5 text-blue-400 animate-spin" />
              Actualizando datos del sistema...
            </span>
            <span className="font-mono text-slate-400 font-medium">
              AWS Security 2026
            </span>
          </div>

        </div>
      </div>

    </div>
  );

  if (inline) {
    return (
      <div className="w-full py-12 flex items-center justify-center relative overflow-hidden">
        {content}
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-4 sm:p-6 overflow-hidden selection:bg-cyan-500 selection:text-white font-sans bg-slate-950">
      {/* Fondo de video empresarial si está disponible */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover scale-105 pointer-events-none opacity-40 transition-transform duration-1000"
      >
        <source src="/videos/login-bg.mp4" type="video/mp4" />
      </video>

      {/* Capas de oscurecimiento e iluminación cinematográfica neutra */}
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-[3px] pointer-events-none" />

      {content}
    </div>
  );
};

export default ProjectLoadingScreen;
