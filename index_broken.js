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
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--single-process",
      "--disable-gpu",
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
      "", // Coluna I (vazia)
    ];

    console.log(
      "saveAppointmentToSheet: Valores a serem inseridos na planilha:",
      values
    );

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Agendamentos!A:I",
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
      range: `Agendamentos!A${rowIndex}:I${rowIndex}`, // Corrigido para pegar toda a linha, incluindo a coluna I
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
      range: `Cancelados!A${nextRow}:I${nextRow}`,
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
      "", // Coluna I (vazia)
    ];

    console.log(
      "includeAppointmentDirectly: Valores a serem inseridos na planilha:",
      values
    );

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Agendamentos!A:I",
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

    // Verifica se a mensagem é para solicitar relatório de profissionais
    if (receivedText.startsWith("Relatório Profissionais")) {
      const date = receivedText.replace("Relatório Profissionais", "").trim(); // Extrai a data do texto
      const formattedDate = formatDate(date); // Formata a data para DD/MM
      if (!formattedDate) {
        console.error("sendProfessionalsReport: Data inválida recebida:", date);
        await sendMessageWithDelay(
          chatId,
          "O formato de data está inválido. Por favor, envie no formato: Relatório Profissionais DD/MM.",
          2000
        );
        return;
      }

      // Envia o relatório de profissionais para a data especificada
      await sendProfessionalsReport(chatId, formattedDate);
      return;
    }

    // Verifica se a mensagem é para solicitar relatório de serviços
    if (receivedText.startsWith("Relatório Serviços")) {
      const date = receivedText.replace("Relatório Serviços", "").trim(); // Extrai a data do texto
      const formattedDate = formatDate(date); // Formata a data para DD/MM
      if (!formattedDate) {
        console.error("sendServicesReport: Data inválida recebida:", date);
        await sendMessageWithDelay(
          chatId,
          "O formato de data está inválido. Por favor, envie no formato: Relatório Serviços DD/MM.",
          2000
        );
        return;
      }

      // Envia o relatório de serviços para a data especificada
      await sendServicesReport(chatId, formattedDate);
      return;
    }

    // Verifica se a mensagem é para solicitar relatório de faturamento
    if (receivedText.startsWith("Faturamento")) {
      const date = receivedText.replace("Faturamento", "").trim(); // Extrai a data do texto
      const formattedDate = formatDate(date); // Formata a data para DD/MM
      if (!formattedDate) {
        console.error("sendRevenueReport: Data inválida recebida:", date);
        await sendMessageWithDelay(
          chatId,
          "O formato de data está inválido. Por favor, envie no formato: Faturamento DD/MM.",
          2000
        );
        return;
      }

      // Envia o relatório de faturamento para a data especificada
      await sendRevenueReport(chatId, formattedDate);
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

    // Processar outras mensagens normais do fluxo
    if (receivedText === "CANCELAR" && state[chatId]?.step === "Agendamento Encontrado") {
      console.log("Cancelamento de agendamento iniciado para chatId:", chatId);
      state[chatId].step = "Confirmar Cancelamento";
      const confirmMessage = `⚠️ Você tem certeza de que deseja cancelar o seu agendamento?\n\n📅 Data: *${state[chatId].appointmentDate}*\n⏰ Hora: *${state[chatId].appointmentTime}*\n💇‍♂️ Serviço: *${state[chatId].service}*\n✂️ Profissional: *${state[chatId].professional}*\n\nDigite *SIM* para confirmar o cancelamento ou *NÃO* para manter o agendamento.`;
      await sendMessageWithDelay(chatId, confirmMessage, 2000);
      return;
    }

    if (receivedText === "SIM" && state[chatId]?.step === "Confirmar Cancelamento") {
      console.log("Confirmação de cancelamento recebida para chatId:", chatId);
      const { appointmentDate, appointmentTime, service, professional, rowIndex } = state[chatId];

      try {
        // Move o agendamento para a aba "Cancelados"
        await moveAppointmentToCanceled(rowIndex, appointmentDate, appointmentTime, state[chatId].clientName, chatId, service, professional);

        // Remove o agendamento da aba "Agendamentos"
        await removeAppointment(rowIndex);

        await sendMessageWithDelay(
          chatId,
          `✅ Seu agendamento foi cancelado com sucesso!\n\n📅 Data: *${appointmentDate}*\n⏰ Hora: *${appointmentTime}*\n💇‍♂️ Serviço: *${service}*\n✂️ Profissional: *${professional}*\n\nObrigado por nos avisar! Esperamos vê-lo em breve. 😊`,
          2000
        );

        // Limpa o estado do cliente
        delete state[chatId];
        console.log(`Estado do cliente ${chatId} limpo após cancelamento.`);
      } catch (error) {
        console.error("Erro ao cancelar o agendamento:", error);
        await sendMessageWithDelay(
          chatId,
          "Ocorreu um erro ao cancelar o agendamento. Por favor, tente novamente mais tarde.",
          2000
        );
      }
      return;
    }

    if (receivedText === "NÃO" && state[chatId]?.step === "Confirmar Cancelamento") {
      console.log("Cancelamento cancelado para chatId:", chatId);
      const { appointmentDate, appointmentTime, service, professional } = state[chatId];
      await sendMessageWithDelay(
        chatId,
        `👍 Perfeito! Seu agendamento foi mantido.\n\n📅 Data: *${appointmentDate}*\n⏰ Hora: *${appointmentTime}*\n💇‍♂️ Serviço: *${service}*\n✂️ Profissional: *${professional}*\n\nNos vemos em breve! 😊`,
        2000
      );

      // Limpa o estado do cliente
      delete state[chatId];
      console.log(`Estado do cliente ${chatId} limpo após manutenção do agendamento.`);
      return;
    }

    if (receivedText === "NOVO" && state[chatId]?.step === "Agendamento Encontrado") {
      console.log("Novo agendamento solicitado para chatId:", chatId);
      // Limpa o estado do cliente para começar um novo agendamento
      delete state[chatId];
      
      // Redefine a etapa para "Mensagem Inicial"
      state[chatId] = { step: "Mensagem Inicial", clientName };
      const greeting = `💈 *BARBEARIA SANTANA* 💈\n\nOlá *${clientName}*, vou lhe ajudar com o seu novo agendamento.`;
      await sendMessageWithDelay(chatId, greeting, 2000);

      initialResponse = await getResponseForStep("Mensagem Inicial", "");
      if (initialResponse) {
        await sendMessageWithDelay(chatId, initialResponse, 2000);
      }
      return;
    }

    // Continua o fluxo normal de agendamento
    const currentStep = state[chatId]?.step || "Mensagem Inicial";
    console.log(`Estado atual do cliente ${chatId}:`, state[chatId]);
    console.log(`Etapa atual: ${currentStep}, Mensagem recebida: ${receivedText}`);

    const response = await getResponseForStep(currentStep, receivedText);

    if (response) {
      await sendMessageWithDelay(chatId, response, 2000);
    } else {
      console.error(`Nenhuma resposta encontrada para a etapa: ${currentStep} e mensagem: ${receivedText}`);
    }
  } catch (error) {
    console.error("Erro ao processar a mensagem:", error);
    await sendMessageWithDelay(
      chatId,
      "Ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.",
      2000
    );
  }
});

// Função para normalizar o texto (remover acentos e converter para minúsculas)
function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // Remove acentos
}

// Função para remover um agendamento da planilha
const removeAppointment = async (rowIndex) => {
  console.log(`removeAppointment: Removendo agendamento da linha ${rowIndex}...`);

  try {
    const request = {
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: 0, // ID da aba "Agendamentos"
                dimension: "ROWS",
                startIndex: rowIndex - 1, // Ajuste para índice baseado em 0
                endIndex: rowIndex, // Exclui apenas a linha específica
              },
            },
          },
        ],
      },
    };

    await sheets.spreadsheets.batchUpdate(request);
    console.log(`removeAppointment: Agendamento removido da linha ${rowIndex} com sucesso.`);
  } catch (error) {
    console.error(`removeAppointment: Erro ao remover agendamento da linha ${rowIndex}:`, error);
    throw error;
  }
};

// Função para mover um agendamento para a aba "Cancelados"
const moveAppointmentToCanceled = async (originalRowIndex, appointmentDate, appointmentTime, clientName, clientPhone, service, professional) => {
  console.log(`moveAppointmentToCanceled: Movendo agendamento para a aba "Cancelados"...`);

  try {
    // Obtém o timestamp atual para registrar quando foi cancelado
    const canceledAt = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

    // Dados para adicionar na aba "Cancelados"
    const values = [
      [originalRowIndex, appointmentDate, appointmentTime, clientName, clientPhone, service, professional, canceledAt]
    ];

    const request = {
      spreadsheetId: SPREADSHEET_ID,
      range: "Cancelados!A:H", // Aba "Cancelados", colunas A a H
      valueInputOption: "RAW",
      resource: { values },
    };

    await sheets.spreadsheets.values.append(request);
    console.log(`moveAppointmentToCanceled: Agendamento movido para "Cancelados" com sucesso.`);
  } catch (error) {
    console.error(`moveAppointmentToCanceled: Erro ao mover agendamento para "Cancelados":`, error);
    throw error;
  }
};

// Função para capitalizar a primeira letra de cada palavra
function capitalizeFirstLetter(text) {
  return text
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

// Função para buscar um agendamento existente do cliente
const checkExistingAppointment = async (chatId) => {
  console.log(`checkExistingAppointment: Verificando agendamento existente para chatId: ${chatId}...`);

  try {
    // Obtemos os dados da planilha a partir da linha 3
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Agendamentos!C3:H", // Data, Hora, Cliente, Telefone, Serviço, Profissional
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log("checkExistingAppointment: Nenhum agendamento encontrado na planilha.");
      return null;
    }

    // Procura por um agendamento com o telefone do cliente
    for (let i = 0; i < rows.length; i++) {
      const [appointmentDate, appointmentTime, clientName, clientPhone, service, professional] = rows[i];
      
      if (clientPhone === chatId) {
        const rowIndex = i + 3; // Ajuste do índice (linha 3 = índice 0 no array)
        console.log(`checkExistingAppointment: Agendamento encontrado na linha ${rowIndex} para chatId: ${chatId}`);
        
        return {
          appointmentDate,
          appointmentTime,
          clientName,
          clientPhone,
          service,
          professional,
          rowIndex,
        };
      }
    }

    console.log(`checkExistingAppointment: Nenhum agendamento encontrado para chatId: ${chatId}`);
    return null;
  } catch (error) {
    console.error(`checkExistingAppointment: Erro ao verificar agendamento para chatId: ${chatId}:`, error);
    return null;
  }
};

// Função para bloquear uma data inteira
const blockDate = async (chatId, date) => {
  console.log(`blockDate: Bloqueando a data ${date}...`);

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

  try {
    // Dados para adicionar na aba "Bloqueios"
    const values = [
      [formattedDate, "Data Completa", "00:00", "23:59", "Administrador", new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })]
    ];

    const request = {
      spreadsheetId: SPREADSHEET_ID,
      range: "Bloqueios!A:F", // Aba "Bloqueios"
      valueInputOption: "RAW",
      resource: { values },
    };

    await sheets.spreadsheets.values.append(request);
    
    await sendMessageWithDelay(
      chatId,
      `✅ Data *${formattedDate}* bloqueada com sucesso!\n\nNenhum agendamento será aceito para esta data.`,
      2000
    );

    console.log(`blockDate: Data ${formattedDate} bloqueada com sucesso.`);
  } catch (error) {
    console.error(`blockDate: Erro ao bloquear a data ${formattedDate}:`, error);
    await sendMessageWithDelay(
      chatId,
      "Ocorreu um erro ao bloquear a data. Por favor, tente novamente mais tarde.",
      2000
    );
  }
};

// Função para bloquear um intervalo de horários
const blockTimeRange = async (chatId, date, startTime, endTime, professional) => {
  console.log(`blockTimeRange: Bloqueando horários de ${startTime} às ${endTime} na data ${date} para ${professional}...`);

  const formattedDate = formatDate(date);
  if (!formattedDate) {
    console.error("blockTimeRange: Data inválida recebida:", date);
    await sendMessageWithDelay(
      chatId,
      "O formato de data está inválido. Por favor, envie no formato: DD/MM",
      2000
    );
    return;
  }

  // Validar formato de horário
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
    console.error("blockTimeRange: Formato de horário inválido:", { startTime, endTime });
    await sendMessageWithDelay(
      chatId,
      "O formato de horário está inválido. Por favor, use o formato HH:MM (ex: 14:30)",
      2000
    );
    return;
  }

  try {
    // Dados para adicionar na aba "Bloqueios"
    const values = [
      [formattedDate, professional, startTime, endTime, "Administrador", new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })]
    ];

    const request = {
      spreadsheetId: SPREADSHEET_ID,
      range: "Bloqueios!A:F", // Aba "Bloqueios"
      valueInputOption: "RAW",
      resource: { values },
    };

    await sheets.spreadsheets.values.append(request);
    
    await sendMessageWithDelay(
      chatId,
      `✅ Horários bloqueados com sucesso!\n\n📅 Data: *${formattedDate}*\n⏰ Horário: *${startTime}* às *${endTime}*\n✂️ Profissional: *${professional}*\n\nEstes horários não estarão disponíveis para agendamento.`,
      2000
    );

    console.log(`blockTimeRange: Horários ${startTime} às ${endTime} bloqueados para ${professional} na data ${formattedDate}.`);
  } catch (error) {
    console.error(`blockTimeRange: Erro ao bloquear horários:`, error);
    await sendMessageWithDelay(
      chatId,
      "Ocorreu um erro ao bloquear os horários. Por favor, tente novamente mais tarde.",
      2000
    );
  }
};

// Função para enviar a agenda de uma data específica
const sendAgendaForDate = async (chatId, date) => {
  console.log(`sendAgendaForDate: Enviando agenda para a data ${date}...`);

  try {
    // Obtemos os dados da planilha a partir da linha 3
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Agendamentos!C3:H", // Data, Hora, Cliente, Telefone, Serviço, Profissional
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log("sendAgendaForDate: Nenhum agendamento encontrado na planilha.");
      await sendMessageWithDelay(chatId, "Nenhum agendamento encontrado.", 2000);
      return;
    }

    // Filtrar agendamentos para a data especificada
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

    // Ordenar os agendamentos por horário
    appointmentsForDate.sort(([, timeA], [, timeB]) => timeA.localeCompare(timeB));

    // Monta a mensagem da agenda
    let agendaMessage = `📅 *AGENDA DO DIA ${date}* 📅\n\n`;
    appointmentsForDate.forEach(([, appointmentTime, clientName, , service, professional]) => {
      agendaMessage += `⏰ *${appointmentTime}*\n`;
      agendaMessage += `👤 ${clientName}\n`;
      agendaMessage += `💇‍♂️ ${service}\n`;
      agendaMessage += `✂️ ${professional}\n\n`;
    });

    agendaMessage += `📊 Total de agendamentos: *${appointmentsForDate.length}*\n\n`;
    agendaMessage += `💈 *BARBEARIA SANTANA* 💈`;

    // Enviar a mensagem
    await sendMessageWithDelay(chatId, agendaMessage, 2000);

    console.log(`sendAgendaForDate: Agenda para a data ${date} enviada com sucesso!`);
  } catch (error) {
    console.error(`sendAgendaForDate: Erro ao enviar agenda para a data ${date}:`, error);
    await sendMessageWithDelay(
      chatId,
      "Ocorreu um erro ao buscar a agenda. Por favor, tente novamente mais tarde.",
      2000
    );
  }
};

// Função para enviar a agenda do dia às 20:15h
const sendEndOfDayAgenda = async () => {
  console.log("sendEndOfDayAgenda: Iniciando envio da agenda do dia...");

  try {
    const today = getTodayFormatted();
    console.log(`sendEndOfDayAgenda: Data de hoje: ${today}`);

    // Obtemos os dados da planilha a partir da linha 3
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Agendamentos!C3:H", // Data, Hora, Cliente, Telefone, Serviço, Profissional
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log("sendEndOfDayAgenda: Nenhum agendamento encontrado na planilha.");
      return;
    }

    // Filtrar agendamentos para hoje
    const todayAppointments = rows.filter(
      ([appointmentDate]) => appointmentDate === today
    );

    if (todayAppointments.length === 0) {
      console.log(`sendEndOfDayAgenda: Nenhum agendamento encontrado para hoje (${today}).`);
      return;
    }

    // Ordenar os agendamentos por horário
    todayAppointments.sort(([, timeA], [, timeB]) => timeA.localeCompare(timeB));

    // Monta a mensagem da agenda do dia
    let agendaMessage = `📅 *AGENDA DE HOJE ${today}* 📅\n\n`;
    todayAppointments.forEach(([, appointmentTime, clientName, , service, professional]) => {
      agendaMessage += `⏰ *${appointmentTime}*\n`;
      agendaMessage += `👤 ${clientName}\n`;
      agendaMessage += `💇‍♂️ ${service}\n`;
      agendaMessage += `✂️ ${professional}\n\n`;
    });

    agendaMessage += `📊 Total de agendamentos hoje: *${todayAppointments.length}*\n\n`;
    agendaMessage += `💈 *BARBEARIA SANTANA* 💈`;

    // Enviar para o número administrativo
    await sendMessageWithDelay(ADMIN_PHONE_NUMBER, agendaMessage, 2000);

    console.log("sendEndOfDayAgenda: Agenda do dia enviada com sucesso!");
  } catch (error) {
    console.error("sendEndOfDayAgenda: Erro ao enviar a agenda do dia:", error);
  }
};

// Função para agendar o envio da agenda do dia
const scheduleEndOfDayAgenda = () => {
  const now = new Date();
  const targetTime = new Date();
  targetTime.setHours(20, 15, 0, 0); // 20:15:00

  // Se já passou das 20:15 hoje, agenda para amanhã
  if (now >= targetTime) {
    targetTime.setDate(targetTime.getDate() + 1);
  }

  const timeUntilTarget = targetTime.getTime() - now.getTime();

  console.log(
    `scheduleEndOfDayAgenda: Agenda do dia será enviada em ${
      timeUntilTarget / 1000 / 60
    } minutos.`
  );

  setTimeout(() => {
    sendEndOfDayAgenda();
    // Reagenda para o próximo dia
    scheduleEndOfDayAgenda();
  }, timeUntilTarget);
};

// Inicia o agendamento da agenda do dia
scheduleEndOfDayAgenda();

// Função para enviar lembretes
const sendReminderMessages = async () => {
  console.log("sendReminderMessages: Iniciando envio de lembretes...");

  try {
    const tomorrow = getTomorrowFormatted();
    console.log(`sendReminderMessages: Data de amanhã: ${tomorrow}`);

    // Obtemos os dados da planilha a partir da linha 3
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Agendamentos!C3:H", // Data, Hora, Cliente, Telefone, Serviço, Profissional
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log("sendReminderMessages: Nenhum agendamento encontrado na planilha.");
      return;
    }

    // Filtrar agendamentos para amanhã
    const tomorrowAppointments = rows.filter(
      ([appointmentDate]) => appointmentDate === tomorrow
    );

    if (tomorrowAppointments.length === 0) {
      console.log(`sendReminderMessages: Nenhum agendamento encontrado para amanhã (${tomorrow}).`);
      return;
    }

    console.log(`sendReminderMessages: Encontrados ${tomorrowAppointments.length} agendamentos para amanhã.`);

    // Enviar lembrete para cada cliente
    for (const [appointmentDate, appointmentTime, clientName, clientPhone, service, professional] of tomorrowAppointments) {
      const reminderMessage = `🔔 *LEMBRETE DE AGENDAMENTO* 🔔\n\nOlá *${clientName}*!\n\nLembramos que você tem um agendamento amanhã:\n\n📅 Data: *${appointmentDate}*\n⏰ Hora: *${appointmentTime}*\n💇‍♂️ Serviço: *${service}*\n✂️ Profissional: *${professional}*\n\nNos vemos em breve! 😊\n\n💈 *BARBEARIA SANTANA* 💈`;

      try {
        await sendMessageWithDelay(clientPhone, reminderMessage, 3000);
        console.log(`sendReminderMessages: Lembrete enviado para ${clientName} (${clientPhone})`);
      } catch (error) {
        console.error(`sendReminderMessages: Erro ao enviar lembrete para ${clientPhone}:`, error);
      }
    }

    console.log(`sendReminderMessages: Todos os lembretes foram processados.`);
  } catch (error) {
    console.error("sendReminderMessages: Erro geral ao enviar lembretes:", error);
  }
};

// Função para agendar o envio de lembretes
const scheduleReminderMessages = () => {
  const now = new Date();
  const targetTime = new Date();
  targetTime.setHours(10, 0, 0, 0); // 10:00:00

  // Se já passou das 10:00 hoje, agenda para amanhã
  if (now >= targetTime) {
    targetTime.setDate(targetTime.getDate() + 1);
  }

  const timeUntilTarget = targetTime.getTime() - now.getTime();

  console.log(
    `scheduleReminderMessages: Lembretes serão enviados em ${
      timeUntilTarget / 1000 / 60
    } minutos.`
  );

  setTimeout(() => {
    sendReminderMessages();
    // Reagenda para o próximo dia
    scheduleReminderMessages();
  }, timeUntilTarget);
};

// Inicia o agendamento dos lembretes
scheduleReminderMessages();

// Função para verificar e enviar pedidos de avaliação
const checkAndSendReviewRequests = async () => {
  console.log("checkAndSendReviewRequests: Verificando agendamentos para envio de avaliações...");

  try {
    const yesterday = getYesterdayFormatted();
    console.log(`checkAndSendReviewRequests: Data de ontem: ${yesterday}`);

    // Obtemos os dados da planilha a partir da linha 3
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Agendamentos!C3:H", // Data, Hora, Cliente, Telefone, Serviço, Profissional
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log("checkAndSendReviewRequests: Nenhum agendamento encontrado na planilha.");
      return;
    }

    // Filtrar agendamentos de ontem
    const yesterdayAppointments = rows.filter(
      ([appointmentDate]) => appointmentDate === yesterday
    );

    if (yesterdayAppointments.length === 0) {
      console.log(`checkAndSendReviewRequests: Nenhum agendamento encontrado para ontem (${yesterday}).`);
      return;
    }

    console.log(`checkAndSendReviewRequests: Encontrados ${yesterdayAppointments.length} agendamentos de ontem.`);

    // Enviar pedido de avaliação para cada cliente
    for (const [appointmentDate, appointmentTime, clientName, clientPhone, service, professional] of yesterdayAppointments) {
      await sendReviewRequest(clientPhone, clientName, appointmentDate, appointmentTime, service, professional);
      console.log(`checkAndSendReviewRequests: Pedido de avaliação enviado para ${clientName} (${clientPhone})`);
    }

    console.log(`checkAndSendReviewRequests: Todos os pedidos de avaliação foram processados.`);
  } catch (error) {
    console.error("checkAndSendReviewRequests: Erro geral ao verificar e enviar avaliações:", error);
  }
};

// Função para enviar pedido de avaliação
const sendReviewRequest = async (clientPhone, clientName, appointmentDate, appointmentTime, service, professional) => {
  console.log(`sendReviewRequest: Enviando pedido de avaliação para ${clientName} (${clientPhone})...`);

  const reviewMessage = `⭐ *COMO FOI SUA EXPERIÊNCIA?* ⭐\n\nOlá *${clientName}*!\n\nEsperamos que tenha gostado do seu atendimento:\n\n📅 Data: *${appointmentDate}*\n⏰ Hora: *${appointmentTime}*\n💇‍♂️ Serviço: *${service}*\n✂️ Profissional: *${professional}*\n\nSua opinião é muito importante para nós! 😊\n\nPoderia nos avaliar no Google? Clique no link:\n👉 https://g.page/r/SEU_LINK_GOOGLE_REVIEW/review\n\n💈 *BARBEARIA SANTANA* 💈`;

  try {
    await sendMessageWithDelay(clientPhone, reviewMessage, 3000);
    console.log(`sendReviewRequest: Pedido de avaliação enviado com sucesso para ${clientName}`);
  } catch (error) {
    console.error(`sendReviewRequest: Erro ao enviar pedido de avaliação para ${clientPhone}:`, error);
    throw error;
  }
};

// Função para agendar o envio de pedidos de avaliação
const scheduleReviewRequests = () => {
  const now = new Date();
  const targetTime = new Date();
  targetTime.setHours(16, 0, 0, 0); // 16:00:00

  // Se já passou das 16:00 hoje, agenda para amanhã
  if (now >= targetTime) {
    targetTime.setDate(targetTime.getDate() + 1);
  }

  const timeUntilTarget = targetTime.getTime() - now.getTime();

  console.log(
    `scheduleReviewRequests: Pedidos de avaliação serão enviados em ${
      timeUntilTarget / 1000 / 60
    } minutos.`
  );

  setTimeout(() => {
    checkAndSendReviewRequests();
    // Reagenda para o próximo dia
    scheduleReviewRequests();
  }, timeUntilTarget);
};

// Inicia o agendamento dos pedidos de avaliação
scheduleReviewRequests();
