import { createClient } from '@supabase/supabase-js';
import { getServiceKey } from './get-service-key.mjs';

const SUPABASE_URL = 'https://hajepxscgwbgiifcfndz.supabase.co';
const SERVICE_KEY = getServiceKey();

const sbAdmin = createClient(SUPABASE_URL, SERVICE_KEY);

async function inspectSchema() {
  // Test inserting a row with all possible columns to see which ones fail or succeed
  const candidateCols = [
    'id', 'nombre', 'rubro', 'direccion', 'telefono', 'whatsapp', 'descripcion',
    'horario', 'esta_abierto', 'latitud', 'longitud', 'tiene_catalogo',
    'tipo_atencion', 'radio_entrega_metros', 'cobertura_poligono', 'zona_envio_descripcion',
    'estado_aprobacion', 'categoria_solicitada', 'aprobado_por', 'fecha_solicitud',
    'fecha_aprobacion', 'motivo_rechazo', 'nivel', 'nivel_solicitado',
    'fecha_inicio_nivel', 'fecha_vencimiento_nivel', 'fecha_ultima_renovacion',
    'tiene_horario_cortado', 'horario_manana', 'horario_tarde', 'esta_de_turno',
    'fecha_turno', 'cerrado_momentaneo', 'motivo_cierre_momentaneo',
    'fecha_cierre_emergencia', 'reapertura_emergencia_programada', 'en_vacaciones',
    'vacaciones_desde', 'vacaciones_hasta', 'mensaje_vacaciones',
    'oculto_por_inactividad', 'ticket_baja_definitiva', 'fecha_ticket_baja',
    'motivo_ticket_baja', 'en_cuarentena', 'fecha_cuarentena', 'motivo_cuarentena',
    'strikes_reportes', 'horarios_config', 'user_id', 'email_comercio',
    'password_comercio', 'fecha_ultima_modificacion_catalogo', 'productos', 'catalogo'
  ];

  const presentCols = [];
  const missingCols = [];

  for (const col of candidateCols) {
    const { error } = await sbAdmin.from('comercios').select(col).limit(1);
    if (error) {
      missingCols.push(col);
    } else {
      presentCols.push(col);
    }
  }

  console.log('Columns PRESENT in public.comercios:', presentCols);
  console.log('Columns MISSING in public.comercios:', missingCols);

  // Check what tables exist
  const tables = [
    'comercios', 'productos', 'categorias', 'administradores',
    'eventos_analytics', 'comprobantes_transferencia', 'debates_inconvenientes',
    'solicitudes_modificacion', 'tokens_registro', 'usuarios', 'reportes', 'calificaciones_comercios'
  ];

  for (const table of tables) {
    const { data, error } = await sbAdmin.from(table).select('*').limit(1);
    if (error) {
      console.log(`Table "${table}": ERROR (${error.message})`);
    } else {
      console.log(`Table "${table}": OK (rows: ${data ? 'accessible' : 'null'})`);
    }
  }
}

inspectSchema().catch(console.error);
