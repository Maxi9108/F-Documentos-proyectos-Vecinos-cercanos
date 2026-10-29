import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient, isSupabaseConfigured } from '@/lib/supabase';
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
      const sb = getSupabaseAdminClient();

      if (comercioId) {
        const { data, error } = await sb
          .from('comercios')
          .select('*')
          .eq('id', comercioId)
          .maybeSingle();
        if (!error && data) {
          comercioEncontrado = data;
        }

        // Buscar también en solicitudes_modificacion para asegurar obtención de password y metadatos
        try {
          const { data: solData } = await sb
            .from('solicitudes_modificacion')
            .select('*')
            .eq('comercio_id', comercioId)
            .maybeSingle();

          if (solData?.cambios) {
            comercioEncontrado = {
              ...(comercioEncontrado || {}),
              ...solData.cambios,
              id: comercioId,
              nombre: comercioEncontrado?.nombre || solData.cambios.nombre || solData.comercio_nombre,
            };
          }
        } catch (_) {}
      } else if (email) {
        const cleanMail = String(email).trim().toLowerCase();

        // A. Buscar en solicitudes_modificacion donde se almacena el email y credenciales
        try {
          const { data: sols } = await sb
            .from('solicitudes_modificacion')
            .select('*')
            .limit(150);

          const solMatch = sols?.find((s) => {
            const m1 = (s.cambios?.email || '').trim().toLowerCase();
            const m2 = (s.cambios?.email_comercio || '').trim().toLowerCase();
            return m1 === cleanMail || m2 === cleanMail;
          });

          if (solMatch?.cambios) {
            const targetId = solMatch.comercio_id || solMatch.id;
            const { data: cData } = await sb
              .from('comercios')
              .select('*')
              .eq('id', targetId)
              .maybeSingle();

            comercioEncontrado = {
              ...(cData || {}),
              ...solMatch.cambios,
              id: targetId,
              nombre: cData?.nombre || solMatch.cambios.nombre || solMatch.comercio_nombre,
            };
          }
        } catch (_) {}

        // B. Si aún no se encontró, consultar directamente en comercios
        if (!comercioEncontrado) {
          try {
            const { data } = await sb
              .from('comercios')
              .select('*')
              .or(`email_comercio.ilike.${cleanMail},email.ilike.${cleanMail}`)
              .limit(1);
            if (data && data.length > 0) {
              comercioEncontrado = data[0];
            }
          } catch (_) {}
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
    const storedPass = comercioEncontrado.password_comercio || comercioEncontrado.password || body.clientStoredHash;

    if (!storedPass) {
      return NextResponse.json(
        {
          ok: false,
          error: 'No se encontró la contraseña de este comercio. Por favor ingresa la clave con la que registraste tu local.',
        },
        { status: 401 }
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
