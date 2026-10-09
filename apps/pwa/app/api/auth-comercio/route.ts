import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { verifyPassword } from '@/lib/crypto';

// Limitador de intentos fallidos por IP e identificador (Anti Brute-Force)
interface RateLimitEntry {
  intentosFallidos: number;
  bloqueadoHasta: number;
}
const rateLimits = new Map<string, RateLimitEntry>();
const MAX_INTENTOS_FALLIDOS = 5;
const TIEMPO_BLOQUEO_MS = 15 * 60 * 1000; // 15 minutos de bloqueo tras 5 intentos erróneos

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { comercioId, email, password } = body;

    if (!password || (!comercioId && !email)) {
      return NextResponse.json(
        { ok: false, error: 'Faltan parámetros de autenticación requeridos (contraseña y correo o ID de comercio).' },
        { status: 400 }
      );
    }

    // 1. Identificación del cliente para protección de fuerza bruta
    const xForwardedFor = req.headers.get('x-forwarded-for');
    const xRealIp = req.headers.get('x-real-ip');
    const cfConnectingIp = req.headers.get('cf-connecting-ip');
    const clientIp = cfConnectingIp || (xForwardedFor ? xForwardedFor.split(',')[0].trim() : xRealIp) || '127.0.0.1';
    
    const targetIdent = (email && String(email).trim().toLowerCase()) || (comercioId && String(comercioId).trim()) || 'global';
    const rateLimitKey = `${clientIp}:${targetIdent}`;

    const ahora = Date.now();
    const estadoLimit = rateLimits.get(rateLimitKey);

    if (estadoLimit && estadoLimit.bloqueadoHasta > ahora) {
      const minutosRestantes = Math.ceil((estadoLimit.bloqueadoHasta - ahora) / (60 * 1000));
      return NextResponse.json(
        {
          ok: false,
          error: `Demasiados intentos fallidos. Por seguridad de tu comercio, espera ${minutosRestantes} minutos antes de volver a intentar.`,
        },
        { status: 429 }
      );
    }

    // Limpieza preventiva de rateLimits para evitar consumo de memoria
    if (rateLimits.size > 500) {
      for (const [k, v] of rateLimits.entries()) {
        if (v.bloqueadoHasta < ahora) {
          rateLimits.delete(k);
        }
      }
    }

    let comercioEncontrado: any = null;

    // 2. Consulta en base de datos si Supabase está activo
    if (isSupabaseConfigured) {
      if (comercioId) {
        const { data, error } = await supabase
          .from('comercios')
          .select('*')
          .eq('id', comercioId)
          .maybeSingle();
        if (!error && data) {
          comercioEncontrado = data;
        }
      } else if (email) {
        const cleanMail = String(email).trim().toLowerCase();
        const { data, error } = await supabase
          .from('comercios')
          .select('*')
          .or(`email_comercio.ilike.${cleanMail},email.ilike.${cleanMail}`)
          .limit(1);
        if (!error && data && data.length > 0) {
          comercioEncontrado = data[0];
        }
      }
    }


    // 3. Fallback controlado EXCLUSIVAMENTE cuando Supabase NO está configurado (modo mock/desarrollo local)
    if (!comercioEncontrado && !isSupabaseConfigured && body.comercioFallback) {
      const fb = body.comercioFallback;
      const cleanMail = (email || '').trim().toLowerCase();
      const fbMailComercio = (fb.email_comercio || '').trim().toLowerCase();
      const fbMail = (fb.email || '').trim().toLowerCase();
      if (
        (comercioId && fb.id === comercioId) ||
        (cleanMail && (fbMailComercio === cleanMail || fbMail === cleanMail))
      ) {
        comercioEncontrado = fb;
      }
    }

    if (!comercioEncontrado) {
      return NextResponse.json(
        { ok: false, error: 'No se encontró ningún comercio con los datos proporcionados.' },
        { status: 404 }
      );
    }

    // 4. Verificación de contraseña
    // Si la base de datos está configurada, la contraseña DEBE provenir de la base de datos (nunca del cliente)
    const storedPass = isSupabaseConfigured
      ? comercioEncontrado.password_comercio
      : comercioEncontrado.password_comercio || body.clientStoredHash;

    if (!storedPass) {
      return NextResponse.json(
        {
          ok: false,
          requiereDefinirPassword: true,
          error: 'Este comercio aún no tiene una contraseña configurada. Por favor establece tu contraseña de acceso.',
        },
        { status: 403 }
      );
    }

    const esValida = await verifyPassword(password, storedPass);

    if (!esValida) {
      // Registrar intento fallido para prevenir fuerza bruta
      const intentos = (estadoLimit?.intentosFallidos || 0) + 1;
      const bloquear = intentos >= MAX_INTENTOS_FALLIDOS;
      rateLimits.set(rateLimitKey, {
        intentosFallidos: intentos,
        bloqueadoHasta: bloquear ? ahora + TIEMPO_BLOQUEO_MS : 0,
      });

      const intentosRestantes = Math.max(0, MAX_INTENTOS_FALLIDOS - intentos);
      const avisoIntentos =
        intentosRestantes > 0
          ? ` (Te quedan ${intentosRestantes} intentos antes del bloqueo temporal)`
          : ' (Cuenta temporalmente bloqueada por 15 minutos)';

      return NextResponse.json(
        {
          ok: false,
          error: `Contraseña incorrecta. Por favor ingresa la contraseña configurada para este comercio.${avisoIntentos}`,
        },
        { status: 401 }
      );
    }

    // 5. Éxito: limpiar contador de intentos fallidos
    rateLimits.delete(rateLimitKey);

    // 6. Retornar objeto comercio sanitizado (NUNCA incluir hashes ni contraseñas)
    const comercioSeguro = { ...comercioEncontrado };
    delete comercioSeguro.password_comercio;
    delete comercioSeguro.password;
    delete comercioSeguro.password_hash;

    return NextResponse.json({
      ok: true,
      comercio: comercioSeguro,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error interno de autenticación';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
