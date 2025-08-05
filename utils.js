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
 * Normaliza horário removendo 'h' e espaços e formatando para HH:MM.
 */
function normalizeTime(time) {
  if (!time) return null;
  
  // Remove espaços e converte para string
  let normalized = time.toString().trim();
  
  // Remove 'h' se existir
  normalized = normalized.replace(/h/gi, '');
  
  // Se contém apenas números (ex: "9", "09", "900", "0900")
  if (/^\d+$/.test(normalized)) {
    if (normalized.length === 1) {
      // "9" -> "09:00"
      normalized = `0${normalized}:00`;
    } else if (normalized.length === 2) {
      // "09" -> "09:00"
      normalized = `${normalized}:00`;
    } else if (normalized.length === 3) {
      // "900" -> "09:00"
      normalized = `0${normalized.slice(0, 1)}:${normalized.slice(1)}`;
    } else if (normalized.length === 4) {
      // "0900" -> "09:00"
      normalized = `${normalized.slice(0, 2)}:${normalized.slice(2)}`;
    }
  }
  
  // Se já está no formato H:MM ou HH:MM
  if (/^\d{1,2}:\d{2}$/.test(normalized)) {
    const [hours, minutes] = normalized.split(':');
    // Garante que as horas tenham 2 dígitos
    normalized = `${hours.padStart(2, '0')}:${minutes}`;
  }
  
  // Valida se o resultado é um horário válido
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (timeRegex.test(normalized)) {
    const [hours, minutes] = normalized.split(':');
    return `${hours.padStart(2, '0')}:${minutes}`;
  }
  
  // Se não conseguiu normalizar, retorna o valor original
  return time.toString().trim();
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