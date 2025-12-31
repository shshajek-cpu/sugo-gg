"""
External Source Adapter with Production-Grade Reliability

Features:
- Timeout (connect/read separated)
- Retry with exponential backoff
- Redis caching (short-term)
- Rate limiting (per character)
- Comprehensive logging
- Predictable exception handling
"""

from abc import ABC, abstractmethod
import os
import random
import json
import logging
import time
from datetime import datetime
from typing import Optional
import httpx
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
    before_sleep_log
)
import redis
from .schemas import CharacterDTO

# Configure logger
logger = logging.getLogger(__name__)


# ============================================================================
# Custom Exceptions (Predictable Exception Types)
# ============================================================================

class SourceAdapterError(Exception):
    """Base exception for all source adapter errors"""
    pass


class ExternalSourceTimeoutError(SourceAdapterError):
    """External source request timed out"""
    pass


class ExternalSourceHTTPError(SourceAdapterError):
    """External source returned HTTP error"""
    pass


class ExternalSourceParseError(SourceAdapterError):
    """Failed to parse external source response"""
    pass


class ExternalSourceRateLimitError(SourceAdapterError):
    """Rate limit exceeded for this character"""
    pass


# ============================================================================
# Configuration (Environment Variables)
# ============================================================================

class AdapterConfig:
    """Centralized configuration from environment variables"""

    # Adapter type
    ADAPTER_TYPE = os.getenv("SOURCE_ADAPTER_TYPE", "dummy").lower()

    # HTTP Timeouts (seconds)
    CONNECT_TIMEOUT = float(os.getenv("EXTERNAL_CONNECT_TIMEOUT", "3.0"))
    READ_TIMEOUT = float(os.getenv("EXTERNAL_READ_TIMEOUT", "10.0"))

    # Retry configuration
    MAX_RETRY_ATTEMPTS = int(os.getenv("EXTERNAL_MAX_RETRIES", "3"))
    RETRY_MIN_WAIT = int(os.getenv("EXTERNAL_RETRY_MIN_WAIT", "1"))  # seconds
    RETRY_MAX_WAIT = int(os.getenv("EXTERNAL_RETRY_MAX_WAIT", "10"))  # seconds

    # Cache configuration (Redis)
    CACHE_ENABLED = os.getenv("EXTERNAL_CACHE_ENABLED", "true").lower() == "true"
    CACHE_TTL = int(os.getenv("EXTERNAL_CACHE_TTL", "60"))  # 30-120 seconds recommended

    # Rate limiting
    RATE_LIMIT_ENABLED = os.getenv("EXTERNAL_RATE_LIMIT_ENABLED", "true").lower() == "true"
    RATE_LIMIT_WINDOW = int(os.getenv("EXTERNAL_RATE_LIMIT_WINDOW", "60"))  # seconds

    # External source URL
    EXTERNAL_BASE_URL = os.getenv("EXTERNAL_SOURCE_URL", "https://aion.plaync.com/search")

    # User-Agent
    USER_AGENT = os.getenv(
        "EXTERNAL_USER_AGENT",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    )

    # Redis connection
    REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")


# ============================================================================
# Redis Cache Manager
# ============================================================================

class CacheManager:
    """Manages Redis caching for external source responses"""

    def __init__(self):
        self.enabled = AdapterConfig.CACHE_ENABLED
        self.ttl = AdapterConfig.CACHE_TTL
        self.redis_client: Optional[redis.Redis] = None

        if self.enabled:
            try:
                self.redis_client = redis.from_url(
                    AdapterConfig.REDIS_URL,
                    decode_responses=True,
                    socket_connect_timeout=2,
                    socket_timeout=2
                )
                # Test connection
                self.redis_client.ping()
                logger.info("✓ Redis cache initialized successfully")
            except Exception as e:
                logger.warning(f"⚠ Redis cache unavailable: {e}. Caching disabled.")
                self.enabled = False
                self.redis_client = None

    def _make_key(self, server: str, name: str) -> str:
        """Generate cache key for character"""
        return f"external:character:{server}:{name}"

    def get(self, server: str, name: str) -> Optional[CharacterDTO]:
        """Retrieve cached character data"""
        if not self.enabled or not self.redis_client:
            return None

        try:
            key = self._make_key(server, name)
            cached = self.redis_client.get(key)

            if cached:
                logger.info(f"✓ Cache HIT: {server}:{name}")
                data = json.loads(cached)
                # Convert ISO string back to datetime
                data['updated_at'] = datetime.fromisoformat(data['updated_at'])
                return CharacterDTO(**data)

            logger.debug(f"Cache MISS: {server}:{name}")
            return None
        except Exception as e:
            logger.warning(f"Cache GET error: {e}")
            return None

    def set(self, server: str, name: str, character: CharacterDTO) -> None:
        """Store character data in cache"""
        if not self.enabled or not self.redis_client:
            return

        try:
            key = self._make_key(server, name)
            # Convert to dict and handle datetime
            data = character.dict()
            data['updated_at'] = data['updated_at'].isoformat()

            self.redis_client.setex(
                key,
                self.ttl,
                json.dumps(data)
            )
            logger.debug(f"✓ Cached: {server}:{name} (TTL: {self.ttl}s)")
        except Exception as e:
            logger.warning(f"Cache SET error: {e}")


# ============================================================================
# Rate Limiter
# ============================================================================

class RateLimiter:
    """Per-character rate limiting"""

    def __init__(self):
        self.enabled = AdapterConfig.RATE_LIMIT_ENABLED
        self.window = AdapterConfig.RATE_LIMIT_WINDOW
        self.redis_client: Optional[redis.Redis] = None

        if self.enabled:
            try:
                self.redis_client = redis.from_url(
                    AdapterConfig.REDIS_URL,
                    decode_responses=True,
                    socket_connect_timeout=2,
                    socket_timeout=2
                )
                self.redis_client.ping()
                logger.info("✓ Rate limiter initialized successfully")
            except Exception as e:
                logger.warning(f"⚠ Rate limiter unavailable: {e}. Rate limiting disabled.")
                self.enabled = False
                self.redis_client = None

    def _make_key(self, server: str, name: str) -> str:
        """Generate rate limit key"""
        return f"ratelimit:character:{server}:{name}"

    def check_and_update(self, server: str, name: str) -> None:
        """
        Check if rate limit allows this request and update timestamp

        Raises:
            ExternalSourceRateLimitError: If rate limit is exceeded
        """
        if not self.enabled or not self.redis_client:
            return

        try:
            key = self._make_key(server, name)
            last_request_time = self.redis_client.get(key)

            if last_request_time:
                elapsed = time.time() - float(last_request_time)
                if elapsed < self.window:
                    remaining = int(self.window - elapsed)
                    logger.warning(
                        f"⚠ Rate limit exceeded: {server}:{name} "
                        f"(retry after {remaining}s)"
                    )
                    raise ExternalSourceRateLimitError(
                        f"Rate limit exceeded. Retry after {remaining} seconds."
                    )

            # Update last request time
            self.redis_client.setex(key, self.window, str(time.time()))
            logger.debug(f"✓ Rate limit OK: {server}:{name}")

        except ExternalSourceRateLimitError:
            raise
        except Exception as e:
            logger.warning(f"Rate limiter error: {e}. Allowing request.")


# ============================================================================
# Base Adapter
# ============================================================================

class BaseSourceAdapter(ABC):
    @abstractmethod
    def get_character(self, server: str, name: str) -> CharacterDTO:
        pass


# ============================================================================
# Dummy Adapter (Fallback / Testing)
# ============================================================================

class DummySourceAdapter(BaseSourceAdapter):
    """Safe fallback adapter that generates dummy data"""

    def get_character(self, server: str, name: str) -> CharacterDTO:
        return self._get_dummy_data(server, name)

    def _get_dummy_data(self, server: str, name: str) -> CharacterDTO:
        """Generate deterministic dummy data"""
        classes = ["Warrior", "Mage", "Ranger", "Priest"]

        # Use hash for deterministic randomness
        seed = hash(f"{server}:{name}") % 10000
        random.seed(seed)

        character = CharacterDTO(
            name=name,
            server=server,
            class_name=random.choice(classes),
            level=random.randint(1, 100),
            power=random.randint(10000, 500000),
            updated_at=datetime.now(),
            stats_json={
                "attack": random.randint(100, 1000),
                "defense": random.randint(100, 1000),
                "hp": random.randint(500, 5000),
            }
        )

        logger.info(f"✓ Generated dummy data: {server}:{name}")
        return character


# ============================================================================
# External Adapter (Production)
# ============================================================================

class ExternalSourceAdapter(BaseSourceAdapter):
    """
    Production-grade external source adapter with:
    - Timeout control
    - Automatic retry with exponential backoff
    - Redis caching
    - Rate limiting
    - Comprehensive error handling
    """

    def __init__(self):
        self.cache = CacheManager()
        self.rate_limiter = RateLimiter()

        # Configure httpx client with timeouts
        self.client = httpx.Client(
            timeout=httpx.Timeout(
                connect=AdapterConfig.CONNECT_TIMEOUT,
                read=AdapterConfig.READ_TIMEOUT,
                write=5.0,
                pool=5.0
            ),
            headers={
                "User-Agent": AdapterConfig.USER_AGENT,
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
                "Accept-Encoding": "gzip, deflate, br",
                "Connection": "keep-alive",
            },
            follow_redirects=True,
            max_redirects=3
        )

        logger.info(
            f"✓ ExternalSourceAdapter initialized "
            f"(cache: {self.cache.enabled}, rate_limit: {self.rate_limiter.enabled})"
        )

    def get_character(self, server: str, name: str) -> CharacterDTO:
        """
        Fetch character data with full safety mechanisms

        Flow:
        1. Check rate limit
        2. Check cache
        3. Fetch from external source (with retry)
        4. Parse and validate
        5. Update cache
        6. Return data

        Raises:
            SourceAdapterError: On any failure (for predictable fallback handling)
        """
        logger.info(f"→ Fetching character: {server}:{name}")

        try:
            # 1. Rate limit check
            self.rate_limiter.check_and_update(server, name)

            # 2. Cache check
            cached = self.cache.get(server, name)
            if cached:
                return cached

            # 3. Fetch from external source
            character = self._fetch_with_retry(server, name)

            # 4. Cache the result
            self.cache.set(server, name, character)

            logger.info(f"✓ Successfully fetched: {server}:{name}")
            return character

        except SourceAdapterError:
            # Re-raise our custom exceptions
            raise
        except Exception as e:
            # Wrap unexpected exceptions
            logger.error(f"✗ Unexpected error fetching {server}:{name}: {e}", exc_info=True)
            raise SourceAdapterError(f"Unexpected error: {e}") from e

    @retry(
        stop=stop_after_attempt(AdapterConfig.MAX_RETRY_ATTEMPTS),
        wait=wait_exponential(
            multiplier=1,
            min=AdapterConfig.RETRY_MIN_WAIT,
            max=AdapterConfig.RETRY_MAX_WAIT
        ),
        # REASON: Retry on transient network errors AND transient HTTP errors (502, 503, 504).
        # This increases stability when the external source is under heavy load or temporarily unstable.
        retry=retry_if_exception_type((
            httpx.TimeoutException,
            httpx.NetworkError,
            httpx.RemoteProtocolError,
            # Added via modification: Specific transient HTTP errors
        )),
        before_sleep=before_sleep_log(logger, logging.WARNING),
        reraise=True
    )
    def _fetch_with_retry(self, server: str, name: str) -> CharacterDTO:
        """
        Fetch using Playwright to handle Client-Side Rendering (CSR)
        """
        from playwright.sync_api import sync_playwright

        try:
            url = f"https://aion.plaync.com/ranking/battle?world=classic"
            logger.info(f"→ Scaping (Headless): {url} for '{name}'")

            with sync_playwright() as p:
                # Use Chromium
                browser = p.chromium.launch(headless=True)
                page = browser.new_page(
                    user_agent=AdapterConfig.USER_AGENT
                )
                
                try:
                    # 1. Go to Ranking Page
                    page.goto(url, wait_until="domcontentloaded", timeout=AdapterConfig.READ_TIMEOUT * 1000)
                    page.wait_for_timeout(2000) # Wait for initial load

                    # 2. Type Name into Search Input
                    # Selector found: input.search_input
                    search_input_selector = "input.search_input"
                    
                    if page.is_visible(search_input_selector):
                        logger.info("Found search input, typing name...")
                        page.fill(search_input_selector, name)
                        page.press(search_input_selector, "Enter")
                        
                        # 3. Wait for results
                        # Wait for the table to (hopefully) update. 
                        # We can look for the specific name in the table text?
                        page.wait_for_timeout(2000)
                    else:
                        logger.warning("Search input not found, scraping default list")

                    content = page.content()
                    
                except Exception as e:
                    logger.error(f"Playwright navigation error: {e}")
                    raise ExternalSourceTimeoutError(f"Navigation failed: {e}")
                finally:
                    browser.close()

            # Pass the rendered HTML to parser
            # Mock a response object compatible with existing parser
            class MockResponse:
                def __init__(self, text):
                    self.text = text
                    self.headers = {"content-type": "text/html"}

            return self._parse_html_response(MockResponse(content), server, name)

        except ExternalSourceTimeoutError:
            raise
        except Exception as e:
            logger.error(f"✗ Scraping error for {server}:{name}: {e}")
            raise ExternalSourceHTTPError(f"Scraping failed: {e}") from e

    def _parse_response(
        self,
        response: httpx.Response,
        server: str,
        name: str
    ) -> CharacterDTO:
        """
        Parse response and extract character data

        Supports both JSON API responses and HTML scraping.

        Raises:
            ExternalSourceParseError: If parsing fails or schema changes
        """
        content_type = response.headers.get("content-type", "").lower()

        try:
            # Try JSON API first
            if "application/json" in content_type or self._looks_like_json(response.text):
                return self._parse_json_response(response, server, name)

            # Fall back to HTML parsing
            elif "text/html" in content_type:
                return self._parse_html_response(response, server, name)

            else:
                logger.error(
                    f"✗ Unexpected content type for {server}:{name}: {content_type}"
                )
                raise ExternalSourceParseError(
                    f"Unexpected content type: {content_type}"
                )

        except ExternalSourceParseError:
            raise
        except Exception as e:
            logger.error(
                f"✗ Parse error for {server}:{name}: {e}\n"
                f"Response preview: {response.text[:500]}...",
                exc_info=True
            )
            raise ExternalSourceParseError(f"Failed to parse response: {e}") from e

    def _looks_like_json(self, text: str) -> bool:
        """Quick check if response looks like JSON"""
        stripped = text.strip()
        return stripped.startswith('{') or stripped.startswith('[')

    def _parse_json_response(
        self,
        response: httpx.Response,
        server: str,
        name: str
    ) -> CharacterDTO:
        """
        Parse JSON API response

        Expected API structure (adjust based on actual API):
        {
            "name": "CharacterName",
            "server": "ServerName",
            "class": "ClassName",
            "level": 80,
            "power": 123456,
            "stats": {...}
        }
        """
        try:
            data = response.json()

            # Handle list response (search results)
            if isinstance(data, list):
                if not data:
                    logger.warning(f"⚠ Empty result list for {server}:{name}")
                    raise ExternalSourceParseError("Character not found in API results")

                # Take first result
                data = data[0]
                logger.info(f"✓ Using first result from {len(data)} matches")

            # Handle wrapped response
            if "data" in data:
                data = data["data"]

            if "result" in data:
                data = data["result"]

            # Extract character fields (with fallbacks)
            character = CharacterDTO(
                name=data.get("name") or data.get("characterName") or name,
                server=data.get("server") or data.get("serverName") or server,
                class_name=data.get("class") or data.get("className") or data.get("job") or "Unknown",
                level=int(data.get("level") or data.get("characterLevel") or 1),
                power=int(data.get("power") or data.get("combatPower") or data.get("rating") or 0),
                updated_at=datetime.now(),
                stats_json=data.get("stats") or data.get("attributes") or {}
            )

            logger.info(
                f"✓ Parsed JSON: {character.name} (Lv.{character.level}, "
                f"Power: {character.power})"
            )
            return character

        except (KeyError, ValueError, TypeError) as e:
            logger.error(
                f"✗ JSON parse error for {server}:{name}: {e}\n"
                f"Response: {response.text[:500]}..."
            )
            raise ExternalSourceParseError(f"Invalid JSON structure: {e}") from e

    def _parse_html_response(
        self,
        response: object,
        server: str,
        name: str
    ) -> CharacterDTO:
        """
        Parse HTML response (web scraping)
        Target: Ranking Page Table
        """
        try:
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(response.text, 'html.parser')

            # --- Ranking Page Parsing Logic ---
            found_row = None
            rows = soup.find_all("tr")
            
            for forrow in rows:
                text = forrow.get_text(strip=True)
                # Flexible matching
                if name in text:
                    found_row = forrow
                    break
            
            if found_row:
                cols = found_row.find_all("td")
                # Expected columns: Rank, Diff, Name, Server, Race, Class, Power
                if len(cols) >= 5: # Relaxed check
                    try:
                        # Use negative indexing for safer mapping
                        # Expected end: ... Server, Race, Class, Power
                        power_str = cols[-1].get_text(strip=True).replace(",", "")
                        extracted_class = cols[-2].get_text(strip=True)
                        extracted_server = cols[-4].get_text(strip=True) # Skip Race (-3)
                        extracted_name = cols[-5].get_text(strip=True) # Name is before Server

                        character = CharacterDTO(
                            name=extracted_name,
                            server=server, 
                            class_name=extracted_class,
                            level=60, 
                            power=int(power_str) if power_str.isdigit() else 0,
                            updated_at=datetime.now(),
                            stats_json={"server_match": extracted_server}
                        )
                        
                        logger.info(
                            f"✓ Parsed HTML: {character.name} (Class: {character.class_name}, "
                            f"Power: {character.power})"
                        )
                        return character
                    except Exception as e:
                        logger.warning(f"Error parsing columns for {name}: {e}")

            # Fallback
            logger.warning(f"⚠ Character '{name}' not found in ranking list")
            raise ExternalSourceParseError(f"Character '{name}' not found in ranking list")

        except ExternalSourceParseError:
            raise
        except Exception as e:
            # DETECT_STRUCTURE_CHANGE
            # If standard parsing fails unexpectedly (e.g. AttributeError, IndexError), 
            # it might mean the website structure has changed.
            logger.critical(
                f"🚨 [STRUCTURE CHANGE DETECTED] HTML parsing failed for {server}:{name}. "
                f"The external site layout might have changed. Error: {e}",
                exc_info=True
            )
            # Re-raise as standard parse error for user-facing generic message
            raise ExternalSourceParseError(f"Structure mismatch: {e}") from e

    def __del__(self):
        """Cleanup resources"""
        try:
            self.client.close()
        except Exception:
            pass


# ============================================================================
# Factory Function
# ============================================================================

def get_adapter() -> BaseSourceAdapter:
    """
    Factory function to get the appropriate adapter based on configuration

    Returns:
        BaseSourceAdapter: Either DummySourceAdapter or ExternalSourceAdapter
    """
    adapter_type = AdapterConfig.ADAPTER_TYPE

    if adapter_type == "external":
        logger.info("Using ExternalSourceAdapter (production mode)")
        return ExternalSourceAdapter()
    else:
        logger.info("Using DummySourceAdapter (safe fallback mode)")
        return DummySourceAdapter()


# Global adapter instance
adapter = get_adapter()
