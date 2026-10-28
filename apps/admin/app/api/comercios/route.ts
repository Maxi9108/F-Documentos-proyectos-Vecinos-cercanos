import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
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
