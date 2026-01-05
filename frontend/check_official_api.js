const https = require('https');

// 공식 AION2 API 직접 호출
const url = 'https://aion2.plaync.com/api/character/info?lang=ko&characterId=A1pIWbd0UKoTYJ2XbL_Cw8P2paCGuL6EtLx38RtpZ3U=&serverId=1001';

const options = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://aion2.plaync.com/',
        'Accept': 'application/json'
    }
};

https.get(url, options, (res) => {
    let data = '';

    res.on('data', (chunk) => { data += chunk; });

    res.on('end', () => {
        try {
            const json = JSON.parse(data);

            console.log('\n=== OFFICIAL API RESPONSE STRUCTURE ===');
            console.log('Top level keys:', Object.keys(json));

            console.log('\n=== PROFILE KEYS ===');
            console.log(Object.keys(json.profile || {}));

            console.log('\n=== PROFILE (full) ===');
            console.log(JSON.stringify(json.profile, null, 2));

            console.log('\n=== STAT KEYS ===');
            console.log(Object.keys(json.stat || {}));

            console.log('\n=== STAT LIST SAMPLE ===');
            if (json.stat && json.stat.statList) {
                console.log(JSON.stringify(json.stat.statList.slice(0, 5), null, 2));
            }

        } catch (e) {
            console.error('Failed to parse JSON:', e.message);
            console.log('Response status:', res.statusCode);
            console.log('Raw response (first 500 chars):', data.substring(0, 500));
        }
    });
}).on('error', (err) => {
    console.error('Request failed:', err.message);
});
