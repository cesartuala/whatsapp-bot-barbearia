// Teste extremamente básico com user agent antigo
const { Client, NoAuth } = require("whatsapp-web.js");

console.log('🔍 Teste BÁSICO com User Agent Chrome 120');

// Função para testar conexão básica
async function testBasicConnection() {
    console.log('🚀 Iniciando teste básico...');
    
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
                '--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                '--window-size=1366,768',
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
                '--disable-prompt-on-repost'
            ],
            executablePath: '/usr/bin/google-chrome-stable',
            timeout: 45000,
            ignoreDefaultArgs: [
                '--enable-automation',
                '--enable-blink-features=IdleDetection'
            ],
            defaultViewport: null
        }
    });

    // Configurar eventos
    client.on('qr', (qr) => {
        console.log('✅ SUCESSO! QR Code gerado!');
        console.log('🎉 WhatsApp Web.js está funcionando!');
        
        // Mostrar QR
        const qrcode = require('qrcode-terminal');
        qrcode.generate(qr, { small: true });
        
        // Sucesso - sair
        setTimeout(() => {
            console.log('✅ Teste bem-sucedido! Bot funcionando!');
            process.exit(0);
        }, 5000);
    });

    client.on('ready', () => {
        console.log('✅ Cliente totalmente conectado!');
        setTimeout(() => process.exit(0), 3000);
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

    // Tentar inicializar
    try {
        console.log('🔧 Inicializando cliente...');
        await client.initialize();
        
        // Timeout de segurança
        setTimeout(() => {
            console.log('⏰ Timeout de 60 segundos atingido');
            console.log('❌ Cliente não conseguiu se conectar');
            process.exit(1);
        }, 60000);
        
    } catch (error) {
        console.error('❌ Erro na inicialização:', error.message);
        console.error('📋 Stack trace:', error.stack);
        
        // Verificar se é erro específico de protocolo
        if (error.message.includes('Target closed') || error.message.includes('Session closed')) {
            console.log('\n🔍 DIAGNÓSTICO:');
            console.log('❌ Erro de protocolo detectado!');
            console.log('💡 Solução: Instalar Chrome compatível');
            console.log('📝 Execute: ./install-chrome-compatible.sh');
        }
        
        process.exit(1);
    }
}

// Executar teste
testBasicConnection();

// Capturar interrupções
process.on('SIGINT', () => {
    console.log('\n🛑 Teste interrompido');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Teste terminado');
    process.exit(0);
});
