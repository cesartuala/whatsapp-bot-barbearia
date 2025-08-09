#!/bin/bash
# Script robusto para instalar Chrome compatível

echo "🔧 Instalando Chrome 120 (compatível com Puppeteer)..."

# Parar Chrome
sudo pkill -f chrome 2>/dev/null || true
sleep 2

# Remover Chrome atual
echo "🗑️ Removendo Chrome atual..."
sudo apt remove --purge google-chrome-stable -y 2>/dev/null || true
sudo rm -f /etc/apt/sources.list.d/google-chrome.list

# Limpar cache
sudo apt autoremove -y
sudo apt autoclean

# Baixar Chrome 120 específico
echo "📦 Baixando Chrome 120..."
cd /tmp
rm -f google-chrome-stable_120*.deb

# URL específica para Chrome 120
wget -q https://dl.google.com/linux/chrome/deb/pool/main/g/google-chrome-stable/google-chrome-stable_120.0.6099.109-1_amd64.deb

if [ ! -f google-chrome-stable_120.0.6099.109-1_amd64.deb ]; then
    echo "❌ Falha no download. Tentando URL alternativa..."
    wget -q https://mirror.cs.uchicago.edu/google-chrome/pool/main/g/google-chrome-stable/google-chrome-stable_120.0.6099.109-1_amd64.deb
fi

if [ ! -f google-chrome-stable_120.0.6099.109-1_amd64.deb ]; then
    echo "❌ Falha no download. Instalando versão mais antiga disponível..."
    # Tentar versão mais antiga
    wget -q https://dl.google.com/linux/chrome/deb/pool/main/g/google-chrome-stable/google-chrome-stable_114.0.5735.90-1_amd64.deb
    CHROME_DEB="google-chrome-stable_114.0.5735.90-1_amd64.deb"
else
    CHROME_DEB="google-chrome-stable_120.0.6099.109-1_amd64.deb"
fi

# Instalar Chrome específico
echo "🔧 Instalando Chrome específico..."
sudo dpkg -i $CHROME_DEB

# Corrigir dependências
echo "🔧 Corrigindo dependências..."
sudo apt-get install -f -y

# Bloquear atualizações
echo "🔒 Bloqueando atualizações do Chrome..."
sudo apt-mark hold google-chrome-stable

# Verificar instalação
echo "✅ Verificando instalação..."
google-chrome --version

echo "🎉 Chrome compatível instalado!"
echo "📝 Próximo passo: node test-compatibility.js"
