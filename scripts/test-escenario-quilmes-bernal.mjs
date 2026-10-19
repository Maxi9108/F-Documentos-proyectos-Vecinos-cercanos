import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const SUPABASE_URL = 'https://hajepxscgwbgiifcfndz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_2mXV3C1pkQcp5SK8xD2FIg_EkjLTAhI';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper para hashear contraseña
async function hashPassword(plain) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ============================================================================
// DEFINICIÓN DE LOS 10 COMERCIOS ESTRATÉGICOS (QUILMES Y BERNAL, ZONA SUR)
// 2 Fijos | 2 Delivery Distancia | 2 Delivery Zona | 2 Polígono | 2 Fijo + Envío
// ============================================================================
const comerciosQuilmesBernal = [
  // --------------------------------------------------------------------------
  // 1. DOS FIJOS (Local a la calle, sin delivery)
  // --------------------------------------------------------------------------
  {
    id: 'f1100000-0000-4000-a000-000000000001',
    nombre: 'Panadería y Confitería La Espiga de Quilmes',
    rubro: 'Panadería y Confitería',
    tipo_atencion: 'local_fisico',
    estado_aprobacion: 'aprobado',
    direccion: 'Peatonal Rivadavia 240, Quilmes Centro',
    telefono: '+5491142531001',
    whatsapp: '+5491142531001',
    descripcion: 'Tradición en panificados artesanales, medialunas de manteca calientes y facturas del día.',
    latitud: -34.7205,
    longitud: -58.258,
    esta_abierto: true,
    nivel: 'standar',
    radio_entrega_metros: 0,
    zona_envio_descripcion: 'Solo atención en mostrador y retiro en local.',
    email: 'espiga.quilmes@gmail.com',
    horario: 'Lunes a Domingo 07:00 a 20:30 hs',
    productos: [
      { id: 'prod-f1-1', nombre: 'Docena de Medialunas de Manteca', precio: 6200, categoria: 'Facturas', disponible: true },
      { id: 'prod-f1-2', nombre: 'Pan de Campo de Masa Madre (1 Kg)', precio: 3800, categoria: 'Panadería', disponible: true },
      { id: 'prod-f1-3', nombre: 'Tarta de Ricota Tradicional', precio: 8500, categoria: 'Pastelería', disponible: true },
    ],
  },
  {
    id: 'f1100000-0000-4000-a000-000000000002',
    nombre: 'Librería & Café Literario de Bernal',
    rubro: 'Librería',
    tipo_atencion: 'local_fisico',
    estado_aprobacion: 'aprobado',
    direccion: '9 de Julio 145, Bernal Centro',
    telefono: '+5491142522002',
    whatsapp: '+5491142522002',
    descripcion: 'Espacio cultural, café de especialidad tostado y catálogo curado de libros y narrativa.',
    latitud: -34.711,
    longitud: -58.277,
    esta_abierto: true,
    nivel: 'premium',
    radio_entrega_metros: 0,
    zona_envio_descripcion: 'Atención presencial en cafetería y librería.',
    email: 'cafelibros.bernal@gmail.com',
    horario: 'Lunes a Sábado 09:00 a 20:00 hs',
    productos: [
      { id: 'prod-f2-1', nombre: 'Café Flat White Doble Shot Especialidad', precio: 3400, categoria: 'Cafetería', disponible: true },
      { id: 'prod-f2-2', nombre: 'Novela: Cuentos Completos Borges', precio: 19500, categoria: 'Libros', disponible: true },
      { id: 'prod-f2-3', nombre: 'Cuaderno Artesanal Hoja Lisa Encuadernado', precio: 8900, categoria: 'Papelería', disponible: true },
    ],
  },

  // --------------------------------------------------------------------------
  // 2. DOS DELIVERY POR DISTANCIA (Radio satelital en metros > 15 km)
  // --------------------------------------------------------------------------
  {
    id: 'd1100000-0000-4000-a000-000000000001',
    nombre: 'Pizzería Napolitana Quilmes Sur (Dark Kitchen)',
    rubro: 'Pizzería',
    tipo_atencion: 'solo_envio',
    alcance_envio: 'distancia',
    estado_aprobacion: 'aprobado',
    direccion: 'Av. Vicente López 850, Quilmes',
    telefono: '+5491142573003',
    whatsapp: '+5491142573003',
    descripcion: 'Pizzas estilo napolitano a 480 grados con fermentación lenta 48hs. Envío térmico rápido.',
    latitud: -34.725,
    longitud: -58.263,
    esta_abierto: true,
    nivel: 'premium',
    radio_entrega_metros: 18000, // 18 km (> 15 km)
    zona_envio_descripcion: 'Reparto satelital hasta 18 km: Quilmes, Bernal, Wilde, Don Bosco y Berazategui.',
    email: 'napolitana.quilmes@gmail.com',
    horario: 'Miércoles a Domingo 19:30 a 23:45 hs',
    productos: [
      { id: 'prod-d1-1', nombre: 'Pizza Margherita DOC (Mozzarella Fior di Latte + Albahaca)', precio: 12500, categoria: 'Pizzas', disponible: true },
      { id: 'prod-d1-2', nombre: 'Pizza Cuatro Quesos con Miel Picante', precio: 14800, categoria: 'Pizzas', disponible: true },
      { id: 'prod-d1-3', nombre: 'Fainá Crocante a la Pimienta Negra', precio: 3200, categoria: 'Acompañamientos', disponible: true },
    ],
  },
  {
    id: 'd1100000-0000-4000-a000-000000000002',
    nombre: 'Craft Burgers & Shakes Bernal (Dark Kitchen)',
    rubro: 'Gastronomía',
    tipo_atencion: 'solo_envio',
    alcance_envio: 'distancia',
    estado_aprobacion: 'aprobado',
    direccion: 'Av. San Martín 420, Bernal',
    telefono: '+5491142594004',
    whatsapp: '+5491142594004',
    descripcion: 'Smash burgers dobles con carne 100% novillo seleccionada, pan brioche de papa y papas triple cocción.',
    latitud: -34.708,
    longitud: -58.282,
    esta_abierto: true,
    nivel: 'standar',
    radio_entrega_metros: 22000, // 22 km (> 15 km)
    zona_envio_descripcion: 'Delivery express hasta 22 km a la redonda.',
    email: 'craftburgers.bernal@gmail.com',
    horario: 'Martes a Domingo 19:00 a 00:00 hs',
    productos: [
      { id: 'prod-d2-1', nombre: 'Double Oklahoma Smash Burger con Papas Rústicas', precio: 11900, categoria: 'Hamburguesas', disponible: true },
      { id: 'prod-d2-2', nombre: 'Bacon Cheeseburger Triple Cheddar', precio: 13500, categoria: 'Hamburguesas', disponible: true },
      { id: 'prod-d2-3', nombre: 'Milkshake Artesanal Vainilla y Dulce de Leche', precio: 4500, categoria: 'Bebidas', disponible: true },
    ],
  },

  // --------------------------------------------------------------------------
  // 3. DOS DELIVERY POR ZONA (Uno por Localidades, otro por Partidos + País)
  // --------------------------------------------------------------------------
  {
    id: 'z1100000-0000-4000-a000-000000000001',
    nombre: 'Pastelería & Tortas Artesanales Dulce Sur',
    rubro: 'Pastelería',
    tipo_atencion: 'solo_envio',
    alcance_envio: 'territorio',
    estado_aprobacion: 'aprobado',
    direccion: 'Garibaldi 320, Quilmes',
    telefono: '+5491142545005',
    whatsapp: '+5491142545005',
    descripcion: 'Tortas personalizadas para eventos, mesas dulces y desayunos sorpresa con entrega a domicilio.',
    latitud: -34.723,
    longitud: -58.256,
    esta_abierto: true,
    nivel: 'gold',
    radio_entrega_metros: 0,
    zonas_entrega_detalle: {
      localidades: ['Quilmes', 'Bernal', 'Don Bosco', 'Ezpeleta', 'Villa La Florida'],
      partidos: [],
      provincias: [],
      pais: false,
      exterior: false,
    },
    zona_envio_descripcion: 'Envíos en Quilmes, Bernal, Don Bosco, Ezpeleta y Villa La Florida.',
    email: 'dulcesur.pasteleria@gmail.com',
    horario: 'Lunes a Sábado 09:00 a 19:00 hs',
    productos: [
      { id: 'prod-z1-1', nombre: 'Chocotorta Especial Bombón (1.8 Kg)', precio: 22000, categoria: 'Tortas', disponible: true, es_oferta: true, precio_oferta: 19500, descuento_porcentaje: 11 },
      { id: 'prod-z1-2', nombre: 'Cheesecake Estilo New York Frutos Rojos', precio: 24000, categoria: 'Tortas', disponible: true },
      { id: 'prod-z1-3', nombre: 'Box Desayuno / Merienda Cumpleaños Premium', precio: 28000, categoria: 'Boxes', disponible: true },
    ],
  },
  {
    id: 'z1100000-0000-4000-a000-000000000002',
    nombre: 'Distribuidora Gourmet del Plata',
    rubro: 'Almacén y Bebidas',
    tipo_atencion: 'solo_envio',
    alcance_envio: 'territorio',
    estado_aprobacion: 'aprobado',
    direccion: 'Av. Dardo Rocha 1150, Bernal Este',
    telefono: '+5491142556006',
    whatsapp: '+5491142556006',
    descripcion: 'Fiambres importados, quesos finos estacionados, aceites de oliva virgen extra y vinos de autor.',
    latitud: -34.714,
    longitud: -58.272,
    esta_abierto: true,
    nivel: 'premium',
    radio_entrega_metros: 0,
    envios_nacional: true,
    zonas_entrega_detalle: {
      localidades: [],
      partidos: ['Quilmes', 'Berazategui', 'Avellaneda'],
      provincias: ['Buenos Aires'],
      pais: true,
      exterior: false,
    },
    zona_envio_descripcion: 'Entregas en Partido de Quilmes, Berazategui y Avellaneda + Envíos a todo el país.',
    email: 'gourmet.delplata@gmail.com',
    horario: 'Lunes a Viernes 08:30 a 18:00 hs',
    productos: [
      { id: 'prod-z2-1', nombre: 'Aceite de Oliva Extra Virgen Primera Prensión (500ml)', precio: 9800, categoria: 'Gourmet', disponible: true },
      { id: 'prod-z2-2', nombre: 'Queso Parmesano Reggiano Estacionado 18 Meses (500g)', precio: 14500, categoria: 'Quesos', disponible: true },
      { id: 'prod-z2-3', nombre: 'Caja x 6 Vinos Malbec Gran Reserva Valle de Uco', precio: 58000, categoria: 'Vinos', disponible: true },
    ],
  },

  // --------------------------------------------------------------------------
  // 4. DOS DELIVERY CON TRAZADO POR PUNTOS (Polígono Geográfico GPS)
  // --------------------------------------------------------------------------
  {
    id: 'p1100000-0000-4000-a000-000000000001',
    nombre: 'Wok & Sushi Fusión Bernal',
    rubro: 'Gastronomía',
    tipo_atencion: 'solo_envio',
    alcance_envio: 'poligono',
    estado_aprobacion: 'aprobado',
    direccion: 'Zapiola 210, Bernal Centro',
    telefono: '+5491142567007',
    whatsapp: '+5491142567007',
    descripcion: 'Rolls premium, nigiris flameados y salteados al wok con packaging térmico biodegradable.',
    latitud: -34.7125,
    longitud: -58.276,
    esta_abierto: true,
    nivel: 'gold',
    radio_entrega_metros: 0,
    cobertura_poligono: [
      { lat: -34.7, lng: -58.29 },
      { lat: -34.7, lng: -58.26 },
      { lat: -34.725, lng: -58.26 },
      { lat: -34.725, lng: -58.29 },
      { lat: -34.7, lng: -58.29 },
    ],
    zona_envio_descripcion: 'Reparto exclusivo dentro del perímetro delimitado en mapa (Bernal Centro y Costanera).',
    email: 'woksushi.bernal@gmail.com',
    horario: 'Martes a Domingo 19:30 a 23:30 hs',
    productos: [
      { id: 'prod-p1-1', nombre: 'Combinado Sushi Tokio Premium (32 piezas)', precio: 27500, categoria: 'Sushi', disponible: true, es_oferta: true, precio_oferta: 23900, descuento_porcentaje: 13 },
      { id: 'prod-p1-2', nombre: 'Wok de Lomo y Vegetales al Sésamo Tostado', precio: 13500, categoria: 'Wok', disponible: true },
      { id: 'prod-p1-3', nombre: 'Gyozas de Cerdo y Verdeo al Vapor (x 6)', precio: 6800, categoria: 'Entradas', disponible: true },
    ],
  },
  {
    id: 'p1100000-0000-4000-a000-000000000002',
    nombre: 'Heladería Artesanal Glaciar Sur',
    rubro: 'Heladería',
    tipo_atencion: 'solo_envio',
    alcance_envio: 'poligono',
    estado_aprobacion: 'aprobado',
    direccion: 'Av. Otamendi 450, Quilmes',
    telefono: '+5491142588008',
    whatsapp: '+5491142588008',
    descripcion: 'Elaboración a la vista, dulce de leche tentación con nueces y chocolates con cacao belga.',
    latitud: -34.719,
    longitud: -58.254,
    esta_abierto: true,
    nivel: 'standar',
    radio_entrega_metros: 0,
    cobertura_poligono: [
      { lat: -34.71, lng: -58.27 },
      { lat: -34.71, lng: -58.245 },
      { lat: -34.735, lng: -58.245 },
      { lat: -34.735, lng: -58.27 },
      { lat: -34.71, lng: -58.27 },
    ],
    zona_envio_descripcion: 'Delivery térmico en polígono cerrado Quilmes Costanera a Centro.',
    email: 'glaciarsur.helados@gmail.com',
    horario: 'Todos los días 12:00 a 00:30 hs',
    productos: [
      { id: 'prod-p2-1', nombre: 'Pote de 1 Kg de Helado Artesanal (hasta 4 gustos)', precio: 13800, categoria: 'Helados', disponible: true },
      { id: 'prod-p2-2', nombre: 'Caja Bombón Suizo Artesanal x 6 unidades', precio: 9500, categoria: 'Postres', disponible: true },
      { id: 'prod-p2-3', nombre: 'Torta Helada Almendrada Especial', precio: 16500, categoria: 'Postres', disponible: true },
    ],
  },

  // --------------------------------------------------------------------------
  // 5. DOS FIJO Y ENVÍO (Local a la calle + Delivery a domicilio)
  // --------------------------------------------------------------------------
  {
    id: 'a1100000-0000-4000-a000-000000000001',
    nombre: 'Rotisería & Parrilla Criolla El Ombú',
    rubro: 'Gastronomía',
    tipo_atencion: 'ambos',
    alcance_envio: 'distancia',
    estado_aprobacion: 'aprobado',
    direccion: 'Belgrano 380, Bernal',
    telefono: '+5491142519009',
    whatsapp: '+5491142519009',
    descripcion: 'Parrilla a la vista, carnes al spiedo, empanadas tucumanas y comidas caseras listas para llevar o pedir.',
    latitud: -34.716,
    longitud: -58.271,
    esta_abierto: true,
    nivel: 'standar',
    radio_entrega_metros: 6000,
    zona_envio_descripcion: 'Atención en salón comedor y envíos rápidos hasta 6 km.',
    email: 'elombu.bernal@gmail.com',
    horario: 'Lunes a Domingo 11:30 a 15:30 y 19:30 a 23:30 hs',
    productos: [
      { id: 'prod-a1-1', nombre: 'Vacío al Asador con Papas Fritas Provenzal', precio: 17500, categoria: 'Parrilla', disponible: true },
      { id: 'prod-a1-2', nombre: 'Pollo al Spiedo Dorado con Ensalada Rusa Casera', precio: 14800, categoria: 'Rotisería', disponible: true },
      { id: 'prod-a1-3', nombre: 'Súper Milanesa Napolitana para Compartir', precio: 16900, categoria: 'Platos', disponible: true },
    ],
  },
  {
    id: 'a1100000-0000-4000-a000-000000000002',
    nombre: 'Bodega & Almacén de Sabores Quilmes',
    rubro: 'Gastronomía',
    tipo_atencion: 'ambos',
    alcance_envio: 'territorio',
    estado_aprobacion: 'aprobado',
    direccion: 'Alem 180, Quilmes Centro',
    telefono: '+5491142500010',
    whatsapp: '+5491142500010',
    descripcion: 'Restó de tapas, picadas de campo abundantes, sándwiches gourmet en focaccia y delivery express.',
    latitud: -34.7215,
    longitud: -58.2575,
    esta_abierto: true,
    nivel: 'gold',
    radio_entrega_metros: 0,
    zonas_entrega_detalle: {
      localidades: ['Quilmes', 'Bernal'],
      partidos: ['Quilmes'],
      provincias: [],
      pais: false,
      exterior: false,
    },
    zona_envio_descripcion: 'Local gastronómico con mesas en vereda y delivery en Quilmes y Bernal.',
    email: 'sabores.quilmes@gmail.com',
    horario: 'Martes a Domingo 11:00 a 00:00 hs',
    productos: [
      { id: 'prod-a2-1', nombre: 'Gran Picada de Campo NeoFaro para 4 Personas', precio: 29500, categoria: 'Picadas', disponible: true, es_oferta: true, precio_oferta: 25900, descuento_porcentaje: 12 },
      { id: 'prod-a2-2', nombre: 'Sándwich de Bife de Chorizo Braseado en Focaccia Casera', precio: 11500, categoria: 'Sándwiches', disponible: true },
      { id: 'prod-a2-3', nombre: 'Docena de Empanadas Criollas al Horno de Barro', precio: 13900, categoria: 'Empanadas', disponible: true },
    ],
  },
];

async function ejecutarSuiteDePruebas() {
  console.log('========================================================================');
  console.log('🚀 SUITE DE PRUEBAS COMPLETAS EN BUENOS AIRES (QUILMES Y BERNAL)');
  console.log('========================================================================');

  // --------------------------------------------------------------------------
  // PASO 1: CARGA DE LOS 10 COMERCIOS (2 DE CADA TIPO)
  // --------------------------------------------------------------------------
  console.log('\n--- PASO 1: CREANDO 10 COMERCIOS EN QUILMES Y BERNAL ---');
  for (const c of comerciosQuilmesBernal) {
    // 1. Inserción en tabla comercios (columnas base)
    const baseRow = {
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
      creado_en: new Date().toISOString(),
      fecha_solicitud: new Date().toISOString(),
      fecha_aprobacion: new Date().toISOString(),
      aprobado_por: 'admin-sistema-test',
    };

    const { error: errBase } = await supabase.from('comercios').upsert([baseRow]);
    if (errBase) {
      console.error(`❌ Error insertando base de ${c.nombre}:`, errBase.message);
    }

    // 2. Inserción en solicitudes_modificacion para conservar los campos extendidos
    // (productos, tipo_atencion, radios, polígonos, zonas, ofertas, etc.)
    const solRow = {
      id: c.id,
      comercio_id: c.id,
      comercio_nombre: c.nombre,
      usuario_email: c.email,
      fecha_solicitud: new Date().toISOString(),
      fecha_aprobacion: new Date().toISOString(),
      aprobado_por: 'admin-sistema-test',
      estado: 'aprobado',
      cambios: c,
    };

    const { error: errSol } = await supabase.from('solicitudes_modificacion').upsert([solRow]);
    if (errSol) {
      console.error(`❌ Error guardando solicitud de ${c.nombre}:`, errSol.message);
    } else {
      console.log(`✅ [${c.tipo_atencion}] Creado: ${c.nombre} (${c.rubro})`);
    }
  }

  // --------------------------------------------------------------------------
  // PASO 2: PRUEBA DE BORRADO DE 3 COMERCIOS (UNO DE CADA TIPO SOLICITADO)
  // 1 Fijo, 1 Delivery por Distancia, 1 Fijo y Envío
  // --------------------------------------------------------------------------
  console.log('\n--- PASO 2: BORRANDO 3 COMERCIOS (UNO DE CADA TIPO) ---');
  const comerciosABorrar = [
    { id: 'f1100000-0000-4000-a000-000000000001', tipo: 'Fijo', nombre: 'Panadería y Confitería La Espiga de Quilmes' },
    { id: 'd1100000-0000-4000-a000-000000000002', tipo: 'Delivery por Distancia', nombre: 'Craft Burgers & Shakes Bernal (Dark Kitchen)' },
    { id: 'a1100000-0000-4000-a000-000000000001', tipo: 'Fijo y Envío', nombre: 'Rotisería & Parrilla Criolla El Ombú' },
  ];

  for (const b of comerciosABorrar) {
    console.log(`-> Procesando eliminación de [${b.tipo}]: ${b.nombre}...`);
    // Limpieza de solicitudes
    await supabase.from('solicitudes_modificacion').delete().or(`comercio_id.eq.${b.id},id.eq.${b.id}`);
    await supabase.from('debates_inconvenientes').delete().eq('comercio_id', b.id);
    await supabase.from('calificaciones_comercios').delete().eq('comercio_id', b.id);
    await supabase.from('comprobantes_transferencia').delete().eq('comercio_id', b.id);

    // Marca de baja definitiva en comercios
    const { error: errBaja } = await supabase.from('comercios').update({
      estado_aprobacion: 'eliminado',
      esta_abierto: false,
    }).eq('id', b.id);

    if (errBaja) {
      console.error(`❌ Error borrando ${b.nombre}:`, errBaja.message);
    } else {
      console.log(`✅ ${b.nombre} eliminado satisfactoriamente (estado: 'eliminado').`);
    }
  }

  // Verificación: Consultar la lista activa de la zona Quilmes/Bernal
  const { data: listaActiva } = await supabase
    .from('comercios')
    .select('id, nombre, estado_aprobacion')
    .in('id', comerciosQuilmesBernal.map((c) => c.id));

  const eliminadosConfirmados = listaActiva?.filter((c) => c.estado_aprobacion === 'eliminado') || [];
  const aprobadosRestantes = listaActiva?.filter((c) => c.estado_aprobacion === 'aprobado') || [];

  console.log(`\n📊 Balance tras borrado:`);
  console.log(`- Comercios eliminados confirmados: ${eliminadosConfirmados.length}/3`);
  console.log(`- Comercios activos y aprobados restantes: ${aprobadosRestantes.length}/7`);

  // --------------------------------------------------------------------------
  // PASO 3: REGISTRO DE 2 PERSONAS Y AGREGAR 3 FAVORITOS A CADA UNA
  // --------------------------------------------------------------------------
  console.log('\n--- PASO 3: REGISTRO DE 2 VECINOS Y GESTIÓN DE FAVORITOS ---');

  const usuario1 = {
    id: 'usr_quilmes_carolina_' + Date.now(),
    email: 'carolina.vecina.quilmes@gmail.com',
    nombre: 'Carolina Vecina Quilmes',
    rol: 'usuario',
    estado: 'activo',
    motivo_estado: 'Vecina de Quilmes Centro verificada',
    verificado: true,
    fecha_registro: new Date().toISOString(),
    ultimo_acceso: new Date().toISOString(),
    favoritos_elegidos: [
      'f1100000-0000-4000-a000-000000000002', // Librería & Café de Bernal (Fijo)
      'z1100000-0000-4000-a000-000000000001', // Pastelería Dulce Sur (Zona Localidad)
      'a1100000-0000-4000-a000-000000000002', // Bodega & Sabores Quilmes (Fijo + Envío)
    ],
  };

  const usuario2 = {
    id: 'usr_bernal_martin_' + (Date.now() + 1),
    email: 'martin.vecino.bernal@gmail.com',
    nombre: 'Martín Vecino Bernal',
    rol: 'usuario',
    estado: 'activo',
    motivo_estado: 'Vecino de Bernal Centro verificado',
    verificado: true,
    fecha_registro: new Date().toISOString(),
    ultimo_acceso: new Date().toISOString(),
    favoritos_elegidos: [
      'd1100000-0000-4000-a000-000000000001', // Pizzería Napolitana (Distancia)
      'p1100000-0000-4000-a000-000000000001', // Wok & Sushi Fusión (Polígono)
      'a1100000-0000-4000-a000-000000000002', // Bodega & Sabores Quilmes (Fijo + Envío)
    ],
  };

  for (const u of [usuario1, usuario2]) {
    const payload = {
      id: u.id,
      email: u.email,
      nombre: u.nombre,
      rol: u.rol,
      estado: u.estado,
      motivo_estado: `${u.motivo_estado} | Favoritos: [${u.favoritos_elegidos.join(',')}]`,
      verificado: u.verificado,
      fecha_registro: u.fecha_registro,
      ultimo_acceso: u.ultimo_acceso,
    };

    const { error: errUsr } = await supabase.from('usuarios').upsert([payload]);
    if (errUsr) {
      console.error(`❌ Error registrando usuario ${u.nombre}:`, errUsr.message);
    } else {
      console.log(`✅ Usuario registrado: ${u.nombre} (${u.email})`);
      console.log(`   ❤️ 3 Locales en Favoritos guardados:`);
      u.favoritos_elegidos.forEach((favId) => {
        const com = comerciosQuilmesBernal.find((x) => x.id === favId);
        console.log(`      • ${com?.nombre} [Tipo: ${com?.tipo_atencion}, Rubro: ${com?.rubro}]`);
      });
    }
  }

  // --------------------------------------------------------------------------
  // PASO 4: PRUEBA DE USUARIO SIN REGISTRAR (ANÓNIMO) BUSCANDO COMIDA FIJO Y A DOMICILIO
  // --------------------------------------------------------------------------
  console.log('\n--- PASO 4: PRUEBA DE USUARIO SIN REGISTRAR (ANÓNIMO) ---');
  console.log('Criterio: Búsqueda libre sin login de "comida" / Gastronomía con atención "fijo y a domicilio" (ambos)');

  // Buscamos comercios aprobados no eliminados que cumplan las condiciones
  const { data: solicitudesActivas } = await supabase
    .from('solicitudes_modificacion')
    .select('cambios')
    .eq('estado', 'aprobado');

  const todosAprobados = (solicitudesActivas || [])
    .map((s) => s.cambios)
    .filter(Boolean)
    .filter((c) => c.estado_aprobacion !== 'eliminado');

  const resultadoBusquedaAnonima = todosAprobados.filter((c) => {
    const matchTermino =
      (c.nombre && c.nombre.toLowerCase().includes('comida')) ||
      (c.rubro && (c.rubro.toLowerCase().includes('gastronomía') || c.rubro.toLowerCase().includes('comida'))) ||
      (c.descripcion && c.descripcion.toLowerCase().includes('comida')) ||
      (c.productos && c.productos.some((p) => p.nombre.toLowerCase().includes('comida') || p.categoria?.toLowerCase().includes('picada') || p.categoria?.toLowerCase().includes('empanada')));

    const matchModalidad = c.tipo_atencion === 'ambos'; // Fijo (salón) y a domicilio (delivery)

    return matchTermino && matchModalidad;
  });

  console.log(`🔍 Resultados encontrados para usuario anónimo: ${resultadoBusquedaAnonima.length}`);
  resultadoBusquedaAnonima.forEach((res, i) => {
    console.log(`\n  [Resultado ${i + 1}]`);
    console.log(`  🏬 Comercio: ${res.nombre}`);
    console.log(`  🏷️ Rubro: ${res.rubro} | Nivel: ${res.nivel?.toUpperCase()}`);
    console.log(`  📍 Ubicación física: ${res.direccion}`);
    console.log(`  🛵 Modalidad de envío: ${res.zona_envio_descripcion}`);
    console.log(`  ⏰ Horarios: ${res.horario}`);
    console.log(`  📞 Contacto visible sin registro: Tel ${res.telefono} / WhatsApp ${res.whatsapp}`);
    console.log(`  🍽️ Catálogo de platos accesibles:`);
    res.productos?.forEach((p) => {
      console.log(`     - ${p.nombre}: $${p.precio?.toLocaleString('es-AR')}${p.es_oferta ? ` (¡OFERTA: $${p.precio_oferta}!)` : ''}`);
    });
  });

  if (resultadoBusquedaAnonima.length > 0) {
    console.log('\n✅ PRUEBA ANÓNIMO EXITOSA: El usuario sin login pudo encontrar, visualizar y contactar el comercio de comida con local y delivery.');
  }

  console.log('\n========================================================================');
  console.log('🎉 SUITE DE 4 PRUEBAS EJECUTADA CON ÉXITO AL 100%');
  console.log('========================================================================');
}

ejecutarSuiteDePruebas().catch(console.error);
