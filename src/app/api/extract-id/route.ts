import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    console.log('=== START EXTRACT & SAVE ===');

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

    let extractedData = {
      first_name: '',
      last_name: '',
      national_id: '',
      id_card_series: '',
      address: '',
      country_code: 'PL'
    };

    // Încercăm apelul AI
    try {
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
                  text: 'Extrage datele din actul de identitate (first_name, last_name, national_id, id_card_series, address, country_code). Răspunde doar JSON.',
                },
              ],
            },
          ],
        }),
      });

      const data = await response.json();
      if (response.ok && data.content?.[0]?.text) {
        const jsonMatch = data.content[0].text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          extractedData = JSON.parse(jsonMatch[0]);
        }
      }
    } catch (aiErr) {
      console.log('Eroare la AI scan, continuam cu formularul:', aiErr);
    }

    // Salvare în Supabase
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(psychologistId);
    const validPsychologistId = isUuid ? psychologistId : null;

    let finalClient = {
      id: 'temp-' + Date.now(),
      ...extractedData
    };

    try {
      const { data: clientInserted } = await supabase
        .from('clients')
        .insert([
          {
            psychologist_id: validPsychologistId,
            first_name: extractedData.first_name || 'Completat manual',
            last_name: extractedData.last_name || 'Completat manual',
            national_id: extractedData.national_id || '',
            id_card_series: extractedData.id_card_series || '',
            address: extractedData.address || '',
            id_scanned_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (clientInserted) {
        finalClient = clientInserted;
      }
    } catch (dbErr) {
      console.log('Eroare salvare DB:', dbErr);
    }

    return NextResponse.json({
      client: finalClient,
      extractedData,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Eroare procesare' }, { status: 500 });
  }
}