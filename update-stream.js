const fs = require('fs');
const axios = require('axios');

async function generateM3U() {
    const apiUrl = 'https://api.dani-dev.co.za/v1/stream/tonton/live/tv9';
    
    try {
        console.log('Mengambil pautan dari API...');
        
        // Tambah headers supaya pelayan API menganggap ini dari pelayar web Chrome
        const response = await axios.get(apiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*'
            },
            maxRedirects: 5,
            validateStatus: function (status) {
                return status >= 200 && status < 403;
            }
        });

        // Dapatkan URL akhir selepas redirect atau dari data JSON
        const finalStreamUrl = response.request.res.responseUrl || response.data.url || response.data;

        if (!finalStreamUrl || typeof finalStreamUrl !== 'string' || !finalStreamUrl.startsWith('http')) {
            throw new Error('Gagal mendapatkan pautan m3u8 yang sah daripada respons API.');
        }

        console.log('Pautan berjaya didapati:', finalStreamUrl);

        const m3uContent = 
`#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=3000000,RESOLUTION=1280x720
${finalStreamUrl}
`;

        fs.writeFileSync('tv9.m3u8', m3uContent, 'utf8');
        console.log('Fail tv9.m3u8 berjaya dikemas kini!');

    } catch (error) {
        console.error('Ralat semasa mengemas kini strim:', error.message);
        process.exit(1);
    }
}

generateM3U();
            
