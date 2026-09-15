#!/usr/bin/env node
'use strict';

/**
 * Tekshiruv skripti — nima ishlayapti, nima ishlamayapti va nima qilish kerak.
 * Har bir xato uchun oddiy tilda yechim ko'rsatiladi.
 */

const fs = require('fs');
const net = require('net');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ENV_PATH = path.join(ROOT, 'backend', '.env');

const results = [];

/** Uzun xato matnidan birinchi ma'noli qatorni oladi. */
function firstLine(message) {
  return (
    String(message || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)[0] || 'sabab aniqlanmadi'
  );
}

function ok(title, detail) {
  results.push({ level: 'ok', title, detail });
}

function warn(title, detail, fix) {
  results.push({ level: 'warn', title, detail, fix });
}

function fail(title, detail, fix) {
  results.push({ level: 'fail', title, detail, fix });
}

/** .env faylini o'qib, kalit=qiymat ko'rinishida qaytaradi. */
function readEnv() {
  if (!fs.existsSync(ENV_PATH)) return null;

  const env = {};
  for (const raw of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;

    const index = line.indexOf('=');
    if (index === -1) continue;

    env[line.slice(0, index).trim()] = line
      .slice(index + 1)
      .trim()
      .replace(/^["']|["']$/g, '');
  }
  return env;
}

function checkPortFree(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: '127.0.0.1', port, timeout: 1500 });
    socket.on('connect', () => {
      socket.destroy();
      resolve(false); // band
    });
    socket.on('error', () => resolve(true));
    socket.on('timeout', () => {
      socket.destroy();
      resolve(true);
    });
  });
}

async function checkNode() {
  const major = Number(process.versions.node.split('.')[0]);
  if (major >= 18) ok('Node.js', `versiya ${process.versions.node}`);
  else
    fail(
      'Node.js juda eski',
      `hozirgi versiya ${process.versions.node}`,
      'nodejs.org saytidan LTS versiyasini o’rnating va kompyuterni qayta yoqing.'
    );
}

async function checkEnv(env) {
  if (!env) {
    fail(
      'Sozlamalar fayli yo’q',
      'backend\\.env topilmadi',
      'BOSHLASH.bat faylini ishga tushiring — u sizdan ma’lumotlarni so’rab, faylni o’zi yaratadi.'
    );
    return false;
  }

  const required = ['DATABASE_URL', 'DIRECT_URL', 'BOT_TOKEN', 'ADMIN_PASSWORD', 'JWT_SECRET'];
  const missing = required.filter((key) => !env[key]);

  if (missing.length) {
    fail(
      'Sozlamalar to’liq emas',
      `yetishmayapti: ${missing.join(', ')}`,
      'BOSHLASH.bat ni qayta ishga tushirib, sozlashni boshidan o’tkazing.'
    );
    return false;
  }

  ok('Sozlamalar fayli', 'barcha kerakli qiymatlar joyida');

  if (!env.ADMIN_TELEGRAM_IDS) {
    warn(
      'Telegram ID kiritilmagan',
      'yangi bronlar haqida sizga xabar kelmaydi',
      '.env faylida ADMIN_TELEGRAM_IDS ga @userinfobot bergan raqamni yozing.'
    );
  }

  if (!env.MINIAPP_URL) {
    warn(
      'Mini App havolasi yo’q',
      'botdagi "Bron qilish" tugmasi hali ishlamaydi',
      '4-NGROK.bat ni ishga tushiring, bergan https havolasini .env dagi MINIAPP_URL ga yozing.'
    );
  } else if (!env.MINIAPP_URL.startsWith('https://')) {
    fail(
      'Mini App havolasi noto’g’ri',
      `hozir: ${env.MINIAPP_URL}`,
      'Havola albatta https:// bilan boshlanishi kerak (ngrok bergan manzil).'
    );
  } else {
    ok('Mini App havolasi', env.MINIAPP_URL);
  }

  return true;
}

async function checkDatabase(env) {
  let PrismaClient;
  try {
    ({ PrismaClient } = require(path.join(ROOT, 'backend', 'node_modules', '@prisma/client')));
  } catch (_error) {
    warn(
      'Paketlar o’rnatilmagan',
      'backend\\node_modules topilmadi',
      'BOSHLASH.bat ni ishga tushiring — u paketlarni o’zi o’rnatadi.'
    );
    return;
  }

  const prisma = new PrismaClient({
    datasources: { db: { url: env.DATABASE_URL } },
    log: [],
  });

  try {
    await prisma.$queryRawUnsafe('SELECT 1');
    ok('Ma’lumotlar bazasi', 'ulanish muvaffaqiyatli');
  } catch (error) {
    await prisma.$disconnect().catch(() => {});
    fail(
      'Bazaga ulanib bo’lmadi',
      firstLine(error.message),
      'Neon bazasi uxlab qolgan bo’lishi mumkin: console.neon.tech ga kiring, baza o’zi uyg’onadi. ' +
        'Internet ulanishini va .env dagi DATABASE_URL ni ham tekshiring.'
    );
    return;
  }

  try {
    const [barbers, services, settings] = await Promise.all([
      prisma.barber.count(),
      prisma.service.count(),
      prisma.siteSetting.count(),
    ]);

    if (!barbers || !services || !settings) {
      warn(
        'Baza bo’sh',
        `barberlar: ${barbers}, xizmatlar: ${services}`,
        'backend papkasida "npm run seed" buyrug’ini bajaring.'
      );
    } else {
      ok('Baza to’ldirilgan', `${barbers} ta barber, ${services} ta xizmat`);
    }

    const appointments = await prisma.appointment.count();
    ok('Bronlar', `${appointments} ta yozuv`);
  } catch (error) {
    fail(
      'Jadvallar yaratilmagan',
      firstLine(error.message),
      'backend papkasida "npx prisma migrate deploy" buyrug’ini bajaring.'
    );
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

async function checkBot(env) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/getMe`, {
      signal: AbortSignal.timeout(15000),
    });
    const payload = await response.json();

    if (payload.ok) {
      ok('Telegram bot', `@${payload.result.username} — token to’g’ri`);
    } else {
      fail(
        'Bot tokeni noto’g’ri',
        payload.description || 'Telegram tokenni qabul qilmadi',
        'Telegram → @BotFather → /mybots → botingiz → API Token. Yangi tokenni .env ga yozing.'
      );
    }
  } catch (error) {
    fail(
      'Telegram bilan bog’lanib bo’lmadi',
      /timeout|abort/i.test(error.message)
        ? 'Telegram javob bermadi (vaqt tugadi)'
        : 'Telegram serveriga ulanib bo’lmadi',
      'Internet ulanishini tekshiring. O’zbekistonda Telegram ba’zan sekin ishlaydi — ' +
        'birozdan so’ng qayta urinib ko’ring. VPN yoki antivirus ham to’sayotgan bo’lishi mumkin.'
    );
  }
}

async function checkBuilds() {
  const miniapp = fs.existsSync(path.join(ROOT, 'miniapp', 'dist', 'index.html'));
  const admin = fs.existsSync(path.join(ROOT, 'admin', 'dist', 'index.html'));

  if (miniapp) ok('Mini App yig’ilgan', 'miniapp\\dist tayyor');
  else
    fail(
      'Mini App yig’ilmagan',
      'miniapp\\dist topilmadi',
      'miniapp papkasida "npm run build" buyrug’ini bajaring.'
    );

  if (admin) ok('Admin Panel yig’ilgan', 'admin\\dist tayyor');
  else
    fail(
      'Admin Panel yig’ilmagan',
      'admin\\dist topilmadi',
      'admin papkasida "npm run build" buyrug’ini bajaring.'
    );
}

async function checkPort(env) {
  const port = Number(env.PORT || 3000);
  const free = await checkPortFree(port);

  if (free) {
    ok(`Port ${port}`, 'bo’sh — server ishga tusha oladi');
  } else {
    // Server allaqachon ishlayotgan bo'lishi ham mumkin
    try {
      const response = await fetch(`http://localhost:${port}/api/health`, {
        signal: AbortSignal.timeout(4000),
      });
      const payload = await response.json();

      if (payload.ok) {
        ok(`Server ishlayapti`, `http://localhost:${port}`);
        return;
      }
    } catch (_error) {
      /* boshqa dastur band qilgan */
    }

    warn(
      `Port ${port} band`,
      'boshqa dastur shu portni egallagan',
      `.env faylida PORT=3001 qilib qo’ying va ngrok'ni ham "ngrok http 3001" bilan ishga tushiring.`
    );
  }
}

async function main() {
  console.log();
  console.log('═'.repeat(58));
  console.log('  TEKSHIRUV');
  console.log('═'.repeat(58));
  console.log();

  await checkNode();

  const env = readEnv();
  const envOk = await checkEnv(env);

  if (envOk) {
    await checkBuilds();
    await checkDatabase(env);
    await checkBot(env);
    await checkPort(env);
  }

  const icons = { ok: '✅', warn: '⚠️ ', fail: '❌' };

  for (const item of results) {
    console.log(`  ${icons[item.level]} ${item.title}`);
    if (item.detail) console.log(`      ${item.detail}`);
    if (item.fix) {
      console.log();
      console.log(`      👉 ${item.fix}`);
    }
    console.log();
  }

  const failures = results.filter((item) => item.level === 'fail').length;
  const warnings = results.filter((item) => item.level === 'warn').length;

  console.log('═'.repeat(58));

  if (failures) {
    console.log(`  ${failures} ta jiddiy muammo topildi — yuqoridagi 👉 ni bajaring`);
  } else if (warnings) {
    console.log(`  Asosiy qismlar joyida. ${warnings} ta eslatma bor.`);
  } else {
    console.log('  🎉 Hammasi joyida! Bot ishlashga tayyor.');
  }

  console.log('═'.repeat(58));
  console.log();
}

main().catch((error) => {
  console.error('\n  ❌ Tekshiruvda xatolik:', error.message, '\n');
  process.exit(1);
});
