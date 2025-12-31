# AION Data Integration Research

## official API Status
- **Result**: No public Open API found specifically for AION Classic/2 character data.
- **Reference**: NCSoft 'PLAYNC DEVELOPERS' exists for L2M, but AION coverage is unclear/limited.
- **Community**: Most fan sites (AionUsers, etc.) rely on web scraping from `aion.plaync.com`.

## Integration Strategy
1.  **Primary (Ideal)**: PLAYNC Open API (if released).
2.  **Secondary (Realistic)**: Web Scraping (`requests` / `httpx`) of official Ranking/Search pages.
3.  **Risk**:
    -   **IP Ban**: High risk if aggressive.
    -   **DOM Change**: High maintenance cost.
    -   **Legal**: Terms of Service compliance check needed.

## Implementation Path
-   Implement `ExternalSourceAdapter` using `httpx`.
-   Use a "Draft" URL structure (e.g., pointing to a placeholder or a likely legitimate scraping target `https://aion.plaync.com/...`).
-   **Critical**: Wrap in strict fallback logic. If scraping fails (403/429/5xx), fail over to DB (stale) or Dummy (dev).
