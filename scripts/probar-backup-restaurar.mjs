import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hajepxscgwbgiifcfndz.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Falta la variable SUPABASE_SERVICE_ROLE_KEY en el entorno.');
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function probarBackupYRestaurar() {
  console.log('========================================================');
  console.log('🧪 TEST: BACKUP Y RESTAURACIÓN DE COMERCIOS Y USUARIOS');
  console.log('========================================================');

  // 1. Simular la extracción de respaldo (GET)
  console.log('-> 1. Extrayendo comercios y usuarios actuales de Supabase...');
  const { data: comerciosActuales, error: errCom } = await supabaseAdmin
    .from('comercios')
    .select('*');

  const { data: usuariosActuales, error: errUsr } = await supabaseAdmin
    .from('usuarios')
    .select('*');

  if (errCom || errUsr) {
    console.error('❌ Error al consultar Supabase:', errCom?.message || errUsr?.message);
    process.exit(1);
  }

  console.log(`✔ Comercios en DB: ${comerciosActuales.length}`);
  console.log(`✔ Usuarios en DB: ${usuariosActuales.length}`);

  const backupSimulado = {
    app: 'NeoFaro (Vecin@s Conectad@s)',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    datos: {
      comercios: comerciosActuales,
      usuarios: usuariosActuales,
    },
  };

  // 2. Crear registros de prueba para verificar que la restauración los inserte
  const testComercioId = crypto.randomUUID();
  const testUserId = 'usr_bk_test_' + Date.now();

  const comercioNuevoTest = {
    id: testComercioId,
    nombre: 'Comercio Respaldo E2E Test',
    rubro: 'Tecnología',
    direccion: 'Av. Libertador 5000',
    telefono: '+5491122334455',
    esta_abierto: true,
    creado_en: new Date().toISOString(),
    estado_aprobacion: 'aprobado',
    nivel: 'gold',
  };

  const usuarioNuevoTest = {
    id: testUserId,
    email: `backup.test.${Date.now()}@neofaro.test`,
    nombre: 'Usuario Respaldo E2E Test',
    rol: 'usuario',
    estado: 'activo',
    motivo_estado: 'Creado para validación de restauración de BD',
    fecha_registro: new Date().toISOString(),
    ultimo_acceso: new Date().toISOString(),
    verificado: true,
    visitas: 5,
  };

  const archivoRespaldoAImportar = {
    app: 'NeoFaro (Vecin@s Conectad@s)',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    datos: {
      comercios: [...comerciosActuales, comercioNuevoTest],
      usuarios: [...usuariosActuales, usuarioNuevoTest],
    },
  };

  console.log('\n-> 2. Ejecutando restauración (upsert) en Supabase con los nuevos registros...');

  // Upsert comercios
  const { error: errUpsertCom } = await supabaseAdmin
    .from('comercios')
    .upsert(archivoRespaldoAImportar.datos.comercios, { onConflict: 'id' });

  if (errUpsertCom) {
    console.error('❌ Error restaurando comercios:', errUpsertCom.message);
    process.exit(1);
  }
  console.log('✅ Comercios restaurados / insertados sin conflictos.');

  // Upsert usuarios
  const { error: errUpsertUsr } = await supabaseAdmin
    .from('usuarios')
    .upsert(archivoRespaldoAImportar.datos.usuarios, { onConflict: 'id' });

  if (errUpsertUsr) {
    console.error('❌ Error restaurando usuarios:', errUpsertUsr.message);
    process.exit(1);
  }
  console.log('✅ Usuarios restaurados / insertados sin conflictos.');

  // 3. Verificar que los registros existan
  const { data: comVerif } = await supabaseAdmin
    .from('comercios')
    .select('id, nombre, rubro')
    .eq('id', testComercioId)
    .single();

  const { data: usrVerif } = await supabaseAdmin
    .from('usuarios')
    .select('id, nombre, email')
    .eq('id', testUserId)
    .single();

  console.log('\n-> 3. Comprobación de persistencia:');
  console.log('Comercio verificado en DB:', comVerif);
  console.log('Usuario verificado en DB:', usrVerif);

  if (comVerif?.id === testComercioId && usrVerif?.id === testUserId) {
    console.log('\n🎉 ¡TEST DE RESTAURACIÓN 100% EXITOSO!');
  } else {
    console.error('\n❌ Error: los registros restaurados no se encontraron.');
  }

  // 4. Limpieza del registro de prueba
  console.log('\n-> 4. Limpiando datos de prueba...');
  await supabaseAdmin.from('comercios').delete().eq('id', testComercioId);
  await supabaseAdmin.from('usuarios').delete().eq('id', testUserId);
  console.log('✔ Limpieza completada.');
}

probarBackupYRestaurar().catch(console.error);
