// Teste com configuração compatível para Chrome 139
const { Client, NoAuth } = require("whatsapp-web.js");

console.log('🔍 TESTE COMPATIBILIDADE CHROME 139');
console.log('====================================');

const client = new Client({
    authStrategy: new NoAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-software-rasterizer',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-features=TranslateUI',
            '--disable-web-security',
            '--no-first-run',
            '--no-default-browser-check'
        ],
        timeout: 60000
    }
});

client.on('qr', (qr) => {
    console.log('✅ QR GERADO COM SUCESSO!');
    const qrcode = require('qrcode-terminal');
    qrcode.generate(qr, { small: true });
    console.log('🎯 Configuração funcionando!');
    setTimeout(() => process.exit(0), 10000);
});

client.on('ready', () => {
    console.log('✅ BOT CONECTADO!');
    setTimeout(() => process.exit(0), 5000);
});

client.on('auth_failure', () => {
    console.log('❌ Falha na autenticação');
    process.exit(1);
});

client.on('disconnected', () => {
    console.log('❌ Bot desconectado');
    process.exit(1);
});

console.log('🚀 Iniciando teste sem executablePath...');
client.initialize().catch(error => {
    console.error('❌ Erro ao inicializar:', error.message);
    process.exit(1);
});

// Timeout de segurança
setTimeout(() => {
    console.log('⏰ Timeout atingido');
    process.exit(1);
}, 45000);
