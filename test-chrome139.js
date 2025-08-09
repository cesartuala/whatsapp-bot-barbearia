// Teste especial para Chrome 139 - bypassa limitações do Puppeteer
const { Client, NoAuth } = require("whatsapp-web.js");

console.log('🔍 Teste ESPECIAL para Chrome 139');

async function testWithWorkarounds() {
    console.log('🚀 Iniciando com workarounds para Chrome 139...');
    
    // Configurações extremas para Chrome 139
    const client = new Client({
        authStrategy: new NoAuth(),
        puppeteer: {
            headless: false, // Tentar não-headless primeiro
            devtools: false,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
                '--single-process',
                '--no-zygote',
                '--disable-extensions',
                '--disable-plugins',
                '--disable-default-apps',
                '--no-first-run',
                '--no-default-browser-check',
                '--disable-translate',
                '--disable-sync',
                '--disable-background-networking',
                '--disable-background-timer-throttling',
                '--disable-client-side-phishing-detection',
                '--disable-component-update',
                '--disable-hang-monitor',
                '--disable-prompt-on-repost',
                '--disable-domain-reliability',
                '--disable-component-extensions-with-background-pages',
                '--disable-ipc-flooding-protection',
                '--remote-debugging-port=0', // Porta dinâmica
                '--user-data-dir=/tmp/chrome-test-' + Date.now(),
                '--window-size=1366,768',
                '--start-maximized'
            ],
            executablePath: '/usr/bin/google-chrome-stable',
            timeout: 30000,
            ignoreDefaultArgs: [
                '--enable-automation',
                '--enable-blink-features=IdleDetection',
                '--disable-component-extensions-with-background-pages'
            ],
            ignoreHTTPSErrors: true,
            defaultViewport: null
        }
    });

    // Event handlers
    client.on('qr', (qr) => {
        console.log('✅ EUREKA! QR Code gerado com Chrome 139!');
        console.log('🎉 WhatsApp Web.js funcionando!');
        
        const qrcode = require('qrcode-terminal');
        qrcode.generate(qr, { small: true });
        
        setTimeout(() => {
            console.log('✅ Teste bem-sucedido!');
            process.exit(0);
        }, 10000);
    });

    client.on('ready', () => {
        console.log('✅ Cliente conectado!');
        setTimeout(() => process.exit(0), 5000);
    });

    client.on('auth_failure', () => {
        console.log('ℹ️ Auth failure (normal com NoAuth)');
    });

    client.on('disconnected', (reason) => {
        console.log('🔌 Desconectado:', reason);
    });

    client.on('loading_screen', (percent, message) => {
        console.log(`⏳ Carregando: ${percent}% - ${message}`);
    });

    try {
        console.log('🔧 Tentando inicializar com workarounds...');
        await client.initialize();
        
        // Timeout
        setTimeout(() => {
            console.log('⏰ Timeout atingido');
            process.exit(1);
        }, 60000);
        
    } catch (error) {
        console.error('❌ Falha com workarounds:', error.message);
        
        // Se falhar, tentar headless
        console.log('\n🔄 Tentando modo headless...');
        await tryHeadlessMode();
    }
}

async function tryHeadlessMode() {
    const clientHeadless = new Client({
        authStrategy: new NoAuth(),
        puppeteer: {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--single-process',
                '--no-zygote',
                '--remote-debugging-port=0',
                '--user-data-dir=/tmp/chrome-headless-' + Date.now()
            ],
            executablePath: '/usr/bin/google-chrome-stable',
            timeout: 30000,
            defaultViewport: { width: 1366, height: 768 }
        }
    });

    clientHeadless.on('qr', (qr) => {
        console.log('✅ QR gerado em modo headless!');
        const qrcode = require('qrcode-terminal');
        qrcode.generate(qr, { small: true });
        setTimeout(() => process.exit(0), 10000);
    });

    clientHeadless.on('ready', () => {
        console.log('✅ Conectado em headless!');
        setTimeout(() => process.exit(0), 5000);
    });

    try {
        await clientHeadless.initialize();
        setTimeout(() => process.exit(1), 45000);
    } catch (error) {
        console.error('❌ Falha total:', error.message);
        console.log('\n💡 SOLUÇÃO FINAL: Instale Chrome mais antigo');
        console.log('📝 Execute: ./downgrade-chrome.sh');
        process.exit(1);
    }
}

// Executar
testWithWorkarounds();

process.on('SIGINT', () => {
    console.log('\n🛑 Interrompido');
    process.exit(0);
});
