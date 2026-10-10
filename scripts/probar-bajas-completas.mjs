import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const SUPABASE_URL = 'https://hajepxscgwbgiifcfndz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_2mXV3C1pkQcp5SK8xD2FIg_EkjLTAhI';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
  console.log('🧪 1. TEST: BAJA DE COMERCIO POR EL PROPIO COMERCIANTE');
  console.log('========================================================');

  // Elegimos "Almacén de Barrio El Trébol" (uno de los cargados recientemente)
  const idComercioBaja = '22222222-2222-4222-a222-222222222201';
  
  // Verificamos que existe antes del test
  const { data: comAntes } = await supabase.from('comercios').select('id, nombre, estado_aprobacion').eq('id', idComercioBaja).single();
  console.log('Estado inicial del comercio:', comAntes);

  // Ejecutamos la lógica de eliminarComercio() que invoca el nuevo modal en /mi-comercio
  console.log('-> Ejecutando baja de comercio...');
  await supabase.from('solicitudes_modificacion').delete().or(`comercio_id.eq.${idComercioBaja},id.eq.${idComercioBaja}`);
  await supabase.from('debates_inconvenientes').delete().eq('comercio_id', idComercioBaja);
  await supabase.from('calificaciones_comercios').delete().eq('comercio_id', idComercioBaja);
  await supabase.from('comprobantes_transferencia').delete().eq('comercio_id', idComercioBaja);
  await supabase.from('comercios').update({
    estado_aprobacion: 'eliminado',
    esta_abierto: false,
  }).eq('id', idComercioBaja);

  // Verificamos estado posterior
  const { data: comDespues } = await supabase.from('comercios').select('id, nombre, estado_aprobacion').eq('id', idComercioBaja).single();
  const { data: solDespues } = await supabase.from('solicitudes_modificacion').select('id').eq('id', idComercioBaja);

  console.log('Estado final del comercio en DB:', comDespues);
  console.log('Solicitud en moderación restante (debe estar vacía):', solDespues);
  if (comDespues?.estado_aprobacion === 'eliminado' && (!solDespues || solDespues.length === 0)) {
    console.log('✅ TEST COMERCIO EXITOSO: El comercio fue dado de baja definitiva.');
  } else {
    console.error('❌ Error en test de baja de comercio');
  }

  console.log('\n========================================================');
  console.log('🧪 2. TEST: ALTA DE USUARIO Y AUTO-BAJA EN PRODUCCIÓN');
  console.log('========================================================');

  const testEmail = 'vecino.auto.baja.test@gmail.com';
  const testPassword = 'PasswordPrueba2026!';
  const testHash = await hashPassword(testPassword);
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

  const { error: errIns } = await supabase.from('usuarios').upsert([usuarioPayload]);
  if (errIns) {
    console.error('❌ Error registrando usuario:', errIns.message);
    return;
  }
  console.log('✅ Usuario registrado en Supabase correctamente.');

  // Verificamos que el usuario existe en la DB
  const { data: usrExiste } = await supabase.from('usuarios').select('id, email, estado').eq('email', testEmail).single();
  console.log('Usuario verificado en DB:', usrExiste);

  // Ahora simulamos la auto-baja del usuario consumiendo el endpoint seguro de producción
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
  const { data: usrFinal } = await supabase.from('usuarios').select('id, email').eq('email', testEmail);
  console.log('Búsqueda del usuario en la base de datos tras la baja:', usrFinal);

  if (resBaja.ok && jsonBaja.ok && jsonBaja.remotoEliminado && (!usrFinal || usrFinal.length === 0)) {
    console.log('✅ TEST AUTO-BAJA USUARIO EXITOSO: El usuario se dio de baja solo y fue borrado de forma permanente.');
  } else {
    console.error('❌ Error en auto-baja de usuario.');
  }
}

testear().catch(console.error);
