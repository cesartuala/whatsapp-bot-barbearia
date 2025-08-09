#!/bin/bash
# Diagnóstico completo do ambiente

echo "🔍 DIAGNÓSTICO COMPLETO DO AMBIENTE"
echo "=================================="

echo -e "\n📋 1. INFORMAÇÕES DO SISTEMA:"
echo "OS: $(cat /etc/os-release | grep PRETTY_NAME | cut -d'=' -f2 | tr -d '\"')"
echo "Kernel: $(uname -r)"
echo "Arquitetura: $(uname -m)"

echo -e "\n📋 2. CHROME/CHROMIUM:"
echo "Chrome version:"
google-chrome --version 2>/dev/null || echo "❌ Chrome não encontrado"
echo "Chrome path: $(which google-chrome-stable 2>/dev/null || echo '❌ Não encontrado')"
echo "Chromium version:"
chromium --version 2>/dev/null || echo "❌ Chromium não encontrado"
echo "Chromium path: $(which chromium 2>/dev/null || echo '❌ Não encontrado')"

echo -e "\n📋 3. NODE.JS E NPM:"
echo "Node.js: $(node --version)"
echo "NPM: $(npm --version)"

echo -e "\n📋 4. DEPENDÊNCIAS SISTEMA:"
echo "Verificando bibliotecas essenciais..."
libs=("libnss3" "libatk-bridge2.0-0" "libdrm2" "libxkbcommon0" "libxcomposite1" "libxdamage1" "libxrandr2" "libgbm1" "libxss1" "libasound2")
for lib in "${libs[@]}"; do
    if dpkg -l | grep -q "^ii.*$lib"; then
        echo "✅ $lib instalado"
    else
        echo "❌ $lib NÃO instalado"
    fi
done

echo -e "\n📋 5. XVFB (DISPLAY VIRTUAL):"
echo "Display atual: $DISPLAY"
if pgrep -f Xvfb > /dev/null; then
    echo "✅ Xvfb rodando"
else
    echo "❌ Xvfb não está rodando"
fi

echo -e "\n📋 6. PROCESSOS CHROME:"
chrome_procs=$(ps aux | grep -E "(chrome|chromium)" | grep -v grep | wc -l)
echo "Processos Chrome/Chromium ativos: $chrome_procs"
if [ $chrome_procs -gt 0 ]; then
    echo "Processos encontrados:"
    ps aux | grep -E "(chrome|chromium)" | grep -v grep | awk '{print "  PID: " $2 " - " $11}'
fi

echo -e "\n📋 7. MEMÓRIA E RECURSOS:"
echo "Memória:"
free -h | head -2
echo "Disk space:"
df -h / | tail -1

echo -e "\n📋 8. NETWORK:"
echo "Conectividade internet:"
if ping -c 1 8.8.8.8 &> /dev/null; then
    echo "✅ Internet OK"
else
    echo "❌ Sem internet"
fi

echo "Conectividade WhatsApp:"
if curl -s --max-time 5 https://web.whatsapp.com > /dev/null; then
    echo "✅ WhatsApp Web acessível"
else
    echo "❌ WhatsApp Web não acessível"
fi

echo -e "\n📋 9. WHATSAPP WEB.JS:"
if [ -f "package.json" ]; then
    echo "WhatsApp Web.js version:"
    npm list whatsapp-web.js 2>/dev/null | grep whatsapp-web.js || echo "❌ Não instalado"
    echo "Puppeteer version:"
    npm list puppeteer 2>/dev/null | grep puppeteer || echo "❌ Não encontrado"
else
    echo "❌ package.json não encontrado"
fi

echo -e "\n🎯 RECOMENDAÇÕES:"
echo "=================================="

# Verificar versão do Chrome
chrome_version=$(google-chrome --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+' | head -1)
if [ ! -z "$chrome_version" ]; then
    major_version=$(echo $chrome_version | cut -d'.' -f1)
    if [ $major_version -gt 130 ]; then
        echo "⚠️ Chrome muito novo ($chrome_version) - recomendado Chrome 120-130"
        echo "💡 Execute: ./install-chrome-compatible.sh"
    else
        echo "✅ Versão do Chrome compatível ($chrome_version)"
    fi
fi

# Verificar Xvfb
if [ -z "$DISPLAY" ] || [ "$DISPLAY" = ":0" ]; then
    echo "⚠️ Display não configurado para headless"
    echo "💡 Execute: export DISPLAY=:99"
fi

# Verificar dependências
missing_libs=()
for lib in "${libs[@]}"; do
    if ! dpkg -l | grep -q "^ii.*$lib"; then
        missing_libs+=("$lib")
    fi
done

if [ ${#missing_libs[@]} -gt 0 ]; then
    echo "⚠️ Bibliotecas faltando: ${missing_libs[*]}"
    echo "💡 Execute: sudo apt install -y ${missing_libs[*]}"
fi

echo -e "\n🚀 PRÓXIMOS PASSOS:"
echo "1. Corrigir problemas encontrados acima"
echo "2. Executar: node test-basic.js"
echo "3. Se falhar: ./install-chrome-compatible.sh"
