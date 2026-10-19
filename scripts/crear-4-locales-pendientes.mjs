import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

const SUPABASE_URL = 'https://hajepxscgwbgiifcfndz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_2mXV3C1pkQcp5SK8xD2FIg_EkjLTAhI';
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const SALT_SISTEMA = 'neofaro_secure_salt_v1_2026_';
function hashPasswordNode(password) {
  const clean = password.trim();
  if (!clean) return '';
  return createHash('sha256').update(SALT_SISTEMA + clean).digest('hex');
}
const HASH_123 = hashPasswordNode('123');

const locales = [
  // 1. Tipo: LOCAL FÍSICO (1 oferta)
  {
    id: '44444444-4444-4444-a444-444444444401',
    nombre: 'Parrilla Don Julio - Tradición Criolla',
    rubro: 'Gastronomía',
    tipo_atencion: 'local_fisico',
    estado_aprobacion: 'pendiente',
    direccion: 'Av. Maipú 1820, Olivos, Buenos Aires',
    telefono: '+5491147911001',
    whatsapp: '+5491147911001',
    descripcion: 'Parrilla tradicional a la leña, cortes seleccionados y salón comedor familiar. Atención exclusiva en salón.',
    latitud: -34.5150,
    longitud: -58.4820,
    esta_abierto: true,
    nivel: 'standar',
    nivel_solicitado: 'standar',
    radio_entrega_metros: 0,
    zona_envio_descripcion: 'Atención presencial en salón.',
    email: 'contacto@parrilladonjulio.com',
    email_comercio: 'contacto@parrilladonjulio.com',
    password_comercio: HASH_123,
    tiene_catalogo: true,
    productos: [
      {
        id: 'prod_dj_1',
        comercio_id: '44444444-4444-4444-a444-444444444401',
        nombre: 'Asado de Tira al Carbón con Guarnición',
        descripcion: 'Corte premium de costillar a fuego lento con papas fritas o ensalada mixta.',
        precio: 12500,
        es_oferta: true,
        precio_oferta: 10000,
        descuento_porcentaje: 20,
        tipo_oferta: 'semanal',
        hora_vencimiento_oferta: new Date(Date.now() + 7 * 86400000).toISOString(),
        categoria: 'Parrilla',
      },
      {
        id: 'prod_dj_2',
        comercio_id: '44444444-4444-4444-a444-444444444401',
        nombre: 'Empanadas Criollas de Lomo Cortado a Cuchillo (Docena)',
        descripcion: 'Receta tradicional tucumana, masa casera horneada.',
        precio: 9000,
        es_oferta: false,
        categoria: 'Entradas',
      },
    ],
  },

  // 2. Tipo: SOLO ENVÍO / DARK KITCHEN (2 ofertas)
  {
    id: '44444444-4444-4444-a444-444444444402',
    nombre: 'Burger Bros Dark Kitchen',
    rubro: 'Gastronomía',
    tipo_atencion: 'solo_envio',
    estado_aprobacion: 'pendiente',
    direccion: 'Hipólito Yrigoyen 2900, Florida, Buenos Aires',
    telefono: '+5491147922002',
    whatsapp: '+5491147922002',
    descripcion: 'Smash burgers artesanales con pan de papa. Cocina exclusiva para envíos rápidos a domicilio.',
    latitud: -34.5280,
    longitud: -58.4890,
    esta_abierto: true,
    nivel: 'premium',
    nivel_solicitado: 'premium',
    radio_entrega_metros: 5000,
    zona_envio_descripcion: 'Envíos en Florida, Vicente López, Olivos y Carapachay.',
    email: 'pedidos@burgerbros.com',
    email_comercio: 'pedidos@burgerbros.com',
    password_comercio: HASH_123,
    tiene_catalogo: true,
    productos: [
      {
        id: 'prod_bb_1',
        comercio_id: '44444444-4444-4444-a444-444444444402',
        nombre: 'Doble Cheddar Smash Burger Combo',
        descripcion: 'Doble medallón 110g, cuádruple cheddar inglés, bacon crocante y salsa Bros.',
        precio: 8000,
        es_oferta: true,
        precio_oferta: 6000,
        descuento_porcentaje: 25,
        tipo_oferta: 'diaria',
        hora_vencimiento_oferta: new Date(Date.now() + 86400000).toISOString(),
        categoria: 'Burgers',
      },
      {
        id: 'prod_bb_2',
        comercio_id: '44444444-4444-4444-a444-444444444402',
        nombre: 'Papas Rústicas con Panceta y Crema de Verdeo',
        descripcion: 'Papas naturales con triple cocción, crema suave de verdeo y panceta crocante.',
        precio: 4500,
        es_oferta: true,
        precio_oferta: 3825,
        descuento_porcentaje: 15,
        tipo_oferta: 'semanal',
        hora_vencimiento_oferta: new Date(Date.now() + 7 * 86400000).toISOString(),
        categoria: 'Acompañamientos',
      },
    ],
  },

  // 3. Tipo: AMBOS (Local a la calle + Delivery) (0 ofertas)
  {
    id: '44444444-4444-4444-a444-444444444403',
    nombre: 'Almacén & Fiambrería San Martín',
    rubro: 'Almacén',
    tipo_atencion: 'ambos',
    estado_aprobacion: 'pendiente',
    direccion: 'Av. Santa Fe 1950, Martínez, Buenos Aires',
    telefono: '+5491147933003',
    whatsapp: '+5491147933003',
    descripcion: 'Fiambres seleccionados de Tandil, quesos de campo, vinos boutique y picadas para compartir. Atención en mostrador y delivery.',
    latitud: -34.4950,
    longitud: -58.5020,
    esta_abierto: true,
    nivel: 'gold',
    nivel_solicitado: 'gold',
    radio_entrega_metros: 4000,
    zona_envio_descripcion: 'Martínez, Acassuso y San Isidro.',
    email: 'almacensanmartin@gmail.com',
    email_comercio: 'almacensanmartin@gmail.com',
    password_comercio: HASH_123,
    tiene_catalogo: true,
    productos: [
      {
        id: 'prod_sm_1',
        comercio_id: '44444444-4444-4444-a444-444444444403',
        nombre: 'Tabla de Picada Gourmet Tandil (Para 4)',
        descripcion: 'Jamón crudo reserva, salame tandilero, bondiola, queso fontina, pategrás y aceitunas rellenas.',
        precio: 18000,
        es_oferta: false,
        categoria: 'Picadas',
      },
      {
        id: 'prod_sm_2',
        comercio_id: '44444444-4444-4444-a444-444444444403',
        nombre: 'Vino Malbec Reserva Valle de Uco 750ml',
        descripcion: 'Cosecha seleccionada, crianza 12 meses en roble francés.',
        precio: 7500,
        es_oferta: false,
        categoria: 'Bebidas',
      },
    ],
  },

  // 4. Tipo: FARMACIA DE TURNO (rubro Farmacia, 24 hs) (0 ofertas)
  {
    id: '44444444-4444-4444-a444-444444444404',
    nombre: 'Farmacia Central de Turno 24hs',
    rubro: 'Farmacia',
    tipo_atencion: 'local_fisico',
    esta_de_turno: true,
    estado_aprobacion: 'pendiente',
    direccion: 'Belgrano 520, San Isidro, Buenos Aires',
    telefono: '+5491147944004',
    whatsapp: '+5491147944004',
    descripcion: 'Farmacia oficial de turno abierta las 24 horas. Medicamentos bajo receta, dermocosmética y primeros auxilios.',
    latitud: -34.4720,
    longitud: -58.5110,
    esta_abierto: true,
    nivel: 'standar',
    nivel_solicitado: 'standar',
    radio_entrega_metros: 0,
    zona_envio_descripcion: 'Atención por ventanilla de turno 24 hs.',
    email: 'farmaciacentral24hs@gmail.com',
    email_comercio: 'farmaciacentral24hs@gmail.com',
    password_comercio: HASH_123,
    tiene_catalogo: true,
    productos: [
      {
        id: 'prod_fc_1',
        comercio_id: '44444444-4444-4444-a444-444444444404',
        nombre: 'Termómetro Digital Infrarrojo Sin Contacto',
        descripcion: 'Medición instantánea en 1 segundo con pantalla LCD retroiluminada y alarma de fiebre.',
        precio: 14500,
        es_oferta: false,
        categoria: 'Salud',
      },
      {
        id: 'prod_fc_2',
        comercio_id: '44444444-4444-4444-a444-444444444404',
        nombre: 'Protector Solar Facial FPS 50+ Dermocosmética 50ml',
        descripcion: 'Fórmula toque seco, amplio espectro UVA/UVB, resistente al agua y apto pieles sensibles.',
        precio: 11200,
        es_oferta: false,
        categoria: 'Dermocosmética',
      },
    ],
  },
];

async function main() {
  console.log('--- CARGANDO 4 LOCALES EN ESTADO PENDIENTE CON PRODUCTOS Y OFERTAS ---');

  for (const loc of locales) {
    const payloadBase = {
      id: loc.id,
      nombre: loc.nombre,
      rubro: loc.rubro,
      direccion: loc.direccion,
      telefono: loc.telefono,
      latitud: loc.latitud,
      longitud: loc.longitud,
      esta_abierto: loc.esta_abierto,
      estado_aprobacion: 'pendiente',
      nivel: loc.nivel,
      fecha_solicitud: new Date().toISOString(),
      aprobado_por: null,
      fecha_aprobacion: null,
    };

    // Upsert en tabla comercios
    const { error: errCom } = await sb.from('comercios').upsert([payloadBase]);
    if (errCom) console.error('Error en comercios:', errCom.message);

    // Upsert en solicitudes_modificacion
    const solPayload = {
      id: loc.id,
      comercio_id: loc.id,
      comercio_nombre: loc.nombre,
      cambios: {
        ...loc,
        estado_aprobacion: 'pendiente',
        tipo_solicitud: 'alta_nuevo_comercio',
      },
      estado: 'pendiente',
      fecha_solicitud: new Date().toISOString(),
      aprobado_por: null,
      fecha_aprobacion: null,
    };
    const { error: errSol } = await sb.from('solicitudes_modificacion').upsert([solPayload]);
    if (errSol) console.warn('Aviso en solicitudes:', errSol.message);

    console.log(`✔ [${loc.tipo_atencion}] ${loc.nombre} cargado como PENDIENTE con ${loc.productos.length} productos.`);
  }

  console.log('\n🎉 ¡Los 4 comercios fueron creados y están listos para ser aprobados por el Administrador!');
}

main().catch(console.error);
