import pdfplumber, json, re, sys

DATE_RE   = re.compile(r'^\d{2}/\d{2}/\d{4}')
NUM_RE    = re.compile(r'-?\d{1,3}(?:\.\d{3})*,\d{2}')
SPACE_DASH_FIX = re.compile(r'-\s+(\d)')
# Taksit bilgisi pattern'i
TAKSIT_RE = re.compile(r'(\d{1,3}(?:\.\d{3})*,\d{2})\s+\d+/\d+taksidi')
# Çok büyük limit değerleri (müşteri limiti vb)
LIMIT_KEYWORDS = ['MüşteriLimiti', 'TOPLAM', 'BORÇTOPLAMI', 'Limit']
# Filtrelenecek puan işlemleri
SKIP_KEYWORDS = ['KAZANILANMAXIPUAN', 'MAXIPUAN', 'PUANYÜKLEME', 'PUANGERİALIM']

def collapse_lines(lines):
    """Aynı işleme ait birden çok satırı birleştirir."""
    merged = []
    buff = ''
    for ln in lines:
        if DATE_RE.match(ln):
            if buff:
                merged.append(buff)
            buff = ln.strip()
        else:
            buff += ' ' + ln.strip()
    if buff:
        merged.append(buff)
    return merged

def extract_txn(line):
    """Birleştirilmiş satırdan {tarih, açıklama, tutar} çıkarır."""
    line = SPACE_DASH_FIX.sub(r'-\1', line)
    
    m = re.match(r'^(\d{2}/\d{2}/\d{4})\s*(.*)$', line)
    if not m:
        return None
    tarih, rest = m.groups()
    
    # MaxiPuan içeren satırlarda akıllı tutar seçimi
    has_maxipuan = False
    for skip_keyword in SKIP_KEYWORDS:
        if skip_keyword in rest:
            has_maxipuan = True
            break
    
    # Önce taksit bilgisi var mı kontrol et
    taksit_match = TAKSIT_RE.search(rest)
    if taksit_match:
        tutar_str = taksit_match.group(1)
        tutar = float(tutar_str.replace('.', '').replace(',', '.'))
        # Açıklama = taksit bilgisinden önceki kısım
        desc_end = rest.find(tutar_str)
        aciklama = rest[:desc_end].strip()
    else:
        # Normal tutar seçimi
        nums = NUM_RE.findall(rest)
        if not nums:
            return None
        
        values = []
        valid_nums = []
        
        for num_str in nums:
            val = float(num_str.replace('.', '').replace(',', '.'))
            # Çok büyük değerleri filtrele (50000'den büyük)
            # Ayrıca limit kelimelerinin yakınındaki değerleri de filtrele
            is_limit = False
            for keyword in LIMIT_KEYWORDS:
                if keyword in rest:
                    # Bu sayının limit kelimesine yakın olup olmadığını kontrol et
                    num_pos = rest.find(num_str)
                    keyword_pos = rest.find(keyword)
                    if abs(num_pos - keyword_pos) < 50:  # 50 karakter yakınlık
                        is_limit = True
                        break
            
            if not is_limit and abs(val) < 50000:  # 50000'den küçük değerleri al
                values.append(val)
                valid_nums.append(num_str)
        
        if not values:
            return None
        
        # MaxiPuan işlemlerinde akıllı tutar seçimi
        if has_maxipuan:
            # 1 TL ve üzeri tutarları al (gerçek işlem tutarları)
            real_values = [v for v in values if abs(v) >= 1.0]
            if real_values:
                # En büyük gerçek tutarı seç
                max_val = max(real_values, key=abs)
                max_idx = values.index(max_val)
                tutar = max_val
                tutar_str = valid_nums[max_idx]
            else:
                # Hiç gerçek tutar yoksa (sadece puan varsa) işlemi atla
                return None
        else:
            # Normal işlemlerde ilk geçerli tutarı tercih et
            tutar = values[0]
            tutar_str = valid_nums[0]
        
        # Açıklama = tutarın geçtiği ilk konuma kadar olan kısım
        desc_end = rest.find(tutar_str)
        aciklama = rest[:desc_end].strip()
    
    # Açıklamayı temizle - gereksiz bilgileri kırp
    if '***' in aciklama:
        aciklama = aciklama.split('***')[0].strip()
    
    # MaxiPuan suffix'lerini temizle
    if has_maxipuan:
        for skip_keyword in SKIP_KEYWORDS:
            if skip_keyword in aciklama:
                # KAZANILANMAXIPUAN gibi suffix'leri kaldır
                aciklama = aciklama.replace(skip_keyword, '').strip()
                aciklama = aciklama.rstrip(':').strip()  # Sondaki ':' karakterini de kaldır
    
    return {
        "tarih": tarih,
        "aciklama": aciklama,
        "tutar": tutar,
        "kategori": ""
    }

def parse_pdf(pdf_path):
    """İş Bankası PDF'ini parse eder."""
    txns = []
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                raw_lines = page.extract_text().split('\n')
                for merged in collapse_lines(raw_lines):
                    txn = extract_txn(merged)
                    if txn:
                        txns.append(txn)
        return txns
    except Exception as e:
        print(f"Error parsing PDF: {e}")
        return []

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python isbank.py <pdf_path>")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    transactions = parse_pdf(pdf_path)
    print(json.dumps(transactions, ensure_ascii=False))