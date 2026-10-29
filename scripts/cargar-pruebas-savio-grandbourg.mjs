import { createClient } from '@supabase/supabase-js';
import { createHash, randomUUID } from 'crypto';
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

const comerciosPrueba = [
  // =========================================================================
  // MAQUINISTA SAVIO - TIPO 1: LOCAL FÍSICO (Presencial puro / Mostrador)
  // =========================================================================
  {
    id: '77777777-7777-4777-a777-777777777701',
    nombre: 'Panadería & Confitería El Trigal de Savio',
    rubro: 'Panadería',
    tipo_atencion: 'local_fisico', // TIPO 1
    radio_entrega_metros: 0,
    alcance_envio: undefined,
    zona_envio_descripcion: 'Atención presencial en salón y mostrador. Retiro en puerta (Take Away).',
    direccion: 'Calle Juan XXIII 850, Maquinista Savio',
    localidad: 'Maquinista Savio',
    telefono: '+5491148802201',
    whatsapp: '+5491148802201',
    email: 'eltrigal.savio@neofaro.test',
    email_comercio: 'eltrigal.savio@neofaro.test',
    password_comercio: HASH_123,
    descripcion: 'Panadería artesanal a la vista, facturas de manteca recién horneadas, pan de campo al horno de leña y tortas para fiestas.',
    latitud: -34.4362,
    longitud: -58.7845,
    esta_abierto: true,
    esta_de_turno: false,
    nivel: 'standar',
    nivel_solicitado: 'standar',
    estado_aprobacion: 'aprobado',
    tiene_catalogo: true,
    horarios_config: {
      modo: 'bloques',
      bloques: {
        lunesViernes: { abierto: true, turnos: [{ abre: '07:00', cierra: '20:30', esTrasnoche: false }] },
        sabado: { abierto: true, turnos: [{ abre: '07:00', cierra: '20:30', esTrasnoche: false }] },
        domingoFeriados: { abierto: true, turnos: [{ abre: '07:30', cierra: '13:30', esTrasnoche: false }] },
      },
      resumenFormateado: 'Lun a Sáb: 07:00 a 20:30 hs | Dom: 07:30 a 13:30 hs',
    },
    productos: [
      {
        id: 'prod-savio-01-1',
        comercio_id: '77777777-7777-4777-a777-777777777701',
        nombre: 'Docena de Medialunas de Manteca Artesanales',
        descripcion: 'Elaboradas con manteca de primera calidad y almíbar casero.',
        precio: 6500,
        precio_oferta: 5200,
        es_oferta: true,
        descuento_porcentaje: 20,
        imagen_url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&auto=format&fit=crop&q=80',
        categoria: 'Panadería',
      },
      {
        id: 'prod-savio-01-2',
        comercio_id: '77777777-7777-4777-a777-777777777701',
        nombre: 'Pan de Campo con Masa Madre (1 kg)',
        descripcion: 'Corteza crocante y miga aireada horneado a leña.',
        precio: 3200,
        precio_oferta: null,
        es_oferta: false,
        descuento_porcentaje: 0,
        imagen_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
        categoria: 'Panadería',
      },
      {
        id: 'prod-savio-01-3',
        comercio_id: '77777777-7777-4777-a777-777777777701',
        nombre: 'Torta Balcarce Tradicional (1.2 kg)',
        descripcion: 'Capas de bizcochuelo suave, dulce de leche repostero, merengue y nuez.',
        precio: 14500,
        precio_oferta: null,
        es_oferta: false,
        descuento_porcentaje: 0,
        imagen_url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80',
        categoria: 'Confitería',
      },
    ],
  },

  // =========================================================================
  // MAQUINISTA SAVIO - TIPO 2: SOLO ENVÍO (Delivery puro / Dark Kitchen)
  // =========================================================================
  {
    id: '77777777-7777-4777-a777-777777777702',
    nombre: 'Savio Burger Box - Dark Kitchen Express',
    rubro: 'Gastronomía',
    tipo_atencion: 'solo_envio', // TIPO 2
    radio_entrega_metros: 3500, // 3.5 km
    alcance_envio: 'radio',
    zona_envio_descripcion: 'Envíos a domicilio en todo Maquinista Savio, Garín oeste y Barrio Amancay.',
    direccion: 'Av. 9 de Julio 1250, Maquinista Savio',
    localidad: 'Maquinista Savio',
    telefono: '+5491148802202',
    whatsapp: '+5491148802202',
    email: 'burgerbox.savio@neofaro.test',
    email_comercio: 'burgerbox.savio@neofaro.test',
    password_comercio: HASH_123,
    descripcion: 'Smash burgers artesanales elaboradas con blend especial de roast beef y tapa de asado en pan de papa. Cocina exclusiva para envíos rápidos a domicilio.',
    latitud: -34.4340,
    longitud: -58.7870,
    esta_abierto: true,
    esta_de_turno: false,
    nivel: 'premium',
    nivel_solicitado: 'premium',
    estado_aprobacion: 'aprobado',
    tiene_catalogo: true,
    horarios_config: {
      modo: 'bloques',
      bloques: {
        lunesViernes: { abierto: true, turnos: [{ abre: '19:30', cierra: '00:00', esTrasnoche: false }] },
        sabado: { abierto: true, turnos: [{ abre: '19:30', cierra: '01:00', esTrasnoche: true }] },
        domingoFeriados: { abierto: true, turnos: [{ abre: '19:30', cierra: '23:30', esTrasnoche: false }] },
      },
      resumenFormateado: 'Mié a Dom: 19:30 a 00:30 hs (Delivery)',
    },
    productos: [
      {
        id: 'prod-savio-02-1',
        comercio_id: '77777777-7777-4777-a777-777777777702',
        nombre: 'Combo Doble Smash Bacon + Papas Rústicas',
        descripcion: '2 medallones 100g smash, cuádruple cheddar, bacon crocante ahumado y salsa burger casera.',
        precio: 8500,
        precio_oferta: 6800,
        es_oferta: true,
        descuento_porcentaje: 20,
        imagen_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
        categoria: 'Burgers',
      },
      {
        id: 'prod-savio-02-2',
        comercio_id: '77777777-7777-4777-a777-777777777702',
        nombre: 'Papas Cheddar & Panceta XL (Para 2 personas)',
        descripcion: 'Papas naturales bastón con triple cocción, abundante salsa cheddar fundida y verdeo.',
        precio: 4800,
        precio_oferta: 3900,
        es_oferta: true,
        descuento_porcentaje: 18,
        imagen_url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&auto=format&fit=crop&q=80',
        categoria: 'Acompañamientos',
      },
    ],
  },

  // =========================================================================
  // GRAND BOURG - TIPO 3: HÍBRIDO / AMBOS (Local físico + Delivery con cobertura)
  // =========================================================================
  {
    id: '88888888-8888-4888-a888-888888888801',
    nombre: 'Granja & Fiambrería Las Camelias',
    rubro: 'Almacén',
    tipo_atencion: 'ambos', // TIPO 3
    radio_entrega_metros: 4000, // 4.0 km
    alcance_envio: 'radio',
    zona_envio_descripcion: 'Repartos en Grand Bourg centro, Tierras Altas, Ing. Pablo Nogués y límites con Tortuguitas.',
    direccion: 'Av. San Martín 1420, Grand Bourg',
    localidad: 'Grand Bourg',
    telefono: '+5491146603301',
    whatsapp: '+5491146603301',
    email: 'lascamelias.gb@neofaro.test',
    email_comercio: 'lascamelias.gb@neofaro.test',
    password_comercio: HASH_123,
    descripcion: 'Fiambrería tradicional de barrio y granja avícola. Pollo de campo fresco, huevos de chacra, quesos regionales de Tandil y picadas completas. Comprá en el local o pedí por delivery.',
    latitud: -34.4845,
    longitud: -58.7160,
    esta_abierto: true,
    esta_de_turno: false,
    nivel: 'gold',
    nivel_solicitado: 'gold',
    estado_aprobacion: 'aprobado',
    tiene_catalogo: true,
    horarios_config: {
      modo: 'bloques',
      bloques: {
        lunesViernes: { abierto: true, turnos: [{ abre: '08:30', cierra: '13:00', esTrasnoche: false }, { abre: '16:30', cierra: '20:30', esTrasnoche: false }] },
        sabado: { abierto: true, turnos: [{ abre: '08:30', cierra: '13:30', esTrasnoche: false }, { abre: '17:00', cierra: '20:30', esTrasnoche: false }] },
        domingoFeriados: { abierto: true, turnos: [{ abre: '09:00', cierra: '13:00', esTrasnoche: false }] },
      },
      resumenFormateado: 'Lun a Sáb: 08:30 a 13:00 y 16:30 a 20:30 hs | Dom: 09:00 a 13:00 hs',
    },
    productos: [
      {
        id: 'prod-gb-01-1',
        comercio_id: '88888888-8888-4888-a888-888888888801',
        nombre: 'Tabla Picada Gourmet Don Juan (Para 4 Personas)',
        descripcion: 'Jamón crudo estacionado 12 meses, lomito ahumado, salame tandilero, queso gouda, fontina y aceitunas rellenas.',
        precio: 16500,
        precio_oferta: 13900,
        es_oferta: true,
        descuento_porcentaje: 15,
        imagen_url: 'https://images.unsplash.com/photo-1621852004158-f3bc188ace2d?w=600&auto=format&fit=crop&q=80',
        categoria: 'Fiambrería',
      },
      {
        id: 'prod-gb-01-2',
        comercio_id: '88888888-8888-4888-a888-888888888801',
        nombre: 'Queso Mar del Plata Estacionado (Pieza 500g)',
        descripcion: 'Pasta firme y sabor aromático tradicional.',
        precio: 5200,
        precio_oferta: null,
        es_oferta: false,
        descuento_porcentaje: 0,
        imagen_url: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=600&auto=format&fit=crop&q=80',
        categoria: 'Quesos',
      },
      {
        id: 'prod-gb-01-3',
        comercio_id: '88888888-8888-4888-a888-888888888801',
        nombre: 'Maple de Huevos de Granja Colorados (30 Unidades)',
        descripcion: 'Huevos frescos de gallinas de campo, tamaño extra grande.',
        precio: 4900,
        precio_oferta: null,
        es_oferta: false,
        descuento_porcentaje: 0,
        imagen_url: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=600&auto=format&fit=crop&q=80',
        categoria: 'Granja',
      },
    ],
  },

  // =========================================================================
  // GRAND BOURG - TIPO 4: FARMACIA DE TURNO (Guardia 24hs / Horario especial)
  // =========================================================================
  {
    id: '88888888-8888-4888-a888-888888888802',
    nombre: 'Farmacia & Perfumería Central Grand Bourg (24hs)',
    rubro: 'Farmacia',
    tipo_atencion: 'local_fisico', // TIPO 4 (Servicio esencial de guardia)
    radio_entrega_metros: 0,
    alcance_envio: undefined,
    zona_envio_descripcion: 'Atención por ventanilla de turno las 24 horas continuas.',
    direccion: 'Av. El Callao 1050, Grand Bourg',
    localidad: 'Grand Bourg',
    telefono: '+5491146603302',
    whatsapp: '+5491146603302',
    email: 'farmaciagb.turno@neofaro.test',
    email_comercio: 'farmaciagb.turno@neofaro.test',
    password_comercio: HASH_123,
    descripcion: 'Farmacia habilitada de turno oficial las 24 horas en pleno centro de Grand Bourg. Medicamentos bajo receta, nebulizadores, pañales para adultos, dermocosmética y primeros auxilios.',
    latitud: -34.4860,
    longitud: -58.7145,
    esta_abierto: true,
    esta_de_turno: true, // DE TURNO 24 HS
    fecha_turno: new Date().toISOString().split('T')[0],
    nivel: 'gold',
    nivel_solicitado: 'gold',
    estado_aprobacion: 'aprobado',
    tiene_catalogo: true,
    horarios_config: {
      modo: 'bloques',
      bloques: {
        lunesViernes: { abierto: true, turnos: [{ abre: '00:00', cierra: '23:59', esTrasnoche: false }] },
        sabado: { abierto: true, turnos: [{ abre: '00:00', cierra: '23:59', esTrasnoche: false }] },
        domingoFeriados: { abierto: true, turnos: [{ abre: '00:00', cierra: '23:59', esTrasnoche: false }] },
      },
      resumenFormateado: 'Abierto 24 Horas de Turno Continuo',
    },
    productos: [
      {
        id: 'prod-gb-02-1',
        comercio_id: '88888888-8888-4888-a888-888888888802',
        nombre: 'Botiquín Familiar Completo de Primeros Auxilios',
        descripcion: 'Gasa esterilizada, apósitos adhesivos, alcohol 70%, agua oxigenada, cinta hipoalergénica y venda elástica.',
        precio: 11200,
        precio_oferta: 8960,
        es_oferta: true,
        descuento_porcentaje: 20,
        imagen_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
        categoria: 'Farmacia',
      },
      {
        id: 'prod-gb-02-2',
        comercio_id: '88888888-8888-4888-a888-888888888802',
        nombre: 'Termómetro Infrarrojo Digital Clínico Sin Contacto',
        descripcion: 'Medición instantánea en 1 segundo con pantalla retroiluminada de alta precisión.',
        precio: 18500,
        precio_oferta: null,
        es_oferta: false,
        descuento_porcentaje: 0,
        imagen_url: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600&auto=format&fit=crop&q=80',
        categoria: 'Equipamiento',
      },
    ],
  },
];

async function ejecutarCarga() {
  console.log('================================================================');
  console.log('🚀 INICIANDO CARGA DE COMERCIOS DE PRUEBA POR TIPO');
  console.log('   - 2 en Maquinista Savio (Local Físico + Solo Envío)');
  console.log('   - 2 en Grand Bourg (Ambos/Híbrido + Farmacia de Turno)');
  console.log('================================================================\n');

  const ahora = new Date().toISOString();

  for (const c of comerciosPrueba) {
    console.log(`📌 Procesando: [${c.localidad.toUpperCase()}] ${c.nombre} (Tipo: ${c.tipo_atencion})`);

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
      fecha_solicitud: ahora,
      aprobado_por: 'admin@neofaro.app',
      fecha_aprobacion: ahora,
    };

    const { error: errBase } = await sbAdmin.from('comercios').upsert([payloadBase]);
    if (errBase) {
      console.error(`  ❌ Error en tabla 'comercios':`, errBase.message);
    } else {
      console.log(`  ✅ Guardado en tabla 'comercios'`);
    }

    // 2. Guardar en solicitudes_modificacion para conservar metadatos extendidos
    const solPayload = {
      id: c.id,
      comercio_id: c.id,
      comercio_nombre: c.nombre,
      cambios: {
        ...c,
        tipo_solicitud: 'alta_nuevo_comercio',
      },
      estado: 'aprobado',
      fecha_solicitud: ahora,
      aprobado_por: 'admin@neofaro.app',
      fecha_aprobacion: ahora,
    };

    const { error: errSol } = await sbAdmin.from('solicitudes_modificacion').upsert([solPayload]);
    if (errSol) {
      console.error(`  ❌ Error en 'solicitudes_modificacion':`, errSol.message);
    } else {
      console.log(`  ✅ Guardado en 'solicitudes_modificacion' (metadatos, login y tipo de atención)`);
    }

    // 3. Guardar catálogo de productos en tabla 'productos'
    if (c.productos && c.productos.length > 0) {
      // Eliminar productos anteriores para evitar duplicados
      await sbAdmin.from('productos').delete().eq('comercio_id', c.id);

      const prodsToInsert = c.productos.map((p) => ({
        id: randomUUID(),
        comercio_id: c.id,
        nombre: p.nombre,
        descripcion: p.descripcion,
        precio: p.precio,
        precio_oferta: p.precio_oferta || null,
        es_oferta: Boolean(p.es_oferta),
        descuento_porcentaje: p.descuento_porcentaje || 0,
        imagen_url: p.imagen_url,
        categoria: p.categoria,
      }));

      const { error: errProds } = await sbAdmin.from('productos').insert(prodsToInsert);
      if (errProds) {
        console.error(`  ❌ Error al insertar en 'productos':`, errProds.message);
      } else {
        console.log(`  ✅ ${prodsToInsert.length} productos insertados en tabla 'productos'`);
      }
    }

    console.log(`  🔑 Credenciales para /mi-comercio:`);
    console.log(`     Email: ${c.email_comercio}`);
    console.log(`     Clave: 123\n`);
  }

  console.log('================================================================');
  console.log('🎉 ¡CARGA COMPLETA EXITOSA!');
  console.log('Los 4 comercios de prueba están listos y visibles.');
  console.log('================================================================');
}

ejecutarCarga().catch(console.error);
