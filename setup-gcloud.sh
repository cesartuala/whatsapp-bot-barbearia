#!/bin/bash
# Script para preparar ambiente Google Cloud com Chromium

echo "🐧 PREPARANDO AMBIENTE GOOGLE CLOUD"
echo "===================================="

# Verificar se Chromium está instalado
if ! command -v chromium &> /dev/null; then
    echo "📦 Instalando Chromium..."
    sudo apt update
    sudo apt install -y chromium
else
    echo "✅ Chromium já instalado: $(which chromium)"
fi

# Verificar se Xvfb está instalado
if ! command -v Xvfb &> /dev/null; then
    echo "📦 Instalando Xvfb..."
    sudo apt install -y xvfb
else
    echo "✅ Xvfb já instalado: $(which Xvfb)"
fi

# Verificar se Xvfb está rodando
if ! pgrep -x "Xvfb" > /dev/null; then
    echo "🖥️ Iniciando Xvfb..."
    Xvfb :99 -screen 0 1024x768x24 &
    export DISPLAY=:99
else
    echo "✅ Xvfb já está rodando"
    export DISPLAY=:99
fi

echo ""
echo "✅ Ambiente preparado!"
echo "🚀 Para iniciar o bot: export DISPLAY=:99 && node index.js"
