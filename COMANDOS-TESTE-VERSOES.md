# COMANDOS PARA TESTAR VERSÕES MANUALMENTE

## No Google Cloud VM, execute estes comandos um por vez:

# ===============================
# TESTE VERSÃO 1.18.4 (Mais estável)
# ===============================
echo "🧪 Testando versão 1.18.4..."
npm install whatsapp-web.js@1.18.4 --save
rm -rf whatsapp-session/
rm -rf .wwebjs_*
export DISPLAY=:99 && timeout 60s node test-version.js

# ===============================
# TESTE VERSÃO 1.19.5 (LTS)
# ===============================
echo "🧪 Testando versão 1.19.5..."
npm install whatsapp-web.js@1.19.5 --save
rm -rf whatsapp-session/
rm -rf .wwebjs_*
export DISPLAY=:99 && timeout 60s node test-version.js

# ===============================
# TESTE VERSÃO 1.21.0 (Intermediária)
# ===============================
echo "🧪 Testando versão 1.21.0..."
npm install whatsapp-web.js@1.21.0 --save
rm -rf whatsapp-session/
rm -rf .wwebjs_*
export DISPLAY=:99 && timeout 60s node test-version.js

# ===============================
# TESTE VERSÃO 1.23.0 (Mais recente testada)
# ===============================
echo "🧪 Testando versão 1.23.0..."
npm install whatsapp-web.js@1.23.0 --save
rm -rf whatsapp-session/
rm -rf .wwebjs_*
export DISPLAY=:99 && timeout 60s node test-version.js

# ===============================
# VERIFICAR QUAL VERSÃO ESTÁ INSTALADA
# ===============================
npm list whatsapp-web.js

# ===============================
# SE UMA VERSÃO FUNCIONAR, ATUALIZAR package.json
# ===============================
# Exemplo: se a versão 1.18.4 funcionar:
# npm install whatsapp-web.js@1.18.4 --save

# ===============================
# SINAIS DE SUCESSO:
# ===============================
# ✅ QR CODE GERADO! 
# ✅ QR aparece no terminal
# 🟢 WHATSAPP CONECTADO!

# ===============================
# SINAIS DE FALHA:
# ===============================
# ❌ Timeout após 60s
# ❌ Erro de Protocol error
# ❌ Erro de Session closed
