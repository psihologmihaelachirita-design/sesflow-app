import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    console.log('=== START EXTRACT CLAUDE VISION (RO & PL) ===');

    const formData = await request.formData();
    const image = formData.get('image') as File;

    if (!image) {
      return NextResponse.json({ error: 'Nu s-a găsit nicio imagine' }, { status: 400 });
    }

    console.log('Imagine primită:', image.name, image.type, image.size);

    const imageBuffer = await image.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');

    let mediaType = image.type;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(mediaType)) {
      mediaType = 'image/jpeg';
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
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
                text: `Analizează această imagine care conține un act de identitate (buletin).

Detectează automat dacă este un act de identitate din ROMÂNIA (C.I. / Carte de Identitate) sau POLONIA (Dowód Osobisty).

EXTRAGE URMĂTOARELE:

1. last_name (Nume de familie)
   - RO: caută "Nume" pe C.I.
   - PL: caută "NAZWISKO"

2. first_name (Prenume)
   - RO: caută "Prenume"
   - PL: caută "IMIĘ"

3. national_id (CNP sau PESEL)
   - RO: CNP-ul are 13 CIFRE. Pe buletinul românesc, este în zona MRZ (Machine Readable Zone) de jos sau sub serie/nr.
   - PL: PESEL-ul are 11 CIFRE. Pe buletinul polonez, este pe față și în MRZ.
   - Verifică ZONA MRZ (de jos) pentru a găsi numărul corect.

4. id_card_series (Seria și Numărul actului)
   - RO: caută "Seria" și "Nr." (ex: "RK 123456")
   - PL: caută seria cardului

5. country_code: "RO" sau "PL"

ATENȚIE:
- CNP = 13 CIFRE (ex: 1980312345678)
- PESEL = 11 CIFRE (ex: 72033012347)
- NU extrage adresa! ADRESA SE COMPLETEAZĂ MANUAL.

Răspunde STRICT cu JSON valid, fără markdown. Format:
{
  "last_name": "...",
  "first_name": "...",
  "national_id": "...",
  "id_card_series": "...",
  "country_code": "RO"
}

Dacă nu găsești un câmp, pune string gol "".`,
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Claude API error:', data);
      return NextResponse.json(
        { error: data.error?.message || 'Eroare la apelul Claude API' },
        { status: response.status }
      );
    }

    const rawText = data.content?.[0]?.text || '';
    console.log('Răspuns brut Claude:', rawText);

    let extractedData;
    try {
      const cleaned = rawText.replace(/```json|```/g, '').trim();
      extractedData = JSON.parse(cleaned);
    } catch (parseError) {
      console.error('Eroare parsare JSON:', parseError, 'Raw text:', rawText);
      return NextResponse.json(
        { error: 'Nu am putut interpreta răspunsul. Încearcă din nou cu o poză mai clară.' },
        { status: 500 }
      );
    }

    console.log('Date extrase și structurate:', extractedData);
    return NextResponse.json(extractedData);
  } catch (error: any) {
    console.error('EROARE SERVER:', error);
    return NextResponse.json(
      { error: 'Eroare server: ' + (error.message || 'unknown') },
      { status: 500 }
    );
  }
}