import pdfplumber, json, re, sys

# ────────────────────────────  REGEX TANIMLARI ──────────────────────────────── #
DATE_RE  = re.compile(r'^\d{2}/\d{2}/\d{4}')
NUM_RE   = re.compile(r'-?\d{1,3}(?:[.,]\d{3})*[.,]\d{2}')    # 1.234,56  | 1,234.56
TAKSIT_RE= re.compile(r'(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})\s+\d+/\d+taksidi')

TRIM_KEYS   = ['MAXIPUAN', 'MAXİPUAN', 'MAXIPUANILAVE', 'PUANYÜKLEME',
               'PUANGERİALIM', 'KAZANILAN']
LIMIT_WORDS = ['Müşteri', 'TOPLAM', 'Limit', 'BORÇTOPLAMI']

# ────────────────────────────  YARDIMCI FONKSİYONLAR ────────────────────────── #
def parse_number(s: str) -> float:
    """Farklı binlik/ondalık ayırıcı kombinasyonlarını tek tipe çevirir.
    Örnekler:
      '1.234,56' → 1234.56
      '1,234.56' → 1234.56
      '0.014.99' → 14.99
      '-32,00'   → -32.0
    """
    s = s.strip()
    if not s:
        raise ValueError("Boş sayı dizesi")

    sign = -1 if s.startswith('-') else 1
    if s[0] in '+-':
        s = s[1:]

    last_dot   = s.rfind('.')
    last_comma = s.rfind(',')
    dec_pos = max(last_dot, last_comma)

    if dec_pos == -1:
        cleaned = s.replace('.', '').replace(',', '')
        return sign * float(cleaned)

    int_part = s[:dec_pos]
    frac_part = s[dec_pos + 1:]

    int_part = int_part.replace('.', '').replace(',', '')

    cleaned = int_part + '.' + frac_part
    return sign * float(cleaned)

def collapse_lines(lines):
    buff, merged = '', []
    for ln in lines:
        if DATE_RE.match(ln):
            if buff: merged.append(buff)
            buff = ln.strip()
        else:
            buff += ' ' + ln.strip()
    if buff: merged.append(buff)
    return merged

# ────────────────────────────  ANA ÇÖZÜMLEYİCİ ─────────────────────────────── #
def extract_txn(line):
    m = re.match(r'^(\d{2}/\d{2}/\d{4})\s*(.*)$', line)
    if not m:
        return None
    tarih, rest = m.groups()

    # 1️⃣ TAKSİTLİ iŞLEMLER
    m_taksit = TAKSIT_RE.search(rest)
    if m_taksit:
        tutar   = parse_number(m_taksit.group(1))
        aciklama= rest[:rest.find(m_taksit.group(1))].strip()
        return {"tarih": tarih, "aciklama": aciklama, "tutar": tutar, "kategori": ""}

    # 2️⃣ NORMAL / MAXİPUAN KARIŞIK SATIRLAR
    nums     = NUM_RE.findall(rest)
    if not nums:
        return None

    # Limit-bilgisi vb. çok büyük sayıları ayıkla
    valid = []
    for n in nums:
        v = parse_number(n)
        num_pos = rest.find(n)
        # 'Müşteri Limiti', 'TOPLAM' vb. kelimeler eğer numaradan ÖNCE ve 40 karakter içinde ise bu sayıyı atla
        too_close = False
        for k in LIMIT_WORDS:
            kw_pos = rest.find(k)
            if kw_pos != -1 and kw_pos < num_pos and (num_pos - kw_pos) < 40:
                too_close = True
                break
        if too_close:
            continue
        valid.append((v, n))

    if not valid:
        return None

    # MAXİPUAN satırı mı?
    is_mp = any(k in rest for k in TRIM_KEYS)

    if is_mp:
        # 1 TL altındaki tutarları (0,02) ele
        real = [(v, n) for v, n in valid if abs(v) >= 1.0]
        if not real:          # sadece puan varsa kaydetme
            return None
        tutar, num_str = max(real, key=lambda x: abs(x[0]))
        cut_pos        = min((rest.find(k) for k in TRIM_KEYS if k in rest))
        aciklama       = rest[:cut_pos].strip()
    else:
        tutar, num_str = valid[0]
        aciklama       = rest[:rest.find(num_str)].strip()

    return {"tarih": tarih, "aciklama": aciklama, "tutar": tutar, "kategori": ""}

def parse_pdf(path):
    txns = []
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            lines = page.extract_text().split('\n')
            for merged in collapse_lines(lines):
                t = extract_txn(merged)
                if t: txns.append(t)
    return txns

# ----------------------------------------------------------------------------- #
if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Kullanım: python isbank.py <pdf>")
        sys.exit(1)
    print(json.dumps(parse_pdf(sys.argv[1]), ensure_ascii=False, indent=2))
