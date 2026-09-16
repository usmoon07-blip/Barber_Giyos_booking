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

## ⚡ Ishga tushirish (Windows) — 3 ta fayl

Loyihada uchta asosiy fayl bor. Kod bilmasangiz ham yetarli.

| Fayl | Nima qiladi |
|---|---|
| **`BOSHLASH.bat`** | Hamma ishni bajaradi: Node.js ni o'rnatadi, sozlamalarni so'raydi, bazani tayyorlaydi, serverni ishga tushiradi |
| **`NGROK.bat`** | Mini App uchun https havola oladi va sozlamalarga **o'zi yozadi** |
| **`TEKSHIRISH.bat`** | Nimadir ishlamasa — sababini va yechimini oddiy tilda aytadi |

### 1-qadam

**`BOSHLASH.bat`** faylini ikki marta bosing.

U sizdan faqat **uchta narsa** so'raydi:

| Nima | Qayerdan olinadi |
|---|---|
| Baza manzili | [neon.tech](https://neon.tech) → Dashboard → **Connect** → Connection string |
| Bot tokeni | Telegram → [@BotFather](https://t.me/BotFather) → `/mybots` → **API Token** |
| Telegram ID | Telegram → [@userinfobot](https://t.me/userinfobot) → **Start** |

Qolganini o'zi qiladi. Birinchi safar 5–10 daqiqa, keyingi safarlar bir necha soniya.

Tugagach brauzerda admin panel o'zi ochiladi, Telegramda esa botga `/start` yozsangiz javob beradi.

> Node.js o'rnatilmagan bo'lsa, `BOSHLASH.bat` uni **o'zi o'rnatadi**. Windows
> ruxsat so'rasa «Ha» deng. Agar o'rnatolmasa, [nodejs.org](https://nodejs.org)
> dan LTS versiyasini o'rnatib, kompyuterni qayta yoqing.

#### Savollarga javob yozish noqulay bo'lsa

`backend\.env` nomli faylni **Notepad**'da o'zingiz yaratib, ichiga
tayyor matnni qo'ysangiz ham bo'ladi — u holda `BOSHLASH.bat` savol
bermaydi, to'g'ridan-to'g'ri o'rnatishga o'tadi. Namuna:
`backend\.env.example` faylida.

#### Ngrok tokeni

`NGROK.bat` bir marta ngrok tokenini so'raydi. Uni ham terminalga
yozmasdan, `windows\ngrok-token.txt` fayliga yozib qo'yish mumkin
(namuna: `windows\ngrok-token.txt.namuna`). Bu fayl GitHub'ga
yuklanmaydi.

### 2-qadam — Mini App

Botdagi «💈 Bron qilish» tugmasi ishlashi uchun https havola kerak.

**`BOSHLASH.bat` ishlab turganda** `NGROK.bat` ni oching. U:

1. Ngrok'ni o'zi yuklab oladi
2. Hisobingiz tokenini bir marta so'raydi ([ngrok.com/signup](https://ngrok.com/signup))
3. Havolani olib, `backend\.env` fayliga **o'zi yozadi**
4. BotFather'da nima qilish kerakligini ekranda ko'rsatadi

Havolani qo'lda ko'chirib o'tirish shart emas.

> 💡 **Havola har safar o'zgarmasligi uchun:** [dashboard.ngrok.com](https://dashboard.ngrok.com)
> → **Domains** → **+ New Domain** (bepul) → olingan domenni
> `windows\ngrok-domen.txt` fayliga yozing. Shundan keyin BotFather'ni
> boshqa sozlamaysiz.

### Har kuni ishlatish

1. `BOSHLASH.bat` — ikki marta bosing (oynani yopmang)
2. `NGROK.bat` — ikki marta bosing (bu oynani ham yopmang)

Tamom.

### Nimadir ishlamasa

`TEKSHIRISH.bat` ni oching. U har bir qismni tekshirib, muammoni va
yechimini ko'rsatadi:

```
  ✅ Node.js — versiya 22.11.0
  ✅ Ma'lumotlar bazasi — ulanish muvaffaqiyatli
  ✅ Telegram bot — @giyos_barber_bot — token to'g'ri
  ⚠️  Mini App havolasi yo'q
      👉 NGROK.bat ni ishga tushiring
```

### Qo'shimcha fayllar

| Fayl | Nima qiladi |
|---|---|
| `YANGILASH.bat` | Dasturning yangi versiyasini yuklaydi (ma'lumotlar saqlanadi) |
| `windows\BAZANI-KORISH.bat` | Bazani brauzerda ochadi (Prisma Studio) |

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

> Bu bo'lim ilg'or foydalanuvchilar uchun. Oddiy holatda `BOSHLASH.bat`
> yetarli — quyidagilarning hammasini u o'zi bajaradi.

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

### ⭐ Doimiy domen — har kuni qayta sozlamaslik uchun

Odatda ngrok havolasi har safar o'zgaradi. Buni bir marta hal qilish mumkin:

1. [dashboard.ngrok.com](https://dashboard.ngrok.com) ga kiring
2. Chap menyudan **Domains** → **+ New Domain** tugmasini bosing
3. Bepul rejada **bitta doimiy domen** beriladi, masalan:
   `giyos-barbershop.ngrok-free.app`
4. `windows\ngrok-domen.txt` faylini **Notepad**'da oching
5. `#` bilan boshlanmagan qatorga domeningizni yozing (masalan
   `giyos-barbershop.ngrok-free.app`) va saqlang

6. Endi `NGROK.bat` har safar **bir xil havolani** beradi.
7. `.env` dagi `MINIAPP_URL` va BotFather'dagi Menu Button'ni **bir marta**
   shu havolaga sozlang — boshqa tegmaysiz.

> Agar hisobingizda **Domains** bo'limi bo'lmasa, [Cloudflare
> Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)
> ham bepul va doimiy havola beradi.

> ⚠️ Doimiy domen sozlanmagan bo'lsa, ngrok havolasi **har safar o'zgaradi**.
> Shunda `.env` dagi `MINIAPP_URL` ni yangilab, serverni qayta ishga tushiring
> va BotFather'dagi havolani ham yangilang.

---

## ☁️ 3.5. Bulutga joylashtirish — kompyuter o'chsa ham ishlashi uchun

Yuqoridagi hammasi **kompyuteringiz yoniq va internetga ulangan** paytdagina
ishlaydi. Botni doim ishlaydigan qilish uchun uni bulut serveriga
(masalan [Render](https://render.com)) ko'chirish kerak — bir marta
sozlansa, keyin kompyuteringiz o'chsa ham bot, Mini App va Admin Panel
ishlayveradi.

Bu ixtiyoriy qadam — localhost'da hammasi ishlab tursa, shart emas.

### Nima o'zgaradi

Loyihada allaqachon tayyor: `Dockerfile` va `render.yaml`. Bot ikki rejimda
ishlay oladi:

- **Polling** (hozirgi, localhost) — bot Telegram'ga o'zi murojaat qilib
  turadi, shuning uchun kompyuter yonib turishi shart
- **Webhook** (bulutda) — Telegram xabarni serverga **o'zi** yuboradi,
  server esa doim tinglab turadi. `WEBHOOK_URL` sozlansa, kod avtomatik
  shu rejimga o'tadi — boshqa hech narsa o'zgartirish shart emas

### Qadamlar (Render, bepul reja)

1. [render.com](https://render.com) ga kiring, GitHub hisobingiz bilan
   ro'yxatdan o'ting
2. **New** → **Blueprint** → repozitoriyni tanlang
   (`usmoon07-blip/Barber_Giyos_booking`, `claude/salom-0u45my` branch)
3. Render `render.yaml` faylini o'zi topib, so'raladigan sozlamalarni
   ko'rsatadi. Har biriga quyidagilarni kiriting:

   | Sozlama | Qiymat |
   |---|---|
   | `DATABASE_URL` | Neon'dagi baza manzili (pooler bilan) |
   | `DIRECT_URL` | O'sha manzil, pooler'siz |
   | `BOT_TOKEN` | @BotFather bergan token |
   | `ADMIN_TELEGRAM_IDS` | Telegram ID raqamingiz |
   | `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Admin panel kirish ma'lumotlari |
   | `WEBHOOK_URL` / `MINIAPP_URL` | Hozircha bo'sh qoldiring — 5-qadamda to'ldiramiz |

4. **Apply** tugmasini bosing. Render Docker image'ni yig'ib, joylashtiradi
   (5–10 daqiqa). Tugagach sizga manzil beriladi, masalan:
   `https://giyos-barbershop.onrender.com`

5. **Dashboard → Environment** bo'limiga qaytib, `WEBHOOK_URL` va
   `MINIAPP_URL` ikkalasiga ham shu manzilni yozing (oxirida `/` **bo'lmasin**),
   so'ng **Manual Deploy → Deploy latest commit**

6. Telegram'da **@BotFather** → `/mybots` → botingiz → **Bot Settings** →
   **Menu Button** → **Configure menu button** → shu manzilni yuboring →
   tugma nomi: `Bron qilish`

7. Botga `/start` yozing — endi kompyuteringiz o'chiq bo'lsa ham javob beradi

Admin panel: `https://giyos-barbershop.onrender.com/admin`

### Bepul rejaning bitta cheklovi

Render'ning bepul rejasi 15 daqiqa faoliyatsizlikdan keyin serverni
"uxlatib qo'yadi". Mijoz xabar yozganda server bir necha soniyada
uyg'onadi va javob beradi — birinchi xabar biroz **kechikishi** mumkin
(odatda 10–30 soniya), keyingilari darhol keladi.

Bu kechikish muammo bo'lsa, Render dashboard'da **Settings → Instance
Type** dan **Starter** rejasiga o'tkazing (~$7/oy) — server hech qachon
uxlamaydi, javob doim darhol keladi.

### Narxni o'zgartirsam, qayta ishga tushirishda o'chib qolmaydimi?

Yo'q. Seed skripti faqat **yetishmayotgan** barber/xizmatni qo'shadi,
mavjudlarini hech qachon qayta yozmaydi — admin panelda qilgan
o'zgarishlaringiz har doim saqlanadi.

---

## 🖥 4. Admin Panel

**Manzil:** http://localhost:3000/admin

Kirish ma'lumotlari — `.env` faylidagi `ADMIN_USERNAME` va `ADMIN_PASSWORD`.

| Bo'lim          | Imkoniyatlar                                                 |
| --------------- | ------------------------------------------------------------ |
| 📊 Dashboard    | Bugungi bronlar, tushum, mijozlar, diagramma                 |
| 🗓 Kun jadvali  | Bugungi kun barberlar bo'yicha: kim, qachon, qayer bo'sh     |
| 📅 Bronlar      | **Qo'lda bron qo'shish**, filtrlash, holat va to'lov          |
| 💰 Hisobot      | Kunlik/oylik tushum, naqd va karta ajratilgan, CSV eksport    |
| 💈 Barberlar    | Qo'shish, tahrirlash, faol/faol emas, o'chirish              |
| ✂️ Xizmatlar    | Narx, tavsif, rasm, kategoriya, davomiylik                   |
| 🕐 Ish jadvali  | Har bir barber uchun 7 kunlik jadval va dam olish kunlari    |
| 🚫 Bloklash     | Tanaffus, dam olish kuni, bayram — o'sha vaqtga bron tushmaydi |
| 👥 Mijozlar     | Ro'yxat va qidiruv                                           |
| ⚙️ Sozlamalar   | Nom, telefon, manzil, Instagram, **karta raqami**, qoidalar  |

Admin panelni alohida portda (tahrir qilish uchun) ishga tushirish:

```bash
cd admin
npm run dev        # http://localhost:5174
```

---

## 💰 5. To'lov va hisobot

### To'lov turlari

Mijoz bron qilayotganda **naqd pul** yoki **karta** ni tanlaydi.

Karta tanlansa, unga darhol karta raqamingiz ko'rsatiladi — Mini App'da
(bir bosishda nusxa olish tugmasi bilan) va botga yuborilgan xabarda ham.

**Karta raqamini kiritish:** Admin Panel → **Sozlamalar** → **💳 To'lov
ma'lumotlari** bo'limi. U yerda:

- karta raqami (`8600 1234 5678 9012`)
- karta egasining ismi
- bank / karta turi (Uzcard, Humo va h.k.)
- naqd va karta to'lovlarini alohida yoqish/o'chirish

### Tushumni belgilash

Bronlar sahifasida har bir bron yonida:

- **to'lov turi** (naqd / karta) — kerak bo'lsa o'zgartirasiz
  (mijoz karta deb tanlab, keyin naqd bergan bo'lsa)
- **⏳ To'lanmagan / ✅ To'langan** tugmasi — bosib belgilaysiz

### Hisobot sahifasi

**Admin Panel → 💰 Hisobot**

| Ko'rsatkich            | Ma'nosi                                             |
| ---------------------- | --------------------------------------------------- |
| Tushum (bajarilgan ish)| Holati «Yakunlangan» bronlar summasi                |
| 💵 Naqd                 | «To'langan» deb belgilangan naqd to'lovlar          |
| 💳 Karta                | «To'langan» deb belgilangan karta to'lovlar         |
| ⏳ Kutilayotgan         | Hali bajarilmagan (kelgusi) bronlar summasi         |
| ⏳ To'lanmagan          | Ish bajarilgan, lekin pul belgilanmagan             |
| O'rtacha chek          | Tushum ÷ bajarilgan xizmatlar soni                  |

Oraliqlar: **Bugun · Oxirgi 7 kun · Kelasi 7 kun · Shu oy · O'tgan oy ·
Ixtiyoriy oraliq**.

Quyida uchta jadval: **kunlar**, **barberlar** va **xizmatlar** bo'yicha
taqsimot. **⬇ Excel (CSV)** tugmasi hisobotni faylga yuklab beradi — uni
Excel yoki Google Sheets'da ochasiz.

> 💡 Tushum to'g'ri chiqishi uchun pulni olganingizda **«To'langan»** tugmasini
> bosing. Bronni «Yakunlangan» deb belgilashni unutsangiz ham xavotir olmang —
> vaqti o'tgan tasdiqlangan bronlar **avtomatik** yakunlanadi (Sozlamalardan
> o'chirsa bo'ladi).

### Bron holatlari

| Holat | Qachon |
|---|---|
| 🕐 Kutilmoqda | Mijoz bron qildi, siz hali tasdiqlamadingiz |
| ✅ Tasdiqlangan | Siz tasdiqladingiz |
| 🎉 Yakunlangan | Xizmat ko'rsatildi — tushumga qo'shiladi |
| ❌ Bekor qilingan | Bron bekor qilindi |
| 🚫 Kelmadi | Mijoz kelmay qoldi — tushumga qo'shilmaydi, alohida sanaladi |

Hisobot sahifasida «Kelmagan mijozlar» soni alohida ko'rsatiladi.

### Mijoz bronni qachon bekor qila oladi

Sozlamalardagi **«Bekor qilish muddati»** — masalan 2 soat. Mijoz tashrifga
2 soatdan kam qolganda bronni bekor qila olmaydi, unga «sartaroshxonaga
qo'ng'iroq qiling» deb yoziladi. Shunda vaqt behuda yo'qolmaydi.

---

## 📞 6. Qo'lda bron va vaqtni bloklash

### Telefon orqali yoki eshikdan kelgan mijoz

Mijoz qo'ng'iroq qilsa yoki to'g'ridan-to'g'ri kelsa, uni tizimga kiritish
kerak — aks holda o'sha vaqt Mini App'da bo'sh ko'rinaveradi va ikkinchi mijoz
band qilib qo'yadi.

**Admin Panel → 📅 Bronlar → + Yangi bron**

1. Mijoz ismi va telefoni — agar u avval kelgan bo'lsa, yozayotganingizda
   ro'yxatdan chiqadi, bosib tanlaysiz (mijoz ikki marta yaratilmaydi)
2. Xizmat va barber
3. Sana → bo'sh vaqtlar chiqadi, bosib tanlaysiz
   (yoki vaqtni qo'lda yozasiz — ish jadvalidan tashqarida ham bo'lishi mumkin)
4. To'lov turi va «Pul olindi» belgisi

Mijozning Telegram akkaunti bo'lishi **shart emas**. Agar bo'lsa, unga bot
orqali tasdiq xabari ham boradi.

### Tanaffus va dam olish kuni

**Admin Panel → 🚫 Bloklash → + Vaqt bloklash**

- Tez tugmalar: *Tushlik 13:00–14:00*, *Kunning yarmi*, *Butun kun yopiq*
- Bitta barber uchun yoki **barcha barberlar** uchun
- Sabab yozib qo'yasiz (masalan «To'yga boraman»)

Bloklangan vaqt Mini App'da **butunlay ko'rinmaydi** — mijoz u yerga bron
qila olmaydi.

> Agar o'sha vaqtda allaqachon bron bo'lsa, tizim darhol ogohlantiradi va
> mijozning telefon raqamini ko'rsatadi — qo'ng'iroq qilib ko'chirasiz.

### Kun jadvali

**Admin Panel → 🗓 Kun jadvali** — ertalab telefondan bir qarashda ko'rasiz:

- har bir barberning kuni vaqt bo'yicha
- qaysi vaqtlar **bo'sh** (necha daqiqa)
- kim **yo'lga tushgan** (🚗)
- bugungi kutilayotgan tushum

Bron ustiga bossangiz — mijoz telefoni, holatni o'zgartirish va «Pul olindi»
tugmasi chiqadi.

---

## 🤖 7. Bot imkoniyatlari

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
- 💳 Karta tanlangan bo'lsa — karta raqami (Telegramda bosib nusxa olinadi)
- ⏰ Bron vaqtidan 2 soat oldin eslatma (sozlamalardan o'zgartiriladi)
- ✅/🎉/❌ Admin holatni o'zgartirganda

---

## 🔒 8. Xavfsizlik

- Mini App har bir so'rovda Telegram imzolagan `initData` yuboradi, server uni
  bot tokeni bilan **HMAC-SHA256** orqali tekshiradi — soxta so'rov o'tmaydi
- Admin API **JWT token** bilan himoyalangan va mijoz API'sidan ajratilgan
- Bir vaqtga ikki bron tushmasligi uchun **Serializable tranzaksiya** va
  bazadagi `UNIQUE(barberId, date, startTime)` cheklovi ishlaydi
- Parollar va tokenlar faqat `.env` faylida, u hech qachon Git'ga tushmaydi

---

## 🛠 9. Foydali buyruqlar

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

## ❓ 10. Tez-tez uchraydigan muammolar

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
