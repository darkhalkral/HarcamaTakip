import re

# Test data
test_line = "29/03/2024 NU-ER.IZMIRTRKAZANILANMAXIPUAN: 0,02"

SKIP_KEYWORDS = ['KAZANILANMAXIPUAN', 'MAXIPUAN', 'PUANYÜKLEME', 'PUANGERİALIM']

print(f"Test satır: {test_line}")

# Parse işlemi
m = re.match(r'^(\d{2}/\d{2}/\d{4})\s*(.*)$', test_line)
if m:
    tarih, rest = m.groups()
    print(f"Tarih: {tarih}")
    print(f"Rest: {rest}")
    
    # Puan kontrolü
    is_point_only = False
    for skip_keyword in SKIP_KEYWORDS:
        if skip_keyword in rest:
            print(f"OK Puan keyword bulundu: {skip_keyword}")
            # Tutarı kontrol et
            nums = re.findall(r'-?\d{1,3}(?:\.\d{3})*,\d{2}', rest)
            print(f"Bulunan tutarlar: {nums}")
            if nums:
                amounts = [float(n.replace('.', '').replace(',', '.')) for n in nums]
                print(f"Dönüştürülmüş tutarlar: {amounts}")
                max_amount = max(abs(a) for a in amounts) if amounts else 0
                print(f"Max tutar: {max_amount}")
                if max_amount < 0.10:
                    print(f"OK {max_amount} < 0.10 oldugu icin FILTRELENMELI!")
                    is_point_only = True
                    break
                else:
                    print(f"NO {max_amount} >= 0.10 oldugu icin KORUNMALI!")
    
    print(f"Sonuç: is_point_only = {is_point_only}")
    if is_point_only:
        print("XX Bu islem filtrelenecek")
    else:
        print("OK Bu islem gececek")