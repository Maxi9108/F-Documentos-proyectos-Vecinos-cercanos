import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { verifyPassword } from '@/lib/crypto';
import { obtenerAdminPorEmail } from '@/lib/auth-admin';

export const dynamic = 'force-dynamic';

interface RateLimitEntry {
  intentosFallidos: number;
  bloqueadoHasta: number;
}
const rateLimitsEliminar = new Map<string, RateLimitEntry>();
const MAX_INTENTOS = 5;
const TIEMPO_BLOQUEO_MS = 15 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, motivo } = body;

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: 'Debes proporcionar tu correo y contraseña para solicitar la eliminación de datos.' },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // 0. Protección Anti-Fuerza Bruta por IP y Email
    const xForwardedFor = req.headers.get('x-forwarded-for');
    const xRealIp = req.headers.get('x-real-ip');
    const cfConnectingIp = req.headers.get('cf-connecting-ip');
    const clientIp = cfConnectingIp || (xForwardedFor ? xForwardedFor.split(',')[0].trim() : xRealIp) || '127.0.0.1';
    const rateLimitKey = `${clientIp}:${cleanEmail}`;

    const ahora = Date.now();
    const estadoLimit = rateLimitsEliminar.get(rateLimitKey);

    if (estadoLimit && estadoLimit.bloqueadoHasta > ahora) {
      const minutosRestantes = Math.ceil((estadoLimit.bloqueadoHasta - ahora) / (60 * 1000));
      return NextResponse.json(
        {
          ok: false,
          error: `Demasiados intentos erróneos. Por seguridad de tu cuenta, espera ${minutosRestantes} minutos antes de volver a intentar.`,
        },
        { status: 429 }
      );
    }

    if (cleanEmail === 'maxi0802@gmail.com') {
      return NextResponse.json(
        { ok: false, error: 'No está permitido eliminar la cuenta del SuperAdministrador Principal.' },
        { status: 403 }
      );
    }

    let autenticado = false;
    let usuarioDb: any = null;


    if (isSupabaseConfigured) {
      // 1. Buscar en tabla usuarios
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (!error && data) {
        usuarioDb = data;
        if (data.password_hash) {
          autenticado = await verifyPassword(password, data.password_hash);
        }
      }

      // 2. Si no autenticó por hash, verificar con Supabase Auth
      if (!autenticado) {
        try {
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });
          if (!authError && authData.user) {
            autenticado = true;
          }
        } catch (_) {}
      }
    }

    // 3. Verificar si es admin
    const admin = obtenerAdminPorEmail(cleanEmail);
    if (admin) {
      if (admin.rol === 'superadmin') {
        return NextResponse.json(
          { ok: false, error: 'No está permitido eliminar la cuenta del SuperAdmin Principal.' },
          { status: 403 }
        );
      }
      if (await verifyPassword(password, admin.password)) {
        autenticado = true;
      }
    }

    // 4. Fallback si tiene password plano en esquema previo
    if (!autenticado && usuarioDb && usuarioDb.password) {
      autenticado = await verifyPassword(password, usuarioDb.password);
    }

    if (!autenticado && !usuarioDb) {
      // Si no existe registro en Supabase, se permite respuesta positiva para que el cliente purgue su localStorage
      return NextResponse.json({
        ok: true,
        remotoEliminado: false,
        mensaje: 'No se encontró registro remoto en la nube. Se completará la eliminación en tu almacenamiento local.',
      });
    }

    if (!autenticado) {
      const intentos = (estadoLimit?.intentosFallidos || 0) + 1;
      const bloquear = intentos >= MAX_INTENTOS;
      rateLimitsEliminar.set(rateLimitKey, {
        intentosFallidos: intentos,
        bloqueadoHasta: bloquear ? ahora + TIEMPO_BLOQUEO_MS : 0,
      });

      const intentosRestantes = Math.max(0, MAX_INTENTOS - intentos);
      const aviso = intentosRestantes > 0 ? ` (Te quedan ${intentosRestantes} intentos antes del bloqueo temporal)` : ' (Bloqueo temporal por 15 minutos)';

      return NextResponse.json(
        { ok: false, error: `Contraseña o credenciales incorrectas.${aviso}` },
        { status: 401 }
      );
    }

    // Éxito: limpiar limitador
    rateLimitsEliminar.delete(rateLimitKey);

    // 5. Ejecutar borrado permanente en Supabase
    if (isSupabaseConfigured) {

      await supabase.from('usuarios').delete().eq('email', cleanEmail);
      if (usuarioDb?.id) {
        await supabase.from('usuarios').delete().eq('id', usuarioDb.id);
      }
      await supabase.from('tokens_registro').delete().eq('email', cleanEmail);
    }

    return NextResponse.json({
      ok: true,
      remotoEliminado: true,
      mensaje: 'Cuenta y datos personales eliminados satisfactoriamente de los servidores de NeoFaro.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || 'Error en el servidor al procesar la solicitud de eliminación.' },
      { status: 500 }
    );
  }
}
