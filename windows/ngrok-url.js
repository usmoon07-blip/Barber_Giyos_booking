#!/usr/bin/env node
'use strict';

/**
 * Ngrok bergan HTTPS havolasini o'zi topib, backend/.env fayliga yozadi.
 * Shu tufayli foydalanuvchi havolani qo'lda ko'chirib o'tirmaydi.
 */

const fs = require('fs');
const path = require('path');

const ENV_PATH = path.resolve(__dirname, '../backend/.env');
const NGROK_API = 'http://127.0.0.1:4040/api/tunnels';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Ngrok ishga tushishini kutadi va https havolasini qaytaradi. */
async function findTunnel(attempts = 30) {
  for (let index = 0; index < attempts; index += 1) {
    try {
      const response = await fetch(NGROK_API, { signal: AbortSignal.timeout(3000) });
      const payload = await response.json();

      const tunnel = (payload.tunnels || []).find((item) => item.public_url?.startsWith('https://'));
      if (tunnel) return tunnel.public_url;
    } catch (_error) {
      /* hali ishga tushmagan */
    }

    if (index === 0) process.stdout.write('  Ngrok kutilmoqda');
    else process.stdout.write('.');

    await wait(1000);
  }

  return null;
}

/** .env faylidagi MINIAPP_URL qiymatini yangilaydi. */
function updateEnv(url) {
  if (!fs.existsSync(ENV_PATH)) return { error: 'backend\\.env topilmadi' };

  const content = fs.readFileSync(ENV_PATH, 'utf8');
  const line = `MINIAPP_URL="${url}"`;

  const updated = /^MINIAPP_URL=.*$/m.test(content)
    ? content.replace(/^MINIAPP_URL=.*$/m, line)
    : `${content.trimEnd()}\r\n${line}\r\n`;

  const previous = content.match(/^MINIAPP_URL="?([^"\r\n]*)"?$/m);

  fs.writeFileSync(ENV_PATH, updated, 'utf8');

  return { changed: !previous || previous[1] !== url };
}

async function main() {
  const url = await findTunnel();
  console.log();

  if (!url) {
    console.log();
    console.log('  ❌ Ngrok havolasi topilmadi.');
    console.log();
    console.log('     Ngrok oynasi ochilganini va unda xato');
    console.log('     yozuvi yo’qligini tekshiring.');
    console.log();
    process.exit(1);
  }

  const result = updateEnv(url);

  console.log('  ════════════════════════════════════════════════════');
  console.log('    HAVOLA TAYYOR');
  console.log('  ════════════════════════════════════════════════════');
  console.log();
  console.log(`    ${url}`);
  console.log();

  if (result.error) {
    console.log(`    ⚠️  ${result.error} — havolani qo’lda yozing.`);
  } else if (result.changed) {
    console.log('    ✅ Havola sozlamalarga yozildi.');
    console.log();
    console.log('    ⚠️  SERVERNI QAYTA ISHGA TUSHIRING:');
    console.log('       server oynasida Ctrl+C bosing, so’ng');
    console.log('       BOSHLASH.bat ni qaytadan oching.');
  } else {
    console.log('    ✅ Havola o’zgarmadi — server qayta ishga');
    console.log('       tushirilishi shart emas.');
  }

  console.log();
  console.log('  ════════════════════════════════════════════════════');
  console.log('    BOTFATHER SOZLAMASI (bir marta)');
  console.log('  ════════════════════════════════════════════════════');
  console.log();
  console.log('    1. Telegram → @BotFather');
  console.log('    2. /mybots → botingizni tanlang');
  console.log('    3. Bot Settings → Menu Button');
  console.log('    4. Configure menu button');
  console.log('    5. Quyidagi havolani yuboring:');
  console.log();
  console.log(`       ${url}`);
  console.log();
  console.log('    6. Tugma nomi: Bron qilish');
  console.log();
  console.log('  ════════════════════════════════════════════════════');
  console.log();
}

main().catch((error) => {
  console.error('\n  ❌ Xatolik:', error.message, '\n');
  process.exit(1);
});
