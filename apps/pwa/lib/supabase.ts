import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Comercio,
  NivelComercio,
  ComprobanteTransferencia,
  DebateInconveniente,
  ModificacionComercio,
  EstadoDebate,
  ReporteComercio,
  MotivoReporte,
} from '@/types/comercio';
import { MOCK_COMERCIOS } from './mock-comercios';
import { hashPassword } from './crypto';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('http') &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
);

// Cliente de Supabase exportado para uso general
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Verifica si los comercios con membresía Premium o Gold tienen su suscripción vencida
 * y los degrada automáticamente a Standar tanto en memoria como en almacenamiento.
 */
export function verificarYDegradarVencidos(comercios: Comercio[]): Comercio[] {
  const ahora = Date.now();
  let huboCambios = false;

  const resultado = comercios.map((comercio) => {
    if (
      comercio.nivel &&
      comercio.nivel !== 'standar' &&
      comercio.fecha_vencimiento_nivel
    ) {
      const fechaVencimiento = new Date(comercio.fecha_vencimiento_nivel).getTime();
      if (!isNaN(fechaVencimiento) && fechaVencimiento < ahora) {
        huboCambios = true;
        const degradado: Comercio = {
          ...comercio,
          nivel: 'standar',
        };

        // Actualizar en background en Supabase si está disponible
        if (isSupabaseConfigured) {
          Promise.resolve(
            supabase
              .from('comercios')
              .update({ nivel: 'standar' })
              .eq('id', comercio.id)
          ).catch(() => {});
        }

        return degradado;
      }
    }
    return comercio;
  });

  if (huboCambios && typeof window !== 'undefined') {
    try {
      const guardadosRaw = localStorage.getItem('vecinos_comercios_nuevos');
      if (guardadosRaw) {
        const guardados: Comercio[] = JSON.parse(guardadosRaw);
        const actualizados = guardados.map((g) => {
          if (g.nivel && g.nivel !== 'standar' && g.fecha_vencimiento_nivel) {
            const fv = new Date(g.fecha_vencimiento_nivel).getTime();
            if (!isNaN(fv) && fv < ahora) {
              return { ...g, nivel: 'standar' as NivelComercio };
            }
          }
          return g;
        });
        localStorage.setItem('vecinos_comercios_nuevos', JSON.stringify(actualizados));
      }
    } catch (e) {
      console.warn('[LocalStorage] Error al actualizar vencimientos:', e);
    }
  }

  return resultado;
}

/**
 * Calcula el timestamp del inicio del siguiente día hábil (Lunes a Viernes a las 06:00 AM).
 * Si hoy es lunes a jueves, calcula mañana a las 06:00 AM.
 * Si hoy es viernes, sábado o domingo, calcula el próximo lunes a las 06:00 AM.
 */
export function calcularSiguienteDiaHabil6AM(fechaBase: Date = new Date()): Date {
  const d = new Date(fechaBase);
  d.setDate(d.getDate() + 1);
  d.setHours(6, 0, 0, 0);

  // Si cae sábado (6), pasa a lunes (+2 días)
  if (d.getDay() === 6) {
    d.setDate(d.getDate() + 2);
  }
  // Si cae domingo (0), pasa a lunes (+1 día)
  else if (d.getDay() === 0) {
    d.setDate(d.getDate() + 1);
  }

  return d;
}

/**
 * Verifica y procesa automáticamente:
 * 1. Cierre por Emergencia vencido: lo restablece al llegar la fecha de reapertura (06:00 AM del siguiente día hábil).
 * 2. Vacaciones finalizadas: si llegó el día de retorno obligatorio (vacaciones_hasta), restablece la atención.
 * 3. Vacaciones > 60 días: oculta el local del mapa y genera un ticket en el Panel Admin para revisión de baja definitiva.
 */
export function verificarYRestaurarEstados(comercios: Comercio[]): Comercio[] {
  const ahora = Date.now();
  let huboCambios = false;

  const resultado = comercios.map((comercio) => {
    const modificado = { ...comercio };
    let cambioEsteComercio = false;

    // 1. Caducidad automática de Cierre por Emergencia
    if (modificado.cerrado_momentaneo && modificado.reapertura_emergencia_programada) {
      const tiempoReapertura = new Date(modificado.reapertura_emergencia_programada).getTime();
      if (!isNaN(tiempoReapertura) && ahora >= tiempoReapertura) {
        modificado.cerrado_momentaneo = false;
        modificado.motivo_cierre_momentaneo = undefined;
        modificado.reapertura_emergencia_programada = undefined;
        modificado.fecha_cierre_emergencia = undefined;
        modificado.esta_abierto = true;
        cambioEsteComercio = true;
        huboCambios = true;
      }
    }

    // 2. Control de Vacaciones Programadas
    if (modificado.en_vacaciones) {
      // 2a. Comprobar si ya llegó la fecha de Retorno
      if (modificado.vacaciones_hasta) {
        const tiempoRetorno = new Date(modificado.vacaciones_hasta).getTime();
        if (!isNaN(tiempoRetorno) && ahora >= tiempoRetorno) {
          modificado.en_vacaciones = false;
          modificado.vacaciones_desde = undefined;
          modificado.vacaciones_hasta = undefined;
          modificado.mensaje_vacaciones = undefined;
          modificado.oculto_por_inactividad = false;
          modificado.ticket_baja_definitiva = false;
          modificado.esta_abierto = true;
          cambioEsteComercio = true;
          huboCambios = true;
        }
      }

      // 2b. Comprobar si supera 60 días continuos en vacaciones
      if (modificado.en_vacaciones && modificado.vacaciones_desde) {
        const tiempoInicioVac = new Date(modificado.vacaciones_desde).getTime();
        if (!isNaN(tiempoInicioVac)) {
          const diasEnVacaciones = Math.floor((ahora - tiempoInicioVac) / (1000 * 60 * 60 * 24));
          let duracionTotal = diasEnVacaciones;
          if (modificado.vacaciones_hasta) {
            const tiempoHasta = new Date(modificado.vacaciones_hasta).getTime();
            if (!isNaN(tiempoHasta)) {
              duracionTotal = Math.floor((tiempoHasta - tiempoInicioVac) / (1000 * 60 * 60 * 24));
            }
          }

          if (diasEnVacaciones > 60 || duracionTotal > 60) {
            if (!modificado.oculto_por_inactividad || !modificado.ticket_baja_definitiva) {
              modificado.oculto_por_inactividad = true;
              modificado.ticket_baja_definitiva = true;
              modificado.fecha_ticket_baja = modificado.fecha_ticket_baja || new Date().toISOString();
              modificado.motivo_ticket_baja = `Comercio con más de 60 días en modo vacaciones (${diasEnVacaciones} días transcurridos / ${duracionTotal} días programados)`;
              cambioEsteComercio = true;
              huboCambios = true;
            }
          }
        }
      }
    }

    // 3. Caducidad automática de ofertas semanales (7 días continuos de vigencia)
    if (modificado.productos && Array.isArray(modificado.productos)) {
      let huboCambioProductos = false;
      const productosSaneados = modificado.productos.map((prod) => {
        if (!prod.es_oferta) return prod;
        let vencida = false;
        if (prod.hora_vencimiento_oferta) {
          const vtoMs = new Date(prod.hora_vencimiento_oferta).getTime();
          if (!isNaN(vtoMs) && ahora >= vtoMs) {
            vencida = true;
          }
        } else if (prod.fecha_oferta) {
          const fechaMs = new Date(prod.fecha_oferta).getTime();
          if (!isNaN(fechaMs) && ahora - fechaMs >= 7 * 24 * 60 * 60 * 1000) {
            vencida = true;
          }
        }
        if (vencida) {
          huboCambioProductos = true;
          return {
            ...prod,
            es_oferta: false,
            precio_oferta: undefined,
            descuento_porcentaje: undefined,
            hora_vencimiento_oferta: undefined,
            duracion_horas_oferta: undefined,
            unidades_limitadas: undefined,
          };
        }
        return prod;
      });
      if (huboCambioProductos) {
        modificado.productos = productosSaneados;
        cambioEsteComercio = true;
        huboCambios = true;
      }
    }

    // Si cambió en Supabase, actualizar en background
    if (cambioEsteComercio && isSupabaseConfigured) {
      Promise.resolve(
        supabase
          .from('comercios')
          .update({
            cerrado_momentaneo: modificado.cerrado_momentaneo ?? false,
            motivo_cierre_momentaneo: modificado.motivo_cierre_momentaneo || null,
            reapertura_emergencia_programada: modificado.reapertura_emergencia_programada || null,
            fecha_cierre_emergencia: modificado.fecha_cierre_emergencia || null,
            en_vacaciones: modificado.en_vacaciones ?? false,
            vacaciones_desde: modificado.vacaciones_desde || null,
            vacaciones_hasta: modificado.vacaciones_hasta || null,
            mensaje_vacaciones: modificado.mensaje_vacaciones || null,
            oculto_por_inactividad: modificado.oculto_por_inactividad ?? false,
            ticket_baja_definitiva: modificado.ticket_baja_definitiva ?? false,
            fecha_ticket_baja: modificado.fecha_ticket_baja || null,
            motivo_ticket_baja: modificado.motivo_ticket_baja || null,
            esta_abierto: modificado.esta_abierto ?? true,
          })
          .eq('id', modificado.id)
      ).catch(() => {});
    }

    return modificado;
  });

  if (huboCambios && typeof window !== 'undefined') {
    try {
      const guardadosRaw = localStorage.getItem('vecinos_comercios_nuevos');
      if (guardadosRaw) {
        const guardados: Comercio[] = JSON.parse(guardadosRaw);
        const actualizados = guardados.map((g) => {
          const mod = resultado.find((r) => r.id === g.id);
          return mod || g;
        });
        localStorage.setItem('vecinos_comercios_nuevos', JSON.stringify(actualizados));
      }
    } catch (e) {
      console.warn('[LocalStorage] Error al actualizar estados automáticos:', e);
    }
  }

  return resultado;
}

/**
 * Obtiene los comercios de Supabase o provee fallback a datos locales
 * en caso de que no existan credenciales configuradas o la tabla esté vacía.
 */
export async function getComercios(): Promise<Comercio[]> {
  if (!isSupabaseConfigured) {
    return verificarYRestaurarEstados(verificarYDegradarVencidos(MOCK_COMERCIOS));
  }

  try {
    const { data, error } = await supabase
      .from('comercios')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) {
      console.warn('[Supabase] Error al consultar tabla "comercios":', error.message);
      return verificarYRestaurarEstados(verificarYDegradarVencidos(MOCK_COMERCIOS));
    }

    if (!data || data.length === 0) {
      return verificarYRestaurarEstados(verificarYDegradarVencidos(MOCK_COMERCIOS));
    }

    // Combinar los 20 comercios de prueba con los registros de Supabase evitando duplicados
    const mapa = new Map<string, Comercio>();
    MOCK_COMERCIOS.forEach((c) => {
      const safeMock = { ...c };
      delete safeMock.password_comercio;
      mapa.set(safeMock.id, safeMock);
    });

    (data as Comercio[]).forEach((dbItem) => {
      // Seguridad: eliminar password_comercio para que nunca viaje al cliente
      const safeDb = { ...dbItem };
      delete safeDb.password_comercio;

      const existePorId = mapa.has(safeDb.id);
      const existePorNombre = Array.from(mapa.values()).find(
        (c) => c.nombre.trim().toLowerCase() === safeDb.nombre.trim().toLowerCase()
      );
      if (existePorId) {
        mapa.set(safeDb.id, { ...mapa.get(safeDb.id)!, ...safeDb });
      } else if (!existePorNombre) {
        mapa.set(safeDb.id, safeDb);
      }
    });

    const resultado = verificarYRestaurarEstados(verificarYDegradarVencidos(Array.from(mapa.values())));
    resultado.forEach((c) => {
      delete c.password_comercio;
    });
    return resultado;
  } catch (err) {
    console.error('[Supabase] Error inesperado en la consulta:', err);
    return verificarYRestaurarEstados(verificarYDegradarVencidos(MOCK_COMERCIOS));
  }
}

/**
 * Guarda o actualiza un comercio en Supabase y/o en el almacén local
 */
export async function guardarComercio(comercio: Comercio): Promise<{ success: boolean; error?: string }> {
  // 1. Guardar siempre en almacenamiento local para respuesta instantánea y soporte offline
  if (typeof window !== 'undefined') {
    try {
      const guardadosRaw = localStorage.getItem('vecinos_comercios_nuevos');
      const guardados: Comercio[] = guardadosRaw ? JSON.parse(guardadosRaw) : [];
      const index = guardados.findIndex((c) => c.id === comercio.id);
      if (index >= 0) {
        guardados[index] = comercio;
      } else {
        guardados.unshift(comercio);
      }
      localStorage.setItem('vecinos_comercios_nuevos', JSON.stringify(guardados));
    } catch (e) {
      console.warn('[LocalStorage] No se pudo guardar en almacenamiento local:', e);
    }
  }

  // 2. Sincronizar en Supabase si está configurado
  if (isSupabaseConfigured) {
    try {
      let passwordSegura = comercio.password_comercio || null;
      if (passwordSegura && passwordSegura.length < 60) {
        passwordSegura = await hashPassword(passwordSegura);
      }

      const payload: Record<string, unknown> = {
        id: comercio.id,
        nombre: comercio.nombre,
        rubro: comercio.rubro,
        direccion: comercio.direccion,
        telefono: comercio.telefono || null,
        whatsapp: comercio.whatsapp || null,
        descripcion: comercio.descripcion || null,
        horario: comercio.horario || null,
        esta_abierto: comercio.esta_abierto ?? true,
        latitud: comercio.latitud,
        longitud: comercio.longitud,
        tiene_catalogo: comercio.tiene_catalogo ?? false,
        tipo_atencion: comercio.tipo_atencion || 'local_fisico',
        radio_entrega_metros: comercio.radio_entrega_metros || 0,
        zona_envio_descripcion: comercio.zona_envio_descripcion || '',
        estado_aprobacion: comercio.estado_aprobacion || 'aprobado',
        categoria_solicitada: comercio.categoria_solicitada || null,
        aprobado_por: comercio.aprobado_por || null,
        fecha_solicitud: comercio.fecha_solicitud || new Date().toISOString(),
        fecha_aprobacion: comercio.fecha_aprobacion || null,
        motivo_rechazo: comercio.motivo_rechazo || null,
        // Nivel y membresía
        nivel: comercio.nivel || 'standar',
        nivel_solicitado: comercio.nivel_solicitado || comercio.nivel || 'standar',
        fecha_inicio_nivel: comercio.fecha_inicio_nivel || null,
        fecha_vencimiento_nivel: comercio.fecha_vencimiento_nivel || null,
        fecha_ultima_renovacion: comercio.fecha_ultima_renovacion || null,
        // Horario cortado
        tiene_horario_cortado: comercio.tiene_horario_cortado ?? false,
        horario_manana: comercio.horario_manana || null,
        horario_tarde: comercio.horario_tarde || null,
        // Farmacia de turno
        esta_de_turno: comercio.esta_de_turno ?? false,
        fecha_turno: comercio.fecha_turno || null,
        // Cierre momentáneo por emergencia con caducidad automática
        cerrado_momentaneo: comercio.cerrado_momentaneo ?? false,
        motivo_cierre_momentaneo: comercio.motivo_cierre_momentaneo || null,
        fecha_cierre_emergencia: comercio.fecha_cierre_emergencia || null,
        reapertura_emergencia_programada: comercio.reapertura_emergencia_programada || null,
        // Vacaciones programadas obligatorias
        en_vacaciones: comercio.en_vacaciones ?? false,
        vacaciones_desde: comercio.vacaciones_desde || null,
        vacaciones_hasta: comercio.vacaciones_hasta || null,
        mensaje_vacaciones: comercio.mensaje_vacaciones || null,
        // Control de inactividad (+60 días)
        oculto_por_inactividad: comercio.oculto_por_inactividad ?? false,
        ticket_baja_definitiva: comercio.ticket_baja_definitiva ?? false,
        fecha_ticket_baja: comercio.fecha_ticket_baja || null,
        motivo_ticket_baja: comercio.motivo_ticket_baja || null,
        // Cuarentena preventiva por reportes comunitarios
        en_cuarentena: comercio.en_cuarentena ?? false,
        fecha_cuarentena: comercio.fecha_cuarentena || null,
        motivo_cuarentena: comercio.motivo_cuarentena || null,
        strikes_reportes: comercio.strikes_reportes || 0,
        // Nuevos campos de configuración avanzada y credenciales
        horarios_config: comercio.horarios_config || null,
        email_comercio: comercio.email_comercio || null,
        password_comercio: passwordSegura,
        fecha_ultima_modificacion_catalogo: comercio.fecha_ultima_modificacion_catalogo || null,
        productos: comercio.productos || [],
      };

      const { error } = await supabase.from('comercios').upsert([payload]);

      if (error) {
        console.warn('[Supabase] Aviso al guardar comercio en la nube:', error.message);
        // Si falló por alguna columna que no existe aún en la tabla de Supabase, reintentar con campos base
        if (error.code === 'PGRST204') {
          const payloadBase = {
            id: comercio.id,
            nombre: comercio.nombre,
            rubro: comercio.rubro,
            direccion: comercio.direccion,
            latitud: comercio.latitud,
            longitud: comercio.longitud,
          };
          await supabase.from('comercios').upsert([payloadBase]);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[Supabase] Excepción al sincronizar en la nube:', msg);
    }
  }

  return { success: true };
}

/**
 * Aprueba un comercio pendiente y asigna opcionalmente su rubro final y su nivel de membresía
 */
export async function aprobarComercio(
  id: string,
  rubroAsignado?: string,
  aprobadoPor: string = 'maxi0802@gmail.com',
  nivelAsignado: NivelComercio = 'standar'
): Promise<{ success: boolean; error?: string }> {
  const ahora = new Date();
  const fechaAprobacion = ahora.toISOString();
  
  // Si se aprueba en Premium o Gold, se otorgan 30 días de vigencia
  let fechaVencimiento: string | null = null;
  const fechaInicioNivel: string = fechaAprobacion;
  if (nivelAsignado === 'premium' || nivelAsignado === 'gold') {
    const fv = new Date(ahora.getTime() + 30 * 24 * 60 * 60 * 1000);
    fechaVencimiento = fv.toISOString();
  }

  // 1. Actualizar en almacenamiento local
  if (typeof window !== 'undefined') {
    try {
      const guardadosRaw = localStorage.getItem('vecinos_comercios_nuevos');
      if (guardadosRaw) {
        const guardados: Comercio[] = JSON.parse(guardadosRaw);
        const idx = guardados.findIndex((c) => c.id === id);
        if (idx >= 0) {
          guardados[idx].estado_aprobacion = 'aprobado';
          if (rubroAsignado) guardados[idx].rubro = rubroAsignado;
          guardados[idx].aprobado_por = aprobadoPor;
          guardados[idx].fecha_aprobacion = fechaAprobacion;
          guardados[idx].nivel = nivelAsignado;
          guardados[idx].fecha_inicio_nivel = fechaInicioNivel;
          guardados[idx].fecha_vencimiento_nivel = fechaVencimiento;
          localStorage.setItem('vecinos_comercios_nuevos', JSON.stringify(guardados));
        }
      }
    } catch (e) {
      console.warn('[LocalStorage] Error al aprobar comercio:', e);
    }
  }

  // 2. Actualizar en Supabase si está disponible
  if (isSupabaseConfigured) {
    try {
      const updates: Record<string, unknown> = {
        estado_aprobacion: 'aprobado',
        aprobado_por: aprobadoPor,
        fecha_aprobacion: fechaAprobacion,
        nivel: nivelAsignado,
        fecha_inicio_nivel: fechaInicioNivel,
        fecha_vencimiento_nivel: fechaVencimiento,
      };
      if (rubroAsignado) updates.rubro = rubroAsignado;

      await supabase.from('comercios').update(updates).eq('id', id);
    } catch (err) {
      console.warn('[Supabase] Error al actualizar estado de aprobación:', err);
    }
  }

  return { success: true };
}

/**
 * Renueva la suscripción mensual de un comercio por N días (+30 días por defecto)
 */
export async function renovarMembresiaComercio(
  id: string,
  dias: number = 30,
  nivelObjetivo?: NivelComercio
): Promise<{ success: boolean; nuevaFechaVencimiento?: string; error?: string }> {
  const ahora = Date.now();
  let baseMs = ahora;

  // Buscar comercio actual en localStorage o Supabase para calcular fecha
  let nivelFinal: NivelComercio = nivelObjetivo || 'premium';

  if (typeof window !== 'undefined') {
    try {
      const guardadosRaw = localStorage.getItem('vecinos_comercios_nuevos');
      if (guardadosRaw) {
        const guardados: Comercio[] = JSON.parse(guardadosRaw);
        const actual = guardados.find((c) => c.id === id);
        if (actual) {
          if (!nivelObjetivo && actual.nivel && actual.nivel !== 'standar') {
            nivelFinal = actual.nivel;
          } else if (actual.nivel_solicitado && actual.nivel_solicitado !== 'standar') {
            nivelFinal = actual.nivel_solicitado;
          }

          if (actual.fecha_vencimiento_nivel) {
            const fvMs = new Date(actual.fecha_vencimiento_nivel).getTime();
            if (!isNaN(fvMs) && fvMs > ahora) {
              baseMs = fvMs; // Si aún no venció, sumar desde la fecha existente
            }
          }
        }
      }
    } catch (e) {
      console.warn('[LocalStorage] Error al leer vencimiento:', e);
    }
  }

  const nuevaFecha = new Date(baseMs + dias * 24 * 60 * 60 * 1000).toISOString();
  const fechaRenovacion = new Date().toISOString();

  // Actualizar en localStorage
  if (typeof window !== 'undefined') {
    try {
      const guardadosRaw = localStorage.getItem('vecinos_comercios_nuevos');
      if (guardadosRaw) {
        const guardados: Comercio[] = JSON.parse(guardadosRaw);
        const idx = guardados.findIndex((c) => c.id === id);
        if (idx >= 0) {
          guardados[idx].nivel = nivelFinal;
          guardados[idx].fecha_vencimiento_nivel = nuevaFecha;
          guardados[idx].fecha_ultima_renovacion = fechaRenovacion;
          localStorage.setItem('vecinos_comercios_nuevos', JSON.stringify(guardados));
        }
      }
    } catch (e) {
      console.warn('[LocalStorage] Error al renovar:', e);
    }
  }

  // Actualizar en Supabase
  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('comercios')
        .update({
          nivel: nivelFinal,
          fecha_vencimiento_nivel: nuevaFecha,
          fecha_ultima_renovacion: fechaRenovacion,
        })
        .eq('id', id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  }

  return { success: true, nuevaFechaVencimiento: nuevaFecha };
}

/**
 * Cambia el nivel de un comercio y ajusta su fecha de vencimiento según corresponda
 */
export async function cambiarNivelComercio(
  id: string,
  nuevoNivel: NivelComercio,
  diasVigencia: number = 30
): Promise<{ success: boolean; error?: string }> {
  const ahora = new Date();
  let fechaVencimiento: string | null = null;
  const fechaInicio = ahora.toISOString();

  if (nuevoNivel === 'premium' || nuevoNivel === 'gold') {
    const fv = new Date(ahora.getTime() + diasVigencia * 24 * 60 * 60 * 1000);
    fechaVencimiento = fv.toISOString();
  }

  // Actualizar en localStorage
  if (typeof window !== 'undefined') {
    try {
      const guardadosRaw = localStorage.getItem('vecinos_comercios_nuevos');
      if (guardadosRaw) {
        const guardados: Comercio[] = JSON.parse(guardadosRaw);
        const idx = guardados.findIndex((c) => c.id === id);
        if (idx >= 0) {
          guardados[idx].nivel = nuevoNivel;
          guardados[idx].fecha_inicio_nivel = fechaInicio;
          guardados[idx].fecha_vencimiento_nivel = fechaVencimiento;
          localStorage.setItem('vecinos_comercios_nuevos', JSON.stringify(guardados));
        }
      }
    } catch (e) {
      console.warn('[LocalStorage] Error al cambiar nivel:', e);
    }
  }

  // Actualizar en Supabase
  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('comercios')
        .update({
          nivel: nuevoNivel,
          fecha_inicio_nivel: fechaInicio,
          fecha_vencimiento_nivel: fechaVencimiento,
        })
        .eq('id', id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  }

  return { success: true };
}

/**
 * Rechaza una solicitud de comercio
 */
export async function rechazarComercio(
  id: string,
  motivo: string = 'No cumple con las pautas de moderación'
): Promise<{ success: boolean; error?: string }> {
  if (typeof window !== 'undefined') {
    try {
      const guardadosRaw = localStorage.getItem('vecinos_comercios_nuevos');
      if (guardadosRaw) {
        const guardados: Comercio[] = JSON.parse(guardadosRaw);
        const idx = guardados.findIndex((c) => c.id === id);
        if (idx >= 0) {
          guardados[idx].estado_aprobacion = 'rechazado';
          guardados[idx].motivo_rechazo = motivo;
          localStorage.setItem('vecinos_comercios_nuevos', JSON.stringify(guardados));
        }
      }
    } catch (e) {
      console.warn('[LocalStorage] Error al rechazar comercio:', e);
    }
  }

  if (isSupabaseConfigured) {
    try {
      await supabase.from('comercios').update({
        estado_aprobacion: 'rechazado',
        motivo_rechazo: motivo,
      }).eq('id', id);
    } catch (err) {
      console.warn('[Supabase] Error al rechazar en Supabase:', err);
    }
  }

  return { success: true };
}

/**
 * Elimina un comercio por su ID
 */
export async function eliminarComercio(id: string): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('comercios').delete().eq('id', id);
      if (error) {
        return { success: false, error: error.message };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const guardadosRaw = localStorage.getItem('vecinos_comercios_nuevos');
      if (guardadosRaw) {
        const guardados: Comercio[] = JSON.parse(guardadosRaw);
        const filtrados = guardados.filter((c) => c.id !== id);
        localStorage.setItem('vecinos_comercios_nuevos', JSON.stringify(filtrados));
      }
    } catch (e) {
      console.warn('[LocalStorage] Error al eliminar:', e);
    }
  }

  return { success: true };
}

/**
 * Alterna el estado de cierre momentáneo por algún inconveniente imprevisto (Emergencia con Caducidad Automática).
 * Al activarlo, el estado cambia inmediatamente a cerrado, y se calcula automáticamente la reapertura
 * programada para el inicio del siguiente día hábil a las 06:00 AM para evitar el olvido involuntario.
 */
export async function toggleCerradoMomentaneo(
  id: string,
  cerrado: boolean,
  motivo?: string,
  reaperturaCustom?: string
): Promise<{ success: boolean; reapertura?: string; error?: string }> {
  const ahora = new Date();
  const reapertura = cerrado
    ? (reaperturaCustom || calcularSiguienteDiaHabil6AM(ahora).toISOString())
    : undefined;

  const updates: Partial<Comercio> = {
    cerrado_momentaneo: cerrado,
    motivo_cierre_momentaneo: cerrado ? (motivo || 'Cerrado por emergencia o inconveniente imprevisto') : undefined,
    fecha_cierre_emergencia: cerrado ? ahora.toISOString() : undefined,
    reapertura_emergencia_programada: reapertura,
    esta_abierto: !cerrado,
  };

  if (typeof window !== 'undefined') {
    try {
      const guardadosRaw = localStorage.getItem('vecinos_comercios_nuevos');
      if (guardadosRaw) {
        const guardados: Comercio[] = JSON.parse(guardadosRaw);
        const idx = guardados.findIndex((c) => c.id === id);
        if (idx >= 0) {
          guardados[idx] = { ...guardados[idx], ...updates };
          localStorage.setItem('vecinos_comercios_nuevos', JSON.stringify(guardados));
        }
      }
    } catch (e) {
      console.warn('[LocalStorage] Error en toggleCerradoMomentaneo:', e);
    }
  }

  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('comercios')
        .update({
          cerrado_momentaneo: cerrado,
          motivo_cierre_momentaneo: cerrado ? (motivo || 'Cerrado por emergencia o inconveniente imprevisto') : null,
          fecha_cierre_emergencia: cerrado ? ahora.toISOString() : null,
          reapertura_emergencia_programada: reapertura || null,
          esta_abierto: !cerrado,
        })
        .eq('id', id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  }

  return { success: true, reapertura };
}

/**
 * Alterna el estado de "De Turno" para farmacias
 */
export async function toggleFarmaciaTurno(
  id: string,
  estaDeTurno: boolean
): Promise<{ success: boolean; error?: string }> {
  const hoyStr = new Date().toISOString().split('T')[0];

  if (typeof window !== 'undefined') {
    try {
      const guardadosRaw = localStorage.getItem('vecinos_comercios_nuevos');
      if (guardadosRaw) {
        const guardados: Comercio[] = JSON.parse(guardadosRaw);
        const idx = guardados.findIndex((c) => c.id === id);
        if (idx >= 0) {
          guardados[idx].esta_de_turno = estaDeTurno;
          guardados[idx].fecha_turno = estaDeTurno ? hoyStr : undefined;
          localStorage.setItem('vecinos_comercios_nuevos', JSON.stringify(guardados));
        }
      }
    } catch (e) {
      console.warn('[LocalStorage] Error en toggleFarmaciaTurno:', e);
    }
  }

  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('comercios')
        .update({
          esta_de_turno: estaDeTurno,
          fecha_turno: estaDeTurno ? hoyStr : null,
        })
        .eq('id', id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  }

  return { success: true };
}

/**
 * Configura período de vacaciones programadas obligatorias para un comercio.
 * Requiere fecha de inicio y día de "Retorno" (vacaciones_hasta).
 * Si la duración excede los 60 días, se oculta del mapa y se genera un ticket en el Panel Admin para revisión de baja definitiva.
 */
export async function configurarVacaciones(
  id: string,
  enVacaciones: boolean,
  desde?: string,
  hasta?: string,
  mensaje?: string
): Promise<{ success: boolean; diasVacaciones?: number; supera60Dias?: boolean; error?: string }> {
  if (enVacaciones && !hasta) {
    return { success: false, error: 'El día de Retorno es obligatorio para programar vacaciones.' };
  }

  const hoyStr = new Date().toISOString().split('T')[0];
  const fechaDesde = desde || hoyStr;
  let diasTotales = 0;
  let supera60Dias = false;

  if (enVacaciones && hasta) {
    const msInicio = new Date(fechaDesde).getTime();
    const msRetorno = new Date(hasta).getTime();
    if (msRetorno <= msInicio) {
      return { success: false, error: 'La fecha de retorno debe ser posterior a la fecha de inicio.' };
    }
    diasTotales = Math.round((msRetorno - msInicio) / (1000 * 60 * 60 * 24));
    supera60Dias = diasTotales > 60;
  }

  const updates: Partial<Comercio> = {
    en_vacaciones: enVacaciones,
    vacaciones_desde: enVacaciones ? fechaDesde : undefined,
    vacaciones_hasta: enVacaciones ? hasta : undefined,
    mensaje_vacaciones: enVacaciones ? (mensaje || 'Cerrado por vacaciones. ¡Pronto regresamos!') : undefined,
    esta_abierto: !enVacaciones,
    oculto_por_inactividad: enVacaciones ? supera60Dias : false,
    ticket_baja_definitiva: enVacaciones ? supera60Dias : false,
    fecha_ticket_baja: (enVacaciones && supera60Dias) ? new Date().toISOString() : undefined,
    motivo_ticket_baja: (enVacaciones && supera60Dias)
      ? `Vacaciones programadas de ${diasTotales} días (supera el límite de 60 días)`
      : undefined,
  };

  if (typeof window !== 'undefined') {
    try {
      const guardadosRaw = localStorage.getItem('vecinos_comercios_nuevos');
      if (guardadosRaw) {
        const guardados: Comercio[] = JSON.parse(guardadosRaw);
        const idx = guardados.findIndex((c) => c.id === id);
        if (idx >= 0) {
          guardados[idx] = { ...guardados[idx], ...updates };
          localStorage.setItem('vecinos_comercios_nuevos', JSON.stringify(guardados));
        }
      }
    } catch (e) {
      console.warn('[LocalStorage] Error en configurarVacaciones:', e);
    }
  }

  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('comercios')
        .update({
          en_vacaciones: enVacaciones,
          vacaciones_desde: enVacaciones ? (fechaDesde || null) : null,
          vacaciones_hasta: enVacaciones ? (hasta || null) : null,
          mensaje_vacaciones: enVacaciones ? (mensaje || 'Cerrado por vacaciones. ¡Pronto regresamos!') : null,
          oculto_por_inactividad: enVacaciones ? supera60Dias : false,
          ticket_baja_definitiva: enVacaciones ? supera60Dias : false,
          fecha_ticket_baja: (enVacaciones && supera60Dias) ? new Date().toISOString() : null,
          motivo_ticket_baja: (enVacaciones && supera60Dias)
            ? `Vacaciones programadas de ${diasTotales} días (supera el límite de 60 días)`
            : null,
          esta_abierto: !enVacaciones,
        })
        .eq('id', id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  }

  return { success: true, diasVacaciones: diasTotales, supera60Dias };
}

/**
 * Reanuda la actividad y vuelve a cumplir con los horarios normales.
 * Desactiva vacaciones, cierres momentáneos y tickets de inactividad en un solo paso.
 */
export async function reanudarHorarioNormal(id: string): Promise<{ success: boolean; error?: string }> {
  const updates: Partial<Comercio> = {
    cerrado_momentaneo: false,
    motivo_cierre_momentaneo: undefined,
    fecha_cierre_emergencia: undefined,
    reapertura_emergencia_programada: undefined,
    en_vacaciones: false,
    vacaciones_desde: undefined,
    vacaciones_hasta: undefined,
    mensaje_vacaciones: undefined,
    oculto_por_inactividad: false,
    ticket_baja_definitiva: false,
    fecha_ticket_baja: undefined,
    motivo_ticket_baja: undefined,
    esta_abierto: true,
  };

  if (typeof window !== 'undefined') {
    try {
      const guardadosRaw = localStorage.getItem('vecinos_comercios_nuevos');
      if (guardadosRaw) {
        const guardados: Comercio[] = JSON.parse(guardadosRaw);
        const idx = guardados.findIndex((c) => c.id === id);
        if (idx >= 0) {
          guardados[idx] = { ...guardados[idx], ...updates };
          localStorage.setItem('vecinos_comercios_nuevos', JSON.stringify(guardados));
        }
      }
    } catch (e) {
      console.warn('[LocalStorage] Error en reanudarHorarioNormal:', e);
    }
  }

  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('comercios')
        .update({
          cerrado_momentaneo: false,
          motivo_cierre_momentaneo: null,
          fecha_cierre_emergencia: null,
          reapertura_emergencia_programada: null,
          en_vacaciones: false,
          vacaciones_desde: null,
          vacaciones_hasta: null,
          mensaje_vacaciones: null,
          oculto_por_inactividad: false,
          ticket_baja_definitiva: false,
          fecha_ticket_baja: null,
          motivo_ticket_baja: null,
          esta_abierto: true,
        })
        .eq('id', id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  }

  return { success: true };
}

/**
 * Reactiva un comercio que fue ocultado por inactividad (+60 días) o vacaciones prolongadas.
 * Quita el ticket, limpia vacaciones y restablece la visibilidad pública en el mapa.
 */
export async function reactivarComercioInactivo(id: string): Promise<{ success: boolean; error?: string }> {
  return reanudarHorarioNormal(id);
}

/**
 * Confirma la baja definitiva de un comercio tras la revisión del administrador.
 * Deja al comercio marcado como rechazado/inactivo definitivamente y oculto del mapa.
 */
export async function confirmarBajaDefinitivaComercio(
  id: string,
  motivo: string = 'Baja definitiva por inactividad prolongada (+60 días en vacaciones)'
): Promise<{ success: boolean; error?: string }> {
  const updates: Partial<Comercio> = {
    estado_aprobacion: 'rechazado',
    motivo_rechazo: motivo,
    oculto_por_inactividad: true,
    ticket_baja_definitiva: false,
    esta_abierto: false,
  };

  if (typeof window !== 'undefined') {
    try {
      const guardadosRaw = localStorage.getItem('vecinos_comercios_nuevos');
      if (guardadosRaw) {
        const guardados: Comercio[] = JSON.parse(guardadosRaw);
        const idx = guardados.findIndex((c) => c.id === id);
        if (idx >= 0) {
          guardados[idx] = { ...guardados[idx], ...updates };
          localStorage.setItem('vecinos_comercios_nuevos', JSON.stringify(guardados));
        }
      }
    } catch (e) {
      console.warn('[LocalStorage] Error en confirmarBajaDefinitivaComercio:', e);
    }
  }

  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('comercios')
        .update({
          estado_aprobacion: 'rechazado',
          motivo_rechazo: motivo,
          oculto_por_inactividad: true,
          ticket_baja_definitiva: false,
          esta_abierto: false,
        })
        .eq('id', id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  }

  return { success: true };
}

// ==============================================================================
// GESTIÓN DE COMPROBANTES DE TRANSFERENCIA (PAGOS DE CATEGORÍAS PREMIUM Y GOLD)
// ==============================================================================

const STORAGE_KEYS_EXTRA = {
  COMPROBANTES: 'vecinos_comprobantes_transferencia',
  DEBATES: 'vecinos_debates_inconvenientes',
  MODIFICACIONES: 'vecinos_solicitudes_modificacion',
  REPORTES: 'vecinos_reportes_ciudadanos',
};

/**
 * Obtiene todos los comprobantes de transferencia registrados
 */
export async function getComprobantesTransferencia(): Promise<ComprobanteTransferencia[]> {
  let resultado: ComprobanteTransferencia[] = [];

  // 1. Cargar desde LocalStorage
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS_EXTRA.COMPROBANTES);
      if (raw) {
        resultado = JSON.parse(raw);
      }
    } catch (e) {
      console.warn('[LocalStorage] Error al leer comprobantes:', e);
    }
  }

  // 2. Si Supabase está disponible, consultar y combinar
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('comprobantes_transferencia')
        .select('*')
        .order('fecha_envio', { ascending: false });

      if (!error && data && data.length > 0) {
        const mapa = new Map<string, ComprobanteTransferencia>();
        resultado.forEach((c) => mapa.set(c.id, c));
        (data as ComprobanteTransferencia[]).forEach((dbItem) => mapa.set(dbItem.id, dbItem));
        resultado = Array.from(mapa.values());
      }
    } catch (err) {
      console.warn('[Supabase] Error al consultar comprobantes:', err);
    }
  }

  // Ordenar por fecha descendente
  return resultado.sort((a, b) => new Date(b.fecha_envio).getTime() - new Date(a.fecha_envio).getTime());
}

/**
 * Registra un nuevo comprobante de transferencia enviado por un comercio
 */
export async function guardarComprobanteTransferencia(
  comprobante: ComprobanteTransferencia
): Promise<{ success: boolean; error?: string }> {
  // 1. Guardar en LocalStorage
  if (typeof window !== 'undefined') {
    try {
      const actuales = await getComprobantesTransferencia();
      const actualizados = [comprobante, ...actuales.filter((c) => c.id !== comprobante.id)];
      localStorage.setItem(STORAGE_KEYS_EXTRA.COMPROBANTES, JSON.stringify(actualizados));
    } catch (e) {
      console.warn('[LocalStorage] Error al guardar comprobante:', e);
    }
  }

  // 2. Guardar en Supabase
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('comprobantes_transferencia').upsert({
        id: comprobante.id,
        comercio_id: comprobante.comercio_id,
        comercio_nombre: comprobante.comercio_nombre,
        categoria_solicitada: comprobante.categoria_solicitada,
        monto: comprobante.monto,
        fecha_envio: comprobante.fecha_envio,
        comprobante_url: comprobante.comprobante_url,
        comprobante_nombre: comprobante.comprobante_nombre,
        numero_operacion: comprobante.numero_operacion,
        banco_origen: comprobante.banco_origen,
        notas: comprobante.notas,
        estado: comprobante.estado || 'pendiente',
      });

      if (error) {
        console.warn('[Supabase] Error al insertar comprobante:', error.message);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[Supabase] Falló guardado remoto de comprobante:', msg);
    }
  }

  return { success: true };
}

/**
 * Aprueba el comprobante de transferencia y acredita automáticamente +1 mes extra (30 días)
 * a la suscripción del comercio en la categoría solicitada, comenzando a correr al finalizar el mes en curso.
 */
export async function aprobarComprobanteTransferencia(
  id: string,
  aprobadoPor: string = 'SuperAdmin'
): Promise<{ success: boolean; nuevaFechaVencimiento?: string; error?: string }> {
  const comprobantes = await getComprobantesTransferencia();
  const comprobante = comprobantes.find((c) => c.id === id);

  if (!comprobante) {
    return { success: false, error: 'Comprobante no encontrado' };
  }

  const fechaAprobacion = new Date().toISOString();

  // 1. Acreditar mes extra (+30 días) en la categoría solicitada
  const renovacion = await renovarMembresiaComercio(
    comprobante.comercio_id,
    30,
    comprobante.categoria_solicitada
  );

  if (!renovacion.success) {
    return { success: false, error: renovacion.error || 'Error al renovar membresía del comercio' };
  }

  // 2. Actualizar estado del comprobante en LocalStorage
  if (typeof window !== 'undefined') {
    try {
      const actualizados = comprobantes.map((c) => {
        if (c.id === id) {
          return {
            ...c,
            estado: 'aprobado' as const,
            aprobado_por: aprobadoPor,
            fecha_aprobacion: fechaAprobacion,
          };
        }
        return c;
      });
      localStorage.setItem(STORAGE_KEYS_EXTRA.COMPROBANTES, JSON.stringify(actualizados));
    } catch (e) {
      console.warn('[LocalStorage] Error al actualizar estado de comprobante:', e);
    }
  }

  // 3. Actualizar en Supabase
  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('comprobantes_transferencia')
        .update({
          estado: 'aprobado',
          aprobado_por: aprobadoPor,
          fecha_aprobacion: fechaAprobacion,
        })
        .eq('id', id);
    } catch (err) {
      console.warn('[Supabase] Error al actualizar comprobante:', err);
    }
  }

  return { success: true, nuevaFechaVencimiento: renovacion.nuevaFechaVencimiento };
}

/**
 * Rechaza un comprobante de transferencia con motivo
 */
export async function rechazarComprobanteTransferencia(
  id: string,
  motivo: string,
  aprobadoPor: string = 'SuperAdmin'
): Promise<{ success: boolean; error?: string }> {
  const fecha = new Date().toISOString();

  if (typeof window !== 'undefined') {
    try {
      const comprobantes = await getComprobantesTransferencia();
      const actualizados = comprobantes.map((c) => {
        if (c.id === id) {
          return {
            ...c,
            estado: 'rechazado' as const,
            motivo_rechazo: motivo,
            aprobado_por: aprobadoPor,
            fecha_aprobacion: fecha,
          };
        }
        return c;
      });
      localStorage.setItem(STORAGE_KEYS_EXTRA.COMPROBANTES, JSON.stringify(actualizados));
    } catch (e) {
      console.warn('[LocalStorage] Error al rechazar comprobante:', e);
    }
  }

  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('comprobantes_transferencia')
        .update({
          estado: 'rechazado',
          motivo_rechazo: motivo,
          aprobado_por: aprobadoPor,
          fecha_aprobacion: fecha,
        })
        .eq('id', id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  }

  return { success: true };
}

// ==============================================================================
// GESTIÓN DE DEBATES E INCONVENIENTES (USUARIOS - COMERCIOS - ADMINISTRADOR)
// ==============================================================================

/**
 * Obtiene todos los debates del sistema (para el Administrador)
 */
export async function getDebates(): Promise<DebateInconveniente[]> {
  let resultado: DebateInconveniente[] = [];

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS_EXTRA.DEBATES);
      if (raw) {
        resultado = JSON.parse(raw);
      }
    } catch (e) {
      console.warn('[LocalStorage] Error al leer debates:', e);
    }
  }

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('debates_inconvenientes')
        .select('*')
        .order('fecha_creacion', { ascending: false });

      if (!error && data && data.length > 0) {
        const mapa = new Map<string, DebateInconveniente>();
        resultado.forEach((d) => mapa.set(d.id, d));
        (data as DebateInconveniente[]).forEach((dbItem) => mapa.set(dbItem.id, dbItem));
        resultado = Array.from(mapa.values());
      }
    } catch (err) {
      console.warn('[Supabase] Error al consultar debates:', err);
    }
  }

  return resultado.sort((a, b) => new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime());
}

/**
 * Obtiene debates correspondientes a un comercio específico
 */
export async function getDebatesPorComercio(comercioId: string): Promise<DebateInconveniente[]> {
  const todos = await getDebates();
  return todos.filter((d) => d.comercio_id === comercioId);
}

/**
 * Registra un nuevo inconveniente/debate iniciado por un usuario
 */
export async function guardarDebate(
  debate: DebateInconveniente
): Promise<{ success: boolean; error?: string }> {
  if (typeof window !== 'undefined') {
    try {
      const actuales = await getDebates();
      const actualizados = [debate, ...actuales.filter((d) => d.id !== debate.id)];
      localStorage.setItem(STORAGE_KEYS_EXTRA.DEBATES, JSON.stringify(actualizados));
    } catch (e) {
      console.warn('[LocalStorage] Error al guardar debate:', e);
    }
  }

  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('debates_inconvenientes').upsert({
        id: debate.id,
        comercio_id: debate.comercio_id,
        comercio_nombre: debate.comercio_nombre,
        usuario_id: debate.usuario_id,
        usuario_nombre: debate.usuario_nombre,
        usuario_email: debate.usuario_email,
        usuario_telefono: debate.usuario_telefono,
        motivo: debate.motivo,
        descripcion: debate.descripcion,
        fecha_creacion: debate.fecha_creacion,
        estado: debate.estado || 'abierto',
      });
      if (error) console.warn('[Supabase] Error en debate:', error.message);
    } catch (err) {
      console.warn('[Supabase] Error remoto al guardar debate:', err);
    }
  }

  return { success: true };
}

/**
 * Registra la respuesta del comercio al debate
 */
export async function responderDebateComercio(
  id: string,
  respuesta: string
): Promise<{ success: boolean; error?: string }> {
  const fecha = new Date().toISOString();

  if (typeof window !== 'undefined') {
    try {
      const debates = await getDebates();
      const actualizados = debates.map((d) => {
        if (d.id === id) {
          return {
            ...d,
            respuesta_comercio: respuesta,
            fecha_respuesta: fecha,
            estado: d.estado === 'abierto' ? ('en_revision' as EstadoDebate) : d.estado,
          };
        }
        return d;
      });
      localStorage.setItem(STORAGE_KEYS_EXTRA.DEBATES, JSON.stringify(actualizados));
    } catch (e) {
      console.warn('[LocalStorage] Error al responder debate:', e);
    }
  }

  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('debates_inconvenientes')
        .update({
          respuesta_comercio: respuesta,
          fecha_respuesta: fecha,
          estado: 'en_revision',
        })
        .eq('id', id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  }

  return { success: true };
}

/**
 * Actualiza el estado de un debate (por ejemplo, 'resuelto' por el admin o comercio)
 */
export async function actualizarEstadoDebate(
  id: string,
  estado: EstadoDebate,
  notaAdmin?: string
): Promise<{ success: boolean; error?: string }> {
  const fechaRes = estado === 'resuelto' ? new Date().toISOString() : undefined;

  if (typeof window !== 'undefined') {
    try {
      const debates = await getDebates();
      const actualizados = debates.map((d) => {
        if (d.id === id) {
          return {
            ...d,
            estado,
            nota_administrador: notaAdmin !== undefined ? notaAdmin : d.nota_administrador,
            fecha_resolucion: fechaRes || d.fecha_resolucion,
          };
        }
        return d;
      });
      localStorage.setItem(STORAGE_KEYS_EXTRA.DEBATES, JSON.stringify(actualizados));
    } catch (e) {
      console.warn('[LocalStorage] Error al actualizar estado de debate:', e);
    }
  }

  if (isSupabaseConfigured) {
    try {
      const updates: any = { estado };
      if (notaAdmin !== undefined) updates.nota_administrador = notaAdmin;
      if (fechaRes) updates.fecha_resolucion = fechaRes;

      await supabase.from('debates_inconvenientes').update(updates).eq('id', id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  }

  return { success: true };
}

// ==============================================================================
// GESTIÓN DE MODIFICACIONES DE COMERCIOS (CON APROBACIÓN DEL ADMINISTRADOR)
// ==============================================================================

/**
 * Obtiene todas las solicitudes de modificación enviadas por los comercios
 */
export async function getSolicitudesModificacion(): Promise<ModificacionComercio[]> {
  let resultado: ModificacionComercio[] = [];

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS_EXTRA.MODIFICACIONES);
      if (raw) {
        resultado = JSON.parse(raw);
      }
    } catch (e) {
      console.warn('[LocalStorage] Error al leer solicitudes de modificación:', e);
    }
  }

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('solicitudes_modificacion')
        .select('*')
        .order('fecha_solicitud', { ascending: false });

      if (!error && data && data.length > 0) {
        const mapa = new Map<string, ModificacionComercio>();
        resultado.forEach((s) => mapa.set(s.id, s));
        (data as ModificacionComercio[]).forEach((dbItem) => mapa.set(dbItem.id, dbItem));
        resultado = Array.from(mapa.values());
      }
    } catch (err) {
      console.warn('[Supabase] Error al consultar solicitudes de modificación:', err);
    }
  }

  return resultado.sort((a, b) => new Date(b.fecha_solicitud).getTime() - new Date(a.fecha_solicitud).getTime());
}

/**
 * Un comercio envía una solicitud para modificar sus opciones o datos
 */
export async function guardarSolicitudModificacion(
  solicitud: ModificacionComercio
): Promise<{ success: boolean; error?: string }> {
  if (typeof window !== 'undefined') {
    try {
      const actuales = await getSolicitudesModificacion();
      const actualizados = [solicitud, ...actuales.filter((s) => s.id !== solicitud.id)];
      localStorage.setItem(STORAGE_KEYS_EXTRA.MODIFICACIONES, JSON.stringify(actualizados));
    } catch (e) {
      console.warn('[LocalStorage] Error al guardar solicitud de modificación:', e);
    }
  }

  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('solicitudes_modificacion').upsert({
        id: solicitud.id,
        comercio_id: solicitud.comercio_id,
        comercio_nombre: solicitud.comercio_nombre,
        cambios: solicitud.cambios,
        datos_anteriores: solicitud.datos_anteriores,
        fecha_solicitud: solicitud.fecha_solicitud,
        estado: solicitud.estado || 'pendiente',
      });
      if (error) console.warn('[Supabase] Error al guardar mod:', error.message);
    } catch (err) {
      console.warn('[Supabase] Error remoto:', err);
    }
  }

  return { success: true };
}

/**
 * El administrador aprueba las modificaciones del comercio y aplica los cambios
 */
export async function aprobarSolicitudModificacion(
  solicitudId: string,
  aprobadoPor: string = 'SuperAdmin'
): Promise<{ success: boolean; error?: string }> {
  const solicitudes = await getSolicitudesModificacion();
  const solicitud = solicitudes.find((s) => s.id === solicitudId);

  if (!solicitud) {
    return { success: false, error: 'Solicitud no encontrada' };
  }

  const fechaAprobacion = new Date().toISOString();

  // 1. Aplicar los cambios al comercio en localStorage
  if (typeof window !== 'undefined') {
    try {
      const guardadosRaw = localStorage.getItem('vecinos_comercios_nuevos');
      if (guardadosRaw) {
        const comercios: Comercio[] = JSON.parse(guardadosRaw);
        const idx = comercios.findIndex((c) => c.id === solicitud.comercio_id);
        if (idx >= 0) {
          comercios[idx] = {
            ...comercios[idx],
            ...solicitud.cambios,
          };
          localStorage.setItem('vecinos_comercios_nuevos', JSON.stringify(comercios));
        }
      }

      // Marcar solicitud como aprobada
      const actSolicitudes = solicitudes.map((s) => {
        if (s.id === solicitudId) {
          return {
            ...s,
            estado: 'aprobado' as const,
            aprobado_por: aprobadoPor,
            fecha_aprobacion: fechaAprobacion,
          };
        }
        return s;
      });
      localStorage.setItem(STORAGE_KEYS_EXTRA.MODIFICACIONES, JSON.stringify(actSolicitudes));
    } catch (e) {
      console.warn('[LocalStorage] Error al aplicar modificaciones:', e);
    }
  }

  // 2. Aplicar los cambios en Supabase
  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('comercios')
        .update(solicitud.cambios)
        .eq('id', solicitud.comercio_id);

      await supabase
        .from('solicitudes_modificacion')
        .update({
          estado: 'aprobado',
          aprobado_por: aprobadoPor,
          fecha_aprobacion: fechaAprobacion,
        })
        .eq('id', solicitudId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  }

  return { success: true };
}

/**
 * El administrador rechaza las modificaciones solicitadas
 */
export async function rechazarSolicitudModificacion(
  solicitudId: string,
  motivo: string,
  aprobadoPor: string = 'SuperAdmin'
): Promise<{ success: boolean; error?: string }> {
  const fecha = new Date().toISOString();

  if (typeof window !== 'undefined') {
    try {
      const solicitudes = await getSolicitudesModificacion();
      const actualizadas = solicitudes.map((s) => {
        if (s.id === solicitudId) {
          return {
            ...s,
            estado: 'rechazado' as const,
            motivo_rechazo: motivo,
            aprobado_por: aprobadoPor,
            fecha_aprobacion: fecha,
          };
        }
        return s;
      });
      localStorage.setItem(STORAGE_KEYS_EXTRA.MODIFICACIONES, JSON.stringify(actualizadas));
    } catch (e) {
      console.warn('[LocalStorage] Error al rechazar solicitud:', e);
    }
  }

  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('solicitudes_modificacion')
        .update({
          estado: 'rechazado',
          motivo_rechazo: motivo,
          aprobado_por: aprobadoPor,
          fecha_aprobacion: fecha,
        })
        .eq('id', solicitudId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  }

  return { success: true };
}

// ==============================================================================
// GESTIÓN DE REPORTES CIUDADANOS, STRIKES Y CUARENTENA PREVENTIVA
// ==============================================================================

/**
 * Obtiene todos los reportes ciudadanos registrados (o los de un comercio específico)
 */
export async function getReportesComercio(comercioId?: string): Promise<ReporteComercio[]> {
  let resultado: ReporteComercio[] = [];

  // 1. Cargar desde LocalStorage
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS_EXTRA.REPORTES);
      if (raw) {
        resultado = JSON.parse(raw);
      }
    } catch (e) {
      console.warn('[LocalStorage] Error al leer reportes:', e);
    }
  }

  // 2. Si Supabase está disponible, consultar y combinar
  if (isSupabaseConfigured) {
    try {
      let query = supabase.from('reportes').select('*').order('fecha', { ascending: false });
      if (comercioId) {
        query = query.eq('comercio_id', comercioId);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        const mapa = new Map<string, ReporteComercio>();
        resultado.forEach((r) => mapa.set(r.id, r));
        (data as ReporteComercio[]).forEach((dbItem) => mapa.set(dbItem.id, dbItem));
        resultado = Array.from(mapa.values());
      }
    } catch (err) {
      console.warn('[Supabase] Error al consultar reportes:', err);
    }
  }

  if (comercioId) {
    resultado = resultado.filter((r) => r.comercio_id === comercioId);
  }

  return resultado.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
}

/**
 * Registra un reporte ciudadano aplicando las reglas anti-spam:
 * Regla 1: Un mismo dispositivo/IP no puede emitir más de un reporte al mismo comercio en 30 días.
 * Regla 2: Se necesitan 3 reportes de usuarios diferentes en una ventana de 15 días para activar la cuarentena.
 */
export async function registrarReporteComercio(datos: {
  comercio_id: string;
  motivo: MotivoReporte;
  ip_usuario: string;
  fingerprint: string;
}): Promise<{
  success: boolean;
  enCuarentena?: boolean;
  strikes?: number;
  mensaje?: string;
  error?: string;
}> {
  const ahora = Date.now();
  const ms30Dias = 30 * 24 * 60 * 60 * 1000;
  const ms15Dias = 15 * 24 * 60 * 60 * 1000;

  // 1. Obtener historial de reportes existentes
  const todosLosReportes = await getReportesComercio();

  // 2. REGLA 1: Verificar si este IP o Fingerprint ya reportó a este comercio en los últimos 30 días
  const yaReportoEn30Dias = todosLosReportes.some((r) => {
    if (r.comercio_id !== datos.comercio_id) return false;
    const fechaReporte = new Date(r.fecha).getTime();
    if (isNaN(fechaReporte) || ahora - fechaReporte > ms30Dias) return false;

    // Coincide IP o Huella digital
    const coincideFp = Boolean(r.fingerprint && datos.fingerprint && r.fingerprint === datos.fingerprint);
    const coincideIp = Boolean(r.ip_usuario && datos.ip_usuario && r.ip_usuario === datos.ip_usuario);
    return coincideFp || coincideIp;
  });

  if (yaReportoEn30Dias) {
    return {
      success: false,
      error: 'Un mismo dispositivo o red no puede emitir más de un reporte al mismo comercio en un período de 30 días.',
    };
  }

  // 3. Crear el nuevo reporte
  const nuevoReporte: ReporteComercio = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `rep-${Date.now()}`,
    comercio_id: datos.comercio_id,
    motivo: datos.motivo,
    ip_usuario: datos.ip_usuario,
    fingerprint: datos.fingerprint,
    fecha: new Date().toISOString(),
  };

  const listaActualizada = [nuevoReporte, ...todosLosReportes];

  // Guardar en LocalStorage
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEYS_EXTRA.REPORTES, JSON.stringify(listaActualizada));
    } catch (e) {
      console.warn('[LocalStorage] Error al guardar reporte:', e);
    }
  }

  // Guardar en Supabase
  if (isSupabaseConfigured) {
    try {
      await supabase.from('reportes').insert([nuevoReporte]);
    } catch (err) {
      console.warn('[Supabase] Error al insertar reporte:', err);
    }
  }

  // 4. REGLA 2: Contar reportes de usuarios únicos en la ventana de los últimos 15 días
  const reportesUltimos15Dias = listaActualizada.filter((r) => {
    if (r.comercio_id !== datos.comercio_id) return false;
    const fechaReporte = new Date(r.fecha).getTime();
    return !isNaN(fechaReporte) && ahora - fechaReporte <= ms15Dias;
  });

  // Identificadores únicos de usuario (por fingerprint o IP)
  const usuariosUnicos = new Set<string>();
  reportesUltimos15Dias.forEach((r) => {
    const identificador = r.fingerprint || r.ip_usuario;
    if (identificador) {
      usuariosUnicos.add(identificador);
    }
  });

  const strikes = usuariosUnicos.size;
  const superaUmbralCuarentena = strikes >= 3;

  // 5. Actualizar el comercio en memoria / LocalStorage y en Supabase
  const comercios = await getComercios();
  const comercioObjetivo = comercios.find((c) => c.id === datos.comercio_id);

  if (comercioObjetivo) {
    const comercioActualizado: Comercio = {
      ...comercioObjetivo,
      strikes_reportes: strikes,
      en_cuarentena: superaUmbralCuarentena ? true : comercioObjetivo.en_cuarentena,
      fecha_cuarentena: superaUmbralCuarentena
        ? comercioObjetivo.fecha_cuarentena || new Date().toISOString()
        : comercioObjetivo.fecha_cuarentena,
      motivo_cuarentena: superaUmbralCuarentena
        ? `Cuarentena preventiva: ${strikes} reportes ciudadanos recibidos en menos de 15 días`
        : comercioObjetivo.motivo_cuarentena,
    };

    await guardarComercio(comercioActualizado);
  }

  return {
    success: true,
    enCuarentena: superaUmbralCuarentena,
    strikes,
    mensaje: superaUmbralCuarentena
      ? 'Tu reporte fue registrado. El comercio ha acumulado 3 reportes ciudadanos en 15 días y ha sido derivado a cuarentena preventiva.'
      : 'Tu sugerencia de corrección fue registrada con éxito. ¡Gracias por colaborar con la comunidad!',
  };
}

/**
 * Auto-resolución por el comerciante: "Confirmar que sigo operativo"
 * Restablece el comercio quitándole la cuarentena y limpiando reportes vigentes.
 */
export async function autoResolverCuarentenaComercio(
  comercioId: string
): Promise<{ success: boolean; error?: string }> {
  // 1. Actualizar comercio
  const comercios = await getComercios();
  const comercio = comercios.find((c) => c.id === comercioId);
  if (!comercio) {
    return { success: false, error: 'Comercio no encontrado' };
  }

  const comercioActualizado: Comercio = {
    ...comercio,
    en_cuarentena: false,
    fecha_cuarentena: undefined,
    motivo_cuarentena: undefined,
    strikes_reportes: 0,
    esta_abierto: true,
  };

  await guardarComercio(comercioActualizado);

  // 2. Limpiar reportes activos de este comercio para evitar que vuelva a entrar inmediatamente
  if (typeof window !== 'undefined') {
    try {
      const reportes = await getReportesComercio();
      const filtrados = reportes.filter((r) => r.comercio_id !== comercioId);
      localStorage.setItem(STORAGE_KEYS_EXTRA.REPORTES, JSON.stringify(filtrados));
    } catch (e) {
      console.warn('[LocalStorage] Error al limpiar reportes en auto-resolución:', e);
    }
  }

  if (isSupabaseConfigured) {
    try {
      await supabase.from('reportes').delete().eq('comercio_id', comercioId);
    } catch (err) {
      console.warn('[Supabase] Error al limpiar reportes en Supabase:', err);
    }
  }

  return { success: true };
}

/**
 * El administrador levanta manualmente la cuarentena del comercio
 */
export async function levantarCuarentenaAdmin(
  comercioId: string
): Promise<{ success: boolean; error?: string }> {
  return autoResolverCuarentenaComercio(comercioId);
}


