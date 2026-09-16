# ────────────────────────────────────────────────────────────────────
#  G'iyos Barbershop — bulutga joylashtirish uchun (Render, Railway,
#  Fly.io va h.k.). Bitta konteyner: bot + API + Mini App + Admin Panel.
#
#  Papka tuzilishi kodda ("../../miniapp/dist" kabi nisbiy yo'llar)
#  saqlanishi kerak, shuning uchun butun monorepo bitta joyga
#  nusxalanadi — backend, miniapp va admin alohida emas.
# ────────────────────────────────────────────────────────────────────

FROM node:22-alpine AS frontend-builder
WORKDIR /app

COPY miniapp/package*.json miniapp/
RUN npm --prefix miniapp ci --no-audit --no-fund

COPY admin/package*.json admin/
RUN npm --prefix admin ci --no-audit --no-fund

COPY miniapp miniapp
COPY admin admin

RUN npm --prefix miniapp run build
RUN npm --prefix admin run build

# ────────────────────────────────────────────────────────────────────

FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
# Prisma internetdan yangilanish so'ramasligi uchun (tezroq va ishonchliroq)
ENV CHECKPOINT_DISABLE=1
ENV PRISMA_HIDE_UPDATE_MESSAGE=true

COPY backend/package*.json backend/
RUN npm --prefix backend ci --omit=dev --no-audit --no-fund

COPY backend backend
RUN cd backend && npx prisma generate

# Yig'ilgan frontend'lar — backend Express ularni statik fayl sifatida beradi
COPY --from=frontend-builder /app/miniapp/dist miniapp/dist
COPY --from=frontend-builder /app/admin/dist admin/dist

EXPOSE 3000

# Ishga tushishdan oldin migratsiyani bajaradi, so'ng serverni yoqadi.
# Seed skripti mavjud ma'lumotlarni qayta yozmaydi (faqat yetishmasa qo'shadi) —
# har qayta ishga tushirishda bajarilishi xavfsiz.
CMD ["sh", "-c", "cd backend && npx prisma migrate deploy && node prisma/seed.js && node src/index.js"]
