// Teste simplificado para diagnosticar problema
const { Client, LocalAuth } = require("whatsapp-web.js");

console.log('🔍 Teste de diagnóstico do WhatsApp Web.js');

// Configuração mínima para teste
const client = new Client({
    authStrategy: new LocalAuth({
        clientId: "test-bot",
        dataPath: "./test-session"
    }),
    puppeteer: {
        headless: "new", // Usar novo headless mode
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
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding'
        ],
        executablePath: '/usr/bin/google-chrome-stable',
        timeout: 90000,
        handleSIGINT: false,
        handleSIGTERM: false,
        handleSIGHUP: false
    }
});

client.on('qr', (qr) => {
    console.log('📱 QR Code gerado com sucesso!');
    console.log('Escaneie este QR code no WhatsApp:');
    const qrcode = require('qrcode-terminal');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ Cliente conectado com sucesso!');
    console.log('🎉 Bot funcionando perfeitamente!');
});

client.on('authenticated', () => {
    console.log('✅ Autenticação bem-sucedida!');
});

client.on('auth_failure', (session) => {
    console.log('❌ Falha na autenticação:', session);
});

client.on('disconnected', (reason) => {
    console.log('🔌 Cliente desconectado:', reason);
});

client.on('loading_screen', (percent, message) => {
    console.log(`⏳ Carregando: ${percent}% - ${message}`);
});

async function startTest() {
    try {
        console.log('🚀 Iniciando teste...');
        
        // Aguardar um pouco antes de inicializar
        console.log('⏳ Aguardando 3 segundos antes de inicializar...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        await client.initialize();
        
        // Manter o processo ativo por mais tempo
        console.log('⏳ Aguardando conexão por 60 segundos...');
        setTimeout(() => {
            console.log('⏰ Tempo limite atingido. Encerrando teste...');
            process.exit(0);
        }, 60000);
        
    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

startTest();
