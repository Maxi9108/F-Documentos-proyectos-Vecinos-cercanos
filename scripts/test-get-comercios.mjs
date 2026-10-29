import { createClient } from '@supabase/supabase-js';
import { getServiceKey } from './get-service-key.mjs';

const SUPABASE_URL = 'https://hajepxscgwbgiifcfndz.supabase.co';
const SERVICE_KEY = getServiceKey();

const sbAdmin = createClient(SUPABASE_URL, SERVICE_KEY);

async function test() {
  console.log('Testing server-side query with sbAdmin:');
  const { data: comercios, error: errC } = await sbAdmin
    .from('comercios')
    .select('*')
    .order('nombre', { ascending: true });
  console.log('Comercios:', comercios?.length, errC);

  const { data: sols, error: errS } = await sbAdmin
    .from('solicitudes_modificacion')
    .select('*');
  console.log('Solicitudes:', sols?.length, errS);
}

test().catch(console.error);
