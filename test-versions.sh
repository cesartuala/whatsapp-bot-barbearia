#!/bin/bash
# Script para testar com versão anterior do WhatsApp Web.js

echo "🔄 Testando com WhatsApp Web.js versão anterior"
echo "============================================="

# Configurar display
export DISPLAY=:99

# Limpar node_modules e reinstalar versão específica
echo "📦 Reinstalando WhatsApp Web.js versão estável..."

# Fazer backup do package.json
cp package.json package.json.backup

# Instalar versão específica que funciona
npm uninstall whatsapp-web.js
npm install whatsapp-web.js@1.19.5

# Criar teste com versão anterior
cat > test-version119.js << 'EOF'
const { Client, NoAuth } = require("whatsapp-web.js");

console.log('🔍 Teste com WhatsApp Web.js v1.19.5');

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
        executablePath: '/usr/bin/google-chrome-stable',
        timeout: 60000
    }
});

client.on('qr', (qr) => {
    console.log('✅ SUCESSO! QR Code gerado com v1.19.5!');
    console.log('🎉 Versão anterior funcionando!');
    
    const qrcode = require('qrcode-terminal');
    qrcode.generate(qr, { small: true });
    
    setTimeout(() => {
        console.log('✅ Teste bem-sucedido com versão anterior!');
        process.exit(0);
    }, 10000);
});

client.on('ready', () => {
    console.log('✅ Cliente conectado com v1.19.5!');
    setTimeout(() => process.exit(0), 5000);
});

client.on('auth_failure', () => {
    console.log('ℹ️ Auth failure (normal)');
});

client.on('disconnected', (reason) => {
    console.log('🔌 Desconectado:', reason);
});

async function testVersion119() {
    try {
        console.log('🔧 Testando com WhatsApp Web.js v1.19.5...');
        await client.initialize();
        
        setTimeout(() => {
            console.log('⏰ Timeout');
            process.exit(1);
        }, 60000);
        
    } catch (error) {
        console.error('❌ Erro com v1.19.5:', error.message);
        console.log('💡 Vamos tentar v1.18.4...');
        
        // Se v1.19.5 falhar, tentar v1.18.4
        setTimeout(() => {
            process.exit(1);
        }, 1000);
    }
}

testVersion119();
EOF

echo "🚀 Testando WhatsApp Web.js v1.19.5..."
node test-version119.js

# Se falhar, tentar versão ainda anterior
if [ $? -ne 0 ]; then
    echo "⚠️ v1.19.5 falhou, tentando v1.18.4..."
    npm uninstall whatsapp-web.js
    npm install whatsapp-web.js@1.18.4
    
    # Atualizar o teste para v1.18.4
    sed -i 's/v1.19.5/v1.18.4/g' test-version119.js
    
    echo "🚀 Testando WhatsApp Web.js v1.18.4..."
    node test-version119.js
fi

# Restaurar package.json se necessário
if [ -f package.json.backup ]; then
    echo "📋 Para restaurar versão original: cp package.json.backup package.json && npm install"
fi

echo "🎉 Teste de versões concluído!"
