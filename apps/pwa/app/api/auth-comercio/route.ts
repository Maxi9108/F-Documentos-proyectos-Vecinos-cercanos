import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { verifyPassword } from '@/lib/crypto';
import { MOCK_COMERCIOS } from '@/lib/mock-comercios';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { comercioId, email, password } = body;

    if (!password || (!comercioId && !email)) {
      return NextResponse.json(
        { ok: false, error: 'Faltan parámetros de autenticación requeridos.' },
        { status: 400 }
      );
    }

    let comercioEncontrado: any = null;

    if (isSupabaseConfigured) {
      let query = supabase.from('comercios').select('*');
      if (comercioId) {
        query = query.eq('id', comercioId);
      } else if (email) {
        query = query.eq('email_comercio', email.trim().toLowerCase());
      }

      const { data, error } = await query.single();
      if (!error && data) {
        comercioEncontrado = data;
      }
    }

    // Fallback a mock en local/demo
    if (!comercioEncontrado) {
      comercioEncontrado = MOCK_COMERCIOS.find(
        (c) =>
          c.id === comercioId ||
          (email && c.email_comercio?.toLowerCase() === email.trim().toLowerCase())
      );
    }

    if (!comercioEncontrado) {
      return NextResponse.json(
        { ok: false, error: 'Comercio no encontrado.' },
        { status: 404 }
      );
    }

    // Comprobar contraseña de forma segura (sin backdoors como admin o comercio123)
    const storedPass = comercioEncontrado.password_comercio;
    const esValida = await verifyPassword(password, storedPass);

    if (!esValida) {
      return NextResponse.json(
        { ok: false, error: 'Contraseña incorrecta. Por favor verifica tus credenciales.' },
        { status: 401 }
      );
    }

    // Retornar objeto comercio sanitizado (NUNCA incluir password_comercio)
    const comercioSeguro = { ...comercioEncontrado };
    delete comercioSeguro.password_comercio;

    return NextResponse.json({
      ok: true,
      comercio: comercioSeguro,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error interno de autenticación';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
