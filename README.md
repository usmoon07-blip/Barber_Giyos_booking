# 💈 G'iyos Barbershop — Bron qilish tizimi

Erkaklar sartaroshxonasi uchun Telegram Mini App, Telegram bot va Admin Panel.
Hammasi bitta kompyuterda (localhost) ishlaydi.

```
┌─────────────────┐     ┌──────────────┐     ┌──────────────┐
│  Telegram bot   │────▶│   Backend    │────▶│  PostgreSQL  │
│  + Mini App     │     │  Node.js API │     │    (Neon)    │
└─────────────────┘     └──────────────┘     └──────────────┘
                               ▲
                        ┌──────────────┐
                        │ Admin Panel  │
                        └──────────────┘
```

---

## 📦 Loyiha tarkibi

| Papka      | Nima uchun                                          |
| ---------- | --------------------------------------------------- |
| `backend/` | Server: Telegram bot, mijoz API va admin API        |
| `miniapp/` | Mijozlar ko'radigan Telegram Mini App (React)       |
| `admin/`   | Sartarosh uchun boshqaruv paneli (React)            |
| `windows/` | Windows uchun ishga tushirish fayllari (.bat)       |

---

## ⚡ Tez boshlash (Windows)

1. **Node.js** o'rnating — [nodejs.org](https://nodejs.org) → **LTS** versiyasi
2. `backend\.env.example` faylidan nusxa oling, nomini `.env` ga o'zgartiring
   va o'z ma'lumotlaringizni kiriting
3. `windows\1-ORNATISH.bat` — ikki marta bosing, tugashini kuting
4. `windows\2-ISHGA-TUSHIRISH.bat` — server va bot ishga tushadi
5. `windows\4-NGROK.bat` — Telegram uchun HTTPS havola oling
6. Olingan havolani BotFather'ga Mini App sifatida ulang

Batafsili — quyida.

---

## 🔧 1. Sozlamalar fayli (.env)

`backend` papkasida `.env` nomli fayl bo'lishi **shart**. Namuna — `.env.example`.

```env
DATABASE_URL="postgresql://...-pooler.../neondb?sslmode=require"
DIRECT_URL="postgresql://.../neondb?sslmode=require"
BOT_TOKEN="BotFather bergan token"
ADMIN_TELEGRAM_IDS="sizning_telegram_id"
MINIAPP_URL=""
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="kuchli_parol"
JWT_SECRET="uzun_tasodifiy_satr"
PORT=3000
TIMEZONE="Asia/Tashkent"
CORS_ORIGINS="http://localhost:5173,http://localhost:5174"
ALLOW_DEV_AUTH="false"
```

| Sozlama              | Izoh                                                                 |
| -------------------- | -------------------------------------------------------------------- |
| `DATABASE_URL`       | Neon'dagi baza manzili (`-pooler` bilan)                             |
| `DIRECT_URL`         | O'sha manzil, lekin `-pooler` **siz** — migratsiya uchun             |
| `BOT_TOKEN`          | @BotFather → `/newbot` orqali olinadi                                |
| `ADMIN_TELEGRAM_IDS` | Yangi bron va "Yo'lga tushdim" xabarlari keladigan ID. Vergul bilan  |
| `MINIAPP_URL`        | Ngrok bergan HTTPS havola (dastlab bo'sh)                            |
| `ADMIN_PASSWORD`     | Admin panelga kirish paroli — albatta o'zgartiring                   |
| `JWT_SECRET`         | Kamida 16 ta belgi, tasodifiy                                        |
| `ALLOW_DEV_AUTH`     | `true` bo'lsa, brauzerda Telegramsiz test qilish mumkin              |

> ⚠️ `.env` faylini hech kimga bermang va GitHub'ga yuklamang.
> U `.gitignore` ga qo'shilgan, ya'ni avtomatik e'tiborsiz qoldiriladi.

---

## 🚀 2. O'rnatish (qo'lda, terminal orqali)

`.bat` fayllar o'rniga qo'lda qilmoqchi bo'lsangiz:

```bash
# Backend
cd backend
npm install
npx prisma migrate deploy      # jadvallarni yaratish
npx prisma generate
npm run seed                   # namunaviy ma'lumotlar

# Mini App
cd ../miniapp
npm install
npm run build

# Admin Panel
cd ../admin
npm install
npm run build

# Serverni ishga tushirish
cd ../backend
npm start
```

Server ishga tushgach:

- **Mini App** → http://localhost:3000
- **Admin Panel** → http://localhost:3000/admin
- **API holati** → http://localhost:3000/api/health

---

## 🌐 3. Ngrok va Telegram Mini App

Telegram Mini App faqat **HTTPS** manzilda ishlaydi. Localhost `http` bo'lgani
uchun ngrok orqali vaqtinchalik HTTPS havola olamiz.

### Ngrok o'rnatish

1. [ngrok.com/signup](https://ngrok.com/signup) — ro'yxatdan o'ting (bepul)
2. [ngrok.com/download](https://ngrok.com/download) — Windows versiyasini yuklang
3. ZIP ichidagi `ngrok.exe` ni loyiha papkasiga qo'ying
4. Saytdagi **Your Authtoken** ni nusxa oling va terminalda:

```bash
ngrok config add-authtoken SIZNING_TOKENINGIZ
```

### Ishga tushirish

Server ishlab turganda **yangi terminal** ochib:

```bash
ngrok http 3000
```

Ekranda shunday chiqadi:

```
Forwarding    https://a1b2-84-54-12-34.ngrok-free.app -> http://localhost:3000
```

Shu `https://...` havolani nusxa oling.

### Havolani botga ulash

1. `backend\.env` faylini oching
2. `MINIAPP_URL="https://a1b2-84-54-12-34.ngrok-free.app"` deb yozing
3. Serverni to'xtatib (Ctrl+C), qayta ishga tushiring
4. Telegram'da **@BotFather** ni oching:
   - `/mybots` → botingizni tanlang
   - **Bot Settings** → **Menu Button** → **Configure menu button**
   - Havolani yuboring, keyin tugma nomini yozing: `Bron qilish`

Tayyor! Botga `/start` yozing va **💈 Bron qilish** tugmasini bosing.

> ⚠️ Ngrok'ning bepul versiyasida har safar ishga tushirganda **havola
> o'zgaradi**. Shunda `.env` dagi `MINIAPP_URL` ni yangilab, serverni qayta
> ishga tushiring va BotFather'dagi havolani ham yangilang.

---

## 🖥 4. Admin Panel

**Manzil:** http://localhost:3000/admin

Kirish ma'lumotlari — `.env` faylidagi `ADMIN_USERNAME` va `ADMIN_PASSWORD`.

| Bo'lim          | Imkoniyatlar                                                 |
| --------------- | ------------------------------------------------------------ |
| 📊 Dashboard    | Bugungi bronlar, tushum, mijozlar, diagramma                 |
| 📅 Bronlar      | Filtrlash, holatni o'zgartirish, o'chirish                   |
| 💈 Barberlar    | Qo'shish, tahrirlash, faol/faol emas, o'chirish              |
| ✂️ Xizmatlar    | Narx, tavsif, rasm, kategoriya, davomiylik                   |
| 🕐 Ish jadvali  | Har bir barber uchun 7 kunlik jadval va dam olish kunlari    |
| 👥 Mijozlar     | Ro'yxat va qidiruv                                           |
| ⚙️ Sozlamalar   | Nom, telefon, manzil, Instagram, bron qoidalari              |

Admin panelni alohida portda (tahrir qilish uchun) ishga tushirish:

```bash
cd admin
npm run dev        # http://localhost:5174
```

---

## 🤖 5. Bot imkoniyatlari

| Tugma / buyruq      | Nima qiladi                                    |
| ------------------- | ---------------------------------------------- |
| `/start`            | Til tanlash va asosiy menyu                    |
| 💈 Bron qilish      | Mini App'ni ochadi                             |
| ✂️ Narxlar          | Barcha xizmatlar va narxlar                    |
| 📅 Mening bronlarim | Bronlar ro'yxati, "Yo'lga tushdim", bekor qilish |
| 👤 Profil           | Ism, telefon, bronlar soni                     |
| 📍 Manzil           | Manzil, telefon, Instagram, xarita             |
| 🌐 Til              | O'zbekcha ↔ Ruscha                             |

### Sartaroshga keladigan avtomatik xabarlar

`.env` dagi `ADMIN_TELEGRAM_IDS` ga:

- 🔔 **Yangi bron** — mijoz ismi, telefoni, vaqti
- 🚗 **Mijoz yo'lga tushdi** — mijoz tugmani bosganda darhol
- ❌ **Bron bekor qilindi**

### Mijozga keladigan xabarlar

- ✅ Bron qabul qilingani (+ "Yo'lga tushdim" va "Bekor qilish" tugmalari)
- ⏰ Bron vaqtidan 2 soat oldin eslatma (sozlamalardan o'zgartiriladi)
- ✅/🎉/❌ Admin holatni o'zgartirganda

---

## 🔒 6. Xavfsizlik

- Mini App har bir so'rovda Telegram imzolagan `initData` yuboradi, server uni
  bot tokeni bilan **HMAC-SHA256** orqali tekshiradi — soxta so'rov o'tmaydi
- Admin API **JWT token** bilan himoyalangan va mijoz API'sidan ajratilgan
- Bir vaqtga ikki bron tushmasligi uchun **Serializable tranzaksiya** va
  bazadagi `UNIQUE(barberId, date, startTime)` cheklovi ishlaydi
- Parollar va tokenlar faqat `.env` faylida, u hech qachon Git'ga tushmaydi

---

## 🛠 7. Foydali buyruqlar

```bash
# Bazani ko'rish / tahrirlash (brauzerda ochiladi)
cd backend && npx prisma studio

# Namunaviy ma'lumotlarni qayta yozish
cd backend && npm run seed

# Sxema o'zgargandan keyin yangi migratsiya
cd backend && npx prisma migrate dev --name ozgarish_nomi

# Mini App'ni tahrirlab, brauzerda ko'rish (Telegramsiz)
# .env da ALLOW_DEV_AUTH="true" qiling
cd miniapp && npm run dev      # http://localhost:5173
```

---

## ❓ 8. Tez-tez uchraydigan muammolar

**"Can't reach database server"**
Neon bazasi uxlab qolgan bo'lishi mumkin. [console.neon.tech](https://console.neon.tech)
ga kirib bazani oching — u avtomatik uyg'onadi. `DATABASE_URL` to'g'riligini ham
tekshiring.

**Bot javob bermayapti**
`.env` dagi `BOT_TOKEN` ni tekshiring. Terminalda `🤖 Bot ishga tushdi: @nomi`
yozuvi chiqishi kerak.

**Mini App ochilmayapti / oq ekran**
1. `MINIAPP_URL` `https://` bilan boshlanishini tekshiring
2. Ngrok ishlab turganini tekshiring
3. `cd miniapp && npm run build` qilib, serverni qayta ishga tushiring

**"Bu vaqt allaqachon band qilingan"**
Bu xato emas — kimdir sizdan oldin o'sha vaqtni band qilgan. Boshqa vaqtni
tanlang.

**Port 3000 band**
`.env` da `PORT=3001` qiling va ngrok'ni `ngrok http 3001` deb ishga tushiring.

---

## 📐 Texnologiyalar

Node.js · Express · Prisma ORM · PostgreSQL (Neon) · Telegraf · React · Vite
