import { NextRequest, NextResponse } from 'next/server';
import { getComercios, guardarComercio } from '@/lib/supabase';
import { Comercio, Producto } from '@/types/comercio';

/**
 * Endpoint de Cron Automatizado NeoFaro
 * Ejecución sugerida: Diariamente a las 05:00 AM (05:00 ART)
 * 
 * Acciones ejecutadas:
 * 1. Despublicación y reseteo de ofertas caducadas (ciclo diario de 05:00 AM o por hora_vencimiento_oferta).
 * 2. Reapertura automática de comercios cerrados por emergencia cumplida su caducidad.
 * 3. Auto-archivo de productos en estado "agotado" por más de 30 días.
 * 4. Reseteo mensual del contador de cierres de emergencia y registro de disciplina.
 */
export async function GET(req: NextRequest) {
  return ejecutarResetDiario(req);
}

export async function POST(req: NextRequest) {
  return ejecutarResetDiario(req);
}

async function ejecutarResetDiario(req: NextRequest) {
  try {
    // 1. Verificación de Seguridad Opcional mediante Bearer Token (CRON_SECRET)
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret) {
      const token = authHeader?.replace('Bearer ', '');
      if (token !== cronSecret) {
        return NextResponse.json(
          { success: false, error: 'No autorizado para ejecutar el proceso de reinicio diario.' },
          { status: 401 }
        );
      }
    }

    const ahora = new Date();
    const ahoraMs = ahora.getTime();
    const mesActualStr = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`;
    const ms30Dias = 30 * 24 * 60 * 60 * 1000;

    const comercios = await getComercios();

    let ofertasDespublicadas = 0;
    let comerciosReabiertos = 0;
    let productosArchivados = 0;
    let contadoresMesReseteados = 0;
    const comerciosModificados: Comercio[] = [];

    for (const comercio of comercios) {
      let modificado = false;
      const copia: Comercio = { ...comercio };

      // 1. Gestión de Ofertas y Stock Agotado en Catálogo
      if (copia.productos && Array.isArray(copia.productos)) {
        const productosActualizados: Producto[] = [];

        for (const prod of copia.productos) {
          let prodModificado = false;
          const prodCopia: Producto = { ...prod };

          // A. Vencimiento de Oferta
          if (prodCopia.es_oferta) {
            let ofertaVencida = false;

            if (prodCopia.hora_vencimiento_oferta) {
              const vtoDate = new Date(prodCopia.hora_vencimiento_oferta).getTime();
              if (!isNaN(vtoDate) && vtoDate <= ahoraMs) {
                ofertaVencida = true;
              }
            } else if (prodCopia.fecha_oferta) {
              // Si la fecha de oferta es de un día anterior al actual
              const fechaOferta = new Date(prodCopia.fecha_oferta);
              const esMismoDia =
                fechaOferta.getDate() === ahora.getDate() &&
                fechaOferta.getMonth() === ahora.getMonth() &&
                fechaOferta.getFullYear() === ahora.getFullYear();

              if (!esMismoDia) {
                ofertaVencida = true;
              }
            } else {
              // Por defecto, las ofertas barriales caducan al ciclo de las 05:00 AM
              ofertaVencida = true;
            }

            if (ofertaVencida) {
              prodCopia.es_oferta = false;
              prodCopia.precio_oferta = undefined;
              prodCopia.descuento_porcentaje = undefined;
              prodCopia.hora_vencimiento_oferta = undefined;
              prodCopia.duracion_horas_oferta = undefined;
              prodCopia.unidades_limitadas = undefined;
              prodModificado = true;
              ofertasDespublicadas++;
            }
          }

          // B. Auto-archivo de productos agotados con más de 30 días
          if (prodCopia.agotado && prodCopia.fecha_agotado) {
            const fechaAgotadoMs = new Date(prodCopia.fecha_agotado).getTime();
            if (!isNaN(fechaAgotadoMs) && ahoraMs - fechaAgotadoMs > ms30Dias) {
              // Se excluye del catálogo activo (archivado automático)
              productosArchivados++;
              modificado = true;
              continue; // no lo agregamos a productosActualizados
            }
          }

          if (prodModificado) {
            modificado = true;
          }
          productosActualizados.push(prodCopia);
        }

        if (modificado) {
          copia.productos = productosActualizados;
        }
      }

      // 2. Reapertura de Cierres de Emergencia Caducados
      if (copia.cerrado_momentaneo) {
        let debeReabrir = false;

        if (copia.reapertura_emergencia_programada) {
          const reaperturaMs = new Date(copia.reapertura_emergencia_programada).getTime();
          if (!isNaN(reaperturaMs) && ahoraMs >= reaperturaMs) {
            debeReabrir = true;
          }
        } else {
          // Si no tiene fecha específica, a las 05:00 AM se restablece para el próximo turno
          debeReabrir = true;
        }

        if (debeReabrir) {
          copia.cerrado_momentaneo = false;
          copia.motivo_cierre_momentaneo = undefined;
          copia.fecha_cierre_emergencia = undefined;
          copia.reapertura_emergencia_programada = undefined;
          copia.esta_abierto = true;
          comerciosReabiertos++;
          modificado = true;
        }
      }

      // 3. Reseteo Mensual del Contador de Urgencias (si cambió el mes calendario)
      if (copia.mes_contador_urgencias && copia.mes_contador_urgencias !== mesActualStr) {
        copia.contador_urgencias_mes = 0;
        copia.mes_contador_urgencias = mesActualStr;
        contadoresMesReseteados++;
        modificado = true;
      } else if (!copia.mes_contador_urgencias) {
        copia.mes_contador_urgencias = mesActualStr;
      }

      if (modificado) {
        comerciosModificados.push(copia);
        await guardarComercio(copia);
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: ahora.toISOString(),
      resumen: {
        totalComerciosRevisados: comercios.length,
        comerciosModificados: comerciosModificados.length,
        ofertasDespublicadas,
        comerciosReabiertos,
        productosArchivados,
        contadoresMesReseteados,
      },
      mensaje: `Ciclo 05:00 AM completado con éxito. ${ofertasDespublicadas} ofertas caducadas despublicadas, ${comerciosReabiertos} locales reabiertos.`,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Error desconocido en ciclo de reset diario';
    console.error('[CRON 05:00 AM Error]:', error);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}
