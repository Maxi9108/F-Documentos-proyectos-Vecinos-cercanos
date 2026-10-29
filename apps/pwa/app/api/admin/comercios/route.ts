import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, id, rubro, aprobadoPor, nivel, motivo } = body;

    if (!id) {
      return NextResponse.json({ ok: false, error: 'ID de comercio requerido' }, { status: 400 });
    }

    const sb = getSupabaseAdminClient();

    if (action === 'aprobar') {
      const ahora = new Date();
      const fechaAprobacion = ahora.toISOString();
      const fechaInicioNivel = fechaAprobacion;
      let fechaVencimiento: string | null = null;
      if (nivel === 'premium' || nivel === 'gold') {
        fechaVencimiento = new Date(ahora.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      }

      // 1. Obtener solicitud previa para actualizar metadatos enriquecidos (vigencia nivel, etc)
      const { data: solPrevia } = await sb
        .from('solicitudes_modificacion')
        .select('*')
        .or(`comercio_id.eq.${id},id.eq.${id}`)
        .maybeSingle();

      const cambiosActualizados = {
        ...(solPrevia?.cambios || {}),
        estado_aprobacion: 'aprobado',
        aprobado_por: aprobadoPor || 'Administrador',
        fecha_aprobacion: fechaAprobacion,
        nivel: nivel || 'standar',
        fecha_inicio_nivel: fechaInicioNivel,
        fecha_vencimiento_nivel: fechaVencimiento,
      };
      if (rubro) cambiosActualizados.rubro = rubro;

      await sb
        .from('solicitudes_modificacion')
        .update({
          estado: 'aprobado',
          aprobado_por: aprobadoPor || 'Administrador',
          fecha_aprobacion: fechaAprobacion,
          cambios: cambiosActualizados,
        })
        .or(`comercio_id.eq.${id},id.eq.${id}`);

      // 2. Actualizar solo las columnas existentes en public.comercios
      const updates: Record<string, unknown> = {
        estado_aprobacion: 'aprobado',
        aprobado_por: aprobadoPor || 'Administrador',
        fecha_aprobacion: fechaAprobacion,
        nivel: nivel || 'standar',
        esta_abierto: true,
      };
      if (rubro) updates.rubro = rubro;

      const { data, error } = await sb.from('comercios').update(updates).eq('id', id).select();

      if (error) {
        console.error('[/api/admin/comercios POST aprobar] Error al actualizar comercios:', error);
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({ ok: true, data });
    }

    if (action === 'rechazar') {
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

      const { data, error } = await sb
        .from('comercios')
        .update({
          estado_aprobacion: 'rechazado',
          esta_abierto: false,
        })
        .eq('id', id)
        .select();

      if (error) {
        console.error('[/api/admin/comercios POST rechazar] Error:', error);
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({ ok: true, data });
    }

    return NextResponse.json({ ok: false, error: 'Acción no reconocida' }, { status: 400 });
  } catch (error: any) {
    console.error('[/api/admin/comercios POST] Error:', error);
    return NextResponse.json(
      { ok: false, error: error?.message || 'Error interno en administración de comercio' },
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

    const sb = getSupabaseAdminClient();

    // 1. Desvincular usuarios que tengan este comercio asignado
    try {
      await sb
        .from('usuarios')
        .update({ comercio_id: null, comercio_nombre: null })
        .eq('comercio_id', id);
    } catch (_) {}

    // 2. Limpieza en tablas satélite / dependientes
    await sb.from('solicitudes_modificacion').delete().or(`comercio_id.eq.${id},id.eq.${id}`);
    await sb.from('solicitudes_transferencia').delete().eq('comercio_id', id);
    await sb.from('debates_inconvenientes').delete().eq('comercio_id', id);
    await sb.from('reportes').delete().eq('comercio_id', id);
    await sb.from('productos').delete().eq('comercio_id', id);
    await sb.from('comprobantes_transferencia').delete().eq('comercio_id', id);

    try {
      await sb.from('calificaciones_comercios').delete().eq('comercio_id', id);
    } catch (_) {}

    // 3. Eliminar físicamente de la tabla 'comercios' con service_role (bypasea RLS)
    const { error: deleteError } = await sb.from('comercios').delete().eq('id', id);

    if (deleteError) {
      // Si existiese alguna restricción referencial, marcar como eliminado
      await sb.from('comercios').update({
        estado_aprobacion: 'eliminado',
        esta_abierto: false,
      }).eq('id', id);
    }

    return NextResponse.json({ ok: true, id });
  } catch (error: any) {
    console.error('[/api/admin/comercios DELETE] Error:', error);
    return NextResponse.json(
      { ok: false, error: error?.message || 'Error interno al eliminar comercio' },
      { status: 500 }
    );
  }
}
