@echo off
echo 🚀 Iniciando Sistema de Agendamento Barbearia Santana...
echo.

echo 📱 Iniciando Bot WhatsApp...
start cmd /k "cd /d "%~dp0" && npm start"

echo ⏱️ Aguardando 3 segundos...
timeout /t 3 /nobreak >nul

echo 🌐 Iniciando Dashboard Web...
start cmd /k "cd /d "%~dp0Painelhtml" && node server.js"

echo.
echo ✅ Sistema iniciado com sucesso!
echo 📱 Bot WhatsApp: Terminal 1
echo 🌐 Dashboard Web: http://localhost:3000
echo.
pause
