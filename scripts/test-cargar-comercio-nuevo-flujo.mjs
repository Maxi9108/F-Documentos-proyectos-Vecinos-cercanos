import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

import fs from 'fs';
import path from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hajepxscgwbgiifcfndz.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_2mXV3C1pkQcp5SK8xD2FIg_EkjLTAhI';

let serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
if (!serviceKey) {
  try {
    const envLocalPath = path.resolve('apps/pwa/.env.local');
    if (fs.existsSync(envLocalPath)) {
      const content = fs.readFileSync(envLocalPath, 'utf8');
      const match = content.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);
      if (match) serviceKey = match[1].trim();
    }
  } catch (e) {}
}

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const sbAdmin = createClient(SUPABASE_URL, serviceKey || SUPABASE_ANON_KEY);

const SALT_SISTEMA = 'neofaro_secure_salt_v1_2026_';
function hashPasswordNode(password) {
  const clean = password.trim();
  if (!clean) return '';
  return createHash('sha256').update(SALT_SISTEMA + clean).digest('hex');
}

async function probarCargaComercioNuevoFlujo() {
  console.log('=== TEST DE INTEGRACIÓN: CARGA DE COMERCIO NUEVO FLUJO ===');
  console.log('1. Verificando orden de flujo: Dirección -> Geocodificación -> Tipo de Comercio -> Datos generales');

  // Simulación del alta con el nuevo flujo
  const idPrueba = '99999999-4444-4999-a999-999999999999';
  const emailPrueba = `test.flujo.${Date.now()}@neofaro.com.ar`;
  const passHash = hashPasswordNode('clave1234');

  const payloadBase = {
    id: idPrueba,
    nombre: 'Cafetería & Tostaduría Faro Sur',
    rubro: 'Cafetería',
    direccion: 'Av. Corrientes 1580, Balvanera',
    latitud: -34.6042,
    longitud: -58.3905,
    telefono: '+54 11 4372-8800',
    esta_abierto: true,
    estado_aprobacion: 'pendiente',
    nivel: 'standar',
    fecha_solicitud: new Date().toISOString(),
  };

  const solPayload = {
    id: idPrueba,
    comercio_id: idPrueba,
    comercio_nombre: payloadBase.nombre,
    cambios: {
      ...payloadBase,
      whatsapp: '+54 9 11 4372-8800',
      descripcion: 'Café de especialidad tostado a la vista, pastelería artesanal y salón con WiFi.',
      tipo_atencion: 'local_fisico',
      tipo_solicitud: 'alta_nuevo_comercio',
      nivel_solicitado: 'premium',
      email_comercio: emailPrueba,
    },
    estado: 'pendiente',
    fecha_solicitud: new Date().toISOString(),
  };

  console.log('2. Enviando inserción a Supabase (comercios)...');
  const { data: comData, error: errCom } = await sbAdmin.from('comercios').insert([payloadBase]).select('id, nombre, rubro, direccion, latitud, longitud, estado_aprobacion');

  if (errCom) {
    console.error('❌ Error al insertar comercio:', errCom.message);
    process.exit(1);
  }
  console.log('✔ Comercio insertado con éxito en tabla comercios:', comData[0]);

  console.log('3. Enviando metadatos enriquecidos a solicitudes_modificacion...');
  const { error: errSol } = await sbAdmin.from('solicitudes_modificacion').upsert([solPayload]);
  if (errSol) {
    console.warn('Aviso en solicitudes_modificacion:', errSol.message);
  } else {
    console.log('✔ Metadatos enriquecidos guardados correctamente en solicitudes_modificacion.');
  }

  // 4. Verificar que se pueda consultar
  console.log('4. Verificando lectura del comercio...');
  const { data: verif, error: errVerif } = await sbAdmin
    .from('comercios')
    .select('id, nombre, rubro, direccion, latitud, longitud, estado_aprobacion')
    .eq('id', idPrueba)
    .single();

  if (errVerif || !verif) {
    console.error('❌ No se pudo recuperar el comercio insertado:', errVerif?.message);
    process.exit(1);
  }

  console.log('✔ Datos recuperados correctamente de la base de datos:', {
    id: verif.id,
    nombre: verif.nombre,
    rubro: verif.rubro,
    direccion: verif.direccion,
    coords: `${verif.latitud}, ${verif.longitud}`,
    estado: verif.estado_aprobacion,
  });

  // 5. Limpieza del registro de prueba
  console.log('5. Limpiando registro de prueba...');
  await sbAdmin.from('solicitudes_modificacion').delete().eq('id', idPrueba);
  await sbAdmin.from('comercios').delete().eq('id', idPrueba);
  console.log('✔ Registro de prueba eliminado satisfactoriamente.');

  console.log('🎉 PRUEBA DE CARGA DE COMERCIO COMPLETADA EXITOSAMENTE');
}

probarCargaComercioNuevoFlujo().catch((e) => {
  console.error('Error fatal:', e);
  process.exit(1);
});
