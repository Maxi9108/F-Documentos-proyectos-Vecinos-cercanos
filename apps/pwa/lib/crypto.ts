/**
 * Utilidades criptográficas seguras para NeoFaro
 * Utiliza Web Crypto API nativo (compatible con navegadores modernos y Node.js 18+)
 */

const SALT_SISTEMA = 'neofaro_secure_salt_v1_2026_';

/**
 * Genera un hash SHA-256 con salt para una contraseña
 */
export async function hashPassword(password: string): Promise<string> {
  const clean = password.trim();
  if (!clean) return '';

  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(SALT_SISTEMA + clean);
    const cryptoObj = typeof window !== 'undefined' ? window.crypto : globalThis.crypto;
    
    if (cryptoObj?.subtle) {
      const hashBuffer = await cryptoObj.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (err) {
    console.warn('[Crypto] Fallback en hash:', err);
  }

  // Fallback simple si no estuviera disponible subtle
  let hash = 0;
  const salted = SALT_SISTEMA + clean;
  for (let i = 0; i < salted.length; i++) {
    const char = salted.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `legacy_${Math.abs(hash).toString(16)}`;
}

/**
 * Verifica una contraseña candidata contra un hash guardado.
 * Admite migración gradual (si la guardada aún era texto plano).
 */
export async function verifyPassword(
  passwordCandidata: string,
  storedHashOrPlain?: string | null
): Promise<boolean> {
  if (!storedHashOrPlain || !passwordCandidata) return false;

  const candidateTrim = passwordCandidata.trim();
  const storedTrim = storedHashOrPlain.trim();

  // 1. Verificación directa contra texto plano legado (para no bloquear cuentas existentes)
  if (candidateTrim === storedTrim) {
    return true;
  }

  // 2. Verificación criptográfica con hash SHA-256 + salt
  const candidateHash = await hashPassword(candidateTrim);
  return candidateHash === storedTrim;
}
