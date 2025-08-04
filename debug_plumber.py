import pdfplumber
from pdfPlumber.plumber import collapse_lines, extract_txn

# Debug one PDF
pdf_path = "pdfPlumber/Nisan Hesap Özeti 04_2024.pdf" 

print("=== PDF Debug ===")
txns = []
with pdfplumber.open(pdf_path) as pdf:
    for page_num, page in enumerate(pdf.pages):
        raw_lines = page.extract_text().split('\n')
        print(f"\nPage {page_num + 1} - Raw lines: {len(raw_lines)}")
        
        merged_lines = collapse_lines(raw_lines)
        print(f"Merged lines: {len(merged_lines)}")
        
        for i, merged in enumerate(merged_lines):
            if 'MAXIPUAN' in merged and '0,02' in merged:
                print(f"\nLine {i}: {merged}")
                txn = extract_txn(merged)
                print(f"Extract result: {txn}")
                if txn:
                    txns.append(txn)
                    print("-> ADDED TO RESULTS!")
                else:
                    print("-> FILTERED OUT!")

print(f"\n=== Final Results ===")
print(f"Total transactions: {len(txns)}")
for txn in txns:
    if 'MAXIPUAN' in txn.get('aciklama', ''):
        print(f"MAXIPUAN found: {txn}")