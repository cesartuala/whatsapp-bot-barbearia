#!/bin/bash
# Script para testar versões mais antigas do WhatsApp Web.js

echo "🔄 TESTANDO VERSÕES MAIS ANTIGAS"
echo "================================"

export DISPLAY=:99

echo ""
echo "1️⃣ TENTANDO WhatsApp Web.js v1.19.5..."
npm uninstall whatsapp-web.js
npm install whatsapp-web.js@1.19.5 --save

cat > test-v1195.js << 'EOF'
const { Client, NoAuth } = require("whatsapp-web.js");

console.log('🔍 TESTE COM v1.19.5');
console.log('====================');

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
        executablePath: '/usr/bin/chromium',
        timeout: 60000
    }
});

client.on('qr', (qr) => {
    console.log('✅ SUCESSO COM v1.19.5!');
    const qrcode = require('qrcode-terminal');
    qrcode.generate(qr, { small: true });
    console.log('🎉 Versão 1.19.5 funcionando!');
    setTimeout(() => process.exit(0), 10000);
});

client.on('ready', () => {
    console.log('✅ Conectado com v1.19.5!');
    setTimeout(() => process.exit(0), 5000);
});

client.on('auth_failure', () => {
    console.log('ℹ️ Auth failure (normal)');
});

client.on('disconnected', (reason) => {
    console.log('🔌 Desconectado:', reason);
});

console.log('🚀 Testando v1.19.5...');
client.initialize().catch(error => {
    console.error('❌ Erro com v1.19.5:', error.message);
    process.exit(1);
});

setTimeout(() => {
    console.log('⏰ Timeout v1.19.5');
    process.exit(1);
}, 30000);
EOF

echo "🚀 Testando v1.19.5..."
node test-v1195.js

if [ $? -eq 0 ]; then
    echo "✅ v1.19.5 FUNCIONOU!"
    echo "Mantendo esta versão..."
    exit 0
fi

echo ""
echo "2️⃣ TENTANDO WhatsApp Web.js v1.18.4..."
npm uninstall whatsapp-web.js
npm install whatsapp-web.js@1.18.4 --save

cat > test-v1184.js << 'EOF'
const { Client, NoAuth } = require("whatsapp-web.js");

console.log('🔍 TESTE COM v1.18.4');
console.log('====================');

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
        executablePath: '/usr/bin/chromium',
        timeout: 60000
    }
});

client.on('qr', (qr) => {
    console.log('✅ SUCESSO COM v1.18.4!');
    const qrcode = require('qrcode-terminal');
    qrcode.generate(qr, { small: true });
    console.log('🎉 Versão 1.18.4 funcionando!');
    setTimeout(() => process.exit(0), 10000);
});

client.on('ready', () => {
    console.log('✅ Conectado com v1.18.4!');
    setTimeout(() => process.exit(0), 5000);
});

client.on('auth_failure', () => {
    console.log('ℹ️ Auth failure (normal)');
});

client.on('disconnected', (reason) => {
    console.log('🔌 Desconectado:', reason);
});

console.log('🚀 Testando v1.18.4...');
client.initialize().catch(error => {
    console.error('❌ Erro com v1.18.4:', error.message);
    process.exit(1);
});

setTimeout(() => {
    console.log('⏰ Timeout v1.18.4');
    process.exit(1);
}, 30000);
EOF

echo "🚀 Testando v1.18.4..."
node test-v1184.js

if [ $? -eq 0 ]; then
    echo "✅ v1.18.4 FUNCIONOU!"
    echo "Mantendo esta versão..."
    exit 0
fi

echo ""
echo "3️⃣ TENTANDO sem executablePath (usar Chrome padrão)..."
npm uninstall whatsapp-web.js
npm install whatsapp-web.js@1.19.5 --save

cat > test-no-path.js << 'EOF'
const { Client, NoAuth } = require("whatsapp-web.js");

console.log('🔍 TESTE SEM executablePath');
console.log('============================');

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
        timeout: 60000
    }
});

client.on('qr', (qr) => {
    console.log('✅ SUCESSO SEM executablePath!');
    const qrcode = require('qrcode-terminal');
    qrcode.generate(qr, { small: true });
    console.log('🎉 Funcionando sem executablePath!');
    setTimeout(() => process.exit(0), 10000);
});

client.on('ready', () => {
    console.log('✅ Conectado!');
    setTimeout(() => process.exit(0), 5000);
});

client.on('auth_failure', () => {
    console.log('ℹ️ Auth failure (normal)');
});

client.on('disconnected', (reason) => {
    console.log('🔌 Desconectado:', reason);
});

console.log('🚀 Testando sem executablePath...');
client.initialize().catch(error => {
    console.error('❌ Erro sem executablePath:', error.message);
    process.exit(1);
});

setTimeout(() => {
    console.log('⏰ Timeout');
    process.exit(1);
}, 30000);
EOF

echo "🚀 Testando sem executablePath..."
node test-no-path.js

echo ""
echo "🔍 TESTE DE VERSÕES CONCLUÍDO"
echo "============================="
