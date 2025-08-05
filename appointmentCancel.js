// appointmentCancel.js
// Funções para cancelamento de agendamento

const { sheets, getSheetId, getLastRowIndex } = require('./googleSheets');
const { SPREADSHEET_ID } = require('./config');

// Copia uma linha de "Agendamentos" para "Cancelados"
async function copyRowToCancelled(rowIndex) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `Agendamentos!A${rowIndex}:H${rowIndex}`,
    });
    const rowData = response.data.values[0];
    if (!rowData) throw new Error(`Nenhum dado encontrado na linha ${rowIndex}`);
    const nextRow = await getLastRowIndex("Cancelados");
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Cancelados!A${nextRow}:H${nextRow}`,
      valueInputOption: "USER_ENTERED",
      resource: { values: [rowData] },
    });
  } catch (error) {
    console.error(`copyRowToCancelled: Erro ao copiar linha:`, error);
    throw error;
  }
}

// Salva o motivo do cancelamento na aba "Cancelados"
async function saveCancellationReason(chatId, reason) {
  try {
    const sheetData = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Cancelados!J:J',
    });
    const rows = sheetData.data.values || [];
    const firstEmptyRow = rows.length + 1;
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Cancelados!J${firstEmptyRow}`,
      valueInputOption: "USER_ENTERED",
      resource: { values: [[reason]] },
    });
    return firstEmptyRow;
  } catch (error) {
    console.error(`saveCancellationReason: Erro ao salvar motivo:`, error);
    throw error;
  }
}

// Cancela o agendamento
async function cancelAppointment(chatId, rowIndex, clientName, autoReason = null, sendMessageWithDelay) {
  try {
    await copyRowToCancelled(rowIndex);
    const sheetId = await getSheetId("Agendamentos");
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: sheetId,
              dimension: "ROWS",
              startIndex: rowIndex - 1,
              endIndex: rowIndex,
            },
          },
        }],
      },
    });
    if (autoReason) {
      await saveCancellationReason(chatId, autoReason);
      if (sendMessageWithDelay) {
        await sendMessageWithDelay(
          chatId,
          "Seu agendamento foi *cancelado* com sucesso.\nPara um *novo agendamento*, envie *AGENDAMENTO*.",
          2000
        );
      }
    } else if (sendMessageWithDelay) {
      await sendMessageWithDelay(
        chatId,
        "Por favor, digite em poucas palavras o *motivo do cancelamento*.",
        2000
      );
    }
  } catch (error) {
    console.error(`cancelAppointment: Erro ao cancelar:`, error);
    if (sendMessageWithDelay) {
      await sendMessageWithDelay(
        chatId,
        "Ocorreu um erro ao processar o cancelamento. Por favor, tente novamente mais tarde.",
        2000
      );
    }
  }
}

module.exports = {
  copyRowToCancelled,
  saveCancellationReason,
  cancelAppointment,
};