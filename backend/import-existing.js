const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Parse month from date string (DD/MM/YYYY -> YYYY-MM)
function parseMonth(dateStr) {
  const [day, month, year] = dateStr.split('/');
  return `${year}-${month.padStart(2, '0')}`;
}

async function importExistingData() {
  const pdfPlumberPath = path.join(__dirname, '..', 'pdfPlumber');
  
  if (!fs.existsSync(pdfPlumberPath)) {
    console.log('pdfPlumber klasörü bulunamadı');
    return;
  }

  const jsonFiles = fs.readdirSync(pdfPlumberPath).filter(file => file.endsWith('_harcamalar.json'));
  
  console.log(`${jsonFiles.length} JSON dosyası bulundu:`);
  jsonFiles.forEach(file => console.log('  -', file));

  let totalImported = 0;

  for (const jsonFile of jsonFiles) {
    const filePath = path.join(pdfPlumberPath, jsonFile);
    
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      console.log(`\n${jsonFile} işleniyor... (${data.length} işlem)`);
      
      let importedCount = 0;
      
      for (const txn of data) {
        try {
          // Check if transaction already exists (to avoid duplicates)
          const existing = await prisma.expense.findFirst({
            where: {
              date: txn.tarih,
              description: txn.aciklama,
              amount: txn.tutar,
              bank: 'isbank'
            }
          });

          if (!existing) {
            // Mapping kontrolü
            const mapping = await prisma.merchantMapping.findUnique({
              where: { description: txn.aciklama }
            });

            await prisma.expense.create({
              data: {
                date: txn.tarih,
                description: txn.aciklama,
                amount: txn.tutar,
                bank: 'isbank',
                month: parseMonth(txn.tarih),
                categoryId: mapping ? mapping.categoryId : null
              }
            });
            importedCount++;
          }
        } catch (error) {
          console.error(`Hata (${txn.tarih} - ${txn.aciklama}):`, error.message);
        }
      }
      
      console.log(`  ✅ ${importedCount} yeni işlem eklendi`);
      totalImported += importedCount;
      
    } catch (error) {
      console.error(`${jsonFile} dosyası okunamadı:`, error.message);
    }
  }

  console.log(`\n🎉 Toplam ${totalImported} işlem veritabanına aktarıldı!`);
}

importExistingData()
  .catch((e) => {
    console.error('Import hatası:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });