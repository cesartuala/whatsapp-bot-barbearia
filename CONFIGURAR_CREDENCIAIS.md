# 🔐 Configuração de Credenciais Google Cloud

## 📋 Pré-requisitos
1. Google Cloud CLI instalado
2. Projeto configurado no Google Cloud
3. Arquivo credentials_sheet.json

## 🚀 Passo a Passo:

### 1. Configurar Google Cloud CLI
```bash
# Fazer login
gcloud auth login

# Configurar projeto (substitua pelo seu PROJECT_ID)
gcloud config set project SEU_PROJECT_ID

# Verificar configuração
gcloud config list
```

### 2. Habilitar APIs necessárias
```bash
# Habilitar Secret Manager
gcloud services enable secretmanager.googleapis.com

# Habilitar Google Sheets API
gcloud services enable sheets.googleapis.com

# Habilitar App Engine
gcloud services enable appengine.googleapis.com
```

### 3. Criar Secret com credenciais
```bash
# Criar secret com o arquivo de credenciais
gcloud secrets create google-sheets-credentials --data-file=credentials_sheet.json

# Verificar se foi criado
gcloud secrets list
```

### 4. Dar permissões para App Engine
```bash
# Permitir que App Engine acesse o secret
gcloud projects add-iam-policy-binding SEU_PROJECT_ID \
    --member="serviceAccount:SEU_PROJECT_ID@appspot.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
```

### 5. Atualizar código para usar Secret Manager

Adicione esta função ao seu index.js:

```javascript
// No início do arquivo, adicione:
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

// Função para buscar credenciais do Secret Manager
async function getGoogleCredentials() {
  if (process.env.NODE_ENV === 'production') {
    try {
      const client = new SecretManagerServiceClient();
      const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT;
      const name = `projects/${projectId}/secrets/google-sheets-credentials/versions/latest`;
      
      const [version] = await client.accessSecretVersion({ name });
      const secretPayload = version.payload.data.toString();
      return JSON.parse(secretPayload);
    } catch (error) {
      console.error('Erro ao buscar credenciais do Secret Manager:', error);
      throw error;
    }
  } else {
    // Em desenvolvimento, usa o arquivo local
    return require('./credentials_sheet.json');
  }
}
```

### 6. Atualizar configuração do Google Sheets
```javascript
// Substitua a configuração atual por:
let auth;

async function initializeGoogleSheets() {
  try {
    const credentials = await getGoogleCredentials();
    auth = new google.auth.GoogleAuth({
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    
    const authClient = await auth.getClient();
    sheets = google.sheets({ version: 'v4', auth: authClient });
    console.log('✅ Google Sheets API inicializada com sucesso');
  } catch (error) {
    console.error('❌ Erro ao inicializar Google Sheets API:', error);
    throw error;
  }
}

// Chame esta função no início da aplicação
initializeGoogleSheets();
```

### 7. Atualizar package.json
```json
{
  "dependencies": {
    "@google-cloud/secret-manager": "^5.0.0",
    // ... outras dependências
  }
}
```

### 8. Deploy
```bash
# Instalar nova dependência
npm install @google-cloud/secret-manager

# Deploy
gcloud app deploy
```

## 🔄 Opção Alternativa: Variáveis de Ambiente

Se preferir usar variáveis de ambiente no app.yaml:

```yaml
env_variables:
  GOOGLE_CREDENTIALS: |
    {
      "type": "service_account",
      "project_id": "seu-project-id",
      "private_key_id": "key-id",
      "private_key": "-----BEGIN PRIVATE KEY-----\nSUA_CHAVE_AQUI\n-----END PRIVATE KEY-----\n",
      "client_email": "seu-email@projeto.iam.gserviceaccount.com",
      "client_id": "client-id",
      "auth_uri": "https://accounts.google.com/o/oauth2/auth",
      "token_uri": "https://oauth2.googleapis.com/token"
    }
```

## ⚠️ IMPORTANTE - Segurança:

1. **NUNCA** commite credentials_sheet.json no Git
2. **SEMPRE** use .gitignore para excluir arquivos sensíveis
3. Para produção, prefira Secret Manager
4. Para desenvolvimento, use arquivo local

## 🔍 Verificar se funciona:

```bash
# Testar acesso ao secret
gcloud secrets versions access latest --secret="google-sheets-credentials"

# Ver logs da aplicação
gcloud app logs tail -s default
```
