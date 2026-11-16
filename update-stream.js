const fs = require('fs');
const puppeteer = require('puppeteer');

async function generateM3U() {
    const apiUrl = 'https://api.dani-dev.co.za/v1/stream/tonton/live/tv9';
    
    console.log('Melancarkan pelayar web...');
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');

        console.log(`Melayari API: ${apiUrl}`);
        // Buka halaman dan tunggu redirect berlaku sepenuhnya
        await page.goto(apiUrl, { waitUntil: 'networkidle2', timeout: 30000 });

        // Dapatkan URL akhir selepas pelayar berjaya buat redirect (sama macam kat phone anda!)
        const finalStreamUrl = page.url();
        console.log('URL akhir yang berjaya dikesan:', finalStreamUrl);

        await browser.close();

        // Pastikan URL bukan lagi link API mentah
        if (!finalStreamUrl || finalStreamUrl.includes('dani-dev.co.za')) {
            throw new Error('Gagal mendapatkan URL lencongan (redirect) yang sah.');
        }

        // Tulis ke dalam fail tv9.m3u8
        const m3uContent = 
`#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=3000000,RESOLUTION=1280x720
${finalStreamUrl}
`;

        fs.writeFileSync('tv9.m3u8', m3uContent, 'utf8');
        console.log('Fail tv9.m3u8 berjaya dikemas kini dengan pautan segar!');

    } catch (error) {
        console.error('Ralat berlaku:', error.message);
        await browser.close();
        process.exit(1);
    }
}

generateM3U();
               
