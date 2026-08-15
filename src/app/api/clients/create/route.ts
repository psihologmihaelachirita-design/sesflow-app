import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { clientName, clientEmail, psychologistId } = await request.json();

    if (!clientEmail) {
      return NextResponse.json({ error: 'Emailul este obligatoriu.' }, { status: 400 });
    }

    const emailClean = clientEmail.trim().toLowerCase();

    // 1. VERIFICARE DUPLICAT: Căutăm dacă emailul există deja în tabela 'clients'
    const { data: existingClient } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('email', emailClean)
      .maybeSingle();

    if (existingClient) {
      // Dacă clientul există deja, ÎNLOCUIM crearea cu reutilizarea linkului existent!
      const link = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3005'}/client/onboarding?token=${existingClient.id}`;
      
      return NextResponse.json({
        success: true,
        token: existingClient.id,
        client: existingClient,
        link,
        message: 'Clientul există deja. A fost reutilizat link-ul existent.',
      });
    }

    // 2. Dacă NU există, separăm numele și îl creăm normal
    const nameParts = clientName ? clientName.trim().split(' ') : ['Client', ''];
    const firstName = nameParts[0] || 'Client';
    const lastName = nameParts.slice(1).join(' ') || '-';

    const { data: newClient, error: insertError } = await supabaseAdmin
      .from('clients')
      .insert({
        email: emailClean,
        first_name: firstName,
        last_name: lastName,
        psychologist_id: psychologistId || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Eroare Inserare Server:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    const link = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3005'}/client/onboarding?token=${newClient.id}`;

    return NextResponse.json({ success: true, token: newClient.id, client: newClient, link });
  } catch (error: any) {
    console.error('Eroare API:', error);
    return NextResponse.json({ error: error.message || 'Eroare de server' }, { status: 500 });
  }
}