@echo off
echo 🛑 Parando Sistema de Agendamento Barbearia Santana...
echo.

echo 🔍 Finalizando processos Node.js...
taskkill /f /im node.exe >nul 2>&1

echo 🔍 Finalizando processos CMD relacionados...
for /f "tokens=2" %%i in ('tasklist /fi "windowtitle eq *npm start*" /fo csv /nh 2^>nul') do (
    if not "%%i"=="INFO:" taskkill /f /pid %%i >nul 2>&1
)

for /f "tokens=2" %%i in ('tasklist /fi "windowtitle eq *server.js*" /fo csv /nh 2^>nul') do (
    if not "%%i"=="INFO:" taskkill /f /pid %%i >nul 2>&1
)

echo.
echo ✅ Sistema parado com sucesso!
echo 📱 Bot WhatsApp: Desconectado
echo 🌐 Dashboard Web: Offline
echo.
pause
