import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  'https://hajepxscgwbgiifcfndz.supabase.co',
  'sb_publishable_2mXV3C1pkQcp5SK8xD2FIg_EkjLTAhI'
);

async function testEliminar() {
  console.log('\n--- TEST ELIMINAR ---');
  const id = '33333333-3333-4333-a333-333333333302';

  // 1. Limpieza de tablas relacionadas
  const r1 = await sb.from('solicitudes_modificacion').delete().or(`comercio_id.eq.${id},id.eq.${id}`);
  console.log('Delete solicitudes:', r1.error);
  const r2 = await sb.from('debates_inconvenientes').delete().eq('comercio_id', id);
  console.log('Delete debates:', r2.error);
  const r3 = await sb.from('calificaciones_comercios').delete().eq('comercio_id', id);
  console.log('Delete calificaciones:', r3.error);
  const r4 = await sb.from('comprobantes_transferencia').delete().eq('comercio_id', id);
  console.log('Delete comprobantes:', r4.error);

  // 2. Marcar como eliminado definitivo en Supabase
  const r5 = await sb.from('comercios').update({
    estado_aprobacion: 'eliminado',
    esta_abierto: false,
  }).eq('id', id);
  console.log('Update comercios estado_aprobacion eliminado:', r5.error);

  // 3. Intentar hard-delete si está permitido
  const r6 = await sb.from('comercios').delete().eq('id', id);
  console.log('Delete fisico comercios:', r6.error);

  const check = await sb.from('comercios').select('id, nombre, estado_aprobacion').eq('id', id);
  console.log('Comercio luego de eliminar:', check.data);
}

testEliminar().catch(console.error);
