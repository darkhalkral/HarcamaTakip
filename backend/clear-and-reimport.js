const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Parse month from date string (DD/MM/YYYY -> YYYY-MM)
function parseMonth(dateStr) {
  const [day, month, year] = dateStr.split('/');
  return `${year}-${month.padStart(2, '0')}`;
}

async function clearAndReimport() {
  console.log('🗑️  Mevcut expense verilerini temizleniyor...');
  
  // Clear existing expense data (keep categories)
  await prisma.expense.deleteMany({});
  console.log('✅ Tüm expense verileri silindi');

  const pdfPlumberPath = path.join(__dirname, '..', 'pdfPlumber');
  
  if (!fs.existsSync(pdfPlumberPath)) {
    console.log('❌ pdfPlumber klasörü bulunamadı');
    return;
  }

  const jsonFiles = fs.readdirSync(pdfPlumberPath).filter(file => file.endsWith('_harcamalar.json'));
  
  console.log(`📁 ${jsonFiles.length} JSON dosyası bulundu`);

  let totalImported = 0;

  for (const jsonFile of jsonFiles) {
    const filePath = path.join(pdfPlumberPath, jsonFile);
    
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      console.log(`📄 ${jsonFile} işleniyor... (${data.length} işlem)`);
      
      let importedCount = 0;
      
      for (const txn of data) {
        try {
          await prisma.expense.create({
            data: {
              date: txn.tarih,
              description: txn.aciklama,
              amount: txn.tutar,
              bank: 'isbank',
              month: parseMonth(txn.tarih)
            }
          });
          importedCount++;
        } catch (error) {
          console.error(`❌ Hata (${txn.tarih} - ${txn.aciklama}):`, error.message);
        }
      }
      
      console.log(`  ✅ ${importedCount} işlem eklendi`);
      totalImported += importedCount;
      
    } catch (error) {
      console.error(`❌ ${jsonFile} dosyası okunamadı:`, error.message);
    }
  }

  console.log(`\n🎉 Toplam ${totalImported} işlem başarıyla yeniden import edildi!`);
  
  // Show some statistics
  const expenseCount = await prisma.expense.count();
  const monthlyStats = await prisma.expense.groupBy({
    by: ['month'],
    _count: { id: true },
    orderBy: { month: 'desc' }
  });
  
  console.log(`\n📊 İstatistikler:`);
  console.log(`   Toplam işlem: ${expenseCount}`);
  console.log(`   Aylık dağılım:`);
  monthlyStats.slice(0, 5).forEach(stat => {
    console.log(`     ${stat.month}: ${stat._count.id} işlem`);
  });
}

clearAndReimport()
  .catch((e) => {
    console.error('❌ Import hatası:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });