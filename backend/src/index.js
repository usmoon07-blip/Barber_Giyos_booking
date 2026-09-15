'use strict';

const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');

const { config, validateConfig } = require('./config/default');
const { connectDatabase, disconnectDatabase } = require('./database/connection');
const { startBot, stopBot } = require('./core/bot');
const { startReminderJob } = require('./jobs/reminder.job');
const { startAutoCompleteJob } = require('./jobs/autocomplete.job');
const { notFoundHandler, errorHandler } = require('./middlewares/error.middleware');

const botRoutes = require('./routes/bot.routes');
const clientRoutes = require('./routes/client.routes');
const adminRoutes = require('./routes/admin.routes');

const MINIAPP_DIST = path.resolve(__dirname, '../../miniapp/dist');
const ADMIN_DIST = path.resolve(__dirname, '../../admin/dist');

function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.use(
    cors({
      origin(origin, callback) {
        // Telegram Mini App va ngrok so'rovlarida origin bo'lmasligi mumkin
        if (!origin) return callback(null, true);
        if (config.cors.origins.includes(origin)) return callback(null, true);
        if (/^https:\/\/[\w-]+\.(ngrok-free\.app|ngrok\.io|ngrok-free\.dev|trycloudflare\.com)$/.test(origin)) {
          return callback(null, true);
        }
        return callback(null, false);
      },
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Telegram-Init-Data'],
    })
  );

  // Sog'liq tekshiruvi
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'barber-giyos', time: new Date().toISOString() });
  });

  app.use('/api/bot', botRoutes);
  app.use('/api/client', clientRoutes);
  app.use('/api/admin', adminRoutes);

  // Admin panel build (agar yig'ilgan bo'lsa) — /admin manzilida
  if (fs.existsSync(ADMIN_DIST)) {
    app.use('/admin', express.static(ADMIN_DIST));
    app.get(/^\/admin(\/.*)?$/, (_req, res) => {
      res.sendFile(path.join(ADMIN_DIST, 'index.html'));
    });
  }

  // Mini App build (ngrok shu manzilga ulanadi) — /
  if (fs.existsSync(MINIAPP_DIST)) {
    app.use(express.static(MINIAPP_DIST));
    app.get(/^(?!\/api).*/, (_req, res) => {
      res.sendFile(path.join(MINIAPP_DIST, 'index.html'));
    });
  } else {
    app.get('/', (_req, res) => {
      res.type('html').send(
        `<!doctype html><html lang="uz"><head><meta charset="utf-8">
         <title>G'iyos Barbershop API</title>
         <style>body{font-family:system-ui,sans-serif;max-width:640px;margin:80px auto;padding:0 24px;line-height:1.6;color:#111}
         code{background:#f4f4f5;padding:2px 6px;border-radius:4px}</style></head>
         <body><h1>💈 Server ishlayapti</h1>
         <p>Mini App hali yig'ilmagan. Uni ko'rish uchun terminalda:</p>
         <p><code>cd miniapp</code> → <code>npm run build</code></p>
         <p>So'ng serverni qayta ishga tushiring.</p>
         <p>API holati: <a href="/api/health">/api/health</a></p></body></html>`
      );
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

async function bootstrap() {
  validateConfig();

  await connectDatabase();
  console.log('🗄️  Ma\'lumotlar bazasiga ulandi');

  const app = createApp();

  const server = app.listen(config.port, () => {
    console.log(`🚀 Server: http://localhost:${config.port}`);
    console.log(`   Mini App:     http://localhost:${config.port}/`);
    console.log(`   Admin API:    http://localhost:${config.port}/api/admin`);
    console.log(`   Vaqt mintaqasi: ${config.timezone}`);
  });

  await startBot();
  startReminderJob();
  startAutoCompleteJob();

  const shutdown = async (signal) => {
    console.log(`\n${signal} — to'xtatilmoqda...`);
    await stopBot(signal);
    server.close();
    await disconnectDatabase();
    process.exit(0);
  };

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((error) => {
  console.error('❌ Ishga tushmadi:', error.message);
  process.exit(1);
});

module.exports = { createApp };
