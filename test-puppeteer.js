// Teste básico do Puppeteer para verificar se Chrome funciona
const puppeteer = require('puppeteer');

console.log('🔍 Testando Puppeteer básico...');

async function testPuppeteer() {
    let browser;
    try {
        console.log('📱 Iniciando browser...');
        
        browser = await puppeteer.launch({
            headless: "new", // Usar novo headless mode
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--single-process',
                '--no-zygote',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
                '--disable-extensions',
                '--disable-plugins',
                '--disable-default-apps'
            ],
            executablePath: '/usr/bin/google-chrome-stable',
            timeout: 60000
        });
        
        console.log('✅ Browser iniciado com sucesso!');
        
        // Aguardar browser estar totalmente pronto
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const page = await browser.newPage();
        console.log('✅ Nova página criada!');
        
        // Configurar page antes de navegar
        await page.setDefaultTimeout(60000);
        await page.setDefaultNavigationTimeout(60000);
        
        // Aguardar página estar pronta
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('🌐 Navegando para Google...');
        
        // Tentar navegação com retry
        let success = false;
        for (let i = 0; i < 3; i++) {
            try {
                await page.goto('https://www.google.com', { 
                    waitUntil: 'domcontentloaded',
                    timeout: 30000 
                });
                success = true;
                break;
            } catch (navError) {
                console.log(`⚠️ Tentativa ${i + 1} falhou:`, navError.message);
                if (i < 2) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
        }
        
        if (!success) {
            throw new Error('Falha em todas as tentativas de navegação');
        }
        
        console.log('✅ Página carregada com sucesso!');
        
        const title = await page.title();
        console.log('✅ Título da página:', title);
        
        await browser.close();
        console.log('✅ Browser fechado com sucesso!');
        
        console.log('🎉 Puppeteer funciona perfeitamente!');
        
    } catch (error) {
        console.error('❌ Erro no teste Puppeteer:', error.message);
        console.error('Stack:', error.stack);
        
        // Garantir que browser seja fechado mesmo em erro
        if (browser) {
            try {
                await browser.close();
            } catch (closeError) {
                console.error('Erro ao fechar browser:', closeError.message);
            }
        }
    }
}

testPuppeteer();
