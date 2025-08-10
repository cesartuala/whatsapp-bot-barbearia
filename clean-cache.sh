#!/bin/bash
# Script rápido para limpar apenas cache (sem reiniciar)

echo "🧹 LIMPEZA RÁPIDA DE CACHE"
echo "========================="

# Parar processos
pkill -f "node index.js" 2>/dev/null || true
pkill -f chromium 2>/dev/null || true
sleep 2

# Limpar sessões WhatsApp
echo "🗑️ Removendo sessões WhatsApp..."
rm -rf whatsapp-session/
rm -rf .wwebjs_*

# Limpar cache Chromium
echo "🗑️ Limpando cache Chromium..."
rm -rf ~/.cache/chromium/
rm -rf /tmp/chrome*

echo "✅ Cache limpo!"
echo "🚀 Para reconectar: export DISPLAY=:99 && node index.js"
