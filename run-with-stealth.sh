#!/bin/bash

# SCRIPT COMPLETO ANTI-DETECÇÃO WHATSAPP
echo "🛡️ INICIANDO CONFIGURAÇÃO ANTI-DETECÇÃO COMPLETA"
echo "================================================="

# 1. LIMPAR TUDO COMPLETAMENTE
echo "🧹 Limpeza completa do ambiente..."
pkill -f "node index.js" || true
pkill -f chromium || true
pkill -f google-chrome || true
sleep 3

# Limpar sessões e cache
rm -rf whatsapp-session/
rm -rf .wwebjs_*
rm -rf ~/.cache/chromium/
rm -rf ~/.cache/google-chrome/
rm -rf /tmp/.org.chromium.*
rm -rf /tmp/puppeteer_*

# 2. CONFIGURAR VARIÁVEIS DE AMBIENTE ANTI-DETECÇÃO
echo "🔧 Configurando variáveis anti-detecção..."
export DISPLAY=:99
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export CHROME_DEVEL_SANDBOX=/usr/lib/chromium/chrome-sandbox
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# 3. CONFIGURAR TIMEZONE BRASILEIRO
export TZ=America/Sao_Paulo

# 4. SIMULAR DELAY HUMANO ANTES DE INICIAR
echo "⏳ Simulando comportamento humano - aguardando..."
sleep_time=$((RANDOM % 10 + 5))  # Entre 5-15 segundos
echo "🕒 Aguardando ${sleep_time} segundos..."
sleep $sleep_time

# 5. INICIAR COM CONFIGURAÇÃO COMPLETA
echo "🚀 Iniciando bot com proteção máxima..."
echo "📊 Timestamp: $(date)"
echo "🌍 Timezone: $TZ"
echo "💻 Display: $DISPLAY"

# Executar com timeout de segurança
timeout 300s node index.js

echo ""
echo "✅ Execução finalizada!"
echo "📊 Status final: $(date)"
