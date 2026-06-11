import pandas as pd
from pathlib import Path

raw_dir = Path("C:/Projects/Prediction/Pemba/data/raw")
codes = set()

for tsv_file in raw_dir.glob("elo_*.tsv"):
    try:
        df = pd.read_csv(tsv_file, sep="\t", header=None, encoding="utf-8")
        if len(df.columns) >= 5:
            codes.update(df.iloc[:, 3].dropna().astype(str).unique())
            codes.update(df.iloc[:, 4].dropna().astype(str).unique())
    except Exception as e:
        print(f"Error reading {tsv_file.name}: {e}")

print(f"Found {len(codes)} unique codes")
with open("C:/Projects/Prediction/all_codes.txt", "w", encoding="utf-8") as f:
    for code in sorted(codes):
        f.write(code + "\n")
print("Written to C:/Projects/Prediction/all_codes.txt")