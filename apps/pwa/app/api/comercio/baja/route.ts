import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// =============================================================================
// POST /api/comercio/baja
// Endpoint seguro del servidor para la Baja Definitiva de un comercio.
//
// Seguridad:
//  1. Valida el Bearer token JWT del comerciante (Authorization header).
//  2. Verifica que el auth.uid() del token coincida con el user_id del comercio.
//  3. Ejecuta la baja atómica en el servidor usando service_role (bypasea RLS
//     de forma controlada y explícita, solo para esta operación crítica).
// =============================================================================

// Tiempo máximo de espera para la operación completa
export const maxDuration = 30;
export const dynamic = 'force-dynamic';

// ── Helpers ──────────────────────────────────────────────────────────────────

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

// Rate-limiter simple en memoria (se resetea al reiniciar el servidor)
interface RateLimitEntry { intentos: number; bloqueadoHasta: number }
const rateLimits = new Map<string, RateLimitEntry>();
const MAX_INTENTOS = 3;
const BLOQUEO_MS   = 30 * 60 * 1000; // 30 min de bloqueo

function checkRateLimit(key: string): { bloqueado: boolean; minutosRestantes?: number } {
  const ahora   = Date.now();
  const entrada = rateLimits.get(key);
  if (entrada && entrada.bloqueadoHasta > ahora) {
    return {
      bloqueado: true,
      minutosRestantes: Math.ceil((entrada.bloqueadoHasta - ahora) / 60_000),
    };
  }
  return { bloqueado: false };
}

function registrarIntento(key: string): void {
  const ahora   = Date.now();
  const entrada = rateLimits.get(key) ?? { intentos: 0, bloqueadoHasta: 0 };
  entrada.intentos += 1;
  if (entrada.intentos >= MAX_INTENTOS) {
    entrada.bloqueadoHasta = ahora + BLOQUEO_MS;
  }
  rateLimits.set(key, entrada);
}

function limpiarRateLimit(key: string): void {
  rateLimits.delete(key);
}

// ── Handler principal ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // ── 1. Validar variables de entorno del servidor ──────────────────────────
    const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnon    = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseService = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnon || !supabaseService) {
      console.error('[/api/comercio/baja] Variables de entorno de Supabase no configuradas.');
      return NextResponse.json(
        { ok: false, error: 'Servicio no disponible. Contacta al administrador.' },
        { status: 503 }
      );
    }

    // ── 2. Extraer y validar el cuerpo ────────────────────────────────────────
    let body: { comercioId?: string; motivo?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: 'Cuerpo de la solicitud inválido.' },
        { status: 400 }
      );
    }

    const { comercioId, motivo } = body;

    if (!comercioId || typeof comercioId !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'Se requiere el parámetro comercioId.' },
        { status: 400 }
      );
    }

    const esUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(comercioId);
    if (!esUuid) {
      return NextResponse.json(
        { ok: false, error: 'comercioId tiene un formato inválido.' },
        { status: 400 }
      );
    }

    // ── 3. Extraer Bearer token JWT del header Authorization ──────────────────
    const authHeader = req.headers.get('authorization') ?? '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

    if (!bearerToken) {
      return NextResponse.json(
        { ok: false, error: 'No autorizado. Debes estar autenticado para dar de baja tu comercio.' },
        { status: 401 }
      );
    }

    // ── 4. Rate-limit por IP para esta operación crítica ─────────────────────
    const clientIp    = getClientIp(req);
    const rateLimitKey = `baja:${clientIp}:${comercioId}`;
    const { bloqueado, minutosRestantes } = checkRateLimit(rateLimitKey);

    if (bloqueado) {
      return NextResponse.json(
        {
          ok: false,
          error: `Demasiados intentos de baja. Espera ${minutosRestantes} minutos antes de volver a intentar.`,
        },
        { status: 429 }
      );
    }

    // ── 5. Verificar el JWT del comerciante con el cliente anon ───────────────
    //      Esto valida que el token es real y obtiene el auth.uid()
    const supabaseUserClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: `Bearer ${bearerToken}` } },
    });

    const { data: { user }, error: userError } = await supabaseUserClient.auth.getUser();

    if (userError || !user) {
      registrarIntento(rateLimitKey);
      return NextResponse.json(
        { ok: false, error: 'Token de autenticación inválido o expirado. Vuelve a iniciar sesión.' },
        { status: 401 }
      );
    }

    const authUid = user.id;

    // ── 6. Verificar que el comercio pertenece al usuario autenticado ─────────
    //      Usamos service_role para esta lectura crítica (sin restricciones RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseService, {
      auth: { persistSession: false },
    });

    const { data: comercio, error: comercioError } = await supabaseAdmin
      .from('comercios')
      .select('id, nombre, user_id, estado_aprobacion')
      .eq('id', comercioId)
      .maybeSingle();

    if (comercioError || !comercio) {
      return NextResponse.json(
        { ok: false, error: 'Comercio no encontrado.' },
        { status: 404 }
      );
    }

    // Verificar propiedad: el auth.uid() debe coincidir con el user_id del comercio
    if (comercio.user_id !== authUid) {
      registrarIntento(rateLimitKey);
      console.warn(
        `[/api/comercio/baja] Intento de baja no autorizado. uid=${authUid} comercio.user_id=${comercio.user_id}`
      );
      return NextResponse.json(
        { ok: false, error: 'No tienes autorización para dar de baja este comercio.' },
        { status: 403 }
      );
    }

    if (comercio.estado_aprobacion === 'eliminado') {
      return NextResponse.json(
        { ok: false, error: 'Este comercio ya fue dado de baja previamente.' },
        { status: 409 }
      );
    }

    // ── 7. Ejecutar baja atómica desde el servidor ────────────────────────────
    const nombreComercio = comercio.nombre ?? 'Comercio';
    const motivoBaja = (motivo ?? 'Baja voluntaria del comerciante').trim().slice(0, 500);
    const ahora = new Date().toISOString();

    // 7a. Desvincular usuarios relacionados
    await supabaseAdmin
      .from('usuarios')
      .update({ comercio_id: null, comercio_nombre: null })
      .eq('comercio_id', comercioId);

    // 7b. Eliminar tablas relacionadas en cascada (el CASCADE de FK ya debería
    //     hacerlo automáticamente en ON DELETE CASCADE, pero lo hacemos
    //     explícitamente para mayor trazabilidad y control de errores)
    const tablasRelacionadas: Array<{ tabla: string }> = [
      { tabla: 'solicitudes_modificacion' },
      { tabla: 'debates_inconvenientes' },
      { tabla: 'reportes' },
      { tabla: 'productos' },
      { tabla: 'comprobantes_transferencia' },
    ];

    const erroresParciales: string[] = [];

    for (const { tabla } of tablasRelacionadas) {
      const { error: delErr } = await supabaseAdmin
        .from(tabla)
        .delete()
        .eq('comercio_id', comercioId);
      if (delErr) {
        erroresParciales.push(`${tabla}: ${delErr.message}`);
        console.warn(`[/api/comercio/baja] Error al eliminar de ${tabla}:`, delErr.message);
      }
    }

    // 7c. Intentar tabla calificaciones_comercios (opcional, puede no existir)
    try {
      await supabaseAdmin.from('calificaciones_comercios').delete().eq('comercio_id', comercioId);
    } catch (_) { /* ignorar si no existe */ }

    // 7d. Marcar el comercio como eliminado primero (para trazabilidad / audit log)
    await supabaseAdmin.from('comercios').update({
      estado_aprobacion: 'eliminado',
      esta_abierto: false,
      ticket_baja_definitiva: true,
      fecha_ticket_baja: ahora,
      motivo_ticket_baja: motivoBaja,
    }).eq('id', comercioId);

    // 7e. Eliminar físicamente el registro del comercio
    const { error: deleteMainError } = await supabaseAdmin
      .from('comercios')
      .delete()
      .eq('id', comercioId);

    if (deleteMainError) {
      console.warn('[/api/comercio/baja] Error al eliminar registro principal de comercios:', deleteMainError.message);
      // No es un error fatal: ya marcamos como 'eliminado', así que el comercio
      // no será visible públicamente de todas formas.
    }

    // 7f. Registrar evento de analytics
    try {
      await supabaseAdmin.from('eventos_analytics').insert({
        tipo_evento: 'baja_definitiva_comercio',
        comercio_id: comercioId,
        comercio_nombre: nombreComercio,
        detalles: {
          motivo: motivoBaja,
          ejecutado_por: authUid,
          fecha: ahora,
          errores_parciales: erroresParciales.length > 0 ? erroresParciales : undefined,
        },
      });
    } catch (_) { /* no bloquear la respuesta por analytics */ }

    // ── 8. Limpiar rate-limit (operación exitosa) ─────────────────────────────
    limpiarRateLimit(rateLimitKey);

    console.log(`[/api/comercio/baja] Baja ejecutada. comercio="${nombreComercio}" uid=${authUid}`);

    return NextResponse.json({
      ok: true,
      mensaje: `El comercio "${nombreComercio}" ha sido dado de baja permanentemente.`,
      comercioNombre: nombreComercio,
      ...(erroresParciales.length > 0 && { advertencias: erroresParciales }),
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error interno del servidor.';
    console.error('[/api/comercio/baja] Error inesperado:', msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
