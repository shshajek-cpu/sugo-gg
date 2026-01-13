import { NextRequest, NextResponse } from 'next/server';

// Gemini Vision - 일반 OCR API
export async function POST(request: NextRequest) {
    try {
        const { image } = await request.json();

        if (!image) {
            return NextResponse.json({ error: 'Image is required' }, { status: 400 });
        }

        const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_VISION_API_KEY;

        if (!GEMINI_API_KEY) {
            console.error('[OCR General] Missing Gemini API key');
            return NextResponse.json({ error: 'OCR service not configured' }, { status: 500 });
        }

        // base64 데이터에서 prefix 제거 및 mime type 추출
        const matches = image.match(/^data:(image\/\w+);base64,(.+)$/);
        let mimeType = 'image/png';
        let base64Data = image;

        if (matches) {
            mimeType = matches[1];
            base64Data = matches[2];
        } else {
            base64Data = image.replace(/^data:image\/\w+;base64,/, '');
        }

        const requestBody = {
            contents: [
                {
                    parts: [
                        {
                            text: `이 이미지에서 모든 텍스트를 정확히 추출하세요.

## 규칙
1. 이미지에 있는 모든 텍스트를 읽어주세요
2. 줄바꿈과 문단 구조를 유지하세요
3. 한글, 영어, 숫자, 특수문자 모두 정확히 인식하세요
4. 표가 있다면 구조를 유지해서 보여주세요
5. 설명 없이 인식된 텍스트만 출력하세요

## 한글 인식 주의사항
- ㅐ와 ㅣ를 정확히 구분하세요 (캐/키, 배/비)
- ㅔ와 ㅣ를 정확히 구분하세요 (게/기, 세/시)
- 쌍자음을 정확히 인식하세요 (까/가, 싸/사)
- ㅂ과 ㅎ을 구분하세요 (반/한, 봄/홈)`
                        },
                        {
                            inline_data: {
                                mime_type: mimeType,
                                data: base64Data
                            }
                        }
                    ]
                }
            ],
            generationConfig: {
                temperature: 0,
                maxOutputTokens: 4096
            }
        };

        console.log('[OCR General] Calling Gemini...');

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[OCR General] Gemini error:', response.status, errorText);
            return NextResponse.json({ error: `OCR failed: ${response.status}` }, { status: response.status });
        }

        const result = await response.json();

        // Gemini 결과에서 텍스트 추출
        let extractedText = '';
        if (result.candidates && result.candidates[0]?.content?.parts) {
            extractedText = result.candidates[0].content.parts
                .map((part: any) => part.text || '')
                .join('\n');
        }

        console.log('[OCR General] Extracted text length:', extractedText.length);

        return NextResponse.json({
            success: true,
            text: extractedText
        });

    } catch (error: any) {
        console.error('[OCR General] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
