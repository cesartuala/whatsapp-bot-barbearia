# 💈 WhatsApp Bot Barbearia

Bot de WhatsApp para agendamento automático de barbearia com integração ao Google Sheets.

## 🚀 Funcionalidades

- ✅ Agendamento automático via WhatsApp
- ✅ Integração com Google Sheets para armazenamento
- ✅ Verificação de disponibilidade em tempo real
- ✅ Cancelamento de agendamentos
- ✅ Bloqueio de datas e horários
- ✅ Agenda diária automática
- ✅ Sistema de lembretes
- ✅ Solicitação automática de avaliações
- ✅ Múltiplos profissionais
- ✅ Validação flexível de horários

## 📋 Pré-requisitos

- Node.js 18+
- Conta Google com acesso ao Google Sheets API
- WhatsApp Business ou pessoal
- Google Cloud Platform (para deploy)

## 🛠️ Instalação Local

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/whatsapp-bot-barbearia.git
cd whatsapp-bot-barbearia
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

4. Configure o Google Sheets:
   - Crie um projeto no Google Cloud Console
   - Ative a API do Google Sheets
   - Crie credenciais de conta de serviço
   - Baixe o arquivo JSON e renomeie para `credentials_sheet.json`

5. Execute o bot:
```bash
npm start
```

## ☁️ Deploy no Google Cloud

### Preparação

1. Instale o Google Cloud CLI
2. Faça login: `gcloud auth login`
3. Configure o projeto: `gcloud config set project SEU_PROJECT_ID`

### Deploy

```bash
# Deploy para produção
npm run deploy

# Deploy para staging
npm run deploy-staging

# Visualizar logs
npm run logs
```

## 📱 Como Usar

### Comandos do Cliente

- `AGENDAMENTO` - Iniciar novo agendamento
- `CANCELAR` - Cancelar agendamento existente
- `NOVO` - Fazer novo agendamento (quando já tem um)
- `VOLTAR` - Voltar etapa anterior
- `INICIO` - Reiniciar processo

### Comandos Administrativos

#### Agendamento Direto:
```
Agendar:
João Silva
25/12
14:00
1
João
```

#### Inclusão Direta:
```
Incluir:
Maria Santos
26/12
15:30
2
Pedro
```

#### Cancelamento:
```
Cancelar:
25/12
14:00
João
```

#### Consultar Agenda:
```
Agenda do dia 25/12
```

#### Bloquear Data:
```
Bloquear Data: 25/12
```

#### Bloquear Horário:
```
Bloquear Horário:
25/12
14:00
16:00
João
```

## 🔧 Configuração

### Google Sheets
Configure sua planilha com as seguintes abas:
- `Respostas` - Respostas automáticas do bot
- `Agendamentos` - Agendamentos realizados
- `Cancelados` - Agendamentos cancelados
- `Serviços` - Lista de serviços disponíveis

### Variáveis de Ambiente
```env
GOOGLE_SPREADSHEET_ID=sua_planilha_id
BOT_NAME=Nome da Barbearia
OWNER_PHONE=5511999999999@c.us
NODE_ENV=production
TZ=America/Sao_Paulo
```

## 📊 Estrutura do Projeto

```
whatsapp-bot-barbearia/
├── index.js              # Arquivo principal do bot
├── appointment.js         # Módulo de agendamentos
├── appointmentCancel.js   # Módulo de cancelamentos
├── appointmentDirect.js   # Módulo de inclusão direta
├── block.js              # Módulo de bloqueios
├── config.js             # Configurações gerais
├── googleSheets.js       # Integração Google Sheets
├── utils.js              # Funções utilitárias
├── health-check.js       # Health check para cloud
├── app.yaml              # Configuração Google App Engine
├── Dockerfile            # Container Docker
└── README.md             # Este arquivo
```

## 🚀 Scripts Disponíveis

- `npm start` - Iniciar o bot
- `npm run dev` - Modo desenvolvimento com nodemon
- `npm test` - Executar testes
- `npm run deploy` - Deploy para produção
- `npm run deploy-staging` - Deploy para staging
- `npm run logs` - Visualizar logs do cloud

## 🐛 Solução de Problemas

### QR Code não aparece
- Verifique se o Chrome está instalado
- Confirme o caminho do executável no código

### Erro de autenticação Google
- Verifique o arquivo `credentials_sheet.json`
- Confirme as permissões da planilha

### Bot não responde
- Verifique a conexão com internet
- Confirme se o WhatsApp Web está ativo

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## � Suporte

Em caso de dúvidas ou problemas, abra uma issue no GitHub ou entre em contato.

---

💈 **Desenvolvido para automatizar agendamentos de barbearia via WhatsApp**

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