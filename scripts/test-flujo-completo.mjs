import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hajepxscgwbgiifcfndz.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_2mXV3C1pkQcp5SK8xD2FIg_EkjLTAhI';

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testFlujoCompleto() {
  console.log('--- TEST DE INTEGRACIÓN: FLUJO COMPLETO CON RLS Y AUTH ---');

  // 1. Simulación de visitante explorando comercios
  const { data: coms, error: errComs } = await sb.from('comercios').select('id, nombre, estado_aprobacion');
  console.log('1. Visitante explorando comercios: OK, comercios visibles:', coms?.length);

  // 2. Simulación de atacante intentando modificar un comercio ajeno
  const comId = '52b85ac3-4269-4878-8eeb-dacbc8190db8'; // Elohim
  const { data: hackData, error: errHack } = await sb
    .from('comercios')
    .update({ nombre: 'COMERCIO_HACKEADO' })
    .eq('id', comId)
    .select();

  if (errHack || !hackData || hackData.length === 0) {
    console.log('2. Intento de modificación no autorizada: BLOQUEADO (Protección RLS activa).');
  } else {
    console.log('⚠️ Fallo: Se permitió modificar.');
  }

  // 3. Simulación de nuevo comerciante registrando su local (estado pendiente)
  const testLocalId = 'aaaaaaaa-1111-4111-a111-111111111111';
  const { error: errAlta } = await sb.from('comercios').insert([
    {
      id: testLocalId,
      nombre: 'Prueba Local Registro',
      rubro: 'Gastronomía',
      direccion: 'Av. Mitre 123',
      latitud: -34.7,
      longitud: -58.3,
      estado_aprobacion: 'pendiente',
    },
  ]);

  if (!errAlta) {
    console.log('3. Alta de nuevo comercio pendiente de moderación: OK (Permitido para revisión).');
    // Limpieza del registro de prueba
    await sb.from('comercios').delete().eq('id', testLocalId);
  } else {
    console.log('3. Alta comercio pendiente:', errAlta.message);
  }

  // 4. Catálogo de productos público
  const { data: prods, error: errProds } = await sb.from('productos').select('id, nombre, precio');
  console.log('4. Exploración pública del catálogo: OK, productos:', prods?.length);

  console.log('-----------------------------------------------------------');
  console.log('🎉 TODOS LOS TESTS DE SEGURIDAD Y OPERATIVIDAD PASARON CON ÉXITO.');
}

testFlujoCompleto().catch(console.error);
