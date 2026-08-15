import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token lipsește.' }, { status: 400 });
    }

    const { data: client, error } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('id', token)
      .maybeSingle();

    if (error || !client) {
      return NextResponse.json({ error: 'Clientul nu a fost găsit.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, client });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Eroare server' }, { status: 500 });
  }
}