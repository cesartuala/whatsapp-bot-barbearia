// Importação de módulos necessários
const { google } = require("googleapis");
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const axios = require('axios'); // Certifique-se de ter o Axios instalado

// Importa funções utilitárias e configurações dos módulos
const { getBrazilDate, normalizeText, normalizeTime, capitalizeFirstLetter, formatDate } = require('./utils');
const { SPREADSHEET_ID, availableTimes, reminderTimes } = require('./config');

// Importa funções do módulo googleSheets.js
const { sheets, getServiceDescription, checkAvailability, getLastRowIndex, getSheetId } = require('./googleSheets');

// Importa função de agendamento do módulo appointment.js
const { saveAppointmentToSheet } = require('./appointment');

// Importa função de inclusão direta do módulo appointmentDirect.js
const { includeAppointmentDirectly } = require('./appointmentDirect');

// Importa funções de bloqueio do módulo block.js
const { blockDate, blockTimeRange } = require('./block');

// Importa funções de cancelamento do módulo appointmentCancel.js
const { cancelAppointment, saveCancellationReason, copyRowToCancelled } = require('./appointmentCancel');

// Variáveis de controle de reconexão
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
let isReconnecting = false;
let isInitialized = false;

// Function to check the connection and try to reconnect if needed
const checkAndReconnect = async () => {
    if (isReconnecting) {
        console.log('⏳ Reconexão já em andamento...');
        return;
    }

    try {
        isReconnecting = true;
        console.log('🔄 Verificando status da conexão...');
        
        const clientState = await client.getState();
        console.log(`📊 Estado atual: ${clientState}`);
        
        if (clientState !== 'CONNECTED') {
            console.log('❌ Cliente não conectado, iniciando processo de reconexão...');
            await reconnectClient();
        } else {
            console.log('✅ Cliente conectado normalmente');
            reconnectAttempts = 0;
        }
    } catch (error) {
        console.error('❌ Erro ao verificar conexão:', error.message);
        await reconnectClient();
    } finally {
        isReconnecting = false;
    }
};

// Estado global para rastrear informações dos clientes
const state = {};

// Function to reconnect the client
const reconnectClient = async () => {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.log(`❌ Máximo de tentativas de reconexão atingido (${MAX_RECONNECT_ATTEMPTS})`);
        console.log('🔄 Reiniciando aplicação em 60 segundos...');
        setTimeout(() => {
            process.exit(1);
        }, 60000);
        return;
    }

    reconnectAttempts++;
    console.log(`🔄 Tentativa de reconexão ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`);

    try {
        // Destrói cliente atual
        if (client && isInitialized) {
            await client.destroy();
            console.log('🗑️ Cliente anterior destruído');
            isInitialized = false;
        }

        // Aguarda antes de tentar reconectar
        const waitTime = Math.min(30000 * reconnectAttempts, 300000); // Max 5 minutos
        console.log(`⏱️ Aguardando ${waitTime/1000}s antes de reconectar...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));

        // Reinicializa cliente
        console.log('🚀 Reinicializando cliente...');
        await client.initialize();

    } catch (error) {
        console.error(`❌ Erro na tentativa ${reconnectAttempts}:`, error.message);
        setTimeout(reconnectClient, 10000);
    }
};
// Função para criar cliente com retry automático
const createClient = () => {
    return new Client({
        authStrategy: new LocalAuth({
            clientId: "whatsapp-bot-barbearia",
            dataPath: "./whatsapp-session"
        }),
        puppeteer: {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-gpu',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
                '--override-plugin-power-saver-for-testing=never',
                '--disable-extensions-http-throttling',
                '--disable-features=TranslateUI',
                '--disable-ipc-flooding-protection',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
                '--disable-blink-features=AutomationControlled',
                '--no-default-browser-check',
                '--disable-default-apps',
                '--disable-extensions',
                '--disable-plugins',
                '--disable-sync',
                '--disable-translate',
                '--hide-scrollbars',
                '--mute-audio',
                '--disable-background-networking',
                '--disable-device-discovery-notifications',
                '--allow-running-insecure-content',
                '--disable-features=Translate',
                '--disable-web-security',
                '--user-data-dir=/tmp/chrome-user-data',
                '--disable-software-rasterizer'
            ],
            executablePath: process.platform === 'win32' ? 
                'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' : 
                '/usr/bin/chromium', // Usar Chromium no Linux (mais compatível)
            timeout: 120000, // 2 minutos
            handleSIGINT: false,
            handleSIGTERM: false,
            handleSIGHUP: false,
            slowMo: 100 // Adiciona delay entre ações
        },
        webVersionCache: {
            type: 'remote',
            remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html'
        },
        authTimeoutMs: 60000, // 1 minuto para auth
        qrMaxRetries: 5,
        restartOnAuthFail: true,
        takeoverOnConflict: true,
        takeoverTimeoutMs: 30000
    });
};

// Configuração robusta do cliente WhatsApp para produção
let client = createClient();

// Função para adicionar um delay (atraso)
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// Função melhorada para enviar mensagens com delay e tratamento de erro
async function sendMessageWithDelay(chatId, message, delayMs = 2000) {
  try {
    if (!client || !isInitialized) {
      console.log('⚠️ Cliente não inicializado, tentando reconectar...');
      await checkAndReconnect();
      return;
    }

    const clientState = await client.getState();
    if (clientState !== 'CONNECTED') {
      console.log('⚠️ Cliente não conectado, adiando mensagem...');
      setTimeout(() => sendMessageWithDelay(chatId, message, delayMs), 5000);
      return;
    }

    await delay(delayMs);
    await client.sendMessage(chatId, message);
    console.log(`📤 Mensagem enviada para ${chatId}: ${message.substring(0, 50)}...`);
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error.message);
    if (error.message.includes('Session closed') || error.message.includes('Protocol error')) {
      console.log('🔄 Sessão perdida, tentando reconectar...');
      setTimeout(checkAndReconnect, 2000);
    }
  }
}

// Função para extrair horários de uma mensagem
const extractTimesFromMessage = (message) => {
  console.log(`extractTimesFromMessage: Extraindo horários da mensagem:`, message);
  const timeRegex = /\b\d{2}:\d{2}\b/g;
  const allTimes = message.match(timeRegex) || [];
  
  // Filtra horários que não são exemplos ou indisponíveis
  const validTimes = allTimes.filter(time => {
    const lines = message.split('\n');
    
    for (const line of lines) {
      if (line.includes(time)) {
        const lowerLine = line.toLowerCase();
        
        // Verifica se o horário está na mesma linha que contém a palavra "exemplo"
        if (lowerLine.includes('exemplo')) {
          console.log(`extractTimesFromMessage: Horário ${time} ignorado - está na linha de exemplo: "${line.trim()}"`);
          return false;
        }
        
        // Verifica se o horário está na mesma linha que contém a palavra "indisponível"
        if (lowerLine.includes('indisponível')) {
          console.log(`extractTimesFromMessage: Horário ${time} ignorado - está na linha indisponível: "${line.trim()}"`);
          return false;
        }
      }
    }
    
    console.log(`extractTimesFromMessage: Horário ${time} aceito como válido`);
    return true;
  });
  
  // Remove duplicatas mantendo apenas valores únicos
  const uniqueValidTimes = [...new Set(validTimes)];
  
  console.log(`extractTimesFromMessage: Todos os horários encontrados:`, allTimes);
  console.log(`extractTimesFromMessage: Horários válidos (sem exemplos):`, validTimes);
  console.log(`extractTimesFromMessage: Horários únicos finais:`, uniqueValidTimes);
  return uniqueValidTimes;
};

// Função para extrair datas de uma mensagem
const extractDatesFromMessage = (message) => {
  console.log(`extractDatesFromMessage: Extraindo datas da mensagem:`, message);
  
  // Divide a mensagem em linhas para análise linha por linha
  const lines = message.split('\n');
  const validDates = [];
  
  lines.forEach(line => {
    // Procura por padrões de data DD/MM na linha
    const dateMatches = line.match(/\b\d{2}\/\d{2}\b/g);
    
    if (dateMatches) {
      dateMatches.forEach(date => {
        // Verifica se a linha contém contexto de exemplo
        const lineLower = line.toLowerCase();
        if (lineLower.includes("exemplo") || lineLower.includes("formato") || lineLower.includes("ex:")) {
          console.log(`extractDatesFromMessage: Data ${date} ignorada - linha de exemplo: ${line}`);
          return;
        }
        
        // Remove apenas datas específicas que são claramente exemplos em contexto de exemplo
        if ((date === "01/05" || date === "23/03") && (lineLower.includes("exemplo") || lineLower.includes("formato"))) {
          console.log(`extractDatesFromMessage: Data ${date} ignorada - exemplo genérico: ${line}`);
          return;
        }
        
        // Verifica se a linha contém "indisponível" - se sim, não adiciona a data
        if (lineLower.includes("indisponível")) {
          console.log(`extractDatesFromMessage: Data ${date} ignorada - linha contém "indisponível": ${line}`);
          return;
        }
        
        // Se chegou até aqui, é uma data válida
        if (!validDates.includes(date)) {
          validDates.push(date);
          console.log(`extractDatesFromMessage: Data ${date} adicionada como válida da linha: ${line}`);
        }
      });
    }
  });
  
  console.log(`extractDatesFromMessage: Datas válidas extraídas:`, validDates);
  return validDates;
};

// Função para gerar lista dinâmica de horários disponíveis
const generateAvailableTimesForClient = async (date, professional) => {
  console.log(`generateAvailableTimesForClient: Gerando horários para ${professional} na data ${date}`);
  const availableTimesForDateAndProfessional = [];
  for (const time of availableTimes) {
    const isAvailable = await checkAvailability(date, time, professional);
    if (isAvailable) {
      availableTimesForDateAndProfessional.push(time);
    }
  }
  console.log(`generateAvailableTimesForClient: ${availableTimesForDateAndProfessional.length} horários disponíveis:`, availableTimesForDateAndProfessional);
  return availableTimesForDateAndProfessional;
};

// Função para buscar respostas na planilha
// Cache para respostas automáticas
let respostasCache = null;
let respostasCacheTimestamp = 0;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutos

const getResponseForStep = async (step, receivedText, professional = null) => {
  try {
    const now = Date.now();
    // Se o cache está vazio ou expirou, faz leitura da planilha
    if (!respostasCache || now - respostasCacheTimestamp > CACHE_DURATION_MS) {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: "Respostas Automáticas!A:D", // A: Step, B: Profissional, C: Data, D: Resposta
      });
      respostasCache = response.data.values;
      respostasCacheTimestamp = now;
    }
    const rows = respostasCache;
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
          return responseMessage; // Retorna a resposta correta para "Horário"
        }
      } else {
        // Condição para as outras etapas
        if (
          stepName === step && // Condição para a etapa
          normalizeText(date) === normalizeText(receivedText) // Condição para o texto recebido
        ) {
          return responseMessage; // Retorna a resposta correta para outras etapas
        }
      }
    }

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
  try {
    // Obtemos os dados da planilha a partir da linha 3
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Agendamentos!C3:H", // Data, Hora, Cliente, Telefone, Serviço, Profissional
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return null;
    }

    // Obtém a data e hora atuais no fuso do Brasil
    const now = getBrazilDate();

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


        // Verifica se o agendamento é futuro
        if (appointmentDateTime > now) {

          // Corrigido: Ajustar índice da linha para refletir a linha real na planilha
          const foundRowIndex = i + 3; // Linha começa em C3, precisa somar +3


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

    return null; // Nenhum agendamento futuro encontrado
  } catch (error) {
    console.error(
      "checkExistingAppointment: Erro ao verificar agendamento:",
      error
    );
    return null; // Assume que não há agendamento em caso de erro
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

// Event listener for disconnected event
client.on("disconnected", (reason) => {
  console.error("client.on('disconnected'): WhatsApp desconectado:", reason);
  checkAndReconnect();
});

// Event listener for authentication failure
client.on("auth_failure", (msg) => {
  console.error("client.on('auth_failure'): Falha na autenticação:", msg);
  checkAndReconnect();
});
// Event listeners robustos para produção
client.on("qr", (qr) => {
  console.log('📱 Novo QR Code gerado');
  qrcode.generate(qr, { small: true });
  console.log('✅ QR Code exibido no terminal. Escaneie com seu WhatsApp.');
  console.log('📋 Dica: Se estiver em um servidor, copie o QR do terminal para escanear');
});

// Evento para indicar que o cliente está pronto
client.on("ready", () => {
  console.log("🟢 WhatsApp conectado e pronto!");
  console.log("📱 Bot da Barbearia Santana está funcionando!");
  reconnectAttempts = 0;
  isReconnecting = false;
  isInitialized = true;
});

client.on("authenticated", () => {
  console.log("🔐 Autenticação bem-sucedida!");
});

client.on("auth_failure", (msg) => {
  console.error("❌ Falha na autenticação:", msg);
  setTimeout(() => {
    console.log('🔄 Tentando reautenticar...');
    if (!isReconnecting) {
      client.initialize();
    }
  }, 10000);
});

client.on("disconnected", async (reason) => {
  console.log(`🔴 WhatsApp desconectado: ${reason}`);
  isInitialized = false;
  
  if (reason === 'LOGOUT') {
    console.log('⚠️ Logout detectado - sessão foi invalidada');
    console.log('🗑️ Limpando dados de sessão...');
    
    // Remove arquivos de sessão
    const fs = require('fs');
    const path = require('path');
    const sessionPath = path.join(__dirname, 'whatsapp-session');
    
    try {
      if (fs.existsSync(sessionPath)) {
        fs.rmSync(sessionPath, { recursive: true, force: true });
        console.log('🗑️ Sessão limpa. Novo QR Code será necessário.');
      }
    } catch (error) {
      console.error('❌ Erro ao limpar sessão:', error.message);
    }
    
    reconnectAttempts = 0; // Reset tentativas para logout
  }
  
  setTimeout(checkAndReconnect, 5000);
});

// Evento para lidar com mensagens recebidas
client.on("message", async (message) => {
  try {
    const chatId = message.from;
    // Ignora mensagens vindas de grupos
    if (chatId.includes("@g.us")) {
      return;
    }
    // Ignora mensagens vindas de status (contatos de status)
    if (chatId.includes("@status")) {
      return;
    }


    const clientName = message._data?.notifyName || "Cliente"; // Puxa o nome do cliente automaticamente
    const receivedText = message.body;
    let initialResponse = null;

    // Verifica se a mensagem é para incluir um agendamento diretamente
    if (receivedText.startsWith("Incluir")) {
      const lines = receivedText.split("\n").filter((line) => line.trim() !== ""); // Remove linhas vazias

      if (lines.length === 6 && lines[0] === "Incluir:") {
        const [_, clientLine, dateLine, timeLine, serviceLine, professionalLine] = lines;

        // Extrai os dados da mensagem
        const formattedDate = formatDate(dateLine.trim());
        const normalizedTime = normalizeTime(timeLine.trim());
        const serviceCode = serviceLine.trim();
        const professional = capitalizeFirstLetter(professionalLine.trim());


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
        contactDate: getBrazilDate(),
        contactTime: getBrazilDate(),
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

      if (lines.length === 6 && lines[0] === "Agendar:") {
        const [_, clientLine, dateLine, timeLine, serviceLine, professionalLine] = lines;

        // Extrai os dados da mensagem
        const formattedDate = formatDate(dateLine.trim());
        const normalizedTime = normalizeTime(timeLine.trim());
        const serviceCode = serviceLine.trim(); // Agora espera o código do serviço
        const professional = capitalizeFirstLetter(professionalLine.trim());


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
        if (!formattedDate || !normalizedTime || !availableTimes.includes(normalizedTime)) {
          console.error("Agendar: Dados inválidos detectados:", {
            formattedDate,
            normalizedTime,
            isTimeInAvailableList: availableTimes.includes(normalizedTime)
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
          contactDate: getBrazilDate(),
          contactTime: getBrazilDate(),
          appointmentDateToShow: formattedDate,
          appointmentTime: normalizedTime,
          clientName: clientLine, // Apenas armazena o texto enviado
          serviceCode,
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

      if (lines.length === 4 && lines[0] === "Cancelar:") {
        const [_, dateLine, timeLine, professionalLine] = lines;

        // Formata a data e horário
        const formattedDate = formatDate(dateLine.trim());
        const normalizedTime = normalizeTime(timeLine.trim());
        const professional = capitalizeFirstLetter(professionalLine.trim());


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

      if (lines.length === 5 && lines[0] === "Bloquear Horário:") { // Corrigido para 5 linhas
        const [_, dateLine, startTimeLine, endTimeLine, professionalLine] = lines;

        // Extrai os dados da mensagem
        const date = dateLine.trim();
        const startTime = startTimeLine.trim();
        const endTime = endTimeLine.trim();
        const professional = capitalizeFirstLetter(professionalLine.trim());


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
          // Regenera a lista de horários disponíveis atualizada
          if (state[chatId].appointmentDateToShow && state[chatId].professional) {
            // Busca a resposta atualizada da planilha
            const response = await getResponseForStep(
              "Horário",
              state[chatId].appointmentDateToShow,
              state[chatId].professional
            );
            
            if (response) {
              // Extrai os horários da mensagem de resposta
              const timesFromMessage = extractTimesFromMessage(response);
              state[chatId].availableTimesForClient = timesFromMessage;
              console.log(`VOLTAR Confirmação->Horário: Horários extraídos da mensagem:`, timesFromMessage);
              
              await sendMessageWithDelay(chatId, `Ok, vamos voltar para a escolha do *HORÁRIO*.\n\n${response}`, 2000);
            } else {
              // Gera horários disponíveis se não há resposta da planilha
              const availableTimesForClient = await generateAvailableTimesForClient(
                state[chatId].appointmentDate,
                state[chatId].professional
              );
              
              if (availableTimesForClient.length === 0) {
                await sendMessageWithDelay(
                  chatId,
                  `Infelizmente não há mais horários disponíveis para *${state[chatId].professional}* na data *${state[chatId].appointmentDateToShow}*.\n\nVou voltar para a escolha da data.`,
                  2000
                );
                state[chatId].step = "Data";
                return;
              }
              
              let horariosMessage = `Ok, vamos voltar para a escolha do *HORÁRIO*.\n\nHorários disponíveis para *${state[chatId].professional}* na data *${state[chatId].appointmentDateToShow}*:\n\n`;
              availableTimesForClient.forEach((time) => {
                horariosMessage += `• ${time}\n`;
              });
              horariosMessage += "\nPor favor, informe um dos *HORÁRIOS* acima para o agendamento.";
              
              // Extrai horários da mensagem montada
              const timesFromMessage = extractTimesFromMessage(horariosMessage);
              state[chatId].availableTimesForClient = timesFromMessage;
              console.log(`VOLTAR Confirmação->Horário (sem resposta): Horários extraídos:`, timesFromMessage);
              
              await sendMessageWithDelay(chatId, horariosMessage, 2000);
            }
          } else {
            await sendMessageWithDelay(chatId, "Ok, vamos voltar para a escolha do *HORÁRIO*.\nQual horário você quer escolher?\n\nEnvie no formaro *HH:MM* Exemplo:*00:00*.", 2000);
          }
          return;
        } else if (state[chatId].step === "Horário") {
          state[chatId].step = "Data";
          // Limpa a lista de horários quando volta para data
          state[chatId].availableTimesForClient = [];
          
          // Se há datas específicas armazenadas, mostra elas
          if (state[chatId].availableDatesForClient && state[chatId].availableDatesForClient.length > 0) {
            let datesMessage = `Ok, vamos voltar para a escolha da *DATA*.\n\nDatas disponíveis:\n\n`;
            state[chatId].availableDatesForClient.forEach((date) => {
              datesMessage += `• ${date}\n`;
            });
            datesMessage += "\nPor favor, escolha uma das datas acima.";
            await sendMessageWithDelay(chatId, datesMessage, 2000);
          } else {
            await sendMessageWithDelay(chatId, "Ok, vamos voltar para a escolha da *DATA*.\nQual data você quer escolher?\n\nEnvie no formaro *DD/MM* Exemplo:*23/03*.", 2000);
          }
          return;
        } else if (state[chatId].step === "Data") {
          state[chatId].step = "Profissionais";
          // Limpa as listas quando volta para profissionais
          state[chatId].availableTimesForClient = [];
          state[chatId].availableDatesForClient = [];
          await sendMessageWithDelay(chatId, "Ok, vamos voltar para a escolha do *PROFISSIONAL*.\nQual profissional você quer escolher?\n\nEnvie o *nome do profissional*.", 2000);
          return;
        } else if (state[chatId].step === "Profissionais") {
          state[chatId].step = "Mensagem Inicial";
          // Limpa as listas quando volta para serviços
          state[chatId].availableTimesForClient = [];
          state[chatId].availableDatesForClient = [];
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
      // Primeiro verifica se o cliente possui um agendamento
      const existingAppointment = await checkExistingAppointment(chatId);
      
      if (existingAppointment) {
        // Se tem agendamento, salva no state e oferece opções
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

      // Se não tem agendamento, zera o state e inicia processo normal
      delete state[chatId]; // Limpa o estado do cliente
      await sendMessageWithDelay(chatId, "Ok, vamos reiniciar o processo de agendamento.", 2000);
      const greeting = `💈 *BARBEARIA SANTANA* 💈\n\nOlá *${clientName}*, vou lhe ajudar com o seu agendamento.`;
      await sendMessageWithDelay(chatId, greeting, 2000);
      initialResponse = await getResponseForStep("Mensagem Inicial", "");
      if (initialResponse) {
        await sendMessageWithDelay(chatId, initialResponse, 2000);
      }
      state[chatId] = { step: "Mensagem Inicial" }; // Reinicia o state
      return; // Encerra a execução para recomeçar o fluxo
    }

    // Verifica se o cliente já está em um fluxo (state existe) e se já concluiu o fluxo
    if (state[chatId] && state[chatId].step === "Concluido") {
      return;
    }

        // Verifica se o cliente está na etapa "Mensagem Inicial"
    if (state[chatId] && state[chatId].step === "Mensagem Inicial") {
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
      // Capitaliza a primeira letra do texto recebido
      const capitalizedReceivedText = capitalizeFirstLetter(receivedText);
      state[chatId].professional = capitalizedReceivedText;
      // Limpa lista de horários quando muda profissional
      state[chatId].availableTimesForClient = [];
      
      const response = await getResponseForStep("Data", receivedText, null);
      if (response) {
        // Extrai as datas da mensagem de resposta que será enviada
        const datesFromMessage = extractDatesFromMessage(response);
        
        // Armazena as datas extraídas da mensagem no state do cliente
        state[chatId].availableDatesForClient = datesFromMessage;
        console.log(`Profissionais step: Datas extraídas da mensagem para ${chatId}:`, datesFromMessage);
        
        await sendMessageWithDelay(chatId, response, 2000);
        state[chatId].step = "Data";
      } else {
        // Só limpa a lista de datas se não houver resposta da planilha
        state[chatId].availableDatesForClient = [];
        await sendMessageWithDelay(
          chatId,
          "Desculpe, não reconheci o profissional. Por favor, escolha uma opção válida digitando o *NOME DO PROFISSIONAL.",
          2000
        );
      }
      return;
    } else if (currentStep === "Data") {
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

      // Verifica se a data está na lista de datas que foram enviadas especificamente para este cliente
      const availableDatesForClient = state[chatId].availableDatesForClient || [];
      console.log(`Data recebida: "${receivedText}" -> formatada: "${formattedDate}"`);
      console.log(`Datas disponíveis para o cliente:`, availableDatesForClient);
      
      // Se há lista de datas disponíveis, deve estar nela. Se não há lista, aceita qualquer data válida
      if (availableDatesForClient.length === 0 || availableDatesForClient.includes(receivedText)) {
        console.log(`Data ${receivedText} está na lista do cliente ou não há restrição. Prosseguindo...`);
        
        state[chatId].appointmentDate = formattedDate;
        // Salva a data no formato dd/mm para exibição
        state[chatId].appointmentDateToShow = receivedText;
        // Limpa lista de horários disponíveis quando muda data
        state[chatId].availableTimesForClient = [];
        const response = await getResponseForStep(
          "Horário",
          receivedText,
          professional
        );
        if (response) {
          // Extrai os horários da mensagem de resposta que será enviada
          const timesFromMessage = extractTimesFromMessage(response);
          
          // Armazena os horários extraídos da mensagem no state do cliente
          state[chatId].availableTimesForClient = timesFromMessage;
          console.log(`Data step: Horários extraídos da mensagem para ${chatId}:`, timesFromMessage);
          
          //envia a resposta sem alteração
          await sendMessageWithDelay(chatId, `${response}`, 2000);
          state[chatId].step = "Horário";
        } else {
          // Gera lista de horários disponíveis para esta data e profissional
          const availableTimesForClient = await generateAvailableTimesForClient(
            formattedDate,
            state[chatId].professional
          );
          
          // Se não há horários disponíveis, informa ao cliente
          if (availableTimesForClient.length === 0) {
            await sendMessageWithDelay(
              chatId,
              `Infelizmente não temos horários disponíveis para *${state[chatId].professional}* na data *${receivedText}*.\n\nPor favor, escolha outra data ou profissional.`,
              2000
            );
            state[chatId].step = "Data"; // Volta para escolha de data
            return;
          }
          
          // Monta mensagem com horários disponíveis
          let horariosMessage = `Horários disponíveis para *${state[chatId].professional}* na data *${receivedText}*:\n\n`;
          availableTimesForClient.forEach((time) => {
            horariosMessage += `• ${time}\n`;
          });
          horariosMessage += "\nPor favor, informe um dos *HORÁRIOS* acima para o agendamento.";
          
          // Extrai os horários da mensagem que foi montada e armazena no state
          const timesFromMessage = extractTimesFromMessage(horariosMessage);
          state[chatId].availableTimesForClient = timesFromMessage;
          console.log(`Data step (sem resposta): Horários extraídos da mensagem para ${chatId}:`, timesFromMessage);
          
          await sendMessageWithDelay(chatId, horariosMessage, 2000);
          state[chatId].step = "Horário";
        }
      } else {
        console.log(`Data ${receivedText} NÃO está na lista do cliente.`);
        // Mostra novamente as datas disponíveis específicas para este cliente
        if (availableDatesForClient.length > 0) {
          let datesMessage = `Por favor, escolha uma das datas disponíveis que foram enviadas:\n\n`;
          availableDatesForClient.forEach((date) => {
            datesMessage += `• ${date}\n`;
          });
          datesMessage += "\nDigite a data exatamente como mostrado acima (Formato *DD/MM*).";
          
          await sendMessageWithDelay(chatId, datesMessage, 2000);
        } else {
          await sendMessageWithDelay(
            chatId,
            `O formato de data digitado é inválido!\n\nDigite a data nesse formato *DD/MM*, Ex: 01/05`,
            2000
          );
        }
      }
      return;
    } else if (currentStep === "Horário") {
      //normaliza o texto recebido
      const receivedTextNormalized = normalizeTime(receivedText);
      console.log(`Horário recebido: "${receivedText}" -> normalizado: "${receivedTextNormalized}"`);

      // Verifica se o horário está na lista de horários que foram enviados especificamente para este cliente
      const availableTimesForClient = state[chatId].availableTimesForClient || [];
      console.log(`Horários disponíveis para o cliente:`, availableTimesForClient);
      
      // Verifica se o horário normalizado está na lista OU se algum horário da lista, quando normalizado, coincide
      const isTimeInList = availableTimesForClient.includes(receivedTextNormalized) || 
                          availableTimesForClient.some(time => normalizeTime(time) === receivedTextNormalized);
      
      if (isTimeInList) {
        console.log(`Horário ${receivedTextNormalized} está na lista do cliente. Verificando disponibilidade...`);
        // Verifica novamente se o horário ainda está disponível na planilha (double check)
        const isAvailable = await checkAvailability(
          // envia a data no formato dd/mm para a função `checkAvailability`
          state[chatId].appointmentDateToShow,
          receivedTextNormalized,
          professional
        );
        if (isAvailable) {
          console.log(`Horário ${receivedTextNormalized} ainda disponível. Prosseguindo para confirmação.`);
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
          console.log(`Horário ${receivedTextNormalized} não está mais disponível.`);
          await sendMessageWithDelay(
            chatId,
            `O horário *${receivedTextNormalized}* na data *${state[chatId].appointmentDateToShow}* acabou de ser reservado por outro cliente para o profissional *${professional}*. Por favor, escolha outro horário da lista enviada.`,
            2000
          );
        }
      } else {
        console.log(`Horário ${receivedTextNormalized} NÃO está na lista do cliente.`);
        // Mostra novamente os horários disponíveis específicos para este cliente
        if (availableTimesForClient.length > 0) {
          let horariosMessage = `Por favor, escolha um dos horários disponíveis:\n\n`;
          availableTimesForClient.forEach((time) => {
            horariosMessage += `• ${time}\n`;
          });
          horariosMessage += "\n💡 *Dica:* Você pode digitar *9:00* ou *09:00*, ambos funcionam!";
          
          await sendMessageWithDelay(chatId, horariosMessage, 2000);
        } else {
          await sendMessageWithDelay(
            chatId,
            "Desculpe, não entendi o horário informado. 🕐\n\nDigite no formato: *09:00*\n\nPor favor, tente novamente escolhendo um horário da lista.",
            2000
          );
        }
      }
      return; // Sai da função após processar a etapa atual
    } else if (state[chatId]?.step === "Confirmação") {
      // Aceita várias formas de confirmação
      const normalizedResponse = normalizeText(receivedText);
      const confirmationWords = ['sim', 's', 'confirmar', 'confirmo', 'ok', 'certo', 'correto', 'perfeito', 'yes', 'y'];
      
      if (confirmationWords.includes(normalizedResponse)) {
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
        // Adicione aqui
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
      } else {
        // Se não foi uma confirmação, explica como confirmar
        await sendMessageWithDelay(
          chatId,
          "Para confirmar o agendamento, digite:\n• *SIM*\n• *CONFIRMAR*\n• *OK*\n\nOu digite *VOLTAR* para alterar os dados.",
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

// Função para inicializar o bot com Google Sheets e retry automático
async function startBot(retryCount = 0) {
  const MAX_RETRIES = 3;
  
  try {
    console.log('🚀 Iniciando WhatsApp Bot da Barbearia...');
    
    // Importa funções do Google Sheets
    const { initializeGoogleSheets } = require('./googleSheets');
    await initializeGoogleSheets();
    
    console.log('📱 Inicializando cliente WhatsApp...');
    
    // Cleanup de processos antigos
    try {
      if (client && client.pupPage) {
        await client.destroy();
      }
    } catch (e) {
      console.log('🧹 Limpando recursos antigos...');
    }
    
    // Recria o cliente
    client = createClient();
    
    // Aguarda um pouco antes de inicializar
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await client.initialize();
    
    // Verifica conexão a cada 2 minutos
    setInterval(checkAndReconnect, 120000);
    
  } catch (error) {
    console.error(`❌ Erro ao inicializar bot (tentativa ${retryCount + 1}/${MAX_RETRIES}):`, error.message);
    
    if (retryCount < MAX_RETRIES - 1) {
      console.log(`🔄 Tentando novamente em 10 segundos...`);
      
      // Limpar sessão se for erro de protocol
      if (error.message.includes('Protocol error') || error.message.includes('Session closed')) {
        console.log('🧹 Limpando sessão corrompida...');
        const fs = require('fs');
        const path = require('path');
        try {
          if (fs.existsSync('./whatsapp-session')) {
            fs.rmSync('./whatsapp-session', { recursive: true, force: true });
          }
        } catch (e) {
          console.log('⚠️ Não foi possível limpar sessão automaticamente');
        }
      }
      
      setTimeout(() => {
        startBot(retryCount + 1);
      }, 10000);
    } else {
      console.error("💥 Falha crítica: Não foi possível inicializar o bot após várias tentativas");
      console.log("🔧 Tente executar manualmente:");
      console.log("   1. rm -rf whatsapp-session/");
      console.log("   2. export DISPLAY=:99");
      console.log("   3. sudo Xvfb :99 -screen 0 1024x768x24 &");
      console.log("   4. node index.js");
      process.exit(1);
    }
  }
}

// Inicializa o bot
startBot();

// Função para verificar se deve enviar lembrete (implementação básica)
function shouldSendReminder() {
  // Personalize a lógica conforme necessário. Por padrão, retorna false.
  return false;
}

// ... (seu código atual aqui) ...
// Executa a função sendReminderMessages() a cada 1 minutos
setInterval(() => {
  if (shouldSendReminder()) {
    sendReminderMessages();
  }
}, 1 * 60 * 1000); // 1 minutos * 60 segundos * 1000 milissegundos

// Função para enviar a agenda diária
const sendDailyAgenda = async () => {
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
    8, // Hora: 08:00
    0, // Minuto: 00
    0, // Segundo: 00
    0
  );

  // Se já passou das 08:00h de hoje, agenda para amanhã
  if (now > nextRun) {
    nextRun.setDate(nextRun.getDate() + 1);
  }

  const timeUntilNextRun = nextRun.getTime() - now.getTime();

  setTimeout(() => {
    sendDailyAgenda();
    setInterval(sendDailyAgenda, 24 * 60 * 60 * 1000); // Reexecuta a cada 24 horas
  }, timeUntilNextRun);
};

// Inicia o agendamento da agenda diária
scheduleDailyAgenda();

// Função para enviar a agenda do dia às 20:15h
const sendEndOfDayAgenda = async () => {
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
      }
    }

  } catch (error) {
    console.error("checkAndSendReviewRequests: Erro ao verificar agendamentos:", error);
  }
};

// Executa checkAndSendReviewRequests apenas nos horários fixos
const SCHEDULED_HOURS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "01:00",
];

function getNextScheduledTime() {
  const now = new Date();
  for (const timeStr of SCHEDULED_HOURS) {
    const [hour, minute] = timeStr.split(":").map(Number);
    const scheduled = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
    if (scheduled > now) {
      return scheduled;
    }
  }
  // Se passou de 21:00, agenda para o próximo dia às 08:00
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 8, 0, 0, 0);
}

function scheduleNextReviewCheck() {
  const nextTime = getNextScheduledTime();
  const now = new Date();
  const msUntilNext = nextTime - now;
  setTimeout(async () => {
    await checkAndSendReviewRequests();
    scheduleNextReviewCheck();
  }, msUntilNext);
}

scheduleNextReviewCheck();