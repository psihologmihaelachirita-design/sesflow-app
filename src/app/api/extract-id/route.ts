import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    console.log('=== START EXTRACT CLAUDE VISION ===');

    const formData = await request.formData();
    const image = formData.get('image') as File;

    if (!image) {
      return NextResponse.json({ error: 'Nu s-a găsit nicio imagine' }, { status: 400 });
    }

    const imageBuffer = await image.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');

    let mediaType = image.type;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(mediaType)) {
      mediaType = 'image/jpeg';
    }

    // Folosim varianta stabilă de Claude Sonnet 3.5
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20240620',
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
                text: `Analizează această imagine care conține un act de identitate (buletin RO sau PL).

Extrage:
1. last_name (Nume de familie)
2. first_name (Prenume)
3. national_id (CNP pentru RO / PESEL pentru PL)
4. id_card_series (Seria și Numărul actului)
5. address (Adresa de domiciliu)
6. country_code ("RO" sau "PL")

Răspunde STRICT cu JSON valid:
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
      console.error('Eroare Anthropic:', data);
      return NextResponse.json({ error: 'Eroare la procesarea buletinului cu AI.' }, { status: 500 });
    }

    const rawText = data.content?.[0]?.text || '';
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    const extractedData = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    // Trimitem înapoi formatul pe care îl așteaptă exact pagina ta (cu .extractedData și .client)
    return NextResponse.json({
      extractedData: extractedData,
      client: { id: 'temp-' + Date.now() }
    });

  } catch (error: any) {
    console.error('EROARE SERVER:', error);
    return NextResponse.json({ error: 'Eroare la procesare.' }, { status: 500 });
  }
}