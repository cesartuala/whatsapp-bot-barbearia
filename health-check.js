const express = require('express');
const app = express();

// Health check endpoint for Google Cloud
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'whatsapp-bot-barbearia'
  });
});

app.get('/', (req, res) => {
  res.status(200).json({
    message: 'WhatsApp Bot Barbearia is running',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Health check server running on port ${PORT}`);
});

module.exports = app;
