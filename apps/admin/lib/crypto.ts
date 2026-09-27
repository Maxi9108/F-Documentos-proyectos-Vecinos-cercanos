/**
 * Utilidades criptográficas seguras para NeoFaro Admin
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
 */
export async function verifyPassword(
  passwordCandidata: string,
  storedHashOrPlain?: string | null
): Promise<boolean> {
  if (!storedHashOrPlain || !passwordCandidata) return false;

  const candidateTrim = passwordCandidata.trim();
  const storedTrim = storedHashOrPlain.trim();

  if (candidateTrim === storedTrim) {
    return true;
  }

  const candidateHash = await hashPassword(candidateTrim);
  return candidateHash === storedTrim;
}
