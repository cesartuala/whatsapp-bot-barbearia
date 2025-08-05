#!/bin/bash

# Script de Deploy para Google Cloud Platform
# WhatsApp Bot Barbearia

echo "🚀 Iniciando deploy do WhatsApp Bot Barbearia..."

# Verificar se gcloud CLI está instalado
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud CLI não encontrado. Instale primeiro:"
    echo "   https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Verificar se está logado no gcloud
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n 1 > /dev/null; then
    echo "❌ Você não está logado no Google Cloud. Execute:"
    echo "   gcloud auth login"
    exit 1
fi

# Verificar se o projeto está configurado
PROJECT_ID=$(gcloud config get-value project)
if [ -z "$PROJECT_ID" ]; then
    echo "❌ Projeto do Google Cloud não configurado. Execute:"
    echo "   gcloud config set project SEU_PROJECT_ID"
    exit 1
fi

echo "📋 Projeto configurado: $PROJECT_ID"

# Verificar se os arquivos necessários existem
if [ ! -f "app.yaml" ]; then
    echo "❌ Arquivo app.yaml não encontrado!"
    exit 1
fi

if [ ! -f "credentials_sheet.json" ]; then
    echo "⚠️  Aviso: credentials_sheet.json não encontrado!"
    echo "   Certifique-se de configurar as variáveis de ambiente no app.yaml"
fi

# Verificar se node_modules existe
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

# Fazer backup do deploy anterior (opcional)
echo "💾 Criando backup da versão anterior..."
gcloud app versions list --format="value(id)" --limit=1 > last_version.txt

# Deploy
echo "🚀 Fazendo deploy para o Google App Engine..."
gcloud app deploy app.yaml --quiet

if [ $? -eq 0 ]; then
    echo "✅ Deploy realizado com sucesso!"
    echo "🌐 Sua aplicação está rodando em: https://$PROJECT_ID.appspot.com"
    
    # Mostrar logs
    echo "📋 Últimos logs da aplicação:"
    gcloud app logs tail -s default --num-log-lines=10
else
    echo "❌ Erro durante o deploy!"
    exit 1
fi

echo "🎉 Deploy concluído!"
echo "📊 Para monitorar logs: gcloud app logs tail -s default"
echo "🔧 Para abrir console: https://console.cloud.google.com/appengine"
