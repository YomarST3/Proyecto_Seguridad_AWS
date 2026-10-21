import React from 'react';

/**
 * Extrae un nombre de usuario formateado y legible a partir de un correo electrónico.
 * Ejemplos:
 *  - "franco.quispe@empresa.com" -> "Franco Quispe"
 *  - "admin@salesia.com" -> "Admin"
 *  - "jorge_diaz@gmail.com" -> "Jorge Diaz"
 *  - "carlos-mendoza@salesia.com" -> "Carlos Mendoza"
 */
export function extractUsernameFromEmail(email?: string): string {
  if (!email || typeof email !== 'string') return 'Usuario';
  const cleanEmail = email.trim();
  if (!cleanEmail.includes('@')) return cleanEmail || 'Usuario';

  const handle = cleanEmail.split('@')[0];
  // Separar por puntos, guiones o guiones bajos
  const parts = handle.split(/[._-]+/).filter(Boolean);
  if (parts.length === 0) return handle;

  return parts
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Obtiene la letra inicial mayúscula a partir del nombre o correo del usuario.
 */
export function getInitialLetter(nameOrEmail?: string): string {
  if (!nameOrEmail || typeof nameOrEmail !== 'string') return 'U';
  const clean = nameOrEmail.trim();
  // Si es un correo, tomar la primera letra del handle
  const target = clean.includes('@') ? clean.split('@')[0] : clean;
  const match = target.match(/[a-zA-Z0-9]/);
  return match ? match[0].toUpperCase() : 'U';
}

/**
 * Paletas armónicas neutras y empresariales para el logo del usuario según su inicial.
 * Colores sobrios tipo AWS/Enterprise (Slate, Charcoal, Navy, Steel Blue, Zinc).
 */
const AVATAR_PALETTES = [
  {
    bg: 'from-slate-700 to-slate-900',
    border: 'border-slate-600',
    glow: 'shadow-sm',
    text: 'text-slate-100',
  },
  {
    bg: 'from-blue-800 to-slate-900',
    border: 'border-blue-700/60',
    glow: 'shadow-sm',
    text: 'text-slate-100',
  },
  {
    bg: 'from-zinc-700 to-zinc-900',
    border: 'border-zinc-600',
    glow: 'shadow-sm',
    text: 'text-zinc-100',
  },
  {
    bg: 'from-slate-800 to-neutral-900',
    border: 'border-slate-700',
    glow: 'shadow-sm',
    text: 'text-slate-200',
  },
  {
    bg: 'from-sky-900 to-slate-950',
    border: 'border-sky-800/60',
    glow: 'shadow-sm',
    text: 'text-sky-100',
  },
  {
    bg: 'from-slate-600 to-slate-800',
    border: 'border-slate-500/50',
    glow: 'shadow-sm',
    text: 'text-white',
  },
  {
    bg: 'from-indigo-900/80 to-slate-950',
    border: 'border-indigo-800/50',
    glow: 'shadow-sm',
    text: 'text-indigo-100',
  },
  {
    bg: 'from-neutral-800 to-slate-900',
    border: 'border-neutral-700',
    glow: 'shadow-sm',
    text: 'text-neutral-100',
  },
];

export function getUserAvatarStyle(identifier?: string) {
  if (!identifier) return AVATAR_PALETTES[0];
  let hash = 0;
  const str = identifier.toLowerCase().trim();
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[index];
}

interface UserAvatarProps {
  nameOrEmail?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showGlow?: boolean;
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  nameOrEmail,
  size = 'md',
  showGlow = true,
  className = '',
}) => {
  const initial = getInitialLetter(nameOrEmail);
  const palette = getUserAvatarStyle(nameOrEmail || initial);

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  }[size];

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-2xl bg-gradient-to-br ${palette.bg} ${palette.text} ${palette.border} border font-bold select-none shrink-0 transition-transform hover:scale-105 ${
        showGlow ? palette.glow : ''
      } ${sizeClasses} ${className}`}
      title={nameOrEmail || 'Usuario'}
    >
      <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] tracking-wider">
        {initial}
      </span>
      {/* Detalle de brillo en la esquina superior */}
      <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-white/40 blur-[0.5px]" />
    </div>
  );
};

export default UserAvatar;
