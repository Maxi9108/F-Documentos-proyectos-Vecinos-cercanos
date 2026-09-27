import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'apps', 'pwa', 'public');

const svgSquareContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg512" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#09090b" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>
    <linearGradient id="grad-wave-512" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#06b6d4" />
      <stop offset="50%" stop-color="#8b5cf6" />
      <stop offset="100%" stop-color="#c084fc" />
    </linearGradient>
    <linearGradient id="grad-cyan-512" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#22d3ee" />
      <stop offset="100%" stop-color="#06b6d4" />
    </linearGradient>
    <linearGradient id="grad-violet-512" x1="0%" y1="100%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#8b5cf6" />
      <stop offset="100%" stop-color="#a855f7" />
    </linearGradient>
  </defs>
  <!-- Fondo completo cuadrado exigido por Google Play Store y Android Adaptive Icons -->
  <rect width="512" height="512" fill="url(#bg512)" />
  <g transform="translate(48, 48) scale(4.16)">
    <!-- Anillo exterior violeta -->
    <path d="M 50,14 A 36,36 0 1,1 14,50" stroke="url(#grad-violet-512)" stroke-width="7" stroke-linecap="round" fill="none" />
    <!-- Anillo intermedio degradado -->
    <path d="M 50,26 A 24,24 0 1,1 26,50" stroke="url(#grad-wave-512)" stroke-width="6.5" stroke-linecap="round" fill="none" />
    <!-- Anillo central cian -->
    <circle cx="50" cy="50" r="12" stroke="url(#grad-cyan-512)" stroke-width="6" stroke-linecap="round" fill="none" />
    <!-- Punto central emisor -->
    <circle cx="50" cy="50" r="4.5" fill="#22d3ee" />
  </g>
</svg>`;

const svgRoundedContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg512" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#09090b" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>
    <linearGradient id="grad-wave-512" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#06b6d4" />
      <stop offset="50%" stop-color="#8b5cf6" />
      <stop offset="100%" stop-color="#c084fc" />
    </linearGradient>
    <linearGradient id="grad-cyan-512" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#22d3ee" />
      <stop offset="100%" stop-color="#06b6d4" />
    </linearGradient>
    <linearGradient id="grad-violet-512" x1="0%" y1="100%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#8b5cf6" />
      <stop offset="100%" stop-color="#a855f7" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#bg512)" stroke="#1e1e24" stroke-width="4" />
  <g transform="translate(48, 48) scale(4.16)">
    <!-- Anillo exterior violeta -->
    <path d="M 50,14 A 36,36 0 1,1 14,50" stroke="url(#grad-violet-512)" stroke-width="7" stroke-linecap="round" fill="none" />
    <!-- Anillo intermedio degradado -->
    <path d="M 50,26 A 24,24 0 1,1 26,50" stroke="url(#grad-wave-512)" stroke-width="6.5" stroke-linecap="round" fill="none" />
    <!-- Anillo central cian -->
    <circle cx="50" cy="50" r="12" stroke="url(#grad-cyan-512)" stroke-width="6" stroke-linecap="round" fill="none" />
    <!-- Punto central emisor -->
    <circle cx="50" cy="50" r="4.5" fill="#22d3ee" />
  </g>
</svg>`;

async function generarIconos() {
  console.log('[IconGenerator] Generando iconos PNG para Android y Google Play Store...');

  const squareBuffer = Buffer.from(svgSquareContent);
  const roundedBuffer = Buffer.from(svgRoundedContent);

  // 1. icon-512.png (512x512)
  await sharp(roundedBuffer)
    .resize(512, 512)
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'icon-512.png'));
  console.log(' ✔ Creado: public/icon-512.png');

  // 2. icon-192.png (192x192)
  await sharp(roundedBuffer)
    .resize(192, 192)
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'icon-192.png'));
  console.log(' ✔ Creado: public/icon-192.png');

  // 3. icon-maskable.png (512x512 full bleed para Android 8+)
  await sharp(squareBuffer)
    .resize(512, 512)
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'icon-maskable.png'));
  console.log(' ✔ Creado: public/icon-maskable.png');

  // 4. playstore-icon.png (512x512 oficial de Google Play Store)
  await sharp(squareBuffer)
    .resize(512, 512)
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'playstore-icon.png'));
  console.log(' ✔ Creado: public/playstore-icon.png');

  // 5. apple-touch-icon.png (180x180)
  await sharp(roundedBuffer)
    .resize(180, 180)
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log(' ✔ Creado: public/apple-touch-icon.png');

  // 6. playstore-feature-graphic.png (1024x500) Requisito obligatorio de Google Play Store
  const featureGraphicSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 500" width="1024" height="500">
  <defs>
    <linearGradient id="bgFeature" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#09090b" />
      <stop offset="50%" stop-color="#090d16" />
      <stop offset="100%" stop-color="#030712" />
    </linearGradient>
    <linearGradient id="fgCyan" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#22d3ee" />
      <stop offset="100%" stop-color="#06b6d4" />
    </linearGradient>
    <linearGradient id="fgViolet" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#06b6d4" />
      <stop offset="50%" stop-color="#8b5cf6" />
      <stop offset="100%" stop-color="#c084fc" />
    </linearGradient>
  </defs>
  <rect width="1024" height="500" fill="url(#bgFeature)" />
  <circle cx="160" cy="120" r="160" fill="#06b6d4" opacity="0.06" />
  <circle cx="860" cy="380" r="200" fill="#8b5cf6" opacity="0.06" />
  <g transform="translate(100, 100) scale(3.0)">
    <circle cx="50" cy="50" r="48" fill="#09090b" stroke="#1e293b" stroke-width="2" />
    <path d="M 50,14 A 36,36 0 1,1 14,50" stroke="url(#fgViolet)" stroke-width="7" stroke-linecap="round" fill="none" />
    <path d="M 50,26 A 24,24 0 1,1 26,50" stroke="url(#fgCyan)" stroke-width="6.5" stroke-linecap="round" fill="none" />
    <circle cx="50" cy="50" r="12" stroke="url(#fgCyan)" stroke-width="6" stroke-linecap="round" fill="none" />
    <circle cx="50" cy="50" r="4.5" fill="#22d3ee" />
  </g>
  <text x="470" y="215" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="64" fill="#ffffff" letter-spacing="-1">NeoFaro</text>
  <text x="472" y="270" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="24" fill="#22d3ee">Comercios y Ofertas en tu Barrio</text>
  <text x="472" y="315" font-family="Arial, Helvetica, sans-serif" font-size="18" fill="#94a3b8">Mapa en vivo • Rastreo GPS • Catálogo de locales</text>
</svg>
`;

  await sharp(Buffer.from(featureGraphicSvg))
    .resize(1024, 500)
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'playstore-feature-graphic.png'));
  console.log(' ✔ Creado: public/playstore-feature-graphic.png (1024x500)');

  // 7. screenshot-mobile.png (720x1280) Requisito de PWABuilder (form_factor: narrow)
  const mobileScreenshotSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 1280" width="720" height="1280">
  <defs>
    <linearGradient id="bgMobile" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#09090b" />
      <stop offset="100%" stop-color="#18181b" />
    </linearGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#18181b" />
      <stop offset="100%" stop-color="#27272a" />
    </linearGradient>
  </defs>
  <rect width="720" height="1280" fill="url(#bgMobile)" />

  <!-- Barra Superior de Navegación -->
  <rect x="0" y="0" width="720" height="120" fill="#09090b" opacity="0.95" />
  <circle cx="60" cy="65" r="24" fill="#06b6d4" opacity="0.2" />
  <circle cx="60" cy="65" r="10" fill="#06b6d4" />
  <text x="100" y="74" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="28" fill="#ffffff">NeoFaro</text>
  <text x="560" y="74" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="16" fill="#06b6d4">En vivo GPS</text>

  <!-- Simulación Mapa Satelital de Fondo -->
  <rect x="24" y="140" width="672" height="680" rx="32" fill="#131722" stroke="#27272a" stroke-width="2" />
  <!-- Calles y cuadrícula del mapa -->
  <line x1="24" y1="340" x2="696" y2="340" stroke="#1e293b" stroke-width="8" />
  <line x1="24" y1="560" x2="696" y2="560" stroke="#1e293b" stroke-width="12" />
  <line x1="240" y1="140" x2="240" y2="820" stroke="#1e293b" stroke-width="10" />
  <line x1="480" y1="140" x2="480" y2="820" stroke="#1e293b" stroke-width="8" />

  <!-- Pines de Comercios en el Mapa -->
  <circle cx="240" cy="340" r="28" fill="#8b5cf6" />
  <circle cx="240" cy="340" r="12" fill="#ffffff" />
  <text x="240" y="390" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="14" fill="#ffffff" text-anchor="middle">Panadería La Espiga</text>

  <circle cx="480" cy="560" r="32" fill="#06b6d4" />
  <circle cx="480" cy="560" r="14" fill="#ffffff" />
  <text x="480" y="615" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="15" fill="#ffffff" text-anchor="middle">Farmacia Savio (De Turno)</text>

  <!-- Pin de Mi Ubicación (Usuario GPS) -->
  <circle cx="360" cy="460" r="40" fill="#22d3ee" opacity="0.25" />
  <circle cx="360" cy="460" r="18" fill="#22d3ee" stroke="#ffffff" stroke-width="4" />

  <!-- Tarjeta de Comercio Destacado Inferior -->
  <rect x="24" y="850" width="672" height="260" rx="28" fill="url(#cardGrad)" stroke="#3f3f46" stroke-width="1.5" />
  <rect x="48" y="874" width="96" height="28" rx="8" fill="#06b6d4" opacity="0.2" />
  <text x="96" y="893" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="13" fill="#22d3ee" text-anchor="middle">ABIERTO AHORA</text>
  <text x="48" y="940" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="28" fill="#ffffff">Verdulería Don Tomás</text>
  <text x="48" y="975" font-family="Arial, Helvetica, sans-serif" font-size="16" fill="#a1a1aa">📍 Av. Savio 1420 (A 250 metros)</text>
  <text x="48" y="1010" font-family="Arial, Helvetica, sans-serif" font-size="16" fill="#a1a1aa">⏰ 08:30 - 13:00 / 16:30 - 21:00</text>
  <rect x="48" y="1035" width="220" height="48" rx="14" fill="#22c55e" />
  <text x="158" y="1065" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="16" fill="#ffffff" text-anchor="middle">Pedir por WhatsApp</text>

  <!-- Barra de Navegación Inferior (Dock) -->
  <rect x="0" y="1160" width="720" height="120" fill="#09090b" opacity="0.98" />
  <text x="144" y="1225" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="16" fill="#22d3ee" text-anchor="middle">🗺️ Mapa</text>
  <text x="360" y="1225" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="16" fill="#71717a" text-anchor="middle">🏷️ Ofertas</text>
  <text x="576" y="1225" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="16" fill="#71717a" text-anchor="middle">🏪 Mi Local</text>
</svg>
`;

  await sharp(Buffer.from(mobileScreenshotSvg))
    .resize(720, 1280)
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'screenshot-mobile.png'));
  console.log(' ✔ Creado: public/screenshot-mobile.png (720x1280)');

  // 8. screenshot-desktop.png (1280x720) Requisito de PWABuilder (form_factor: wide)
  const desktopScreenshotSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
  <rect width="1280" height="720" fill="#09090b" />
  <rect x="0" y="0" width="1280" height="70" fill="#18181b" stroke-bottom="#27272a" />
  <circle cx="50" cy="35" r="16" fill="#06b6d4" />
  <text x="78" y="42" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="22" fill="#ffffff">NeoFaro — Directorio Vecinal</text>
  
  <!-- Panel Lateral Izquierdo -->
  <rect x="24" y="94" width="380" height="602" rx="20" fill="#18181b" stroke="#27272a" />
  <text x="48" y="135" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="20" fill="#ffffff">Comercios en tu zona</text>
  
  <rect x="44" y="160" width="340" height="90" rx="14" fill="#27272a" />
  <text x="64" y="195" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="16" fill="#ffffff">Farmacia Central (De Turno)</text>
  <text x="64" y="222" font-family="Arial, Helvetica, sans-serif" font-size="13" fill="#22d3ee">📍 A 120 metros • Abierto 24hs</text>

  <rect x="44" y="265" width="340" height="90" rx="14" fill="#27272a" />
  <text x="64" y="300" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="16" fill="#ffffff">Pizzería El Triángulo</text>
  <text x="64" y="327" font-family="Arial, Helvetica, sans-serif" font-size="13" fill="#22c55e">🛵 Envíos a domicilio • Abierto</text>

  <!-- Mapa Grande a la Derecha -->
  <rect x="424" y="94" width="832" height="602" rx="20" fill="#0f172a" stroke="#27272a" />
  <line x1="424" y1="320" x2="1256" y2="320" stroke="#1e293b" stroke-width="12" />
  <line x1="840" y1="94" x2="840" y2="696" stroke="#1e293b" stroke-width="12" />
  <circle cx="840" cy="320" r="30" fill="#06b6d4" />
  <circle cx="840" cy="320" r="12" fill="#ffffff" />
  <text x="840" y="375" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="16" fill="#ffffff" text-anchor="middle">NeoFaro GPS Activo</text>
</svg>
`;

  await sharp(Buffer.from(desktopScreenshotSvg))
    .resize(1280, 720)
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'screenshot-desktop.png'));
  console.log(' ✔ Creado: public/screenshot-desktop.png (1280x720)');

  console.log('[IconGenerator] ✅ Todos los recursos gráficos se generaron exitosamente.');
}

generarIconos().catch(console.error);
