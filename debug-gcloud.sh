#!/bin/bash
# Script de diagnóstico completo para Google Cloud VM

echo "🔍 DIAGNÓSTICO COMPLETO - GOOGLE CLOUD VM"
echo "=========================================="

echo ""
echo "1️⃣ VERIFICANDO AMBIENTE..."
echo "OS: $(uname -a)"
echo "Node.js: $(node --version)"
echo "NPM: $(npm --version)"
echo ""

echo "2️⃣ VERIFICANDO DISPLAY..."
echo "DISPLAY atual: $DISPLAY"
if pgrep -x "Xvfb" > /dev/null; then
    echo "✅ Xvfb está rodando"
else
    echo "❌ Xvfb NÃO está rodando"
    echo "Iniciando Xvfb..."
    Xvfb :99 -screen 0 1024x768x24 &
    export DISPLAY=:99
    sleep 3
fi
echo ""

echo "3️⃣ VERIFICANDO CHROMIUM..."
if command -v chromium &> /dev/null; then
    echo "✅ Chromium encontrado: $(which chromium)"
    echo "Versão: $(chromium --version)"
else
    echo "❌ Chromium NÃO encontrado"
fi
echo ""

echo "4️⃣ VERIFICANDO PROCESSOS..."
echo "Processos Node.js:"
pgrep -f "node" || echo "Nenhum processo Node.js"
echo "Processos Chrome/Chromium:"
pgrep -f "chrom" || echo "Nenhum processo Chrome/Chromium"
echo ""

echo "5️⃣ VERIFICANDO ARQUIVOS..."
echo "Arquivo index.js existe: $(test -f index.js && echo "✅ SIM" || echo "❌ NÃO")"
echo "Arquivo package.json existe: $(test -f package.json && echo "✅ SIM" || echo "❌ NÃO")"
echo "Diretório node_modules existe: $(test -d node_modules && echo "✅ SIM" || echo "❌ NÃO")"
echo "Arquivo credentials_sheet.json existe: $(test -f credentials_sheet.json && echo "✅ SIM" || echo "❌ NÃO")"
echo ""

echo "6️⃣ VERIFICANDO DEPENDÊNCIAS..."
if [ -f package.json ]; then
    echo "WhatsApp Web.js instalado:"
    npm list whatsapp-web.js 2>/dev/null || echo "❌ NÃO instalado"
else
    echo "❌ package.json não encontrado"
fi
echo ""

echo "7️⃣ VERIFICANDO CONFIGURAÇÃO NO INDEX.JS..."
if [ -f index.js ]; then
    echo "executablePath configurado:"
    grep -n "executablePath" index.js || echo "❌ executablePath não encontrado"
    echo ""
    echo "Args do Puppeteer:"
    grep -A 10 "args:" index.js | head -15
else
    echo "❌ index.js não encontrado"
fi
echo ""

echo "8️⃣ TESTE SIMPLES DE CHROMIUM..."
export DISPLAY=:99
timeout 10s chromium --headless --no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage --version 2>&1 && echo "✅ Chromium funciona" || echo "❌ Chromium falhou"
echo ""

echo "9️⃣ CRIANDO TESTE MÍNIMO..."
cat > test-minimal-debug.js << 'EOF'
const { Client, NoAuth } = require("whatsapp-web.js");

console.log('🔍 TESTE MÍNIMO PARA DEBUG');
console.log('==========================');

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
    console.log('✅ QR GERADO!');
    console.log('🎯 SUCESSO!');
    process.exit(0);
});

client.on('ready', () => {
    console.log('✅ CONECTADO!');
    process.exit(0);
});

client.on('auth_failure', (msg) => {
    console.log('❌ Auth failure:', msg);
});

client.on('disconnected', (reason) => {
    console.log('❌ Desconectado:', reason);
});

console.log('🚀 Iniciando teste mínimo...');
client.initialize().catch(error => {
    console.error('❌ ERRO:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
});

setTimeout(() => {
    console.log('⏰ TIMEOUT - Teste falhou');
    process.exit(1);
}, 30000);
EOF

echo "🚀 EXECUTANDO TESTE MÍNIMO..."
export DISPLAY=:99
node test-minimal-debug.js 2>&1

echo ""
echo "🔧 DIAGNÓSTICO CONCLUÍDO!"
echo "========================="
