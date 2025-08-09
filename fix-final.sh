#!/bin/bash
# Script definitivo para resolver o problema Chrome + WhatsApp Web.js

echo "🔧 SOLUÇÃO DEFINITIVA - Chrome + WhatsApp Web.js"
echo "=============================================="

# 1. Configurar display
export DISPLAY=:99
echo "✅ Display configurado: $DISPLAY"

# 2. Matar TODOS os processos Chrome
echo "🛑 Matando TODOS os processos Chrome..."
sudo pkill -9 -f chrome 2>/dev/null || true
sudo pkill -9 -f google-chrome 2>/dev/null || true
sudo pkill -9 -f chromium 2>/dev/null || true
sleep 3

# 3. Limpar completamente cache e sessões
echo "🧹 Limpando cache completo..."
rm -rf ~/.cache/google-chrome* 2>/dev/null || true
rm -rf ~/.config/google-chrome* 2>/dev/null || true
rm -rf /tmp/.org.chromium.* 2>/dev/null || true
rm -rf /tmp/chrome* 2>/dev/null || true
rm -rf .wwebjs_* 2>/dev/null || true
rm -rf whatsapp-session* 2>/dev/null || true
rm -rf test-session* 2>/dev/null || true
rm -rf robust-session* 2>/dev/null || true

# 4. Remover Chrome atual
echo "🗑️ Removendo Chrome atual..."
sudo apt remove --purge google-chrome-stable -y 2>/dev/null || true
sudo rm -f /etc/apt/sources.list.d/google-chrome.list
sudo apt autoremove -y
sudo apt autoclean

# 5. Instalar Chromium (mais compatível)
echo "📦 Instalando Chromium (mais compatível)..."
sudo apt update
sudo apt install -y chromium

# Verificar instalação do Chromium
if command -v chromium &> /dev/null; then
    echo "✅ Chromium instalado: $(chromium --version)"
    BROWSER_PATH="/usr/bin/chromium"
elif command -v chromium-browser &> /dev/null; then
    echo "✅ Chromium instalado: $(chromium-browser --version)"
    BROWSER_PATH="/usr/bin/chromium-browser"
else
    echo "❌ Falha na instalação do Chromium"
    
    # Fallback: tentar instalar Chrome antigo
    echo "📦 Tentando Chrome 114..."
    cd /tmp
    wget -q https://dl.google.com/linux/chrome/deb/pool/main/g/google-chrome-stable/google-chrome-stable_114.0.5735.90-1_amd64.deb
    
    if [ -f google-chrome-stable_114.0.5735.90-1_amd64.deb ]; then
        sudo dpkg -i google-chrome-stable_114.0.5735.90-1_amd64.deb
        sudo apt-get install -f -y
        sudo apt-mark hold google-chrome-stable
        BROWSER_PATH="/usr/bin/google-chrome-stable"
        echo "✅ Chrome 114 instalado"
    else
        echo "❌ Falha total na instalação de browsers"
        exit 1
    fi
fi

# 6. Criar teste com browser específico
echo "🔧 Criando teste otimizado..."
cat > test-final.js << 'EOF'
const { Client, NoAuth } = require("whatsapp-web.js");

console.log('🔍 Teste FINAL com browser compatível');

const browserPath = process.env.BROWSER_PATH || '/usr/bin/chromium';
console.log('🚀 Usando browser:', browserPath);

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
        executablePath: browserPath,
        timeout: 60000
    }
});

client.on('qr', (qr) => {
    console.log('✅ SUCESSO! QR Code gerado!');
    console.log('🎉 WhatsApp Web.js funcionando com browser compatível!');
    
    const qrcode = require('qrcode-terminal');
    qrcode.generate(qr, { small: true });
    
    setTimeout(() => {
        console.log('✅ Teste bem-sucedido!');
        process.exit(0);
    }, 10000);
});

client.on('ready', () => {
    console.log('✅ Cliente conectado!');
    setTimeout(() => process.exit(0), 5000);
});

client.on('auth_failure', () => {
    console.log('ℹ️ Auth failure (normal)');
});

client.on('disconnected', (reason) => {
    console.log('🔌 Desconectado:', reason);
});

async function testFinal() {
    try {
        console.log('🔧 Inicializando cliente final...');
        await client.initialize();
        
        setTimeout(() => {
            console.log('⏰ Timeout');
            process.exit(1);
        }, 60000);
        
    } catch (error) {
        console.error('❌ Erro final:', error.message);
        process.exit(1);
    }
}

testFinal();
EOF

# 7. Executar teste
echo "🚀 Executando teste final..."
export BROWSER_PATH="$BROWSER_PATH"
echo "Browser path: $BROWSER_PATH"

node test-final.js

echo "🎉 Script concluído!"
