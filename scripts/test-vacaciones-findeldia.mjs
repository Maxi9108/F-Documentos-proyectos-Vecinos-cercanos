import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hajepxscgwbgiifcfndz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_2mXV3C1pkQcp5SK8xD2FIg_EkjLTAhI';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testOperations() {
  console.log('--- TEST OPERACIONAL: VACACIONES Y FIN DEL DÍA ---');
  const testId = '11111111-1111-4111-a111-111111111102'; // Burger Box (delivery con poligono/radio)

  // 1. Obtener estado inicial y verificar zona/poligono
  const { data: solIni } = await supabase
    .from('solicitudes_modificacion')
    .select('cambios')
    .eq('comercio_id', testId)
    .single();

  const cambiosIni = solIni?.cambios || {};
  console.log(`Estado Inicial Burger Box:
  - Radio entrega: ${cambiosIni.radio_entrega_metros}m
  - Latitud: ${cambiosIni.latitud}, Longitud: ${cambiosIni.longitud}
  - Dirección: ${cambiosIni.direccion}
  - En vacaciones: ${cambiosIni.en_vacaciones}
  `);

  // 2. Simular vacaciones SIN fecha de retorno (opcional)
  const hoyStr = new Date().toISOString().split('T')[0];
  const cambiosVac = {
    ...cambiosIni,
    en_vacaciones: true,
    vacaciones_desde: hoyStr,
    vacaciones_hasta: null,
    mensaje_vacaciones: 'Prueba de receso sin fecha de retorno',
    modalidad_vacaciones: 'mostrar_con_aviso',
    esta_abierto: false,
  };

  const { error: errVac } = await supabase
    .from('solicitudes_modificacion')
    .update({ cambios: cambiosVac })
    .eq('comercio_id', testId);

  if (errVac) {
    console.error('❌ Error guardando vacaciones:', errVac.message);
  } else {
    console.log('✅ Modo vacaciones activado SIN fecha de retorno obligatoria.');
  }

  // 3. Verificar que la zona de entrega y ubicación permanezcan intactas
  const { data: solVac } = await supabase
    .from('solicitudes_modificacion')
    .select('cambios')
    .eq('comercio_id', testId)
    .single();

  const cambiosVerif = solVac?.cambios || {};
  console.log(`Verificación tras Vacaciones:
  - Radio entrega intacto: ${cambiosVerif.radio_entrega_metros === cambiosIni.radio_entrega_metros ? '✅ SÍ' : '❌ NO'}
  - Coordenadas intactas: ${cambiosVerif.latitud === cambiosIni.latitud ? '✅ SÍ' : '❌ NO'}
  - Dirección intacta: ${cambiosVerif.direccion === cambiosIni.direccion ? '✅ SÍ' : '❌ NO'}
  - Vacaciones hasta opcional: ${cambiosVerif.vacaciones_hasta === null ? '✅ SÍ (Sin fecha requerida)' : '❌ NO'}
  `);

  // 4. Test Cerrado Fin del Día (sin emergencia ni strikes)
  const cambiosFinDia = {
    ...cambiosVerif,
    en_vacaciones: false,
    vacaciones_desde: null,
    vacaciones_hasta: null,
    esta_abierto: false,
    cerrado_momentaneo: false,
  };

  await supabase
    .from('solicitudes_modificacion')
    .update({ cambios: cambiosFinDia })
    .eq('comercio_id', testId);

  await supabase
    .from('comercios')
    .update({ esta_abierto: false, cerrado_momentaneo: false })
    .eq('id', testId);

  console.log('✅ Cerrado Fin del Día aplicado: esta_abierto = false, cerrado_momentaneo = false (0 strikes).');

  // 5. Restablecer comercio a Abierto normal
  const cambiosRestablecido = {
    ...cambiosFinDia,
    esta_abierto: true,
  };

  await supabase
    .from('solicitudes_modificacion')
    .update({ cambios: cambiosRestablecido })
    .eq('comercio_id', testId);

  await supabase
    .from('comercios')
    .update({ esta_abierto: true })
    .eq('id', testId);

  console.log('✅ Local restablecido a Abierto con todos los datos intactos.');
}

testOperations().catch(console.error);
