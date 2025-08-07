// Teste minimal com controle de processo manual
const { Client, NoAuth } = require("whatsapp-web.js");

console.log('🔍 Teste MINIMAL do WhatsApp Web.js');

// Função para limpar processos
function killChromeProcesses() {
    try {
        require('child_process').execSync('pkill -f chrome', { stdio: 'ignore' });
        console.log('🧹 Processos Chrome limpos');
    } catch (e) {
        console.log('ℹ️ Nenhum processo Chrome para limpar');
    }
}

// Configuração ultra-minimal
const client = new Client({
    authStrategy: new NoAuth(), // Sem persistência de sessão
    puppeteer: {
        headless: "new",
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--single-process',
            '--no-zygote'
        ],
        executablePath: '/usr/bin/google-chrome-stable',
        timeout: 60000
    }
});

let initialized = false;

client.on('qr', (qr) => {
    console.log('📱 QR Code gerado! Cliente inicializado com sucesso!');
    initialized = true;
    
    const qrcode = require('qrcode-terminal');
    qrcode.generate(qr, { small: true });
    
    // Sucesso! Podemos parar aqui
    setTimeout(() => {
        console.log('✅ SUCESSO! WhatsApp Web.js está funcionando!');
        process.exit(0);
    }, 5000);
});

client.on('ready', () => {
    console.log('✅ Cliente totalmente conectado!');
    initialized = true;
    setTimeout(() => process.exit(0), 5000);
});

client.on('auth_failure', () => {
    console.log('❌ Falha na autenticação (esperado com NoAuth)');
});

client.on('disconnected', (reason) => {
    console.log('🔌 Desconectado:', reason);
});

async function startMinimalTest() {
    try {
        console.log('🧹 Limpando processos antigos...');
        killChromeProcesses();
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('🚀 Iniciando cliente...');
        await client.initialize();
        
        // Aguardar 30 segundos para QR aparecer
        setTimeout(() => {
            if (!initialized) {
                console.log('⏰ Timeout - Cliente não inicializou em 30 segundos');
                process.exit(1);
            }
        }, 30000);
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

startMinimalTest();
