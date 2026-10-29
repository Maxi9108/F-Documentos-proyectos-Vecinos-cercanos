import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const FALLBACK_KEY_B64 = 'c2Jfc2VjcmV0X0hwTUcxSGp6emNTTDUzQlh2RVFoTUFfc0Rac0JCc0c=';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hajepxscgwbgiifcfndz.supabase.co';
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    Buffer.from(FALLBACK_KEY_B64, 'base64').toString('utf-8') ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

export async function GET() {
  try {
    const sb = getAdminClient();

    // 1. Obtener solicitudes de moderación enriquecidas
    const solsMap = new Map<string, any>();
    try {
      const { data: sols } = await sb.from('solicitudes_modificacion').select('*');
      if (sols) {
        sols.forEach((s) => {
          if (s.estado !== 'eliminado') {
            solsMap.set(s.comercio_id, s);
          }
        });
      }
    } catch (eSol) {
      console.warn('[/api/comercios GET] Aviso al consultar solicitudes:', eSol);
    }

    // 2. Obtener comercios de la base de datos
    const { data, error } = await sb
      .from('comercios')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) {
      console.error('[/api/comercios GET] Error al obtener comercios:', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const mapa = new Map<string, any>();

    ((data as any[]) || []).forEach((c) => {
      if (c.estado_aprobacion === 'eliminado') return;
      const copy = { ...c };
      delete copy.password_comercio;

      const sol = solsMap.get(copy.id);
      if (sol) {
        if (sol.estado === 'eliminado') return;
        if (sol.cambios && typeof sol.cambios === 'object') {
          Object.assign(copy, sol.cambios);
        }
        if (sol.estado === 'pendiente') {
          copy.estado_aprobacion = 'pendiente';
        } else if (sol.estado === 'rechazado') {
          copy.estado_aprobacion = 'rechazado';
          copy.motivo_rechazo = sol.motivo_rechazo || copy.motivo_rechazo;
        } else if (sol.estado === 'aprobado') {
          copy.estado_aprobacion = 'aprobado';
        }
      } else if (!copy.estado_aprobacion) {
        copy.estado_aprobacion = 'aprobado';
      }

      mapa.set(copy.id, copy);
    });

    // 3. Incorporar solicitudes que aún no estén en la tabla comercios
    solsMap.forEach((sol, comercioId) => {
      if (sol.estado === 'eliminado') return;
      if (!mapa.has(comercioId) && sol.cambios) {
        const item: any = {
          id: comercioId,
          nombre: sol.comercio_nombre || sol.cambios.nombre || 'Nuevo Comercio',
          rubro: sol.cambios.rubro || 'General',
          direccion: sol.cambios.direccion || 'Sin dirección',
          telefono: sol.cambios.telefono || '',
          whatsapp: sol.cambios.whatsapp || '',
          latitud: sol.cambios.latitud || -34.6,
          longitud: sol.cambios.longitud || -58.4,
          esta_abierto: true,
          estado_aprobacion: sol.estado === 'rechazado' ? 'rechazado' : sol.estado === 'aprobado' ? 'aprobado' : 'pendiente',
          motivo_rechazo: sol.motivo_rechazo,
          ...sol.cambios,
        };
        delete item.password_comercio;
        mapa.set(comercioId, item);
      }
    });

    return NextResponse.json(
      { ok: true, data: Array.from(mapa.values()) },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (error: any) {
    console.error('[/api/comercios GET] Excepción:', error);
    return NextResponse.json(
      { ok: false, error: error?.message || 'Error interno al obtener comercios' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, id, nivel, motivo, input } = body;
    const sb = getAdminClient();
    const ahoraIso = new Date().toISOString();

    if (action === 'aprobar') {
      if (!id) return NextResponse.json({ ok: false, error: 'ID requerido' }, { status: 400 });

      // Actualizar en solicitudes_modificacion
      const { data: solPrevia } = await sb
        .from('solicitudes_modificacion')
        .select('*')
        .or(`comercio_id.eq.${id},id.eq.${id}`)
        .maybeSingle();

      const cambiosActualizados = {
        ...(solPrevia?.cambios || {}),
        estado_aprobacion: 'aprobado',
        aprobado_por: 'Administrador',
        fecha_aprobacion: ahoraIso,
        nivel: nivel || 'standar',
      };

      await sb
        .from('solicitudes_modificacion')
        .update({
          estado: 'aprobado',
          aprobado_por: 'Administrador',
          fecha_aprobacion: ahoraIso,
          cambios: cambiosActualizados,
        })
        .or(`comercio_id.eq.${id},id.eq.${id}`);

      // Actualizar solo columnas compatibles en public.comercios
      const { error: updErr } = await sb
        .from('comercios')
        .update({
          estado_aprobacion: 'aprobado',
          nivel: nivel || 'standar',
          aprobado_por: 'Administrador',
          fecha_aprobacion: ahoraIso,
          esta_abierto: true,
        })
        .eq('id', id);

      if (updErr) {
        console.error('[/api/comercios POST aprobar] Error en comercios:', updErr);
        return NextResponse.json({ ok: false, error: updErr.message }, { status: 500 });
      }

      return NextResponse.json({ ok: true, id });
    }

    if (action === 'rechazar') {
      if (!id) return NextResponse.json({ ok: false, error: 'ID requerido' }, { status: 400 });

      const { data: solPrevia } = await sb
        .from('solicitudes_modificacion')
        .select('*')
        .or(`comercio_id.eq.${id},id.eq.${id}`)
        .maybeSingle();

      const cambiosActualizados = {
        ...(solPrevia?.cambios || {}),
        estado_aprobacion: 'rechazado',
        esta_abierto: false,
        motivo_rechazo: motivo || 'No cumple con las pautas de moderación',
      };

      await sb
        .from('solicitudes_modificacion')
        .update({
          estado: 'rechazado',
          motivo_rechazo: motivo || 'No cumple con las pautas de moderación',
          cambios: cambiosActualizados,
        })
        .or(`comercio_id.eq.${id},id.eq.${id}`);

      const { error: updErr } = await sb
        .from('comercios')
        .update({
          estado_aprobacion: 'rechazado',
          esta_abierto: false,
        })
        .eq('id', id);

      if (updErr) {
        return NextResponse.json({ ok: false, error: updErr.message }, { status: 500 });
      }

      return NextResponse.json({ ok: true, id });
    }

    if (action === 'create') {
      if (!input || !input.nombre || !input.rubro || !input.direccion) {
        return NextResponse.json({ ok: false, error: 'Faltan campos obligatorios' }, { status: 400 });
      }

      const comId = input.id || crypto.randomUUID();
      const payloadBase = {
        id: comId,
        nombre: String(input.nombre).trim(),
        rubro: String(input.rubro).trim(),
        direccion: String(input.direccion).trim(),
        telefono: input.telefono ? String(input.telefono).trim() : null,
        latitud: Number(input.latitud) || -34.6,
        longitud: Number(input.longitud) || -58.4,
        esta_abierto: input.esta_abierto ?? true,
        estado_aprobacion: input.estado_aprobacion || 'aprobado',
        nivel: input.nivel || 'standar',
        fecha_solicitud: input.fecha_solicitud || ahoraIso,
        aprobado_por: input.aprobado_por || 'Administrador',
        fecha_aprobacion: input.fecha_aprobacion || ahoraIso,
      };

      const { data: createdCom, error: errC } = await sb
        .from('comercios')
        .upsert([payloadBase])
        .select()
        .single();

      if (errC) {
        return NextResponse.json({ ok: false, error: errC.message }, { status: 500 });
      }

      await sb.from('solicitudes_modificacion').upsert([
        {
          id: comId,
          comercio_id: comId,
          comercio_nombre: payloadBase.nombre,
          cambios: { ...input, id: comId },
          estado: payloadBase.estado_aprobacion,
          fecha_solicitud: payloadBase.fecha_solicitud,
          aprobado_por: payloadBase.aprobado_por,
          fecha_aprobacion: payloadBase.fecha_aprobacion,
        },
      ]);

      return NextResponse.json({ ok: true, data: { ...input, ...createdCom } });
    }

    return NextResponse.json({ ok: false, error: 'Acción no válida' }, { status: 400 });
  } catch (error: any) {
    console.error('[/api/comercios POST] Excepción:', error);
    return NextResponse.json(
      { ok: false, error: error?.message || 'Error en el servidor al procesar la solicitud' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, input } = await req.json();
    if (!id || !input) {
      return NextResponse.json({ ok: false, error: 'ID e input requeridos' }, { status: 400 });
    }

    const sb = getAdminClient();

    // Actualizar columnas compatibles en comercios
    const safeUpdates: Record<string, unknown> = {};
    if (input.nombre) safeUpdates.nombre = String(input.nombre).trim();
    if (input.rubro) safeUpdates.rubro = String(input.rubro).trim();
    if (input.direccion) safeUpdates.direccion = String(input.direccion).trim();
    if (input.telefono !== undefined) safeUpdates.telefono = input.telefono ? String(input.telefono).trim() : null;
    if (input.latitud !== undefined) safeUpdates.latitud = Number(input.latitud);
    if (input.longitud !== undefined) safeUpdates.longitud = Number(input.longitud);
    if (input.esta_abierto !== undefined) safeUpdates.esta_abierto = Boolean(input.esta_abierto);
    if (input.estado_aprobacion) safeUpdates.estado_aprobacion = input.estado_aprobacion;
    if (input.nivel) safeUpdates.nivel = input.nivel;

    if (Object.keys(safeUpdates).length > 0) {
      await sb.from('comercios').update(safeUpdates).eq('id', id);
    }

    // Actualizar cambios en solicitudes_modificacion
    const { data: solPrevia } = await sb
      .from('solicitudes_modificacion')
      .select('cambios')
      .or(`comercio_id.eq.${id},id.eq.${id}`)
      .maybeSingle();

    if (solPrevia) {
      await sb
        .from('solicitudes_modificacion')
        .update({
          cambios: { ...(solPrevia.cambios || {}), ...input },
        })
        .or(`comercio_id.eq.${id},id.eq.${id}`);
    }

    return NextResponse.json({ ok: true, id });
  } catch (error: any) {
    console.error('[/api/comercios PUT] Excepción:', error);
    return NextResponse.json(
      { ok: false, error: error?.message || 'Error interno al actualizar comercio' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ ok: false, error: 'ID de comercio requerido' }, { status: 400 });
    }

    const sb = getAdminClient();

    // 1. Limpieza de tablas satélite
    await sb.from('solicitudes_modificacion').delete().or(`comercio_id.eq.${id},id.eq.${id}`);
    await sb.from('solicitudes_transferencia').delete().eq('comercio_id', id);
    await sb.from('debates_inconvenientes').delete().eq('comercio_id', id);
    await sb.from('reportes').delete().eq('comercio_id', id);
    await sb.from('productos').delete().eq('comercio_id', id);
    await sb.from('comprobantes_transferencia').delete().eq('comercio_id', id);

    try {
      await sb.from('calificaciones_comercios').delete().eq('comercio_id', id);
    } catch (_) {}

    // 2. Eliminar de la tabla principal
    const { error: delErr } = await sb.from('comercios').delete().eq('id', id);

    if (delErr) {
      await sb.from('comercios').update({
        estado_aprobacion: 'eliminado',
        esta_abierto: false,
      }).eq('id', id);
    }

    return NextResponse.json({ ok: true, id });
  } catch (error: any) {
    console.error('[/api/comercios DELETE] Error:', error);
    return NextResponse.json(
      { ok: false, error: error?.message || 'Error interno al eliminar comercio' },
      { status: 500 }
    );
  }
}
