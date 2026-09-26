import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured, registrarReporteComercio } from '@/lib/supabase';
import { MotivoReporte } from '@/types/comercio';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { comercio_id, motivo, fingerprint, recaptchaToken, honeypot } = body;

    // 1. Filtro Anti-Bot Honeypot
    if (honeypot && String(honeypot).trim() !== '') {
      return NextResponse.json(
        { success: false, error: 'Solicitud bloqueada por verificación anti-bot.' },
        { status: 400 }
      );
    }

    // 2. Validación de campos obligatorios
    if (!comercio_id || !motivo) {
      return NextResponse.json(
        { success: false, error: 'Faltan parámetros obligatorios (comercio_id, motivo).' },
        { status: 400 }
      );
    }

    // 3. Extracción de IP del cliente
    const xForwardedFor = req.headers.get('x-forwarded-for');
    const xRealIp = req.headers.get('x-real-ip');
    const cfConnectingIp = req.headers.get('cf-connecting-ip');
    
    let clientIp = cfConnectingIp || (xForwardedFor ? xForwardedFor.split(',')[0].trim() : xRealIp) || '127.0.0.1';
    if (clientIp.includes('::ffff:')) {
      clientIp = clientIp.replace('::ffff:', '');
    }

    const cleanFingerprint = (fingerprint && String(fingerprint).trim()) || `fp_${clientIp.replace(/\D/g, '')}`;

    // 4. Verificación reCAPTCHA (si está configurado en .env)
    const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;
    if (recaptchaSecret && recaptchaToken) {
      try {
        const verifyRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            secret: recaptchaSecret,
            response: recaptchaToken,
            remoteip: clientIp,
          }),
        });
        const verifyData = await verifyRes.json();
        if (!verifyData.success || (verifyData.score !== undefined && verifyData.score < 0.4)) {
          return NextResponse.json(
            { success: false, error: 'Verificación de reCAPTCHA fallida. Por favor, intenta de nuevo.' },
            { status: 403 }
          );
        }
      } catch (recaptchaErr) {
        console.warn('[API Reportes] Error validando con Google reCAPTCHA:', recaptchaErr);
        // Continuamos con fingerprinting e IP
      }
    }

    // 5. Ejecución en capa de servicio (Regla 1 de 30 días + Regla 2 de 3 strikes en 15 días)
    const resultado = await registrarReporteComercio({
      comercio_id,
      motivo: motivo as MotivoReporte,
      ip_usuario: clientIp,
      fingerprint: cleanFingerprint,
    });

    if (!resultado.success) {
      return NextResponse.json(
        { success: false, error: resultado.error || 'No se pudo registrar el reporte.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      enCuarentena: resultado.enCuarentena ?? false,
      strikes: resultado.strikes ?? 1,
      mensaje: resultado.mensaje || 'Reporte registrado correctamente.',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error interno al procesar el reporte.';
    console.error('[API Reportes Error]:', err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
