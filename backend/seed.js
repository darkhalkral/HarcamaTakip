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