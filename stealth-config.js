// USER AGENTS REALÍSTICOS PARA ROTAÇÃO
const USER_AGENTS = [
    // Chrome Linux (mais comum em servidores)
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
    
    // Chrome Windows (para variar)
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    
    // Firefox Linux
    'Mozilla/5.0 (X11; Linux x86_64; rv:132.0) Gecko/20100101 Firefox/132.0',
    'Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0'
];

// FUNÇÃO PARA OBTER USER AGENT ALEATÓRIO
function getRandomUserAgent() {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// CONFIGURAÇÕES DE VIEWPORT REALÍSTICAS
const VIEWPORTS = [
    { width: 1920, height: 1080, deviceScaleFactor: 1 },
    { width: 1366, height: 768, deviceScaleFactor: 1 },
    { width: 1440, height: 900, deviceScaleFactor: 1 },
    { width: 1536, height: 864, deviceScaleFactor: 1 }
];

function getRandomViewport() {
    return VIEWPORTS[Math.floor(Math.random() * VIEWPORTS.length)];
}

// DELAYS HUMANIZADOS
function getHumanDelay() {
    return Math.floor(Math.random() * 3000) + 2000; // 2-5 segundos
}

module.exports = {
    getRandomUserAgent,
    getRandomViewport,
    getHumanDelay,
    USER_AGENTS,
    VIEWPORTS
};
