import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hajepxscgwbgiifcfndz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_2mXV3C1pkQcp5SK8xD2FIg_EkjLTAhI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const comerciosPrueba = [
  // --- CATEGORÍA 1: GASTRONOMÍA (3 comercios) ---
  {
    id: '11111111-1111-4111-a111-111111111101',
    nombre: 'La Casona Parrilla & Brasas',
    rubro: 'Gastronomía',
    tipo_atencion: 'local_fisico',
    estado_aprobacion: 'aprobado',
    direccion: 'Av. Maipú 2140, Olivos, Buenos Aires',
    telefono: '+5491147910001',
    whatsapp: '+5491147910001',
    descripcion: 'Parrilla criolla a la leña, cortes seleccionados y salón comedor familiar.',
    latitud: -34.5123,
    longitud: -58.4812,
    esta_abierto: true,
    nivel: 'standar',
    radio_entrega_metros: 0,
    zona_envio_descripcion: 'Solo atención presencial y retiro en salón.',
    email: 'contacto@lacasonaparrilla.com',
  },
  {
    id: '11111111-1111-4111-a111-111111111102',
    nombre: 'Burger Box Delivery Dark Kitchen',
    rubro: 'Gastronomía',
    tipo_atencion: 'solo_envio',
    estado_aprobacion: 'pendiente', // PENDIENTE 1
    direccion: 'Hipólito Yrigoyen 3450, Florida, Buenos Aires',
    telefono: '+5491147920002',
    whatsapp: '+5491147920002',
    descripcion: 'Smash burgers artesanales, papas triple cocción. Exclusivo delivery express a domicilio.',
    latitud: -34.5298,
    longitud: -58.4901,
    esta_abierto: true,
    nivel: 'standar',
    radio_entrega_metros: 4500,
    zona_envio_descripcion: 'Cobertura 4.5 km a la redonda: Florida, Vicente López y Olivos.',
    email: 'burgerbox.delivery@gmail.com',
  },
  {
    id: '11111111-1111-4111-a111-111111111103',
    nombre: 'Pizzería y Pastas Don Antonio',
    rubro: 'Gastronomía',
    tipo_atencion: 'ambos',
    estado_aprobacion: 'aprobado',
    direccion: 'Calle 25 de Mayo 890, San Isidro, Buenos Aires',
    telefono: '+5491147930003',
    whatsapp: '+5491147930003',
    descripcion: 'Pizzas al horno de barro y pastas caseras. Salón comedor y envíos rápidos en la zona.',
    latitud: -34.4715,
    longitud: -58.5085,
    esta_abierto: true,
    nivel: 'premium',
    radio_entrega_metros: 3500,
    zona_envio_descripcion: 'San Isidro centro, Acassuso y Martínez.',
    email: 'donantonio.pizzeria@gmail.com',
  },

  // --- CATEGORÍA 2: ALMACÉN (3 comercios) ---
  {
    id: '22222222-2222-4222-a222-222222222201',
    nombre: 'Almacén de Barrio El Trébol',
    rubro: 'Almacén',
    tipo_atencion: 'local_fisico',
    estado_aprobacion: 'pendiente', // PENDIENTE 2
    direccion: 'Av. Santa Fe 1520, Martínez, Buenos Aires',
    telefono: '+5491147940004',
    whatsapp: '+5491147940004',
    descripcion: 'Fiambres de campo, quesos artesanales, panificados frescos y fiambrería tradicional.',
    latitud: -34.4921,
    longitud: -58.5012,
    esta_abierto: true,
    nivel: 'standar',
    radio_entrega_metros: 0,
    zona_envio_descripcion: 'Atención presencial en local de barrio.',
    email: 'almaceneltrebol@gmail.com',
  },
  {
    id: '22222222-2222-4222-a222-222222222202',
    nombre: 'Distribuidora Express Bebidas y Snacks',
    rubro: 'Almacén',
    tipo_atencion: 'solo_envio',
    estado_aprobacion: 'aprobado',
    direccion: 'Av. Centenario 2600, Beccar, Buenos Aires',
    telefono: '+5491147950005',
    whatsapp: '+5491147950005',
    descripcion: 'Packs de gaseosas, aguas saborizadas, cervezas y snacks al por mayor y menor directo a tu casa.',
    latitud: -34.4602,
    longitud: -58.5234,
    esta_abierto: true,
    nivel: 'standar',
    radio_entrega_metros: 6000,
    zona_envio_descripcion: 'Envíos en el día en Beccar, San Isidro y Victoria.',
    email: 'distribuidoraexpress@gmail.com',
  },
  {
    id: '22222222-2222-4222-a222-222222222203',
    nombre: 'Minimarket y Granja La Esperanza',
    rubro: 'Almacén',
    tipo_atencion: 'ambos',
    estado_aprobacion: 'pendiente', // PENDIENTE 3
    direccion: 'Belgrano 410, San Fernando, Buenos Aires',
    telefono: '+5491147960006',
    whatsapp: '+5491147960006',
    descripcion: 'Frutas y verduras de huerta, artículos de almacén y limpieza. Comprá en el local o pedí por WhatsApp.',
    latitud: -34.4412,
    longitud: -58.5567,
    esta_abierto: true,
    nivel: 'standar',
    radio_entrega_metros: 3000,
    zona_envio_descripcion: 'San Fernando y Virreyes.',
    email: 'granjalaesperanza@gmail.com',
  },

  // --- CATEGORÍA 3: FARMACIA (3 comercios) ---
  {
    id: '33333333-3333-4333-a333-333333333301',
    nombre: 'Farmacia San Juan Bautista',
    rubro: 'Farmacia',
    tipo_atencion: 'local_fisico',
    estado_aprobacion: 'aprobado',
    direccion: 'Av. Cazón 1120, Tigre, Buenos Aires',
    telefono: '+5491147970007',
    whatsapp: '+5491147970007',
    descripcion: 'Medicamentos bajo receta, perfumería y dermocosmética. Atención profesional personalizada.',
    latitud: -34.4251,
    longitud: -58.5794,
    esta_abierto: true,
    nivel: 'standar',
    radio_entrega_metros: 0,
    zona_envio_descripcion: 'Atención presencial en mostrador.',
    email: 'farmaciasanjuan@gmail.com',
  },
  {
    id: '33333333-3333-4333-a333-333333333302',
    nombre: 'FarmaExpress Envíos Domiciliarios',
    rubro: 'Farmacia',
    tipo_atencion: 'solo_envio',
    estado_aprobacion: 'pendiente', // PENDIENTE 4
    direccion: 'Av. Libertador 14200, Acassuso, Buenos Aires',
    telefono: '+5491147980008',
    whatsapp: '+5491147980008',
    descripcion: 'Envío prioritario de insumos de primeros auxilios, farmacia básica y cuidado infantil.',
    latitud: -34.4815,
    longitud: -58.4981,
    esta_abierto: true,
    nivel: 'standar',
    radio_entrega_metros: 5000,
    zona_envio_descripcion: 'Envíos rápidos en todo Zona Norte.',
    email: 'farmaexpress.envios@gmail.com',
  },
  {
    id: '33333333-3333-4333-a333-333333333303',
    nombre: 'Farmacia y Botica Nueva Pompeya',
    rubro: 'Farmacia',
    tipo_atencion: 'ambos',
    estado_aprobacion: 'aprobado',
    direccion: 'Av. del Libertador 2200, Vicente López, Buenos Aires',
    telefono: '+5491147990009',
    whatsapp: '+5491147990009',
    descripcion: 'Farmacia integral con laboratorio de fórmulas magistrales, dermocosmética y entrega a domicilio.',
    latitud: -34.5204,
    longitud: -58.4721,
    esta_abierto: true,
    nivel: 'gold',
    radio_entrega_metros: 4000,
    zona_envio_descripcion: 'Vicente López, Olivos y Florida Este.',
    email: 'farmacianuevapompeya@gmail.com',
  },
];

async function ejecutar() {
  console.log('🚀 Iniciando carga de 9 comercios de prueba...');
  console.log(`📋 Total a cargar: ${comerciosPrueba.length}`);

  let cargados = 0;
  for (const c of comerciosPrueba) {
    // 1. Guardar en tabla base comercios
    const payloadBase = {
      id: c.id,
      nombre: c.nombre,
      rubro: c.rubro,
      direccion: c.direccion,
      telefono: c.telefono,
      latitud: c.latitud,
      longitud: c.longitud,
      esta_abierto: c.esta_abierto,
      estado_aprobacion: c.estado_aprobacion,
      nivel: c.nivel,
      fecha_solicitud: new Date().toISOString(),
      aprobado_por: c.estado_aprobacion === 'aprobado' ? 'maxi0802@gmail.com' : null,
      fecha_aprobacion: c.estado_aprobacion === 'aprobado' ? new Date().toISOString() : null,
    };

    const { error: errBase } = await supabase.from('comercios').upsert([payloadBase]);
    if (errBase) {
      console.error(`❌ Error en comercios (${c.nombre}):`, errBase.message);
    } else {
      console.log(`✅ Base guardada: ${c.nombre} [${c.rubro} | ${c.estado_aprobacion}]`);
    }

    // 2. Guardar en solicitudes_modificacion para conservar tipo_atencion y campos extendidos
    const solPayload = {
      id: c.id,
      comercio_id: c.id,
      comercio_nombre: c.nombre,
      cambios: {
        ...c,
        tipo_solicitud: c.estado_aprobacion === 'pendiente' ? 'alta_nuevo_comercio' : 'actualizacion',
      },
      estado: c.estado_aprobacion,
      fecha_solicitud: new Date().toISOString(),
      aprobado_por: c.estado_aprobacion === 'aprobado' ? 'maxi0802@gmail.com' : null,
      fecha_aprobacion: c.estado_aprobacion === 'aprobado' ? new Date().toISOString() : null,
    };

    const { error: errSol } = await supabase.from('solicitudes_modificacion').upsert([solPayload]);
    if (errSol) {
      console.error(`❌ Error en solicitudes_modificacion (${c.nombre}):`, errSol.message);
    } else {
      console.log(`   ✨ Solicitud/Metadatos guardados (tipo_atencion: ${c.tipo_atencion})`);
      cargados++;
    }
  }

  console.log(`\n🎉 Carga finalizada: ${cargados} de ${comerciosPrueba.length} comercios registrados correctamente.`);
}

ejecutar().catch(console.error);
