#!/bin/bash
# Script para limpar cache e reconectar WhatsApp Bot

echo "🧹 Limpando cache e reconectando WhatsApp Bot"
echo "============================================="

# 1. Parar todos os processos relacionados
echo "🛑 Parando processos do bot..."
pkill -f "node index.js" 2>/dev/null || true
pkill -f "node.*index" 2>/dev/null || true
pkill -f chromium 2>/dev/null || true
pkill -f chrome 2>/dev/null || true
sleep 3

# 2. Limpar todas as sessões e cache
echo "🗑️ Removendo cache e sessões..."
rm -rf whatsapp-session/ 2>/dev/null || true
rm -rf .wwebjs_auth/ 2>/dev/null || true
rm -rf .wwebjs_cache/ 2>/dev/null || true
rm -rf test-session/ 2>/dev/null || true
rm -rf robust-session/ 2>/dev/null || true

# 3. Limpar cache do Chromium
echo "🗑️ Limpando cache do Chromium..."
rm -rf ~/.cache/chromium/ 2>/dev/null || true
rm -rf ~/.config/chromium/ 2>/dev/null || true
rm -rf /tmp/chrome* 2>/dev/null || true
rm -rf /tmp/.org.chromium.* 2>/dev/null || true

# 4. Limpar cache do Node.js
echo "🗑️ Limpando cache do Node.js..."
npm cache clean --force 2>/dev/null || true

# 5. Configurar ambiente
echo "⚙️ Configurando ambiente..."
export DISPLAY=:99
export NODE_ENV=production

# 6. Verificar se Chromium está funcionando
echo "🔍 Testando Chromium..."
if chromium --version; then
    echo "✅ Chromium OK"
else
    echo "❌ Problema com Chromium"
    exit 1
fi

# 7. Reiniciar bot
echo "🚀 Iniciando bot limpo..."
echo "🔔 ATENÇÃO: Prepare-se para escanear QR Code!"
echo "📱 O QR Code aparecerá em breve..."
sleep 3

node index.js
