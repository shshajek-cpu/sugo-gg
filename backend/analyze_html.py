
from bs4 import BeautifulSoup
import sys

# Set stdout encoding to utf-8
sys.stdout.reconfigure(encoding='utf-8')

with open("rendered_debug.html", "r", encoding="utf-8") as f:
    html = f.read()

soup = BeautifulSoup(html, "html.parser")

print(f"Page Title: {soup.title.string if soup.title else 'No Title'}")

# Print text content (truncated)
text = soup.get_text(separator="\n", strip=True)
print("\n--- Text Content Sample (First 200 lines) ---")
print("\n".join(text.splitlines()[:200]))

# Print all inputs
print("\n--- Inputs found ---")
for inp in soup.find_all("input"):
    print(f"Input: {inp.attrs}")

# Print potential list items (Ranking rows)
print("\n--- Ranking List Candidates ---")
# Look for list items that might contain character info
for li in soup.find_all("li"):
    classes = li.get("class", [])
    text = li.get_text(strip=True)[:50]
    if len(text) > 0 and ("검성" in text or "시엘" in text or "1" in text):
        print(f"LI Class: {classes}, Text: {text}")

for tr in soup.find_all("tr"):
    classes = tr.get("class", [])
    print(f"TR Class: {classes}")
