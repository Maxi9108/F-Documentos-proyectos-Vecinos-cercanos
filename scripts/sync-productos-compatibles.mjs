import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getEnvVar(name) {
  if (process.env[name]) return process.env[name];
  const envPath = path.resolve(__dirname, '../apps/pwa/.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const match = content.match(new RegExp(`^${name}=(.*)$`, 'm'));
    if (match) return match[1].trim().replace(/^['"]|['"]$/g, '');
  }
  return '';
}

const SUPABASE_URL = getEnvVar('NEXT_PUBLIC_SUPABASE_URL') || 'https://hajepxscgwbgiifcfndz.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = getEnvVar('SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Falta la clave SUPABASE_SERVICE_ROLE_KEY en el entorno o en apps/pwa/.env.local');
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function syncProds() {
  const { data: sols } = await supabaseAdmin.from('solicitudes_modificacion').select('*');
  console.log('Sols count:', sols?.length);
  
  const allProds = [];
  for (const s of sols || []) {
    if (s.cambios?.productos) {
      const updatedProds = s.cambios.productos.map((p, idx) => {
        // Ensure UUID
        const uuid = (p.id && p.id.includes('-') && p.id.length === 36) ? p.id : crypto.randomUUID();
        return {
          ...p,
          id: uuid,
        };
      });

      // Update in solicitudes_modificacion
      s.cambios.productos = updatedProds;
      await supabaseAdmin.from('solicitudes_modificacion').update({ cambios: s.cambios }).eq('id', s.id);

      updatedProds.forEach(p => {
        allProds.push({
          id: p.id,
          comercio_id: s.comercio_id,
          nombre: p.nombre,
          precio: p.precio,
          es_oferta: p.es_oferta ?? false,
          precio_oferta: p.precio_oferta || null,
        });
      });
    }
  }

  console.log('Total products to upsert into productos table:', allProds.length);
  const { error } = await supabaseAdmin.from('productos').upsert(allProds);
  console.log('Upsert productos result:', error ? error.message : 'SUCCESS!');
}

syncProds().catch(console.error);
