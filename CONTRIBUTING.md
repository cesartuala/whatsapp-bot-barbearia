# Contribuindo para o WhatsApp Bot Barbearia

Obrigado por considerar contribuir para nosso projeto! 🙏

## 🚀 Como Contribuir

### 1. Fork do Projeto
- Faça um fork do repositório
- Clone seu fork localmente

```bash
git clone https://github.com/seu-usuario/whatsapp-bot-barbearia.git
cd whatsapp-bot-barbearia
```

### 2. Configuração do Ambiente
```bash
npm install
cp .env.example .env
# Configure suas credenciais no .env
```

### 3. Criando uma Branch
```bash
git checkout -b feature/nome-da-sua-feature
# ou
git checkout -b fix/nome-do-bug
```

### 4. Padrões de Código

#### Commits
Use commits semânticos:
- `feat:` nova funcionalidade
- `fix:` correção de bug
- `docs:` documentação
- `style:` formatação
- `refactor:` refatoração
- `test:` testes
- `chore:` tarefas gerais

Exemplo:
```bash
git commit -m "feat: adicionar notificação de aniversário"
```

#### Código JavaScript
- Use `const` e `let` ao invés de `var`
- Prefira arrow functions quando apropriado
- Comente código complexo
- Use nomes descritivos para variáveis e funções

### 5. Submissão

```bash
git push origin feature/nome-da-sua-feature
```

Depois abra um Pull Request explicando:
- O que foi implementado/corrigido
- Como testar
- Screenshots (se aplicável)

## 🐛 Reportando Bugs

Ao reportar um bug, inclua:
- Descrição clara do problema
- Passos para reproduzir
- Comportamento esperado vs atual
- Screenshots ou logs
- Ambiente (OS, Node version, etc.)

## 💡 Sugerindo Features

Para sugerir novas funcionalidades:
- Verifique se já não existe uma issue similar
- Explique o problema que a feature resolve
- Descreva a solução proposta
- Considere implementações alternativas

## 📋 Áreas que Precisam de Ajuda

- [ ] Testes unitários
- [ ] Documentação
- [ ] Tradução para outros idiomas
- [ ] Otimização de performance
- [ ] Integração com outras APIs
- [ ] Interface mobile

## ✅ Checklist do PR

Antes de submeter seu PR, verifique:

- [ ] Código segue os padrões do projeto
- [ ] Commits são semânticos e descritivos
- [ ] Documentação foi atualizada (se necessário)
- [ ] Testei localmente
- [ ] Não quebra funcionalidades existentes
- [ ] Adicionei comentários em código complexo

## 🎯 Prioridades Atuais

1. **Testes** - Adicionar cobertura de testes
2. **Performance** - Otimizar consultas ao Google Sheets
3. **Segurança** - Implementar rate limiting
4. **UX** - Melhorar mensagens de erro
5. **Docs** - Tutoriais em vídeo

## 📞 Contato

Dúvidas sobre contribuição?
- Abra uma issue com a tag `question`
- WhatsApp: (11) 93954-5171
- Email: cesar@barbeariastyle.com

---

**Sua contribuição faz a diferença! 🚀**
