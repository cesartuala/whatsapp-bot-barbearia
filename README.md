# 💈 WhatsApp Bot para Barbearia - Sistema de Agendamentos

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![WhatsApp](https://img.shields.io/badge/WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)
![Google Sheets](https://img.shields.io/badge/Google%20Sheets-34A853?style=for-the-badge&logo=google-sheets&logoColor=white)

Um sistema completo de agendamentos para barbearias usando WhatsApp Web e Google Sheets como banco de dados.

## 🚀 Funcionalidades

### 🤖 Bot do WhatsApp
- ✅ **Agendamento automático** via conversação natural
- ✅ **Verificação de disponibilidade** em tempo real
- ✅ **Cancelamento de agendamentos** 
- ✅ **Lembretes automáticos** 30 minutos antes
- ✅ **Solicitação de avaliação** 3 horas após o atendimento
- ✅ **Agenda diária** enviada automaticamente
- ✅ **Comandos administrativos** (Incluir, Cancelar, Bloquear)

### 📊 Dashboard Web
- ✅ **Painel administrativo** com gráficos
- ✅ **Visualização de agendamentos**
- ✅ **Relatórios de faturamento**
- ✅ **Gestão de profissionais e serviços**

### 📋 Integração Google Sheets
- ✅ **Armazenamento automático** de agendamentos
- ✅ **Histórico de cancelamentos**
- ✅ **Controle de datas bloqueadas**
- ✅ **Gestão de horários por profissional**

## 🛠️ Tecnologias Utilizadas

- **Node.js** - Runtime JavaScript
- **whatsapp-web.js** - Integração com WhatsApp Web
- **Google Sheets API** - Banco de dados
- **Puppeteer** - Automação do navegador
- **Express.js** - Servidor web para dashboard
- **Chart.js** - Gráficos no dashboard

## 📁 Estrutura do Projeto

```
📁 whatsapp-bot-barbearia/
├── 📄 index.js              # Bot principal do WhatsApp
├── 📄 package.json          # Dependências do projeto
├── 📄 googleCalendar.js     # Integração com Google Calendar
├── 📁 Painelhtml/           # Dashboard web
│   ├── 📄 server.js         # Servidor Express
│   ├── 📄 dashboard.html    # Interface do dashboard
│   └── 📁 public/           # Arquivos estáticos
├── 📄 credentials_template.json  # Template para credenciais
└── 📄 .env.example         # Variáveis de ambiente
```

## ⚙️ Configuração

### 1. Pré-requisitos
- Node.js 16+ instalado
- Conta Google com Sheets API habilitada
- WhatsApp Web funcional

### 2. Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/whatsapp-bot-barbearia.git
cd whatsapp-bot-barbearia

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
```

### 3. Configuração Google Sheets API

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione existente
3. Habilite a Google Sheets API
4. Crie credenciais de service account
5. Baixe o arquivo JSON e renomeie para `credentials_sheet.json`
6. Compartilhe sua planilha com o email do service account

### 4. Configuração da Planilha

Crie uma planilha Google Sheets com as seguintes abas:
- **Agendamentos** - Colunas: Data Contato, Hora Contato, Data, Hora, Cliente, Telefone, Serviço, Profissional
- **Cancelados** - Mesma estrutura + Motivo do Cancelamento
- **Respostas Automáticas** - Etapa, Texto Recebido, Resposta, Profissional
- **Serviços** - Código, Descrição, Preço
- **Datas Bloqueadas/Feriados** - Data
- **Concatenar** - Horários bloqueados

## 🚀 Execução

### Modo Desenvolvimento
```bash
npm start
```

### Modo Produção
```bash
npm run start:prod
```

### Dashboard Web
```bash
cd Painelhtml
npm install
npm start
```

Acesse: `http://localhost:3000`

## 📱 Comandos do WhatsApp

### Para Clientes
- `AGENDAMENTO` - Inicia processo de agendamento
- `CANCELAR` - Cancela agendamento existente
- `NOVO` - Inicia novo agendamento
- `VOLTAR` - Volta etapa anterior
- `INICIO` - Reinicia processo

### Para Administradores
```
Incluir:
Nome do Cliente
DD/MM
HH:MM
Código do Serviço
Profissional
```

```
Cancelar:
DD/MM
HH:MM
Profissional
```

```
Agenda do dia DD/MM
```

```
Bloquear Data:
DD/MM
```

```
Bloquear Horário:
DD/MM
HH:MM (início)
HH:MM (término)
Profissional
```

## 🔧 Configurações Avançadas

### Horários de Funcionamento
Edite o array `availableTimes` no `index.js`:
```javascript
const availableTimes = [
  "08:00", "08:30", "09:00", "09:30",
  // ... adicione seus horários
];
```

### Lembretes Automáticos
Configure os horários no array `reminderTimes`:
```javascript
const reminderTimes = [
  "08:30", "09:00", "09:30",
  // ... horários para verificar lembretes
];
```

### Agenda Diária
- **Manhã**: 08:00 - Agenda do dia
- **Noite**: 20:15 - Resumo do dia

## 🐛 Solução de Problemas

### Bot não conecta no WhatsApp
1. Verifique se o WhatsApp Web está funcionando no navegador
2. Delete a pasta `.wwebjs_auth` e escaneie QR novamente
3. Verifique se não há outras sessões ativas

### Erro na API do Google Sheets
1. Verifique se as credenciais estão corretas
2. Confirme se a planilha foi compartilhada com o service account
3. Verifique se a Google Sheets API está habilitada

### Dashboard não carrega
1. Verifique se o servidor Express está rodando
2. Confirme se as portas não estão em conflito
3. Verifique os logs no console

## 📈 Deploy em Produção

### Railway (Recomendado)
1. Conecte seu repositório GitHub
2. Configure as variáveis de ambiente
3. Deploy automático

### Outras Opções
- Render
- Heroku
- DigitalOcean
- VPS própria

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

- **Email**: cesar@barbeariastyle.com
- **WhatsApp**: (11) 93954-5171
- **Issues**: [GitHub Issues](https://github.com/seu-usuario/whatsapp-bot-barbearia/issues)

## 🎯 Roadmap

- [ ] Integração com WhatsApp Business API
- [ ] Sistema de pagamentos online
- [ ] App mobile para clientes
- [ ] Integração com calendários externos
- [ ] Sistema de fidelidade
- [ ] Relatórios avançados

---

### 💈 Desenvolvido com ❤️ para Barbearia Santana

**Transforme seu negócio com automação inteligente!**
