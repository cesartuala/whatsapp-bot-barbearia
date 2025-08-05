// Importação de módulos necessários
const { google } = require("googleapis");
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const axios = require('axios'); // Certifique-se de ter o Axios instalado
console.log("index.js: Importações de módulos concluídas.");

// Function to check the connection and try to reconnect if needed
const checkAndReconnect = () => {
  console.log("checkAndReconnect: Checking if the client is connected...");
  if (!client.authStrategy.loggedIn) reconnectClient();
};

// Configuração da autenticação com a Google API
const auth = new google.auth.GoogleAuth({
  keyFile: "./credentials_sheet.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

let sheets;
try {
  // Sheets API initialization
  sheets = google.sheets({ version: "v4", auth });
  console.log("index.js: Autenticação com a Google API bem-sucedida.");
} catch (error) {
  console.error("index.js: Erro ao autenticar com a Google API:", error);
  process.exit(1);
}

// ID da planilha no Google Sheets
const SPREADSHEET_ID = "1j3h1WgCZVO9KmiqmmQTeJn0OlIuQhg-Q6ZQfw-PIWWA";

// Estado global para rastrear informações dos clientes
console.log("index.js: Variáveis globais inicializadas.");
const state = {};
// Lista fixa de horários disponíveis
const availableTimes = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
];
// Função para normalizar texto
console.log("index.js: Funções auxiliares definidas.");
const normalizeText = (text) => {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
};

// Função para normalizar texto do horario
const normalizeTime = (time) => {
  return time.replace("h", "").trim();
};
// Função para capitalizar a primeira letra de uma string
const capitalizeFirstLetter = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};
// Função para formatar a data no formato dd/mm
const formatDate = (dateString) => {
  console.log("formatDate: Data recebida para formatar:", dateString);
    // Verifica se a data está no formato DD/MM/AAAA
    if (dateString.includes('/')) {
        const parts = dateString.split('/');
        if (parts.length === 3) {
            const [day, month, year] = parts;
            if (!isNaN(parseInt(day)) && !isNaN(parseInt(month)) && !isNaN(parseInt(year)) && day.length === 2 && month.length === 2 && year.length === 4) {
                // Retorna no formato DD/MM
                const formattedDate = `${day}/${month}`;
                console.log("formatDate: Data formatada:", formattedDate);
                return formattedDate;
            }
        } else if (parts.length === 2){
            const [day, month] = parts;
             if (!isNaN(parseInt(day)) && !isNaN(parseInt(month)) && day.length === 2 && month.length === 2) {
                // Retorna no formato DD/MM
                console.log("formatDate: Data ja esta formatada:", dateString);
                return dateString;
            }
        }
    }
    // Caso a data não esteja no formato esperado
    console.error('O formato de data informado é inválido: ', dateString);
    return null;
};

// Função para buscar a descrição do serviço na planilha
const getServiceDescription = async (serviceCode) => {
  console.log(
    "getServiceDescription: Iniciando busca para o código:",
    serviceCode
  );
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Serviços!A:B", // Ler as colunas A e B da aba "Serviços"
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.warn(
        "getServiceDescription: Nenhuma linha encontrada na aba 'Serviços'."
      );
      return null;
    }

    // Percorre as linhas para encontrar o serviço correspondente
    for (const row of rows) {
      const [code, description] = row; // Assume que a primeira coluna é o código e a segunda é a descrição
      if (code === serviceCode) {
        console.log(
          `getServiceDescription: Descrição encontrada para ${code}: ${description}`
        );
        return description; // Retorna a descrição se o código for encontrado
      }
    }
    console.warn(
      `getServiceDescription: Descrição não encontrada para o código: ${serviceCode}`
    );
    return null; // Returns null if the code is not found
  } catch (error) {
    console.error(
      "getServiceDescription: Erro de rede ao buscar descrição do serviço:",
      error
    );
    return null;
  }
};

// Função para verificar a disponibilidade do agendamento
const checkAvailability = async (date, time, professional) => {
  console.log(
    `checkAvailability: Verificando disponibilidade para ${date} às ${time} com ${professional}`
  );
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Agendamentos!C3:H", // Data, Hora, Cliente, Serviço, Profissional
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log(
        `checkAvailability: Nenhum agendamento encontrado para ${date} às ${time} com ${professional}.`
      );
      console.log(`checkAvailability: Nenhum agendamento encontrado.`);
      return true; // Nenhum agendamento, então está disponível
    }

    for (const row of rows) {
      const [
        appointmentDate, // Coluna C: Data
        appointmentTime, // Coluna D: Hora
        clientName, // Coluna E: Cliente
        phoneNumber, // Coluna F: Telefone - corrigido
        service, // Coluna G: Serviço - corrigido
        appointmentProfessional, // Coluna H: Profissional - corrigido
      ] = row;

      console.log(
        `checkAvailability: Comparando com a linha: Data=${appointmentDate}, Hora=${appointmentTime}, Profissional=${appointmentProfessional}`
      );

      // Valida se o profissional do agendamento é o mesmo
      if (
        typeof date === "string" &&
        typeof time === "string" &&
        typeof professional === "string"
      ) {
        // Valida se o texto digitado e o texto recebido na planilha é o mesmo
        if (
          date === appointmentDate &&
          time === appointmentTime &&
          professional === appointmentProfessional
        ) {
          console.warn(
            `checkAvailability: Conflito de agendamento encontrado: ${date} às ${time} com ${professional}`
          );
          return false; // Conflito encontrado
        }
      }
    }
    console.log(
      `checkAvailability: Nenhum conflito encontrado para ${date} às ${time} com ${professional}`
    );
    return true; // Nenhum conflito
  } catch (error) {
    console.error(
      "checkAvailability: Erro de rede ao verificar disponibilidade:",
      error
    );
    return false; // Assume indisponível em caso de erro
  }
};
// Function to reconnect the client
const reconnectClient = async () => {
  console.log("reconnectClient: Attempting to reconnect...");
  try {
    await client.destroy();
    console.log("reconnectClient: Client destroyed.");
    await client.initialize();
    console.log("reconnectClient: Client reinitialized.");
  } catch (error) {
    console.error("reconnectClient: Failed to reconnect:", error);
  }
};
// Inicializa o cliente do WhatsApp com suporte à persistência de sessão
const client = new Client({
  authStrategy: new LocalAuth(),
  qrRefreshS: 0,
  puppeteer: {
    executablePath: '/home/cesartuala/.cache/puppeteer/chrome/linux_arm-138.0.7204.157/chrome-linux64/chrome',
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--single-process",
      "--disable-gpu",
      "--disable-web-security",
      "--disable-features=VizDisplayCompositor",
    ],
  },
});
// Nova função para obter o índice da última linha preenchida em uma aba
const getLastRowIndex = async (sheetName) => {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:A`, // Lê somente a primeira coluna para economizar recursos
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log(
        `getLastRowIndex: Nenhum dado encontrado na aba "${sheetName}"!. Retornando o valor 2`
      );
      return 2; // Se não houver linhas, retorna 2 (a primeira linha de dados é a 2)
    }
    const foundLastRowIndex = rows.length + 1;
    console.log(
      `getLastRowIndex: Foi encontrado o numero da ultima linha, o numero é: `,
      foundLastRowIndex
    );
    return foundLastRowIndex; // Retorna o índice da última linha + 1, pois queremos a próxima linha vazia. Adiciona mais um por causa do header.
  } catch (error) {
    console.error(
      `getLastRowIndex: Erro ao obter a última linha da aba "${sheetName}":`,
      error
    );
    throw error; // Re-lança o erro para ser tratado na função chamadora
  }
};

// Função para salvar agendamento na aba "Agendamentos"
const saveAppointmentToSheet = async (appointmentData) => {
  console.log("saveAppointmentToSheet: Iniciando com:", appointmentData);
  try {
    const {
      contactDate,
      contactTime,
      appointmentDateToShow,
      appointmentTime,
      clientName,
      serviceCode, // Agora recebemos o código do serviço
      professional,
      phoneNumber,
    } = appointmentData;

    // Busca a descrição do serviço com base no código
    const serviceDescription = await getServiceDescription(serviceCode);
    if (!serviceDescription) {
      throw new Error(`Código de serviço inválido: ${serviceCode}`);
    }

    // Formata a data de contato para DD/MM/AAAA
    const formattedContactDate = contactDate.toLocaleDateString("pt-BR", {
      timeZone: "America/Sao_Paulo",
    });

    // Formata a hora de contato para HH:MM (fuso horário do Brasil)
    const formattedContactTime = contactTime.toLocaleTimeString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour12: false, // Usa formato de 24 horas
      hour: "2-digit",
      minute: "2-digit",
    });

    // Formata a data do agendamento para DD/MM
    const formattedAppointmentDate = formatDate(appointmentDateToShow);
    if (!formattedAppointmentDate) {
      throw new Error(
        `O formato da data digitada é inválido! A data digitada foi ${appointmentDateToShow}`
      );
    }

    // Remove '55' e '@c.us' do phoneNumber
    const formattedPhoneNumber = phoneNumber
      .replace("55", "")
      .replace("@c.us", "");

    // Capitaliza a primeira letra do nome do profissional
    const capitalizedProfessional = capitalizeFirstLetter(professional);

    console.log("saveAppointmentToSheet: Dados recebidos:", {
      contactDate,
      contactTime,
      appointmentDateToShow,
      appointmentTime,
      clientName,
      serviceDescription, // Usa a descrição do serviço
      capitalizedProfessional,
      phoneNumber,
    });

    // Define a ordem correta dos valores para as colunas
    const values = [
      formattedContactDate, // Data Contato (A)
      formattedContactTime, // Hora Contato (B)
      formattedAppointmentDate, // Data (C)
      appointmentTime, // Hora (D)
      clientName, // Cliente (E)
      formattedPhoneNumber, // Telefone (F)
      serviceDescription, // Serviço (G) - Descrição do serviço
      capitalizedProfessional, // Profissional (H)
    ];

    console.log(
      "saveAppointmentToSheet: Valores a serem inseridos na planilha:",
      values
    );

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Agendamentos!A:H",
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [values],
      },
    });

    if (!response.data) {
      console.error(
        "Erro: Ocorreu um erro na inserção na planilha. Resposta sem dados:",
        response
      );
    } else {
      console.log("saveAppointmentToSheet: Agendamento salvo com sucesso!");

      // Agendar envio da mensagem de avaliação após 3 horas
      const reviewDelay = 3 * 60 * 60 * 1000; // 3 horas em milissegundos
      setTimeout(() => {
        sendReviewRequest(phoneNumber, clientName);
      }, reviewDelay);
    }
  } catch (error) {
    console.error(
      "saveAppointmentToSheet: Erro ao salvar o agendamento na planilha:",
      error.message
    );
  }
};

// Função para adicionar um delay (atraso)
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// Função para enviar mensagem com delay
async function sendMessageWithDelay(chatId, message, delayMs = 2000) {
  try {
    console.log(
      `sendMessageWithDelay: Enviando mensagem para ${chatId}: ${message}`
    );
    await client.sendMessage(chatId, message);
    console.log(`sendMessageWithDelay: Mensagem enviada para ${chatId}`);
    await delay(delayMs); // Espera por `delayMs` milissegundos antes de continuar
  } catch (error) {
    console.error("Erro ao enviar mensagem com delay:", error);
  }
}

// Função para buscar respostas na planilha
const getResponseForStep = async (step, receivedText, professional = null) => {
  console.log(
    `Buscando resposta para a etapa: ${step}, texto recebido: ${receivedText}, profissional: ${professional}`
  );

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Respostas Automáticas!A:D", // A: Step, B: Profissional, C: Data, D: Resposta
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) return null;

    for (const row of rows) {
      const [stepName, professionalName, date, responseMessage] = row;

      if (stepName === "Horário") {
        // Aplica as condições especiais para a etapa "Horário"
        if (
          stepName === step && // Condição para a etapa
          normalizeText(professionalName) === normalizeText(professional) && // Condição para o profissional
          normalizeText(date) === normalizeText(receivedText) // Condição para a data (DD/MM)
        ) {
          console.log(
            `Resposta encontrada para a etapa ${step}: ${responseMessage}`
          );
          return responseMessage; // Retorna a resposta correta para "Horário"
        }
      } else {
        // Condição para as outras etapas
        if (
          stepName === step && // Condição para a etapa
          normalizeText(date) === normalizeText(receivedText) // Condição para o texto recebido
        ) {
          console.log(
            `Resposta encontrada para a etapa ${step}: ${responseMessage}`
          );
          return responseMessage; // Retorna a resposta correta para outras etapas
        }
      }
    }

    console.warn(
      `Nenhuma resposta encontrada para a etapa: ${step}, texto recebido: ${receivedText}, profissional: ${professional}`
    );
    return null; // Retorna null se nenhuma correspondência for encontrada
  } catch (error) {
    console.error(
      "Erro ao buscar a resposta para a etapa na planilha:",
      error
    );
    return null;
  }
};


// Função para verificar se o cliente já possui um agendamento
const checkExistingAppointment = async (phoneNumber) => {
  console.log(
    `checkExistingAppointment: Verificando agendamento para o telefone: ${phoneNumber}`
  );
  try {
    // Obtemos os dados da planilha a partir da linha 3
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Agendamentos!C3:H", // Data, Hora, Cliente, Telefone, Serviço, Profissional
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log(
        `checkExistingAppointment: Nenhum agendamento encontrado na planilha.`
      );
      return null;
    }

    // Obtém a data e hora atuais
    const now = new Date();

    // Remove '55' e '@c.us' do phoneNumber do contato que está iniciando a conversa
    const formattedPhoneNumber = phoneNumber
      .replace("55", "")
      .replace("@c.us", "");

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const [
        appointmentDate, // Coluna C: Data
        appointmentTime, // Coluna D: Hora
        clientName, // Coluna E: Cliente
        clientPhoneNumber, // Coluna F: Telefone
        service, // Coluna G: Serviço
        professional, // Coluna H: Profissional
      ] = row;
      // Verifica se o telefone do cliente corresponde ao telefone na planilha
      if (formattedPhoneNumber === clientPhoneNumber) {
        // Corrige a formatação da data para funcionar com o formato "dd/mm"
        const [day, month] = appointmentDate.split("/");
        const currentYear = now.getFullYear(); // Obtém o ano atual

        // Formata a data completa para "dd/mm/yyyy"
        const formattedAppointmentDate = `${day}/${month}/${currentYear}`;

        // Converte a data e hora do agendamento para objetos Date
        const [hours, minutes] = appointmentTime.split(":");
        const appointmentDateTime = new Date(
          currentYear,
          parseInt(month) - 1,
          parseInt(day),
          parseInt(hours),
          parseInt(minutes)
        );

        console.log(
          `checkExistingAppointment: Agendamento Encontrado, Data e hora do agendamento: ${appointmentDateTime}, data e hora atual ${now}`
        );

        // Verifica se o agendamento é futuro
        if (appointmentDateTime > now) {
          console.log(
            `checkExistingAppointment: Agendamento futuro encontrado para ${phoneNumber}:`,
            appointmentDate, // Usa a data formatada
            appointmentTime
          );

          // Corrigido: Ajustar índice da linha para refletir a linha real na planilha
          const foundRowIndex = i + 3; // Linha começa em C3, precisa somar +3

          console.log(
            `checkExistingAppointment: Retornando rowIndex ${foundRowIndex} para o agendamento.`
          );

          // Retorna os dados do agendamento e o índice da linha
          return {
            rowIndex: foundRowIndex,
            appointmentDate: appointmentDate, // Retorna a data recebida da planilha no formato dd/mm
            appointmentTime,
            clientName,
            service,
            professional,
            contactDate: "",
            contactTime: "",
          };
        }
      }
    }

    console.log(
      `checkExistingAppointment: Nenhum agendamento futuro encontrado para ${phoneNumber}.`
    );
    return null; // Nenhum agendamento futuro encontrado
  } catch (error) {
    console.error(
      "checkExistingAppointment: Erro ao verificar agendamento:",
      error
    );
    return null; // Assume que não há agendamento em caso de erro
  }
};

//Função para pegar o sheetId correto
const getSheetId = async (sheetName) => {
  const metadata = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
  });
  const sheet = metadata.data.sheets.find((s) => s.properties.title === sheetName);
  return sheet.properties.sheetId;
};

// Nova função para cancelar o agendamento
const cancelAppointment = async (chatId, rowIndex, clientName, autoReason = null) => {
  console.log(
    `cancelAppointment: Iniciando cancelamento para o cliente: ${chatId} na linha ${rowIndex}`
  );
  try {
    console.log(`cancelAppointment: O rowIndex recebido é ${rowIndex}.`);

    // Inicializa o estado do cliente, se necessário
    if (!state[chatId]) {
      console.warn(
        `cancelAppointment: Estado do cliente ${chatId} não encontrado. Inicializando...`
      );
      state[chatId] = { step: "Motivo do Cancelamento", clientName };
    }

    console.log(
      `cancelAppointment: Deletando a linha ${rowIndex} na aba "Agendamentos"`
    );

    // Copia a linha para a aba "Cancelados"
    await copyRowToCancelled(rowIndex);

    // Deleta a linha do agendamento na aba "Agendamentos"
    const sheetId = await getSheetId("Agendamentos");

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheetId,
                dimension: "ROWS",
                startIndex: rowIndex - 1,
                endIndex: rowIndex,
              },
            },
          },
        ],
      },
    });

    console.log(
      `cancelAppointment: Agendamento na linha ${rowIndex} deletado com sucesso da aba "Agendamentos"!`
    );

    // Preenche automaticamente o motivo do cancelamento, se fornecido
    if (autoReason) {
      console.log(
        `cancelAppointment: Preenchendo motivo do cancelamento automaticamente: "${autoReason}"`
      );
      await saveCancellationReason(chatId, autoReason);
    } else {
      // Solicita o motivo do cancelamento ao cliente
      await sendMessageWithDelay(
        chatId,
        "Por favor, digite em poucas palavras o *motivo do cancelamento*.",
        2000
      );

      // Atualiza o estado do cliente
      state[chatId].cancelRowIndex = rowIndex;
    }
  } catch (error) {
    console.error(
      `cancelAppointment: Erro ao cancelar o agendamento na linha ${rowIndex}:`,
      error
    );
    await sendMessageWithDelay(
      chatId,
      "Ocorreu um erro ao processar o cancelamento. Por favor, tente novamente mais tarde.",
      2000
    );
  }
};

// Nova função para copiar uma linha de "Agendamentos" para "Cancelados"
const copyRowToCancelled = async (rowIndex) => {
  console.log(`copyRowToCancelled: Copiando linha ${rowIndex} para aba "Cancelados"`);
  try {
    // Obter os dados da linha na aba "Agendamentos"
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `Agendamentos!A${rowIndex}:H${rowIndex}`, // Corrigido para pegar toda a linha até a coluna H
    });

    const rowData = response.data.values[0]; // Pegar o array da linha (contém todas as celulas)
    if (!rowData) {
      throw new Error(`copyRowToCancelled: Nenhum dado encontrado na linha ${rowIndex} da aba "Agendamentos"`);
    }

    console.log(`copyRowToCancelled: Dados da linha ${rowIndex}: `, rowData);

    // Encontrar a próxima linha vazia na aba "Cancelados"
    const nextRow = await getLastRowIndex("Cancelados");

    // Copiar os dados para a próxima linha vazia da aba "Cancelados"
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Cancelados!A${nextRow}:H${nextRow}`,
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [rowData],
      },
    });

    console.log(`copyRowToCancelled: Linha ${rowIndex} copiada com sucesso para a aba "Cancelados" na linha ${nextRow}`);
    return;
  } catch (error) {
    console.error(`copyRowToCancelled: Erro ao copiar a linha ${rowIndex} para a aba "Cancelados":`, error);
    throw error; // Re-lança o erro para ser tratado na função chamadora
  }
};

// Nova função para salvar o motivo do cancelamento
const saveCancellationReason = async (chatId, reason) => {
  console.log(`saveCancellationReason: Salvando o motivo do cancelamento: ${reason} para o cliente ${chatId}.`);

  try {
    // Obtenha todos os valores da aba "Cancelados"
    const sheetData = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Cancelados!J:J', // Pegue todas as linhas da coluna J
    });

    // Encontre a primeira linha livre
    const rows = sheetData.data.values || []; // Garante que rows seja um array válido
    const firstEmptyRow = rows.length + 1; // A próxima linha após as existentes

    // Salva o motivo do cancelamento na primeira linha livre da coluna J
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Cancelados!J${firstEmptyRow}`, // Define a célula na primeira linha livre
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [[reason]], // Valor a ser inserido
      },
    });

    console.log(`saveCancellationReason: Motivo do cancelamento salvo na linha ${firstEmptyRow}.`);

    // Envia mensagem de confirmação
    await sendMessageWithDelay(
      chatId,
      "Seu agendamento foi *cancelado* com sucesso.\nPara um *novo agendamento*, por favor envie a palavra *AGENDAMENTO*.",
      2000
    );

    // Remove o estado da conversa do cliente
    delete state[chatId];
  } catch (error) {
    console.error(`saveCancellationReason: Erro ao salvar o motivo do cancelamento:`, error);
    await sendMessageWithDelay(
      chatId,
      "Ocorreu um erro ao salvar o motivo do cancelamento. Por favor, tente novamente mais tarde.",
      2000
    );
  }
};

// Função para enviar a agenda de uma data específica
const sendAgendaForDate = async (chatId, date) => {
  console.log(`sendAgendaForDate: Iniciando envio da agenda para a data ${date}...`);

  try {
    // Obtemos os dados da planilha a partir da linha 3
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Agendamentos!C3:H", // Data, Hora, Cliente, Serviço, Profissional
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log("sendAgendaForDate: Nenhum agendamento encontrado na planilha.");
      await sendMessageWithDelay(chatId, "Nenhum agendamento encontrado.", 2000);
      return;
    }

    // Filtra os agendamentos para a data especificada
    const appointmentsForDate = rows.filter(
      ([appointmentDate]) => appointmentDate === date
    );

    if (appointmentsForDate.length === 0) {
      console.log(`sendAgendaForDate: Nenhum agendamento encontrado para a data ${date}.`);
      await sendMessageWithDelay(
        chatId,
        `Não temos agendamentos para a data ${date}.`,
        2000
      );
      return;
    }

    // Monta a mensagem da agenda para a data especificada
    let agendaMessage = `Aqui está a agenda para o dia ${date}:\n\n`;
    appointmentsForDate.forEach(
      ([, appointmentTime, clientName, , service, professional]) => {
        agendaMessage += `${appointmentTime}, ${professional} - ${service} - ${clientName}\n`;
      }
    );
    agendaMessage += "\nObrigado!";

    // Envia a mensagem para o número que solicitou
    await sendMessageWithDelay(chatId, agendaMessage, 2000);

    console.log(`sendAgendaForDate: Agenda para a data ${date} enviada com sucesso!`);
  } catch (error) {
    console.error(`sendAgendaForDate: Erro ao enviar a agenda para a data ${date}:`, error);
    await sendMessageWithDelay(
      chatId,
      "Ocorreu um erro ao buscar a agenda. Por favor, tente novamente mais tarde.",
      2000
    );
  }
};

// Função para incluir agendamento diretamente na planilha
const includeAppointmentDirectly = async (chatId, appointmentData) => {
  console.log("includeAppointmentDirectly: Iniciando com:", appointmentData);
  try {
    const {
      contactDate,
      contactTime,
      appointmentDateToShow,
      appointmentTime,
      clientName,
      serviceCode,
      professional,
      phoneNumber,
    } = appointmentData;

    // Busca a descrição do serviço com base no código
    const serviceDescription = await getServiceDescription(serviceCode);
    if (!serviceDescription) {
      throw new Error(`Código de serviço inválido: ${serviceCode}`);
    }

    // Formata a data de contato para DD/MM/AAAA
    const formattedContactDate = contactDate.toLocaleDateString("pt-BR", {
      timeZone: "America/Sao_Paulo",
    });

    // Formata a hora de contato para HH:MM (fuso horário do Brasil)
    const formattedContactTime = contactTime.toLocaleTimeString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });

    // Formata a data do agendamento para DD/MM
    const formattedAppointmentDate = formatDate(appointmentDateToShow);
    if (!formattedAppointmentDate) {
      throw new Error(
        `O formato da data digitada é inválido! A data digitada foi ${appointmentDateToShow}`
      );
    }

    // Remove '55' e '@c.us' do phoneNumber
    const formattedPhoneNumber = phoneNumber
      .replace("55", "")
      .replace("@c.us", "");

    // Capitaliza a primeira letra do nome do profissional
    const capitalizedProfessional = capitalizeFirstLetter(professional);

    console.log("includeAppointmentDirectly: Dados recebidos:", {
      contactDate,
      contactTime,
      appointmentDateToShow,
      appointmentTime,
      clientName,
      serviceDescription,
      capitalizedProfessional,
      phoneNumber,
    });

    // Define a ordem correta dos valores para as colunas
    const values = [
      formattedContactDate, // Data Contato (A)
      formattedContactTime, // Hora Contato (B)
      formattedAppointmentDate, // Data (C)
      appointmentTime, // Hora (D)
      clientName, // Cliente (E)
      formattedPhoneNumber, // Telefone (F)
      serviceDescription, // Serviço (G)
      capitalizedProfessional, // Profissional (H)
    ];

    console.log(
      "includeAppointmentDirectly: Valores a serem inseridos na planilha:",
      values
    );

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Agendamentos!A:H",
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [values],
      },
    });

    if (!response.data) {
      console.error(
        "Erro: Ocorreu um erro na inserção na planilha. Resposta sem dados:",
        response
      );
    } else {
      console.log("includeAppointmentDirectly: Agendamento incluído com sucesso!");
      await sendMessageWithDelay(
        chatId,
        `Agendamento incluído com sucesso! 🎉\n\n📅 Data: *${formattedAppointmentDate}*\n⏰ Hora: *${appointmentTime}*\n👤 Cliente: *${clientName}*\n💇‍♂️ Serviço: *${serviceDescription}*\n✂️ Profissional: *${capitalizedProfessional}*\n\nObrigado por nos escolher!\n💈 *BARBEARIA SANTANA* 💈`,
        2000
      );
    }
  } catch (error) {
    console.error(
      "includeAppointmentDirectly: Erro ao incluir o agendamento na planilha:",
      error.message
    );
    await sendMessageWithDelay(
      chatId,
      "Ocorreu um erro ao incluir o agendamento. Por favor, tente novamente mais tarde.",
      2000
    );
  }
};

// Função para bloquear uma data na aba "Datas Bloqueadas/Feriados"
const blockDate = async (chatId, date) => {
  console.log(`blockDate: Iniciando bloqueio da data ${date}...`);

  try {
    // Formata a data para DD/MM
    const formattedDate = formatDate(date);
    if (!formattedDate) {
      console.error("blockDate: Data inválida recebida:", date);
      await sendMessageWithDelay(
        chatId,
        "O formato de data está inválido. Por favor, envie no formato:\n\nBloquear Data:\nDD/MM",
        2000
      );
      return;
    }

    // Verifica se a data já está bloqueada
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Datas Bloqueadas/Feriados!A:A", // Lê a coluna A
    });

    const rows = response.data.values || [];
    const isAlreadyBlocked = rows.some(([blockedDate]) => blockedDate === formattedDate);

    if (isAlreadyBlocked) {
      console.log(`blockDate: A data ${formattedDate} já está bloqueada.`);
      await sendMessageWithDelay(
        chatId,
        `A data *${formattedDate}* já está bloqueada.`,
        2000
      );
      return;
    }

    // Adiciona a data na próxima linha vazia da aba "Datas Bloqueadas/Feriados"
    const nextRow = rows.length + 1;
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Datas Bloqueadas/Feriados!A${nextRow}`,
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [[formattedDate]],
      },
    });

    console.log(`blockDate: Data ${formattedDate} bloqueada com sucesso.`);
    await sendMessageWithDelay(
      chatId,
      `A data *${formattedDate}* foi bloqueada com sucesso!`,
      2000
    );
  } catch (error) {
    console.error(`blockDate: Erro ao bloquear a data ${date}:`, error);
    await sendMessageWithDelay(
      chatId,
      "Ocorreu um erro ao bloquear a data. Por favor, tente novamente mais tarde.",
      2000
    );
  }
};

// Função para bloquear horários específicos na aba "Concatenar"
const blockTimeRange = async (chatId, date, startTime, endTime, professional) => {
  console.log(`blockTimeRange: Iniciando bloqueio de horários para ${date} de ${startTime} até ${endTime} para o profissional ${professional}...`);

  try {
    // Formata a data para DD/MM
    const formattedDate = formatDate(date);
    if (!formattedDate) {
      console.error("blockTimeRange: Data inválida recebida:", date);
      await sendMessageWithDelay(
        chatId,
        "O formato de data está inválido. Por favor, envie no formato:\n\nBloquear Horário:\nDD/MM\nHH:MM (início)\nHH:MM (término)\nProfissional",
        2000
      );
      return;
    }

    // Normaliza os horários
    const normalizedStartTime = normalizeTime(startTime);
    const normalizedEndTime = normalizeTime(endTime);

    // Valida os horários
    if (!availableTimes.includes(normalizedStartTime) || !availableTimes.includes(normalizedEndTime)) {
      console.error("blockTimeRange: Horários inválidos recebidos:", { startTime, endTime });
      await sendMessageWithDelay(
        chatId,
        "Os horários informados estão inválidos. Por favor, envie no formato correto:\n\nBloquear Horário:\nDD/MM\nHH:MM (início)\nHH:MM (término)\nProfissional",
        2000
      );
      return;
    }

    // Converte os horários para objetos Date para manipulação
    const [startHour, startMinute] = normalizedStartTime.split(":").map(Number);
    const [endHour, endMinute] = normalizedEndTime.split(":").map(Number);
    const startDateTime = new Date(2000, 0, 1, startHour, startMinute); // Data fictícia para cálculo
    const endDateTime = new Date(2000, 0, 1, endHour, endMinute);

    if (startDateTime >= endDateTime) {
      console.error("blockTimeRange: O horário inicial é maior ou igual ao horário final.");
      await sendMessageWithDelay(
        chatId,
        "O horário inicial deve ser menor que o horário final. Por favor, envie no formato correto:\n\nBloquear Horário:\nDD/MM\nHH:MM (início)\nHH:MM (término)\nProfissional",
        2000
      );
      return;
    }

    // Gera os horários a serem bloqueados
    const blockedTimes = [];
    let currentTime = startDateTime;
    while (currentTime <= endDateTime) {
      const hours = currentTime.getHours().toString().padStart(2, "0");
      const minutes = currentTime.getMinutes().toString().padStart(2, "0");
      blockedTimes.push(`${formattedDate}${hours}:${minutes}${professional}`);
      currentTime.setMinutes(currentTime.getMinutes() + 30); // Incrementa 30 minutos
    }

    console.log("blockTimeRange: Horários gerados para bloqueio:", blockedTimes);

    // Obtém a próxima linha vazia na coluna E da aba "Concatenar"
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Concatenar!E:E", // Lê a coluna E
    });

    const rows = response.data.values || [];
    const nextRow = rows.length + 1;

    // Preenche os horários na planilha
    const values = blockedTimes.map((time) => [time]); // Cada horário em uma linha
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Concatenar!E${nextRow}:E${nextRow + values.length - 1}`,
      valueInputOption: "USER_ENTERED",
      resource: {
        values,
      },
    });

    console.log("blockTimeRange: Horários bloqueados com sucesso.");
    await sendMessageWithDelay(
      chatId,
      `Os horários de *${normalizedStartTime}* até *${normalizedEndTime}* na data *${formattedDate}* para o profissional *${professional}* foram bloqueados com sucesso!`,
      2000
    );
  } catch (error) {
    console.error("blockTimeRange: Erro ao bloquear os horários:", error);
    await sendMessageWithDelay(
      chatId,
      "Ocorreu um erro ao bloquear os horários. Por favor, tente novamente mais tarde.",
      2000
    );
  }
};

// Event listener for disconnected event
client.on("disconnected", (reason) => {
  console.error("client.on('disconnected'): WhatsApp desconectado:", reason);
  reconnectClient();
  checkAndReconnect();
});

// Event listener for authentication failure
client.on("auth_failure", (msg) => {
  console.error("client.on('auth_failure'): Falha na autenticação:", msg);
  checkAndReconnect();
});
// Evento para gerar o QR Code
client.on("qr", (qr) => {
  console.log("QR Code gerado! Escaneie com o WhatsApp para conectar.");
  qrcode.generate(qr, { small: true });
});

// Evento para indicar que o cliente está pronto
client.on("ready", () => {
  console.log("✅ WhatsApp conectado com sucesso!");
});

// Evento para lidar com mensagens recebidas
client.on("message", async (message) => {
  try {
    const chatId = message.from;
    if (chatId.includes("@g.us")) {
      console.log("Mensagem de grupo detectada:", message.body);
      return; // Ignora mensagens vindas de grupos
    }

    console.log('Evento "message" disparado com a mensagem:', message.body);

    const clientName = message._data?.notifyName || "Cliente"; // Puxa o nome do cliente automaticamente
    const receivedText = message.body;
    let initialResponse = null;

    // Verifica se a mensagem é para incluir um agendamento diretamente
    if (receivedText.startsWith("Incluir")) {
      const lines = receivedText.split("\n").filter((line) => line.trim() !== ""); // Remove linhas vazias
      console.log("Incluir: Linhas extraídas da mensagem:", lines);

      if (lines.length === 6 && lines[0] === "Incluir:") {
        const [_, clientLine, dateLine, timeLine, serviceLine, professionalLine] = lines;

        // Extrai os dados da mensagem
        const formattedDate = formatDate(dateLine.trim());
        const normalizedTime = normalizeTime(timeLine.trim());
        const serviceCode = serviceLine.trim();
        const professional = capitalizeFirstLetter(professionalLine.trim());

        console.log("Incluir: Dados extraídos:", {
          clientName: clientLine,
          formattedDate,
          normalizedTime,
          serviceCode,
          professional,
        });

        // Valida os dados
        if (!formattedDate || !normalizedTime) {
          console.error("Incluir: Dados inválidos detectados:", {
            formattedDate,
            normalizedTime,
          });
          await sendMessageWithDelay(
            chatId,
            "O formato de data ou horário está inválido. Por favor, envie no formato correto:\n\nIncluir:\nCliente\nDD/MM\nHH:MM\nCódigo do Serviço\nProfissional",
            2000
          );
          return;
        }

        // Inclui o agendamento diretamente na planilha
        const appointmentData = {
          contactDate: new Date(),
          contactTime: new Date(),
          appointmentDateToShow: formattedDate,
          appointmentTime: normalizedTime,
          clientName: clientLine,
          serviceCode,
          professional,
          phoneNumber: chatId,
        };

        await includeAppointmentDirectly(chatId, appointmentData);
        return;
      } else {
        console.error("Incluir: Número de linhas incorreto:", lines.length);
        await sendMessageWithDelay(
          chatId,
          "O formato da mensagem está incorreto. Por favor, envie no formato correto:\n\nIncluir:\nCliente\nDD/MM\nHH:MM\nCódigo do Serviço\nProfissional",
          2000
        );
        return;
      }
    }

    // Verifica se a mensagem é para agendar
    if (receivedText.startsWith("Agendar")) {
      const lines = receivedText.split("\n").filter((line) => line.trim() !== ""); // Remove linhas vazias
      console.log("Agendar: Linhas extraídas da mensagem:", lines);

      if (lines.length === 6 && lines[0] === "Agendar:") {
        const [_, clientLine, dateLine, timeLine, serviceLine, professionalLine] = lines;

        // Extrai os dados da mensagem
        const formattedDate = formatDate(dateLine.trim());
        const normalizedTime = normalizeTime(timeLine.trim());
        const serviceCode = serviceLine.trim(); // Agora espera o código do serviço
        const professional = capitalizeFirstLetter(professionalLine.trim());

        console.log("Agendar: Dados extraídos:", {
          clientName: clientLine, // Apenas armazena o texto enviado
          formattedDate,
          normalizedTime,
          serviceCode,
          professional,
        });

        // Busca a descrição do serviço com base no código
        const serviceDescription = await getServiceDescription(serviceCode);
        if (!serviceDescription) {
          console.error("Agendar: Código de serviço inválido:", serviceCode);
          await sendMessageWithDelay(
            chatId,
            "O código do serviço informado é inválido. Por favor, envie um código válido conforme a tabela de serviços.",
            2000
          );
          return;
        }

        // Valida os dados
        if (!formattedDate || !availableTimes.includes(normalizedTime)) {
          console.error("Agendar: Dados inválidos detectados:", {
            formattedDate,
            normalizedTime,
          });
          await sendMessageWithDelay(
            chatId,
            "O formato de data ou horário está inválido. Por favor, envie no formato correto:\n\nAgendar:\nCliente\nDD/MM\nHH:MM\nCódigo do Serviço\nProfissional",
            2000
          );
          return;
        }

        // Verifica disponibilidade
        const isAvailable = await checkAvailability(
          formattedDate,
          normalizedTime,
          professional
        );

        if (!isAvailable) {
          await sendMessageWithDelay(
            chatId,
            `O horário *${normalizedTime}* na data *${formattedDate}* já está reservado para o profissional *${professional}*. Por favor, escolha outro horário.`,
            2000
          );
          return;
        }

        // Salva o agendamento
        const appointmentData = {
          contactDate: new Date(),
          contactTime: new Date(),
          appointmentDateToShow: formattedDate,
          appointmentTime: normalizedTime,
          clientName: clientLine, // Apenas armazena o texto enviado
          serviceCode: // Usa o código do serviço
          professional,
          phoneNumber: chatId,
        };

        try {
          await saveAppointmentToSheet(appointmentData);
          await sendMessageWithDelay(
            chatId,
            `Agendamento confirmado! 🎉\n\n📅 Data: *${formattedDate}*\n⏰ Hora: *${normalizedTime}*\n👤 Cliente: *${clientLine}*\n💇‍♂️ Serviço: *${serviceDescription}*\n✂️ Profissional: *${professional}*\n\nObrigado por nos escolher!\n💈 *BARBEARIA SANTANA* 💈`,
            2000
          );
        } catch (error) {
          console.error("Erro ao salvar o agendamento:", error);
          await sendMessageWithDelay(
            chatId,
            "Ocorreu um erro ao salvar o agendamento. Por favor, tente novamente mais tarde.",
            2000
          );
        }
        return;
      } else {
        console.error("Agendar: Número de linhas incorreto:", lines.length);
        await sendMessageWithDelay(
          chatId,
          "O formato da mensagem está incorreto. Por favor, envie no formato correto:\n\nAgendar:\nCliente\nDD/MM\nHH:MM\nCódigo do Serviço\nProfissional",
          2000
        );
        return;
      }
    }

    // Verifica se a mensagem é para cancelar
    if (receivedText.startsWith("Cancelar")) {
      const lines = receivedText.split("\n").filter((line) => line.trim() !== ""); // Remove linhas vazias
      console.log("Cancelar: Linhas extraídas da mensagem:", lines);

      if (lines.length === 4 && lines[0] === "Cancelar:") {
        const [_, dateLine, timeLine, professionalLine] = lines;

        // Formata a data e horário
        const formattedDate = formatDate(dateLine.trim());
        const normalizedTime = normalizeTime(timeLine.trim());
        const professional = capitalizeFirstLetter(professionalLine.trim());

        console.log("Cancelar: Dados extraídos:", {
          formattedDate,
          normalizedTime,
          professional,
        });

        // Valida os dados
        if (!formattedDate || !availableTimes.includes(normalizedTime)) {
          console.error("Cancelar: Dados inválidos detectados:", {
            formattedDate,
            normalizedTime,
          });
          await sendMessageWithDelay(
            chatId,
            "O formato de data ou horário está inválido. Por favor, envie no formato correto:\n\nCancelar:\nDD/MM\nHH:MM\nProfissional",
            2000
          );
          return;
        }

        try {
          // Busca o agendamento correspondente
          const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: "Agendamentos!C3:H", // Data, Hora, Cliente, Serviço, Profissional
          });

          const rows = response.data.values;
          if (!rows || rows.length === 0) {
            console.log("Cancelar: Nenhum agendamento encontrado na planilha.");
            await sendMessageWithDelay(
              chatId,
              "Nenhum agendamento encontrado para os dados fornecidos.",
              2000
            );
            return;
          }

          // Procura o agendamento correspondente
          let rowIndex = null;
          for (let i = 0; i < rows.length; i++) {
            const [appointmentDate, appointmentTime, , , , appointmentProfessional] = rows[i];
            if (
              appointmentDate === formattedDate &&
              appointmentTime === normalizedTime &&
              appointmentProfessional === professional
            ) {
              rowIndex = i + 3; // Ajusta o índice para refletir a linha real na planilha
              break;
            }
          }

          if (!rowIndex) {
            console.log("Cancelar: Agendamento não encontrado.");
            await sendMessageWithDelay(
              chatId,
              "Nenhum agendamento encontrado para os dados fornecidos.",
              2000
            );
            return;
          }

          console.log(`Cancelar: Agendamento encontrado na linha ${rowIndex}.`);

          // Cancela o agendamento com motivo automático
          await cancelAppointment(chatId, rowIndex, clientName, "cancelado pelo usuário");
        } catch (error) {
          console.error("Cancelar: Erro ao processar o cancelamento:", error);
          await sendMessageWithDelay(
            chatId,
            "Ocorreu um erro ao processar o cancelamento. Por favor, tente novamente mais tarde.",
            2000
          );
        }
        return;
      } else {
        console.error("Cancelar: Número de linhas incorreto ou formato inválido.");
        await sendMessageWithDelay(
          chatId,
          "O formato da mensagem está incorreto. Por favor, envie no formato correto:\n\nCancelar:\nDD/MM\nHH:MM\nProfissional",
          2000
        );
        return;
      }
    }

    // Verifica se a mensagem é para solicitar a agenda de uma data específica
    if (receivedText.startsWith("Agenda do dia")) {
      const date = receivedText.replace("Agenda do dia", "").trim(); // Extrai a data do texto
      const formattedDate = formatDate(date); // Formata a data para DD/MM
      if (!formattedDate) {
        console.error("sendAgendaForDate: Data inválida recebida:", date);
        await sendMessageWithDelay(
          chatId,
          "O formato de data está inválido. Por favor, envie no formato: Agenda do dia DD/MM.",
          2000
        );
        return;
      }

      // Envia a agenda para a data especificada
      await sendAgendaForDate(chatId, formattedDate);
      return;
    }

    // Verifica se a mensagem é para bloquear uma data
    if (receivedText.startsWith("Bloquear Data:")) {
      const date = receivedText.replace("Bloquear Data:", "").trim(); // Extrai a data do texto
      await blockDate(chatId, date);
      return;
    }

    // Verifica se a mensagem é para bloquear um horário
    if (receivedText.startsWith("Bloquear Horário:")) {
      const lines = receivedText.split("\n").filter((line) => line.trim() !== ""); // Remove linhas vazias
      console.log("Bloquear Horário: Linhas extraídas da mensagem:", lines);

      if (lines.length === 5 && lines[0] === "Bloquear Horário:") { // Corrigido para 5 linhas
        const [_, dateLine, startTimeLine, endTimeLine, professionalLine] = lines;

        // Extrai os dados da mensagem
        const date = dateLine.trim();
        const startTime = startTimeLine.trim();
        const endTime = endTimeLine.trim();
        const professional = capitalizeFirstLetter(professionalLine.trim());

        console.log("Bloquear Horário: Dados extraídos:", {
          date,
          startTime,
          endTime,
          professional,
        });

        // Chama a função para bloquear os horários
        await blockTimeRange(chatId, date, startTime, endTime, professional);
        return;
      } else {
        console.error("Bloquear Horário: Formato inválido ou número de linhas incorreto.");
        await sendMessageWithDelay(
          chatId,
          "O formato da mensagem está incorreto. Por favor, envie no formato:\n\nBloquear Horário:\nDD/MM\nHH:MM (início)\nHH:MM (término)\nProfissional",
          2000
        );
        return;
      }
    }

    // Verifica se a mensagem é igual a `AGENDAMENTO` e se o state foi deletado
    if (normalizeText(receivedText) === "agendamento" && !state[chatId]) {
      // Verifica se o cliente possui um agendamento
      const existingAppointment = await checkExistingAppointment(chatId);
      if (existingAppointment) {
        state[chatId] = existingAppointment; // Salva o agendamento do cliente no state
        const { appointmentDate, appointmentTime, service, professional, rowIndex } = existingAppointment;

        // Atualiza o nome do cliente no estado, caso esteja disponível
        state[chatId].clientName = existingAppointment.clientName || clientName;

        await sendMessageWithDelay(
          chatId,
          `Olá *${state[chatId].clientName}*, encontramos um agendamento para você. \n\n📅 Data: *${appointmentDate}*\n⏰ Hora: *${appointmentTime}*\n💇‍♂️ Serviço: *${service}*\n✂️ Profissional: *${professional}*\n\nDigite *CANCELAR* para cancelar ou *NOVO* para realizar um novo agendamento.`,
          2000
        );
        state[chatId].step = "Agendamento Encontrado";
        return;
      }

      // Redefine a etapa para "Mensagem Inicial"
      state[chatId] = { step: "Mensagem Inicial", clientName };
      const greeting = `💈 *BARBEARIA SANTANA* 💈\n\nOlá *${clientName}*, vou lhe ajudar com o seu agendamento.`;
      await sendMessageWithDelay(chatId, greeting, 2000);

      initialResponse = await getResponseForStep("Mensagem Inicial", "");
      if (initialResponse) {
        await sendMessageWithDelay(chatId, initialResponse, 2000);
      }
      return;
    }

    // Verifica se é a primeira mensagem do cliente
    if (!state[chatId]) {
      // Verifica se o cliente possui um agendamento
      const existingAppointment = await checkExistingAppointment(chatId);
      if (existingAppointment) {
          state[chatId] = existingAppointment; // salva o agendamento do cliente no state.
          const { appointmentDate, appointmentTime, clientName, service, professional, rowIndex } = existingAppointment;
            await sendMessageWithDelay(
              chatId,
             `Olá *${clientName}*, encontramos um agendamento para você. \n\n📅 Data: *${appointmentDate}*\n⏰ Hora: *${appointmentTime}*\n💇‍♂️ Serviço: *${service}*\n✂️ Profissional: *${professional}*\n\nDigite *CANCELAR* para cancelar ou *NOVO* para realizar um novo agendamento.`,
              2000
            );
          state[chatId].step = "Agendamento Encontrado";
          return;
      }
      const greeting = `💈 *BARBEARIA SANTANA* 💈\n\nOlá *${clientName}*, vou lhe ajudar com o seu agendamento.`;
      await sendMessageWithDelay(chatId, greeting, 2000);

      initialResponse = await getResponseForStep("Mensagem Inicial", "");
      if (initialResponse) {
        await sendMessageWithDelay(chatId, initialResponse, 2000);
      }
      state[chatId] = { step: "Mensagem Inicial" };
      return;
    }
    
        // Verifica se o cliente está no step `Agendamento Encontrado`
        if (state[chatId]?.step === "Agendamento Encontrado") {
            // se o cliente responder cancelar, faz o cancelamento.
            if(normalizeText(receivedText) === 'cancelar'){
            const clientRowIndex = state[chatId].rowIndex; // pega o index correto
            await cancelAppointment(chatId, clientRowIndex, clientName);
            return;
            }
            // se o cliente responder novo, remove o state para um novo agendamento
            if(normalizeText(receivedText) === 'novo'){
                delete state[chatId];
                const greeting = `💈 *BARBEARIA SANTANA* 💈\n\nOlá *${clientName}*, vou lhe ajudar com o seu agendamento.`;
                await sendMessageWithDelay(chatId, greeting, 2000);
    
                // Redefine a etapa para "Mensagem Inicial"
                state[chatId] = { step: "Mensagem Inicial" };
    
                // Busca a resposta da mensagem inicial e envia
                initialResponse = await getResponseForStep("Mensagem Inicial", "");
                if (initialResponse) {
                    await sendMessageWithDelay(chatId, initialResponse, 2000);
                }
                return;
            }
            // caso o cliente responda outra coisa
            await sendMessageWithDelay(
                chatId,
                'Desculpe, não entendi. Digite *CANCELAR* para cancelar o agendamento ou *NOVO* para fazer um novo agendamento.',
                2000
            );
            return;
        }
        // Verifica se o cliente está na etapa "Motivo do Cancelamento"
        if (state[chatId]?.step === "Motivo do Cancelamento") {
          const cancellationReason = receivedText;
          const clientRowIndex = state[chatId].cancelRowIndex;
          await saveCancellationReason(chatId, cancellationReason, clientRowIndex);
          return; // Sai da função após salvar o motivo
        }
        // verifica se o cliente quer cancelar o agendamento
        if (normalizeText(receivedText) === "cancelar") {
          const clientRowIndex = state[chatId].rowIndex; // pega o index correto
          console.log(`client.on('message'): O rowIndex a ser usado é ${clientRowIndex}`); // LOG 3
          if (clientRowIndex === undefined) {
            console.error(
              "O rowIndex é undefined, não é possível cancelar o agendamento."
            );
            await sendMessageWithDelay(
              chatId,
              "Ocorreu um erro ao processar o cancelamento. Por favor, tente novamente mais tarde.",
              2000
            );
            return;
          }
          await cancelAppointment(chatId, clientRowIndex, clientName);
          return;
        }
        // verifica se o cliente quer realizar um novo agendamento
        if (normalizeText(receivedText) === "novo") {
          delete state[chatId];
          const greeting = `💈 *BARBEARIA SANTANA* 💈\n\nOlá *${clientName}*, vou lhe ajudar com o seu agendamento.`;
          await sendMessageWithDelay(chatId, greeting, 2000);
    
          // Redefine a etapa para "Mensagem Inicial"
          state[chatId] = { step: "Mensagem Inicial" };
    
          // Busca a resposta da mensagem inicial e envia
          initialResponse = await getResponseForStep("Mensagem Inicial", "");
          if (initialResponse) {
            await sendMessageWithDelay(chatId, initialResponse, 2000);
          }
          return;
        }

    // Verifica se o cliente deseja voltar
    if (normalizeText(receivedText) === "voltar") {
      if (state[chatId]) {
        // Lógica para voltar um passo
        if (state[chatId].step === "Confirmação") {
          state[chatId].step = "Horário";
          await sendMessageWithDelay(chatId, "Ok, vamos voltar para a escolha do *HORÁRIO*.\nQual horário você quer escolher?\n\nEnvie no formaro *HH:MM* Exemplo:*00:00*.", 2000);
          return;
        } else if (state[chatId].step === "Horário") {
          state[chatId].step = "Data";
          await sendMessageWithDelay(chatId, "Ok, vamos voltar para a escolha da *DATA*.\nQual data você quer escolher?\n\nEnvie no formaro *DD/MM* Exemplo:*23/03*.", 2000);
          return;
        } else if (state[chatId].step === "Data") {
          state[chatId].step = "Profissionais";
          await sendMessageWithDelay(chatId, "Ok, vamos voltar para a escolha do *PROFISSIONAL*.\nQual profissional você quer escolher?\n\nEnvie o *nome do profissional*.", 2000);
          return;
        } else if (state[chatId].step === "Profissionais") {
          state[chatId].step = "Mensagem Inicial";
          await sendMessageWithDelay(chatId, "Ok, vamos voltar para a escolha do *SERVIÇO*.\nQual o serviço você quer escolher?\n\nEnvie o *número* que indica o serviço.", 2000);
          return;
        } else {
          await sendMessageWithDelay(chatId, "Você está no início do processo de agendamento.", 2000);
          return;
        }
      } else {
        await sendMessageWithDelay(chatId, "Você ainda não iniciou o processo de agendamento.", 2000);
        return;
      }
    }

    if (normalizeText(receivedText) === "inicio") {
      delete state[chatId]; // Limpa o estado do cliente
      await sendMessageWithDelay(chatId, "Ok, vamos reiniciar o processo de agendamento.", 2000);
      const greeting = `💈 *BARBEARIA SANTANA* 💈\n\nOlá *${clientName}*, vou lhe ajudar com o seu agendamento.`;
      await sendMessageWithDelay(chatId, greeting, 2000);
      initialResponse = await getResponseForStep("Mensagem Inicial", "");
      if (initialResponse) {
        await sendMessageWithDelay(chatId, initialResponse, 2000);
      }
      return; // Encerra a execução para recomeçar o fluxo
    }

    // Verifica se o cliente já está em um fluxo (state existe) e se já concluiu o fluxo
    if (state[chatId] && state[chatId].step === "Concluido") {
      console.log(
        `Mensagem recebida de ${chatId}, mas fluxo ja foi concluido. Ignorando.`
      );
      return;
    }

        // Verifica se o cliente está na etapa "Mensagem Inicial"
    if (state[chatId] && state[chatId].step === "Mensagem Inicial") {
      console.log(
        `Processando etapa "Mensagem Inicial" para o chat ${chatId}. Texto digitado: "${receivedText}"`
      );
      state[chatId].service = receivedText;
      const response = await getResponseForStep(
        "Profissionais",
        receivedText,
        null
      );
      if (response) {
        await sendMessageWithDelay(chatId, response, 2000);
        state[chatId].step = "Profissionais";
      } else {
        // Envia mensagem de erro quando não reconhece o serviço
        await sendMessageWithDelay(
          chatId,
          "Ops! Não entendi o serviço informado. 😅\n\nPor favor, digite apenas o *NÚMERO* do serviço desejado",
          2000
        );
      }
      return;
    }
    
    // Obtém a etapa atual do cliente
    const currentStep = state[chatId]?.step;
    const professional = state[chatId]?.professional;

    // Aqui a verificação do currentStep fica mais simples, pois os blocos try/catch estão corretos
    if (currentStep === "Profissionais") {
      console.log(
        `Processando etapa "Profissionais" para o chat ${chatId}. Texto digitado: "${receivedText}"`
      );
      // Capitaliza a primeira letra do texto recebido
      const capitalizedReceivedText = capitalizeFirstLetter(receivedText);
      state[chatId].professional = capitalizedReceivedText;
      const response = await getResponseForStep("Data", receivedText, null);
      if (response) {
        await sendMessageWithDelay(chatId, response, 2000);
        state[chatId].step = "Data";
      } else {
        await sendMessageWithDelay(
          chatId,
          "Desculpe, não reconheci o profissional. Por favor, escolha uma opção válida digitando o *NOME DO PROFISSIONAL.",
          2000
        );
      }
      return;
    } else if (currentStep === "Data") {
      console.log(
        `Processando etapa "Data" para o chat ${chatId}. Texto digitado: "${receivedText}"`
      );
      //formata a data antes de salvar no state
      const formattedDate = formatDate(receivedText);
      if (!formattedDate) {
        await sendMessageWithDelay(
          chatId,
          `O formato de data digitado é inválido!\n\nDigite a data nesse formato *DD/MM*, Ex: 01/05`,
          2000
        );
        return;
      }
      state[chatId].appointmentDate = formattedDate;
      // Salva a data no formato dd/mm para exibição
      state[chatId].appointmentDateToShow = receivedText;
      const response = await getResponseForStep(
        "Horário",
        receivedText,
        professional
      );
      if (response) {
        //envia a resposta sem alteração
        await sendMessageWithDelay(chatId, `${response}`, 2000);
        state[chatId].step = "Horário";
      } else {
        await sendMessageWithDelay(
          chatId,
          "Agora, por favor, informe um *HORÁRIO* para o agendamento.",
          2000
        );
      }
      return;
    } else if (currentStep === "Horário") {
      console.log(
        `Processando etapa "Horário" para o chat ${chatId}. Texto digitado: "${receivedText}"`
      );
      //normaliza o texto recebido
      const receivedTextNormalized = normalizeTime(receivedText);

      // Verifica se o horário está entre os horários disponíveis
      if (availableTimes.includes(receivedTextNormalized)) {
        // Verifica se o horário está disponível na planilha
        const isAvailable = await checkAvailability(
          // envia a data no formato dd/mm para a função `checkAvailability`
          state[chatId].appointmentDateToShow,
          receivedTextNormalized,
          professional
        );
        if (isAvailable) {
          //salva o texto normalizado no state
          state[chatId].appointmentTime = receivedTextNormalized;
          // Capitaliza a primeira letra do nome do profissional
          const capitalizedProfessional = capitalizeFirstLetter(professional);
          // Busca a descrição do serviço
          const serviceDescription = await getServiceDescription(
            state[chatId].service
          );
          const confirmationMessage = `
Podemos confirmar o agendamento?

  📅 Data: *${state[chatId].appointmentDateToShow}*
  ⏰ Hora: *${state[chatId].appointmentTime}*
  👤 Cliente: *${clientName}*
  💇‍♂️ Serviço: *${serviceDescription}*
  ✂️ Profissional: *${capitalizedProfessional}*

  Confirme digitando *SIM* se estiver correto! 😊
          `;
          await sendMessageWithDelay(chatId, confirmationMessage, 2000);
          state[chatId].step = "Confirmação";
        } else {
          await sendMessageWithDelay(
            chatId,
            `O horário *${receivedTextNormalized}* na data *${state[chatId].appointmentDateToShow}* já está reservado para o profissional *${professional}*. Por favor, escolha outro horário.`,
            2000
          );
        }
      } else {
        await sendMessageWithDelay(
          chatId,
          "Desculpe, não entendi o horário informado. Por favor, insira um *HORÁRIO* válido (Formato *HH:MM*, ex: *09:00*).",
          2000
        );
      }
      return; // Sai da função após processar a etapa atual
    } else if (state[chatId]?.step === "Confirmação") {
      // Verifica se o horário está disponível na planilha
      const isAvailable = await checkAvailability(
        state[chatId].appointmentDateToShow,
        state[chatId].appointmentTime,
        state[chatId].professional
      );
      if (!isAvailable) {
        await sendMessageWithDelay(
          chatId,
          'Agendamento *não confirmado*, o *profissional* não esta disponível para o *horário* escolhido.\n\n Envie *VOLTAR* para refazer sua escolha.',
          2000
        );
        return;
      }
      // Busca a descrição do serviço
      const serviceDescription = await getServiceDescription(
        state[chatId].service
      );
      const appointmentData = {
        contactDate: new Date(), // Agora armazena como objeto Date para formatação posterior
        contactTime: new Date(), // Agora armazena como objeto Date para formatação posterior
        appointmentDateToShow: state[chatId].appointmentDateToShow, // Envia a data no formato correto para salvar na planilha
        appointmentTime: state[chatId].appointmentTime,
        clientName: clientName,
        serviceCode: state[chatId].service, // Usa o código do serviço
        professional: state[chatId].professional,
        phoneNumber: chatId,
      };
      console.log("Dados do estado antes de salvar:", state[chatId]); // Adicione aqui
      // Salva o agendamento
      try {
        await saveAppointmentToSheet(appointmentData);
        const confirmationMessage = `Agendamento confirmado! 🎉\n\nEstamos ansiosos para te atender!\nObrigado por nos escolher 😎\n\n 💈 *BARBEARIA SANTANA* 💈`;
        await sendMessageWithDelay(chatId, confirmationMessage, 2000);
        //Define a etapa como concluido!
        state[chatId].step = "Concluido";
      } catch (error) {
        console.error(
          "Erro ao salvar o agendamento na planilha:",
          error.message
        );
        await sendMessageWithDelay(
          chatId,
          "Ocorreu um erro ao salvar o agendamento. Por favor, tente novamente mais tarde.",
          2000
        );
      }
      return;
    } else {
      await sendMessageWithDelay(
        chatId,
        "Ocorreu um erro ao processar sua mensagem. Por favor, tente novamente mais tarde.",
        2000
      );
    }
  } catch (error) {
    console.error("Erro ao processar mensagem:", error);
    await sendMessageWithDelay(
      message.from,
      "Ocorreu um erro ao processar sua mensagem. Por favor, tente novamente mais tarde.",
      2000
    );
  }
});

console.log("index.js: Cliente do WhatsApp inicializado.");
console.log("index.js: Funções auxiliares definidas.");
console.log("index.js: Cliente do WhatsApp sendo inicializado.");
console.log("index.js: Evento 'message' configurado.");
// Inicializa o cliente do WhatsApp
client.initialize();


// ... (seu código atual aqui) ...
// Lista de horários de lembrete
const reminderTimes = [
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
];
// Nova função para verificar se o agendamento está próximo (CORRIGIDO)
const isAppointmentClose = (appointmentDateTime) => {
  const now = new Date();
  // Calcula a diferença em milissegundos
  const diffInMs = appointmentDateTime.getTime() - now.getTime();
  // Calcula a diferença em minutos
  const diffInMinutes = diffInMs / (1000 * 60);
  console.log(
    `isAppointmentClose: O agendamento está a ${diffInMinutes.toFixed(2)} minutos.`
  );

  // Verifica se a diferença está dentro do intervalo de 30 e 31 minutos
  // E se esta no futuro
  return diffInMinutes >= 29 && diffInMinutes <= 31 && diffInMinutes >= 0;
};

// Nova função para enviar mensagens de lembrete
const sendReminderMessages = async () => {
  console.log("sendReminderMessages: Iniciando verificação de agendamentos...");
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Agendamentos!C3:H", // Data, Hora, Cliente, Serviço, Profissional
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log(
        "sendReminderMessages: Nenhum agendamento encontrado na planilha."
      );
      return;
    }
    for (const row of rows) {
      const [
        appointmentDate, // Coluna C: Data
        appointmentTime, // Coluna D: Hora
        clientName, // Coluna E: Cliente
        clientPhoneNumber, // Coluna F: Telefone
        service, // Coluna G: Serviço
        professional, // Coluna H: Profissional
      ] = row;

      // Converte a data e hora do agendamento para objetos Date
      const [day, month] = appointmentDate.split("/");
      const year = new Date().getFullYear(); // Assume o ano atual
      const [hours, minutes] = appointmentTime.split(":");
      const appointmentDateTime = new Date(
        year,
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hours),
        parseInt(minutes)
      );

      // Verifica se o agendamento está próximo
      if (isAppointmentClose(appointmentDateTime)) {
        // Remove a formatação do número do telefone
        const formattedPhoneNumber = `55${clientPhoneNumber}@c.us`;
        const reminderMessage = `Olá ${clientName}, este é um lembrete do seu agendamento em 30 minutos:
      
  📅 Data: *${appointmentDate}*
  ⏰ Hora: *${appointmentTime}*
  💇‍♂️ Serviço: *${service}*
  ✂️ Profissional: *${professional}*

💈 *BARBEARIA SANTANA* 💈
`;
        await sendMessageWithDelay(
          formattedPhoneNumber, // Envia para o numero formatado
          reminderMessage,
          2000
        );
      }
    }
    console.log("sendReminderMessages: Verificação de agendamentos concluída.");
  } catch (error) {
    console.error(
      "sendReminderMessages: Erro ao verificar e enviar lembretes:",
      error
    );
  }
};


// Nova função para verificar se o horário atual está na lista de horários de lembrete
const shouldSendReminder = () => {
  const now = new Date();
  const currentHour = now.getHours().toString().padStart(2, "0"); // Formata a hora para duas casas decimais (ex: "08")
  const currentMinute = now.getMinutes().toString().padStart(2, "0"); // Formata os minutos para duas casas decimais (ex: "30")
  const currentTime = `${currentHour}:${currentMinute}`; // Combina hora e minutos (ex: "08:30")
  console.log(`shouldSendReminder: Horário atual: ${currentTime}`);

  // Verifica se o horário atual está na lista de horários de lembrete
  return reminderTimes.includes(currentTime);
};

// Executa a função sendReminderMessages() a cada 1 minutos
setInterval(() => {
  if (shouldSendReminder()) {
    sendReminderMessages();
  }
}, 1 * 60 * 1000); // 1 minutos * 60 segundos * 1000 milissegundos

// Função para enviar a agenda diária
const sendDailyAgenda = async () => {
  console.log("sendDailyAgenda: Iniciando envio da agenda diária...");
  const today = new Date();
  const formattedDate = today.toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });

  try {
    // Obtemos os dados da planilha a partir da linha 3
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Agendamentos!C3:H", // Data, Hora, Cliente, Serviço, Profissional
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log("sendDailyAgenda: Nenhum agendamento encontrado na planilha.");
      return;
    }

    // Filtra os agendamentos para o dia de hoje
    const todaysAppointments = rows.filter(
      ([appointmentDate]) => appointmentDate === formattedDate
    );

    const phoneNumber = "5511939545171@c.us"; // Número no formato internacional

    if (todaysAppointments.length === 0) {
      console.log("sendDailyAgenda: Nenhum agendamento para hoje.");
      await sendMessageWithDelay(
        phoneNumber,
        "Olá César! ✌️\n\nAinda não temos Agendamentos para hoje.",
        2000
      );
      return;
    }

    // Monta a mensagem da agenda diária
    let agendaMessage = `Olá César!\nAqui está a agenda de hoje ${formattedDate}:\n\n`;
    todaysAppointments.forEach(
      ([, appointmentTime, clientName, , service, professional]) => {
        agendaMessage += `${appointmentTime}, ${professional} - ${service} - ${clientName}\n`;
      }
    );
    agendaMessage += "\nObrigado e tenha um ótimo dia!";

    // Envia a mensagem para o número especificado
    await sendMessageWithDelay(phoneNumber, agendaMessage, 2000);

    console.log("sendDailyAgenda: Agenda diária enviada com sucesso!");
  } catch (error) {
    console.error("sendDailyAgenda: Erro ao enviar a agenda diária:", error);
  }
};

// Configura um agendamento para executar a função às 08:00h todos os dias
const scheduleDailyAgenda = () => {
  const now = new Date();
  const nextRun = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0, // Hora: 08:00
    8, // Minuto: 00
    0, // Segundo: 00
    0
  );

  // Se já passou das 08:00h de hoje, agenda para amanhã
  if (now > nextRun) {
    nextRun.setDate(nextRun.getDate() + 1);
  }

  const timeUntilNextRun = nextRun.getTime() - now.getTime();
  console.log(
    `scheduleDailyAgenda: Agenda diária será enviada em ${
      timeUntilNextRun / 1000 / 60
    } minutos.`
  );

  setTimeout(() => {
    sendDailyAgenda();
    setInterval(sendDailyAgenda, 24 * 60 * 60 * 1000); // Reexecuta a cada 24 horas
  }, timeUntilNextRun);
};

// Inicia o agendamento da agenda diária
scheduleDailyAgenda();

// Função para enviar a agenda do dia às 20:15h
const sendEndOfDayAgenda = async () => {
  console.log("sendEndOfDayAgenda: Iniciando envio da agenda do dia...");
  const today = new Date();
  const formattedDate = today.toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });

  try {
    // Obtemos os dados da planilha a partir da linha 3
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Agendamentos!C3:H", // Data, Hora, Cliente, Serviço, Profissional
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log("sendEndOfDayAgenda: Nenhum agendamento encontrado na planilha.");
      return;
    }

    // Filtra os agendamentos para o dia de hoje
    const todaysAppointments = rows.filter(
      ([appointmentDate]) => appointmentDate === formattedDate
    );

    const phoneNumber = "5511939545171@c.us"; // Número no formato internacional

    if (todaysAppointments.length === 0) {
      console.log("sendEndOfDayAgenda: Nenhum agendamento para hoje.");
      await sendMessageWithDelay(
        phoneNumber,
        `Olá César! ✌️\n\nHoje (${formattedDate}) não tivemos agendamentos registrados.\n\nCaso precise ajustar algo, utilize as funções *INCLUIR* e *CANCELAR* para fazer os ajustes necessários.`,
        2000
      );
      return;
    }

    // Monta a mensagem da agenda do dia
    let agendaMessage = `Olá César!\nAqui está a agenda de hoje (${formattedDate}):\n\n`;
    todaysAppointments.forEach(
      ([, appointmentTime, clientName, , service, professional]) => {
        agendaMessage += `${appointmentTime}, ${professional} - ${service} - ${clientName}\n`;
      }
    );
    agendaMessage += `\nPor favor, revise os agendamentos de hoje e ajuste conforme necessário.\n\nUse as funções *INCLUIR* e *CANCELAR* para fazer os ajustes.`;

    // Envia a mensagem para o número especificado
    await sendMessageWithDelay(phoneNumber, agendaMessage, 2000);

    console.log("sendEndOfDayAgenda: Agenda do dia enviada com sucesso!");
  } catch (error) {
    console.error("sendEndOfDayAgenda: Erro ao enviar a agenda do dia:", error);
  }
};

// Configura um agendamento para executar a função às 20:15h todos os dias
const scheduleEndOfDayAgenda = () => {
  const now = new Date();
  const nextRun = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    20, // Hora: 20:15
    15, // Minuto: 15
    0, // Segundo: 00
    0
  );

  // Se já passou das 20:15h de hoje, agenda para amanhã
  if (now > nextRun) {
    nextRun.setDate(nextRun.getDate() + 1);
  }

  const timeUntilNextRun = nextRun.getTime() - now.getTime();
  console.log(
    `scheduleEndOfDayAgenda: Agenda do dia será enviada em ${
      timeUntilNextRun / 1000 / 60
    } minutos.`
  );

  setTimeout(() => {
    sendEndOfDayAgenda();
    setInterval(sendEndOfDayAgenda, 24 * 60 * 60 * 1000); // Reexecuta a cada 24 horas
  }, timeUntilNextRun);
};

// Inicia o agendamento da agenda do dia
scheduleEndOfDayAgenda();

// Função para enviar mensagem de avaliação
const sendReviewRequest = async (chatId, clientName) => {
  try {
    const shortUrl = "https://encurtador.com.br/OQtFp"; // Substituído pelo link fornecido

    const reviewMessage = `Olá *${clientName}*! 😊\n\nEsperamos que você tenha gostado do atendimento na *BARBEARIA SANTANA*! 💈\n\nPoderia nos ajudar avaliando nossos serviços no Google? Sua opinião é muito importante para nós! 🙏\n\nClique no link abaixo para deixar sua avaliação:\n👉 [Avaliar no Google](${shortUrl})\n\nAgradecemos muito pelo seu tempo! 😄`;
    await sendMessageWithDelay(chatId, reviewMessage, 2000);
    console.log(`Mensagem de avaliação enviada para ${chatId}`);
  } catch (error) {
    console.error(`Erro ao enviar mensagem de avaliação para ${chatId}:`, error);
  }
};

// Função para verificar se o horário atual corresponde a exatamente 3 horas após o agendamento
const shouldSendReview = (appointmentDateTime) => {
  const now = new Date();
  const diffInMs = now.getTime() - appointmentDateTime.getTime();
  const diffInHours = diffInMs / (1000 * 60 * 60);
  return Math.abs(diffInHours - 3) < 0.0167; // Verifica se está exatamente 3 horas (com margem de 1 minuto)
};

// Função para verificar agendamentos e enviar mensagens de avaliação
const checkAndSendReviewRequests = async () => {
  console.log("checkAndSendReviewRequests: Iniciando verificação de agendamentos para mensagens de avaliação...");
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Agendamentos!C3:N", // Inclui a coluna N para verificar se a mensagem já foi enviada
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log("checkAndSendReviewRequests: Nenhum agendamento encontrado na planilha.");
      return;
    }

    for (let i = 0; i < rows.length; i++) {
      const [
        appointmentDate, // Coluna C: Data
        appointmentTime, // Coluna D: Hora
        clientName, // Coluna E: Cliente
        clientPhoneNumber, // Coluna F: Telefone
        , // Coluna G: Serviço (ignorado aqui)
        , // Coluna H: Profissional (ignorado aqui)
        , , , , , , // Colunas I a M (ignoradas)
        reviewSent, // Coluna N: Indica se a mensagem já foi enviada
      ] = rows[i];

      // Verifica se a coluna N está vazia antes de enviar a mensagem
      if (reviewSent && reviewSent.trim() !== "") {
        continue;
      }

      // Converte a data e hora do agendamento para objetos Date
      const [day, month] = appointmentDate.split("/");
      const year = new Date().getFullYear(); // Assume o ano atual
      const [hours, minutes] = appointmentTime.split(":");
      const appointmentDateTime = new Date(
        year,
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hours),
        parseInt(minutes)
      );

      // Verifica se já passaram exatamente 3 horas desde o horário do agendamento
      if (shouldSendReview(appointmentDateTime)) {
        // Remove a formatação do número do telefone
        const formattedPhoneNumber = `55${clientPhoneNumber}@c.us`;
        console.log(`checkAndSendReviewRequests: Enviando mensagem de avaliação para ${formattedPhoneNumber}`);
        await sendReviewRequest(formattedPhoneNumber, clientName);

        // Marca o agendamento como "ok" na planilha
        const rowIndex = i + 3; // Ajusta o índice para refletir a linha real na planilha
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `Agendamentos!N${rowIndex}`,
          valueInputOption: "USER_ENTERED",
          resource: {
            values: [["ok"]],
          },
        });
        console.log(`checkAndSendReviewRequests: Mensagem marcada como enviada na linha ${rowIndex}`);
      }
    }

    console.log("checkAndSendReviewRequests: Verificação concluída.");
  } catch (error) {
    console.error("checkAndSendReviewRequests: Erro ao verificar agendamentos:", error);
  }
};

// Executa a função checkAndSendReviewRequests() a cada 1 minuto
setInterval(() => {
  checkAndSendReviewRequests();
}, 1 * 60 * 1000); // 1 minuto * 60 segundos * 1000 milissegundos
