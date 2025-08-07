
// Módulo de integração com Google Sheets
const { google } = require('googleapis');

let sheets;
let SPREADSHEET_ID;

async function initializeGoogleSheets() {
  try {
    console.log('🔐 Inicializando Google Sheets...');
    
    // Verifica se está em ambiente de produção (Google Cloud)
    if (process.env.GOOGLE_CREDENTIALS_BASE64 && process.env.SPREADSHEET_ID) {
      console.log('☁️ Detectado ambiente de produção - usando variáveis de ambiente');
      
      // Pega as credenciais das variáveis de ambiente
      const credentialsBase64 = process.env.GOOGLE_CREDENTIALS_BASE64;
      SPREADSHEET_ID = process.env.SPREADSHEET_ID;
      
      // Decodifica as credenciais
      const credentialsJson = Buffer.from(credentialsBase64, 'base64').toString();
      const credentials = JSON.parse(credentialsJson);
      
      // Configura autenticação
      const auth = new google.auth.GoogleAuth({
        credentials: credentials,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      });
      
      sheets = google.sheets({ version: "v4", auth });
      
    } else {
      console.log('💻 Detectado ambiente de desenvolvimento - usando arquivo local');
      
      // Ambiente de desenvolvimento - usa arquivo local
      const { SPREADSHEET_ID: localSpreadsheetId } = require('./config');
      SPREADSHEET_ID = localSpreadsheetId;
      
      const auth = new google.auth.GoogleAuth({
        keyFile: "./credentials_sheet.json",
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      });
      
      sheets = google.sheets({ version: "v4", auth });
    }
    
    console.log("✅ Google Sheets inicializado com sucesso!");
    console.log(`📊 Usando planilha: ${SPREADSHEET_ID}`);
    
    // Teste de conectividade
    await testConnection();
    
    return { sheets, SPREADSHEET_ID };
  } catch (error) {
    console.error("❌ Erro ao inicializar Google Sheets:", error);
    throw error;
  }
}

// Função para testar a conexão com a planilha
async function testConnection() {
  try {
    console.log('🧪 Testando conexão com a planilha...');
    const response = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });
    console.log(`✅ Conexão OK - Planilha: "${response.data.properties.title}"`);
  } catch (error) {
    console.error('❌ Erro no teste de conexão:', error.message);
    throw error;
  }
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
  initializeGoogleSheets,
  getServiceDescription,
  checkAvailability,
  getLastRowIndex,
  getSheetId,
  get sheets() { return sheets; },
  get SPREADSHEET_ID() { return SPREADSHEET_ID; }
};