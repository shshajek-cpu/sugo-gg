import { useState, useCallback } from 'react';
import { supabaseApi, SERVER_NAME_TO_ID, SERVER_ID_TO_NAME } from '../lib/supabaseApi';
import { MainCharacter, MAIN_CHARACTER_KEY } from './useMainCharacter';

export interface PartyMember {
    id: string;
    name: string;
    class: string;
    cp: number;
    gearScore: number;
    server: string;
    isMvp: boolean;
    level?: number;
    isMainCharacter?: boolean;
    profileImage?: string;
    characterId?: string;
    isFromDb?: boolean; // DB에서 조회된 실제 데이터인지 표시
}

export interface AnalysisResult {
    totalCp: number;
    grade: string;
    members: PartyMember[];
    recognizedCount: number; // OCR로 인식된 수
    foundCount: number; // DB/API에서 찾은 수
    pendingSelections?: PendingServerSelection[]; // 서버 선택 필요한 캐릭터들
}

// 서버 선택이 필요한 캐릭터 정보
export interface PendingServerSelection {
    slotIndex: number;
    name: string;
    abbreviation: string; // OCR로 인식된 서버 약어
    candidates: ServerCandidate[]; // 선택 가능한 서버별 캐릭터 정보
}

export interface ServerCandidate {
    server: string;
    serverId: number;
    characterData?: PartyMember; // 검색된 캐릭터 정보 (있으면)
    found: boolean;
}

export const usePartyScanner = () => {
    const [isScanning, setIsScanning] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [scanBottomOnly, setScanBottomOnly] = useState(true);
    const [croppedPreview, setCroppedPreview] = useState<string | null>(null); // 크롭된 이미지 미리보기
    const [pendingSelections, setPendingSelections] = useState<PendingServerSelection[]>([]); // 서버 선택 대기중
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null); // 분석 결과 저장

    // 이미지 전처리: 그레이스케일 + 대비 강화
    const preprocessImage = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // 그레이스케일 변환 + 대비 강화
        const contrastFactor = 1.5; // 대비 강화 계수
        for (let i = 0; i < data.length; i += 4) {
            // 그레이스케일 (가중 평균)
            const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;

            // 대비 강화
            let enhanced = ((gray - 128) * contrastFactor) + 128;
            enhanced = Math.max(0, Math.min(255, enhanced));

            // 이진화에 가깝게 (임계값 기반)
            const threshold = 128;
            const final = enhanced > threshold ? 255 : enhanced < 50 ? 0 : enhanced;

            data[i] = final;     // R
            data[i + 1] = final; // G
            data[i + 2] = final; // B
            // Alpha는 유지
        }

        ctx.putImageData(imageData, 0, 0);
    };

    const cropBottomPart = (base64Image: string): Promise<string> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) { resolve(base64Image); return; }

                // 파티바 영역: 화면 맨 아래 약 15% 높이, 왼쪽~중앙 55% 너비
                const cropHeight = Math.max(150, Math.round(img.height * 0.15));
                const startY = img.height - cropHeight;

                // 너비: 왼쪽 15%부터 70%까지 (파티원 4명 전체 포함)
                const startX = Math.round(img.width * 0.15);
                const cropWidth = Math.round(img.width * 0.55);

                canvas.width = cropWidth;
                canvas.height = cropHeight;

                // 2배 확대하여 OCR 정확도 향상
                const scale = 2;
                canvas.width = cropWidth * scale;
                canvas.height = cropHeight * scale;

                console.log(`[cropBottomPart] Image: ${img.width}x${img.height}, Crop: X=${startX}, Y=${startY}, W=${cropWidth}, H=${cropHeight}, Scale: ${scale}x`);

                // 크롭된 영역을 확대해서 그리기
                ctx.drawImage(img, startX, startY, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);

                // 전처리 적용 (대비 강화)
                preprocessImage(ctx, canvas.width, canvas.height);

                resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = () => resolve(base64Image);
            img.src = base64Image;
        });
    };

    // 대표 캐릭터 정보 가져오기 (localStorage에서)
    const getMainCharacter = (): MainCharacter | null => {
        try {
            const saved = localStorage.getItem(MAIN_CHARACTER_KEY);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.error('[usePartyScanner] Failed to get main character:', e);
        }
        return null;
    };

    // 중복 약어 → 가능한 서버 목록 (약어가 여러 서버에 해당할 수 있는 경우)
    const ambiguousAbbreviations: Record<string, string[]> = {
        '이스': ['이스라펠', '이스할겐', '이슈타르'],
        '이스라': ['이스라펠'],
        '이스할': ['이스할겐'],
        '이슈': ['이슈타르'],
        '아스': ['아스펠'],
        '아리': ['아리엘'],
        '루미': ['루미엘'],
        '루드': ['루드라'],
        '루터': ['루터스'],
        '네자': ['네자칸'],
        '네몬': ['네몬'],
        '바이': ['바이젤'],
        '바바': ['바바룽'],
        '바카': ['바카르마'],
    };

    // 서버 약어가 여러 서버에 해당하는지 확인
    const getPossibleServers = (ocrServer: string): string[] => {
        // 정확한 중복 약어 매칭
        if (ambiguousAbbreviations[ocrServer]) {
            return ambiguousAbbreviations[ocrServer];
        }
        // 단일 서버로 보정되는 경우
        const corrected = correctServerName(ocrServer);
        return [corrected];
    };

    // OCR 서버명 오타 보정 (최소 2글자 이상만 매칭)
    const correctServerName = (ocrServer: string): string => {
        const corrections: Record<string, string> = {
            // === 천족 서버 (1xxx) ===
            '시엘': '시엘',
            '네자칸': '네자칸', '네자': '네자칸',
            '바이젤': '바이젤', '바이': '바이젤',
            '카이시넬': '카이시넬', '카이시': '카이시넬',
            '유스티엘': '유스티엘', '유스티': '유스티엘',
            '아리엘': '아리엘', '아리': '아리엘',
            '프레기온': '프레기온', '프레기': '프레기온',
            '메스람타에다': '메스람타에다', '메스람': '메스람타에다',
            '히타니에': '히타니에', '히타니': '히타니에',
            '나니아': '나니아', '나니': '나니아',
            '타하바타': '타하바타', '타하바': '타하바타',
            '루터스': '루터스', '루터': '루터스',
            '페르노스': '페르노스', '페르노': '페르노스',
            '다미누': '다미누', '다미': '다미누',
            '카사카': '카사카', '카사': '카사카',
            '바카르마': '바카르마', '바카르': '바카르마',
            '챈가룽': '챈가룽', '챈가': '챈가룽',
            '코치룽': '코치룽', '코치': '코치룽',
            '이슈타르': '이슈타르', '이슈타': '이슈타르',
            '티아마트': '티아마트', '티아마': '티아마트',
            '포에타': '포에타', '포에': '포에타',

            // === 마족 서버 (2xxx) ===
            '이스라펠': '이스라펠', '이스라엘': '이스라펠', '이스라': '이스라펠',
            '지켈': '지켈', '지헬': '지켈', '지겔': '지켈', '지게': '지켈',
            '트리니엘': '트리니엘', '트리니': '트리니엘', '트리': '트리니엘',
            '루미엘': '루미엘', '루미': '루미엘',
            '마르쿠탄': '마르쿠탄', '마르쿠': '마르쿠탄', '마르': '마르쿠탄',
            '아스펠': '아스펠', '아스': '아스펠',
            '에레슈키갈': '에레슈키갈', '에레슈키': '에레슈키갈', '에레슈': '에레슈키갈', '에레': '에레슈키갈',
            '브리트라': '브리트라', '브리트': '브리트라', '브리': '브리트라',
            '네몬': '네몬',
            '하달': '하달',
            '루드라': '루드라', '루드': '루드라',
            '울고른': '울고른', '울고': '울고른',
            '무닌': '무닌',
            '오다르': '오다르', '오다': '오다르',
            '젠카카': '젠카카', '젠카': '젠카카',
            '크로메데': '크로메데', '크로메': '크로메데', '크로': '크로메데',
            '콰이링': '콰이링', '콰이': '콰이링',
            '바바룽': '바바룽', '바바': '바바룽',
            '파프니르': '파프니르', '파프니': '파프니르', '파프': '파프니르',
            '인드나흐': '인드나흐', '인드나': '인드나흐', '인드': '인드나흐',
            '이스할겐': '이스할겐', '이스할': '이스할겐',
        };

        // 정확한 매칭만 사용 (2글자 이상)
        if (ocrServer.length >= 2 && corrections[ocrServer]) {
            console.log(`[correctServerName] Corrected: ${ocrServer} → ${corrections[ocrServer]}`);
            return corrections[ocrServer];
        }

        // 1글자는 서버명으로 인식하지 않음
        if (ocrServer.length < 2) {
            console.log(`[correctServerName] Too short, ignoring: ${ocrServer}`);
            return ocrServer;
        }

        return ocrServer;
    };

    // 파싱된 멤버 정보 (서버가 여러 개일 수 있음)
    interface ParsedMember {
        name: string;
        rawServer: string; // OCR로 인식된 원본 서버명
        possibleServers: string[]; // 가능한 서버 목록
        isMainCharacter?: boolean;
    }

    const smartParse = (rawText: string, addLog: (msg: string) => void): ParsedMember[] => {
        const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const matches: ParsedMember[] = [];
        const seenNames = new Set<string>();
        const mainChar = getMainCharacter();

        console.log('[smartParse] Raw lines:', lines);
        console.log('[smartParse] Main character:', mainChar?.name);
        addLog(`[OCR 원본] ${rawText.substring(0, 200)}...`);
        addLog(`[라인 수] ${lines.length}개`);

        const addMember = (name: string, rawServer: string, possibleServers: string[], isMain: boolean = false) => {
            const cleanName = name.replace(/[^a-zA-Z0-9가-힣]/g, '');
            if (cleanName.length < 2 || seenNames.has(cleanName)) return false;
            matches.push({ name: cleanName, rawServer, possibleServers, isMainCharacter: isMain });
            seenNames.add(cleanName);
            console.log('[smartParse] Added member:', cleanName, possibleServers, isMain);
            if (possibleServers.length > 1) {
                addLog(`[파싱] 멤버 추가: ${cleanName} [${rawServer}] → 서버 후보: ${possibleServers.join(', ')}${isMain ? ' (대표)' : ''}`);
            } else {
                addLog(`[파싱] 멤버 추가: ${cleanName} [${possibleServers[0]}]${isMain ? ' (대표)' : ''}`);
            }
            return true;
        };

        // 1. 대표 캐릭터를 먼저 슬롯 1에 추가 (항상 첫 번째)
        if (mainChar) {
            addLog(`[대표캐릭터] ${mainChar.name} [${mainChar.server}] - 슬롯 1 고정`);
            addMember(mainChar.name, mainChar.server, [mainChar.server], true);
        }

        // 서버명 있는 패턴: 이름 [서버]
        const serverRegex = /([가-힣a-zA-Z0-9]+)\s*\[([가-힣a-zA-Z0-9]+)\]/;

        // 전체 텍스트에서 한글 이름 추출
        const fullText = rawText.replace(/\n/g, ' ');

        // 2. OCR에서 서버명 패턴 찾기 (이름[서버] 형식만 - 서버명 없는건 무시)
        addLog(`[패턴 검색] "이름[서버]" 형식 찾는 중...`);
        const serverMatches = fullText.matchAll(new RegExp(serverRegex, 'g'));
        let serverMatchCount = 0;

        for (const match of serverMatches) {
            // 이미 3명 추가됨 (대표 1 + OCR 3 = 4명 최대)
            if (matches.length >= 4) {
                addLog(`[패턴 스킵] 최대 4명 도달`);
                break;
            }

            const name = match[1];
            const rawServer = match[2];

            // 숫자만 있는 서버명은 OCR 오류로 스킵
            if (/^\d+$/.test(rawServer)) {
                addLog(`[패턴 스킵] ${name}[${rawServer}] - 숫자만 있는 서버명`);
                continue;
            }

            // 서버명이 2글자 미만이면 스킵
            if (rawServer.length < 2) {
                addLog(`[패턴 스킵] ${name}[${rawServer}] - 서버명이 너무 짧음`);
                continue;
            }

            // 이름이 2자 미만이면 스킵
            if (name.length < 2) {
                addLog(`[패턴 스킵] ${name}[${rawServer}] - 이름이 너무 짧음`);
                continue;
            }

            // 가능한 서버 목록 가져오기
            const possibleServers = getPossibleServers(rawServer);

            // 대표 캐릭터와 같은 이름이면 스킵 (이미 추가됨)
            if (mainChar && name === mainChar.name) {
                addLog(`[패턴 스킵] ${name}[${rawServer}] - 대표 캐릭터와 동일`);
                continue;
            }

            if (possibleServers.length > 1) {
                addLog(`[패턴 매칭] ${name}[${rawServer}] → 서버 후보 ${possibleServers.length}개: ${possibleServers.join(', ')}`);
            } else {
                addLog(`[패턴 매칭] ${name}[${rawServer}] → ${possibleServers[0]}`);
            }
            addMember(name, rawServer, possibleServers, false);
            serverMatchCount++;
        }
        addLog(`[패턴 결과] ${serverMatchCount}개 매칭됨 (서버명 있는 캐릭터만)`);

        console.log('[smartParse] Final matches:', matches);
        addLog(`[최종] 대표캐릭터 1명 + OCR ${matches.length - 1}명 = 총 ${matches.length}명`);
        return matches.slice(0, 4); // 파티 총원 4명 제한
    };

    // Next.js API를 통해 캐릭터 상세 정보 조회 (noa_score 계산 포함)
    const fetchCharacterWithNoaScore = async (characterId: string, serverId: number): Promise<any> => {
        try {
            const res = await fetch(`/api/character?characterId=${encodeURIComponent(characterId)}&serverId=${serverId}`);
            if (!res.ok) {
                throw new Error(`API error: ${res.status}`);
            }
            const data = await res.json();

            // item_level 추출 (stats.statList에서)
            let itemLevel = 0;
            if (data.stats?.statList && Array.isArray(data.stats.statList)) {
                const itemLevelStat = data.stats.statList.find((s: any) =>
                    s.name === '아이템레벨' || s.type === 'ItemLevel'
                );
                itemLevel = itemLevelStat?.value || 0;
            }

            console.log(`[fetchCharacterWithNoaScore] Got data for ${characterId}:`,
                'noa_score:', data.profile?.noa_score, 'item_level:', itemLevel);

            // item_level을 데이터에 추가하여 반환
            return { ...data, item_level: itemLevel };
        } catch (err) {
            console.error(`[fetchCharacterWithNoaScore] Error:`, err);
            return null;
        }
    };

    // DB/API에서 캐릭터 정보 조회
    const lookupCharacter = async (name: string, serverName: string): Promise<PartyMember | null> => {
        // 서버명 보정 후 ID 조회
        const correctedServer = correctServerName(serverName);
        const serverId = SERVER_NAME_TO_ID[correctedServer];

        console.log(`[lookupCharacter] Looking up: ${name} on ${serverName} → ${correctedServer} (ID: ${serverId})`);

        // 유효하지 않은 서버명이면 스킵
        if (!serverId) {
            console.log(`[lookupCharacter] Invalid server name: ${serverName}, skipping`);
            return null;
        }

        // 레벤슈타인 거리 계산 (편집 거리)
        const levenshtein = (a: string, b: string): number => {
            if (a.length === 0) return b.length;
            if (b.length === 0) return a.length;
            const matrix = [];
            for (let i = 0; i <= b.length; i++) matrix[i] = [i];
            for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
            for (let i = 1; i <= b.length; i++) {
                for (let j = 1; j <= a.length; j++) {
                    if (b.charAt(i - 1) === a.charAt(j - 1)) {
                        matrix[i][j] = matrix[i - 1][j - 1];
                    } else {
                        matrix[i][j] = Math.min(
                            matrix[i - 1][j - 1] + 1,
                            matrix[i][j - 1] + 1,
                            matrix[i - 1][j] + 1
                        );
                    }
                }
            }
            return matrix[b.length][a.length];
        };

        const findExactMatch = (results: any[], searchName: string) => {
            if (results.length === 0) return null;

            // 정확히 이름이 일치하는 캐릭터만 반환
            const exact = results.find(r => r.name === searchName);
            if (exact) return { match: exact, type: 'exact' };

            return null;
        };

        try {
            // 1. 로컬 DB 먼저 검색 (빠름)
            const localResults = await supabaseApi.searchLocalCharacter(name, serverId);
            console.log(`[lookupCharacter] Local search results for ${name}:`, localResults.length);
            const localMatch = findExactMatch(localResults, name);

            if (localMatch) {
                console.log(`[lookupCharacter] Found in local DB:`, localMatch.match.name,
                    'noa_score:', localMatch.match.noa_score, 'item_level:', localMatch.match.item_level);

                // 로컬 검색 결과에 noa_score가 있으면 바로 사용
                if (localMatch.match.noa_score && localMatch.match.noa_score > 0) {
                    console.log(`[lookupCharacter] Using local search result data (has noa_score)`);
                    return {
                        id: localMatch.match.characterId,
                        characterId: localMatch.match.characterId,
                        name: localMatch.match.name,
                        class: localMatch.match.job || 'Unknown',
                        cp: localMatch.match.noa_score,
                        gearScore: localMatch.match.item_level || 0,
                        server: localMatch.match.server,
                        level: localMatch.match.level,
                        profileImage: localMatch.match.imageUrl,
                        isMvp: false,
                        isFromDb: true
                    };
                }

                // noa_score가 없으면 Next.js API를 통해 상세 조회 (noa_score 계산)
                console.log(`[lookupCharacter] No noa_score in local result, fetching from /api/character...`);
                try {
                    // Next.js API 호출 (noa_score 계산 포함)
                    const detail = await fetchCharacterWithNoaScore(localMatch.match.characterId, serverId);
                    if (detail && detail.profile) {
                        const noaScore = detail.profile.noa_score || 0;
                        const itemLevel = detail.item_level || 0;
                        const className = detail.profile.className || localMatch.match.job || 'Unknown';

                        console.log(`[lookupCharacter] Got data from /api/character - CP: ${noaScore}, GearScore: ${itemLevel}`);

                        return {
                            id: detail.profile.characterId || localMatch.match.characterId,
                            characterId: detail.profile.characterId || localMatch.match.characterId,
                            name: detail.profile.characterName || localMatch.match.name,
                            class: className,
                            cp: noaScore,
                            gearScore: itemLevel,
                            server: detail.profile.serverName || localMatch.match.server,
                            level: detail.profile.characterLevel || localMatch.match.level,
                            profileImage: detail.profile.profileImage || localMatch.match.imageUrl,
                            isMvp: false,
                            isFromDb: true
                        };
                    }

                    // API 실패시 검색 결과 사용
                    console.log(`[lookupCharacter] API returned no data, using search result`);
                    return {
                        id: localMatch.match.characterId,
                        characterId: localMatch.match.characterId,
                        name: localMatch.match.name,
                        class: localMatch.match.job || 'Unknown',
                        cp: localMatch.match.noa_score || 0,
                        gearScore: localMatch.match.item_level || 0,
                        server: localMatch.match.server,
                        level: localMatch.match.level,
                        profileImage: localMatch.match.imageUrl,
                        isMvp: false,
                        isFromDb: true
                    };
                } catch (detailErr) {
                    console.error(`[lookupCharacter] Failed to get detail, using search result:`, detailErr);
                    return {
                        id: localMatch.match.characterId,
                        characterId: localMatch.match.characterId,
                        name: localMatch.match.name,
                        class: localMatch.match.job || 'Unknown',
                        cp: localMatch.match.noa_score || 0,
                        gearScore: localMatch.match.item_level || 0,
                        server: localMatch.match.server,
                        level: localMatch.match.level,
                        profileImage: localMatch.match.imageUrl,
                        isMvp: false,
                        isFromDb: true
                    };
                }
            }

            // 2. 로컬 DB에 없으면 라이브 API 검색
            console.log(`[lookupCharacter] Not in local DB, trying live API for ${name}...`);
            const liveResults = await supabaseApi.searchCharacter(name, serverId);
            console.log(`[lookupCharacter] Live search results for ${name}:`, liveResults.length);
            const liveMatch = findExactMatch(liveResults, name);

            if (liveMatch) {
                console.log(`[lookupCharacter] Found in live API:`, liveMatch.match.name,
                    'noa_score:', liveMatch.match.noa_score, 'item_level:', liveMatch.match.item_level);

                // 검색 결과에 noa_score가 있으면 상세 조회 생략 (이미 DB에서 merge됨)
                if (liveMatch.match.noa_score && liveMatch.match.noa_score > 0) {
                    console.log(`[lookupCharacter] Using search result data (has noa_score)`);
                    return {
                        id: liveMatch.match.characterId,
                        characterId: liveMatch.match.characterId,
                        name: liveMatch.match.name,
                        class: liveMatch.match.job || 'Unknown',
                        cp: liveMatch.match.noa_score,
                        gearScore: liveMatch.match.item_level || 0,
                        server: liveMatch.match.server,
                        level: liveMatch.match.level,
                        profileImage: liveMatch.match.imageUrl,
                        isMvp: false,
                        isFromDb: true
                    };
                }

                // noa_score가 없으면 Next.js API를 통해 상세 조회 (noa_score 계산)
                console.log(`[lookupCharacter] No noa_score in search result, fetching from /api/character...`);
                try {
                    // Next.js API 호출 (noa_score 계산 포함)
                    const detail = await fetchCharacterWithNoaScore(liveMatch.match.characterId, serverId);
                    if (detail && detail.profile) {
                        const noaScore = detail.profile.noa_score || 0;
                        const itemLevel = detail.item_level || 0;
                        const className = detail.profile.className || liveMatch.match.job || 'Unknown';

                        console.log(`[lookupCharacter] Got data from /api/character - CP: ${noaScore}, GearScore: ${itemLevel}`);

                        return {
                            id: detail.profile.characterId || liveMatch.match.characterId,
                            characterId: detail.profile.characterId || liveMatch.match.characterId,
                            name: detail.profile.characterName || liveMatch.match.name,
                            class: className,
                            cp: noaScore,
                            gearScore: itemLevel,
                            server: detail.profile.serverName || liveMatch.match.server,
                            level: detail.profile.characterLevel || liveMatch.match.level,
                            profileImage: detail.profile.profileImage || liveMatch.match.imageUrl,
                            isMvp: false,
                            isFromDb: true
                        };
                    }

                    // API 실패시 검색 결과 사용
                    console.log(`[lookupCharacter] API returned no data, using search result`);
                    return {
                        id: liveMatch.match.characterId,
                        characterId: liveMatch.match.characterId,
                        name: liveMatch.match.name,
                        class: liveMatch.match.job || 'Unknown',
                        cp: liveMatch.match.noa_score || 0,
                        gearScore: liveMatch.match.item_level || 0,
                        server: liveMatch.match.server,
                        level: liveMatch.match.level,
                        profileImage: liveMatch.match.imageUrl,
                        isMvp: false,
                        isFromDb: true
                    };
                } catch (detailErr) {
                    console.error(`[lookupCharacter] Failed to get detail, using search result:`, detailErr);
                    return {
                        id: liveMatch.match.characterId,
                        characterId: liveMatch.match.characterId,
                        name: liveMatch.match.name,
                        class: liveMatch.match.job || 'Unknown',
                        cp: liveMatch.match.noa_score || 0,
                        gearScore: liveMatch.match.item_level || 0,
                        server: liveMatch.match.server,
                        level: liveMatch.match.level,
                        profileImage: liveMatch.match.imageUrl,
                        isMvp: false,
                        isFromDb: true
                    };
                }
            }

            console.log(`[lookupCharacter] Character not found: ${name}`);
            return null;
        } catch (err) {
            console.error(`[usePartyScanner] Failed to lookup character: ${name}`, err);
            return null;
        }
    };

    // OCR 결과로 캐릭터 정보 조회 및 결과 생성
    const buildAnalysisResult = async (
        parsedMembers: ParsedMember[]
    ): Promise<AnalysisResult> => {
        const recognizedCount = parsedMembers.length;

        if (recognizedCount === 0) {
            return {
                totalCp: 0,
                grade: '-',
                members: [],
                recognizedCount: 0,
                foundCount: 0
            };
        }

        const members: PartyMember[] = [];
        const pendingSelections: PendingServerSelection[] = [];

        // 각 멤버별로 처리
        for (let idx = 0; idx < parsedMembers.length; idx++) {
            const m = parsedMembers[idx];

            // 서버가 하나만 있는 경우 - 바로 검색
            if (m.possibleServers.length === 1) {
                const result = await lookupCharacter(m.name, m.possibleServers[0]);
                if (result) {
                    result.isMainCharacter = m.isMainCharacter;
                    members.push({ ...result, id: `member-${idx}` });
                } else {
                    // DB에서 찾지 못해도 OCR 인식 이름으로 멤버 생성
                    members.push({
                        id: `ocr-member-${idx}`,
                        name: m.name,
                        class: '미확인',
                        cp: 0,
                        gearScore: 0,
                        server: m.possibleServers[0],
                        isMvp: false,
                        isMainCharacter: m.isMainCharacter,
                        isFromDb: false
                    });
                }
            } else {
                // 서버가 여러 개인 경우 - 모든 서버에서 검색
                console.log(`[buildAnalysisResult] Multiple servers for ${m.name}: ${m.possibleServers.join(', ')}`);
                const candidates: ServerCandidate[] = [];
                let foundCount = 0;
                let foundResult: PartyMember | null = null;
                let foundServer = '';

                for (const serverName of m.possibleServers) {
                    const serverId = SERVER_NAME_TO_ID[serverName];
                    if (!serverId) continue;

                    const result = await lookupCharacter(m.name, serverName);
                    if (result) {
                        foundCount++;
                        foundResult = result;
                        foundServer = serverName;
                        candidates.push({
                            server: serverName,
                            serverId,
                            characterData: result,
                            found: true
                        });
                    } else {
                        candidates.push({
                            server: serverName,
                            serverId,
                            found: false
                        });
                    }
                }

                console.log(`[buildAnalysisResult] Found in ${foundCount} server(s)`);

                if (foundCount === 1 && foundResult) {
                    // 하나의 서버에서만 발견 - 자동 선택
                    foundResult.isMainCharacter = m.isMainCharacter;
                    foundResult.server = foundServer;
                    members.push({ ...foundResult, id: `member-${idx}` });
                } else if (foundCount > 1) {
                    // 여러 서버에서 발견 - 사용자 선택 필요
                    pendingSelections.push({
                        slotIndex: idx,
                        name: m.name,
                        abbreviation: m.rawServer,
                        candidates: candidates.filter(c => c.found)
                    });
                    // 임시로 첫 번째 후보 추가 (나중에 선택으로 교체)
                    const firstFound = candidates.find(c => c.found && c.characterData);
                    if (firstFound && firstFound.characterData) {
                        members.push({
                            ...firstFound.characterData,
                            id: `member-${idx}`,
                            isMainCharacter: m.isMainCharacter,
                            server: `${firstFound.server} (선택 필요)`
                        });
                    }
                } else {
                    // 어느 서버에서도 찾지 못함
                    members.push({
                        id: `ocr-member-${idx}`,
                        name: m.name,
                        class: '미확인',
                        cp: 0,
                        gearScore: 0,
                        server: `${m.rawServer} (미확인)`,
                        isMvp: false,
                        isMainCharacter: m.isMainCharacter,
                        isFromDb: false
                    });
                }
            }
        }

        // 대표 캐릭터가 첫 번째에 오도록 다시 정렬
        members.sort((a, b) => {
            if (a.isMainCharacter && !b.isMainCharacter) return -1;
            if (!a.isMainCharacter && b.isMainCharacter) return 1;
            return 0;
        });

        // MVP 결정 (가장 높은 CP)
        if (members.length > 0) {
            const maxCp = Math.max(...members.map(m => m.cp));
            members.forEach(m => {
                m.isMvp = m.cp === maxCp && m.cp > 0;
            });
        }

        const totalCp = members.reduce((acc, cur) => acc + cur.cp, 0);
        const avgCp = members.length > 0 ? totalCp / members.length : 0;

        // 등급 계산 (평균 CP 기준)
        let grade = '-';
        if (members.length > 0) {
            if (avgCp >= 4500) grade = 'S';
            else if (avgCp >= 3500) grade = 'A';
            else if (avgCp >= 2500) grade = 'B';
            else grade = 'C';
        }

        return {
            totalCp,
            grade,
            members,
            recognizedCount,
            foundCount: members.filter(m => m.isFromDb).length,
            pendingSelections: pendingSelections.length > 0 ? pendingSelections : undefined
        };
    };

    const scanImage = useCallback(async (file: File): Promise<AnalysisResult> => {
        setIsScanning(true);
        setLogs(['Image received. Initializing OCR...']);
        console.log('[usePartyScanner] Starting scan...');

        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onerror = (err) => {
                console.error('[usePartyScanner] FileReader error:', err);
                setIsScanning(false);
                reject(new Error('Failed to read image file'));
            };

            reader.onload = async (e) => {
                try {
                    console.log('[usePartyScanner] File loaded, starting OCR...');
                    const originalImage = e.target?.result as string;
                    let imageToScan = originalImage;

                    if (scanBottomOnly) {
                        setLogs(prev => [...prev, 'Cropping party bar...']);
                        imageToScan = await cropBottomPart(originalImage);
                        setCroppedPreview(imageToScan); // 미리보기 저장
                        console.log('[usePartyScanner] Image cropped');
                    } else {
                        setCroppedPreview(originalImage);
                    }

                    console.log('[usePartyScanner] Calling Clova OCR API...');
                    setLogs(prev => [...prev, 'Clova OCR 호출 중...']);

                    const ocrResponse = await fetch('/api/ocr', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ image: imageToScan })
                    });

                    if (!ocrResponse.ok) {
                        const errorData = await ocrResponse.json();
                        throw new Error(errorData.error || 'OCR failed');
                    }

                    const ocrResult = await ocrResponse.json();
                    const text = ocrResult.text || '';
                    console.log('[usePartyScanner] Clova OCR result:', text);
                    setLogs(prev => [...prev, 'OCR 완료. 텍스트 분석 중...']);

                    const addLog = (msg: string) => setLogs(prev => [...prev, msg]);
                    const parsedMembers = smartParse(text, addLog);
                    console.log('[usePartyScanner] Parsed members:', parsedMembers);
                    addLog(`OCR 완료: ${parsedMembers.length}명 인식됨`);

                    if (parsedMembers.length === 0) {
                        console.log('[usePartyScanner] No members found from OCR');
                        setLogs(prev => [...prev, '인식된 파티원이 없습니다. (OCR 텍스트: ' + text.substring(0, 100) + '...)']);
                        setIsScanning(false);
                        resolve({
                            totalCp: 0,
                            grade: '-',
                            members: [],
                            recognizedCount: 0,
                            foundCount: 0
                        });
                        return;
                    }

                    // DB/API에서 캐릭터 정보 조회
                    console.log('[usePartyScanner] Looking up characters in DB...');
                    setLogs(prev => [...prev, 'DB에서 캐릭터 정보 조회 중...']);
                    const result = await buildAnalysisResult(parsedMembers);

                    console.log('[usePartyScanner] Analysis complete:', result);
                    setLogs(prev => [...prev, `조회 완료: ${result.foundCount}/${result.recognizedCount}명 찾음`]);

                    // 서버 선택이 필요한 경우 상태 저장
                    if (result.pendingSelections && result.pendingSelections.length > 0) {
                        setPendingSelections(result.pendingSelections);
                        setLogs(prev => [...prev, `⚠️ ${result.pendingSelections!.length}명의 캐릭터가 서버 선택이 필요합니다`]);
                    } else {
                        setPendingSelections([]);
                    }

                    setAnalysisResult(result);
                    setIsScanning(false);
                    resolve(result);

                } catch (err) {
                    console.error('[usePartyScanner] Error during scan:', err);
                    setLogs(prev => [...prev, `오류 발생: ${err}`]);
                    setIsScanning(false);
                    reject(err);
                }
            };
            reader.readAsDataURL(file);
        });
    }, [scanBottomOnly]);

    // 서버 선택 처리 함수
    const selectServer = useCallback((slotIndex: number, selectedServer: string, characterData: PartyMember) => {
        if (!analysisResult) return;

        // 멤버 목록에서 해당 슬롯 업데이트
        const updatedMembers = analysisResult.members.map((member, idx) => {
            if (idx === slotIndex) {
                return {
                    ...characterData,
                    id: member.id,
                    server: selectedServer,
                    isMainCharacter: member.isMainCharacter
                };
            }
            return member;
        });

        // 해당 선택 제거
        const updatedPending = pendingSelections.filter(p => p.slotIndex !== slotIndex);

        // CP 재계산
        const totalCp = updatedMembers.reduce((acc, cur) => acc + cur.cp, 0);
        const avgCp = updatedMembers.length > 0 ? totalCp / updatedMembers.length : 0;

        // MVP 재결정
        const maxCp = Math.max(...updatedMembers.map(m => m.cp));
        updatedMembers.forEach(m => {
            m.isMvp = m.cp === maxCp && m.cp > 0;
        });

        // 등급 재계산
        let grade = '-';
        if (updatedMembers.length > 0) {
            if (avgCp >= 4500) grade = 'S';
            else if (avgCp >= 3500) grade = 'A';
            else if (avgCp >= 2500) grade = 'B';
            else grade = 'C';
        }

        const newResult: AnalysisResult = {
            ...analysisResult,
            totalCp,
            grade,
            members: updatedMembers,
            foundCount: updatedMembers.filter(m => m.isFromDb).length,
            pendingSelections: updatedPending.length > 0 ? updatedPending : undefined
        };

        setAnalysisResult(newResult);
        setPendingSelections(updatedPending);
        setLogs(prev => [...prev, `✅ ${characterData.name} → ${selectedServer} 선택됨`]);
    }, [analysisResult, pendingSelections]);

    return {
        isScanning,
        logs,
        scanImage,
        scanBottomOnly,
        setScanBottomOnly,
        croppedPreview, // OCR 대상 이미지 미리보기
        pendingSelections, // 서버 선택 대기 목록
        analysisResult, // 현재 분석 결과
        selectServer // 서버 선택 함수
    };
};
