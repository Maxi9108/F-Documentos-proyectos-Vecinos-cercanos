import { createClient } from '@supabase/supabase-js';
import { getServiceKey } from './get-service-key.mjs';

const sbAdmin = createClient(
  'https://hajepxscgwbgiifcfndz.supabase.co',
  getServiceKey()
);

async function inspectColumns() {
  const { data: comercios, error: errC } = await sbAdmin
    .from('comercios')
    .select('*')
    .limit(10);

  console.log('Comercios count:', comercios?.length, 'Error:', errC);
  if (comercios?.length) {
    console.log('First comercio columns:', Object.keys(comercios[0]));
    console.log('All comercios found:');
    comercios.forEach(c => console.log(`- ${c.id}: ${c.nombre} [estado: ${c.estado_aprobacion}, rubro: ${c.rubro}]`));
  } else {
    console.log('No comercios rows found.');
  }

  const { data: sols, error: errS } = await sbAdmin
    .from('solicitudes_modificacion')
    .select('*')
    .limit(10);
  console.log('Solicitudes count:', sols?.length, 'Error:', errS);
  if (sols?.length) {
    console.log('First solicitud columns:', Object.keys(sols[0]));
  }
}

inspectColumns().catch(console.error);
