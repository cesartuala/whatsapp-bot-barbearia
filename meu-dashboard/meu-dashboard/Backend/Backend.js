console.log('Iniciando o servidor...');

const express = require('express');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();
console.log('Variáveis de ambiente carregadas');

const app = express();

// Configurar CORS para evitar problemas de requisição
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Configurar para servir arquivos estáticos da pasta Frontend
app.use(express.static(path.join(__dirname, '../Frontend')));

async function acessarPlanilha() {
    try {
        console.log('Conectando à planilha...');
        const doc = new GoogleSpreadsheet(process.env.SPREADSHEET_ID);
        await doc.useServiceAccountAuth({
            client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        });
        await doc.loadInfo();
        console.log('Planilha carregada com sucesso');

        const sheet = doc.sheetsByIndex[0];
        const rows = await sheet.getRows();
        console.log(`Número de linhas na planilha: ${rows.length}`);
        return rows.map(row => row._rawData);
    } catch (error) {
        console.error('Erro ao acessar a planilha:', error);
        throw error;
    }
}

// Rota para servir o arquivo HTML principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../Frontend/index.html'));
});

app.get('/dados', async (req, res) => {
    try {
        const dados = await acessarPlanilha();
        res.json(dados);
    } catch (error) {
        console.error('Erro ao obter dados da planilha:', error);
        res.status(500).send('Erro ao obter dados da planilha.');
    }
});

app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
    console.log('Acesse http://localhost:3000 para ver o dashboard');
});