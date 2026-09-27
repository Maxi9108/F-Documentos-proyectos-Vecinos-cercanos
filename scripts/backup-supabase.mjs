/**
 * Script de Respaldo Automatizado de Base de Datos para NeoFaro
 * Ejecución: node scripts/backup-supabase.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Cargar variables de entorno desde apps/pwa/.env.local si no están en process.env
const envPath = path.join(rootDir, 'apps', 'pwa', '.env.local');
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      supabaseUrl = trimmed.replace('NEXT_PUBLIC_SUPABASE_URL=', '').trim();
    } else if (trimmed.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
      supabaseAnonKey = trimmed.replace('NEXT_PUBLIC_SUPABASE_ANON_KEY=', '').trim();
    }
  }
}

console.log(`[Backup NeoFaro] Iniciando respaldo de base de datos a las ${new Date().toLocaleString()}...`);
console.log(`[Backup NeoFaro] Servidor: ${supabaseUrl || 'Modo local'}`);

async function ejecutarRespaldo() {
  try {
    const timestamp = new Date().toISOString();
    const formattedDate = timestamp.replace(/[:.]/g, '-');
    const backupDir = path.join(rootDir, 'backups');

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    let comercios = [];
    let categorias = [];
    let administradores = [];
    let eventosAnalytics = [];

    if (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http')) {
      const headers = {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      };

      // 1. Obtener comercios (sanitizando campos de contraseña)
      try {
        const res = await fetch(`${supabaseUrl}/rest/v1/comercios?select=*`, { headers });
        if (res.ok) {
          const rawComercios = await res.json();
          comercios = rawComercios.map((c) => {
            const copia = { ...c };
            delete copia.password_comercio;
            return copia;
          });
          console.log(`[Backup NeoFaro] ✔ ${comercios.length} comercios respaldados de Supabase (sanitizados).`);
        } else {
          console.warn(`[Backup NeoFaro] ⚠ No se pudo consultar tabla comercios (${res.status}): ${await res.text()}`);
        }
      } catch (err) {
        console.warn('[Backup NeoFaro] Error al consultar tabla comercios:', err.message);
      }

      // 2. Obtener categorías
      try {
        const res = await fetch(`${supabaseUrl}/rest/v1/categorias?select=*`, { headers });
        if (res.ok) {
          categorias = await res.json();
          console.log(`[Backup NeoFaro] ✔ ${categorias.length} categorías respaldadas.`);
        }
      } catch (err) {
        console.warn('[Backup NeoFaro] Error al consultar categorías:', err.message);
      }

      // 3. Obtener administradores
      try {
        const res = await fetch(`${supabaseUrl}/rest/v1/administradores?select=id,email,nombre,rol,permisos,activo,created_at`, { headers });
        if (res.ok) {
          administradores = await res.json();
          console.log(`[Backup NeoFaro] ✔ ${administradores.length} administradores respaldados.`);
        }
      } catch (err) {
        console.warn('[Backup NeoFaro] Error al consultar administradores:', err.message);
      }

      // 4. Obtener analítica
      try {
        const res = await fetch(`${supabaseUrl}/rest/v1/eventos_analytics?select=*&order=timestamp.desc&limit=1000`, { headers });
        if (res.ok) {
          eventosAnalytics = await res.json();
          console.log(`[Backup NeoFaro] ✔ ${eventosAnalytics.length} eventos de analítica respaldados.`);
        }
      } catch (err) {
        console.warn('[Backup NeoFaro] Error al consultar eventos:', err.message);
      }
    }

    const snapshot = {
      app: 'NeoFaro (Vecin@s Conectad@s)',
      version: '1.0.0',
      timestamp,
      fuente: supabaseUrl ? 'supabase_production' : 'demo_local',
      estadisticas: {
        total_comercios: comercios.length,
        total_categorias: categorias.length,
        total_administradores: administradores.length,
        total_eventos_analytics: eventosAnalytics.length,
      },
      datos: {
        comercios,
        categorias,
        administradores,
        eventos_analytics: eventosAnalytics,
      },
    };

    const targetFile = path.join(backupDir, `backup-neofaro-${formattedDate}.json`);
    const latestFile = path.join(backupDir, 'backup-latest.json');

    const json = JSON.stringify(snapshot, null, 2);
    fs.writeFileSync(targetFile, json, 'utf-8');
    fs.writeFileSync(latestFile, json, 'utf-8');

    console.log(`[Backup NeoFaro] ✅ Respaldo guardado exitosamente en:`);
    console.log(`  -> ${targetFile}`);
    console.log(`  -> ${latestFile}`);

    // Limpieza de backups con más de 14 días
    const files = fs.readdirSync(backupDir);
    const now = Date.now();
    const maxAgeMs = 14 * 24 * 60 * 60 * 1000;
    let eliminados = 0;

    for (const file of files) {
      if (file.startsWith('backup-neofaro-') && file.endsWith('.json')) {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        if (now - stats.mtimeMs > maxAgeMs) {
          fs.unlinkSync(filePath);
          eliminados++;
        }
      }
    }

    if (eliminados > 0) {
      console.log(`[Backup NeoFaro] 🧹 Se depuraron ${eliminados} respaldos antiguos (> 14 días).`);
    }

    return snapshot;
  } catch (error) {
    console.error('[Backup NeoFaro] ❌ Error crítico durante el respaldo:', error);
    process.exit(1);
  }
}

ejecutarRespaldo();
