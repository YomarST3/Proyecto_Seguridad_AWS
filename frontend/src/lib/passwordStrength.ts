/**
 * Utilidades de Evaluación y Generación de Contraseñas Seguras
 * Validación de 5 criterios: longitud >= 8, mayúsculas, minúsculas, números y símbolos.
 */

export interface PasswordChecklist {
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
}

export interface PasswordStrengthResult {
  score: number; // 0 a 100
  label: 'Muy débil' | 'Débil' | 'Moderada' | 'Segura' | 'Muy segura';
  color: string;
  badgeBg: string;
  barColor: string;
  checks: PasswordChecklist;
  isValid: boolean;
}

export function evaluatePassword(password: string): PasswordStrengthResult {
  const p = password || '';

  const checks: PasswordChecklist = {
    hasMinLength: p.length >= 8,
    hasUppercase: /[A-Z]/.test(p),
    hasLowercase: /[a-z]/.test(p),
    hasNumber: /[0-9]/.test(p),
    hasSymbol: /[^A-Za-z0-9]/.test(p),
  };

  let points = 0;
  if (checks.hasMinLength) points += 20;
  if (p.length >= 12) points += 10;
  if (checks.hasUppercase) points += 20;
  if (checks.hasLowercase) points += 15;
  if (checks.hasNumber) points += 20;
  if (checks.hasSymbol) points += 25;

  const score = Math.min(100, points);

  let label: PasswordStrengthResult['label'] = 'Muy débil';
  let color = 'text-rose-400';
  let badgeBg = 'bg-rose-500/15 border-rose-500/30';
  let barColor = 'bg-rose-500';

  if (score >= 90) {
    label = 'Muy segura';
    color = 'text-emerald-400';
    badgeBg = 'bg-emerald-500/15 border-emerald-500/30';
    barColor = 'bg-gradient-to-r from-emerald-500 to-teal-400';
  } else if (score >= 70) {
    label = 'Segura';
    color = 'text-cyan-400';
    badgeBg = 'bg-cyan-500/15 border-cyan-500/30';
    barColor = 'bg-gradient-to-r from-cyan-500 to-blue-500';
  } else if (score >= 50) {
    label = 'Moderada';
    color = 'text-amber-400';
    badgeBg = 'bg-amber-500/15 border-amber-500/30';
    barColor = 'bg-amber-500';
  } else if (score >= 30) {
    label = 'Débil';
    color = 'text-orange-400';
    badgeBg = 'bg-orange-500/15 border-orange-500/30';
    barColor = 'bg-orange-500';
  }

  // Se considera válida si cumple los 5 requisitos esenciales
  const isValid =
    checks.hasMinLength &&
    checks.hasUppercase &&
    checks.hasLowercase &&
    checks.hasNumber &&
    checks.hasSymbol;

  return {
    score,
    label,
    color,
    badgeBg,
    barColor,
    checks,
    isValid,
  };
}

/**
 * Genera una contraseña criptográficamente segura y aleatoria
 * que cumple estrictamente todos los requisitos de seguridad.
 */
export function generateSecurePassword(length = 14): string {
  const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowers = 'abcdefghijkmnopqrstuvwxyz';
  const numbers = '23456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const allChars = uppers + lowers + numbers + symbols;

  const cryptoObj = window.crypto || (window as any).msCrypto;
  const getRandomChar = (charset: string) => {
    if (cryptoObj) {
      const arr = new Uint32Array(1);
      cryptoObj.getRandomValues(arr);
      return charset[arr[0] % charset.length];
    }
    return charset[Math.floor(Math.random() * charset.length)];
  };

  // Asegurar al menos uno de cada tipo
  const required = [
    getRandomChar(uppers),
    getRandomChar(lowers),
    getRandomChar(numbers),
    getRandomChar(symbols),
  ];

  // Rellenar el resto de caracteres
  const remainingCount = Math.max(0, length - required.length);
  const remaining: string[] = [];
  for (let i = 0; i < remainingCount; i++) {
    remaining.push(getRandomChar(allChars));
  }

  // Mezclar aleatoriamente (Fisher-Yates)
  const combined = [...required, ...remaining];
  for (let i = combined.length - 1; i > 0; i--) {
    let j = 0;
    if (cryptoObj) {
      const arr = new Uint32Array(1);
      cryptoObj.getRandomValues(arr);
      j = arr[0] % (i + 1);
    } else {
      j = Math.floor(Math.random() * (i + 1));
    }
    const temp = combined[i];
    combined[i] = combined[j];
    combined[j] = temp;
  }

  return combined.join('');
}
