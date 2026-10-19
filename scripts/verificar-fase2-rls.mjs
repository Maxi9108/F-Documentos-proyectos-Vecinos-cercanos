import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hajepxscgwbgiifcfndz.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_2mXV3C1pkQcp5SK8xD2FIg_EkjLTAhI';

const sbAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testearRLS() {
  console.log('========================================================');
  console.log('🛡️  VERIFICACIÓN DE SEGURIDAD ROW LEVEL SECURITY (RLS)');
  console.log('========================================================');

  // 1. Lectura pública (debe estar permitida para comercios y catálogo)
  const { data: comercios, error: errSelect } = await sbAnon
    .from('comercios')
    .select('id, nombre, estado_aprobacion')
    .limit(3);

  if (errSelect) {
    console.log('❌ Error inesperado en lectura pública de comercios:', errSelect.message);
  } else {
    console.log(`✅ Lectura pública de comercios: OK (${comercios?.length || 0} recibidos).`);
  }

  const { data: productos, error: errProd } = await sbAnon
    .from('productos')
    .select('id, nombre, precio')
    .limit(3);

  if (errProd) {
    console.log('❌ Error en catálogo de productos:', errProd.message);
  } else {
    console.log(`✅ Lectura pública del catálogo de productos: OK (${productos?.length || 0} recibidos).`);
  }

  // 2. Intento de modificación NO autorizada por usuario anónimo (debe ser bloqueado o retornar 0 filas modificadas)
  if (comercios && comercios.length > 0) {
    const comTest = comercios[0];
    const { data: modData, error: errMod } = await sbAnon
      .from('comercios')
      .update({ descripcion: 'INTENTO_HACK_ANONIMO_' + Date.now() })
      .eq('id', comTest.id)
      .select();

    if (errMod || !modData || modData.length === 0) {
      console.log('🛡️  UPDATE anónimo bloqueado por RLS: Éxito (ninguna fila fue vulnerada).');
    } else {
      console.log('⚠️  ALERTA: El usuario anónimo pudo modificar un comercio ajeno.');
    }

    // 3. Intento de borrado no autorizado
    const { data: delData, error: errDel } = await sbAnon
      .from('comercios')
      .delete()
      .eq('id', comTest.id)
      .select();

    if (errDel || !delData || delData.length === 0) {
      console.log('🛡️  DELETE anónimo bloqueado por RLS: Éxito (ninguna fila fue eliminada).');
    } else {
      console.log('⚠️  ALERTA: El usuario anónimo pudo eliminar un comercio.');
    }
  }

  console.log('========================================================');
}

testearRLS().catch(console.error);
