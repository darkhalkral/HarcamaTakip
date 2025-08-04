const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seed() {
  // Default categories
  const categories = [
    { name: 'Yemek', color: '#FF6B6B' },
    { name: 'Market', color: '#4ECDC4' },
    { name: 'Giyim', color: '#45B7D1' },
    { name: 'Araç', color: '#96CEB4' },
    { name: 'Abonelik', color: '#FFEAA7' },
    { name: 'Eğlence', color: '#DDA0DD' },
    { name: 'Elektronik', color: '#98D8C8' },
    { name: 'Ulaşım', color: '#F7DC6F' },
    { name: 'Diğer', color: '#BB8FCE' },
    { name: 'Faiz', color: '#AED6F1' }
  ];

  console.log('Creating default categories...');

  // ✔️ Eski "Araba" kategorisini "Araç" ile birleştir
  const old = await prisma.category.findUnique({ where: { name: 'Araba' } });
  if (old) {
    const arac = await prisma.category.upsert({
      where: { name: 'Araç' },
      update: {},
      create: { name: 'Araç', color: '#96CEB4' }
    });

    // Araba kategorisindeki tüm harcamaları Araç'a taşı
    await prisma.expense.updateMany({
      where: { categoryId: old.id },
      data: { categoryId: arac.id }
    });

    await prisma.category.delete({ where: { id: old.id } });
    console.log('   "Araba" kategorisi silindi, işlemler "Araç" kategorisine taşındı');
  }
  
  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category
    });
  }

  console.log('✅ Default categories created!');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });