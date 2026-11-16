const fs = require('fs');
const axios = require('axios');

async function generateM3U() {
    const apiUrl = 'https://api.dani-dev.co.za/v1/stream/tonton/live/tv9';
    
    try {
        console.log('Mengambil pautan dari API...');
        
        // Meminta data dari API (jika API memberikan respons JSON atau redirect URL)
        const response = await axios.get(apiUrl, {
            maxRedirects: 5, // Mengikut lencongan URL secara automatik jika ada
            validateStatus: function (status) {
                return status >= 200 && status < 403; // Terima status berjaya
            }
        });

        // Dapatkan URL akhir selepas redirect (biasanya pautan master.m3u8 sebenar)
        const finalStreamUrl = response.request.res.responseUrl || response.data.url;

        if (!finalStreamUrl) {
            throw new Error('Gagal mendapatkan pautan m3u8 dari respons API.');
        }

        console.log('Pautan berjaya didapati:', finalStreamUrl);

        // Membina kandungan fail M3U mengikut format yang anda mahukan
        const m3uContent = 
`#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=3000000,RESOLUTION=1280x720
${finalStreamUrl}
`;

        // Simpan ke dalam fail tv9.m3u8
        fs.writeFileSync('tv9.m3u8', m3uContent, 'utf8');
        console.log('Fail tv9.m3u8 berjaya dikemas kini!');

    } catch (error) {
        console.error('Ralat semasa mengemas kini strim:', error.message);
        process.exit(1);
    }
}

generateM3U();
                  
