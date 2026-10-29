import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import { getServiceKey } from './get-service-key.mjs';

const SUPABASE_URL = 'https://hajepxscgwbgiifcfndz.supabase.co';
const SUPABASE_SERVICE_KEY = getServiceKey();

const sbAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const SALT_SISTEMA = 'neofaro_secure_salt_v1_2026_';
function hashPasswordNode(password) {
  const clean = password.trim();
  if (!clean) return '';
  return createHash('sha256').update(SALT_SISTEMA + clean).digest('hex');
}
const HASH_123 = hashPasswordNode('123');

const ID_COMERCIO = '99999999-9999-4999-a999-999999999901';

async function verificarEstadoDB(etiqueta) {
  const { data: c } = await sbAdmin
    .from('comercios')
    .select('id, nombre, telefono, esta_abierto, estado_aprobacion')
    .eq('id', ID_COMERCIO)
    .single();

  const { data: sol } = await sbAdmin
    .from('solicitudes_modificacion')
    .select('comercio_nombre, cambios, estado')
    .eq('comercio_id', ID_COMERCIO)
    .single();

  console.log(`\n--------------------------------------------------------------`);
  console.log(`📊 ESTADO EN BASE DE DATOS TRAS: [${etiqueta}]`);
  console.log(`--------------------------------------------------------------`);
  console.log(`  Comercio: ${c?.nombre}`);
  console.log(`  Teléfono: ${c?.telefono} (en metadatos: ${sol?.cambios?.telefono})`);
  console.log(`  Instagram: ${sol?.cambios?.instagram || '(sin instagram)'}`);
  console.log(`  Tipo Atención: 👉 ${sol?.cambios?.tipo_atencion} 👈`);
  console.log(`  Radio Entrega: ${sol?.cambios?.radio_entrega_metros} metros`);
  console.log(`  Descripción Entrega: "${sol?.cambios?.zona_envio_descripcion || 'N/A'}"`);
  console.log(`--------------------------------------------------------------\n`);
  return { c, sol };
}

async function ejecutarPruebaCicloVida() {
  console.log('================================================================');
  console.log('🧪 INICIANDO TEST COMPLETO DE CICLO DE VIDA DE UN COMERCIO');
  console.log('   Paso 1: Carga inicial (Local Físico + Envíos / "ambos")');
  console.log('   Paso 2: Modificación de Instagram y Teléfono');
  console.log('   Paso 3: Transición a "Solo Físico"');
  console.log('   Paso 4: Transición a "Solo Envíos"');
  console.log('================================================================');

  const ahora = new Date().toISOString();

  // =========================================================================
  // PASO 1: ALTA INICIAL COMO LOCAL FÍSICO CON ENVÍOS ("ambos")
  // =========================================================================
  console.log('\n▶ PASO 1: Registrando comercio inicial con "ambos" (Local + Delivery)...');

  const comercioInicial = {
    id: ID_COMERCIO,
    nombre: 'Pizzería & Empanadas La Esquina',
    rubro: 'Gastronomía',
    tipo_atencion: 'ambos', // HÍBRIDO INICIAL
    radio_entrega_metros: 3500, // 3.5 km
    alcance_envio: 'radio',
    zona_envio_descripcion: 'Cobertura 3.5 km a la redonda: salón abierto y delivery express.',
    direccion: 'Av. San Martín 1850, Grand Bourg',
    localidad: 'Grand Bourg',
    telefono: '+5491140001111', // Teléfono inicial
    whatsapp: '+5491140001111',
    instagram: '@laesquina_inicial', // Instagram inicial
    email: 'laesquina.test@neofaro.app',
    email_comercio: 'laesquina.test@neofaro.app',
    password_comercio: HASH_123,
    descripcion: 'Pizzas al molde, empanadas caseras y salón para cenar. También enviamos a domicilio.',
    latitud: -34.4840,
    longitud: -58.7150,
    esta_abierto: true,
    nivel: 'standar',
    estado_aprobacion: 'aprobado',
  };

  // Guardar en tabla base
  await sbAdmin.from('comercios').upsert([
    {
      id: comercioInicial.id,
      nombre: comercioInicial.nombre,
      rubro: comercioInicial.rubro,
      direccion: comercioInicial.direccion,
      telefono: comercioInicial.telefono,
      latitud: comercioInicial.latitud,
      longitud: comercioInicial.longitud,
      esta_abierto: true,
      estado_aprobacion: 'aprobado',
      nivel: 'standar',
      fecha_solicitud: ahora,
      aprobado_por: 'admin@neofaro.app',
      fecha_aprobacion: ahora,
    },
  ]);

  // Guardar en solicitudes_modificacion
  await sbAdmin.from('solicitudes_modificacion').upsert([
    {
      id: comercioInicial.id,
      comercio_id: comercioInicial.id,
      comercio_nombre: comercioInicial.nombre,
      cambios: { ...comercioInicial, tipo_solicitud: 'alta_nuevo_comercio' },
      estado: 'aprobado',
      fecha_solicitud: ahora,
      aprobado_por: 'admin@neofaro.app',
      fecha_aprobacion: ahora,
    },
  ]);

  await verificarEstadoDB('PASO 1: ALTA INICIAL (AMBOS)');

  // =========================================================================
  // PASO 2: MODIFICACIÓN DE INSTAGRAM Y TELÉFONO
  // =========================================================================
  console.log('\n▶ PASO 2: Modificando Instagram y Teléfono de contacto...');
  const nuevoTelefono = '+5491149992222';
  const nuevoInstagram = '@laesquina_oficial_gourmet';

  // 1. Actualizar teléfono en tabla base
  await sbAdmin
    .from('comercios')
    .update({ telefono: nuevoTelefono })
    .eq('id', ID_COMERCIO);

  // 2. Actualizar en solicitudes_modificacion
  const { data: solP2 } = await sbAdmin
    .from('solicitudes_modificacion')
    .select('cambios')
    .eq('comercio_id', ID_COMERCIO)
    .single();

  const cambiosP2 = {
    ...(solP2?.cambios || {}),
    telefono: nuevoTelefono,
    whatsapp: nuevoTelefono,
    instagram: nuevoInstagram,
    fecha_ultima_modificacion: new Date().toISOString(),
  };

  await sbAdmin
    .from('solicitudes_modificacion')
    .update({ cambios: cambiosP2 })
    .eq('comercio_id', ID_COMERCIO);

  await verificarEstadoDB('PASO 2: MODIFICACIÓN DE INSTAGRAM Y TELÉFONO');

  // =========================================================================
  // PASO 3: PASAR A SER UN COMERCIO "SOLO FÍSICO"
  // =========================================================================
  console.log('\n▶ PASO 3: Cambiando modalidad a SOLO FÍSICO (tipo_atencion = local_fisico)...');

  // Al pasar a solo físico: radio de entrega pasa a 0 y se anulan los envíos
  const cambiosP3 = {
    ...cambiosP2,
    tipo_atencion: 'local_fisico',
    radio_entrega_metros: 0,
    zona_envio_descripcion: 'Atención presencial exclusiva en el local. Retiro por mostrador.',
    alcance_envio: undefined,
  };

  await sbAdmin
    .from('solicitudes_modificacion')
    .update({ cambios: cambiosP3 })
    .eq('comercio_id', ID_COMERCIO);

  await verificarEstadoDB('PASO 3: TRANSICIÓN A SOLO FÍSICO');

  // =========================================================================
  // PASO 4: PASAR A SER UN COMERCIO "SOLO DE ENVÍOS"
  // =========================================================================
  console.log('\n▶ PASO 4: Cambiando modalidad a SOLO DE ENVÍOS (tipo_atencion = solo_envio)...');

  // Al pasar a solo envíos: se reactiva radio de reparto y no hay atención presencial
  const cambiosP4 = {
    ...cambiosP3,
    tipo_atencion: 'solo_envio',
    radio_entrega_metros: 4500, // 4.5 km
    alcance_envio: 'radio',
    zona_envio_descripcion: 'Exclusivo delivery express a domicilio en Grand Bourg y alrededores. Sin salón presencial.',
  };

  await sbAdmin
    .from('solicitudes_modificacion')
    .update({ cambios: cambiosP4 })
    .eq('comercio_id', ID_COMERCIO);

  await verificarEstadoDB('PASO 4: TRANSICIÓN A SOLO ENVÍOS');

  console.log('================================================================');
  console.log('🎉 PRUEBA DE CICLO DE VIDA COMPLETADA CON ÉXITO');
  console.log('================================================================');
}

ejecutarPruebaCicloVida().catch(console.error);
