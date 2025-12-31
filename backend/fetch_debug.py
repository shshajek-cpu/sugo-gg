
import httpx

url = "https://aion.plaync.com/search?server=Siel&keyword=Test"
headers = {"User-Agent": "Mozilla/5.0"}

try:
    resp = httpx.get(url, headers=headers, follow_redirects=True)
    with open("debug_aion.html", "w", encoding="utf-8") as f:
        f.write(resp.text)
    print("Saved debug_aion.html")
except Exception as e:
    print(f"Failed: {e}")
