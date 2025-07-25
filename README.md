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
├── index.js                # Bot principal do WhatsApp
├── appointment.js          # Funções de agendamento
├── appointmentDirect.js    # Inclusão direta de agendamento
├── appointmentCancel.js    # Cancelamento de agendamento
├── block.js                # Bloqueio de datas/horários
├── googleSheets.js         # Integração com Google Sheets
├── config.js               # Configurações gerais
├── utils.js                # Funções utilitárias
├── responses.js            # Respostas automáticas (se usado)
├── credentials_sheet.json  # Credenciais da API Google (NÃO versionar)
├── credentials_template.json # Exemplo de credenciais
├── package.json            # Dependências do projeto
├── package-lock.json       # Lockfile do npm
├── README.md               # Este arquivo
├── Painelhtml/             # Dashboard web (opcional)
│   ├── server.js           # Servidor Express
│   ├── dashboard.html      # Interface do dashboard
│   ├── dashboard_new.html  # Nova interface (opcional)
│   ├── login.html          # Login do painel
│   └── public/             # Arquivos estáticos (imagens, etc)
├── .env.example            # Exemplo de variáveis de ambiente
├── setup.bat / setup.sh    # Scripts de instalação (opcional)
├── start_system.bat        # Script para iniciar o sistema (opcional)
├── stop_system.bat         # Script para parar o sistema (opcional)
└── ... outros arquivos auxiliares
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

Crie uma planilha Google Sheets com as seguintes abas e colunas:
- **Agendamentos**
  - C: Data
  - D: Hora
  - E: Cliente
  - F: Telefone
  - G: Serviço
  - H: Profissional
  - (Opcional: A, B para Data/Hora de contato, I para fórmulas internas)
- **Cancelados**
  - Mesma estrutura da aba Agendamentos, acrescente coluna para Motivo do Cancelamento
- **Respostas Automáticas**
  - A: Etapa
  - B: Profissional (opcional)
  - C: Texto Recebido
  - D: Resposta
- **Serviços**
  - Código, Descrição, Preço
- **Datas Bloqueadas/Feriados**
  - Data
- **Concatenar**
  - Horários bloqueados

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

#### Comandos Administrativos e Suas Funções

```
Incluir:
Nome do Cliente
DD/MM
HH:MM
Código do Serviço
Profissional
```
*Inclui um novo agendamento diretamente na planilha, sem passar pelo fluxo tradicional do cliente. Útil para agendamentos feitos pelo administrador.*

```
Cancelar:
DD/MM
HH:MM
Profissional
```
*Cancela um agendamento existente na data, horário e profissional informados. Remove da agenda e registra no histórico de cancelamentos.*

**Agenda do dia DD/MM**
*Retorna a lista de todos os agendamentos registrados para a data informada, mostrando horário, profissional, serviço e cliente.*

**Resumo do dia DD/MM**
*Preenche a célula A1 da aba "Resumo do Dia" na planilha com a data informada, aguarda o cálculo automático e retorna o valor de H1 (resumo do dia) para o WhatsApp. Útil para obter um relatório financeiro ou resumo administrativo do dia.*

```
Bloquear Data:
DD/MM
```
*Bloqueia todos os horários de uma data específica para todos os profissionais, impedindo novos agendamentos nesse dia.*

```
Bloquear Horário:
DD/MM
HH:MM (início)
HH:MM (término)
Profissional
```
*Bloqueia um intervalo de horários em uma data específica para um profissional, impedindo agendamentos nesses horários.*

## 🔧 Configurações Avançadas


### Horários de Funcionamento
Edite o array `availableTimes` no `config.js`:
```javascript
const availableTimes = [
  "08:00", "08:30", "09:00", "09:30",
  // ... adicione seus horários
];
```

### Lembretes Automáticos
Configure os horários no array `reminderTimes` no `config.js`:
```javascript
const reminderTimes = [
  "08:30", "09:00", "09:30",
  // ... horários para verificar lembretes
];
```


### Agenda Diária
- **Manhã**: 08:00 - Agenda do dia enviada automaticamente
- **Noite**: 20:15 - Resumo do dia enviado automaticamente

## 🐛 Solução de Problemas


### Bot não conecta no WhatsApp
1. Verifique se o WhatsApp Web está funcionando no navegador
2. Delete a pasta `.wwebjs_auth` e escaneie o QR novamente
3. Verifique se não há outras sessões ativas no WhatsApp Web


### Erro na API do Google Sheets
1. Verifique se as credenciais (`credentials_sheet.json`) estão corretas
2. Confirme se a planilha foi compartilhada com o email do service account
3. Verifique se a Google Sheets API está habilitada no Google Cloud


### Dashboard não carrega
1. Verifique se o servidor Express (`Painelhtml/server.js`) está rodando
2. Confirme se as portas não estão em conflito
3. Verifique os logs no console do servidor


## 📈 Deploy em Produção

### Railway (Recomendado)
1. Conecte seu repositório GitHub
2. Configure as variáveis de ambiente e credenciais
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

- **Email**: cesartuala@hotmail.com
- **WhatsApp**: 
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
