import pdfplumber
import re

def find_internetdownl_raw():
    pdf_path = "pdfPlumber/Mayıs Hesap Özeti 05_2024.pdf"
    
    print("=== Raw PDF Text Search ===")
    
    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages):
            raw_text = page.extract_text()
            lines = raw_text.split('\n')
            
            for i, line in enumerate(lines):
                if 'INTERNETDOWNL' in line or 'MANAGER' in line:
                    print(f"\nPage {page_num + 1}, Line {i}: {line}")
                    
                    # Show surrounding lines for context
                    print("Context:")
                    start = max(0, i-2)
                    end = min(len(lines), i+3)
                    for j in range(start, end):
                        marker = ">>> " if j == i else "    "
                        print(f"{marker}Line {j}: {lines[j]}")

if __name__ == "__main__":
    find_internetdownl_raw()