import re

NUM_RE = re.compile(r'-?\d{1,3}(?:\.\d{3})*,\d{2}')
SKIP_KEYWORDS = ['KAZANILANMAXIPUAN', 'MAXIPUAN', 'PUANYÜKLEME', 'PUANGERİALIM']
LIMIT_KEYWORDS = ['MüşteriLimiti', 'TOPLAM', 'BORÇTOPLAMI', 'Limit']

# Test için problematic satır
test_line = "29/04/2024 INTERNETDOWNLMANAGERABUDHABIAEKAZANILANMAXİPUAN:0,03"

m = re.match(r'^(\d{2}/\d{2}/\d{4})\s*(.*)$', test_line)
if m:
    tarih, rest = m.groups()
    print(f"Tarih: {tarih}")
    print(f"Rest: {rest}")
    
    # MaxiPuan check
    has_maxipuan = False
    for skip_keyword in SKIP_KEYWORDS:
        if skip_keyword in rest:
            has_maxipuan = True
            print(f"MaxiPuan detected: {skip_keyword}")
            break
    
    # Find numbers
    nums = NUM_RE.findall(rest)
    print(f"Found numbers: {nums}")
    
    values = []
    valid_nums = []
    
    for num_str in nums:
        val = float(num_str.replace('.', '').replace(',', '.'))
        print(f"Processing number: {num_str} -> {val}")
        
        # Check limit filter
        is_limit = False
        for keyword in LIMIT_KEYWORDS:
            if keyword in rest:
                num_pos = rest.find(num_str)
                keyword_pos = rest.find(keyword)
                distance = abs(num_pos - keyword_pos)
                print(f"  Limit keyword '{keyword}' found, distance: {distance}")
                if distance < 50:
                    is_limit = True
                    print(f"  -> Filtered as limit value")
                    break
        
        if not is_limit and abs(val) < 50000:
            values.append(val)
            valid_nums.append(num_str)
            print(f"  -> Added to valid values")
        else:
            print(f"  -> Filtered out (is_limit={is_limit}, val={val})")
    
    print(f"Valid values: {values}")
    print(f"Valid nums: {valid_nums}")
    
    if has_maxipuan and values:
        real_values = [v for v in values if abs(v) >= 1.0]
        print(f"Real values (>= 1.0): {real_values}")
        if real_values:
            max_val = max(real_values, key=abs)
            print(f"Selected amount: {max_val}")
        else:
            print("No real values found, transaction would be skipped")
    elif values:
        print(f"Normal transaction, would select: {values[0]}")