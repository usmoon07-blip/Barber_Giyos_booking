'use strict';

/**
 * Boshlang'ich ma'lumotlar.
 * Skript qayta-qayta ishga tushirilsa ham nusxalarni ko'paytirmaydi.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const SHOP = {
  id: 1,
  shopName: "G'iyos Barbershop",
  phone: '+998705054020',
  address: 'Toshkent shahri',
  addressRu: 'город Ташкент',
  instagram: 'barber_giyosboy',
  workingHoursText: 'Har kuni 09:00 — 20:00',
  workingHoursTextRu: 'Ежедневно 09:00 — 20:00',
  about: "Erkaklar uchun zamonaviy sartaroshxona. Tajribali barberlar, toza ish va aniq vaqt.",
  aboutRu: 'Современный барбершоп для мужчин. Опытные барберы, чистая работа и точное время.',
  logoUrl: null,
  slotStep: 30,
  minLeadMinutes: 30,
  maxAdvanceDays: 21,
  reminderHours: 2,
};

const BARBERS = [
  {
    name: 'Aziz Barber',
    photoUrl: 'https://placehold.co/400x400/111111/FFFFFF/png?text=Aziz',
    bio: "10 yillik tajriba. Fade va klassik soch olishda usta.",
    bioRu: 'Опыт 10 лет. Мастер фейда и классических стрижек.',
    sortOrder: 1,
  },
  {
    name: 'Bekzod Barber',
    photoUrl: 'https://placehold.co/400x400/111111/FFFFFF/png?text=Bekzod',
    bio: "Soqol va styling bo'yicha mutaxassis. Aniqlik va toza ish.",
    bioRu: 'Специалист по бороде и стайлингу. Точность и чистая работа.',
    sortOrder: 2,
  },
  {
    name: 'Sardor Barber',
    photoUrl: 'https://placehold.co/400x400/111111/FFFFFF/png?text=Sardor',
    bio: "Zamonaviy uslublar va bolalar soch olishida tajribali.",
    bioRu: 'Современные стрижки и работа с детьми.',
    sortOrder: 3,
  },
];

const SERVICES = [
  {
    name: 'Klassik soch olish',
    nameRu: 'Классическая стрижка',
    imageUrl: 'https://placehold.co/800x500/111111/FFFFFF/png?text=Klassik',
    description: "Vaqt sinovidan o'tgan klassik uslub. Yuvish va styling bilan.",
    descriptionRu: 'Проверенная временем классика. С мытьём головы и укладкой.',
    price: 100000,
    oldPrice: null,
    category: 'HAIR',
    duration: 45,
    isPopular: true,
    sortOrder: 1,
  },
  {
    name: 'Fade',
    nameRu: 'Фейд',
    imageUrl: 'https://placehold.co/800x500/111111/FFFFFF/png?text=Fade',
    description: "Silliq o'tishli zamonaviy fade. Mashinka va qaychi bilan aniq ishlov.",
    descriptionRu: 'Современный фейд с плавным переходом. Машинка и ножницы.',
    price: 120000,
    oldPrice: 140000,
    category: 'HAIR',
    duration: 45,
    isPopular: true,
    sortOrder: 2,
  },
  {
    name: 'Soch + Soqol',
    nameRu: 'Стрижка + Борода',
    imageUrl: 'https://placehold.co/800x500/111111/FFFFFF/png?text=Soch+Soqol',
    description: "To'liq ko'rinish: soch olish va soqolga shakl berish bir seansda.",
    descriptionRu: 'Полный образ: стрижка и оформление бороды за один визит.',
    price: 170000,
    oldPrice: 190000,
    category: 'COMBO',
    duration: 75,
    isPopular: true,
    sortOrder: 3,
  },
  {
    name: 'Soqol olish',
    nameRu: 'Бритьё бороды',
    imageUrl: 'https://placehold.co/800x500/111111/FFFFFF/png?text=Soqol',
    description: "Issiq sochiq, ustara va parvarish. Soqolga toza shakl.",
    descriptionRu: 'Горячее полотенце, опасная бритва и уход. Чистая форма бороды.',
    price: 70000,
    oldPrice: null,
    category: 'BEARD',
    duration: 30,
    isPopular: true,
    sortOrder: 4,
  },
  {
    name: 'Bolalar soch olish',
    nameRu: 'Детская стрижка',
    imageUrl: 'https://placehold.co/800x500/111111/FFFFFF/png?text=Bolalar',
    description: "12 yoshgacha bo'lgan bolalar uchun. Sabr va ehtiyotkorlik bilan.",
    descriptionRu: 'Для детей до 12 лет. Терпеливо и аккуратно.',
    price: 80000,
    oldPrice: null,
    category: 'HAIR',
    duration: 30,
    isPopular: false,
    sortOrder: 5,
  },
  {
    name: 'Styling',
    nameRu: 'Укладка',
    imageUrl: 'https://placehold.co/800x500/111111/FFFFFF/png?text=Styling',
    description: "Professional vositalar bilan soch turmagi. Tadbirlar oldidan ideal.",
    descriptionRu: 'Укладка профессиональными средствами. Идеально перед событием.',
    price: 60000,
    oldPrice: null,
    category: 'STYLING',
    duration: 30,
    isPopular: false,
    sortOrder: 6,
  },
];

const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];

async function seedSettings() {
  await prisma.siteSetting.upsert({
    where: { id: 1 },
    update: {},
    create: SHOP,
  });
  console.log('✅ Sartaroshxona sozlamalari');
}

async function seedBarbers() {
  for (const barber of BARBERS) {
    const existing = await prisma.barber.findFirst({ where: { name: barber.name } });

    const record = existing
      ? await prisma.barber.update({ where: { id: existing.id }, data: barber })
      : await prisma.barber.create({ data: barber });

    for (const weekday of WEEKDAYS) {
      await prisma.workingHour.upsert({
        where: { barberId_weekday: { barberId: record.id, weekday } },
        update: {},
        create: {
          barberId: record.id,
          weekday,
          startTime: '09:00',
          endTime: '20:00',
          isWorking: true,
        },
      });
    }
  }
  console.log(`✅ ${BARBERS.length} ta barber va ularning ish jadvali`);
}

async function seedServices() {
  for (const service of SERVICES) {
    const existing = await prisma.service.findFirst({ where: { name: service.name } });

    if (existing) {
      await prisma.service.update({ where: { id: existing.id }, data: service });
    } else {
      await prisma.service.create({ data: service });
    }
  }
  console.log(`✅ ${SERVICES.length} ta xizmat`);
}

async function main() {
  console.log('🌱 Namunaviy ma\'lumotlar yozilmoqda...\n');

  await seedSettings();
  await seedBarbers();
  await seedServices();

  console.log('\n🎉 Tayyor! Baza to\'ldirildi.');
}

main()
  .catch((error) => {
    console.error('❌ Seed xatoligi:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
