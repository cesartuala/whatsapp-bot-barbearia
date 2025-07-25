// Funções utilitárias para o bot

/**
 * Retorna a data atual no fuso horário de Brasília.
 */
function getBrazilDate() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
}

/**
 * Normaliza texto removendo acentos e deixando minúsculo.
 */
function normalizeText(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Normaliza horário removendo 'h' e espaços.
 */
function normalizeTime(time) {
  return time.replace("h", "").trim();
}

/**
 * Capitaliza a primeira letra de uma string.
 */
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

/**
 * Formata data para DD/MM se possível.
 */
function formatDate(dateString) {
  if (dateString.includes('/')) {
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      if (!isNaN(parseInt(day)) && !isNaN(parseInt(month)) && !isNaN(parseInt(year)) && day.length === 2 && month.length === 2 && year.length === 4) {
        return `${day}/${month}`;
      }
    } else if (parts.length === 2) {
      const [day, month] = parts;
      if (!isNaN(parseInt(day)) && !isNaN(parseInt(month)) && day.length === 2 && month.length === 2) {
        return dateString;
      }
    }
  }
  console.error('O formato de data informado é inválido: ', dateString);
  return null;
}

module.exports = {
  getBrazilDate,
  normalizeText,
  normalizeTime,
  capitalizeFirstLetter,
  formatDate
};
