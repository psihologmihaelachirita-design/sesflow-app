import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { clientId, type, country, status, signatureData } = await request.json();

    if (!clientId) {
      return NextResponse.json({ error: 'ID-ul clientului este obligatoriu.' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('documents')
      .insert([
        {
          client_id: clientId,
          type: type || 'consent_pre',
          country: country || 'RO',
          status: status || 'signed',
          signature_data: signatureData,
          signed_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Eroare Inserare Document Server:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, document: data });
  } catch (error: any) {
    console.error('Eroare API Documents:', error);
    return NextResponse.json({ error: error.message || 'Eroare de server' }, { status: 500 });
  }
}