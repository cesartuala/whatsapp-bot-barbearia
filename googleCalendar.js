
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Caminho para salvar o token
const TOKEN_PATH = path.join(__dirname, 'token.json');

// Função para autenticar com o Google OAuth2
async function authenticateGoogle() {
    const credentials = JSON.parse(fs.readFileSync(path.join(__dirname, 'credentials.json')));

    const { client_id, client_secret, redirect_uris } = credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    // Verifica se o token já foi salvo
    if (fs.existsSync(TOKEN_PATH)) {
        const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
        oAuth2Client.setCredentials(token);
        if (!token.access_token || !token.expiry_date || Date.now() > token.expiry_date) {
            console.error('Token expirado ou inválido. Inicie a autenticação novamente.');
            fs.unlinkSync(TOKEN_PATH); // Remove o token inválido
            throw new Error('Token expirado ou inválido.');
        }
        return oAuth2Client;
    }

    // Gera URL de autenticação
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/calendar'],
    });
    console.log('Autorize este aplicativo acessando esta URL:', authUrl);

    // Solicita o código do usuário
    return new Promise((resolve, reject) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        rl.question('Insira o código da URL aqui: ', (code) => {
            rl.close();
            oAuth2Client.getToken(code, (err, token) => {
                if (err) {
                    console.error('Erro ao buscar o token:', err.response?.data?.error_description || err.message);
                    reject('Erro ao autenticar. Certifique-se de usar o código correto e dentro do prazo de validade.');
                    return;
                }
                oAuth2Client.setCredentials(token);
                // Salva o token para futuras execuções
                fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
                console.log('Token salvo em:', TOKEN_PATH);
                resolve(oAuth2Client);
            });
        });
    });
}

// Função para verificar a disponibilidade no Google Calendar
async function checkAvailability(auth, startDateTime, endDateTime) {
    const calendar = google.calendar({ version: 'v3', auth });
    const response = await calendar.freebusy.query({
        requestBody: {
            timeMin: startDateTime.toISOString(),
            timeMax: endDateTime.toISOString(),
            items: [{ id: 'primary' }],
        },
    });

    const busyTimes = response.data.calendars.primary.busy;
    return busyTimes.length === 0; // Retorna true se não houver conflitos
}

// Função para criar um evento no Google Calendar
async function createEvent(auth, eventDetails) {
    const calendar = google.calendar({ version: 'v3', auth });

    const event = {
        summary: eventDetails.summary,
        description: eventDetails.description || '',
        start: {
            dateTime: eventDetails.start.toISOString(),
            timeZone: 'America/Sao_Paulo',
        },
        end: {
            dateTime: eventDetails.end.toISOString(),
            timeZone: 'America/Sao_Paulo',
        },
    };

    try {
        const response = await calendar.events.insert({
            calendarId: 'primary', // Pode substituir pelo ID de um calendário específico
            resource: event,
        });
        console.log('Evento criado com sucesso:', response.data);
        return response.data;
    } catch (err) {
        console.error('Erro ao criar evento:', err.message || err);
        throw err;
    }
}

module.exports = {
    authenticateGoogle,
    checkAvailability,
    createEvent,
};
