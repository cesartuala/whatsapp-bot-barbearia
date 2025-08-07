// Teste ultra-robusto para WhatsApp Web.js
const { Client, LocalAuth } = require("whatsapp-web.js");

console.log('🔍 Teste ROBUSTO do WhatsApp Web.js');

// Função para criar cliente com retry
async function createRobustClient() {
    const client = new Client({
        authStrategy: new LocalAuth({
            clientId: "robust-test-bot",
            dataPath: "./robust-session"
        }),
        puppeteer: {
            headless: "new",
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
                '--disable-renderer-backgrounding',
                '--disable-hang-monitor',
                '--disable-prompt-on-repost',
                '--disable-domain-reliability',
                '--disable-component-extensions-with-background-pages',
                '--no-first-run',
                '--no-default-browser-check',
                '--disable-translate',
                '--disable-ipc-flooding-protection'
            ],
            executablePath: '/usr/bin/google-chrome-stable',
            timeout: 120000,
            handleSIGINT: false,
            handleSIGTERM: false,
            handleSIGHUP: false,
            protocolTimeout: 180000
        }
    });

    // Event handlers
    client.on('qr', (qr) => {
        console.log('📱 QR Code gerado!');
        const qrcode = require('qrcode-terminal');
        qrcode.generate(qr, { small: true });
    });

    client.on('ready', () => {
        console.log('✅ Cliente conectado com sucesso!');
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

    return client;
}

// Função principal com retry robusto
async function startRobustTest() {
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        console.log(`\n🚀 Tentativa ${attempt}/${maxRetries}`);
        
        let client = null;
        try {
            // Aguardar antes de cada tentativa
            console.log('⏳ Aguardando 5 segundos...');
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Limpar processos Chrome antigos
            console.log('🧹 Limpando processos antigos...');
            try {
                require('child_process').execSync('pkill -f chrome || true', { stdio: 'ignore' });
                await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (e) {
                // Ignorar erro de limpeza
            }
            
            console.log('📱 Criando cliente...');
            client = await createRobustClient();
            
            console.log('🔧 Inicializando cliente...');
            await client.initialize();
            
            console.log('✅ Sucesso! Aguardando por 2 minutos...');
            
            // Manter vivo por 2 minutos
            setTimeout(() => {
                console.log('⏰ Teste concluído com sucesso!');
                process.exit(0);
            }, 120000);
            
            // Se chegou aqui, saiu do loop
            break;
            
        } catch (error) {
            console.error(`❌ Tentativa ${attempt} falhou:`, error.message);
            
            // Tentar limpar recursos
            if (client) {
                try {
                    await client.destroy();
                } catch (cleanupError) {
                    console.log('⚠️ Erro na limpeza:', cleanupError.message);
                }
            }
            
            // Se é a última tentativa, falhar
            if (attempt === maxRetries) {
                console.error('💥 Todas as tentativas falharam!');
                console.error('Stack do último erro:', error.stack);
                process.exit(1);
            }
            
            // Aguardar antes da próxima tentativa
            console.log(`⏳ Aguardando 10 segundos antes da próxima tentativa...`);
            await new Promise(resolve => setTimeout(resolve, 10000));
        }
    }
}

// Executar teste
startRobustTest();

// Capturar sinais para limpeza
process.on('SIGINT', () => {
    console.log('\n🛑 Teste interrompido pelo usuário');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Teste terminado');
    process.exit(0);
});
