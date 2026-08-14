import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    console.log('=== START EXTRACT ID ===');

    const formData = await request.formData();
    const image = formData.get('image') as File;

    let extractedData = {
      last_name: '',
      first_name: '',
      national_id: '',
      id_card_series: '',
      address: '',
      country_code: 'RO'
    };

    if (image) {
      try {
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
            model: 'claude-3-haiku-20240307',
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
                    text: `Extrage din buletin: last_name, first_name, national_id, id_card_series, address, country_code. Răspunde doar JSON valid.`,
                  },
                ],
              },
            ],
          }),
        });

        const data = await response.json();
        if (response.ok && data.content?.[0]?.text) {
          const rawText = data.content[0].text;
          const jsonMatch = rawText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            extractedData = JSON.parse(jsonMatch[0]);
          }
        }
      } catch (err) {
        console.log('Eroare AI, se continuă pe modul manual.');
      }
    }

    // Întotdeauna răspundem cu OK 200 ca să lăsăm utilizatorul să meargă mai departe
    return NextResponse.json({
      extractedData: extractedData,
      client: { id: 'temp-' + Date.now() }
    });

  } catch (error: any) {
    return NextResponse.json({
      extractedData: {
        last_name: '',
        first_name: '',
        national_id: '',
        id_card_series: '',
        address: '',
        country_code: 'RO'
      },
      client: { id: 'temp-' + Date.now() }
    });
  }
}