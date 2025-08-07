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
            '--disable-features=VizDisplayCompositor'
        ],
        executablePath: '/usr/bin/google-chrome-stable',
        timeout: 60000
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

client.on('auth_failure', (session) => {
    console.log('❌ Falha na autenticação:', session);
});

client.on('disconnected', (reason) => {
    console.log('🔌 Cliente desconectado:', reason);
});

async function startTest() {
    try {
        console.log('🚀 Iniciando teste...');
        await client.initialize();
    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
        process.exit(1);
    }
}

startTest();
