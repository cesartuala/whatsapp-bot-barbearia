#!/usr/bin/env node

// Script para testar diferentes versões do WhatsApp Web.js
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");

console.log('🧪 TESTE DE VERSÃO WHATSAPP WEB.JS');
console.log('==================================');

// Configuração ultra-simples para teste
const client = new Client({
    authStrategy: new LocalAuth({
        clientId: "test-version"
    }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        timeout: 60000
    }
});

// Eventos básicos para teste
client.on('qr', (qr) => {
    console.log('✅ QR CODE GERADO!');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('🟢 WHATSAPP CONECTADO!');
    console.log('📱 Versão funcionando corretamente!');
});

client.on('authenticated', () => {
    console.log('🔐 AUTENTICADO COM SUCESSO!');
});

client.on('auth_failure', () => {
    console.log('❌ FALHA NA AUTENTICAÇÃO');
});

client.on('disconnected', () => {
    console.log('🔌 DESCONECTADO');
});

// Inicializar
console.log('🚀 Iniciando teste...');
client.initialize().catch(err => {
    console.error('❌ Erro:', err.message);
});

// Timeout de segurança
setTimeout(() => {
    console.log('⏰ Timeout - encerrando teste');
    process.exit(0);
}, 120000);
