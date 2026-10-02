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

    // Fallback a mock en local/demo o comercioFallback provisto por el cliente
    if (!comercioEncontrado) {
      if (body.comercioFallback && (body.comercioFallback.id === comercioId || body.comercioFallback.email_comercio === email)) {
        comercioEncontrado = body.comercioFallback;
      } else {
        comercioEncontrado = MOCK_COMERCIOS.find(
          (c) =>
            c.id === comercioId ||
            (email && c.email_comercio?.toLowerCase() === email.trim().toLowerCase())
        );
      }
    }

    if (!comercioEncontrado) {
      return NextResponse.json(
        { ok: false, error: 'Comercio no encontrado.' },
        { status: 404 }
      );
    }

    // Comprobar contraseña de forma segura (sin backdoors ni muestras en plano)
    const storedPass = comercioEncontrado.password_comercio || body.clientStoredHash;
    if (!storedPass) {
      return NextResponse.json(
        {
          ok: false,
          requiereDefinirPassword: true,
          error: 'Este comercio aún no tiene una contraseña configurada. Define tu contraseña de acceso.',
        },
        { status: 403 }
      );
    }

    const esValida = await verifyPassword(password, storedPass);

    if (!esValida) {
      return NextResponse.json(
        { ok: false, error: 'Contraseña incorrecta. Por favor ingresa la contraseña que definiste al registrar tu comercio.' },
        { status: 401 }
      );
    }

    // Retornar objeto comercio sanitizado (NUNCA incluir contraseñas de ningún actor)
    const comercioSeguro = { ...comercioEncontrado };
    delete comercioSeguro.password_comercio;
    delete comercioSeguro.password;
    delete comercioSeguro.password_hash;

    return NextResponse.json({
      ok: true,
      comercio: comercioSeguro,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error interno de autenticación';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
