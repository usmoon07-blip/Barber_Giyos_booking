#!/usr/bin/env node
'use strict';

/**
 * .env faylini savol-javob orqali yaratadi.
 * Foydalanuvchi faqat uchta narsani kiritadi: baza manzili, bot tokeni, Telegram ID.
 * Qolganini skript o'zi hisoblab qo'yadi.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

const ENV_PATH = path.resolve(__dirname, '../backend/.env');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (question) => new Promise((resolve) => rl.question(question, (answer) => resolve(answer.trim())));

function line(char = '─') {
  console.log(char.repeat(58));
}

/** Neon manzilini tozalaydi va migratsiya uchun to'g'ridan-to'g'ri manzilni hisoblaydi. */
function parseDatabaseUrl(raw) {
  let url = raw.trim().replace(/^["']|["']$/g, '');

  if (!/^postgres(ql)?:\/\//i.test(url)) {
    return { error: "Manzil 'postgresql://' bilan boshlanishi kerak." };
  }

  // channel_binding Prisma bilan muammo chiqarishi mumkin — olib tashlaymiz
  url = url.replace(/[?&]channel_binding=[^&]*/gi, '');

  if (!/[?&]sslmode=/i.test(url)) {
    url += (url.includes('?') ? '&' : '?') + 'sslmode=require';
  }

  // "?&" yoki oxiridagi "?" kabi noto'g'ri belgilarni tozalaymiz
  url = url.replace(/\?&/, '?').replace(/[?&]$/, '');

  let host;
  try {
    host = new URL(url).hostname;
  } catch (_error) {
    return { error: 'Manzil formati noto’g’ri.' };
  }

  // Migratsiya uchun pooler'siz manzil kerak
  const directUrl = host.includes('-pooler')
    ? url.replace('-pooler', '')
    : url;

  return { databaseUrl: url, directUrl };
}

function validateToken(raw) {
  const token = raw.trim().replace(/^["']|["']$/g, '');
  if (!/^\d{6,}:[A-Za-z0-9_-]{30,}$/.test(token)) {
    return { error: 'Token "123456789:AAH..." ko’rinishida bo’lishi kerak.' };
  }
  return { token };
}

function validateIds(raw) {
  const ids = raw
    .split(/[,\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (!ids.length) return { error: 'Kamida bitta ID kiriting.' };
  if (ids.some((id) => !/^\d+$/.test(id))) return { error: 'ID faqat raqamlardan iborat bo’lishi kerak.' };

  return { ids: ids.join(',') };
}

async function askUntilValid(prompt, validator) {
  for (;;) {
    const answer = await ask(prompt);

    if (!answer) {
      console.log('  ⚠️  Bo’sh qoldirib bo’lmaydi.\n');
      continue;
    }

    const result = validator(answer);
    if (result.error) {
      console.log(`  ⚠️  ${result.error}\n`);
      continue;
    }

    return result;
  }
}

async function main() {
  console.clear();
  line('═');
  console.log("  G'IYOS BARBERSHOP — SOZLASH");
  line('═');
  console.log();

  if (fs.existsSync(ENV_PATH)) {
    console.log('  Sozlamalar fayli allaqachon mavjud.');
    const again = await ask('  Qaytadan sozlaysizmi? (ha / yo’q): ');

    if (!/^(ha|h|yes|y)$/i.test(again)) {
      console.log('\n  ✅ Eski sozlamalar saqlanib qoldi.\n');
      rl.close();
      return;
    }

    fs.copyFileSync(ENV_PATH, `${ENV_PATH}.zaxira`);
    console.log('  (eski fayl .env.zaxira nomi bilan saqlandi)\n');
  }

  console.log('  Uchta narsa kerak. Har birini nusxalab qo’ying.\n');

  line();
  console.log('  1/3  MA’LUMOTLAR BAZASI');
  console.log('       neon.tech → Dashboard → Connect → Connection string');
  line();
  const { databaseUrl, directUrl } = await askUntilValid('\n  Baza manzili: ', parseDatabaseUrl);
  console.log('  ✅ qabul qilindi\n');

  line();
  console.log('  2/3  TELEGRAM BOT TOKENI');
  console.log('       Telegram → @BotFather → /mybots → API Token');
  line();
  const { token } = await askUntilValid('\n  Bot tokeni: ', validateToken);
  console.log('  ✅ qabul qilindi\n');

  line();
  console.log('  3/3  SIZNING TELEGRAM ID RAQAMINGIZ');
  console.log('       Telegram → @userinfobot → Start');
  console.log('       (bir nechta bo’lsa vergul bilan ajrating)');
  line();
  const { ids } = await askUntilValid('\n  Telegram ID: ', validateIds);
  console.log('  ✅ qabul qilindi\n');

  line();
  console.log('  ADMIN PANEL (bo’sh qoldirsangiz standart qiymat qo’yiladi)');
  line();
  const username = (await ask('\n  Login  [giyos]: ')) || 'giyos';
  const password = (await ask('  Parol  [Giyos2026!]: ')) || 'Giyos2026!';

  const env = [
    '# ─── Ma\'lumotlar bazasi (Neon PostgreSQL) ───────────────────────────',
    `DATABASE_URL="${databaseUrl}"`,
    `DIRECT_URL="${directUrl}"`,
    '',
    '# ─── Telegram bot ───────────────────────────────────────────────────',
    `BOT_TOKEN="${token}"`,
    `ADMIN_TELEGRAM_IDS="${ids}"`,
    '',
    '# ─── Mini App manzili (ngrok HTTPS havolasi) ────────────────────────',
    '# Ngrok ishga tushgach shu yerga havolani yozing',
    'MINIAPP_URL=""',
    '',
    '# ─── Admin panel kirish ma\'lumotlari ────────────────────────────────',
    `ADMIN_USERNAME="${username}"`,
    `ADMIN_PASSWORD="${password}"`,
    `JWT_SECRET="${crypto.randomBytes(32).toString('hex')}"`,
    '',
    '# ─── Server ─────────────────────────────────────────────────────────',
    'PORT=3000',
    'TIMEZONE="Asia/Tashkent"',
    'CORS_ORIGINS="http://localhost:5173,http://localhost:5174"',
    'ALLOW_DEV_AUTH="false"',
    'DEV_TELEGRAM_ID="999000111"',
    '',
  ].join('\r\n');

  fs.writeFileSync(ENV_PATH, env, 'utf8');

  console.log();
  line('═');
  console.log('  ✅ SOZLAMALAR SAQLANDI');
  line('═');
  console.log();
  console.log('  Admin panel:  http://localhost:3000/admin');
  console.log(`  Login:        ${username}`);
  console.log(`  Parol:        ${password}`);
  console.log();
  console.log('  ⚠️  Bu ma’lumotlarni hech kimga bermang.');
  console.log();

  rl.close();
}

main().catch((error) => {
  console.error('\n  ❌ Xatolik:', error.message, '\n');
  rl.close();
  process.exit(1);
});
