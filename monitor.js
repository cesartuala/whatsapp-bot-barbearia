// Monitor para WhatsApp Bot - Reinicia automaticamente em caso de problemas
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

let botProcess = null;
let restartCount = 0;
const MAX_RESTARTS = 10;
const RESTART_DELAY = 30000; // 30 segundos

// Função para iniciar o bot
function startBot() {
  console.log(`🚀 Iniciando bot (tentativa ${restartCount + 1}/${MAX_RESTARTS})...`);
  
  botProcess = spawn('node', ['index.js'], {
    stdio: 'inherit',
    cwd: __dirname
  });

  botProcess.on('close', (code) => {
    console.log(`🔴 Bot encerrado com código: ${code}`);
    
    if (code !== 0 && restartCount < MAX_RESTARTS) {
      restartCount++;
      console.log(`⏰ Reiniciando em ${RESTART_DELAY/1000} segundos...`);
      setTimeout(startBot, RESTART_DELAY);
    } else if (restartCount >= MAX_RESTARTS) {
      console.log(`❌ Máximo de reinicializações atingido (${MAX_RESTARTS})`);
      console.log('🛑 Parando monitor. Verifique os logs para problemas.');
      process.exit(1);
    } else {
      console.log('✅ Bot encerrado normalmente');
      process.exit(0);
    }
  });

  botProcess.on('error', (error) => {
    console.error('❌ Erro ao iniciar bot:', error.message);
    if (restartCount < MAX_RESTARTS) {
      restartCount++;
      setTimeout(startBot, RESTART_DELAY);
    }
  });
}

// Função para parar o bot
function stopBot() {
  if (botProcess) {
    console.log('🛑 Parando bot...');
    botProcess.kill('SIGTERM');
  }
}

// Handlers para sinais do sistema
process.on('SIGINT', () => {
  console.log('📟 SIGINT recebido - parando monitor...');
  stopBot();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('📟 SIGTERM recebido - parando monitor...');
  stopBot();
  process.exit(0);
});

// Reset contador de restarts a cada hora
setInterval(() => {
  if (restartCount > 0) {
    console.log('🔄 Resetando contador de restarts');
    restartCount = 0;
  }
}, 3600000); // 1 hora

console.log('🔍 Monitor do WhatsApp Bot iniciado');
console.log(`📊 Máximo de restarts: ${MAX_RESTARTS}`);
console.log(`⏰ Delay entre restarts: ${RESTART_DELAY/1000}s`);

// Iniciar o bot
startBot();
