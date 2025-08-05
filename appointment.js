// Módulo de funções de agendamento
const { sheets, getServiceDescription, getLastRowIndex, getSheetId } = require('./googleSheets');
const { formatDate, capitalizeFirstLetter } = require('./utils');

// Salva agendamento na aba "Agendamentos"
async function saveAppointmentToSheet(appointmentData) {
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

    const serviceDescription = await getServiceDescription(serviceCode);
    if (!serviceDescription) {
      throw new Error(`Código de serviço inválido: ${serviceCode}`);
    }

    const formattedContactDate = contactDate.toLocaleDateString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
    });
    const formattedContactTime = contactTime.toLocaleTimeString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    });
    const formattedAppointmentDate = formatDate(appointmentDateToShow);
    if (!formattedAppointmentDate) {
      throw new Error(`O formato da data digitada é inválido! A data digitada foi ${appointmentDateToShow}`);
    }
    const formattedPhoneNumber = phoneNumber.replace('55', '').replace('@c.us', '');
    const capitalizedProfessional = capitalizeFirstLetter(professional);
    const values = [
      formattedContactDate,
      formattedContactTime,
      formattedAppointmentDate,
      appointmentTime,
      clientName,
      formattedPhoneNumber,
      serviceDescription,
      capitalizedProfessional,
    ];
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: require('./config').SPREADSHEET_ID,
      range: 'Agendamentos!A:H',
      valueInputOption: 'USER_ENTERED',
      resource: { values: [values] },
    });
    return response.data;
  } catch (error) {
    console.error('saveAppointmentToSheet: Erro ao salvar o agendamento:', error.message);
    throw error;
  }
}

module.exports = {
  saveAppointmentToSheet,
};