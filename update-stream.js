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

        let finalStreamUrl = '';

        // Tangkap fail .m3u8 yang keluar dari trafik rangkaian (network request)
        page.on('request', interceptedRequest => {
            const url = interceptedRequest.url();
            if ((url.includes('.m3u8') || url.includes('tonton.com.my')) && !finalStreamUrl) {
                if (url.includes('master.m3u8') || url.includes('.m3u8')) {
                    finalStreamUrl = url;
                }
            }
        });

        console.log(`Melayari API: ${apiUrl}`);
        // Buka halaman dan tunggu sehingga trafik rangkaian stabil
        await page.goto(apiUrl, { waitUntil: 'networkidle2', timeout: 40000 }).catch(() => {});

        // Tambah masa tunggu 4 saat untuk pastikan skrip JS di dalam laman v2 selesai muat turun stream
        await new Promise(resolve => setTimeout(resolve, 4000));

        // Jika melalui request masih tak jumpa, cuba semak URL semasa pelayar
        if (!finalStreamUrl) {
            finalStreamUrl = page.url();
        }

        await browser.close();

        // Jika URL akhir masih di domain api.dani-dev, anggap gagal
        if (!finalStreamUrl || finalStreamUrl.includes('dani-dev.co.za')) {
            throw new Error('Gagal mengekstrak pautan m3u8 dari pautan v2.');
        }

        console.log('Pautan m3u8 berjaya dikesan:', finalStreamUrl);

        // Tulis ke dalam fail tv9.m3u8
        const m3uContent = 
`#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=3000000,RESOLUTION=1280x720
${finalStreamUrl}
`;

        fs.writeFileSync('tv9.m3u8', m3uContent, 'utf8');
        console.log('Fail tv9.m3u8 berjaya dikemas kini!');

    } catch (error) {
        console.error('Ralat berlaku:', error.message);
        await browser.close();
        process.exit(1);
    }
}

generateM3U();
        
