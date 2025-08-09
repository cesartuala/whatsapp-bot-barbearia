#!/bin/bash
# Script para instalar Chrome versão compatível com Puppeteer

echo "🔧 Instalando Chrome versão compatível..."

# Remover Chrome atual
sudo pkill -f chrome 2>/dev/null || true
sudo apt remove --purge google-chrome-stable -y 2>/dev/null || true

# Instalar Chrome 120 (compatível)
cd /tmp
wget https://dl.google.com/linux/chrome/deb/pool/main/g/google-chrome-stable/google-chrome-stable_120.0.6099.109-1_amd64.deb

# Instalar versão específica
sudo dpkg -i google-chrome-stable_120.0.6099.109-1_amd64.deb

# Corrigir dependências se houver
sudo apt-get install -f -y

# Bloquear atualizações automáticas do Chrome
sudo apt-mark hold google-chrome-stable

# Verificar versão
google-chrome --version

echo "✅ Chrome 120 instalado e bloqueado!"
echo "📝 Para testar: node test-compatibility.js"
