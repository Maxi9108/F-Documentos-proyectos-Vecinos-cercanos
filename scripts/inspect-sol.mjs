import { createClient } from '@supabase/supabase-js';
import { getServiceKey } from './get-service-key.mjs';

const SUPABASE_URL = 'https://hajepxscgwbgiifcfndz.supabase.co';
const SERVICE_KEY = getServiceKey();

const sbAdmin = createClient(SUPABASE_URL, SERVICE_KEY);

async function inspectSol() {
  const { data, error } = await sbAdmin.from('solicitudes_modificacion').select('*').limit(1);
  console.log('solicitudes_modificacion query:', { data, error });

  // Test insert with sbAdmin into solicitudes_modificacion
  const testComId = '11111111-2222-3333-4444-555555555555';
  // Insert parent comercio first
  await sbAdmin.from('comercios').insert([{
    id: testComId,
    nombre: 'Parent Comercio',
    rubro: 'Test',
    direccion: 'Dir Test',
    latitud: -34.6,
    longitud: -58.4,
    esta_abierto: true,
    estado_aprobacion: 'pendiente',
    nivel: 'standar',
    fecha_solicitud: new Date().toISOString()
  }]);

  const solRow = {
    id: testComId,
    comercio_id: testComId,
    comercio_nombre: 'Parent Comercio',
    cambios: {
      nombre: 'Parent Comercio',
      rubro: 'Test',
      direccion: 'Dir Test',
      tipo_solicitud: 'alta_nuevo_comercio'
    },
    estado: 'pendiente',
    fecha_solicitud: new Date().toISOString()
  };

  const resSol = await sbAdmin.from('solicitudes_modificacion').insert([solRow]).select();
  console.log('solicitudes_modificacion insert with sbAdmin:', resSol);

  // Clean up
  await sbAdmin.from('solicitudes_modificacion').delete().eq('id', testComId);
  await sbAdmin.from('comercios').delete().eq('id', testComId);
}

inspectSol().catch(console.error);
