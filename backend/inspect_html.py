
from playwright.sync_api import sync_playwright
import logging

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("inspector")

def inspect_html():
    url = "https://aion.plaync.com/ranking/battle?world=classic"
    
    try:
        logger.info(f"Navigating to {url}...")
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            page.goto(url, wait_until="networkidle")
            
            # Wait a bit for React/Next.js to hydrate
            page.wait_for_timeout(3000)
            
            html = page.content()
            print(f"Total Length: {len(html)}")
            
            # Save to file for grep support
            with open("rendered_debug.html", "w", encoding="utf-8") as f:
                f.write(html)
            
            print("Saved rendered_debug.html")
            
            browser.close()

    except Exception as e:
        logger.error(f"Fetch failed: {e}")

if __name__ == "__main__":
    inspect_html()
