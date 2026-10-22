import { NextResponse } from 'next/server';
import { getComercios } from '@/lib/supabase';

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
