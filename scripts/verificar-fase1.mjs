import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hajepxscgwbgiifcfndz.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_2mXV3C1pkQcp5SK8xD2FIg_EkjLTAhI';

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verificarFase1() {
  console.log('--- Verificando estado de la Fase 1 en Supabase ---');
  console.log('URL:', SUPABASE_URL);

  let okComercios = false;
  let okSolicitudes = false;

  // 1. Probar columna user_id en comercios
  try {
    const { data, error } = await sb.from('comercios').select('id, user_id').limit(1);
    if (error) {
      console.log('❌ Error en tabla "comercios":', error.message);
    } else {
      console.log('✅ Tabla "comercios": columna "user_id" está ACTIVA y vinculada.');
      okComercios = true;
    }
  } catch (err) {
    console.log('❌ Excepción al verificar comercios:', err.message);
  }

  // 2. Probar columna user_id en solicitudes_modificacion
  try {
    const { data, error } = await sb.from('solicitudes_modificacion').select('id, user_id').limit(1);
    if (error) {
      console.log('❌ Error en tabla "solicitudes_modificacion":', error.message);
    } else {
      console.log('✅ Tabla "solicitudes_modificacion": columna "user_id" está ACTIVA.');
      okSolicitudes = true;
    }
  } catch (err) {
    console.log('❌ Excepción al verificar solicitudes_modificacion:', err.message);
  }

  console.log('----------------------------------------------------');
  if (okComercios && okSolicitudes) {
    console.log('🎉 FASE 1 CONFIRMADA: La base de datos está lista para la Fase 2.');
    process.exit(0);
  } else {
    console.log('⚠️ Acción requerida: Copia el contenido de "supabase_fase1_user_id.sql"');
    console.log('   y ejecútalo en el SQL Editor de tu panel de Supabase:');
    console.log('   https://supabase.com/dashboard/project/hajepxscgwbgiifcfndz/sql/new');
    process.exit(1);
  }
}

verificarFase1().catch(console.error);
