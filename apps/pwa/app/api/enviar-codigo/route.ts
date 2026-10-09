import { NextRequest, NextResponse } from 'next/server';

interface EnvioLimit {
  cuenta: number;
  resetAt: number;
}
const rateLimitsEnvio = new Map<string, EnvioLimit>();
const MAX_ENVIOS = 5;
const VENTANA_ENVIO_MS = 10 * 60 * 1000; // 10 minutos

export async function POST(req: NextRequest) {
  try {
    const { email, nombre, token } = await req.json();

    if (!email || !token) {
      return NextResponse.json(
        { ok: false, error: 'Faltan parámetros requeridos (email o token)' },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // Protección anti-abuso y anti-spam por IP y Email
    const xForwardedFor = req.headers.get('x-forwarded-for');
    const xRealIp = req.headers.get('x-real-ip');
    const cfConnectingIp = req.headers.get('cf-connecting-ip');
    const clientIp = cfConnectingIp || (xForwardedFor ? xForwardedFor.split(',')[0].trim() : xRealIp) || '127.0.0.1';
    const limitKey = `${clientIp}:${cleanEmail}`;

    const ahora = Date.now();
    const entry = rateLimitsEnvio.get(limitKey);

    if (entry && entry.resetAt > ahora) {
      if (entry.cuenta >= MAX_ENVIOS) {
        const minRestantes = Math.ceil((entry.resetAt - ahora) / (60 * 1000));
        return NextResponse.json(
          {
            ok: false,
            error: `Has superado el límite de códigos permitidos. Por favor espera ${minRestantes} minutos antes de volver a solicitar un código.`,
          },
          { status: 429 }
        );
      }
      entry.cuenta += 1;
    } else {
      rateLimitsEnvio.set(limitKey, { cuenta: 1, resetAt: ahora + VENTANA_ENVIO_MS });
    }

    // Limpieza de claves vencidas si el mapa crece
    if (rateLimitsEnvio.size > 500) {
      for (const [k, v] of rateLimitsEnvio.entries()) {
        if (v.resetAt < ahora) rateLimitsEnvio.delete(k);
      }
    }


    // Integración opcional de Resend para correo de marca personalizado
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        const fromAddress = process.env.RESEND_FROM || 'onboarding@resend.dev';
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: `Vecinos Conectados <${fromAddress}>`,
            to: [email],
            subject: `Tu código de verificación es: ${token} - Vecin@s Conectad@s`,
            html: `
              <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #e4e4e7; border-radius: 16px;">
                <h2 style="color: #7c3aed; margin-top: 0;">Vecin@s Conectad@s</h2>
                <p>Hola <strong>${nombre || 'Vecino/a'}</strong>,</p>
                <p>Tu código de comprobación para activar tu cuenta comunitaria es:</p>
                <div style="background: #f4f4f5; padding: 15px; border-radius: 12px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #09090b; margin: 20px 0;">
                  ${token}
                </div>
                <p style="font-size: 12px; color: #71717a;">Este código tiene una vigencia de 15 minutos. Si no solicitaste este código, puedes ignorar este mensaje.</p>
              </div>
            `,
          }),
        });
        const resData = await res.json();
        console.log('[API enviar-codigo] Resend resultado:', resData);
      } catch (err) {
        console.warn('[API enviar-codigo] Fallo al invocar Resend:', err);
      }
    } else {
      console.log(`[API enviar-codigo] Código generado para ${email}: ${token}. (El envío en tiempo real viaja mediante Supabase Auth OTP)`);
    }

    return NextResponse.json({
      ok: true,
      mensaje: `Código de verificación enviado exitosamente a ${email}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Error al procesar el envío del código' },
      { status: 500 }
    );
  }
}
