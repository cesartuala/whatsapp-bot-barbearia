#!/bin/bash

# 🚀 Script de Setup Automático - WhatsApp Bot Barbearia
# Execute este script após clonar o repositório

echo "🚀 Configurando WhatsApp Bot para Barbearia..."
echo "================================================"

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado!"
    echo "📥 Instale Node.js 18+ em: https://nodejs.org"
    exit 1
fi

echo "✅ Node.js $(node --version) encontrado"

# Verificar se npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm não encontrado!"
    exit 1
fi

echo "✅ npm $(npm --version) encontrado"

# Instalar dependências
echo ""
echo "📦 Instalando dependências..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependências instaladas com sucesso!"
else
    echo "❌ Erro ao instalar dependências"
    exit 1
fi

# Criar arquivo .env se não existir
if [ ! -f .env ]; then
    echo ""
    echo "📝 Criando arquivo .env..."
    cp .env.example .env
    echo "✅ Arquivo .env criado com base no template"
    echo "⚠️  IMPORTANTE: Configure suas credenciais no arquivo .env"
else
    echo "✅ Arquivo .env já existe"
fi

# Verificar se credenciais existem
if [ ! -f credentials_sheet.json ]; then
    echo ""
    echo "⚠️  ATENÇÃO: Arquivo credentials_sheet.json não encontrado"
    echo "📋 Siga estas etapas:"
    echo "   1. Acesse Google Cloud Console"
    echo "   2. Crie um service account"
    echo "   3. Baixe o JSON e renomeie para 'credentials_sheet.json'"
    echo "   4. Use credentials_template.json como referência"
fi

# Instalar dependências do dashboard
if [ -d "Painelhtml" ]; then
    echo ""
    echo "📊 Configurando dashboard..."
    cd Painelhtml
    
    if [ -f package.json ]; then
        npm install
        if [ $? -eq 0 ]; then
            echo "✅ Dashboard configurado com sucesso!"
        else
            echo "❌ Erro ao configurar dashboard"
        fi
    fi
    
    cd ..
fi

echo ""
echo "🎉 Setup concluído!"
echo "================================================"
echo ""
echo "📋 Próximos passos:"
echo "1. ⚙️  Configure o arquivo .env com suas credenciais"
echo "2. 📄 Adicione o arquivo credentials_sheet.json"
echo "3. 📊 Configure sua planilha Google Sheets"
echo "4. 🚀 Execute: npm start"
echo ""
echo "📚 Documentação completa no README.md"
echo "🆘 Suporte: https://github.com/seu-usuario/whatsapp-bot-barbearia/issues"
echo ""
echo "💈 Bom trabalho! 🚀"
