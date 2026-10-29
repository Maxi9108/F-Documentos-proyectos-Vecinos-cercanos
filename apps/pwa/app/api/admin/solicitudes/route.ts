import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const sb = getSupabaseAdminClient();
    const { data, error } = await sb
      .from('solicitudes_modificacion')
      .select('*')
      .order('fecha_solicitud', { ascending: false });

    if (error) {
      console.error('[/api/admin/solicitudes GET] Error:', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { ok: true, data: data || [] },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (error: any) {
    console.error('[/api/admin/solicitudes GET] Excepción:', error);
    return NextResponse.json(
      { ok: false, error: error?.message || 'Error interno al consultar solicitudes' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, id, motivo, aprobadoPor } = body;

    if (!id) {
      return NextResponse.json({ ok: false, error: 'ID de solicitud requerido' }, { status: 400 });
    }

    const sb = getSupabaseAdminClient();
    const ahoraIso = new Date().toISOString();

    if (action === 'aprobar') {
      const { data: solData } = await sb
        .from('solicitudes_modificacion')
        .select('*')
        .or(`id.eq.${id},comercio_id.eq.${id}`)
        .maybeSingle();

      if (!solData) {
        return NextResponse.json({ ok: false, error: 'Solicitud no encontrada' }, { status: 404 });
      }

      const comercioId = solData.comercio_id || solData.id;

      // 1. Marcar solicitud como aprobada
      await sb
        .from('solicitudes_modificacion')
        .update({
          estado: 'aprobado',
          aprobado_por: aprobadoPor || 'SuperAdmin',
          fecha_aprobacion: ahoraIso,
        })
        .or(`id.eq.${id},comercio_id.eq.${comercioId}`);

      // 2. Aplicar columnas base compatibles en comercios si corresponde
      if (solData.cambios) {
        const baseUpdates: Record<string, unknown> = {
          estado_aprobacion: 'aprobado',
          aprobado_por: aprobadoPor || 'SuperAdmin',
          fecha_aprobacion: ahoraIso,
          esta_abierto: true,
        };
        if (solData.cambios.nombre) baseUpdates.nombre = String(solData.cambios.nombre).trim();
        if (solData.cambios.rubro) baseUpdates.rubro = String(solData.cambios.rubro).trim();
        if (solData.cambios.direccion) baseUpdates.direccion = String(solData.cambios.direccion).trim();
        if (solData.cambios.telefono) baseUpdates.telefono = String(solData.cambios.telefono).trim();
        if (solData.cambios.latitud != null) baseUpdates.latitud = Number(solData.cambios.latitud);
        if (solData.cambios.longitud != null) baseUpdates.longitud = Number(solData.cambios.longitud);
        if (solData.cambios.nivel) baseUpdates.nivel = solData.cambios.nivel;

        await sb.from('comercios').update(baseUpdates).eq('id', comercioId);
      }

      return NextResponse.json({ ok: true, id });
    }

    if (action === 'rechazar') {
      const comercioId = id;
      await sb
        .from('solicitudes_modificacion')
        .update({
          estado: 'rechazado',
          motivo_rechazo: motivo || 'No cumple con las pautas de moderación',
        })
        .or(`id.eq.${id},comercio_id.eq.${comercioId}`);

      await sb
        .from('comercios')
        .update({
          estado_aprobacion: 'rechazado',
          esta_abierto: false,
        })
        .eq('id', comercioId);

      return NextResponse.json({ ok: true, id });
    }

    return NextResponse.json({ ok: false, error: 'Acción no reconocida' }, { status: 400 });
  } catch (error: any) {
    console.error('[/api/admin/solicitudes POST] Error:', error);
    return NextResponse.json(
      { ok: false, error: error?.message || 'Error interno al procesar solicitud' },
      { status: 500 }
    );
  }
}
