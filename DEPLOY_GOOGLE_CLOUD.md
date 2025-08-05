# 🚀 Guia de Deploy - Google Cloud Platform

## 📋 Pré-requisitos

1. **Conta Google Cloud Platform**
   - Acesse: https://console.cloud.google.com/
   - Crie um projeto ou selecione um existente

2. **Google Cloud CLI**
   - Download: https://cloud.google.com/sdk/docs/install
   - Instale e configure conforme seu sistema operacional

## 🔧 Configuração Inicial

### 1. Autenticação
```bash
# Fazer login na sua conta Google
gcloud auth login

# Configurar projeto
gcloud config set project SEU_PROJECT_ID

# Verificar configuração
gcloud config list
```

### 2. Habilitar APIs necessárias
```bash
# Habilitar App Engine
gcloud services enable appengine.googleapis.com

# Habilitar Google Sheets API
gcloud services enable sheets.googleapis.com

# Verificar APIs habilitadas
gcloud services list --enabled
```

### 3. Inicializar App Engine
```bash
# Criar aplicação App Engine (só precisa fazer uma vez)
gcloud app create --region=southamerica-east1
```

## 📁 Preparação do Projeto

### 1. Configurar credenciais Google Sheets
1. Acesse: https://console.cloud.google.com/apis/credentials
2. Clique em "Criar Credenciais" > "Conta de serviço"
3. Preencha os dados e clique em "Criar"
4. Na aba "Chaves", clique em "Adicionar chave" > "Criar nova chave"
5. Escolha "JSON" e baixe o arquivo
6. **NÃO** coloque este arquivo no repositório GitHub
7. Configure as variáveis no `app.yaml`

### 2. Configurar variáveis de ambiente
Edite o arquivo `app.yaml` e atualize:
```yaml
env_variables:
  GOOGLE_SPREADSHEET_ID: "SEU_SPREADSHEET_ID_AQUI"
  BOT_NAME: "Nome da Sua Barbearia"
  OWNER_PHONE: "5511999999999@c.us"
```

### 3. Configurar credenciais como Secret
```bash
# Armazenar credenciais como secret (recomendado)
gcloud secrets create google-sheets-credentials --data-file=credentials_sheet.json

# Dar permissão para App Engine acessar o secret
gcloud projects add-iam-policy-binding SEU_PROJECT_ID \
    --member="serviceAccount:SEU_PROJECT_ID@appspot.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
```

## 🚀 Deploy

### Deploy Simples
```bash
# Deploy direto
gcloud app deploy

# Deploy com confirmação automática
gcloud app deploy --quiet
```

### Deploy com Scripts
```bash
# Usar script de deploy (Linux/Mac)
chmod +x deploy.sh
./deploy.sh

# Windows (PowerShell)
powershell -ExecutionPolicy Bypass -File deploy.ps1
```

### Deploy via npm
```bash
# Deploy para produção
npm run deploy

# Deploy para staging
npm run deploy-staging
```

## 📊 Monitoramento

### Visualizar logs
```bash
# Logs em tempo real
gcloud app logs tail -s default

# Logs com filtro
gcloud app logs read --severity=ERROR

# Últimas 50 linhas
npm run logs
```

### Verificar status
```bash
# Status da aplicação
gcloud app describe

# Versões deployadas
gcloud app versions list

# Abrir aplicação no browser
gcloud app browse
```

## 🔧 Configurações Avançadas

### Scaling
No arquivo `app.yaml`:
```yaml
automatic_scaling:
  min_instances: 1
  max_instances: 3
  target_cpu_utilization: 0.6
```

### Health Checks
```yaml
readiness_check:
  path: "/health"
  check_interval_sec: 5
  timeout_sec: 4
  failure_threshold: 2
  success_threshold: 2
```

### Configurar domínio customizado
```bash
# Mapear domínio
gcloud app domain-mappings create seudominio.com.br

# Verificar mapeamento
gcloud app domain-mappings list
```

## 🐛 Solução de Problemas

### Erro: "The application does not exist"
```bash
gcloud app create --region=southamerica-east1
```

### Erro: "Invalid project"
```bash
gcloud config set project SEU_PROJECT_ID
gcloud auth login
```

### Erro: "Billing not enabled"
1. Acesse: https://console.cloud.google.com/billing
2. Habilite o faturamento para o projeto

### Bot não conecta no WhatsApp
- O WhatsApp Web não funciona bem em servidores
- Para produção, use WhatsApp Business API
- Considere usar serviços como Twilio, MessageBird, etc.

### Erro de memória/timeout
Ajuste no `app.yaml`:
```yaml
instance_class: F2  # ou F4 para mais recursos

automatic_scaling:
  max_instances: 1  # evita múltiplas instâncias
```

## 📱 Alternativas para WhatsApp Web

Para ambiente de produção, considere:

1. **WhatsApp Business API**
   - Meta Business: https://business.whatsapp.com/
   - Mais estável para produção

2. **Serviços terceirizados**
   - Twilio WhatsApp API
   - MessageBird
   - Chatbot.com

3. **Docker Container**
   - Use o Dockerfile incluído
   - Deploy em Cloud Run ou Compute Engine

## 🎯 URLs Importantes

- **Console Google Cloud:** https://console.cloud.google.com/
- **App Engine:** https://console.cloud.google.com/appengine
- **Logs:** https://console.cloud.google.com/logs
- **Sheets API:** https://console.cloud.google.com/apis/library/sheets.googleapis.com
- **Seu App:** https://SEU_PROJECT_ID.appspot.com

## 💰 Custos

- **App Engine F1:** Gratuito até certos limites
- **App Engine F2:** ~$0.05/hora
- **Sheets API:** Gratuito até 100 requests/100s/user
- **Storage:** Mínimo

Monitore em: https://console.cloud.google.com/billing

---

✅ **Projeto pronto para produção no Google Cloud!**
