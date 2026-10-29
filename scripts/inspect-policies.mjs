import { createClient } from '@supabase/supabase-js';
import { getServiceKey } from './get-service-key.mjs';

const SUPABASE_URL = 'https://hajepxscgwbgiifcfndz.supabase.co';
const SERVICE_KEY = getServiceKey();

const sbAdmin = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkPolicies() {
  const { data, error } = await sbAdmin.rpc('get_policies_temp');
  if (error) {
    // try direct query or check what policies exist
    console.log('RPC error:', error.message);
  }
}

// Since rpc might not exist, let's test executing sql or check pg_policies
async function inspectTables() {
  // Let's test insert with sbAdmin and see if that works
  const testId = '22222222-3333-4444-5555-666666666666';
  const payload = {
    id: testId,
    nombre: 'Comercio Admin Test',
    rubro: 'Almacén',
    direccion: 'Calle Admin 123',
    latitud: -34.6,
    longitud: -58.4,
    esta_abierto: true,
    estado_aprobacion: 'pendiente',
    nivel: 'standar',
    fecha_solicitud: new Date().toISOString()
  };

  const resAdminInsert = await sbAdmin.from('comercios').insert([payload]).select();
  console.log('Admin insert result:', resAdminInsert);

  // Clean up
  await sbAdmin.from('comercios').delete().eq('id', testId);
}

inspectTables().catch(console.error);
