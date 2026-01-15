import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// 전체 서버 목록
const SERVERS = [
    { id: 1001, name: '시엘' }, { id: 1002, name: '네자칸' }, { id: 1003, name: '바이젤' },
    { id: 1004, name: '카이시넬' }, { id: 1005, name: '유스티엘' }, { id: 1006, name: '아리엘' },
    { id: 1007, name: '프레기온' }, { id: 1008, name: '메스람타에다' }, { id: 1009, name: '히타니에' },
    { id: 1010, name: '나니아' }, { id: 1011, name: '타하바타' }, { id: 1012, name: '루터스' },
    { id: 1013, name: '페르노스' }, { id: 1014, name: '다미누' }, { id: 1015, name: '카사카' },
    { id: 1016, name: '바카르마' }, { id: 1017, name: '챈가룽' }, { id: 1018, name: '코치룽' },
    { id: 1019, name: '이슈타르' }, { id: 1020, name: '티아마트' }, { id: 1021, name: '포에타' },
    { id: 2001, name: '이스라펠' }, { id: 2002, name: '지켈' }, { id: 2003, name: '트리니엘' },
    { id: 2004, name: '루미엘' }, { id: 2005, name: '마르쿠탄' }, { id: 2006, name: '아스펠' },
    { id: 2007, name: '에레슈키갈' }, { id: 2008, name: '브리트라' }, { id: 2009, name: '네몬' },
    { id: 2010, name: '하달' }, { id: 2011, name: '루드라' }, { id: 2012, name: '울고른' },
    { id: 2013, name: '무닌' }, { id: 2014, name: '오다르' }, { id: 2015, name: '젠카카' },
    { id: 2016, name: '크로메데' }, { id: 2017, name: '콰이링' }, { id: 2018, name: '바바룽' },
    { id: 2019, name: '파프니르' }, { id: 2020, name: '인드나흐' }, { id: 2021, name: '이스할겐' }
]

export async function GET(request: NextRequest) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ error: 'Missing Supabase credentials' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    try {
        // 랜덤 서버 선택
        const randomServer = SERVERS[Math.floor(Math.random() * SERVERS.length)]

        // 의미 없는 문자 대신 자주 쓰이는 한글 음절 사용 (약 500자)
        const COMMON_SYLLABLES = "가각간갈감갑강개객거건걸검겁게격견결겸경계고곡곤골곰공곶과곽관광괘괴교구국군굴궁권귀규균그극근글금급기긴길김까깨꼬꽃꾸꿈끝나낙난날남납낭내냉너널네녀년념녕노논놀농뇌누눈뉴느늑니닉다단달담답당대댁덕도독돈돌동둑둔뒤드득들등디따땅때또뚜뛰라락란랄람랍랑래랭량러럭런럼레력련렬렴령례로록론롱뢰루류륙률륭르리린림마막만많말망매맥맨맹머먹메며면명모목몰몸몽묘무묵문물미민밀박반발방배백뱀버번벌범법벽변별병보복본볼봄봉부북분불붕비빈빌빙사삭산살삼상새색생서석선설섬섭성세소속손솔송쇼수숙순술숨숭쉐슈스슬승시식신실심십쌍씨아악안알암압앙애액야약양어억언얼엄업에엔여역연열염엽영예오옥온올옴옹와완왕왜외요욕용우욱운울움웅원월위유육윤율융은을음응의이익인일임입잇있자작잔잠잡장재쟁저적전절점접정제조족존졸종좋좌죄주죽준줄중즉즐증지직진질짐집징차착찬찰참창채책처척천철첩청체초촉촌총최추축춘출춤충취츠측층치칙친칠침카칸캄캐커컨컬컴컵케코콜콤콩쾌쿠쿵크큰클키타탁탄탈탐탑탕태택탱터테토통투퉁특튼티틀트파팍판팔패팽퍼페펴편평포폭표푸품풍프피필핏하학한할함합항해핵행향허헌험헤헬혀현혈협형혜호혹혼홀홍화확환활황회획횟효후훈훌훔훤훼휘휴흉흐흑흔흘흠흡희흰히힘"

        const COMMON_LAST_NAMES = "김이박최정강조윤장임한오서신권황안송류홍전고문양손배조백허유남심노하곽성차주우구신임나전민유진지엄채원천방공강현함변염양변여추노소현범왕반양부성편조임"

        const lastName = COMMON_LAST_NAMES[Math.floor(Math.random() * COMMON_LAST_NAMES.length)]
        const firstName = COMMON_SYLLABLES[Math.floor(Math.random() * COMMON_SYLLABLES.length)]
        const randomKeyword = lastName + firstName

        console.log(`[Collector] Searching "${randomKeyword}" on ${randomServer.name}...`)

        const searchUrl = new URL('https://aion2.plaync.com/ko-kr/api/search/aion2/search/v2/character')
        searchUrl.searchParams.append('keyword', randomKeyword)
        searchUrl.searchParams.append('serverId', randomServer.id.toString())
        searchUrl.searchParams.append('page', '1')
        searchUrl.searchParams.append('size', '50')

        const response = await fetch(searchUrl.toString(), {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://aion2.plaync.com/'
            }
        })

        if (!response.ok) {
            console.error(`[Collector] API Failed: ${response.status} ${response.statusText}`)
            // 실패 로그 저장
            await supabase.from('collector_logs').insert({
                server_name: randomServer.name,
                keyword: `${randomKeyword} (Error ${response.status})`,
                collected_count: 0,
                type: 'auto'
            })

            return NextResponse.json({
                error: 'Search API failed',
                status: response.status,
                server: randomServer.name,
                keyword: randomKeyword
            }, { status: 200 }) // Frontend 처리를 위해 200 반환 (단 에러 내용은 포함)
        }

        const data = await response.json()
        const characters = data.list || []

        // pcId를 직업명으로 변환
        const pcIdToClassName: Record<number, string> = {
            6: '검성', 7: '검성', 8: '검성', 9: '검성',
            10: '수호성', 11: '수호성', 12: '수호성', 13: '수호성',
            14: '궁성', 15: '궁성', 16: '궁성', 17: '궁성',
            18: '살성', 19: '살성', 20: '살성', 21: '살성',
            22: '정령성', 23: '정령성', 24: '정령성', 25: '정령성',
            26: '마도성', 27: '마도성', 28: '마도성', 29: '마도성',
            30: '치유성', 31: '치유성', 32: '치유성', 33: '치유성',
            34: '호법성', 35: '호법성', 36: '호법성', 37: '호법성'
        }

        // DB에 저장할 데이터 준비
        const charactersToUpsert = characters.map((item: any) => ({
            character_id: item.characterId,
            name: item.characterName?.replace(/<[^>]*>/g, '') || item.characterName,
            server_id: item.serverId,
            // server_name: 컬럼이 없어서 에러 발생으로 제거
            class_name: pcIdToClassName[item.pcId] || null,
            race_name: item.race === 1 ? 'Elyos' : 'Asmodian',
            level: item.level,
            profile_image: item.profileImageUrl?.startsWith('http')
                ? item.profileImageUrl
                : item.profileImageUrl ? `https://profileimg.plaync.com${item.profileImageUrl}` : null,
            scraped_at: new Date().toISOString()
        }))

        // DB에 upsert
        const { error, count } = await supabase
            .from('characters')
            .upsert(charactersToUpsert, {
                onConflict: 'character_id',
                ignoreDuplicates: false
            })

        if (error) {
            console.error('[Collector] Upsert error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        console.log(`[Collector] Saved ${charactersToUpsert.length} characters from ${randomServer.name}`)

        // 수집 로그 저장
        await supabase.from('collector_logs').insert({
            server_name: randomServer.name,
            keyword: randomKeyword,
            collected_count: charactersToUpsert.length,
            type: 'auto'
        })

        // 현재 전체 캐릭터 수 조회
        const { count: totalCount } = await supabase
            .from('characters')
            .select('*', { count: 'exact', head: true })

        return NextResponse.json({
            message: `Collected ${charactersToUpsert.length} characters`,
            server: randomServer.name,
            keyword: randomKeyword,
            totalCharacters: totalCount,
            new_characters: charactersToUpsert.map((c: any) => ({
                id: c.character_id,
                server: c.server_id,
                name: c.name
            }))
        })

    } catch (err: any) {
        console.error('[Collector Error]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
