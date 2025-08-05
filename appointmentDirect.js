// appointmentDirect.js
// Função para inclusão direta de agendamento

const { sheets, getServiceDescription } = require('./googleSheets');
const { SPREADSHEET_ID } = require('./config');
const { formatDate, capitalizeFirstLetter } = require('./utils');

async function includeAppointmentDirectly(chatId, appointmentData, sendMessageWithDelay) {
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
    if (!serviceDescription) throw new Error(`Código de serviço inválido: ${serviceCode}`);

    const formattedContactDate = contactDate.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
    const formattedContactTime = contactTime.toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour12: false, hour: "2-digit", minute: "2-digit" });
    const formattedAppointmentDate = formatDate(appointmentDateToShow);
    if (!formattedAppointmentDate) throw new Error(`O formato da data digitada é inválido! A data digitada foi ${appointmentDateToShow}`);
    const formattedPhoneNumber = phoneNumber.replace("55", "").replace("@c.us", "");
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
      spreadsheetId: SPREADSHEET_ID,
      range: "Agendamentos!A:H",
      valueInputOption: "USER_ENTERED",
      resource: { values: [values] },
    });

    if (!response.data) {
      throw new Error("Erro: Ocorreu um erro na inserção na planilha. Resposta sem dados.");
    } else if (sendMessageWithDelay) {
      await sendMessageWithDelay(
        chatId,
        `Agendamento incluído com sucesso! 🎉\n\n📅 Data: *${formattedAppointmentDate}*\n⏰ Hora: *${appointmentTime}*\n👤 Cliente: *${clientName}*\n💇‍♂️ Serviço: *${serviceDescription}*\n✂️ Profissional: *${capitalizedProfessional}*\n\nObrigado por nos escolher!\n💈 *BARBEARIA SANTANA* 💈`,
        2000
      );
    }
  } catch (error) {
    console.error("includeAppointmentDirectly: Erro ao incluir o agendamento na planilha:", error.message);
    if (sendMessageWithDelay) {
      await sendMessageWithDelay(
        chatId,
        "Ocorreu um erro ao incluir o agendamento. Por favor, tente novamente mais tarde.",
        2000
      );
    }
  }
}

module.exports = { includeAppointmentDirectly };