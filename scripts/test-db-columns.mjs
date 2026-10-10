import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  'https://hajepxscgwbgiifcfndz.supabase.co',
  'sb_publishable_2mXV3C1pkQcp5SK8xD2FIg_EkjLTAhI'
);

async function main() {
  const res1 = await sb.from('comercios').select('id, nombre, estado_aprobacion').limit(5);
  console.log('Comercios count:', res1.data?.length, 'Error:', res1.error);

  const res2 = await sb.from('comercios').select('motivo_rechazo').limit(1);
  console.log('motivo_rechazo in comercios?:', res2.error ? res2.error.message : 'OK');

  const res3 = await sb.from('solicitudes_modificacion').select('id, estado, motivo_rechazo, cambios').limit(5);
  console.log('solicitudes_modificacion count:', res3.data?.length, 'Error:', res3.error);

  // Check what pending items exist in solicitudes_modificacion!
  const pendingSol = await sb.from('solicitudes_modificacion').select('*').eq('estado', 'pendiente');
  console.log('Pending solicitudes_modificacion count:', pendingSol.data?.length);
  if (pendingSol.data?.length) {
    console.log('Pending solicitudes items:', pendingSol.data.map(s => ({
      id: s.id,
      comercio_id: s.comercio_id,
      tipo: s.tipo,
      nombre: s.cambios?.nombre
    })));
  }

  // Check pending comercios!
  const pendingComercios = await sb.from('comercios').select('id, nombre, estado_aprobacion').eq('estado_aprobacion', 'pendiente');
  console.log('Pending comercios count:', pendingComercios.data?.length);
  if (pendingComercios.data?.length) {
    console.log('Pending comercios items:', pendingComercios.data);
  }

  // Check ALL comercios estado_aprobacion values
  const allComercios = await sb.from('comercios').select('id, nombre, estado_aprobacion');
  const estados = {};
  for (const c of allComercios.data || []) {
    estados[c.estado_aprobacion || 'sin_estado'] = (estados[c.estado_aprobacion || 'sin_estado'] || 0) + 1;
  }
  console.log('Estados de aprobacion en comercios:', estados);
}

main().catch(console.error);
