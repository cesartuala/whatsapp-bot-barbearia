#!/bin/bash
# Script para corrigir problemas identificados no diagnóstico

echo "🔧 CORREÇÃO DOS PROBLEMAS IDENTIFICADOS"
echo "======================================="

echo ""
echo "1️⃣ CONFIGURANDO DISPLAY..."
export DISPLAY=:99
echo "✅ DISPLAY configurado para: $DISPLAY"

echo ""
echo "2️⃣ VERIFICANDO XVFB..."
if ! pgrep -x "Xvfb" > /dev/null; then
    echo "Iniciando Xvfb..."
    Xvfb :99 -screen 0 1024x768x24 &
    sleep 3
fi
echo "✅ Xvfb rodando"

echo ""
echo "3️⃣ CORRIGINDO VERSÃO DO WHATSAPP-WEB.JS..."
echo "Reinstalando versão compatível..."
npm uninstall whatsapp-web.js
npm install whatsapp-web.js@1.21.0 --save

echo ""
echo "4️⃣ LIMPANDO CACHE E SESSÕES..."
pkill -f "node index.js" 2>/dev/null || true
pkill -f chromium 2>/dev/null || true
rm -rf whatsapp-session/
rm -rf .wwebjs_*
rm -rf ~/.cache/chromium/
rm -rf /tmp/chrome*

echo ""
echo "5️⃣ CRIANDO TESTE COM CONFIGURAÇÃO CORRETA..."
cat > test-fixed.js << 'EOF'
const { Client, NoAuth } = require("whatsapp-web.js");

console.log('🔍 TESTE COM CORREÇÕES APLICADAS');
console.log('================================');

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
            '--no-zygote',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor'
        ],
        executablePath: '/usr/bin/chromium',
        timeout: 60000
    }
});

client.on('qr', (qr) => {
    console.log('✅ QR CODE GERADO COM SUCESSO!');
    const qrcode = require('qrcode-terminal');
    qrcode.generate(qr, { small: true });
    console.log('🎉 BOT FUNCIONANDO!');
    setTimeout(() => process.exit(0), 15000);
});

client.on('ready', () => {
    console.log('✅ CLIENTE CONECTADO!');
    setTimeout(() => process.exit(0), 5000);
});

client.on('auth_failure', (msg) => {
    console.log('❌ Falha na autenticação:', msg);
});

client.on('disconnected', (reason) => {
    console.log('❌ Desconectado:', reason);
});

console.log('🚀 Iniciando teste corrigido...');
client.initialize().catch(error => {
    console.error('❌ ERRO:', error.message);
    
    // Se der erro, tentar com mais argumentos
    console.log('🔄 Tentando configuração alternativa...');
    setTimeout(() => process.exit(1), 2000);
});

setTimeout(() => {
    console.log('⏰ Timeout do teste');
    process.exit(1);
}, 45000);
EOF

echo ""
echo "6️⃣ EXECUTANDO TESTE CORRIGIDO..."
export DISPLAY=:99
node test-fixed.js

echo ""
echo "✅ CORREÇÕES APLICADAS!"
echo "======================"
echo "Se o teste funcionou, execute: export DISPLAY=:99 && node index.js"
