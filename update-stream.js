const fs = require('fs');
const puppeteer = require('puppeteer');

// Fungsi pembantu untuk masa menunggu (delay)
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function generateM3U() {
    const apiUrl = 'https://api.dani-dev.co.za/v1/stream/tonton/live/tv9';
    const delays = [10000, 5000, 5000]; // Masa tunggu: 10 saat, kemudian 5 saat, kemudian 5 saat (3 kali percubaan)
    let finalStreamUrl = '';

    for (let i = 0; i < delays.length; i++) {
        const attempt = i + 1;
        console.log(`[Percubaan ${attempt}/3] Melancarkan pelayar web...`);

        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        try {
            const page = await browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');

            // Tangkap pautan rangkaian m3u8 atau tonton
            page.on('request', interceptedRequest => {
                const url = interceptedRequest.url();
                if ((url.includes('.m3u8') || url.includes('tonton.com.my')) && !finalStreamUrl) {
                    if (url.includes('master.m3u8') || url.includes('.m3u8')) {
                        finalStreamUrl = url;
                    }
                }
            });

            console.log(`Melayari API: ${apiUrl}`);
            await page.goto(apiUrl, { waitUntil: 'networkidle0', timeout: 30000 }).catch(() => {});

            // Tunggu seketika untuk redirect
            await sleep(3000);

            if (!finalStreamUrl) {
                finalStreamUrl = page.url();
            }

            await browser.close();

            // Semak sama ada pautan sah berjaya didapati
            if (finalStreamUrl && !finalStreamUrl.includes('dani-dev.co.za')) {
                console.log('Pautan berjaya didapati:', finalStreamUrl);
                break; // Keluar dari gelung jika berjaya
            } else {
                console.log(`[Percubaan ${attempt}] Pautan belum berjaya dikesan.`);
                finalStreamUrl = ''; // Reset semula
            }

        } catch (error) {
            console.error(`[Percubaan ${attempt}] Ralat berlaku:`, error.message);
            await browser.close();
        }

        // Jika ini bukan percubaan terakhir, tunggu ikut masa yang ditetapkan sebelum cuba lagi
        if (i < delays.length - 1) {
            const waitTime = delays[i] / 1000;
            console.log(`Menunggu selama ${waitTime} saat sebelum cuba semula...\n`);
            await sleep(delays[i]);
        }
    }

    // Jika selepas 3 kali masih gagal, hentikan proses
    if (!finalStreamUrl || finalStreamUrl.includes('dani-dev.co.za')) {
        console.error('Gagal mendapatkan pautan m3u8 selepas 3 kali percubaan. Proses dihentikan.');
        process.exit(1);
    }

    // Tulis ke dalam fail tv9.m3u8
    const m3uContent = 
`#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=3000000,RESOLUTION=1280x720
${finalStreamUrl}
`;

    fs.writeFileSync('tv9.m3u8', m3uContent, 'utf8');
    console.log('Fail tv9.m3u8 berjaya dikemas kini!');
}

generateM3U();
            
