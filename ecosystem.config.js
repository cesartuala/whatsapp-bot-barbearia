// Configuração PM2 para produção
module.exports = {
  apps: [{
    name: 'whatsapp-bot-barbearia',
    script: 'monitor.js',
    
    // Configurações de instância
    instances: 1,
    exec_mode: 'fork',
    
    // Configurações de restart
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    
    // Configurações de logs
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Variáveis de ambiente
    env: {
      NODE_ENV: 'production',
      TZ: 'America/Sao_Paulo'
    },
    
    // Configurações de restart automático
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 5000,
    
    // Configurações de kill
    kill_timeout: 5000,
    listen_timeout: 8000,
    
    // Configurações de merge
    merge_logs: true,
    
    // Configurações de cron para restart diário
    cron_restart: '0 4 * * *', // Restart às 4h da manhã
    
    // Configurações de monitoramento
    monitoring: false,
    
    // Configurações de source map
    source_map_support: true,
    
    // Configurações de NODE
    node_args: '--max-old-space-size=1024'
  }],
  
  // Configuração de deploy (opcional)
  deploy: {
    production: {
      user: 'ubuntu',
      host: 'seu-servidor.com',
      ref: 'origin/main',
      repo: 'https://github.com/cesartuala/whatsapp-bot-barbearia.git',
      path: '/home/ubuntu/whatsapp-bot-barbearia',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production'
    }
  }
};
