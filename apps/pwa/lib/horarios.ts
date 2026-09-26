import { Comercio, HorariosConfig, HorarioDia, HorarioTurno, DiaSemana } from '@/types/comercio';

const DIAS_CLAVES: DiaSemana[] = [
  'domingo',
  'lunes',
  'martes',
  'miercoles',
  'jueves',
  'viernes',
  'sabado',
];

const DIAS_NOMBRES: Record<DiaSemana, string> = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
  sabado: 'Sábado',
  domingo: 'Domingo',
};

/**
 * Determina si un turno cruza la medianoche (ej: 20:00 a 03:00 del día siguiente)
 */
export function esHorarioTrasnoche(abre: string, cierra: string): boolean {
  if (!abre || !cierra) return false;
  const [hAbre, mAbre] = abre.split(':').map(Number);
  const [hCierra, mCierra] = cierra.split(':').map(Number);
  if (isNaN(hAbre) || isNaN(hCierra)) return false;

  const minAbre = hAbre * 60 + (mAbre || 0);
  const minCierra = hCierra * 60 + (mCierra || 0);
  return minCierra < minAbre;
}

/**
 * Plantilla por defecto de horarios estructurados
 */
export function obtenerHorariosConfigPorDefecto(): HorariosConfig {
  const diaHabil: HorarioDia = {
    abierto: true,
    turnos: [{ abre: '08:30', cierra: '20:30', esTrasnoche: false }],
  };

  const sabado: HorarioDia = {
    abierto: true,
    turnos: [{ abre: '09:00', cierra: '13:30', esTrasnoche: false }],
  };

  const domingo: HorarioDia = {
    abierto: false,
    turnos: [],
  };

  return {
    modo: 'bloques',
    bloques: {
      lunesViernes: { ...diaHabil },
      sabado: { ...sabado },
      domingoFeriados: { ...domingo },
    },
    dias: {
      lunes: { ...diaHabil },
      martes: { ...diaHabil },
      miercoles: { ...diaHabil },
      jueves: { ...diaHabil },
      viernes: { ...diaHabil },
      sabado: { ...sabado },
      domingo: { ...domingo },
    },
    resumenFormateado: 'Lun a Vie: 08:30 a 20:30 hs | Sáb: 09:00 a 13:30 hs | Dom: Cerrado',
  };
}

export const HORARIOS_DEFECTO: HorariosConfig = obtenerHorariosConfigPorDefecto();


/**
 * Obtiene la configuración de un día específico según el modo (bloques o personalizado)
 */
export function obtenerConfiguracionDia(config: HorariosConfig, dia: DiaSemana): HorarioDia {
  if (config.modo === 'personalizado' && config.dias) {
    return config.dias[dia] || { abierto: false, turnos: [] };
  }

  if (config.bloques) {
    if (dia === 'sabado') return config.bloques.sabado;
    if (dia === 'domingo') return config.bloques.domingoFeriados;
    return config.bloques.lunesViernes;
  }

  return { abierto: false, turnos: [] };
}

/**
 * Formatea los horarios estructurados en una descripción compacta y legible
 */
export function formatearHorariosLegibles(config: HorariosConfig): string {
  if (config.modo === 'bloques' && config.bloques) {
    const { lunesViernes, sabado, domingoFeriados } = config.bloques;

    const textoLV = lunesViernes.abierto
      ? `Lun a Vie: ${lunesViernes.turnos
          .map((t) => `${t.abre} a ${t.cierra}${esHorarioTrasnoche(t.abre, t.cierra) ? ' (trasnoche)' : ''}`)
          .join(' y ')} hs`
      : 'Lun a Vie: Cerrado';

    const textoSab = sabado.abierto
      ? `Sáb: ${sabado.turnos
          .map((t) => `${t.abre} a ${t.cierra}${esHorarioTrasnoche(t.abre, t.cierra) ? ' (trasnoche)' : ''}`)
          .join(' y ')} hs`
      : 'Sáb: Cerrado';

    const textoDom = domingoFeriados.abierto
      ? `Dom: ${domingoFeriados.turnos
          .map((t) => `${t.abre} a ${t.cierra}${esHorarioTrasnoche(t.abre, t.cierra) ? ' (trasnoche)' : ''}`)
          .join(' y ')} hs`
      : 'Dom: Cerrado';

    return `${textoLV} | ${textoSab} | ${textoDom}`;
  }

  if (config.modo === 'personalizado' && config.dias) {
    const partes: string[] = [];
    DIAS_CLAVES.slice(1)
      .concat(DIAS_CLAVES[0]) // Lunes a Domingo
      .forEach((d) => {
        const diaConf = config.dias![d];
        const nom = DIAS_NOMBRES[d].slice(0, 3);
        if (!diaConf || !diaConf.abierto || diaConf.turnos.length === 0) {
          partes.push(`${nom}: Cerrado`);
        } else {
          const turnosTxt = diaConf.turnos
            .map((t) => `${t.abre} a ${t.cierra}${esHorarioTrasnoche(t.abre, t.cierra) ? ' (trasnoche)' : ''}`)
            .join(' y ');
          partes.push(`${nom}: ${turnosTxt} hs`);
        }
      });
    return partes.join(' | ');
  }

  return 'Horario habitual';
}

/**
 * Verifica en tiempo real si un comercio está abierto considerando días específicos y trasnoche (cruces de medianoche)
 */
export function verificarComercioAbierto(
  comercio: Comercio,
  fechaReferencia: Date = new Date()
): {
  estaAbierto: boolean;
  motivo?: string;
  badgeTexto: string;
  esTrasnoche?: boolean;
} {
  // 1. Cierres excepcionales prioritarios
  if (comercio.en_vacaciones) {
    return {
      estaAbierto: false,
      motivo: comercio.mensaje_vacaciones || 'Cerrado por vacaciones',
      badgeTexto: 'Vacaciones',
    };
  }

  if (comercio.cerrado_momentaneo) {
    return {
      estaAbierto: false,
      motivo: comercio.motivo_cierre_momentaneo || 'Cerrado momentáneamente por inconvenientes',
      badgeTexto: 'Cierre Temporal',
    };
  }

  if (comercio.esta_de_turno) {
    return {
      estaAbierto: true,
      motivo: 'Farmacia de turno activa las 24 hs',
      badgeTexto: 'De Turno 24hs',
    };
  }

  const config = comercio.horarios_config;

  // Si no cuenta con horarios estructurados, usar el booleano y texto simple
  if (!config) {
    const abierto = Boolean(comercio.esta_abierto);
    return {
      estaAbierto: abierto,
      motivo: comercio.horario || (abierto ? 'Abierto' : 'Cerrado'),
      badgeTexto: abierto ? 'Abierto' : 'Cerrado',
    };
  }

  const diaSemanaIndex = fechaReferencia.getDay(); // 0: Dom, 1: Lun, ..., 6: Sab
  const diaHoy = DIAS_CLAVES[diaSemanaIndex];
  const diaAyer = DIAS_CLAVES[(diaSemanaIndex + 6) % 7];

  const horas = fechaReferencia.getHours();
  const minutos = fechaReferencia.getMinutes();
  const minutosActuales = horas * 60 + minutos;

  // 2. Comprobar si un turno de trasnoche de AYER sigue activo hoy en la madrugada
  // Ej: Ayer Viernes abrió a las 20:00 y cierra a las 03:00 del Sábado. Si ahora es Sábado 01:30, está abierto.
  const confAyer = obtenerConfiguracionDia(config, diaAyer);
  if (confAyer.abierto) {
    for (const turno of confAyer.turnos) {
      if (esHorarioTrasnoche(turno.abre, turno.cierra)) {
        const [hCierra, mCierra] = turno.cierra.split(':').map(Number);
        const minutosCierra = hCierra * 60 + (mCierra || 0);
        if (minutosActuales < minutosCierra) {
          return {
            estaAbierto: true,
            motivo: `Turno trasnoche activo (cierra ${turno.cierra} hs)`,
            badgeTexto: `Abierto hasta ${turno.cierra}`,
            esTrasnoche: true,
          };
        }
      }
    }
  }

  // 3. Comprobar los turnos de HOY
  const confHoy = obtenerConfiguracionDia(config, diaHoy);
  if (!confHoy.abierto || confHoy.turnos.length === 0) {
    return {
      estaAbierto: false,
      motivo: `Hoy ${DIAS_NOMBRES[diaHoy]} permanece cerrado`,
      badgeTexto: 'Cerrado hoy',
    };
  }

  for (const turno of confHoy.turnos) {
    const [hAbre, mAbre] = turno.abre.split(':').map(Number);
    const [hCierra, mCierra] = turno.cierra.split(':').map(Number);
    const minAbre = hAbre * 60 + (mAbre || 0);
    const minCierra = hCierra * 60 + (mCierra || 0);

    if (esHorarioTrasnoche(turno.abre, turno.cierra)) {
      // Abre hoy y cierra en la madrugada de mañana
      if (minutosActuales >= minAbre) {
        return {
          estaAbierto: true,
          motivo: `Abierto hasta las ${turno.cierra} hs (trasnoche)`,
          badgeTexto: `Abierto hasta ${turno.cierra}`,
          esTrasnoche: true,
        };
      }
    } else {
      // Turno dentro del mismo día
      if (minutosActuales >= minAbre && minutosActuales < minCierra) {
        return {
          estaAbierto: true,
          motivo: `Abierto hasta las ${turno.cierra} hs`,
          badgeTexto: `Abierto hasta ${turno.cierra}`,
          esTrasnoche: false,
        };
      }
    }
  }

  // Si no cayó en ningún turno activo de hoy
  // Buscar próximo turno de apertura hoy
  for (const turno of confHoy.turnos) {
    const [hAbre, mAbre] = turno.abre.split(':').map(Number);
    const minAbre = hAbre * 60 + (mAbre || 0);
    if (minutosActuales < minAbre) {
      return {
        estaAbierto: false,
        motivo: `Abre hoy a las ${turno.abre} hs`,
        badgeTexto: `Abre a las ${turno.abre}`,
      };
    }
  }

  return {
    estaAbierto: false,
    motivo: 'Cerrado en este momento',
    badgeTexto: 'Cerrado',
  };
}
