import { createClient } from '@supabase/supabase-js';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getEnvVar(name) {
  if (process.env[name]) return process.env[name];
  const envPath = path.resolve(__dirname, '../apps/pwa/.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const match = content.match(new RegExp(`^${name}=(.*)$`, 'm'));
    if (match) return match[1].trim().replace(/^['"]|['"]$/g, '');
  }
  return '';
}

const SUPABASE_URL = getEnvVar('NEXT_PUBLIC_SUPABASE_URL') || 'https://hajepxscgwbgiifcfndz.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = getEnvVar('SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Falta la clave SUPABASE_SERVICE_ROLE_KEY en el entorno o en apps/pwa/.env.local');
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ============================================================================
// 14 COMERCIOS ESTRATÉGICOS (VICENTE LÓPEZ, OLIVOS, FLORIDA, MARTÍNEZ)
// 1 de cada una de las 14 categorías oficiales
// Distribución de tipos de atención: 5 local_fisico, 4 solo_envio, 5 ambos (>= 3 de cada tipo)
// Distribución de niveles: 4 gold, 5 premium, 5 standar (>= 3 de cada nivel)
// ============================================================================
const COMERCIOS_ESTRATEGICOS = [
  // 1. ALMACÉN | tipo: local_fisico | nivel: standar
  {
    id: '10000000-0000-4000-a000-000000000001',
    nombre: 'Almacén & Fiambrería Don Vicente',
    rubro: 'Almacén',
    tipo_atencion: 'local_fisico',
    estado_aprobacion: 'aprobado',
    direccion: 'Av. Maipú 1420, Vicente López',
    localidad: 'Vicente López',
    telefono: '+5491147912345',
    whatsapp: '+5491147912345',
    descripcion: 'Almacén de barrio tradicional, quesos de campo, fiambres de primera línea y pan fresco del día.',
    latitud: -34.5265,
    longitud: -58.4821,
    esta_abierto: true,
    nivel: 'standar',
    radio_entrega_metros: 0,
    zona_envio_descripcion: 'Atención presencial en mostrador.',
    horario: 'Lunes a Sábado de 08:30 a 20:30 hs',
    tiene_catalogo: true,
    email: 'donvicente.almacen@gmail.com',
    productos: [
      { id: 'prod-01-1', nombre: 'Queso Mar del Plata La Paulina (100g)', precio: 1850, es_oferta: false, disponible: true },
      { id: 'prod-01-2', nombre: 'Jamón Cocido Natural Campo Austral (100g)', precio: 2200, es_oferta: false, disponible: true },
      { id: 'prod-01-3', nombre: 'Aceite de Oliva Extra Virgen 500ml', precio: 8900, es_oferta: false, disponible: true },
    ]
  },

  // 2. PANADERÍA | tipo: ambos | nivel: gold
  {
    id: '10000000-0000-4000-a000-000000000002',
    nombre: 'Panadería Artesanal La Espiga Real',
    rubro: 'Panadería',
    tipo_atencion: 'ambos',
    estado_aprobacion: 'aprobado',
    direccion: 'Av. Maipú 2150, Olivos',
    localidad: 'Olivos',
    telefono: '+5491147923456',
    whatsapp: '+5491147923456',
    descripcion: 'Panes de masa madre, medialunas de manteca calientes cada hora, chipá correntino y tortas personalizadas.',
    latitud: -34.5122,
    longitud: -58.4815,
    esta_abierto: true,
    nivel: 'gold',
    radio_entrega_metros: 3500,
    zona_envio_descripcion: 'Envíos en Olivos, Florida Este y Vicente López Centro.',
    horario: 'Lunes a Domingo de 07:00 a 20:30 hs',
    tiene_catalogo: true,
    email: 'laespigareal.olivos@gmail.com',
    instagram: 'laespigareal_olivos',
    productos: [
      { id: 'prod-02-1', nombre: 'Docena de Medialunas de Manteca', precio: 7200, precio_oferta: 5900, es_oferta: true, descuento_porcentaje: 18, tipo_oferta: 'diaria', hora_vencimiento_oferta: '2026-10-23T23:59:59Z', disponible: true },
      { id: 'prod-02-2', nombre: 'Pan de Campo de Masa Madre 750g', precio: 4200, precio_oferta: 3500, es_oferta: true, descuento_porcentaje: 16, tipo_oferta: 'semanal', hora_vencimiento_oferta: '2026-10-29T23:59:59Z', disponible: true },
      { id: 'prod-02-3', nombre: 'Tarta Rogel Individual con Dulce de Leche', precio: 4500, es_oferta: false, disponible: true },
      { id: 'prod-02-4', nombre: 'Bolsa de Chipá Calentito (250g)', precio: 3800, es_oferta: false, disponible: true },
    ]
  },

  // 3. FARMACIA | tipo: ambos | nivel: gold (DE TURNO 24HS)
  {
    id: '10000000-0000-4000-a000-000000000003',
    nombre: 'Farmacia & Botica Central Olivos (24 Hs)',
    rubro: 'Farmacia',
    tipo_atencion: 'ambos',
    estado_aprobacion: 'aprobado',
    direccion: 'Ricardo Gutiérrez 1320, Olivos',
    localidad: 'Olivos',
    telefono: '+5491147934567',
    whatsapp: '+5491147934567',
    descripcion: 'Farmacia de turno permanente 24hs. Medicamentos bajo receta, dermocosmética y entrega prioritaria a domicilio.',
    latitud: -34.5098,
    longitud: -58.4842,
    esta_abierto: true,
    esta_de_turno: true,
    nivel: 'gold',
    radio_entrega_metros: 5000,
    zona_envio_descripcion: 'Guardia y delivery nocturno en Vicente López, Olivos, Martínez y La Lucila.',
    horario: 'Abierto 24 Horas (De Turno Oficial)',
    tiene_catalogo: true,
    email: 'farmacia.centralolivos@gmail.com',
    productos: [
      { id: 'prod-03-1', nombre: 'Protector Solar Dermaglós FPS 50+ Facial', precio: 18900, precio_oferta: 14900, es_oferta: true, descuento_porcentaje: 21, tipo_oferta: 'semanal', hora_vencimiento_oferta: '2026-10-29T23:59:59Z', disponible: true },
      { id: 'prod-03-2', nombre: 'Termómetro Digital Precisión', precio: 6500, precio_oferta: 4900, es_oferta: true, descuento_porcentaje: 25, tipo_oferta: 'diaria', hora_vencimiento_oferta: '2026-10-23T23:59:59Z', disponible: true },
      { id: 'prod-03-3', nombre: 'Botiquín de Primeros Auxilios Familiar', precio: 12500, es_oferta: false, disponible: true },
    ]
  },

  // 4. VERDULERÍA | tipo: solo_envio | nivel: premium
  {
    id: '10000000-0000-4000-a000-000000000004',
    nombre: 'La Huerta Fresca Express Delivery',
    rubro: 'Verdulería',
    tipo_atencion: 'solo_envio',
    estado_aprobacion: 'aprobado',
    direccion: 'Hipólito Yrigoyen 2840, Florida',
    localidad: 'Florida',
    telefono: '+5491147945678',
    whatsapp: '+5491147945678',
    descripcion: 'Bolsones agroecológicos directos de quinta a tu puerta. Frutas seleccionadas y verduras frescas del día.',
    latitud: -34.5292,
    longitud: -58.4905,
    esta_abierto: true,
    nivel: 'premium',
    radio_entrega_metros: 6000,
    zona_envio_descripcion: 'Reparto express en Florida Oeste, Florida Este, Olivos y Munro.',
    horario: 'Lunes a Sábado de 08:00 a 19:00 hs',
    tiene_catalogo: true,
    email: 'lahuertafresca.delivery@gmail.com',
    productos: [
      { id: 'prod-04-1', nombre: 'Bolsón Agroecológico Mixto (8 Kg Fruta y Verdura)', precio: 14500, precio_oferta: 11900, es_oferta: true, descuento_porcentaje: 17, tipo_oferta: 'diaria', hora_vencimiento_oferta: '2026-10-23T23:59:59Z', disponible: true },
      { id: 'prod-04-2', nombre: 'Cajón de Naranjas de Jugo (5 Kg)', precio: 6800, es_oferta: false, disponible: true },
      { id: 'prod-04-3', nombre: 'Palta Hass Seleccionada (Kg)', precio: 7500, es_oferta: false, disponible: true },
    ]
  },

  // 5. CARNICERÍA | tipo: local_fisico | nivel: premium
  {
    id: '10000000-0000-4000-a000-000000000005',
    nombre: 'Boutique de Carnes Los Galpones',
    rubro: 'Carnicería',
    tipo_atencion: 'local_fisico',
    estado_aprobacion: 'aprobado',
    direccion: 'Av. Libertador 2450, Olivos',
    localidad: 'Olivos',
    telefono: '+5491147956789',
    whatsapp: '+5491147956789',
    descripcion: 'Cortes premium para parrilla envasados al vacío, bife de chorizo madurado, achuras frescas y embutidos caseros.',
    latitud: -34.5065,
    longitud: -58.4762,
    esta_abierto: true,
    nivel: 'premium',
    radio_entrega_metros: 0,
    zona_envio_descripcion: 'Atención exclusiva en salón y mostrador boutique.',
    horario: 'Martes a Domingo de 09:00 a 14:00 y 16:30 a 20:30 hs',
    tiene_catalogo: true,
    email: 'losgalpones.carnes@gmail.com',
    productos: [
      { id: 'prod-05-1', nombre: 'Asado Especial Novillito de Pastura (Kg)', precio: 11500, precio_oferta: 9500, es_oferta: true, descuento_porcentaje: 17, tipo_oferta: 'semanal', hora_vencimiento_oferta: '2026-10-29T23:59:59Z', disponible: true },
      { id: 'prod-05-2', nombre: 'Ojo de Bife Madurado al Vacío (Kg)', precio: 14800, es_oferta: false, disponible: true },
      { id: 'prod-05-3', nombre: 'Chorizo Puro Cerdo Bombón (Kg)', precio: 8200, es_oferta: false, disponible: true },
    ]
  },

  // 6. FERRETERÍA | tipo: ambos | nivel: standar
  {
    id: '10000000-0000-4000-a000-000000000006',
    nombre: 'Ferretería Industrial & Hogar Mitre',
    rubro: 'Ferretería',
    tipo_atencion: 'ambos',
    estado_aprobacion: 'aprobado',
    direccion: 'Av. Bartolomé Mitre 1820, Florida Oeste',
    localidad: 'Florida Oeste',
    telefono: '+5491147967890',
    whatsapp: '+5491147967890',
    descripcion: 'Herramientas eléctricas, bulonería, sanitarios, pinturas y envíos pesados directo a obra o domicilio.',
    latitud: -34.5352,
    longitud: -58.5021,
    esta_abierto: true,
    nivel: 'standar',
    radio_entrega_metros: 4000,
    zona_envio_descripcion: 'Florida, Munro, Villa Martelli y Carapachay.',
    horario: 'Lunes a Viernes 08:00 a 18:30 | Sábados 08:30 a 13:00 hs',
    tiene_catalogo: true,
    email: 'ferreteriamitre@gmail.com',
    productos: [
      { id: 'prod-06-1', nombre: 'Taladro Percutor 650W Profesional', precio: 58000, es_oferta: false, disponible: true },
      { id: 'prod-06-2', nombre: 'Set de Destornilladores Imantados x6', precio: 12500, es_oferta: false, disponible: true },
      { id: 'prod-06-3', nombre: 'Látex Interior Lavable Blanco 10 L', precio: 34000, es_oferta: false, disponible: true },
    ]
  },

  // 7. CAFETERÍA | tipo: local_fisico | nivel: gold
  {
    id: '10000000-0000-4000-a000-000000000007',
    nombre: 'Café de Especialidad Santos & Granos',
    rubro: 'Cafetería',
    tipo_atencion: 'local_fisico',
    estado_aprobacion: 'aprobado',
    direccion: 'Corrientes 520, Olivos',
    localidad: 'Olivos',
    telefono: '+5491147978901',
    whatsapp: '+5491147978901',
    descripcion: 'Espacio de café de especialidad origen Colombia y Etiopía. Pastelería nórdica, brunch al sol y espacio pet-friendly.',
    latitud: -34.5105,
    longitud: -58.4802,
    esta_abierto: true,
    nivel: 'gold',
    radio_entrega_metros: 0,
    zona_envio_descripcion: 'Consumo en salón, terraza y take-away al paso.',
    horario: 'Martes a Domingo de 08:30 a 20:00 hs',
    tiene_catalogo: true,
    email: 'santoygranos.cafe@gmail.com',
    instagram: 'santosygranos_cafe',
    productos: [
      { id: 'prod-07-1', nombre: 'Flat White Doble Shot con Roll de Canela', precio: 6200, precio_oferta: 4900, es_oferta: true, descuento_porcentaje: 20, tipo_oferta: 'diaria', hora_vencimiento_oferta: '2026-10-23T23:59:59Z', disponible: true },
      { id: 'prod-07-2', nombre: 'Café Filtrado V60 Geisha Colombia', precio: 4500, es_oferta: false, disponible: true },
      { id: 'prod-07-3', nombre: 'Toast de Palta, Huevo Poché y Salmón Ahumado', precio: 9800, es_oferta: false, disponible: true },
    ]
  },

  // 8. KIOSCO | tipo: solo_envio | nivel: standar
  {
    id: '10000000-0000-4000-a000-000000000008',
    nombre: 'Kiosco 24 Express Delivery Nocturno',
    rubro: 'Kiosco',
    tipo_atencion: 'solo_envio',
    estado_aprobacion: 'aprobado',
    direccion: 'Malaver 1950, Florida',
    localidad: 'Florida',
    telefono: '+5491147989012',
    whatsapp: '+5491147989012',
    descripcion: 'Golosinas, chocolates, snacks, hielo en bolsa y bebidas frías directo a tu casa en minutos. Guardia toda la noche.',
    latitud: -34.5241,
    longitud: -58.4883,
    esta_abierto: true,
    nivel: 'standar',
    radio_entrega_metros: 4500,
    zona_envio_descripcion: 'Florida, Olivos Este y Vicente López Centro.',
    horario: 'Todos los días de 18:00 a 04:00 AM (Delivery nocturno)',
    tiene_catalogo: true,
    email: 'kiosco24express@gmail.com',
    productos: [
      { id: 'prod-08-1', nombre: 'Bolsa de Hielo Rolito 4 Kg', precio: 2500, es_oferta: false, disponible: true },
      { id: 'prod-08-2', nombre: 'Pack Papas Fritas Lays Clásicas 140g + Coca Cola 1.5L', precio: 5800, es_oferta: false, disponible: true },
      { id: 'prod-08-3', nombre: 'Alfajor Havanna 70% Cacao', precio: 2200, es_oferta: false, disponible: true },
    ]
  },

  // 9. GASTRONOMÍA | tipo: ambos | nivel: gold
  {
    id: '10000000-0000-4000-a000-000000000009',
    nombre: 'Trattoria & Pizzería Napolitana Bella Vista',
    rubro: 'Gastronomía',
    tipo_atencion: 'ambos',
    estado_aprobacion: 'aprobado',
    direccion: 'Av. Libertador 1890, Vicente López',
    localidad: 'Vicente López',
    telefono: '+5491147990123',
    whatsapp: '+5491147990123',
    descripcion: 'Pizzas napolitanas a la leña a 450°C, pastas artesanales caseras y salón comedor con vista al río.',
    latitud: -34.5208,
    longitud: -58.4719,
    esta_abierto: true,
    nivel: 'gold',
    radio_entrega_metros: 4000,
    zona_envio_descripcion: 'Vicente López, Olivos y Nuñez.',
    horario: 'Martes a Domingo de 12:00 a 16:00 y 19:30 a 00:30 hs',
    tiene_catalogo: true,
    email: 'bellavista.pizzeria@gmail.com',
    instagram: 'bellavistapizza_vl',
    productos: [
      { id: 'prod-09-1', nombre: 'Pizza Margherita DOC (Masa Fermentada 48hs)', precio: 13500, precio_oferta: 10900, es_oferta: true, descuento_porcentaje: 19, tipo_oferta: 'diaria', hora_vencimiento_oferta: '2026-10-23T23:59:59Z', disponible: true },
      { id: 'prod-09-2', nombre: 'Sorrentinos de Salmón y Ricota con Salsa de Mariscos', precio: 15800, es_oferta: false, disponible: true },
      { id: 'prod-09-3', nombre: 'Tiramisú Tradicional al Mascarpone', precio: 5500, precio_oferta: 4400, es_oferta: true, descuento_porcentaje: 20, tipo_oferta: 'semanal', hora_vencimiento_oferta: '2026-10-29T23:59:59Z', disponible: true },
    ]
  },

  // 10. REPARTO DE AGUA Y BEBIDAS | tipo: solo_envio | nivel: standar
  {
    id: '10000000-0000-4000-a000-000000000010',
    nombre: 'Agua Pura & Sifones El Faro',
    rubro: 'Reparto de Agua y Bebidas',
    tipo_atencion: 'solo_envio',
    estado_aprobacion: 'aprobado',
    direccion: 'Pellegrini 3100, Olivos',
    localidad: 'Olivos',
    telefono: '+5491147901234',
    whatsapp: '+5491147901234',
    descripcion: 'Distribución domiciliaria programada de bidones de agua purificada de 20L, 12L y cajones de sifones de soda retornables.',
    latitud: -34.5165,
    longitud: -58.4942,
    esta_abierto: true,
    nivel: 'standar',
    radio_entrega_metros: 7000,
    zona_envio_descripcion: 'Envíos semanales en todo el Partido de Vicente López y San Isidro.',
    horario: 'Lunes a Viernes 08:00 a 17:00 hs',
    tiene_catalogo: true,
    email: 'aguapuraelfaro@gmail.com',
    productos: [
      { id: 'prod-10-1', nombre: 'Bidón 20 Litros Agua Purificada Baja en Sodio', precio: 4500, es_oferta: false, disponible: true },
      { id: 'prod-10-2', nombre: 'Cajón de 6 Sifones de Soda Vidrio Retornable', precio: 6200, es_oferta: false, disponible: true },
      { id: 'prod-10-3', nombre: 'Dispenser Frío-Calor para Mesada (Alquiler Mensual)', precio: 15000, es_oferta: false, disponible: true },
    ]
  },

  // 11. PELUQUERÍA & ESTÉTICA | tipo: local_fisico | nivel: premium
  {
    id: '10000000-0000-4000-a000-000000000011',
    nombre: 'Atelier Barbería & Spa Urbano Norte',
    rubro: 'Peluquería & Estética',
    tipo_atencion: 'local_fisico',
    estado_aprobacion: 'aprobado',
    direccion: 'Gral. Roca 1450, Florida Este',
    localidad: 'Florida Este',
    telefono: '+5491147911223',
    whatsapp: '+5491147911223',
    descripcion: 'Cortes unisex, diseño de barba con toalla caliente, colorimetría avanzada, manicuría y tratamientos capilares.',
    latitud: -34.5278,
    longitud: -58.4795,
    esta_abierto: true,
    nivel: 'premium',
    radio_entrega_metros: 0,
    zona_envio_descripcion: 'Atención presencial con o sin turno previo.',
    horario: 'Martes a Sábado de 10:00 a 20:00 hs',
    tiene_catalogo: true,
    email: 'atelier.spaurbano@gmail.com',
    instagram: 'atelier_spaurbano',
    productos: [
      { id: 'prod-11-1', nombre: 'Corte de Cabello + Perfilado de Barba Ritual', precio: 14000, precio_oferta: 11500, es_oferta: true, descuento_porcentaje: 17, tipo_oferta: 'semanal', hora_vencimiento_oferta: '2026-10-29T23:59:59Z', disponible: true },
      { id: 'prod-11-2', nombre: 'Nutrición Capilar Profunda con Keratina', precio: 22000, es_oferta: false, disponible: true },
      { id: 'prod-11-3', nombre: 'Manicuría Rusa con Esmaltado Semipermanente', precio: 12000, es_oferta: false, disponible: true },
    ]
  },

  // 12. VETERINARIA & PET SHOP | tipo: ambos | nivel: premium
  {
    id: '10000000-0000-4000-a000-000000000012',
    nombre: 'Veterinaria & Pet Shop Huellas Felices',
    rubro: 'Veterinaria & Pet Shop',
    tipo_atencion: 'ambos',
    estado_aprobacion: 'aprobado',
    direccion: 'Av. Santa Fe 1120, Acassuso / Martínez',
    localidad: 'Martínez',
    telefono: '+5491147922334',
    whatsapp: '+5491147922334',
    descripcion: 'Clínica veterinaria, vacunación, farmacia para mascotas y envíos a domicilio sin cargo de alimentos balanceados.',
    latitud: -34.4891,
    longitud: -58.5042,
    esta_abierto: true,
    nivel: 'premium',
    radio_entrega_metros: 5000,
    zona_envio_descripcion: 'Martínez, Acassuso, San Isidro y La Lucila.',
    horario: 'Lunes a Sábado de 09:00 a 19:30 hs',
    tiene_catalogo: true,
    email: 'huellasfelices.pet@gmail.com',
    productos: [
      { id: 'prod-12-1', nombre: 'Alimento Royal Canin Mini Adult (7.5 Kg)', precio: 49500, precio_oferta: 42000, es_oferta: true, descuento_porcentaje: 15, tipo_oferta: 'semanal', hora_vencimiento_oferta: '2026-10-29T23:59:59Z', disponible: true },
      { id: 'prod-12-2', nombre: 'Pipeta Antiparasitaria Externa Perro Mediano', precio: 7800, es_oferta: false, disponible: true },
      { id: 'prod-12-3', nombre: 'Cama Acolchada Antiestrés Talle M', precio: 26000, es_oferta: false, disponible: true },
    ]
  },

  // 13. INDUMENTARIA & CALZADO | tipo: local_fisico | nivel: standar
  {
    id: '10000000-0000-4000-a000-000000000013',
    nombre: 'Boutique Urbana Moda & Calzado',
    rubro: 'Indumentaria & Calzado',
    tipo_atencion: 'local_fisico',
    estado_aprobacion: 'aprobado',
    direccion: 'Belgrano 340, San Isidro Centro',
    localidad: 'San Isidro',
    telefono: '+5491147933445',
    whatsapp: '+5491147933445',
    descripcion: 'Indumentaria femenina y masculina de diseño independiente, calzados de cuero legítimo y accesorios.',
    latitud: -34.4721,
    longitud: -58.5105,
    esta_abierto: true,
    nivel: 'standar',
    radio_entrega_metros: 0,
    zona_envio_descripcion: 'Atención personalizada en local.',
    horario: 'Lunes a Sábado de 10:00 a 20:00 hs',
    tiene_catalogo: true,
    email: 'boutiqueurbana.si@gmail.com',
    productos: [
      { id: 'prod-13-1', nombre: 'Camisa de Lino Puro Premium', precio: 38000, es_oferta: false, disponible: true },
      { id: 'prod-13-2', nombre: 'Pantalón Chino Gabardina Elastizada', precio: 45000, es_oferta: false, disponible: true },
      { id: 'prod-13-3', nombre: 'Zapatillas Urbanas de Cuero Vacuno', precio: 72000, es_oferta: false, disponible: true },
    ]
  },

  // 14. SERVICIOS DEL HOGAR | tipo: solo_envio | nivel: standar
  {
    id: '10000000-0000-4000-a000-000000000014',
    nombre: 'Servicios Integrales Hogar & Climatización Pro',
    rubro: 'Servicios del Hogar',
    tipo_atencion: 'solo_envio',
    estado_aprobacion: 'aprobado',
    direccion: 'Av. Uzal 3800, Olivos',
    localidad: 'Olivos',
    telefono: '+5491147944556',
    whatsapp: '+5491147944556',
    descripcion: 'Instalación y service de aires acondicionados split, electricidad matriculada, plomería y mantenimiento integral a domicilio.',
    latitud: -34.5202,
    longitud: -58.5085,
    esta_abierto: true,
    nivel: 'standar',
    radio_entrega_metros: 8000,
    zona_envio_descripcion: 'Asistencia técnica a domicilio en Vicente López, San Isidro y San Martín.',
    horario: 'Lunes a Sábado de 08:00 a 19:00 hs (Urgencias 24hs)',
    tiene_catalogo: true,
    email: 'climatizacion.pro.ba@gmail.com',
    productos: [
      { id: 'prod-14-1', nombre: 'Mantenimiento y Limpieza Profunda Aire Split', precio: 35000, es_oferta: false, disponible: true },
      { id: 'prod-14-2', nombre: 'Visita de Diagnóstico Técnico Domiciliario', precio: 15000, es_oferta: false, disponible: true },
      { id: 'prod-14-3', nombre: 'Instalación Básica Split hasta 3000 Frigorías', precio: 75000, es_oferta: false, disponible: true },
    ]
  },
];

async function ejecutar() {
  console.log('🧹 PASO 1: Eliminando comercios anteriores y datos relacionados...');

  // Eliminar en cascada
  const { error: errP } = await supabaseAdmin.from('productos').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('Productos eliminados:', errP ? errP.message : 'OK');

  const { error: errS } = await supabaseAdmin.from('solicitudes_modificacion').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('Solicitudes eliminadas:', errS ? errS.message : 'OK');

  const { error: errC } = await supabaseAdmin.from('comercios').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('Comercios eliminados:', errC ? errC.message : 'OK');

  console.log('\n🚀 PASO 2: Insertando los 14 comercios estratégicos...');
  console.log(`📋 Total a insertar: ${COMERCIOS_ESTRATEGICOS.length}`);

  let cargados = 0;
  for (const c of COMERCIOS_ESTRATEGICOS) {
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
      estado_aprobacion: 'aprobado',
      nivel: c.nivel,
      fecha_solicitud: new Date().toISOString(),
      aprobado_por: 'admin@neofaro.com.ar',
      fecha_aprobacion: new Date().toISOString(),
    };

    const { error: errBase } = await supabaseAdmin.from('comercios').upsert([payloadBase]);
    if (errBase) {
      console.error(`❌ Error en comercios (${c.nombre}):`, errBase.message);
      continue;
    }

    // 2. Guardar en solicitudes_modificacion para conservar tipo_atencion, whatsapp, descripcion, etc.
    const solPayload = {
      id: c.id,
      comercio_id: c.id,
      comercio_nombre: c.nombre,
      cambios: {
        ...c,
        email_comercio: c.email,
        password_comercio: '24b31d8ec515cf58e3a0ec20479913266d88595bf139c2b15acc7ea376e1eacc', // hash de '123'
        tipo_solicitud: 'alta_nuevo_comercio',
      },
      estado: 'aprobado',
      fecha_solicitud: new Date().toISOString(),
      aprobado_por: 'admin@neofaro.com.ar',
      fecha_aprobacion: new Date().toISOString(),
    };

    const { error: errSol } = await supabaseAdmin.from('solicitudes_modificacion').upsert([solPayload]);
    if (errSol) {
      console.error(`❌ Error en solicitudes_modificacion (${c.nombre}):`, errSol.message);
    }

    // 3. Guardar productos en tabla productos
    if (c.productos && c.productos.length > 0) {
      const prodsPayload = c.productos.map(p => ({
        id: p.id,
        comercio_id: c.id,
        nombre: p.nombre,
        precio: p.precio,
        precio_oferta: p.precio_oferta || null,
        es_oferta: p.es_oferta ?? false,
        descuento_porcentaje: p.descuento_porcentaje || null,
        tipo_oferta: p.tipo_oferta || null,
        hora_vencimiento_oferta: p.hora_vencimiento_oferta || null,
      }));
      const { error: errProd } = await supabaseAdmin.from('productos').upsert(prodsPayload);
      if (errProd) {
        console.warn(`   Aviso al guardar productos en tabla productos (${c.nombre}):`, errProd.message);
      }
    }

    cargados++;
    console.log(`✅ [${c.rubro}] "${c.nombre}" cargado (${c.tipo_atencion} | ${c.nivel})`);
  }

  console.log(`\n🎉 Carga finalizada: ${cargados} de ${COMERCIOS_ESTRATEGICOS.length} comercios registrados exitosamente.`);
}

ejecutar().catch(console.error);
