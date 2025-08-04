import pdfplumber
import re

# Sadece debug için - puan işlemlerini inceleyelim
with pdfplumber.open('pdfPlumber/Nisan Hesap Özeti 04_2024.pdf') as pdf:
    all_lines = []
    for page in pdf.pages:
        lines = page.extract_text().split('\n')
        all_lines.extend(lines)
    
    print("=== KARATAŞ ile ilgili satırlar ===")
    for i, line in enumerate(all_lines):
        if 'KARATAŞ' in line or 'DÖNER' in line:
            print(f"{i}: {line}")
            # Bir sonraki satırı da göster
            if i+1 < len(all_lines):
                print(f"{i+1}: {all_lines[i+1]}")
            print("---")
            
    print("\n=== 30/04/2024 tarihi ile başlayan satırlar ===")
    for i, line in enumerate(all_lines):
        if line.startswith('30/04/2024'):
            print(f"{i}: {line}")
            print("---")