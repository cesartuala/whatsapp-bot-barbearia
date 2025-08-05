#!/bin/bash

# Setup script para WhatsApp Bot Barbearia
echo "🔧 Configuração inicial do WhatsApp Bot Barbearia"

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale o Node.js 18+ primeiro:"
    echo "   https://nodejs.org/"
    exit 1
fi

# Verificar versão do Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt "18" ]; then
    echo "❌ Node.js versão 18+ é necessária. Versão atual: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) encontrado"

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Criar arquivo .env se não existir
if [ ! -f ".env" ]; then
    echo "📝 Criando arquivo .env..."
    cp .env.example .env
    echo "⚠️  Configure o arquivo .env com seus dados!"
fi

# Verificar se credentials_sheet.json existe
if [ ! -f "credentials_sheet.json" ]; then
    echo "⚠️  Arquivo credentials_sheet.json não encontrado!"
    echo "   1. Acesse: https://console.cloud.google.com/"
    echo "   2. Crie um projeto ou selecione um existente"
    echo "   3. Ative a API do Google Sheets"
    echo "   4. Crie credenciais de conta de serviço"
    echo "   5. Baixe o arquivo JSON e renomeie para 'credentials_sheet.json'"
fi

echo ""
echo "✅ Setup concluído!"
echo ""
echo "📋 Próximos passos:"
echo "   1. Configure o arquivo .env"
echo "   2. Adicione o arquivo credentials_sheet.json"
echo "   3. Execute: npm start"
echo ""
echo "📖 Documentação completa no README.md"
