import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inițializare client Supabase Backend
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    console.log('=== START EXTRACT & SAVE TO SUPABASE ===');

    const formData = await request.formData();
    const image = formData.get('image') as File;
    const psychologistId = formData.get('psychologist_id') as string;

    if (!image) {
      return NextResponse.json({ error: 'Nu s-a găsit nicio imagine' }, { status: 400 });
    }

    const imageBuffer = await image.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');

    let mediaType = image.type;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(mediaType)) {
      mediaType = 'image/jpeg';
    }

    // 1. Extragere prin AI (Claude Vision)
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: base64Image,
                },
              },
              {
                type: 'text',
                text: `Analizează această imagine care conține un act de identitate.
Detectează dacă este din ROMÂNIA (C.I.) sau POLONIA (Dowód Osobisty).

Extrage:
1. last_name (Nume de familie / NAZWISKO)
2. first_name (Prenume / IMIĘ)
3. national_id (CNP pentru RO - 13 cifre / PESEL pentru PL - 11 cifre)
4. id_card_series (Seria și Nr actului)
5. address (Adresa de domiciliu)
6. country_code ("RO" sau "PL")

Răspunde STRICT cu JSON:
{
  "last_name": "...",
  "first_name": "...",
  "national_id": "...",
  "id_card_series": "...",
  "address": "...",
  "country_code": "RO"
}`,
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: data.error?.message || 'Eroare Claude API' }, { status: 500 });
    }

    const rawText = data.content?.[0]?.text || '';
    const cleaned = rawText.replace(/```json|```/g, '').trim();
    const extractedData = JSON.parse(cleaned);

    // 2. Salvare automată în Supabase în tabelul "clients"
    const { data: newClient, error: dbError } = await supabase
      .from('clients')
      .insert([
        {
          psychologist_id: psychologistId || null,
          first_name: extractedData.first_name,
          last_name: extractedData.last_name,
          national_id: extractedData.national_id,
          id_card_series: extractedData.id_card_series,
          address: extractedData.address,
          id_scanned_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (dbError) {
      console.error('Eroare salvare Supabase:', dbError);
      return NextResponse.json({ error: 'Eroare la salvarea în baza de date', details: dbError }, { status: 500 });
    }

    console.log('Client salvat cu succes în Supabase:', newClient.id);

    return NextResponse.json({
      client: newClient,
      extractedData,
    });
  } catch (error: any) {
    console.error('EROARE SERVER:', error);
    return NextResponse.json({ error: error.message || 'Eroare necunoscută' }, { status: 500 });
  }
}