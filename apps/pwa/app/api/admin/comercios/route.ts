import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

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
