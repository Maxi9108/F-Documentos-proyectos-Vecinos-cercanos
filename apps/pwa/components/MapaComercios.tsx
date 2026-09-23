'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Comercio } from '@/types/comercio';
import {
  Phone,
  MapPin,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  Bike,
  Compass,
  Layers,
  ChevronDown,
  ChevronUp,
  Clock,
  Pill,
  Sparkles,
  AlertTriangle,
  Calendar,
  Navigation,
  Globe,
  Radio,
  Zap,
} from 'lucide-react';
import { useUser } from '@/context/user-context';
import RadarSatelital from './RadarSatelital';

export type ProveedorMapa = 'esri' | 'carto' | 'osm' | 'esriStreet';

export const PROVEEDORES_MAPA: Record<
  ProveedorMapa,
  {
    id: ProveedorMapa;
    nombre: string;
    badge: string;
    descripcion: string;
    urlBase: string;
    urlRef?: string;
    maxZoom: number;
    attribution: string;
    subdomains?: string[];
    className?: string;
  }
> = {
  esri: {
    id: 'esri',
    nombre: 'ESRI Dark',
    badge: 'Principal (Rápido)',
    descripcion: 'CDN Akamai con baja latencia en Sudamérica y modo oscuro nativo',
    urlBase: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    urlRef: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 16,
    attribution: '&copy; Esri, HERE, Garmin, OpenStreetMap',
  },
  carto: {
    id: 'carto',
    nombre: 'CartoDB Dark',
    badge: 'CDN Ultra Rápido',
    descripcion: 'CDN Fastly con respuesta instantánea y modo oscuro nativo para celulares',
    urlBase: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    subdomains: ['a', 'b', 'c', 'd'],
  },
  osm: {
    id: 'osm',
    nombre: 'OSM Nocturno',
    badge: 'Respaldo 1',
    descripcion: 'Servidor global libre OpenStreetMap con filtro nocturno',
    urlBase: 'https://{s}.tile.openstreetmap.org/{z}/{y}/{x}.png',
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
    subdomains: ['a', 'b', 'c'],
    className: 'filter invert-[0.92] hue-rotate-180 brightness-95 contrast-125 saturate-[0.8]',
  },
  esriStreet: {
    id: 'esriStreet',
    nombre: 'Calles Claras',
    badge: 'Respaldo 2',
    descripcion: 'Servidor cartográfico de alta definición de calles y avenidas',
    urlBase: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 18,
    attribution: '&copy; Esri',
  },
};

interface MapaComerciosProps {
  comercios: Comercio[];
  comercioSeleccionado: Comercio | null;
  onSelectComercio: (comercio: Comercio) => void;
  onOpenDetalle?: (comercio: Comercio) => void;
}

// Configuración de estilo, color e icono SVG para cada rubro
export interface RubroPinConfig {
  key: string;
  label: string;
  color: string;
  bgRgba: string;
  glowRgba: string;
  badgeEmoji: string;
  svg: string;
}

export const RUBRO_PIN_CONFIGS: Record<string, RubroPinConfig> = {
  farmacia: {
    key: 'farmacia',
    label: 'Farmacia',
    color: '#10b981', // Verde esmeralda médico
    bgRgba: 'rgba(16, 185, 129, 0.95)',
    glowRgba: 'rgba(16, 185, 129, 0.6)',
    badgeEmoji: '💊',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 4v16M4 12h16"/>
          </svg>`,
  },
  carniceria: {
    key: 'carniceria',
    label: 'Carnicería / Parrilla',
    color: '#ef4444', // Rojo fuego / carnes
    bgRgba: 'rgba(239, 68, 68, 0.95)',
    glowRgba: 'rgba(239, 68, 68, 0.6)',
    badgeEmoji: '🥩',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
          </svg>`,
  },
  gastronomia: {
    key: 'gastronomia',
    label: 'Gastronomía / Pizzería',
    color: '#f97316', // Naranja apetitoso
    bgRgba: 'rgba(249, 115, 22, 0.95)',
    glowRgba: 'rgba(249, 115, 22, 0.6)',
    badgeEmoji: '🍕',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 11h.01M11 15h.01M16 16h.01"/>
            <path d="m2 2 20 7-7 13L2 2Z"/>
            <path d="M4.5 9.5a14 14 0 0 1 10-3"/>
          </svg>`,
  },
  panaderia: {
    key: 'panaderia',
    label: 'Panadería / Confitería',
    color: '#f59e0b', // Ámbar dorado pan horneado
    bgRgba: 'rgba(245, 158, 11, 0.95)',
    glowRgba: 'rgba(245, 158, 11, 0.6)',
    badgeEmoji: '🥖',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 10a6 6 0 0 0-12 0v5h12v-5z"/>
            <path d="M4 15h16"/>
            <path d="M8 10v2M12 10v2M16 10v2"/>
          </svg>`,
  },
  verduleria: {
    key: 'verduleria',
    label: 'Verdulería / Frutería',
    color: '#84cc16', // Verde lima fresco
    bgRgba: 'rgba(132, 204, 22, 0.95)',
    glowRgba: 'rgba(132, 204, 22, 0.6)',
    badgeEmoji: '🍏',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z"/>
            <path d="M10 2c1 .5 2 2 2 5"/>
          </svg>`,
  },
  libreria: {
    key: 'libreria',
    label: 'Librería / Bazar',
    color: '#3b82f6', // Azul real papel y libros
    bgRgba: 'rgba(59, 130, 246, 0.95)',
    glowRgba: 'rgba(59, 130, 246, 0.6)',
    badgeEmoji: '📚',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
            <path d="M6 6h10M6 10h10"/>
          </svg>`,
  },
  almacen: {
    key: 'almacen',
    label: 'Almacén / Supermercado',
    color: '#14b8a6', // Teal vívido
    bgRgba: 'rgba(20, 184, 166, 0.95)',
    glowRgba: 'rgba(20, 184, 166, 0.6)',
    badgeEmoji: '🛒',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="8" cy="21" r="1.5"/>
            <circle cx="19" cy="21" r="1.5"/>
            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
          </svg>`,
  },
  ferreteria: {
    key: 'ferreteria',
    label: 'Ferretería / Corralón',
    color: '#0284c7', // Azul acero herramientas
    bgRgba: 'rgba(2, 132, 199, 0.95)',
    glowRgba: 'rgba(2, 132, 199, 0.6)',
    badgeEmoji: '🔧',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>`,
  },
  veterinaria: {
    key: 'veterinaria',
    label: 'Veterinaria / Pet Shop',
    color: '#a855f7', // Púrpura brillante
    bgRgba: 'rgba(168, 85, 247, 0.95)',
    glowRgba: 'rgba(168, 85, 247, 0.6)',
    badgeEmoji: '🐾',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="4" r="1.8"/>
            <circle cx="18" cy="7.5" r="1.8"/>
            <circle cx="20" cy="15" r="1.8"/>
            <path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1Q6.5 17.5 4.5 20.3A3.5 3.5 0 0 1 2 15.5V14a4 4 0 0 1 4-4z"/>
          </svg>`,
  },
  kiosco: {
    key: 'kiosco',
    label: 'Kiosco / Golosinas',
    color: '#ec4899', // Rosa vibrante
    bgRgba: 'rgba(236, 72, 153, 0.95)',
    glowRgba: 'rgba(236, 72, 153, 0.6)',
    badgeEmoji: '🍬',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m16 8-8 8"/>
            <circle cx="12" cy="12" r="4"/>
            <path d="m18 10 3-3a1.5 1.5 0 0 0 0-2l-1-1a1.5 1.5 0 0 0-2 0L15 7"/>
            <path d="m6 14-3 3a1.5 1.5 0 0 0 0 2l1 1a1.5 1.5 0 0 0 2 0L9 17"/>
          </svg>`,
  },
  cafeteria: {
    key: 'cafeteria',
    label: 'Cafetería / Heladería',
    color: '#d97706', // Ámbar moka
    bgRgba: 'rgba(217, 119, 6, 0.95)',
    glowRgba: 'rgba(217, 119, 6, 0.6)',
    badgeEmoji: '☕',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 8h1a4 4 0 1 1 0 8h-1"/>
            <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/>
            <line x1="6" y1="2" x2="6" y2="4"/>
            <line x1="10" y1="2" x2="10" y2="4"/>
            <line x1="14" y1="2" x2="14" y2="4"/>
          </svg>`,
  },
  solo_envio: {
    key: 'solo_envio',
    label: 'Solo Envíos a Domicilio',
    color: '#06b6d4', // Cian eléctrico delivery
    bgRgba: 'rgba(6, 182, 212, 0.95)',
    glowRgba: 'rgba(6, 182, 212, 0.65)',
    badgeEmoji: '🛵',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="18.5" cy="17.5" r="3.5"/>
            <circle cx="5.5" cy="17.5" r="3.5"/>
            <circle cx="15" cy="5" r="1"/>
            <path d="M12 17.5V14l-3-3 4-3 2 3h2"/>
          </svg>`,
  },
  indumentaria: {
    key: 'indumentaria',
    label: 'Indumentaria / Moda',
    color: '#8b5cf6', // Violeta moda
    bgRgba: 'rgba(139, 92, 246, 0.95)',
    glowRgba: 'rgba(139, 92, 246, 0.6)',
    badgeEmoji: '👗',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>
          </svg>`,
  },
  default: {
    key: 'default',
    label: 'Comercio Barrial',
    color: '#6366f1', // Indigo estándar
    bgRgba: 'rgba(99, 102, 241, 0.95)',
    glowRgba: 'rgba(99, 102, 241, 0.6)',
    badgeEmoji: '🏪',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/>
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
            <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/>
            <path d="M2 7h20"/>
          </svg>`,
  },
};

// Resolver la configuración del rubro
export function getRubroPinConfig(rubro?: string, tipoAtencion?: string): RubroPinConfig {
  if (tipoAtencion === 'solo_envio' && (!rubro || rubro === 'Solo Envíos')) {
    return RUBRO_PIN_CONFIGS.solo_envio;
  }

  const r = (rubro || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (r.includes('farma')) return RUBRO_PIN_CONFIGS.farmacia;
  if (r.includes('carni') || r.includes('parrill') || r.includes('asador')) return RUBRO_PIN_CONFIGS.carniceria;
  if (r.includes('gastro') || r.includes('pizza') || r.includes('restaur') || r.includes('hamburg') || r.includes('empanad') || r.includes('rotiser') || r.includes('comida')) return RUBRO_PIN_CONFIGS.gastronomia;
  if (r.includes('pana') || r.includes('confiter') || r.includes('factur') || r.includes('pasteler')) return RUBRO_PIN_CONFIGS.panaderia;
  if (r.includes('verdu') || r.includes('frut')) return RUBRO_PIN_CONFIGS.verduleria;
  if (r.includes('libre') || r.includes('papele') || r.includes('bazar') || r.includes('juguet')) return RUBRO_PIN_CONFIGS.libreria;
  if (r.includes('ferret') || r.includes('corral') || r.includes('pintur')) return RUBRO_PIN_CONFIGS.ferreteria;
  if (r.includes('veterin') || r.includes('pet') || r.includes('mascot')) return RUBRO_PIN_CONFIGS.veterinaria;
  if (r.includes('kios') || r.includes('golosin')) return RUBRO_PIN_CONFIGS.kiosco;
  if (r.includes('cafe') || r.includes('helad') || r.includes('bar')) return RUBRO_PIN_CONFIGS.cafeteria;
  if (r.includes('almacen') || r.includes('super') || r.includes('minimercad') || r.includes('despensa')) return RUBRO_PIN_CONFIGS.almacen;
  if (r.includes('ropa') || r.includes('indument') || r.includes('moda') || r.includes('calzad')) return RUBRO_PIN_CONFIGS.indumentaria;

  return RUBRO_PIN_CONFIGS.default;
}

// Controlador interno para centrar suavemente el mapa al seleccionar un comercio
function MapController({ selectedComercio }: { selectedComercio: Comercio | null }) {
  const map = useMap();

  useEffect(() => {
    if (selectedComercio) {
      map.flyTo([selectedComercio.latitud, selectedComercio.longitud], 15, {
        duration: 1.2,
        easeLinearity: 0.25,
      });
    }
  }, [selectedComercio, map]);

  return null;
}

// Generador de pines luminosos altamente distintivos por rubro, nivel y estado operativo
function createCustomPin(comercio: Comercio, isSelected: boolean) {
  const { rubro, esta_abierto, tipo_atencion, nivel, esta_de_turno, cerrado_momentaneo, en_vacaciones } = comercio;
  const config = getRubroPinConfig(rubro, tipo_atencion);

  const isPaused = cerrado_momentaneo || en_vacaciones;
  const pinBg = config.color;
  const glowColor = config.glowRgba;

  const glowStyle = isSelected
    ? `box-shadow: 0 0 24px 6px ${glowColor}, 0 0 0 3px #ffffff;`
    : `box-shadow: 0 0 14px 2px ${glowColor};`;

  const pulseAnimation = isSelected ? 'animate-bounce' : '';
  const scaleClass = isSelected ? 'scale-120 z-50' : 'hover:scale-110';
  const opacityClass = !esta_abierto && !isPaused ? 'opacity-85' : '';

  // Badge superior (Turno 24hs > Gold > Premium)
  let topBadge = '';
  if (esta_de_turno) {
    topBadge = `
      <span class="absolute -top-2.5 -right-3.5 px-1.5 py-0.5 text-[8.5px] font-black bg-emerald-500 text-white rounded-full shadow-lg flex items-center gap-0.5 tracking-tighter border border-emerald-300 ring-2 ring-emerald-950 z-20 select-none">
        24h
        <span class="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
      </span>
    `;
  } else if (nivel === 'gold') {
    topBadge = `
      <span class="absolute -top-2.5 -right-2 text-[13px] leading-none filter drop-shadow z-20 select-none" title="Comercio Nivel Gold">👑</span>
    `;
  } else if (nivel === 'premium') {
    topBadge = `
      <span class="absolute -top-2.5 -right-2 text-[12px] leading-none filter drop-shadow z-20 select-none" title="Comercio Nivel Premium">💎</span>
    `;
  }

  // Indicador de delivery si es modalidad solo_envio
  let deliveryBadge = '';
  if (tipo_atencion === 'solo_envio') {
    deliveryBadge = `
      <span class="absolute -top-2 -left-2 w-4 h-4 bg-cyan-400 text-zinc-950 rounded-full flex items-center justify-center text-[10px] font-bold shadow-md border border-cyan-200 z-20 select-none" title="Venta a domicilio / Solo envíos">
        🛵
      </span>
    `;
  }

  // Indicador de estado operativo en la esquina inferior (abierto / cerrado / pausa)
  let statusDot = '';
  if (isPaused) {
    statusDot = `<span class="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-zinc-950 shadow-sm z-20" title="En pausa / Vacaciones"></span>`;
  } else if (esta_abierto) {
    statusDot = `<span class="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-zinc-950 shadow-sm z-20" title="Abierto ahora"></span>`;
  } else {
    statusDot = `<span class="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-zinc-950 shadow-sm z-20" title="Cerrado"></span>`;
  }

  const html = `
    <div class="relative flex flex-col items-center justify-center ${pulseAnimation} ${scaleClass} ${opacityClass} transition-transform duration-300">
      <div class="relative flex items-center justify-center">
        <!-- Cuerpo redondo con color temático del rubro e icono distintivo -->
        <div style="background-color: ${pinBg}; ${glowStyle}" class="w-10 h-10 rounded-full border-2 border-zinc-900 flex items-center justify-center text-white transition-all shadow-xl">
          ${config.svg}
        </div>
        ${topBadge}
        ${deliveryBadge}
        ${statusDot}
      </div>
      <!-- Flecha que señala exactamente la coordenada en el mapa -->
      <div style="border-top-color: ${pinBg};" class="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] -mt-0.5"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-map-pin',
    iconSize: [42, 48],
    iconAnchor: [21, 48],
    popupAnchor: [0, -46],
  });
}

// Generador de Pin Satelital GPS para el usuario
function createUserSatellitePin(esGps: boolean, nombre: string) {
  const html = `
    <div class="relative flex flex-col items-center justify-center">
      <div class="relative flex items-center justify-center">
        <!-- Onda de radar satelital pulsante -->
        <span class="absolute -inset-2.5 rounded-full bg-cyan-400/40 animate-ping"></span>
        <div style="background: linear-gradient(135deg, #7c3aed, #06b6d4); box-shadow: 0 0 22px 5px rgba(6, 182, 212, 0.85), 0 0 0 3px #ffffff;" class="w-10 h-10 rounded-full border-2 border-zinc-950 flex items-center justify-center text-white shadow-2xl relative z-10">
          ${
            esGps
              ? `<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                   <circle cx="12" cy="12" r="2"/>
                   <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/>
                 </svg>`
              : `<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                   <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                   <polyline points="9 22 9 12 15 12 15 22"/>
                 </svg>`
          }
        </div>
      </div>
      <div style="border-top-color: #06b6d4;" class="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] -mt-0.5 z-10"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-map-pin',
    iconSize: [42, 48],
    iconAnchor: [21, 48],
    popupAnchor: [0, -46],
  });
}

export default function MapaComercios({
  comercios,
  comercioSeleccionado,
  onSelectComercio,
  onOpenDetalle,
}: MapaComerciosProps) {
  const [modoVisualizacion, setModoVisualizacion] = useState<'mapa' | 'radar'>('mapa');
  const [proveedorActivo, setProveedorActivo] = useState<ProveedorMapa>('esri');
  const [menuServidoresAbierto, setMenuServidoresAbierto] = useState(false);
  const [mostrarLeyenda, setMostrarLeyenda] = useState(false);
  const [avisoLentitudVisible, setAvisoLentitudVisible] = useState(false);
  const [tilesCargados, setTilesCargados] = useState(false);
  const [, setTileErrorsCount] = useState(0);

  const {
    ubicacionReferencia,
    gpsActivo,
    cargandoGps,
    activarGps,
    abrirModalUbicaciones,
  } = useUser();

  // Detector de lentitud en la carga de mosaicos (4.5s sin recibir confirmación de carga)
  useEffect(() => {
    setTilesCargados(false);
    const timer = setTimeout(() => {
      if (!tilesCargados) {
        setAvisoLentitudVisible(true);
      }
    }, 4500);
    return () => clearTimeout(timer);
  }, [proveedorActivo]);

  const defaultCenter = useMemo<[number, number]>(() => {
    if (comercioSeleccionado) {
      return [comercioSeleccionado.latitud, comercioSeleccionado.longitud];
    }
    if (ubicacionReferencia) {
      return [ubicacionReferencia.latitud, ubicacionReferencia.longitud];
    }
    if (comercios.length > 0) {
      const latSum = comercios.reduce((acc, c) => acc + c.latitud, 0);
      const lngSum = comercios.reduce((acc, c) => acc + c.longitud, 0);
      return [latSum / comercios.length, lngSum / comercios.length];
    }
    return [-34.6037, -58.3816];
  }, [comercios, comercioSeleccionado, ubicacionReferencia]);

  // Si el usuario eligió el modo radar de ultra bajo consumo de datos
  if (modoVisualizacion === 'radar') {
    return (
      <RadarSatelital
        comercios={comercios}
        ubicacionReferencia={ubicacionReferencia}
        comercioSeleccionado={comercioSeleccionado}
        onSelectComercio={onSelectComercio}
        onOpenDetalle={onOpenDetalle}
        onVolverAlMapa={() => setModoVisualizacion('mapa')}
      />
    );
  }

  return (
    <div className="w-full h-full min-h-[420px] rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 relative z-0">
      {/* Barra Flotante Superior de Controles */}
      <div className="absolute top-2.5 inset-x-2.5 z-[1000] flex items-center justify-between gap-1.5 pointer-events-none">
        {/* Izquierda: Modo Radar Satelital */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            type="button"
            onClick={() => setModoVisualizacion('radar')}
            title="Activar Radar Satelital (Modo ultraliviano que no descarga imágenes de mapas)"
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-cyan-500/60 text-cyan-300 text-xs font-semibold shadow-xl flex items-center gap-1.5 backdrop-blur-md transition-all cursor-pointer select-none group"
          >
            <Radio className="w-3.5 h-3.5 text-cyan-400 group-hover:animate-pulse" />
            <span className="hidden sm:inline">Radar Satelital</span>
            <span className="sm:hidden">Radar</span>
            <span className="px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[9px] font-bold hidden md:inline">
              0% Datos
            </span>
          </button>
        </div>

        {/* Derecha: Servidor, GPS y Pines */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {/* Selector de Servidor de Respaldo Multi-CDN */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuServidoresAbierto(!menuServidoresAbierto)}
              title="Cambiar servidor de mapas si la conexión responde lenta"
              className="px-2 sm:px-2.5 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 hover:text-white text-xs font-semibold shadow-xl flex items-center gap-1.5 backdrop-blur-md transition-all cursor-pointer select-none"
            >
              <Globe className="w-3.5 h-3.5 text-violet-400" />
              <span className="hidden md:inline">{PROVEEDORES_MAPA[proveedorActivo].nombre}</span>
              <span className="md:hidden">Servidor</span>
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            </button>

            {menuServidoresAbierto && (
              <div className="absolute right-0 mt-2 p-2 bg-zinc-900/95 border border-zinc-700 rounded-2xl shadow-2xl backdrop-blur-md w-60 text-xs text-zinc-300 space-y-1 animate-in fade-in duration-200 z-50">
                <div className="px-2 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-800 flex justify-between">
                  <span>Servidor de Mapas</span>
                  <span className="text-cyan-400">Multi-CDN</span>
                </div>
                {Object.values(PROVEEDORES_MAPA).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setProveedorActivo(p.id);
                      setMenuServidoresAbierto(false);
                      setAvisoLentitudVisible(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-xl flex flex-col gap-0.5 transition-colors cursor-pointer ${
                      proveedorActivo === p.id
                        ? 'bg-violet-950/80 text-violet-200 border border-violet-500/50'
                        : 'hover:bg-zinc-800/80 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{p.nombre}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 font-bold">
                        {p.badge}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-400 leading-tight">{p.descripcion}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Botón Rápido de Rastreo Satelital GPS */}
          <button
            type="button"
            onClick={activarGps}
            disabled={cargandoGps}
            title={gpsActivo ? 'GPS satelital activo (clic para actualizar posición)' : 'Activar rastreo GPS satelital'}
            className={`px-2 sm:px-2.5 py-1.5 rounded-xl border text-xs font-semibold shadow-xl flex items-center gap-1.5 backdrop-blur-md transition-all cursor-pointer select-none ${
              gpsActivo
                ? 'bg-cyan-950/90 border-cyan-500/80 text-cyan-300 shadow-cyan-950/50'
                : 'bg-zinc-900/90 hover:bg-zinc-800 border-zinc-700/80 text-zinc-300 hover:text-cyan-300'
            }`}
          >
            <Navigation className={`w-3.5 h-3.5 ${gpsActivo ? 'text-cyan-400 animate-pulse' : 'text-zinc-400'}`} />
            <span className="hidden sm:inline">
              {cargandoGps ? 'Buscando...' : gpsActivo ? 'GPS Activo' : 'Rastreo GPS'}
            </span>
          </button>

          {/* Botón Flotante para ver Leyenda de Pines por Rubro */}
          <div>
            <button
              type="button"
              onClick={() => setMostrarLeyenda(!mostrarLeyenda)}
              className="px-2 sm:px-2.5 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 text-xs font-semibold shadow-xl flex items-center gap-1.5 backdrop-blur-md transition-all cursor-pointer select-none"
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Pines</span>
              {mostrarLeyenda ? (
                <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              )}
            </button>

          {mostrarLeyenda && (
            <div className="mt-2 p-3 bg-zinc-900/95 border border-zinc-700 rounded-2xl shadow-2xl backdrop-blur-md w-64 max-h-[380px] overflow-y-auto no-scrollbar text-xs text-zinc-300 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                <span>Distintivos de Pines</span>
                <button
                  type="button"
                  onClick={() => setMostrarLeyenda(false)}
                  className="text-zinc-500 hover:text-white px-1"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 gap-1">
                {Object.values(RUBRO_PIN_CONFIGS).map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center gap-2.5 px-2 py-1 rounded-lg hover:bg-zinc-800/60 transition-colors"
                  >
                    <span
                      style={{ backgroundColor: item.color }}
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] text-white shadow-sm shrink-0"
                    >
                      {item.badgeEmoji}
                    </span>
                    <span className="text-zinc-200 font-medium text-[11px] truncate">{item.label}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-zinc-800 text-[10px] text-zinc-400 space-y-1.5">
                <p className="flex items-center gap-1.5">
                  <span className="text-xs">👑 / 💎</span>
                  <span>Comercio Nivel Gold o Premium</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.2 bg-emerald-500 text-white rounded-full text-[8px] font-bold shadow-sm">
                    24h
                  </span>
                  <span>Farmacia de Turno en guardia</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border border-zinc-950"></span>
                  <span>Abierto ahora</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-zinc-950 ml-1"></span>
                  <span>Pausa / Vacaciones</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-zinc-950 ml-1"></span>
                  <span>Cerrado</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

      <MapContainer
        center={defaultCenter}
        zoom={14}
        scrollWheelZoom={true}
        touchZoom={true}
        bounceAtZoomLimits={false}
        wheelDebounceTime={60}
        zoomAnimation={true}
        fadeAnimation={true}
        markerZoomAnimation={true}
        className="w-full h-full"
      >
        {/* Capa de mosaicos activa según el proveedor seleccionado */}
        <TileLayer
          key={`${proveedorActivo}-base`}
          attribution={PROVEEDORES_MAPA[proveedorActivo].attribution}
          url={PROVEEDORES_MAPA[proveedorActivo].urlBase}
          subdomains={PROVEEDORES_MAPA[proveedorActivo].subdomains || 'abc'}
          maxZoom={PROVEEDORES_MAPA[proveedorActivo].maxZoom}
          className={PROVEEDORES_MAPA[proveedorActivo].className}
          eventHandlers={{
            load: () => {
              setTilesCargados(true);
              setTileErrorsCount(0);
            },
            tileerror: () => {
              setAvisoLentitudVisible(true);
              setTileErrorsCount((prev) => {
                const next = prev + 1;
                if (next >= 5) {
                  setProveedorActivo((curr) =>
                    curr === 'esri' ? 'carto' : curr === 'carto' ? 'osm' : curr === 'osm' ? 'esriStreet' : 'carto'
                  );
                  return 0;
                }
                return next;
              });
            },
          }}
        />
        {PROVEEDORES_MAPA[proveedorActivo].urlRef && (
          <TileLayer
            key={`${proveedorActivo}-ref`}
            attribution={PROVEEDORES_MAPA[proveedorActivo].attribution}
            url={PROVEEDORES_MAPA[proveedorActivo].urlRef!}
            maxZoom={PROVEEDORES_MAPA[proveedorActivo].maxZoom}
          />
        )}

        <MapController selectedComercio={comercioSeleccionado} />

        {/* Círculo interactivo que dibuja el radio de entrega del comercio seleccionado */}
        {comercioSeleccionado &&
          comercioSeleccionado.radio_entrega_metros &&
          comercioSeleccionado.radio_entrega_metros > 0 && (
            <Circle
              center={[comercioSeleccionado.latitud, comercioSeleccionado.longitud]}
              radius={comercioSeleccionado.radio_entrega_metros}
              pathOptions={{
                color: '#a855f7',
                fillColor: '#7c3aed',
                fillOpacity: 0.18,
                weight: 2,
                dashArray: '6, 6',
              }}
            />
          )}

        {/* Círculo y Pin Satelital GPS / Ubicación de Referencia del Usuario */}
        {ubicacionReferencia && (
          <>
            {ubicacionReferencia.esGps && (
              <Circle
                center={[ubicacionReferencia.latitud, ubicacionReferencia.longitud]}
                radius={ubicacionReferencia.precisionMetros || 40}
                pathOptions={{
                  color: '#22d3ee',
                  fillColor: '#06b6d4',
                  fillOpacity: 0.16,
                  weight: 1.5,
                  dashArray: '4, 4',
                }}
              />
            )}
            <Marker
              position={[ubicacionReferencia.latitud, ubicacionReferencia.longitud]}
              icon={createUserSatellitePin(ubicacionReferencia.esGps, ubicacionReferencia.nombre)}
              zIndexOffset={1000}
            >
              <Popup className="custom-popup">
                <div className="p-1 min-w-[210px] text-zinc-100 font-sans text-xs">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-bold mb-1">
                    <Navigation className="w-4 h-4" />
                    <span>
                      {ubicacionReferencia.esGps
                        ? 'Tu Posición Satelital GPS'
                        : ubicacionReferencia.nombre}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mb-2">
                    {ubicacionReferencia.esGps
                      ? `Señal satelital activa. Precisión estimada: ±${ubicacionReferencia.precisionMetros || 20} metros.`
                      : 'Punto de referencia para calcular cercanía a comercios.'}
                  </p>
                  <button
                    type="button"
                    onClick={abrirModalUbicaciones}
                    className="w-full py-1.5 px-2 bg-zinc-800 hover:bg-zinc-700 text-cyan-300 font-semibold text-[11px] rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>Gestionar mis ubicaciones</span>
                  </button>
                </div>
              </Popup>
            </Marker>
          </>
        )}

        {comercios.map((comercio) => {
          const isSelected = comercioSeleccionado?.id === comercio.id;
          const pinIcon = createCustomPin(comercio, isSelected);
          const pinConfig = getRubroPinConfig(comercio.rubro, comercio.tipo_atencion);
          const tieneEnvios = Boolean(comercio.radio_entrega_metros && comercio.radio_entrega_metros > 0);

          return (
            <Marker
              key={comercio.id}
              position={[comercio.latitud, comercio.longitud]}
              icon={pinIcon}
              eventHandlers={{
                click: () => onSelectComercio(comercio),
              }}
            >
              <Popup className="custom-popup">
                <div className="p-1 min-w-[240px] text-zinc-100 font-sans">
                  {/* Cabecera con Rubro temático y Estado */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      style={{
                        backgroundColor: `${pinConfig.color}22`,
                        borderColor: `${pinConfig.color}66`,
                        color: pinConfig.color,
                      }}
                      className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border flex items-center gap-1"
                    >
                      <span>{pinConfig.badgeEmoji}</span>
                      <span>{comercio.rubro}</span>
                    </span>

                    {/* Estado Operativo */}
                    {comercio.en_vacaciones ? (
                      <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> Vacaciones
                      </span>
                    ) : comercio.cerrado_momentaneo ? (
                      <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Pausado
                      </span>
                    ) : (
                      <span
                        className={`text-[11px] font-medium flex items-center gap-1 ${
                          comercio.esta_abierto ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {comercio.esta_abierto ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" /> Abierto
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" /> Cerrado
                          </>
                        )}
                      </span>
                    )}
                  </div>

                  {/* Nombre y Badges de Membresía / Turno */}
                  <div className="flex items-start justify-between gap-1.5 mb-1.5">
                    <h3 className="font-bold text-base text-white leading-snug">
                      {comercio.nombre}
                    </h3>
                    <div className="flex items-center gap-1 shrink-0 pt-0.5">
                      {comercio.esta_de_turno && (
                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-950 border border-emerald-500/70 text-emerald-300 text-[10px] font-bold flex items-center gap-0.5">
                          <Pill className="w-3 h-3 text-emerald-400" /> 24h
                        </span>
                      )}
                      {comercio.nivel === 'gold' && (
                        <span className="px-1.5 py-0.5 rounded-md bg-amber-950/80 border border-amber-600/70 text-amber-300 text-[10px] font-bold flex items-center gap-0.5">
                          👑 Gold
                        </span>
                      )}
                      {comercio.nivel === 'premium' && (
                        <span className="px-1.5 py-0.5 rounded-md bg-purple-950/80 border border-purple-600/70 text-purple-300 text-[10px] font-bold flex items-center gap-0.5">
                          💎 Prem
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Mensajes de Pausa o Vacaciones */}
                  {comercio.en_vacaciones && (
                    <div className="mb-2 p-1.5 rounded-lg bg-amber-950/50 border border-amber-700/60 text-[11px] text-amber-200">
                      🏖️ {comercio.mensaje_vacaciones || 'Cerrado por vacaciones.'}
                    </div>
                  )}

                  {comercio.cerrado_momentaneo && (
                    <div className="mb-2 p-1.5 rounded-lg bg-amber-950/50 border border-amber-700/60 text-[11px] text-amber-200">
                      ⏸️ {comercio.motivo_cierre_momentaneo || 'Cerrado momentáneamente.'}
                    </div>
                  )}

                  {/* Badge de Modalidad de Atención */}
                  {comercio.tipo_atencion === 'solo_envio' ? (
                    <div className="mb-2">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-cyan-950/70 border border-cyan-800/60 text-cyan-300 text-[10px] font-bold">
                        <Bike className="w-3 h-3" />
                        Venta a Domicilio / Sin Local a la Calle
                      </span>
                    </div>
                  ) : comercio.tipo_atencion === 'ambos' ? (
                    <div className="mb-2">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-violet-950/70 border border-violet-800/60 text-violet-300 text-[10px] font-bold">
                        <Bike className="w-3 h-3" />
                        Local a la Calle y Delivery
                      </span>
                    </div>
                  ) : null}

                  {/* Horario Cortado si tiene */}
                  {comercio.tiene_horario_cortado && (comercio.horario_manana || comercio.horario_tarde) && (
                    <div className="mb-2 p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[10.5px] text-zinc-300 space-y-0.5">
                      <p className="flex items-center gap-1 font-semibold text-violet-300">
                        <Clock className="w-3 h-3 text-violet-400" />
                        <span>Horario Cortado:</span>
                      </p>
                      {comercio.horario_manana && <p className="text-zinc-400">☀️ Mañana: {comercio.horario_manana}</p>}
                      {comercio.horario_tarde && <p className="text-zinc-400">🌙 Tarde: {comercio.horario_tarde}</p>}
                    </div>
                  )}

                  {/* Zona de Cobertura si hace envíos */}
                  {tieneEnvios && (
                    <div className="mb-2.5 p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 space-y-1">
                      <p className="flex items-center gap-1 font-semibold text-cyan-300">
                        <Compass className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>Radio de entrega: {(comercio.radio_entrega_metros! / 1000).toFixed(1)} km</span>
                      </p>
                      {comercio.zona_envio_descripcion && (
                        <p className="text-[10px] text-zinc-400 leading-tight">
                          {comercio.zona_envio_descripcion}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Dirección y Teléfono */}
                  <div className="space-y-1 text-xs text-zinc-400 mb-3">
                    <p className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <span>{comercio.direccion}</span>
                    </p>
                    {comercio.telefono && (
                      <p className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span>{comercio.telefono}</span>
                      </p>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="pt-2 border-t border-zinc-800 space-y-1.5">
                    {onOpenDetalle && (
                      <button
                        type="button"
                        onClick={() => onOpenDetalle(comercio)}
                        className="w-full py-1.5 px-2 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-violet-950/40"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        {comercio.tiene_catalogo ? 'Ver Catálogo y Precios' : 'Ver Ficha y Contacto'}
                      </button>
                    )}

                    <div className="flex items-center justify-between gap-1.5">
                      {comercio.whatsapp ? (
                        <a
                          href={`https://wa.me/${comercio.whatsapp.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-center py-1.5 px-2 bg-emerald-700 hover:bg-emerald-600 text-white font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 no-underline"
                        >
                          <Bike className="w-3 h-3" />
                          Pedir
                        </a>
                      ) : comercio.telefono ? (
                        <a
                          href={`tel:${comercio.telefono}`}
                          className="flex-1 text-center py-1.5 px-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 no-underline"
                        >
                          <Phone className="w-3 h-3" />
                          Llamar
                        </a>
                      ) : null}

                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${comercio.latitud},${comercio.longitud}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-center py-1.5 px-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 no-underline"
                      >
                        <MapPin className="w-3 h-3" />
                        Ruta
                      </a>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Banner Flotante de Detección de Lentitud / Opciones de Respaldo */}
      {avisoLentitudVisible && (
        <div className="absolute bottom-3 left-3 right-3 z-[1000] p-3 rounded-2xl bg-zinc-950/95 border border-amber-500/60 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 text-xs text-zinc-200 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-amber-300 truncate">¿El mapa tarda en mostrarse en tu zona?</p>
              <p className="text-[11px] text-zinc-400 truncate">Podés probar el Servidor de Respaldo o activar el Modo Radar sin descarga.</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setProveedorActivo((prev) =>
                  prev === 'esri' ? 'carto' : prev === 'carto' ? 'osm' : prev === 'osm' ? 'esriStreet' : 'esri'
                );
                setAvisoLentitudVisible(false);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 font-semibold transition-colors cursor-pointer text-xs"
            >
              🔄 Probar Respaldo
            </button>
            <button
              type="button"
              onClick={() => {
                setModoVisualizacion('radar');
                setAvisoLentitudVisible(false);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white font-semibold transition-all shadow-md cursor-pointer flex items-center gap-1 text-xs"
            >
              <Radio className="w-3 h-3" />
              <span>Modo Radar</span>
            </button>
            <button
              type="button"
              onClick={() => setAvisoLentitudVisible(false)}
              className="p-1 rounded-lg text-zinc-500 hover:text-white"
              title="Descartar"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
