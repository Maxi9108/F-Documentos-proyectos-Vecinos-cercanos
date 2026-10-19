import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, getComercios } from '@/lib/supabase';
import { MOCK_COMERCIOS } from '@/lib/mock-comercios';
import { CATEGORIAS_BASE } from '@/lib/categorias';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Inicializar cliente Supabase con service_role si está disponible en el servidor
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceRoleKey) {
    return createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });
  }
  return null;
}

// Columnas válidas en la base de datos Supabase para comercios
const COLUMNAS_COMERCIOS = new Set([
  'id',
  'nombre',
  'rubro',
  'direccion',
  'telefono',
  'latitud',
  'longitud',
  'esta_abierto',
  'creado_en',
  'estado_aprobacion',
  'nivel',
  'fecha_solicitud',
  'aprobado_por',
  'fecha_aprobacion',
  'user_id',
]);

// Columnas válidas en la base de datos Supabase para usuarios
const COLUMNAS_USUARIOS = new Set([
  'id',
  'email',
  'nombre',
  'rol',
  'estado',
  'motivo_estado',
  'comercio_id',
  'comercio_nombre',
  'fecha_registro',
  'ultimo_acceso',
  'verificado',
  'visitas',
]);

// =============================================================================
// GET /api/backup
// Descarga el respaldo completo de comercios y usuarios del sistema
// =============================================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shouldDownload = searchParams.get('download') === 'true';

    // Verificación de autorización:
    // Se acepta si coincide BACKUP_SECRET_KEY, o si viene de una petición de admin
    const configuredSecret = process.env.BACKUP_SECRET_KEY || process.env.CRON_SECRET;
    const authHeader = request.headers.get('authorization');
    const customHeader = request.headers.get('x-backup-key') || request.headers.get('x-admin-key');
    const urlKey = searchParams.get('key');
    const isAdminHeader = request.headers.get('x-admin-action') === 'true';

    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
    const providedKey = bearerToken || customHeader?.trim() || urlKey?.trim();

    // Si hay una secret configurada y NO es una petición explícita de admin desde el panel, verificamos
    if (configuredSecret && !isAdminHeader) {
      if (!providedKey || providedKey !== configuredSecret) {
        return NextResponse.json(
          {
            success: false,
            error: 'Acceso no autorizado. Debe proporcionar una clave válida o iniciar sesión como administrador.',
          },
          { status: 401 }
        );
      }
    }

    const timestamp = new Date().toISOString();
    const formattedDate = timestamp.replace(/[:.]/g, '-');
    const supabaseAdmin = getSupabaseAdmin();

    // 1. Recolectar datos de COMERCIOS (utilizando service_role para ver todos los estados)
    let comerciosData: any[] = [];
    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin.from('comercios').select('*').order('creado_en', { ascending: false });
      if (!error && data) {
        comerciosData = data;
      } else {
        console.warn('[Backup API] Error al consultar comercios con service_role:', error?.message);
        comerciosData = await getComercios();
      }
    } else if (isSupabaseConfigured) {
      const { data } = await supabase.from('comercios').select('*');
      comerciosData = data && data.length > 0 ? data : await getComercios();
    } else {
      comerciosData = MOCK_COMERCIOS;
    }

    // 2. Recolectar datos de USUARIOS (utilizando service_role para acceder a todos los vecinos registrados)
    let usuariosData: any[] = [];
    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin.from('usuarios').select('*').order('fecha_registro', { ascending: false });
      if (!error && data) {
        usuariosData = data;
      } else {
        console.warn('[Backup API] Error al consultar usuarios con service_role:', error?.message);
      }
    } else if (isSupabaseConfigured) {
      const { data } = await supabase.from('usuarios').select('*');
      usuariosData = data || [];
    }

    // 3. Recolectar datos de Categorías
    let categoriasData: any[] = [];
    if (supabaseAdmin) {
      const { data } = await supabaseAdmin.from('categorias').select('*');
      categoriasData = data && data.length > 0 ? data : CATEGORIAS_BASE;
    } else if (isSupabaseConfigured) {
      const { data } = await supabase.from('categorias').select('*');
      categoriasData = data && data.length > 0 ? data : CATEGORIAS_BASE;
    } else {
      categoriasData = CATEGORIAS_BASE;
    }

    // Estructura completa y limpia del Respaldo
    const backupSnapshot = {
      app: 'NeoFaro (Vecin@s Conectad@s)',
      version: '2.0.0',
      timestamp,
      fuente: supabaseAdmin ? 'supabase_service_role' : isSupabaseConfigured ? 'supabase_anon' : 'demo_local_mock',
      estadisticas: {
        total_comercios: comerciosData.length,
        total_usuarios: usuariosData.length,
        total_categorias: categoriasData.length,
      },
      datos: {
        comercios: comerciosData,
        usuarios: usuariosData,
        categorias: categoriasData,
      },
    };

    // 4. Intentar guardar en disco local si el entorno lo permite
    try {
      const rootDir = process.cwd();
      const backupDir = path.resolve(rootDir, '../../backups');
      const backupDirLocal = path.resolve(rootDir, 'backups');
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
    } catch (fsErr) {
      // Ignorar errores de filesystem en serverless como Vercel
    }

    // 5. Descarga directa si shouldDownload = true
    if (shouldDownload) {
      return new NextResponse(JSON.stringify(backupSnapshot, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="backup-neofaro-comercios-usuarios-${formattedDate.slice(0, 10)}.json"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      mensaje: 'Respaldo generado exitosamente.',
      timestamp,
      estadisticas: backupSnapshot.estadisticas,
      backup: backupSnapshot,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    console.error('[Backup API GET] Error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// =============================================================================
// POST /api/backup
// Restaura o importa comercios y usuarios a la base de datos a partir de un JSON
// =============================================================================
export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'No se puede restaurar: SUPABASE_SERVICE_ROLE_KEY no está configurada en el servidor.',
        },
        { status: 503 }
      );
    }

    let payload: any;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'El archivo enviado no contiene un JSON válido.' },
        { status: 400 }
      );
    }

    // Extraer colecciones (soporta tanto formato snapshot como formato directo)
    const comerciosRaw: any[] = Array.isArray(payload.datos?.comercios)
      ? payload.datos.comercios
      : Array.isArray(payload.comercios)
      ? payload.comercios
      : [];

    const usuariosRaw: any[] = Array.isArray(payload.datos?.usuarios)
      ? payload.datos.usuarios
      : Array.isArray(payload.usuarios)
      ? payload.usuarios
      : [];

    if (comerciosRaw.length === 0 && usuariosRaw.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'El archivo no contiene registros de comercios ni de usuarios para restaurar.',
        },
        { status: 400 }
      );
    }

    let comerciosExitosos = 0;
    let usuariosExitosos = 0;
    const errores: string[] = [];

    // 1. PROCESAR Y RESTAURAR COMERCIOS
    if (comerciosRaw.length > 0) {
      // Filtrar y normalizar campos para cumplir con el esquema real de Supabase
      const comerciosSanitizados = comerciosRaw
        .filter((c) => c && (c.id || c.nombre))
        .map((c) => {
          const sanitized: Record<string, any> = {};

          // Normalizar created_at a creado_en si existiera
          if (!c.creado_en && c.created_at) {
            c.creado_en = c.created_at;
          }

          // Asignar ID si falta
          if (!c.id) {
            c.id = crypto.randomUUID();
          }

          // Solo incluir columnas válidas de la tabla comercios
          for (const key of Object.keys(c)) {
            if (COLUMNAS_COMERCIOS.has(key)) {
              sanitized[key] = c[key];
            }
          }

          // Asegurar campos obligatorios con valores por defecto
          if (!sanitized.creado_en) sanitized.creado_en = new Date().toISOString();
          if (!sanitized.estado_aprobacion) sanitized.estado_aprobacion = 'aprobado';
          if (typeof sanitized.esta_abierto !== 'boolean') sanitized.esta_abierto = true;

          return sanitized;
        });

      // Insertar / actualizar en bloques de 25
      const CHUNK_SIZE = 25;
      for (let i = 0; i < comerciosSanitizados.length; i += CHUNK_SIZE) {
        const chunk = comerciosSanitizados.slice(i, i + CHUNK_SIZE);
        const { error: errCom } = await supabaseAdmin.from('comercios').upsert(chunk, {
          onConflict: 'id',
        });

        if (errCom) {
          console.error('[Backup API POST] Error al insertar bloque de comercios:', errCom.message);
          errores.push(`Error en comercios (bloque ${Math.floor(i / CHUNK_SIZE) + 1}): ${errCom.message}`);
        } else {
          comerciosExitosos += chunk.length;
        }
      }
    }

    // 2. PROCESAR Y RESTAURAR USUARIOS
    if (usuariosRaw.length > 0) {
      const usuariosSanitizados = usuariosRaw
        .filter((u) => u && (u.id || u.email))
        .map((u) => {
          const sanitized: Record<string, any> = {};

          if (!u.id) {
            u.id = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
          }

          for (const key of Object.keys(u)) {
            if (COLUMNAS_USUARIOS.has(key)) {
              sanitized[key] = u[key];
            }
          }

          if (!sanitized.fecha_registro) sanitized.fecha_registro = new Date().toISOString();
          if (!sanitized.ultimo_acceso) sanitized.ultimo_acceso = new Date().toISOString();
          if (!sanitized.estado) sanitized.estado = 'activo';
          if (!sanitized.rol) sanitized.rol = 'usuario';

          return sanitized;
        });

      // Insertar / actualizar en bloques de 25
      const CHUNK_SIZE = 25;
      for (let i = 0; i < usuariosSanitizados.length; i += CHUNK_SIZE) {
        const chunk = usuariosSanitizados.slice(i, i + CHUNK_SIZE);
        const { error: errUsr } = await supabaseAdmin.from('usuarios').upsert(chunk, {
          onConflict: 'id',
        });

        if (errUsr) {
          console.error('[Backup API POST] Error al insertar bloque de usuarios:', errUsr.message);
          errores.push(`Error en usuarios (bloque ${Math.floor(i / CHUNK_SIZE) + 1}): ${errUsr.message}`);
        } else {
          usuariosExitosos += chunk.length;
        }
      }
    }

    return NextResponse.json({
      success: errores.length === 0 || comerciosExitosos > 0 || usuariosExitosos > 0,
      mensaje: `Restauración finalizada: ${comerciosExitosos} comercios y ${usuariosExitosos} usuarios cargados en la base de datos.`,
      estadisticas: {
        comerciosTotal: comerciosRaw.length,
        comerciosExitosos,
        usuariosTotal: usuariosRaw.length,
        usuariosExitosos,
      },
      errores: errores.length > 0 ? errores : undefined,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    console.error('[Backup API POST] Error crítico:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
