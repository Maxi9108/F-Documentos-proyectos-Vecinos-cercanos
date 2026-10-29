import { NextRequest, NextResponse } from 'next/server';
import { getComercios, getSupabaseAdminClient } from '@/lib/supabase';
import { hashPassword } from '@/lib/crypto';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const comercios = await getComercios();
    return NextResponse.json(
      { ok: true, data: comercios, total: comercios.length },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    console.error('[/api/comercios] Error al obtener comercios:', error);
    return NextResponse.json(
      { ok: false, error: error?.message || 'Error interno al cargar comercios' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const comercio = await req.json();

    if (!comercio || !comercio.nombre || !comercio.rubro || !comercio.direccion) {
      return NextResponse.json(
        { ok: false, error: 'Faltan campos obligatorios requeridos (nombre, rubro, dirección).' },
        { status: 400 }
      );
    }

    const sb = getSupabaseAdminClient();

    // Asegurar id UUID válido para PostgreSQL
    const id =
      comercio.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(comercio.id)
        ? comercio.id
        : crypto.randomUUID();

    // Hashing seguro de password si vino en texto plano
    let passwordSegura = comercio.password_comercio || null;
    if (passwordSegura && passwordSegura.length < 60) {
      passwordSegura = await hashPassword(passwordSegura);
    }

    const ahoraIso = new Date().toISOString();

    // 1. Inserción/actualización segura en public.comercios (solo columnas existentes en la tabla)
    const payloadBase = {
      id,
      nombre: String(comercio.nombre).trim(),
      rubro: String(comercio.rubro).trim(),
      direccion: String(comercio.direccion).trim(),
      telefono: comercio.telefono ? String(comercio.telefono).trim() : null,
      latitud: typeof comercio.latitud === 'number' ? comercio.latitud : parseFloat(comercio.latitud) || -34.6,
      longitud: typeof comercio.longitud === 'number' ? comercio.longitud : parseFloat(comercio.longitud) || -58.4,
      esta_abierto: comercio.esta_abierto ?? true,
      estado_aprobacion: comercio.estado_aprobacion || 'pendiente',
      nivel: comercio.nivel || 'standar',
      fecha_solicitud: comercio.fecha_solicitud || ahoraIso,
      user_id: comercio.user_id || null,
      aprobado_por: comercio.aprobado_por || null,
      fecha_aprobacion: comercio.fecha_aprobacion || null,
    };

    const { error: errCom } = await sb.from('comercios').upsert([payloadBase]);
    if (errCom) {
      console.error('[/api/comercios POST] Error al guardar en public.comercios:', errCom);
      return NextResponse.json({ ok: false, error: errCom.message }, { status: 500 });
    }

    // 2. Inserción de todos los metadatos enriquecidos en public.solicitudes_modificacion
    const solPayload = {
      id,
      comercio_id: id,
      user_id: comercio.user_id || null,
      comercio_nombre: payloadBase.nombre,
      cambios: {
        ...comercio,
        id,
        password_comercio: passwordSegura,
        tipo_solicitud: comercio.estado_aprobacion === 'pendiente' ? 'alta_nuevo_comercio' : 'actualizacion',
      },
      estado: payloadBase.estado_aprobacion,
      fecha_solicitud: payloadBase.fecha_solicitud,
      aprobado_por: payloadBase.aprobado_por,
      fecha_aprobacion: payloadBase.fecha_aprobacion,
      motivo_rechazo: comercio.motivo_rechazo || null,
    };

    const { error: errSol } = await sb.from('solicitudes_modificacion').upsert([solPayload]);
    if (errSol) {
      console.warn('[/api/comercios POST] Aviso en solicitudes_modificacion:', errSol.message);
    }

    // 3. Sincronización del catálogo de productos si está presente
    if (comercio.productos && Array.isArray(comercio.productos) && comercio.productos.length > 0) {
      try {
        const prods = comercio.productos
          .filter((p: any) => p && p.nombre)
          .map((p: any) => ({
            id:
              p.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(p.id)
                ? p.id
                : crypto.randomUUID(),
            comercio_id: id,
            nombre: String(p.nombre).trim(),
            descripcion: p.descripcion ? String(p.descripcion).trim() : null,
            precio: typeof p.precio === 'number' ? p.precio : parseFloat(p.precio) || 0,
            precio_oferta: p.precio_oferta != null ? parseFloat(p.precio_oferta) : null,
            es_oferta: Boolean(p.es_oferta),
            descuento_porcentaje: p.descuento_porcentaje != null ? parseInt(p.descuento_porcentaje) : null,
            imagen_url: p.imagen_url || null,
            categoria: p.categoria || null,
          }));

        if (prods.length > 0) {
          await sb.from('productos').upsert(prods);
        }
      } catch (errP) {
        console.warn('[/api/comercios POST] Aviso al sincronizar catálogo de productos:', errP);
      }
    }

    return NextResponse.json({ ok: true, data: { ...comercio, id } });
  } catch (error: any) {
    console.error('[/api/comercios POST] Excepción inesperada:', error);
    return NextResponse.json(
      { ok: false, error: error?.message || 'Error interno al registrar el comercio' },
      { status: 500 }
    );
  }
}

