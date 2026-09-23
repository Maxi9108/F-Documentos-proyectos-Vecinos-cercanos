// Utilidades para cálculo de distancias satelitales y geolocalización de alta precisión

export interface Coordenadas {
  latitud: number;
  longitud: number;
}

export interface PosicionSatelital {
  latitud: number;
  longitud: number;
  precisionMetros: number;
  timestamp: number;
}

/**
 * Calcula la distancia en kilómetros entre dos puntos geográficos usando la fórmula de Haversine.
 */
export function calcularDistanciaKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radio de la Tierra en kilómetros
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Formatea una distancia en kilómetros a formato amigable (metros o kilómetros).
 */
export function formatearDistancia(distanciaKm: number): string {
  if (distanciaKm < 1) {
    const metros = Math.round(distanciaKm * 1000);
    return `a ${metros} m`;
  }
  return `a ${distanciaKm.toFixed(1)} km`;
}

/**
 * Estima el tiempo aproximado a pie (a 4.5 km/h) o en vehículo (a 30 km/h).
 */
export function estimarTiempo(distanciaKm: number): {
  aPie: string;
  enAuto: string;
} {
  const minutosAPie = Math.max(1, Math.round((distanciaKm / 4.5) * 60));
  const minutosEnAuto = Math.max(1, Math.round((distanciaKm / 30) * 60));

  return {
    aPie: minutosAPie > 60 ? `${(minutosAPie / 60).toFixed(1)} h a pie` : `~${minutosAPie} min a pie`,
    enAuto: minutosEnAuto > 60 ? `${(minutosEnAuto / 60).toFixed(1)} h en auto` : `~${minutosEnAuto} min en auto`,
  };
}

/**
 * Calcula el rumbo (bearing) en grados (0 a 360) desde un punto origen hacia un destino.
 */
export function calcularRumboGrados(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

/**
 * Solicita la ubicación satelital GPS al navegador usando la API de alta precisión.
 */
export function obtenerUbicacionGpsActual(): Promise<PosicionSatelital> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      reject(new Error('Tu navegador o dispositivo no soporta geolocalización satelital.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitud: position.coords.latitude,
          longitud: position.coords.longitude,
          precisionMetros: Math.round(position.coords.accuracy || 20),
          timestamp: position.timestamp,
        });
      },
      (error) => {
        let mensaje = 'No se pudo obtener la posición satelital GPS.';
        if (error.code === error.PERMISSION_DENIED) {
          mensaje = 'Permiso de geolocalización denegado. Puedes activarlo en los ajustes del navegador.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          mensaje = 'Señal satelital GPS no disponible en este momento.';
        } else if (error.code === error.TIMEOUT) {
          mensaje = 'Tiempo de espera agotado buscando señal satelital.';
        }
        reject(new Error(mensaje));
      },
      {
        enableHighAccuracy: true, // Forzar uso de sensor satelital GPS / GNSS
        timeout: 12000,
        maximumAge: 5000,
      }
    );
  });
}
