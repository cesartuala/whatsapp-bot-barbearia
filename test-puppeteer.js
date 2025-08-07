// Teste básico do Puppeteer para verificar se Chrome funciona
const puppeteer = require('puppeteer');

console.log('🔍 Testando Puppeteer básico...');

async function testPuppeteer() {
    try {
        console.log('📱 Iniciando browser...');
        
        const browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--single-process',
                '--no-zygote',
                '--disable-web-security'
            ],
            executablePath: '/usr/bin/google-chrome-stable'
        });
        
        console.log('✅ Browser iniciado com sucesso!');
        
        const page = await browser.newPage();
        console.log('✅ Nova página criada!');
        
        await page.goto('https://www.google.com');
        console.log('✅ Página carregada com sucesso!');
        
        const title = await page.title();
        console.log('✅ Título da página:', title);
        
        await browser.close();
        console.log('✅ Browser fechado com sucesso!');
        
        console.log('🎉 Puppeteer funciona perfeitamente!');
        
    } catch (error) {
        console.error('❌ Erro no teste Puppeteer:', error.message);
        console.error('Stack:', error.stack);
    }
}

testPuppeteer();
