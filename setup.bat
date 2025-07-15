@echo off
REM 🚀 Script de Setup Automático - WhatsApp Bot Barbearia (Windows)
REM Execute este script após clonar o repositório

echo 🚀 Configurando WhatsApp Bot para Barbearia...
echo ================================================

REM Verificar se Node.js está instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js não encontrado!
    echo 📥 Instale Node.js 18+ em: https://nodejs.org
    pause
    exit /b 1
)

echo ✅ Node.js encontrado
node --version

REM Verificar se npm está instalado
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm não encontrado!
    pause
    exit /b 1
)

echo ✅ npm encontrado
npm --version

REM Instalar dependências
echo.
echo 📦 Instalando dependências...
npm install

if %errorlevel% equ 0 (
    echo ✅ Dependências instaladas com sucesso!
) else (
    echo ❌ Erro ao instalar dependências
    pause
    exit /b 1
)

REM Criar arquivo .env se não existir
if not exist .env (
    echo.
    echo 📝 Criando arquivo .env...
    copy .env.example .env >nul
    echo ✅ Arquivo .env criado com base no template
    echo ⚠️  IMPORTANTE: Configure suas credenciais no arquivo .env
) else (
    echo ✅ Arquivo .env já existe
)

REM Verificar se credenciais existem
if not exist credentials_sheet.json (
    echo.
    echo ⚠️  ATENÇÃO: Arquivo credentials_sheet.json não encontrado
    echo 📋 Siga estas etapas:
    echo    1. Acesse Google Cloud Console
    echo    2. Crie um service account
    echo    3. Baixe o JSON e renomeie para 'credentials_sheet.json'
    echo    4. Use credentials_template.json como referência
)

REM Instalar dependências do dashboard
if exist Painelhtml (
    echo.
    echo 📊 Configurando dashboard...
    cd Painelhtml
    
    if exist package.json (
        npm install
        if %errorlevel% equ 0 (
            echo ✅ Dashboard configurado com sucesso!
        ) else (
            echo ❌ Erro ao configurar dashboard
        )
    )
    
    cd ..
)

echo.
echo 🎉 Setup concluído!
echo ================================================
echo.
echo 📋 Próximos passos:
echo 1. ⚙️  Configure o arquivo .env com suas credenciais
echo 2. 📄 Adicione o arquivo credentials_sheet.json
echo 3. 📊 Configure sua planilha Google Sheets
echo 4. 🚀 Execute: npm start
echo.
echo 📚 Documentação completa no README.md
echo 🆘 Suporte: https://github.com/seu-usuario/whatsapp-bot-barbearia/issues
echo.
echo 💈 Bom trabalho! 🚀
echo.
pause
