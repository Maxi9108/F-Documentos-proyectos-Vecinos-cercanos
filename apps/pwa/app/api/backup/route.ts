import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { supabase, isSupabaseConfigured, getComercios } from '@/lib/supabase';
import { MOCK_COMERCIOS } from '@/lib/mock-comercios';
import { CATEGORIAS_BASE } from '@/lib/categorias';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const shouldDownload = searchParams.get('download') === 'true';

    // 0. Verificación estricta de seguridad y autorización
    const configuredSecret = process.env.BACKUP_SECRET_KEY || process.env.CRON_SECRET;
    const authHeader = request.headers.get('authorization');
    const customHeader = request.headers.get('x-backup-key');
    const urlKey = searchParams.get('key');

    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
    const providedKey = bearerToken || customHeader?.trim() || urlKey?.trim();

    if (!configuredSecret) {
      console.error('[Backup API] BACKUP_SECRET_KEY no está configurada en las variables de entorno.');
      return NextResponse.json(
        {
          success: false,
          error: 'Acceso bloqueado: configure BACKUP_SECRET_KEY en las variables de entorno del servidor.',
        },
        { status: 503 }
      );
    }

    if (!providedKey || providedKey !== configuredSecret) {
      return NextResponse.json(
        {
          success: false,
          error: 'Acceso no autorizado. Debe proporcionar una clave válida en la cabecera Authorization o parámetro key.',
        },
        { status: 401 }
      );
    }

    const timestamp = new Date().toISOString();
    const formattedDate = timestamp.replace(/[:.]/g, '-');

    // 1. Recolectar datos de comercios (sanitizados sin contraseñas)
    let comerciosData: unknown[] = [];
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('comercios').select('*');
      if (!error && data) {
        comerciosData = data.map((c: Record<string, unknown>) => {
          const sanitized = { ...c };
          delete sanitized.password_comercio;
          return sanitized;
        });
      } else {
        comerciosData = await getComercios();
      }
    } else {
      comerciosData = MOCK_COMERCIOS;
    }

    // 2. Recolectar datos de categorías
    let categoriasData: unknown[] = [];
    if (isSupabaseConfigured) {
      const { data } = await supabase.from('categorias').select('*');
      categoriasData = data && data.length > 0 ? data : CATEGORIAS_BASE;
    } else {
      categoriasData = CATEGORIAS_BASE;
    }

    // 3. Recolectar datos de administradores
    let administradoresData: unknown[] = [];
    if (isSupabaseConfigured) {
      const { data } = await supabase.from('administradores').select('id, email, nombre, rol, permisos, activo, created_at');
      administradoresData = data || [];
    }

    // 4. Recolectar eventos de analítica
    let analyticsData: unknown[] = [];
    if (isSupabaseConfigured) {
      const { data } = await supabase.from('eventos_analytics').select('*').limit(500).order('timestamp', { ascending: false });
      analyticsData = data || [];
    }

    // Estructura completa del Respaldo
    const backupSnapshot = {
      app: 'NeoFaro (Vecin@s Conectad@s)',
      version: '1.0.0',
      timestamp,
      fuente: isSupabaseConfigured ? 'supabase_production' : 'demo_local_mock',
      estadisticas: {
        total_comercios: comerciosData.length,
        total_categorias: categoriasData.length,
        total_administradores: administradoresData.length,
        total_eventos_analytics: analyticsData.length,
      },
      datos: {
        comercios: comerciosData,
        categorias: categoriasData,
        administradores: administradoresData,
        eventos_analytics: analyticsData,
      },
    };

    // 5. Guardar en el directorio de backups local (en el filesystem del servidor)
    try {
      // Raíz del proyecto
      const rootDir = process.cwd();
      const backupDir = path.resolve(rootDir, '../../backups');
      const backupDirLocal = path.resolve(rootDir, 'backups');

      // Intentar guardar en la raíz del monorepo o en la carpeta de la app
      const targetDir = fs.existsSync(path.resolve(rootDir, '../../package.json')) ? backupDir : backupDirLocal;

      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const backupFilename = `backup-neofaro-${formattedDate}.json`;
      const fullPath = path.join(targetDir, backupFilename);
      const latestPath = path.join(targetDir, 'backup-latest.json');

      const jsonString = JSON.stringify(backupSnapshot, null, 2);
      fs.writeFileSync(fullPath, jsonString, 'utf-8');
      fs.writeFileSync(latestPath, jsonString, 'utf-8');

      // Limpiar backups antiguos que superen los 14 días
      try {
        const files = fs.readdirSync(targetDir);
        const now = Date.now();
        const maxAgeMs = 14 * 24 * 60 * 60 * 1000;

        for (const file of files) {
          if (file.startsWith('backup-neofaro-') && file.endsWith('.json')) {
            const filePath = path.join(targetDir, file);
            const stats = fs.statSync(filePath);
            if (now - stats.mtimeMs > maxAgeMs) {
              fs.unlinkSync(filePath);
            }
          }
        }
      } catch (cleanErr) {
        console.warn('[Backup API] Error al limpiar backups antiguos:', cleanErr);
      }
    } catch (fsErr) {
      console.warn('[Backup API] No se pudo escribir backup en disco:', fsErr);
    }

    // 6. Si el usuario solicitó descarga desde el navegador
    if (shouldDownload) {
      return new NextResponse(JSON.stringify(backupSnapshot, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="backup-neofaro-${formattedDate}.json"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      mensaje: 'Respaldo completado exitosamente.',
      timestamp,
      estadisticas: backupSnapshot.estadisticas,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
