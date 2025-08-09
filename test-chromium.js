// Teste usando Chromium ao invés de Chrome
const { Client, NoAuth } = require("whatsapp-web.js");

console.log('🔍 Teste com CHROMIUM');

async function installChromium() {
    try {
        console.log('📦 Verificando Chromium...');
        const { execSync } = require('child_process');
        
        // Verificar se chromium existe
        try {
            execSync('which chromium-browser', { stdio: 'pipe' });
            console.log('✅ Chromium já instalado');
        } catch {
            console.log('📦 Instalando Chromium...');
            execSync('sudo apt update && sudo apt install -y chromium-browser', { stdio: 'inherit' });
        }
        
        return '/usr/bin/chromium-browser';
    } catch (error) {
        console.log('⚠️ Falha ao instalar Chromium, usando Chrome');
        return '/usr/bin/google-chrome-stable';
    }
}

async function testWithChromium() {
    const executablePath = await installChromium();
    console.log('🚀 Usando browser:', executablePath);
    
    const client = new Client({
        authStrategy: new NoAuth(),
        puppeteer: {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--single-process',
                '--no-zygote'
            ],
            executablePath: executablePath,
            timeout: 60000
        }
    });

    client.on('qr', (qr) => {
        console.log('✅ QR gerado com Chromium!');
        const qrcode = require('qrcode-terminal');
        qrcode.generate(qr, { small: true });
        setTimeout(() => process.exit(0), 10000);
    });

    client.on('ready', () => {
        console.log('✅ Conectado com Chromium!');
        setTimeout(() => process.exit(0), 5000);
    });

    try {
        await client.initialize();
        setTimeout(() => process.exit(0), 45000);
    } catch (error) {
        console.error('❌ Erro com Chromium:', error.message);
        process.exit(1);
    }
}

testWithChromium();
