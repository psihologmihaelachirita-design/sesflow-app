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
                text: `Analizează această imagine care conține un act de identitate (buletin).

Detectează automat dacă este un act de identitate din ROMÂNIA (C.I. / Carte de Identitate) sau POLONIA (Dowód Osobisty).

Extrage cu atenție următoarele informații:
1. nume (Nume de familie / NAZWISKO)
2. prenume (Prenume / IMIĘ)
3. national_id: Codul Numeric Personal (CNP - 13 cifre pentru România) SAU PESEL (11 cifre pentru Polonia). Verifică și zona MRZ de jos dacă este cazul.
4. id_card_series: Seria și Numărul actului (ex: "RK 123456" pentru RO sau Seria/Nr cardului pentru PL).
5. adresa: Adresa completă de domiciliu (Domiciliu pentru RO; dacă lipsește la PL, lasă string gol).
6. country_code: "RO" dacă este buletin românesc, sau "PL" dacă este polonez.

Răspunde STRICT cu un obiect JSON valid, fără markdown, fără explicații suplimentare. Format exact:
{
  "last_name": "...",
  "first_name": "...",
  "national_id": "...",
  "id_card_series": "...",
  "address": "...",
  "country_code": "RO"
}

Dacă un câmp nu este lizibil sau nu există, pune string gol "". Nu inventa date.`,
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
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      const cleaned = jsonMatch ? jsonMatch[0] : rawText.replace(/```json|```/g, '').trim();
      extractedData = JSON.parse(cleaned);
    } catch (parseError) {
      console.error('Eroare parsare JSON:', parseError, 'Raw text:', rawText);
      return NextResponse.json(
        { error: 'Nu am putut interpreta răspunsul. Încearcă din nou cu o poză mai clară.' },
        { status: 500 }
      );
    }

    console.log('Date extrase și structurate:', extractedData);
    // Returnăm direct obiectul extras EXACT așa cum așteaptă frontend-ul tău inițial
    return NextResponse.json(extractedData);
  } catch (error: any) {
    console.error('EROARE SERVER:', error);
    return NextResponse.json(
      { error: 'Eroare server: ' + (error.message || 'unknown') },
      { status: 500 }
    );
  }
}