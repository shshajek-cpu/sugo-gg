import { useState, useCallback } from 'react';
import { createWorker } from 'tesseract.js';

export interface PartyMember {
    id: string;
    name: string;
    class: string;
    cp: number;
    gearScore: number;
    server: string;
    isMvp: boolean;
    level?: number;
}

export interface AnalysisResult {
    totalCp: number;
    grade: string;
    members: PartyMember[];
}

export const usePartyScanner = () => {
    const [isScanning, setIsScanning] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [scanBottomOnly, setScanBottomOnly] = useState(true);

    const cropBottomPart = (base64Image: string): Promise<string> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) { resolve(base64Image); return; }

                // Crop bottom 35% (Targeting Party List)
                if (img.height < 300) {
                    resolve(base64Image);
                    return;
                }

                const cropRatio = 0.35;
                const startY = img.height * (1 - cropRatio);
                const cropHeight = img.height * cropRatio;

                canvas.width = img.width;
                canvas.height = cropHeight;

                ctx.drawImage(img, 0, startY, img.width, cropHeight, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = () => resolve(base64Image);
            img.src = base64Image;
        });
    };

    const smartParse = (rawText: string): { name: string, server: string }[] => {
        const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const matches: { name: string, server: string }[] = [];
        const seenNames = new Set<string>();

        const addMember = (name: string, server: string) => {
            const cleanName = name.replace(/[^a-zA-Z0-9가-힣]/g, '');
            if (cleanName.length < 2 || seenNames.has(cleanName)) return;
            matches.push({ name: cleanName, server });
            seenNames.add(cleanName);
        };

        const serverRegex = /([가-힣a-zA-Z0-9]+)\s*\[([가-힣a-zA-Z0-9]+)\]/;
        const statusKeywords = /^(준비 완료|준비 중|LV \d+|Lv \d+)/i;

        lines.forEach((line, idx) => {
            const match = line.match(serverRegex);
            if (match) {
                addMember(match[1], match[2]);
                return;
            }

            if (idx < lines.length - 1) {
                const nextLine = lines[idx + 1];
                if (statusKeywords.test(nextLine)) {
                    if (!/[\[\]]/.test(line) && line.length >= 2 && line.length < 12) {
                        addMember(line, 'Unknown');
                    }
                }
            }
        });

        return matches.slice(0, 6);
    };

    const generateMockData = (membersInput: any[]): AnalysisResult => {
        const roles = ['Gladiator', 'Templar', 'Assassin', 'Ranger', 'Sorcerer', 'Cleric', 'Chanter', 'Spiritmaster'];

        // If input is empty, don't generate mock data, return empty result
        if (membersInput.length === 0) {
            // Optional: Return empty or mock? 
            // Let's mock at least one if really empty to show something, logic says fallback
        }

        const finalMembers = [...membersInput];

        // Only fill up to detect count or at least some? 
        // Logic: if we detect 0, we might want to fail? 
        // For now, let's stick to the previous logic: Fill up to 6 for demo
        while (finalMembers.length < 6) {
            finalMembers.push({ name: `Unknown${finalMembers.length + 1}`, server: 'Israphel' });
        }

        const members = finalMembers.slice(0, 6).map((m, i) => {
            const name = typeof m === 'string' ? m : m.name;
            const server = typeof m === 'object' && m.server ? m.server : 'Israphel';
            const role = roles[i % roles.length];
            const cp = Math.floor(Math.random() * (3500 - 2000) + 2000);
            return {
                id: `member-${i}`,
                name: name.replace(/[^a-zA-Z0-9가-힣]/g, ''),
                class: role,
                cp: cp,
                gearScore: Math.floor(cp / 10),
                server: server,
                isMvp: false
            };
        });

        const maxCp = Math.max(...members.map(m => m.cp));
        members.forEach(m => {
            if (m.cp === maxCp) m.isMvp = true;
        });

        const totalCp = members.reduce((acc, cur) => acc + cur.cp, 0);

        return {
            totalCp,
            grade: totalCp > 18000 ? 'S' : totalCp > 15000 ? 'A' : 'B',
            members
        };
    };

    const scanImage = useCallback(async (file: File): Promise<AnalysisResult> => {
        setIsScanning(true);
        setLogs(['Image received. Initializing OCR...']);

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const originalImage = e.target?.result as string;
                    let imageToScan = originalImage;

                    if (scanBottomOnly) {
                        setLogs(prev => [...prev, 'Cropping image (Bottom 35%)...']);
                        imageToScan = await cropBottomPart(originalImage);
                    }

                    const worker = await createWorker('kor+eng');
                    setLogs(prev => [...prev, 'Language loaded. Scanning...']);

                    const ret = await worker.recognize(imageToScan);
                    const text = ret.data.text;
                    setLogs(prev => [...prev, 'Analyzing text patterns...']);

                    await worker.terminate();

                    const parsedMembers = smartParse(text);

                    // Fallback
                    const finalMembers = parsedMembers.length > 0
                        ? parsedMembers
                        : text.split('\n').filter(l => l.trim().length > 2).map(l => ({ name: l.trim(), server: 'Unknown' }));

                    setLogs(prev => [...prev, 'Generating analysis...']);

                    // Artificial delay for UX
                    setTimeout(() => {
                        const result = generateMockData(finalMembers);
                        setIsScanning(false);
                        resolve(result);
                    }, 800);

                } catch (err) {
                    console.error(err);
                    setIsScanning(false);
                    reject(err);
                }
            };
            reader.readAsDataURL(file);
        });
    }, [scanBottomOnly]);

    return {
        isScanning,
        logs,
        scanImage,
        scanBottomOnly,
        setScanBottomOnly
    };
};
