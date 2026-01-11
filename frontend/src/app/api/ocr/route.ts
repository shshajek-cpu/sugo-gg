import { NextRequest, NextResponse } from 'next/server';

// Gemini 1.5 Flash OCR API
export async function POST(request: NextRequest) {
    try {
        const { image } = await request.json();

        if (!image) {
            return NextResponse.json({ error: 'Image is required' }, { status: 400 });
        }

        const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_VISION_API_KEY;

        if (!GEMINI_API_KEY) {
            console.error('[OCR API] Missing Gemini API key');
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
                            text: `이 게임 스크린샷에서 파티원 정보를 정확히 추출하세요.

## 형식
- 각 파티원은 "캐릭터명[서버명]" 형태로 표시됩니다
- 레벨 정보(LV XX)가 함께 표시될 수 있습니다

## 출력 형식 (이 형식만 출력하세요)
캐릭터명1[서버명1]
캐릭터명2[서버명2]
캐릭터명3[서버명3]
캐릭터명4[서버명4]

## 중요 - 한글 글자 구분
반드시 정확히 구분하세요:

### 쌍자음 구분
- ㄲ vs ㄱ: 까/가, 꺼/거, 꼬/고
- ㄸ vs ㄷ: 따/다, 떠/더, 또/도, 뚜/두
- ㅃ vs ㅂ: 빠/바, 뻐/버, 뽀/보
- ㅆ vs ㅅ: 싸/사, 쏘/소, 쑤/수
- ㅉ vs ㅈ: 짜/자, 쩌/저, 쪼/조

### 비슷한 초성 구분 (매우 중요!)
- ㅂ vs ㅎ: 밥/합, 반/한, 별/혈, 봄/홈
- ㅁ vs ㅂ: 맘/밤, 물/불, 말/발
- ㄴ vs ㄹ: 나/라, 눈/룬, 님/림
- ㅇ vs ㅎ: 아/하, 오/호, 은/흔

## 규칙
- 대괄호 [ ] 안의 서버명을 정확히 읽으세요
- 설명이나 부가 텍스트 없이 위 형식만 출력하세요
- 이미지에서 보이는 그대로 정확히 읽으세요`
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
                maxOutputTokens: 1024
            }
        };

        console.log('[OCR API] Calling Gemini 2.5 Flash Lite...');

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
            console.error('[OCR API] Gemini error:', response.status, errorText);
            return NextResponse.json({ error: `OCR failed: ${response.status}` }, { status: response.status });
        }

        const result = await response.json();
        console.log('[OCR API] Gemini response:', JSON.stringify(result).substring(0, 500));

        // Gemini 결과에서 텍스트 추출
        let extractedText = '';
        if (result.candidates && result.candidates[0]?.content?.parts) {
            extractedText = result.candidates[0].content.parts
                .map((part: any) => part.text || '')
                .join('\n');
        }

        console.log('[OCR API] Extracted text:', extractedText);

        return NextResponse.json({
            success: true,
            text: extractedText,
            raw: result
        });

    } catch (error: any) {
        console.error('[OCR API] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
