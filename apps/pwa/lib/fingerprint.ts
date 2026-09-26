/**
 * Generador de Huella Digital (Fingerprint) del Navegador
 * Genera un identificador único y determinista para control anti-spam en el cliente.
 */

// Simple hash FNV-1a para cadenas
function fnv1a(str: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return ('0000000' + (hash >>> 0).toString(16)).slice(-8);
}

/**
 * Obtiene la huella digital del dispositivo/navegador.
 * Si ya fue calculada en esta sesión, se reutiliza desde localStorage/sessionStorage.
 */
export async function getBrowserFingerprint(): Promise<string> {
  if (typeof window === 'undefined') {
    return 'server-side-fp';
  }

  try {
    const cached = localStorage.getItem('vc_device_fingerprint');
    if (cached && cached.length >= 16) {
      return cached;
    }
  } catch {
    // Si localStorage está bloqueado, continúa
  }

  const componentes: string[] = [];

  // 1. Navegador y Sistema Operativo
  componentes.push(navigator.userAgent || '');
  componentes.push(navigator.language || '');
  componentes.push(Intl.DateTimeFormat().resolvedOptions().timeZone || '');

  // 2. Hardware y Pantalla
  componentes.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);
  componentes.push(String(navigator.hardwareConcurrency || 2));
  componentes.push(String((navigator as unknown as { deviceMemory?: number }).deviceMemory || 4));

  // 3. Firma gráfica Canvas
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = "14px 'Arial', sans-serif";
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('VecinosCercanos:Fp🛡️', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('AntiSpam#2026', 4, 17);
      componentes.push(canvas.toDataURL());
    }
  } catch {
    componentes.push('no-canvas');
  }

  // 4. Salto aleatorio persistente si el navegador bloquea todo
  let randomSalt = '';
  try {
    randomSalt = localStorage.getItem('vc_fp_salt') || '';
    if (!randomSalt) {
      randomSalt = Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('vc_fp_salt', randomSalt);
    }
  } catch {
    randomSalt = 'anon-salt';
  }
  componentes.push(randomSalt);

  const rawString = componentes.join('###');

  // Generar hash seguro con Web Crypto API si está disponible, o fallback FNV-1a
  let fingerprint = '';
  try {
    if (window.crypto && window.crypto.subtle) {
      const msgBuffer = new TextEncoder().encode(rawString);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      fingerprint = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
    }
  } catch {
    // Fallback
  }

  if (!fingerprint) {
    const p1 = fnv1a(rawString);
    const p2 = fnv1a(rawString.split('').reverse().join(''));
    const p3 = fnv1a(randomSalt);
    const p4 = fnv1a(navigator.userAgent || 'ua');
    fingerprint = `${p1}${p2}${p3}${p4}`;
  }

  try {
    localStorage.setItem('vc_device_fingerprint', fingerprint);
  } catch {
    // ignorar
  }

  return fingerprint;
}
