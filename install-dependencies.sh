#!/bin/bash
# Script para instalar dependências necessárias no Google Cloud VM

echo "🔧 Instalando dependências para WhatsApp Bot no Google Cloud..."

# Atualizar sistema
echo "📦 Atualizando sistema..."
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18
echo "🟢 Instalando Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar versões
echo "✅ Versões instaladas:"
node --version
npm --version

# Instalar Google Chrome
echo "🌐 Instalando Google Chrome..."
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list
sudo apt update
sudo apt install google-chrome-stable -y

# Instalar dependências do Puppeteer
echo "🎭 Instalando dependências do Puppeteer..."
sudo apt install -y \
    gconf-service \
    libasound2 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgcc1 \
    libgconf-2-4 \
    libgdk-pixbuf2.0-0 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    ca-certificates \
    fonts-liberation \
    libappindicator1 \
    libnss3 \
    lsb-release \
    xdg-utils \
    wget

# Instalar screen para sessões persistentes
echo "📺 Instalando screen..."
sudo apt install screen -y

# Instalar PM2 globalmente (opcional)
echo "⚙️ Instalando PM2..."
sudo npm install -g pm2

# Criar diretórios necessários
echo "📁 Criando diretórios..."
mkdir -p ~/whatsapp-bot-logs
mkdir -p ~/whatsapp-bot-backups

# Configurar variáveis de ambiente
echo "🌍 Configurando variáveis de ambiente..."
echo 'export NODE_ENV=production' >> ~/.bashrc
echo 'export TZ=America/Sao_Paulo' >> ~/.bashrc

# Recarregar bashrc
source ~/.bashrc

echo "✅ Instalação concluída!"
echo ""
echo "📋 Próximos passos:"
echo "1. Clone seu repositório: git clone https://github.com/cesartuala/whatsapp-bot-barbearia.git"
echo "2. Entre na pasta: cd whatsapp-bot-barbearia"
echo "3. Instale dependências do projeto: npm install"
echo "4. Configure as variáveis de ambiente no app.yaml"
echo "5. Execute: node index.js"
echo ""
echo "💡 Para usar screen: screen -S whatsapp-bot"
echo "💡 Para usar PM2: pm2 start monitor.js --name whatsapp-bot"
