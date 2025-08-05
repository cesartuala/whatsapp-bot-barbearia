// block.js
// Funções para bloqueio de datas e horários

const { sheets } = require('./googleSheets');
const { SPREADSHEET_ID, availableTimes } = require('./config');
const { formatDate, normalizeTime, capitalizeFirstLetter } = require('./utils');

async function blockDate(chatId, date, sendMessageWithDelay) {
  try {
    const formattedDate = formatDate(date);
    if (!formattedDate) {
      if (sendMessageWithDelay) await sendMessageWithDelay(chatId, "O formato de data está inválido. Por favor, envie no formato:\n\nBloquear Data:\nDD/MM", 2000);
      return;
    }
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Datas Bloqueadas/Feriados!A:A",
    });
    const rows = response.data.values || [];
    const isAlreadyBlocked = rows.some(([blockedDate]) => blockedDate === formattedDate);
    if (isAlreadyBlocked) {
      if (sendMessageWithDelay) await sendMessageWithDelay(chatId, `A data *${formattedDate}* já está bloqueada.`, 2000);
      return;
    }
    const nextRow = rows.length + 1;
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Datas Bloqueadas/Feriados!A${nextRow}`,
      valueInputOption: "USER_ENTERED",
      resource: { values: [[formattedDate]] },
    });
    if (sendMessageWithDelay) await sendMessageWithDelay(chatId, `A data *${formattedDate}* foi bloqueada com sucesso!`, 2000);
  } catch (error) {
    console.error(`blockDate: Erro ao bloquear a data ${date}:`, error);
    if (sendMessageWithDelay) await sendMessageWithDelay(chatId, "Ocorreu um erro ao bloquear a data. Por favor, tente novamente mais tarde.", 2000);
  }
}

async function blockTimeRange(chatId, date, startTime, endTime, professional, sendMessageWithDelay) {
  try {
    const formattedDate = formatDate(date);
    if (!formattedDate) {
      if (sendMessageWithDelay) await sendMessageWithDelay(chatId, "O formato de data está inválido. Por favor, envie no formato:\n\nBloquear Horário:\nDD/MM\nHH:MM (início)\nHH:MM (término)\nProfissional", 2000);
      return;
    }
    const normalizedStartTime = normalizeTime(startTime);
    const normalizedEndTime = normalizeTime(endTime);
    if (!availableTimes.includes(normalizedStartTime) || !availableTimes.includes(normalizedEndTime)) {
      if (sendMessageWithDelay) await sendMessageWithDelay(chatId, "Os horários informados estão inválidos. Por favor, envie no formato correto:\n\nBloquear Horário:\nDD/MM\nHH:MM (início)\nHH:MM (término)\nProfissional", 2000);
      return;
    }
    const [startHour, startMinute] = normalizedStartTime.split(":").map(Number);
    const [endHour, endMinute] = normalizedEndTime.split(":").map(Number);
    const startDateTime = new Date(2000, 0, 1, startHour, startMinute);
    const endDateTime = new Date(2000, 0, 1, endHour, endMinute);
    if (startDateTime >= endDateTime) {
      if (sendMessageWithDelay) await sendMessageWithDelay(chatId, "O horário inicial deve ser menor que o horário final. Por favor, envie no formato correto:\n\nBloquear Horário:\nDD/MM\nHH:MM (início)\nHH:MM (término)\nProfissional", 2000);
      return;
    }
    const blockedTimes = [];
    let currentTime = startDateTime;
    while (currentTime <= endDateTime) {
      const hours = currentTime.getHours().toString().padStart(2, "0");
      const minutes = currentTime.getMinutes().toString().padStart(2, "0");
      blockedTimes.push(`${formattedDate}${hours}:${minutes}${capitalizeFirstLetter(professional)}`);
      currentTime.setMinutes(currentTime.getMinutes() + 30);
    }
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Concatenar!E:E",
    });
    const rows = response.data.values || [];
    const nextRow = rows.length + 1;
    const values = blockedTimes.map((time) => [time]);
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Concatenar!E${nextRow}:E${nextRow + values.length - 1}`,
      valueInputOption: "USER_ENTERED",
      resource: { values },
    });
    if (sendMessageWithDelay) await sendMessageWithDelay(chatId, `Os horários de *${normalizedStartTime}* até *${normalizedEndTime}* na data *${formattedDate}* para o profissional *${professional}* foram bloqueados com sucesso!`, 2000);
  } catch (error) {
    console.error("blockTimeRange: Erro ao bloquear os horários:", error);
    if (sendMessageWithDelay) await sendMessageWithDelay(chatId, "Ocorreu um erro ao bloquear os horários. Por favor, tente novamente mais tarde.", 2000);
  }
}

module.exports = { blockDate, blockTimeRange };