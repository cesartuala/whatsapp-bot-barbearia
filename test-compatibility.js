// Teste com versão específica do Puppeteer
const { Client, NoAuth } = require("whatsapp-web.js");

console.log('🔍 Teste com Puppeteer DOWNGRADE');

const client = new Client({
    authStrategy: new NoAuth(),
    puppeteer: {
        headless: true, // Usar headless clássico
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--single-process',
            '--no-zygote',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--disable-extensions',
            '--disable-plugins',
            '--disable-default-apps',
            '--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ],
        executablePath: '/usr/bin/google-chrome-stable',
        timeout: 60000,
        ignoreDefaultArgs: ['--enable-automation', '--enable-blink-features=IdleDetection'],
        defaultViewport: null
    }
});

client.on('qr', (qr) => {
    console.log('✅ QR Code gerado! Puppeteer funcionando!');
    const qrcode = require('qrcode-terminal');
    qrcode.generate(qr, { small: true });
    setTimeout(() => process.exit(0), 10000);
});

client.on('ready', () => {
    console.log('✅ Conectado!');
    setTimeout(() => process.exit(0), 5000);
});

client.on('auth_failure', () => {
    console.log('❌ Auth failure (esperado)');
});

client.on('disconnected', () => {
    console.log('🔌 Desconectado');
});

async function testCompatibility() {
    try {
        console.log('🚀 Testando compatibilidade...');
        await client.initialize();
        
        setTimeout(() => {
            console.log('⏰ Timeout - teste concluído');
            process.exit(0);
        }, 45000);
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
        process.exit(1);
    }
}

testCompatibility();
