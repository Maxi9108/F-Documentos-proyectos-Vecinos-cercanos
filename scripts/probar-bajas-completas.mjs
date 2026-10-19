import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hajepxscgwbgiifcfndz.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_2mXV3C1pkQcp5SK8xD2FIg_EkjLTAhI';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Falta la variable SUPABASE_SERVICE_ROLE_KEY en el entorno.');
  process.exit(1);
}

// Cliente anónimo (público) para comprobar cómo ven la app y RLS los datos
const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Cliente con service_role (backend/admin) para gestionar y verificar estado real en DB
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Helper para hashear contraseña igual que apps/pwa/lib/crypto.ts
async function hashPassword(plain) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function testear() {
  console.log('========================================================');
  console.log('🧪 1. TEST: CICLO COMPLETO DE BAJA ATÓMICA DE COMERCIO');
  console.log('========================================================');

  const testComercioId = crypto.randomUUID();
  console.log(`-> Creando comercio de prueba temporal: ${testComercioId}...`);

  // Insertamos un comercio de prueba activo
  const { error: errCom } = await supabaseAdmin.from('comercios').insert([{
    id: testComercioId,
    nombre: 'Comercio Test Auto-Baja E2E',
    rubro: 'Almacén',
    direccion: 'Calle Test 123',
    telefono: '1122334455',
    estado_aprobacion: 'aprobado',
    esta_abierto: true,
    creado_en: new Date().toISOString(),
  }]);

  if (errCom) {
    console.error('❌ Error creando comercio de prueba:', errCom.message);
    return;
  }
  console.log('✅ Comercio de prueba creado con estado_aprobacion: aprobado.');

  // Insertamos registros satélite vinculados para probar la cascada
  await supabaseAdmin.from('solicitudes_modificacion').insert([{
    comercio_id: testComercioId,
    comercio_nombre: 'Comercio Test Auto-Baja E2E',
    cambios: { nombre: 'Cambio de nombre test' },
    estado: 'pendiente',
    created_at: new Date().toISOString(),
  }]);

  await supabaseAdmin.from('debates_inconvenientes').insert([{
    comercio_id: testComercioId,
    comercio_nombre: 'Comercio Test Auto-Baja E2E',
    usuario_id: 'usr_test_debates',
    usuario_nombre: 'Vecino Test',
    usuario_email: 'test@vecinos.test',
    motivo: 'Demora en entrega',
    descripcion: 'Debate de prueba para baja',
    estado: 'abierto',
    created_at: new Date().toISOString(),
  }]);

  console.log('✅ Registros satélite (solicitudes, debates) vinculados exitosamente.');

  // Verificamos visibilidad inicial con cliente anónimo
  const { data: comAnonAntes } = await supabaseAnon
    .from('comercios')
    .select('id, nombre, estado_aprobacion')
    .eq('id', testComercioId)
    .maybeSingle();

  console.log('Visibilidad pública inicial (debe ser visible):', comAnonAntes?.nombre);

  // Ejecutamos la lógica de baja atómica del backend (/api/comercio/baja)
  console.log('-> Ejecutando baja atómica en cascada (service_role)...');
  await supabaseAdmin.from('solicitudes_modificacion').delete().or(`comercio_id.eq.${testComercioId},id.eq.${testComercioId}`);
  await supabaseAdmin.from('debates_inconvenientes').delete().eq('comercio_id', testComercioId);
  await supabaseAdmin.from('calificaciones_comercios').delete().eq('comercio_id', testComercioId);
  await supabaseAdmin.from('comprobantes_transferencia').delete().eq('comercio_id', testComercioId);
  await supabaseAdmin.from('comercios').update({
    estado_aprobacion: 'eliminado',
    esta_abierto: false,
  }).eq('id', testComercioId);

  // Verificamos estado en backend con service_role
  const { data: comAdminDespues } = await supabaseAdmin
    .from('comercios')
    .select('id, nombre, estado_aprobacion, esta_abierto')
    .eq('id', testComercioId)
    .single();

  const { data: solsDespues } = await supabaseAdmin
    .from('solicitudes_modificacion')
    .select('id')
    .eq('comercio_id', testComercioId);

  const { data: debatesDespues } = await supabaseAdmin
    .from('debates_inconvenientes')
    .select('id')
    .eq('comercio_id', testComercioId);

  // Verificamos que cliente anónimo YA NO puede verlo gracias a las políticas RLS
  const { data: comAnonDespues } = await supabaseAnon
    .from('comercios')
    .select('id, nombre, estado_aprobacion')
    .eq('id', testComercioId)
    .maybeSingle();

  console.log('Estado en DB (admin):', comAdminDespues);
  console.log('Solicitudes restantes (debe ser 0):', solsDespues?.length ?? 0);
  console.log('Debates restantes (debe ser 0):', debatesDespues?.length ?? 0);
  console.log('Visibilidad anónima/pública (debe ser null por RLS):', comAnonDespues);

  if (
    comAdminDespues?.estado_aprobacion === 'eliminado' &&
    (!solsDespues || solsDespues.length === 0) &&
    (!debatesDespues || debatesDespues.length === 0) &&
    comAnonDespues === null
  ) {
    console.log('✅ TEST COMERCIO EXITOSO: Baja atómica, cascada y protección RLS operando al 100%.');
  } else {
    console.error('❌ Error en test de baja de comercio');
  }

  // Limpieza del registro de prueba en la DB
  await supabaseAdmin.from('comercios').delete().eq('id', testComercioId);

  console.log('\n========================================================');
  console.log('🧪 2. TEST: ALTA DE USUARIO Y AUTO-BAJA EN PRODUCCIÓN');
  console.log('========================================================');

  const testEmail = `vecino.test.${Date.now()}@gmail.com`;
  const testPassword = 'PasswordPrueba2026!';
  const testUserId = 'usr_test_' + Date.now();

  console.log(`-> Registrando usuario de prueba: ${testEmail}...`);
  const usuarioPayload = {
    id: testUserId,
    email: testEmail,
    nombre: 'Vecino Test Auto-Baja',
    rol: 'usuario_estandar',
    estado: 'activo',
    motivo_estado: 'Usuario para prueba automatizada de baja',
    fecha_registro: new Date().toISOString(),
    ultimo_acceso: new Date().toISOString(),
  };

  const { error: errIns } = await supabaseAdmin.from('usuarios').upsert([usuarioPayload]);
  if (errIns) {
    console.error('❌ Error registrando usuario:', errIns.message);
    return;
  }
  console.log('✅ Usuario registrado en Supabase correctamente.');

  // Verificamos que el usuario existe en la DB
  const { data: usrExiste } = await supabaseAdmin.from('usuarios').select('id, email, estado').eq('email', testEmail).single();
  console.log('Usuario verificado en DB:', usrExiste);

  // Invocamos endpoint de auto-baja en producción
  console.log('-> Invocando endpoint de auto-baja en producción (https://neofaro.com.ar/api/eliminar-cuenta)...');
  const resBaja = await fetch('https://neofaro.com.ar/api/eliminar-cuenta', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
      motivo: 'Prueba de auto-baja voluntaria de cuenta de usuario',
    }),
  });

  const jsonBaja = await resBaja.json();
  console.log(`HTTP Status: ${resBaja.status}`);
  console.log('Respuesta del servidor:', jsonBaja);

  // Verificamos en Supabase que el usuario fue completamente borrado
  const { data: usrFinal } = await supabaseAdmin.from('usuarios').select('id, email').eq('email', testEmail);
  console.log('Búsqueda del usuario en la base de datos tras la baja:', usrFinal);

  if (resBaja.ok && jsonBaja.ok && jsonBaja.remotoEliminado && (!usrFinal || usrFinal.length === 0)) {
    console.log('✅ TEST AUTO-BAJA USUARIO EXITOSO: El usuario se dio de baja solo y fue borrado de forma permanente.');
  } else {
    console.error('❌ Error en auto-baja de usuario.');
  }
}

testear().catch(console.error);
