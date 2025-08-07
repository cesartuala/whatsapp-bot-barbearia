# 🚀 Deploy em VM do Google Cloud

Guia completo para deploy do WhatsApp Bot em uma VM do Google Cloud.

## 📋 **Pré-requisitos**

- VM no Google Cloud Platform
- Acesso SSH à VM
- Arquivo de credenciais do Google Sheets

## 🛠️ **1. Configuração Inicial da VM**

### Conectar via SSH
```bash
# Via console do Google Cloud ou:
gcloud compute ssh --zone=us-central1-a nome-da-sua-vm --project=seu-project-id
```

### Executar script de instalação
```bash
# Baixar e executar script de dependências
curl -sSL https://raw.githubusercontent.com/cesartuala/whatsapp-bot-barbearia/main/install-dependencies.sh | bash
```

## 📦 **2. Deploy do Projeto**

### Limpeza completa da VM (múltiplas pastas aninhadas)
```bash
# Parar todos os processos do bot
pm2 stop all 2>/dev/null || true
pm2 kill 2>/dev/null || true
pkill -f node 2>/dev/null || true

# Voltar para o diretório home
cd ~

# Verificar a bagunça atual
pwd
ls -la

# REMOVER TUDO - todas as pastas do projeto
rm -rf whatsapp-bot-barbearia*
rm -rf */whatsapp-bot-barbearia*
rm -rf .pm2/
rm -rf .npm/
rm -rf node_modules/
rm -rf *.log

# Verificar se limpou tudo
ls -la
# Deve mostrar apenas arquivos do sistema (.bashrc, .profile, etc)
```

### Clonar repositório (versão limpa)
```bash
git clone https://github.com/cesartuala/whatsapp-bot-barbearia.git
cd whatsapp-bot-barbearia
```

### Instalar dependências
```bash
npm install
```

### Configurar credenciais
```bash
# Converter credenciais para Base64
base64 -w 0 /caminho/para/credentials.json

# Criar arquivo .env
cat > .env << 'EOF'
NODE_ENV=production
TZ=America/Sao_Paulo
GOOGLE_CREDENTIALS_BASE64=COLE_AQUI_O_BASE64
SPREADSHEET_ID=COLE_AQUI_O_ID_DA_PLANILHA
BOT_NAME=Barbearia Santana
OWNER_PHONE=5511939545171@c.us
EOF
```

## 🔄 **3. Métodos de Execução**

### Método 1: Screen (Simples)
```bash
# Iniciar sessão screen
screen -S whatsapp-bot

# Dentro da sessão
node index.js

# Sair da sessão (bot continua rodando)
# Ctrl+A depois D

# Voltar à sessão
screen -r whatsapp-bot

# Parar bot
# Ctrl+C dentro da sessão
```

### Método 2: Monitor Manual
```bash
# Usar monitor com restart automático
node monitor.js

# Em background
nohup node monitor.js > bot.log 2>&1 &

# Ver logs
tail -f bot.log
```

### Método 3: PM2 (Recomendado para Produção)
```bash
# Instalar PM2 globalmente
sudo npm install -g pm2

# Iniciar com PM2
pm2 start ecosystem.config.js

# Comandos úteis
pm2 status              # Ver status
pm2 logs whatsapp-bot   # Ver logs
pm2 restart whatsapp-bot # Reiniciar
pm2 stop whatsapp-bot   # Parar
pm2 delete whatsapp-bot # Remover

# Configurar para iniciar na boot
pm2 startup
pm2 save
```

## 📊 **4. Monitoramento**

### Verificar se está rodando
```bash
# Processos node
ps aux | grep node

# Logs do sistema
journalctl -f -u pm2-ubuntu

# Uso de recursos
htop
```

### Logs importantes
```bash
# Logs do bot
tail -f bot.log

# Logs do PM2
pm2 logs

# Logs do sistema
sudo journalctl -f
```

## 🔧 **5. Manutenção**

### Atualizar código
```bash
# Parar bot
pm2 stop whatsapp-bot

# Atualizar código
git pull origin main
npm install

# Reiniciar
pm2 start whatsapp-bot
```

### Backup de sessão
```bash
# Fazer backup da sessão WhatsApp
tar -czf whatsapp-session-backup-$(date +%Y%m%d).tar.gz whatsapp-session/

# Restaurar backup
tar -xzf whatsapp-session-backup-YYYYMMDD.tar.gz
```

### Limpeza de logs
```bash
# Limpar logs antigos
pm2 flush

# Limpar logs manuais
> bot.log

# Configurar rotação de logs
pm2 install pm2-logrotate
```

## 🐛 **6. Solução de Problemas**

### Limpeza total da VM (múltiplas pastas/arquivos)
```bash
# Se você tem várias pastas do projeto ou arquivos antigos:

# 1. Parar TODOS os processos
sudo pkill -f node
sudo pkill -f npm
pm2 kill 2>/dev/null || true

# 2. Ir para home e limpar tudo
cd ~
sudo rm -rf whatsapp-bot-barbearia*/  # Remove todas as pastas do projeto
sudo rm -rf node_modules/             # Remove node_modules antigos
sudo rm -rf *.log                     # Remove logs antigos
sudo rm -rf .pm2/                     # Remove configurações PM2
sudo rm -rf .npm/                     # Remove cache npm

# 3. Verificar se limpou
ls -la

# 4. Recomeçar limpo
git clone https://github.com/cesartuala/whatsapp-bot-barbearia.git
cd whatsapp-bot-barbearia
npm install
```

### Bot não conecta
```bash
# Verificar dependências
google-chrome --version
node --version

# Limpar sessão
rm -rf whatsapp-session/

# Reiniciar com logs
node index.js
```

### Erro de memória
```bash
# Verificar uso de memória
free -h

# Aumentar limite do Node.js
export NODE_OPTIONS="--max-old-space-size=2048"
```

### Erro de permissões
```bash
# Corrigir permissões
chmod +x install-dependencies.sh
chmod +x *.sh

# Verificar usuário
whoami
```

## 🔐 **7. Segurança**

### Firewall
```bash
# Configurar firewall básico
sudo ufw enable
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
```

### Atualizações
```bash
# Manter sistema atualizado
sudo apt update && sudo apt upgrade -y

# Configurar atualizações automáticas
sudo apt install unattended-upgrades
sudo dpkg-reconfigure unattended-upgrades
```

## 🌐 **8. Configurações de Rede**

### Para resolver problemas de conexão EUA/Brasil
```bash
# Verificar localização do servidor
curl ipinfo.io

# Configurar timezone
sudo timedatectl set-timezone America/Sao_Paulo

# Verificar DNS
nslookup web.whatsapp.com
```

## 📱 **9. Comandos Úteis**

```bash
# Status completo
npm run status

# Reiniciar tudo
npm run restart

# Ver logs em tempo real
npm run logs

# Backup completo
tar -czf backup-$(date +%Y%m%d).tar.gz whatsapp-bot-barbearia/

# Monitorar recursos
watch -n 1 'ps aux | grep node && free -h'
```

## 🆘 **10. Em Caso de Emergência**

```bash
# Parar tudo imediatamente
pkill -f node
pm2 kill

# Reiniciar VM
sudo reboot

# Conectar por console (se SSH falhar)
# Use o console do Google Cloud Platform
```

---

## 📞 **Suporte**

- **Logs:** Sempre verifique os logs primeiro
- **Sessão:** Se não conectar, delete a pasta `whatsapp-session`
- **Recursos:** Monitor uso de CPU/memória
- **Network:** Verifique conectividade com WhatsApp Web

**🎯 Com estas configurações, seu bot será muito mais estável em produção!**
