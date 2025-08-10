// Teste específico para Google Cloud usando Chromium
const { Client, NoAuth } = require("whatsapp-web.js");

console.log('🔍 TESTE CHROMIUM NO GOOGLE CLOUD');
console.log('=================================');

const client = new Client({
    authStrategy: new NoAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage'
        ],
        executablePath: process.platform === 'win32' ? 
            'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' : 
            '/usr/bin/chromium-browser',
        timeout: 60000
    }
});

client.on('qr', (qr) => {
    console.log('✅ QR GERADO COM SUCESSO!');
    const qrcode = require('qrcode-terminal');
    qrcode.generate(qr, { small: true });
    console.log('🎯 Configuração funcionando perfeitamente!');
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

console.log('🚀 Iniciando teste...');
client.initialize().catch(error => {
    console.error('❌ Erro ao inicializar:', error.message);
    process.exit(1);
});

// Timeout de segurança
setTimeout(() => {
    console.log('⏰ Timeout atingido');
    process.exit(1);
}, 45000);
