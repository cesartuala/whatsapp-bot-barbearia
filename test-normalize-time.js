// Teste para verificar se a função normalizeTime está funcionando corretamente
const { normalizeTime } = require('./utils');

console.log('🧪 Testando função normalizeTime...\n');

const testCases = [
  // Formato já correto
  { input: '09:00', expected: '09:00', description: 'Formato já correto' },
  { input: '21:30', expected: '21:30', description: 'Formato já correto (noite)' },
  
  // Sem zero à esquerda
  { input: '9:00', expected: '09:00', description: 'Sem zero à esquerda' },
  { input: '9:30', expected: '09:30', description: 'Sem zero à esquerda com minutos' },
  
  // Com 'h'
  { input: '9h', expected: '09:00', description: 'Com h simples' },
  { input: '09h', expected: '09:00', description: 'Com h e zero' },
  { input: '9h00', expected: '09:00', description: 'Com h e minutos' },
  { input: '21h30', expected: '21:30', description: 'Com h (noite)' },
  
  // Apenas números
  { input: '9', expected: '09:00', description: 'Apenas um dígito' },
  { input: '09', expected: '09:00', description: 'Dois dígitos' },
  { input: '900', expected: '09:00', description: 'Três dígitos' },
  { input: '0900', expected: '09:00', description: 'Quatro dígitos' },
  { input: '1030', expected: '10:30', description: 'Quatro dígitos com minutos' },
  
  // Com espaços
  { input: ' 9:00 ', expected: '09:00', description: 'Com espaços' },
  { input: ' 9h ', expected: '09:00', description: 'Com espaços e h' },
  
  // Casos inválidos (devem retornar input original)
  { input: '25:00', expected: '25:00', description: 'Hora inválida (deve retornar original)' },
  { input: '09:70', expected: '09:70', description: 'Minuto inválido (deve retornar original)' },
  { input: 'abc', expected: 'abc', description: 'Texto inválido (deve retornar original)' },
];

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  const result = normalizeTime(test.input);
  const success = result === test.expected;
  
  console.log(`Teste ${index + 1}: ${test.description}`);
  console.log(`  Input: "${test.input}"`);
  console.log(`  Esperado: "${test.expected}"`);
  console.log(`  Resultado: "${result}"`);
  console.log(`  Status: ${success ? '✅ PASSOU' : '❌ FALHOU'}`);
  console.log('');
  
  if (success) {
    passed++;
  } else {
    failed++;
  }
});

console.log(`\n📊 Resumo dos testes:`);
console.log(`✅ Passaram: ${passed}`);
console.log(`❌ Falharam: ${failed}`);
console.log(`📈 Taxa de sucesso: ${Math.round((passed / testCases.length) * 100)}%`);

if (failed === 0) {
  console.log('\n🎉 Todos os testes passaram! A função normalizeTime está funcionando corretamente.');
} else {
  console.log('\n⚠️ Alguns testes falharam. Verifique a implementação da função normalizeTime.');
}
