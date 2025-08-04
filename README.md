# Harcama Takip Uygulaması

Web tabanlı kişisel harcama takip uygulaması. Banka ekstrelerini yükleyerek harcamalarınızı kategorilere ayırabilir ve aylık raporlar alabilirsiniz.

## Özellikler

- 📄 PDF ekstre yükleme (İş Bankası, Garanti, Ziraat)
- 📊 Otomatik harcama parse'lama
- 🏷️ Kategori yönetimi (Yemek, Eğlence, Araba, vb.)
- 📈 Aylık harcama raporları
- 💰 Kategori bazlı özetler
- 🎯 Dashboard ile görsel analiz

## Kurulum

### Backend
```bash
cd backend
npm install
npm start  # Port 3000'de çalışır
```

### Frontend
```bash
cd frontend
npm install
ng serve  # Port 4200'de çalışır
```

## Kullanım

1. **Backend'i başlat:** `http://localhost:3000`
2. **Frontend'i aç:** `http://localhost:4200`
3. **Ekstre Yükle:** PDF dosyasını ve bankayı seç
4. **Kategorilere Ata:** Harcamaları manuel olarak kategorilere ata
5. **Raporları Gör:** Dashboard'da aylık özetleri incele

## Veritabanı

SQLite kullanılır. İlk çalıştırmada otomatik oluşturulur:
- `backend/prisma/dev.db`

Default kategoriler otomatik eklenir:
- Yemek, Eğlence, Araba, Elektronik, Faiz, Market, Kıyafet, Sağlık, Ulaşım, Diğer

## Desteklenen Bankalar

- ✅ İş Bankası
- 🚧 Garanti Bankası (yapılacak)
- 🚧 Ziraat Bankası (yapılacak)

## Teknik Stack

- **Backend:** Node.js, Express.js, Prisma, SQLite
- **Frontend:** Angular 18+, TypeScript
- **Parser:** Python (pdfplumber)

## Mevcut Veri Import

Mevcut JSON verilerini import etmek için:
```bash
cd backend
node import-existing.js
```