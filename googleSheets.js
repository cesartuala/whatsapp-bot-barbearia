
// Módulo de integração com Google Sheets
const { google } = require('googleapis');
const { SPREADSHEET_ID } = require('./config');

// Autenticação Google API
const auth = new google.auth.GoogleAuth({
  keyFile: './credentials_sheet.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

let sheets;
try {
  sheets = google.sheets({ version: 'v4', auth });
} catch (error) {
  console.error('googleSheets.js: Erro ao autenticar com a Google API:', error);
  throw error;
}

// Função para buscar a descrição do serviço na planilha
async function getServiceDescription(serviceCode) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Serviços!A:B',
    });
    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.warn('getServiceDescription: Nenhuma linha encontrada na aba Serviços.');
      return null;
    }
    for (const row of rows) {
      const [code, description] = row;
      if (code === serviceCode) {
        return description;
      }
    }
    console.warn(`getServiceDescription: Descrição não encontrada para o código: ${serviceCode}`);
    return null;
  } catch (error) {
    console.error('getServiceDescription: Erro ao buscar descrição do serviço:', error);
    return null;
  }
}

// Função para verificar disponibilidade de agendamento
async function checkAvailability(date, time, professional) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Agendamentos!C3:H',
    });
    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return true;
    }
    for (const row of rows) {
      const [appointmentDate, appointmentTime, , , , appointmentProfessional] = row;
      if (
        typeof date === 'string' &&
        typeof time === 'string' &&
        typeof professional === 'string'
      ) {
        if (
          date === appointmentDate &&
          time === appointmentTime &&
          professional === appointmentProfessional
        ) {
          return false;
        }
      }
    }
    return true;
  } catch (error) {
    console.error('checkAvailability: Erro ao verificar disponibilidade:', error);
    return false;
  }
}

// Função para obter o índice da última linha preenchida em uma aba
async function getLastRowIndex(sheetName) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:A`,
    });
    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return 2;
    }
    return rows.length + 1;
  } catch (error) {
    console.error(`getLastRowIndex: Erro ao obter a última linha da aba ${sheetName}:`, error);
    throw error;
  }
}

// Função para pegar o sheetId correto
async function getSheetId(sheetName) {
  const metadata = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
  });
  const sheet = metadata.data.sheets.find((s) => s.properties.title === sheetName);
  return sheet.properties.sheetId;
}

module.exports = {
  sheets,
  getServiceDescription,
  checkAvailability,
  getLastRowIndex,
  getSheetId,
};