#!/bin/bash
# Script para tentar solução com Chromium mais antigo ou configuração especial

echo "🔧 SOLUÇÃO ALTERNATIVA - CHROMIUM COMPATÍVEL"
echo "============================================"

export DISPLAY=:99

echo ""
echo "1️⃣ VERIFICANDO VERSÃO ATUAL DO CHROMIUM..."
chromium --version

echo ""
echo "2️⃣ TENTANDO CONFIGURAÇÃO MAIS RESTRITIVA..."
cat > test-ultra-simple.js << 'EOF'
const { Client, NoAuth } = require("whatsapp-web.js");

console.log('🔍 TESTE ULTRA SIMPLIFICADO');
console.log('===========================');

const client = new Client({
    authStrategy: new NoAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ],
        executablePath: '/usr/bin/chromium',
        timeout: 120000
    }
});

client.on('qr', (qr) => {
    console.log('✅ QR GERADO COM CONFIGURAÇÃO MÍNIMA!');
    const qrcode = require('qrcode-terminal');
    qrcode.generate(qr, { small: true });
    console.log('🎉 FUNCIONANDO!');
    setTimeout(() => process.exit(0), 15000);
});

client.on('ready', () => {
    console.log('✅ CONECTADO!');
    setTimeout(() => process.exit(0), 5000);
});

client.on('auth_failure', () => {
    console.log('ℹ️ Auth failure');
});

client.on('disconnected', (reason) => {
    console.log('🔌 Desconectado:', reason);
});

console.log('🚀 Iniciando teste ultra simplificado...');
client.initialize().catch(error => {
    console.error('❌ Erro:', error.message);
    process.exit(1);
});

setTimeout(() => {
    console.log('⏰ Timeout');
    process.exit(1);
}, 60000);
EOF

echo "🚀 Testando configuração mínima..."
node test-ultra-simple.js

if [ $? -eq 0 ]; then
    echo "✅ CONFIGURAÇÃO MÍNIMA FUNCIONOU!"
    exit 0
fi

echo ""
echo "3️⃣ TENTANDO COM GOOGLE CHROME ESTÁVEL..."
echo "Removendo Chromium e instalando Google Chrome..."

# Remover Chromium
sudo apt remove -y chromium chromium-common chromium-sandbox

# Instalar Google Chrome Estável
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list
sudo apt update
sudo apt install -y google-chrome-stable

echo "✅ Google Chrome instalado: $(google-chrome --version)"

cat > test-chrome-stable.js << 'EOF'
const { Client, NoAuth } = require("whatsapp-web.js");

console.log('🔍 TESTE COM GOOGLE CHROME ESTÁVEL');
console.log('==================================');

const client = new Client({
    authStrategy: new NoAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ],
        executablePath: '/usr/bin/google-chrome-stable',
        timeout: 60000
    }
});

client.on('qr', (qr) => {
    console.log('✅ QR GERADO COM CHROME ESTÁVEL!');
    const qrcode = require('qrcode-terminal');
    qrcode.generate(qr, { small: true });
    console.log('🎉 CHROME ESTÁVEL FUNCIONANDO!');
    setTimeout(() => process.exit(0), 15000);
});

client.on('ready', () => {
    console.log('✅ CONECTADO COM CHROME!');
    setTimeout(() => process.exit(0), 5000);
});

client.on('auth_failure', () => {
    console.log('ℹ️ Auth failure');
});

client.on('disconnected', (reason) => {
    console.log('🔌 Desconectado:', reason);
});

console.log('🚀 Testando Chrome estável...');
client.initialize().catch(error => {
    console.error('❌ Erro com Chrome:', error.message);
    process.exit(1);
});

setTimeout(() => {
    console.log('⏰ Timeout Chrome');
    process.exit(1);
}, 60000);
EOF

echo "🚀 Testando Google Chrome estável..."
node test-chrome-stable.js

if [ $? -eq 0 ]; then
    echo "✅ GOOGLE CHROME FUNCIONOU!"
    exit 0
fi

echo ""
echo "4️⃣ TENTANDO WHATSAPP-WEB.JS VERSÃO MUITO ANTIGA..."
npm uninstall whatsapp-web.js
npm install whatsapp-web.js@1.15.3 --save

cat > test-v1153.js << 'EOF'
const { Client, NoAuth } = require("whatsapp-web.js");

console.log('🔍 TESTE COM v1.15.3 (MUITO ANTIGA)');
console.log('===================================');

const client = new Client({
    authStrategy: new NoAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage'
        ],
        executablePath: '/usr/bin/google-chrome-stable',
        timeout: 60000
    }
});

client.on('qr', (qr) => {
    console.log('✅ QR GERADO COM v1.15.3!');
    const qrcode = require('qrcode-terminal');
    qrcode.generate(qr, { small: true });
    console.log('🎉 v1.15.3 FUNCIONANDO!');
    setTimeout(() => process.exit(0), 15000);
});

client.on('ready', () => {
    console.log('✅ CONECTADO COM v1.15.3!');
    setTimeout(() => process.exit(0), 5000);
});

client.on('auth_failure', () => {
    console.log('ℹ️ Auth failure');
});

client.on('disconnected', (reason) => {
    console.log('🔌 Desconectado:', reason);
});

console.log('🚀 Testando v1.15.3...');
client.initialize().catch(error => {
    console.error('❌ Erro com v1.15.3:', error.message);
    process.exit(1);
});

setTimeout(() => {
    console.log('⏰ Timeout v1.15.3');
    process.exit(1);
}, 60000);
EOF

echo "🚀 Testando WhatsApp Web.js v1.15.3..."
node test-v1153.js

echo ""
echo "🔍 TESTES ALTERNATIVOS CONCLUÍDOS"
echo "================================="
