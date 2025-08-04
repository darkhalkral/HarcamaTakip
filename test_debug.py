import re

test_line = "NU-ER.IZMIRTRKAZANILANMAXIPUAN:0,02 250,00 0,02"

SKIP_KEYWORDS = ['KAZANILANMAXIPUAN', 'MAXIPUAN', 'PUANYÜKLEME', 'PUANGERİALIM']

print(f"Test line: {test_line}")

for skip_keyword in SKIP_KEYWORDS:
    if skip_keyword in test_line:
        print(f"Found keyword: {skip_keyword}")
        if skip_keyword + ':' in test_line:
            print(f"Found keyword with colon")
            puan_start = test_line.find(skip_keyword)
            print(f"Puan start position: {puan_start}")
            
            if puan_start > 0:
                before_puan = test_line[:puan_start]
                puan_part = test_line[puan_start:]
                
                print(f"Before puan: '{before_puan}'")
                print(f"Puan part: '{puan_part}'")
                
                # Find numbers in each part
                before_nums = re.findall(r'-?\d{1,3}(?:\.\d{3})*,\d{2}', before_puan)
                puan_nums = re.findall(r'-?\d{1,3}(?:\.\d{3})*,\d{2}', puan_part)
                
                print(f"Before numbers: {before_nums}")
                print(f"Puan numbers: {puan_nums}")
                
                if before_nums:
                    print("HAS REAL TRANSACTION - should split!")
                    print(f"Real transaction: NU-ER.IZMIRTR -> {before_nums[0] if before_nums else 'N/A'}")
                    print(f"Point transaction: KAZANILANMAXIPUAN -> {puan_nums[0] if puan_nums else 'N/A'}")
                else:
                    print("NO REAL TRANSACTION - should filter!")
            break