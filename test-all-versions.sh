#!/bin/bash

# Script para testar múltiplas versões do WhatsApp Web.js
echo "🧪 TESTADOR DE VERSÕES WHATSAPP WEB.JS"
echo "======================================"

# Lista de versões para testar (da mais estável para mais recente)
VERSIONS=(
    "1.18.4"
    "1.19.5" 
    "1.21.0"
    "1.23.0"
    "1.25.0"
    "1.31.0"
)

# Função para testar uma versão
test_version() {
    local version=$1
    echo ""
    echo "🔄 TESTANDO VERSÃO: $version"
    echo "=========================="
    
    # Instalar versão específica
    echo "📦 Instalando whatsapp-web.js@$version..."
    npm install whatsapp-web.js@$version --save
    
    if [ $? -ne 0 ]; then
        echo "❌ Erro ao instalar versão $version"
        return 1
    fi
    
    # Limpar sessões antigas
    rm -rf whatsapp-session/
    rm -rf .wwebjs_*
    
    echo "🚀 Iniciando teste da versão $version..."
    echo "⏰ Timeout: 60 segundos"
    
    # Executar teste com timeout
    timeout 60s node test-version.js
    local exit_code=$?
    
    if [ $exit_code -eq 124 ]; then
        echo "⏰ TIMEOUT - Versão $version não conectou em 60s"
        return 1
    elif [ $exit_code -eq 0 ]; then
        echo "✅ SUCESSO - Versão $version funcionou!"
        return 0
    else
        echo "❌ ERRO - Versão $version falhou"
        return 1
    fi
}

# Testar cada versão
for version in "${VERSIONS[@]}"; do
    echo ""
    read -p "🤔 Testar versão $version? (y/n): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if test_version $version; then
            echo ""
            echo "🎉 VERSÃO FUNCIONANDO ENCONTRADA: $version"
            echo "💾 Mantendo esta versão instalada"
            break
        fi
    else
        echo "⏭️ Pulando versão $version"
    fi
done

echo ""
echo "🏁 Teste concluído!"
echo "📊 Versão atualmente instalada:"
npm list whatsapp-web.js
