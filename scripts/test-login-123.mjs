import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

const sb = createClient(
  'https://hajepxscgwbgiifcfndz.supabase.co',
  'sb_publishable_2mXV3C1pkQcp5SK8xD2FIg_EkjLTAhI'
);

const SALT_SISTEMA = 'neofaro_secure_salt_v1_2026_';

function hashPasswordNode(password) {
  const clean = password.trim();
  if (!clean) return '';
  return createHash('sha256').update(SALT_SISTEMA + clean).digest('hex');
}

async function verifyPasswordNode(candidate, stored) {
  if (!candidate || !stored) return false;
  if (candidate.trim() === stored.trim()) return true;
  return hashPasswordNode(candidate.trim()) === stored.trim();
}

async function simularLogin(identificador, password) {
  const cleanMail = identificador.includes('@') ? identificador.trim().toLowerCase() : null;
  const comercioId = !cleanMail ? identificador.trim() : null;

  let comercioEncontrado = null;

  if (comercioId) {
    const { data: cData } = await sb.from('comercios').select('*').eq('id', comercioId).maybeSingle();
    const { data: solData } = await sb.from('solicitudes_modificacion').select('*').eq('comercio_id', comercioId).maybeSingle();
    if (solData?.cambios) {
      comercioEncontrado = { ...(cData || {}), ...solData.cambios, id: comercioId };
    } else if (cData) {
      comercioEncontrado = cData;
    }
  } else if (cleanMail) {
    const { data: sols } = await sb.from('solicitudes_modificacion').select('*').limit(100);
    const sol = sols?.find(s => {
      const m1 = (s.cambios?.email || '').trim().toLowerCase();
      const m2 = (s.cambios?.email_comercio || '').trim().toLowerCase();
      return m1 === cleanMail || m2 === cleanMail;
    });
    if (sol?.cambios) {
      const targetId = sol.comercio_id || sol.id;
      const { data: cData } = await sb.from('comercios').select('*').eq('id', targetId).maybeSingle();
      comercioEncontrado = { ...(cData || {}), ...sol.cambios, id: targetId };
    }
  }

  if (!comercioEncontrado) return { ok: false, error: 'Comercio no encontrado' };
  const storedPass = comercioEncontrado.password_comercio;
  const esValida = await verifyPasswordNode(password, storedPass);
  if (!esValida) return { ok: false, error: 'Password incorrecto' };
  return { ok: true, comercio: comercioEncontrado.nombre, id: comercioEncontrado.id };
}

async function main() {
  console.log('Testing login for all 9 comercios with password "123":');
  const emails = [
    'contacto@lacasonaparrilla.com',
    'burgerbox.delivery@gmail.com',
    'donantonio.pizzeria@gmail.com',
    'almaceneltrebol@gmail.com',
    'distribuidoraexpress@gmail.com',
    'granjalaesperanza@gmail.com',
    'farmaciasanjuan@gmail.com',
    'farmaexpress.envios@gmail.com',
    'farmacianuevapompeya@gmail.com',
  ];

  for (const mail of emails) {
    const res = await simularLogin(mail, '123');
    console.log(`- ${mail} -> ${res.ok ? '✅ OK (' + res.comercio + ')' : '❌ ' + res.error}`);
  }

  console.log('\nTesting login by ID with password "123":');
  const ids = [
    '11111111-1111-4111-a111-111111111101',
    '11111111-1111-4111-a111-111111111102',
    '33333333-3333-4333-a333-333333333303'
  ];
  for (const id of ids) {
    const res = await simularLogin(id, '123');
    console.log(`- ID ${id} -> ${res.ok ? '✅ OK (' + res.comercio + ')' : '❌ ' + res.error}`);
  }
}

main().catch(console.error);
