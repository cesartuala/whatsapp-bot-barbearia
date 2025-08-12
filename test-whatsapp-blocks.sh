#!/bin/bash
# Teste para verificar se é bloqueio do WhatsApp

echo "🕵️ TESTANDO POSSÍVEIS BLOQUEIOS DO WHATSAPP"
echo "==========================================="

export DISPLAY=:99

echo ""
echo "1️⃣ TESTE COM USER AGENT REAL..."
cat > test-user-agent.js << 'EOF'
const { Client, NoAuth } = require("whatsapp-web.js");

console.log('🔍 TESTE COM USER AGENT REAL');
console.log('============================');

const client = new Client({
    authStrategy: new NoAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'
        ],
        executablePath: '/usr/bin/chromium',
        timeout: 120000
    }
});

client.on('qr', (qr) => {
    console.log('✅ QR GERADO COM USER AGENT!');
    const qrcode = require('qrcode-terminal');
    qrcode.generate(qr, { small: true });
    console.log('🎉 USER AGENT FUNCIONOU!');
    setTimeout(() => process.exit(0), 15000);
});

client.on('ready', () => {
    console.log('✅ CONECTADO!');
    setTimeout(() => process.exit(0), 5000);
});

client.on('auth_failure', (msg) => {
    console.log('❌ Auth failure:', msg);
});

client.on('disconnected', (reason) => {
    console.log('❌ Desconectado:', reason);
});

console.log('🚀 Testando com User Agent...');
client.initialize().catch(error => {
    console.error('❌ Erro:', error.message);
    if (error.message.includes('net::ERR_INTERNET_DISCONNECTED') || 
        error.message.includes('net::ERR_NETWORK_CHANGED') ||
        error.message.includes('ERR_BLOCKED_BY_CLIENT')) {
        console.log('🚫 POSSÍVEL BLOQUEIO DE REDE/WHATSAPP!');
    }
    process.exit(1);
});

setTimeout(() => {
    console.log('⏰ Timeout');
    process.exit(1);
}, 60000);
EOF

echo "🚀 Testando com User Agent real..."
node test-user-agent.js

if [ $? -eq 0 ]; then
    echo "✅ USER AGENT FUNCIONOU!"
    exit 0
fi

echo ""
echo "2️⃣ TESTE COM MODO NÃO-HEADLESS (VISUAL)..."
cat > test-visual.js << 'EOF'
const { Client, NoAuth } = require("whatsapp-web.js");

console.log('🔍 TESTE VISUAL (NÃO-HEADLESS)');
console.log('==============================');

const client = new Client({
    authStrategy: new NoAuth(),
    puppeteer: {
        headless: false, // MODO VISUAL
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--display=:99'
        ],
        executablePath: '/usr/bin/chromium',
        timeout: 120000
    }
});

client.on('qr', (qr) => {
    console.log('✅ QR GERADO EM MODO VISUAL!');
    const qrcode = require('qrcode-terminal');
    qrcode.generate(qr, { small: true });
    console.log('🎉 MODO VISUAL FUNCIONOU!');
    setTimeout(() => process.exit(0), 15000);
});

client.on('ready', () => {
    console.log('✅ CONECTADO EM MODO VISUAL!');
    setTimeout(() => process.exit(0), 5000);
});

client.on('auth_failure', (msg) => {
    console.log('❌ Auth failure:', msg);
});

client.on('disconnected', (reason) => {
    console.log('❌ Desconectado:', reason);
});

console.log('🚀 Testando modo visual...');
client.initialize().catch(error => {
    console.error('❌ Erro visual:', error.message);
    process.exit(1);
});

setTimeout(() => {
    console.log('⏰ Timeout visual');
    process.exit(1);
}, 60000);
EOF

echo "🚀 Testando modo visual..."
node test-visual.js

if [ $? -eq 0 ]; then
    echo "✅ MODO VISUAL FUNCIONOU!"
    exit 0
fi

echo ""
echo "3️⃣ VERIFICANDO CONECTIVIDADE COM WHATSAPP..."
echo "Testando acesso direto ao WhatsApp Web..."
curl -I https://web.whatsapp.com/ 2>/dev/null | head -5

echo ""
echo "4️⃣ VERIFICANDO DNS..."
nslookup web.whatsapp.com

echo ""
echo "🔍 DIAGNÓSTICO DE BLOQUEIO CONCLUÍDO"
echo "==================================="
echo "Se todos os testes falharam, pode ser:"
echo "1. Bloqueio do WhatsApp em VMs"
echo "2. Restrições de IP do Google Cloud"
echo "3. Firewall corporativo"
echo "4. Necessidade de proxy/VPN"
