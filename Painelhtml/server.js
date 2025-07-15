const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const axios = require('axios'); // Use Axios for HTTP requests
const path = require('path');

const app = express();
const PORT = 3000;

// Replace with your Google Sheets API key
const API_KEY = 'AIzaSyDCj4r9vb7kqgVcJvQggPeiMKs__oFGaaU'; // Substitua pela chave fornecida
const SPREADSHEET_ID = '1cFBS4BsgJ02GyiFgiQ0VBN5zdFPvqY0f5bTCfBQJMLI';
const SHEET_NAME_DASHBOARD = 'Dashboard'; // Aba para o FullCalendar
const SHEET_NAME_GRAFICOS = 'Gráficos'; // Nova aba para os gráficos do dashboard

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: true,
}));

// Authentication middleware
const authMiddleware = (req, res, next) => {
  if (req.session.loggedIn) {
    return next();
  }
  res.redirect('/login');
};

// Login route
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if ((username === 'tuala' && password === 'senhamaster') || validateUser(username, password)) {
    req.session.loggedIn = true;
    res.redirect('/'); // Redireciona para o painel automaticamente após o login
  } else {
    res.send('Invalid login credentials');
  }
});

// Validate other users (to be implemented)
const validateUser = (username, password) => {
  return false;
};

// Dashboard route
app.get('/', authMiddleware, async (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// API to fetch data for FullCalendar (uses "Dashboard" sheet)
app.get('/api/sheet-data', authMiddleware, async (req, res) => {
  try {
    console.log('Fetching data from Google Sheets API for FullCalendar...');
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME_DASHBOARD}?key=${API_KEY}`;
    const response = await axios.get(url);

    if (!response.data || !response.data.values) {
      throw new Error('No data found in the sheet.');
    }

    const rows = response.data.values;
    console.log(`Fetched ${rows.length} rows from the sheet.`);

    // Process data for FullCalendar
    const headers = rows[0];
    const data = rows.slice(1).map(row => {
      const rowData = {};
      headers.forEach((header, index) => {
        rowData[header] = row[index] || '';
      });

      return {
        Mês: rowData['Mês'], // Coluna "Mês"
        Dia: rowData['Dia'], // Coluna "Dia"
        Profissional: rowData['Profissional'], // Coluna "Profissional"
        Serviço: rowData['Serviço'], // Coluna "Serviço"
        valor: parseFloat(rowData['Valor'] || 0), // Coluna "Valor"
        date: formatDate(rowData['Data']), // Coluna "Data"
        time: formatTime(rowData['Hora']), // Coluna "Hora"
        client: rowData['Cliente'], // Coluna "Cliente"
        phone: rowData['Telefone'] // Coluna "Telefone"
      };
    }).filter(event => event.Mês && event.Dia && event.Profissional && event.Serviço);

    console.log('Processed data for FullCalendar:', data);

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'No valid data found in the sheet.' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching data for FullCalendar:', error.message);
    res.status(500).json({ error: `Failed to fetch data: ${error.message}` });
  }
});

// API to fetch data for dashboard (uses "Gráficos" sheet)
app.get('/api/sheet-data-dashboard', authMiddleware, async (req, res) => {
  try {
    console.log('Fetching data for dashboard...');
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME_GRAFICOS}?key=${API_KEY}`;
    const response = await axios.get(url);

    if (!response.data || !response.data.values) {
      throw new Error('No data found in the sheet.');
    }

    const rows = response.data.values;
    console.log(`Fetched ${rows.length} rows from the sheet.`);

    // Process data for the dashboard
    const headers = rows[0];
    const data = rows.slice(1).map(row => {
      const rowData = {};
      headers.forEach((header, index) => {
        rowData[header] = row[index] || '';
      });

      return {
        Profissional: rowData['Profissional'], // Coluna "Profissional"
        Serviço: rowData['Serviço'], // Coluna "Serviço"
        Valor: parseFloat(rowData['Valor'].replace(/[^\d,-]/g, '').replace(',', '.')) || 0, // Coluna "Valor"
        Dia: rowData['Dia'], // Coluna "Dia"
        Mês: rowData['Mês'], // Coluna "Mês"
        Ano: rowData['Ano'], // Coluna "Ano"
        Data: `${rowData['Ano']}-${rowData['Mês'].padStart(2, '0')}-${rowData['Dia'].padStart(2, '0')}` // Formata a data como YYYY-MM-DD
      };
    }).filter(event => event.Data); // Filtra apenas linhas com data válida

    console.log('Filtered data for dashboard:', data);

    // Calcula a soma dos valores da coluna "Valor"
    const totalFaturamento = data.reduce((sum, item) => sum + item.Valor, 0);

    // Conta a quantidade de agendamentos (linhas válidas)
    const totalAgendamentos = data.length;

    // Soma os valores por dia
    const faturamentoPorDia = data.reduce((acc, item) => {
      const dia = item.Data; // Usa a data completa no formato YYYY-MM-DD
      acc[dia] = (acc[dia] || 0) + item.Valor;
      return acc;
    }, {});

    // Conta os agendamentos por dia
    const agendamentosPorDia = data.reduce((acc, item) => {
      const dia = item.Data; // Usa a data completa no formato YYYY-MM-DD
      acc[dia] = (acc[dia] || 0) + 1;
      return acc;
    }, {});

    // Conta os serviços e suas quantidades
    const servicos = data.reduce((acc, item) => {
      const servico = item.Serviço;
      if (servico) {
        acc[servico] = (acc[servico] || 0) + 1;
      }
      return acc;
    }, {});

    // Conta os atendimentos por profissional
    const profissionais = data.reduce((acc, item) => {
      const profissional = item.Profissional;
      if (profissional) {
        acc[profissional] = (acc[profissional] || 0) + 1;
      }
      return acc;
    }, {});

    console.log('Total Faturamento:', totalFaturamento);
    console.log('Total Agendamentos:', totalAgendamentos);
    console.log('Faturamento por Dia:', faturamentoPorDia);
    console.log('Agendamentos por Dia:', agendamentosPorDia);
    console.log('Serviços:', servicos);
    console.log('Profissionais:', profissionais);

    res.json({ 
      totalFaturamento, 
      totalAgendamentos, 
      faturamentoPorDia, 
      agendamentosPorDia, 
      servicos, 
      profissionais,
      rawData: data // Adiciona os dados brutos para os filtros
    }); // Retorna os dados necessários
  } catch (error) {
    console.error('Error fetching data for dashboard:', error.message);
    res.status(500).json({ error: `Failed to fetch data: ${error.message}` });
  }
});

// Helper functions to format date and time
function formatDate(date) {
  try {
    const [day, month] = date.split('/'); // Extrai o dia e o mês
    const year = new Date().getFullYear(); // Obtém o ano atual
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`; // Retorna no formato YYYY-MM-DD
  } catch (error) {
    console.error('Error formatting date:', date, error.message);
    return null;
  }
}

function formatTime(time) {
  try {
    return time.length === 5 ? time : time.slice(0, 5); // Ensure HH:mm format
  } catch (error) {
    console.error('Error formatting time:', time, error.message);
    return null;
  }
}

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
