const fs = require('fs');
const puppeteer = require('puppeteer');

async function generateM3U() {
    const apiUrl = 'https://api.dani-dev.co.za/v1/stream/tonton/live/tv9';
    
    try {
        console.log('Melancarkan pelayar web pelayan...');
        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        // Tetapkan User-Agent supaya menyamar sebagai Chrome sebenar
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');

        let finalStreamUrl = '';

        // Tangkap pautan rangkaian (network request) yang mengandungi m3u8
        page.on('request', interceptedRequest => {
            const url = interceptedRequest.url();
            if (url.includes('.m3u8') && !finalStreamUrl) {
                finalStreamUrl = url;
            }
        });

        console.log('Melayari API:', apiUrl);
        // Pergi ke API dan tunggu sehingga halaman selesai dimuatkan / di-redirect
        await page.goto(apiUrl, { waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});

        // Jika URL akhir masih belum ditangkap melalui request, ambil dari URL semasa pelayar
        if (!finalStreamUrl) {
            finalStreamUrl = page.url();
        }

        await browser.close();

        if (!finalStreamUrl || !finalStreamUrl.includes('.m3u8')) {
            throw new Error('Gagal menangkap pautan m3u8 melalui pelayar.');
        }

        console.log('Pautan m3u8 berjaya ditangkap:', finalStreamUrl);

        const m3uContent = 
`#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=3000000,RESOLUTION=1280x720
${finalStreamUrl}
`;

        fs.writeFileSync('tv9.m3u8', m3uContent, 'utf8');
        console.log('Fail tv9.m3u8 berjaya dikemas kini!');

    } catch (error) {
        console.error('Ralat semasa menjalankan pelayar:', error.message);
        process.exit(1);
    }
}

generateM3U();
            
