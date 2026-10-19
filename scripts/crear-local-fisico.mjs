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

const nuevoLocal = {
  id: '55555555-5555-4555-a555-555555555501',
  nombre: 'Café & Panadería La Aldea',
  rubro: 'Gastronomía',
  tipo_atencion: 'local_fisico',
  estado_aprobacion: 'pendiente',
  direccion: 'Av. Maipú 2140, Olivos, Buenos Aires',
  telefono: '+5491147912233',
  whatsapp: '+5491147912233',
  descripcion: 'Cafetería de especialidad y panadería artesanal. Salón climatizado y mesas al aire libre con atención exclusiva en local.',
  latitud: -34.5123,
  longitud: -58.4812,
  esta_abierto: true,
  nivel: 'standar',
  nivel_solicitado: 'standar',
  radio_entrega_metros: 0,
  zona_envio_descripcion: 'Atención exclusiva en salón y mostrador presencial.',
  email: 'contacto@panaderialaaldea.com',
  email_comercio: 'contacto@panaderialaaldea.com',
  password_comercio: HASH_123,
  tiene_catalogo: true,
  horarios_config: {
    modo: 'bloques',
    bloques: {
      lunesViernes: { abierto: true, turnos: [{ abre: '08:00', cierra: '20:00', esTrasnoche: false }] },
      sabado: { abierto: true, turnos: [{ abre: '08:30', cierra: '14:00', esTrasnoche: false }] },
      domingoFeriados: { abierto: false, turnos: [] },
    },
    resumenFormateado: 'Lun a Vie: 08:00 a 20:00 hs | Sáb: 08:30 a 14:00 hs | Dom: Cerrado',
  },
  productos: [
    {
      id: 'prod_aldea_1',
      comercio_id: '55555555-5555-4555-a555-555555555501',
      nombre: 'Combo Desayuno Artesanal (Café + 2 Medialunas)',
      descripcion: 'Café con leche mediano acompañado de 2 medialunas caseras de manteca recién horneadas.',
      precio: 3200,
      es_oferta: true,
      precio_oferta: 2560,
      descuento_porcentaje: 20,
      tipo_oferta: 'semanal',
      hora_vencimiento_oferta: new Date(Date.now() + 7 * 86400000).toISOString(),
      categoria: 'Desayunos y Meriendas',
    },
    {
      id: 'prod_aldea_2',
      comercio_id: '55555555-5555-4555-a555-555555555501',
      nombre: 'Docena de Sándwiches de Miga Triples (Jamón y Queso)',
      descripcion: 'Elaboración artesanal en pan de miga blanco extra suave, jamón cocido seleccionado y queso tybo.',
      precio: 9800,
      es_oferta: false,
      categoria: 'Panadería y Fiambrería',
    },
  ],
};

async function registrar() {
  console.log('--- REGISTRANDO LOCAL CON TIENDA FÍSICA ---');

  // 1. Guardar en tabla comercios (campos base compatibles con PostgreSQL)
  const payloadBase = {
    id: nuevoLocal.id,
    nombre: nuevoLocal.nombre,
    rubro: nuevoLocal.rubro,
    direccion: nuevoLocal.direccion,
    telefono: nuevoLocal.telefono,
    latitud: nuevoLocal.latitud,
    longitud: nuevoLocal.longitud,
    esta_abierto: nuevoLocal.esta_abierto,
    estado_aprobacion: 'pendiente',
    nivel: nuevoLocal.nivel,
    fecha_solicitud: new Date().toISOString(),
    aprobado_por: null,
    fecha_aprobacion: null,
  };

  const { error: errCom } = await sb.from('comercios').upsert([payloadBase]);
  if (errCom) {
    console.error('Error al guardar en comercios:', errCom.message);
    return;
  }
  console.log(`✔ Local guardado en tabla comercios: ${nuevoLocal.nombre}`);

  // 2. Guardar en solicitudes_modificacion para conservar metadatos ricos (tipo_atencion: local_fisico, catálogo, ofertas)
  const solPayload = {
    id: nuevoLocal.id,
    comercio_id: nuevoLocal.id,
    comercio_nombre: nuevoLocal.nombre,
    cambios: {
      ...nuevoLocal,
      estado_aprobacion: 'pendiente',
      tipo_solicitud: 'alta_nuevo_comercio',
    },
    estado: 'pendiente',
    fecha_solicitud: new Date().toISOString(),
    aprobado_por: null,
    fecha_aprobacion: null,
  };

  const { error: errSol } = await sb.from('solicitudes_modificacion').upsert([solPayload]);
  if (errSol) {
    console.error('Error al guardar en solicitudes_modificacion:', errSol.message);
    return;
  }
  console.log(`✔ Metadatos y productos guardados en solicitudes_modificacion`);
  console.log(`\n🎉 ¡Comercio "${nuevoLocal.nombre}" dado de alta con éxito en estado PENDIENTE!`);
}

registrar().catch(console.error);
