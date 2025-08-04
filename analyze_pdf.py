import pdfplumber
import re

def analyze_pdf_structure():
    pdf_path = "pdfPlumber/Nisan Hesap Özeti 04_2024.pdf"
    
    print("=== PDF İçerik Analizi ===")
    
    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages):
            print(f"\nSayfa {page_num + 1}")
            
            raw_text = page.extract_text()
            lines = raw_text.split('\n')
            
            print(f"Toplam satır: {len(lines)}")
            
            # MaxiPuan içeren satırları bul
            maxipuan_lines = []
            for i, line in enumerate(lines):
                if 'MAXIPUAN' in line or 'KAZANILANMAXIPUAN' in line:
                    maxipuan_lines.append((i, line))
            
            print(f"\nMaxiPuan içeren satırlar: {len(maxipuan_lines)}")
            
            for line_num, line in maxipuan_lines:
                print(f"\nSatır {line_num}: {line}")
                
                # Bu satırdaki sayıları analiz et
                numbers = re.findall(r'-?\d{1,3}(?:\.\d{3})*,\d{2}', line)
                print(f"Bulunan sayılar: {numbers}")
                
                # Tarih pattern'i var mı?
                date_match = re.match(r'^(\d{2}/\d{2}/\d{4})', line)
                if date_match:
                    date = date_match.group(1)
                    rest = line[len(date):].strip()
                    print(f"Tarih: {date}")
                    print(f"Kalan kısım: {rest}")
                    
                    # MaxiPuan kısmını böl
                    if 'KAZANILANMAXIPUAN' in rest:
                        puan_pos = rest.find('KAZANILANMAXIPUAN')
                        before_puan = rest[:puan_pos].strip()
                        puan_part = rest[puan_pos:].strip()
                        
                        print(f"  Puan öncesi: '{before_puan}'")
                        print(f"  Puan kısmı: '{puan_part}'")
                        
                        # Her kısımdaki sayıları ayır
                        before_numbers = re.findall(r'-?\d{1,3}(?:\.\d{3})*,\d{2}', before_puan)
                        puan_numbers = re.findall(r'-?\d{1,3}(?:\.\d{3})*,\d{2}', puan_part)
                        
                        print(f"  Puan öncesi sayılar: {before_numbers}")
                        print(f"  Puan kısmı sayılar: {puan_numbers}")
                        
                        # Hangi sayı gerçek tutar?
                        if before_numbers:
                            print(f"  >>> Gerçek tutar: {before_numbers[-1]} (puan öncesi son sayı)")
                        elif puan_numbers and len(puan_numbers) > 1:
                            # Puan kısmında birden fazla sayı varsa büyük olanı al
                            amounts = [float(n.replace('.', '').replace(',', '.')) for n in puan_numbers]
                            max_amount = max(amounts)
                            max_index = amounts.index(max_amount)
                            print(f"  >>> Gerçek tutar: {puan_numbers[max_index]} (puan kısmındaki en büyük)")
                
                print("-" * 50)

if __name__ == "__main__":
    analyze_pdf_structure()