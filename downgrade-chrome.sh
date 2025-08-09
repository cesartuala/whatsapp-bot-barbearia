#!/bin/bash
# Script manual para downgrade do Chrome - versão simplificada

echo "🔧 Downgrade manual do Chrome para versão compatível"
echo "=================================================="

# Configurar display primeiro
echo "🖥️ Configurando display..."
export DISPLAY=:99
echo "Display configurado para: $DISPLAY"

# Parar Chrome
echo "🛑 Parando processos Chrome..."
sudo pkill -f chrome 2>/dev/null || true
sudo pkill -f google-chrome 2>/dev/null || true
sleep 3

# Remover Chrome atual
echo "🗑️ Removendo Chrome 139..."
sudo apt remove --purge google-chrome-stable -y
sudo rm -f /etc/apt/sources.list.d/google-chrome.list
sudo apt autoremove -y

echo "📦 Instalando Chrome 114 (mais estável)..."
cd /tmp

# Baixar Chrome 114 (mais antigo e estável)
wget -q https://dl.google.com/linux/chrome/deb/pool/main/g/google-chrome-stable/google-chrome-stable_114.0.5735.90-1_amd64.deb

# Se não conseguir baixar, usar mirrors
if [ ! -f google-chrome-stable_114.0.5735.90-1_amd64.deb ]; then
    echo "⚠️ Tentando mirror alternativo..."
    wget -q https://mirror.cs.uchicago.edu/google-chrome/pool/main/g/google-chrome-stable/google-chrome-stable_114.0.5735.90-1_amd64.deb
fi

# Verificar download
if [ -f google-chrome-stable_114.0.5735.90-1_amd64.deb ]; then
    echo "✅ Chrome 114 baixado com sucesso"
    
    # Instalar
    echo "🔧 Instalando Chrome 114..."
    sudo dpkg -i google-chrome-stable_114.0.5735.90-1_amd64.deb
    
    # Corrigir dependências
    sudo apt-get install -f -y
    
    # Bloquear atualizações
    sudo apt-mark hold google-chrome-stable
    
    # Verificar
    echo "✅ Verificando instalação..."
    google-chrome --version
    
    echo "🎉 Chrome compatível instalado!"
    echo "🚀 Teste agora: export DISPLAY=:99 && node test-basic.js"
    
else
    echo "❌ Falha no download do Chrome 114"
    echo "💡 Vamos tentar usar o Chrome atual com configuração especial..."
fi
