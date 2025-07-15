const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto('https://www.google.com');
    console.log('Navegador funcionando corretamente');
    await browser.close();
})();
