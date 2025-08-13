#!/bin/bash

echo "🧹 LIMPEZA COMPLETA WHATSAPP WEB.JS"
echo "=================================="

# Parar qualquer processo rodando
echo "🛑 Parando processos..."
pkill -f "node index.js" || true
pkill -f "node test-version.js" || true

# Desinstalar WhatsApp Web.js
echo "📦 Desinstalando whatsapp-web.js..."
npm uninstall whatsapp-web.js

# Limpar cache
echo "🗑️ Limpando cache npm..."
npm cache clean --force

# Remover node_modules
echo "📁 Removendo node_modules..."
rm -rf node_modules/
rm -f package-lock.json

# Limpar todas as sessões
echo "🔐 Removendo sessões WhatsApp..."
rm -rf whatsapp-session/
rm -rf .wwebjs_*
find . -name "*whatsapp*" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name "*session*" -type d -exec rm -rf {} + 2>/dev/null || true

# Verificar limpeza
echo ""
echo "✅ Limpeza concluída!"
echo "📊 Verificando se WhatsApp foi removido:"
npm list whatsapp-web.js 2>/dev/null || echo "✅ WhatsApp Web.js não está instalado"

echo ""
echo "🚀 Para instalar uma versão específica:"
echo "npm install whatsapp-web.js@1.18.4 --save"
echo "npm install whatsapp-web.js@1.19.5 --save"
echo "npm install whatsapp-web.js@1.21.0 --save"
