import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hajepxscgwbgiifcfndz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_2mXV3C1pkQcp5SK8xD2FIg_EkjLTAhI';
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ELOHIM_ID = '52b85ac3-4269-4878-8eeb-dacbc8190db8';

async function main() {
  console.log('--- LIMPIEZA DE COMERCIOS EXCEPTO ELOHIM ---');
  
  // 1. Obtener comercios
  const { data: todos, error } = await sb.from('comercios').select('id, nombre, estado_aprobacion');
  if (error) {
    console.error('Error al obtener comercios:', error);
    return;
  }

  const otros = todos.filter(c => c.id !== ELOHIM_ID);
  console.log(`Encontrados ${otros.length} comercios para eliminar/marcar.`);

  for (const c of otros) {
    // Limpieza de datos relacionados
    await sb.from('solicitudes_modificacion').delete().or(`comercio_id.eq.${c.id},id.eq.${c.id}`);
    await sb.from('debates_inconvenientes').delete().eq('comercio_id', c.id);
    await sb.from('comprobantes_transferencia').delete().eq('comercio_id', c.id);
    await sb.from('productos').delete().eq('comercio_id', c.id);
    await sb.from('reportes').delete().eq('comercio_id', c.id);
    await sb.from('eventos_analytics').delete().eq('comercio_id', c.id);

    // Actualizar comercio a 'eliminado'
    const { error: updErr } = await sb.from('comercios')
      .update({ estado_aprobacion: 'eliminado', esta_abierto: false })
      .eq('id', c.id);

    if (updErr) {
      console.error(`Error actualizando ${c.nombre}:`, updErr.message);
    } else {
      console.log(`✔ ${c.nombre} marcado como eliminado.`);
    }
  }

  // 2. Comprobar resultado
  const { data: restantes } = await sb.from('comercios').select('id, nombre, estado_aprobacion');
  const activos = restantes.filter(c => c.estado_aprobacion !== 'eliminado');
  
  console.log('\n--- COMERCIOS ACTIVOS EN BASE DE DATOS ---');
  console.log(activos);
  console.log('\nTotal comercios en tabla:', restantes.length);
  console.log('Total eliminados:', restantes.filter(c => c.estado_aprobacion === 'eliminado').length);
  console.log('Total activos:', activos.length);
}

main().catch(console.error);
